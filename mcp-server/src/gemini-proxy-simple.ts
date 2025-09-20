/**
 * Simplified Gemini Proxy Manager
 * Quick implementation for MCP server testing
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type TaskRequest = 'standard' | 'complex' | 'simple';

export interface GeminiResponse {
  text: string;
  model: string;
  success: boolean;
}

export class GeminiProxyManager {
  private maxRetries = 3;
  private geminiKey = process.env.GEMINI_API_KEY!;

  async makeReliableRequest(task: TaskRequest, prompt: string): Promise<GeminiResponse> {
    const model = 'gemini-2.0-flash-lite'; // Simple default model
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callGeminiAPI(model, prompt);
        
        // Log successful call
        await this.logAPICall(model, prompt, response, true);
        
        return {
          text: response,
          model,
          success: true
        };

      } catch (error) {
        console.warn(`Attempt ${attempt}/${this.maxRetries} failed:`, error);
        
        if (attempt === this.maxRetries) {
          throw new Error(`Gemini API failed after ${this.maxRetries} attempts`);
        }
        
        // Simple delay
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('All attempts failed');
  }

  private async callGeminiAPI(model: string, prompt: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data: any = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  }

  private async logAPICall(model: string, prompt: string, response: any, success: boolean, error?: string): Promise<void> {
    try {
      await supabase.from('ai_audit_logs').insert({
        operation_type: 'gemini_api_call',
        input_data: { model, prompt: prompt.substring(0, 500) },
        output_data: success ? { response: typeof response === 'string' ? response.substring(0, 500) : response } : null,
        model_used: model,
        success,
        error_message: error
      });
    } catch (logError) {
      console.warn('Failed to log API call:', logError);
    }
  }
}