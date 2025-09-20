/**
 * Gemini API Proxy Manager
 * Provides reliable, retry-enabled access to Gemini API with rate limiting
 * Solves the "Gemini API always not working" problem
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

export interface TaskRequest {
  type: 'text' | 'embedding' | 'flash' | 'preview';
  complexity: 'simple' | 'medium' | 'complex';
  priority: 'low' | 'normal' | 'high';
  estimatedTokens?: number;
  requiresStructuredOutput?: boolean;
}

export interface GeminiResponse {
  text: string;
  metadata?: {
    model: string;
    tokensUsed: number;
    success: boolean;
  };
}

export interface RateLimitStatus {
  requestCount: number;
  tokenCount: number;
  resetTime: number;
}

export class GeminiProxyManager {
  private supabase;
  private rateLimits = new Map<string, RateLimitStatus>();
  private maxRetries: number;
  private baseBackoffMs: number;
  
  // Gemini model configurations with your existing setup
  private models = {
    'gemini-2.5-pro': { rpm: 2, tpm: 250000, costTier: 'high' },
    'gemini-2.5-flash': { rpm: 10, tpm: 250000, costTier: 'medium' },
    'gemini-2.0-flash-lite': { rpm: 15, tpm: 1000000, costTier: 'low' },
    'gemini-2.0-flash': { rpm: 15, tpm: 1000000, costTier: 'medium' },
    'text-embedding-004': { rpm: 100, tpm: 30000, costTier: 'low' }
  };

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS || '3');
    this.baseBackoffMs = parseInt(process.env.RETRY_BACKOFF_MS || '1000');
  }

  /**
   * Main method: Make reliable Gemini API request with smart retry logic
   */
    async makeReliableRequest(task: TaskRequest, prompt: string): Promise<GeminiResponse> {
    try {
      // Select optimal model for the task
      const modelId = this.selectOptimalModel(task);
      console.log(`🎯 Selected model: ${modelId} for task: ${task}`);

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          // Enforce rate limiting before the call
          await this.enforceRateLimit(modelId);

          // Make the API call
          const response = await this.callGeminiAPI(modelId, prompt, task);
          
          // Log successful call
          await this.logAPICall(modelId, prompt, response, true);
          
          console.log(`✅ Gemini API call succeeded on attempt ${attempt}`);
          return response;

        } catch (error) {
          lastError = error as Error;
          console.warn(`🔄 Attempt ${attempt}/${this.maxRetries} failed:`, (error as Error).message);
          
          // Log failed call
          await this.logAPICall(modelId, prompt, null, false, (error as Error).message);

          if (attempt < this.maxRetries) {
            // Exponential backoff: 2^attempt seconds
            const delayMs = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Waiting ${delayMs}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      // If all retries failed, try one fallback model
      try {
        const fallbackModel = this.selectOptimalModel({ ...task, priority: 'low' }); // Use same method as fallback
        if (fallbackModel !== modelId) {
          console.log(`🔄 Trying fallback model: ${fallbackModel}`);
          await this.enforceRateLimit(fallbackModel);
          const response = await this.callGeminiAPI(fallbackModel, prompt, task);
          await this.logAPICall(fallbackModel, prompt, response, true);
          return response;
        }
      } catch (fallbackError) {
        console.warn('❌ Fallback model also failed:', fallbackError);
      }

      // All attempts failed
      throw new Error(`Gemini API failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
    } catch (error) {
      console.error('🚨 Fatal error in makeReliableRequest:', error);
      throw error;
    }
  }

  /**
   * Select optimal model based on task requirements (from your existing logic)
   */
  private selectOptimalModel(task: TaskRequest): string {
    switch (task.type) {
      case 'embedding':
        return 'text-embedding-004';
        
      case 'text':
        if (task.complexity === 'simple' && !task.requiresStructuredOutput) {
          return 'gemini-2.0-flash-lite'; // Fastest, cheapest
        } else if (task.complexity === 'medium' || task.requiresStructuredOutput) {
          return 'gemini-2.5-flash'; // Balanced
        } else {
          return 'gemini-2.5-pro'; // Complex analysis
        }
        
      case 'flash':
        return task.complexity === 'simple' ? 'gemini-2.0-flash-lite' : 'gemini-2.0-flash';
        
      default:
        return 'gemini-2.0-flash'; // Safe default
    }
  }

  /**
   * Enforce rate limits to prevent API exhaustion
   */
  private async enforceRateLimit(modelId: string): Promise<void> {
    const model = this.models[modelId as keyof typeof this.models];
    if (!model) return;

    const now = Date.now();
    let status = this.rateLimits.get(modelId);

    if (!status || now >= status.resetTime) {
      // Reset or initialize rate limit tracking
      status = {
        requestCount: 0,
        tokenCount: 0,
        resetTime: now + 60000 // Reset in 1 minute
      };
      this.rateLimits.set(modelId, status);
    }

    // Check if we're at the limit
    if (status.requestCount >= model.rpm) {
      const waitMs = status.resetTime - now;
      console.log(`⏳ Rate limit reached for ${modelId}, waiting ${waitMs}ms...`);
      await this.sleep(waitMs);
      return this.enforceRateLimit(modelId); // Retry after wait
    }

    // Update request count
    status.requestCount++;
  }

  /**
   * Make actual API call to Gemini
   */
  private async callGeminiAPI(modelId: string, prompt: string, task: TaskRequest): Promise<GeminiResponse> {
    const url = `${process.env.GEMINI_BASE_URL}/models/${modelId}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: task.requiresStructuredOutput ? 0.1 : 0.7,
        maxOutputTokens: task.estimatedTokens || 1000,
        topP: 0.8,
        topK: 10
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No text response from Gemini API');
    }

    return {
      text,
      metadata: {
        model: modelId,
        tokensUsed: this.estimateTokens(prompt + text),
        success: true
      }
    };
  }

  /**
   * Log API calls for monitoring and debugging
   */
  private async logAPICall(
    modelId: string, 
    prompt: string, 
    response: GeminiResponse | null, 
    success: boolean, 
    errorMessage?: string
  ): Promise<void> {
    if (process.env.ENABLE_AI_AUDIT_LOGS !== 'true') return;

    try {
      await this.supabase.from('ai_audit_logs').insert({
        operation_type: 'gemini_api_call',
        input_data: { model: modelId, prompt: prompt.substring(0, 500) },
        output_data: response ? { text: response.text.substring(0, 500) } : null,
        model_used: modelId,
        tokens_used: response?.metadata?.tokensUsed || 0,
        success,
        error_message: errorMessage
      });
    } catch (error) {
      console.warn('Failed to log API call:', error);
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableStatuses = [429, 500, 502, 503, 504];
    const retryableMessages = ['timeout', 'network', 'connection', 'quota'];
    
    // Check HTTP status codes
    if (error.message.includes('HTTP')) {
      const statusMatch = error.message.match(/HTTP (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        return retryableStatuses.includes(status);
      }
    }
    
    // Check error messages
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  /**
   * Calculate backoff time for retries
   */
  private calculateBackoff(attempt: number, error: any): number {
    // Exponential backoff with jitter
    const baseDelay = this.baseBackoffMs * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    
    // Special handling for rate limit errors
    if (error.message.includes('429')) {
      return baseDelay * 2; // Longer wait for rate limits
    }
    
    return baseDelay + jitter;
  }

  /**
   * Helper methods
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Rough estimation
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status for monitoring
   */
  public getRateLimitStatus(): Record<string, RateLimitStatus> {
    const status: Record<string, RateLimitStatus> = {};
    for (const [model, limits] of this.rateLimits.entries()) {
      status[model] = { ...limits };
    }
    return status;
  }
}