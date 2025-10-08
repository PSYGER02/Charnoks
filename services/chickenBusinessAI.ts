/**
 * ChickenBusinessAI Service - Clean version for deployment
 * Simplified AI-powered parsing without complex dependencies
 */

import { createClient } from '@supabase/supabase-js';
import { ChickenBusinessPattern, AIProcessingResult, StockIntegrationResult } from './chickenBusinessTypes';

// Initialize Supabase client for MCP server context
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Constants
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * Simplified ChickenBusinessAI class for deployment
 */
export class ChickenBusinessAI {
  
  /**
   * Simple parsing with basic Gemini API call
   */
  private async parseWithGemini(noteText: string, userRole: 'owner' | 'worker' = 'worker'): Promise<ChickenBusinessPattern> {
    try {
      console.log('🤖 Parsing with Gemini model...');
      
      const prompt = `
Parse this chicken business note into structured data:

Note: "${noteText}"

Extract information and classify as one of these business types:
- purchase: Buying whole chickens from suppliers
- processing: Chopping whole chickens into parts and necks  
- distribution: Sending chicken parts/necks to branches
- cooking: Cooking chicken parts/necks
- sales: Selling cooked chicken parts/necks to customers
- general: Other business activities

Return JSON with this structure:
{
  "business_type": "purchase|processing|distribution|cooking|sales|general",
  "confidence_score": 0.0-1.0,
  "learned_patterns": {
    "supplier": "string (if purchase)",
    "product": "string (if purchase)",
    "bags": number,
    "units_per_bag": number,
    "total_units": number,
    "cost_per_bag": number,
    "branch": "string (if distribution)",
    "worker_mentioned": "string",
    "timestamp": "ISO string"
  }
}
`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        business_type: parsed.business_type || 'general',
        confidence_score: parsed.confidence_score || 0.5,
        learned_patterns: parsed.learned_patterns || {}
      };

    } catch (error) {
      console.error('❌ Gemini parsing failed:', error);
      
      // Fallback to basic pattern matching
      return this.basicPatternMatching(noteText);
    }
  }

  /**
   * Basic pattern matching fallback
   */
  private basicPatternMatching(noteText: string): ChickenBusinessPattern {
    const text = noteText.toLowerCase();
    
    // Basic pattern detection
    let businessType: ChickenBusinessPattern['business_type'] = 'general';
    let confidence = 0.3;
    
    if (text.includes('buy') || text.includes('purchase') || text.includes('supplier')) {
      businessType = 'purchase';
      confidence = 0.7;
    } else if (text.includes('chop') || text.includes('process') || text.includes('cut')) {
      businessType = 'processing';
      confidence = 0.7;
    } else if (text.includes('send') || text.includes('branch') || text.includes('distribute')) {
      businessType = 'distribution';
      confidence = 0.7;
    } else if (text.includes('cook') || text.includes('fry') || text.includes('boil')) {
      businessType = 'cooking';
      confidence = 0.7;
    } else if (text.includes('sell') || text.includes('customer') || text.includes('price')) {
      businessType = 'sales';
      confidence = 0.7;
    }

    return {
      business_type: businessType,
      confidence_score: confidence,
      learned_patterns: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Main parsing method
   */
  async parseNote(noteText: string, userRole: 'owner' | 'worker' = 'worker'): Promise<AIProcessingResult> {
    try {
      console.log('📝 Starting note parsing...');
      
      if (!noteText?.trim()) {
        return {
          success: false,
          error: 'Empty note text provided'
        };
      }

      // Use Gemini if API key is available, otherwise fallback
      let pattern: ChickenBusinessPattern;
      
      if (GEMINI_API_KEY) {
        pattern = await this.parseWithGemini(noteText, userRole);
      } else {
        console.log('⚠️ No Gemini API key, using basic pattern matching');
        pattern = this.basicPatternMatching(noteText);
      }

      return {
        success: true,
        pattern,
        should_update_stock: pattern.business_type !== 'general',
        suggested_actions: this.generateSuggestedActions(pattern)
      };

    } catch (error) {
      console.error('❌ Note parsing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate suggested actions based on pattern
   */
  private generateSuggestedActions(pattern: ChickenBusinessPattern): string[] {
    const actions: string[] = [];
    
    switch (pattern.business_type) {
      case 'purchase':
        actions.push('Update inventory with new stock');
        actions.push('Record supplier transaction');
        break;
      case 'processing':
        actions.push('Update processed inventory');
        actions.push('Record yield ratios');
        break;
      case 'distribution':
        actions.push('Update branch inventory');
        actions.push('Record distribution costs');
        break;
      case 'cooking':
        actions.push('Update cooked inventory');
        actions.push('Record cooking losses');
        break;
      case 'sales':
        actions.push('Record sales revenue');
        actions.push('Update remaining inventory');
        break;
      default:
        actions.push('Review note for business insights');
    }
    
    return actions;
  }

  /**
   * Save note to database
   */
  async saveNote(noteData: any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      console.log('💾 Saving note to database...');
      
      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        id: data.id
      };

    } catch (error) {
      console.error('❌ Save note failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simple health check
   */
  async healthCheck(): Promise<{ status: string; services: Record<string, boolean> }> {
    const services = {
      supabase: false,
      gemini: false
    };

    // Test Supabase connection
    try {
      const { error } = await supabase.from('notes').select('id').limit(1);
      services.supabase = !error;
    } catch {
      services.supabase = false;
    }

    // Test Gemini API
    services.gemini = !!GEMINI_API_KEY;

    const allHealthy = Object.values(services).every(status => status);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services
    };
  }
}

// Export singleton instance
export const chickenBusinessAI = new ChickenBusinessAI();