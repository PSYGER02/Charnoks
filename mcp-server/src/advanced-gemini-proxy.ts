/**
 * Advanced Gemini Proxy with Gen AI SDK Integration
 * Production-ready implementation with streaming, safety, and advanced features
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

export interface GeminiConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  streaming?: boolean;
  safetyThreshold?: 'low' | 'medium' | 'high';
}

export interface GeminiResponse {
  text: string;
  model: string;
  success: boolean;
  metadata: {
    tokensUsed?: number;
    processingTime: number;
    requestId: string;
    safetyRatings?: any[];
    finishReason?: string;
  };
}

export interface ModelCapabilities {
  maxTokens: number;
  rateLimit: { rpm: number; tpm: number };
  costTier: 'low' | 'medium' | 'high';
  features: string[];
  bestFor: string[];
}

export class AdvancedGeminiProxy {
  private genAI: GoogleGenerativeAI;
  private supabase;
  private models: Map<string, ModelCapabilities> = new Map();
  private rateLimitCache = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.initializeModels();
  }

  private initializeModels() {
    this.models = new Map([
      ['gemini-2.0-flash-exp', {
        maxTokens: 8192,
        rateLimit: { rpm: 15, tpm: 1000000 },
        costTier: 'medium',
        features: ['text', 'code', 'multimodal', 'fast'],
        bestFor: ['general', 'coding', 'analysis']
      }],
      ['gemini-2.0-flash-thinking-exp', {
        maxTokens: 32768,
        rateLimit: { rpm: 15, tpm: 1000000 },
        costTier: 'high',
        features: ['reasoning', 'complex-analysis', 'step-by-step'],
        bestFor: ['complex-reasoning', 'detailed-analysis', 'problem-solving']
      }],
      ['gemini-1.5-pro', {
        maxTokens: 8192,
        rateLimit: { rpm: 5, tpm: 300000 },
        costTier: 'high',
        features: ['text', 'code', 'long-context', 'multimodal'],
        bestFor: ['complex-tasks', 'long-documents', 'detailed-analysis']
      }],
      ['gemini-1.5-flash', {
        maxTokens: 8192,
        rateLimit: { rpm: 15, tpm: 1000000 },
        costTier: 'low',
        features: ['text', 'code', 'fast', 'efficient'],
        bestFor: ['quick-tasks', 'parsing', 'basic-analysis']
      }],
      ['text-embedding-004', {
        maxTokens: 2048,
        rateLimit: { rpm: 100, tpm: 30000 },
        costTier: 'low',
        features: ['embedding', 'semantic-search'],
        bestFor: ['embeddings', 'similarity', 'search']
      }]
    ]);
  }

  /**
   * Intelligent model selection based on task requirements
   */
  selectBestModel(taskType: {
    complexity: 'simple' | 'medium' | 'complex';
    type: 'text' | 'code' | 'analysis' | 'reasoning' | 'embedding';
    priority: 'low' | 'medium' | 'high';
    contextLength?: 'short' | 'medium' | 'long';
  }): string {
    const { complexity, type, priority, contextLength = 'medium' } = taskType;

    // Handle embeddings
    if (type === 'embedding') {
      return 'text-embedding-004';
    }

    // Handle complex reasoning tasks
    if (complexity === 'complex' && type === 'reasoning') {
      return 'gemini-2.0-flash-thinking-exp';
    }

    // Handle long context requirements
    if (contextLength === 'long' || complexity === 'complex') {
      return priority === 'high' ? 'gemini-1.5-pro' : 'gemini-2.0-flash-exp';
    }

    // Handle simple/fast tasks
    if (complexity === 'simple' || priority === 'low') {
      return 'gemini-1.5-flash';
    }

    // Default for medium complexity
    return 'gemini-2.0-flash-exp';
  }

  /**
   * Enhanced text generation with streaming support
   */
  async generateText(
    prompt: string,
    config: GeminiConfig & {
      model?: string;
      taskType?: {
        complexity: 'simple' | 'medium' | 'complex';
        type: 'text' | 'code' | 'analysis' | 'reasoning';
        priority: 'low' | 'medium' | 'high';
        contextLength?: 'short' | 'medium' | 'long';
      };
      userId?: string;
      requestId?: string;
    } = {}
  ): Promise<GeminiResponse> {
    const startTime = Date.now();
    const requestId = config.requestId || uuidv4();
    
    // Select optimal model
    const selectedModel = config.model || 
      (config.taskType ? this.selectBestModel(config.taskType) : 'gemini-2.0-flash-exp');

    try {
      // Check rate limits
      this.checkRateLimit(selectedModel);

      const model = this.getModel(selectedModel, config);
      const result = config.streaming 
        ? await this.generateStreamingText(model, prompt, requestId)
        : await this.generateNonStreamingText(model, prompt, requestId);

      const processingTime = Date.now() - startTime;

      // Log successful request
      await this.logRequest(
        selectedModel,
        prompt,
        result,
        true,
        undefined,
        processingTime,
        config.userId,
        requestId
      );

      return {
        text: result.text,
        model: selectedModel,
        success: true,
        metadata: {
          tokensUsed: result.tokensUsed,
          processingTime,
          requestId,
          safetyRatings: result.safetyRatings,
          finishReason: result.finishReason
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.logRequest(
        selectedModel,
        prompt,
        null,
        false,
        errorMessage,
        processingTime,
        config.userId,
        requestId
      );

      throw new Error(`Gemini generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate embeddings with batch support
   */
  async generateEmbeddings(
    texts: string[],
    options: {
      batchSize?: number;
      userId?: string;
      requestId?: string;
    } = {}
  ): Promise<{
    embeddings: number[][];
    dimensions: number;
    model: string;
    metadata: { processingTime: number; requestId: string };
  }> {
    const startTime = Date.now();
    const requestId = options.requestId || uuidv4();
    const batchSize = options.batchSize || 10;
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });

    try {
      const embeddings: number[][] = [];

      // Process in batches to respect rate limits
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (text) => {
          const result = await model.embedContent(text);
          return result.embedding.values;
        });

        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);

        // Rate limiting delay between batches
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const processingTime = Date.now() - startTime;

      // Log embedding generation
      await this.logRequest(
        'text-embedding-004',
        `Embedding ${texts.length} texts`,
        { embeddings: embeddings.length },
        true,
        undefined,
        processingTime,
        options.userId,
        requestId
      );

      return {
        embeddings,
        dimensions: embeddings[0]?.length || 0,
        model: 'text-embedding-004',
        metadata: { processingTime, requestId }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Embedding generation failed: ${errorMessage}`);
    }
  }

  /**
   * Get configured model instance
   */
  private getModel(modelName: string, config: GeminiConfig): GenerativeModel {
    const safetySettings = this.getSafetySettings(config.safetyThreshold || 'medium');
    
    return this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: config.temperature || 0.3,
        topP: config.topP || 0.8,
        topK: config.topK || 40,
        maxOutputTokens: config.maxOutputTokens || 2048,
      },
      safetySettings
    });
  }

  /**
   * Generate text without streaming
   */
  private async generateNonStreamingText(
    model: GenerativeModel,
    prompt: string,
    requestId: string
  ): Promise<{
    text: string;
    tokensUsed?: number;
    safetyRatings?: any[];
    finishReason?: string;
  }> {
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response.text()) {
      throw new Error('No text generated by model');
    }

    return {
      text: response.text(),
      tokensUsed: result.response.usageMetadata?.totalTokenCount,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
      finishReason: response.candidates?.[0]?.finishReason
    };
  }

  /**
   * Generate text with streaming
   */
  private async generateStreamingText(
    model: GenerativeModel,
    prompt: string,
    requestId: string
  ): Promise<{
    text: string;
    tokensUsed?: number;
    safetyRatings?: any[];
    finishReason?: string;
  }> {
    const result = await model.generateContentStream(prompt);
    let fullText = '';
    let safetyRatings;
    let finishReason;
    let tokensUsed;

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      
      // Store metadata from the last chunk
      if (chunk.candidates?.[0]) {
        safetyRatings = chunk.candidates[0].safetyRatings;
        finishReason = chunk.candidates[0].finishReason;
      }
    }

    // Get final response for usage metadata
    const finalResponse = await result.response;
    tokensUsed = finalResponse.usageMetadata?.totalTokenCount;

    return {
      text: fullText,
      tokensUsed,
      safetyRatings,
      finishReason
    };
  }

  /**
   * Get safety settings based on threshold
   */
  private getSafetySettings(threshold: 'low' | 'medium' | 'high') {
    const thresholds = {
      low: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      medium: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      high: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
    };

    const selectedThreshold = thresholds[threshold];

    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: selectedThreshold,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: selectedThreshold,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: selectedThreshold,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: selectedThreshold,
      },
    ];
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(model: string): void {
    const modelConfig = this.models.get(model);
    if (!modelConfig) return;

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const key = `${model}_${Math.floor(now / windowMs)}`;
    
    const currentLimit = this.rateLimitCache.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (currentLimit.count >= modelConfig.rateLimit.rpm) {
      throw new Error(`Rate limit exceeded for model ${model}. Try again in ${Math.ceil((currentLimit.resetTime - now) / 1000)} seconds.`);
    }

    currentLimit.count++;
    this.rateLimitCache.set(key, currentLimit);

    // Clean up old entries
    if (this.rateLimitCache.size > 100) {
      for (const [key, value] of this.rateLimitCache.entries()) {
        if (value.resetTime < now) {
          this.rateLimitCache.delete(key);
        }
      }
    }
  }

  /**
   * Comprehensive request logging
   */
  private async logRequest(
    model: string,
    prompt: string,
    response: any,
    success: boolean,
    errorMessage?: string,
    processingTime?: number,
    userId?: string,
    requestId?: string
  ): Promise<void> {
    if (process.env.ENABLE_AI_AUDIT_LOGS !== 'true') return;

    try {
      await this.supabase.from('ai_audit_logs').insert({
        id: uuidv4(),
        operation_type: 'genai_sdk_call',
        input_data: {
          model,
          prompt: prompt.substring(0, 500),
          prompt_length: prompt.length
        },
        output_data: success ? {
          text: response?.text?.substring(0, 500),
          tokensUsed: response?.tokensUsed,
          finishReason: response?.finishReason
        } : null,
        model_used: model,
        tokens_used: response?.tokensUsed || 0,
        success,
        error_message: errorMessage,
        processing_time_ms: processingTime,
        user_id: userId,
        request_id: requestId,
        metadata: {
          sdk_version: 'google-genai',
          safety_ratings: response?.safetyRatings,
          model_capabilities: this.models.get(model),
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.warn('Failed to log request:', logError);
    }
  }

  /**
   * Health check with model-specific testing
   */
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    models: Record<string, { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }>;
  }> {
    const modelTests = Array.from(this.models.keys()).slice(0, 3); // Test first 3 models
    const results: Record<string, any> = {};

    await Promise.allSettled(
      modelTests.map(async (modelName) => {
        if (modelName === 'text-embedding-004') {
          // Test embedding model
          try {
            const startTime = Date.now();
            await this.generateEmbeddings(['health check test'], { batchSize: 1 });
            results[modelName] = { status: 'healthy', latency: Date.now() - startTime };
          } catch (error) {
            results[modelName] = { 
              status: 'unhealthy', 
              error: error instanceof Error ? error.message : String(error) 
            };
          }
        } else {
          // Test text generation model
          try {
            const startTime = Date.now();
            await this.generateText('Health check', { 
              model: modelName,
              maxOutputTokens: 10,
              temperature: 0
            });
            results[modelName] = { status: 'healthy', latency: Date.now() - startTime };
          } catch (error) {
            results[modelName] = { 
              status: 'unhealthy', 
              error: error instanceof Error ? error.message : String(error) 
            };
          }
        }
      })
    );

    const healthyCount = Object.values(results).filter((r: any) => r.status === 'healthy').length;
    const overall = healthyCount === modelTests.length ? 'healthy' : 
                   healthyCount > 0 ? 'degraded' : 'unhealthy';

    return { overall, models: results };
  }

  /**
   * Get model capabilities and status
   */
  getModelInfo(): Record<string, ModelCapabilities & { available: boolean }> {
    const info: Record<string, ModelCapabilities & { available: boolean }> = {};
    
    for (const [name, capabilities] of this.models.entries()) {
      info[name] = { ...capabilities, available: true };
    }

    return info;
  }

  /**
   * Batch processing with intelligent load balancing
   */
  async batchProcess(
    requests: Array<{
      prompt: string;
      config?: GeminiConfig & { taskType?: any };
      priority?: 'low' | 'medium' | 'high';
    }>,
    options: {
      maxConcurrency?: number;
      userId?: string;
      requestId?: string;
    } = {}
  ): Promise<Array<{ success: boolean; result?: GeminiResponse; error?: string; index: number }>> {
    const { maxConcurrency = 3, userId, requestId = uuidv4() } = options;
    const results: Array<{ success: boolean; result?: GeminiResponse; error?: string; index: number }> = [];

    // Sort by priority
    const sortedRequests = requests.map((req, index) => ({ ...req, originalIndex: index }))
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2);
      });

    // Process in batches
    for (let i = 0; i < sortedRequests.length; i += maxConcurrency) {
      const batch = sortedRequests.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (req) => {
        try {
          const result = await this.generateText(req.prompt, {
            ...req.config,
            userId,
            requestId: `${requestId}_${req.originalIndex}`
          });
          return { success: true, result, index: req.originalIndex };
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error),
            index: req.originalIndex 
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ 
            success: false, 
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            index: -1 
          });
        }
      }

      // Rate limiting delay between batches
      if (i + maxConcurrency < sortedRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Sort results back to original order
    return results.sort((a, b) => a.index - b.index);
  }
}

export default AdvancedGeminiProxy;