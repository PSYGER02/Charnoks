// Simple working MCP server for testing
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class SimpleChickenMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'chicken-business-simple',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'parse_chicken_note',
            description: 'Parse a chicken business note into structured data',
            inputSchema: {
              type: 'object',
              properties: {
                noteText: {
                  type: 'string',
                  description: 'The note text to parse'
                },
                userRole: {
                  type: 'string',
                  enum: ['owner', 'worker'],
                  description: 'The role of the user'
                }
              },
              required: ['noteText', 'userRole']
            }
          },
          {
            name: 'get_business_health',
            description: 'Get current business health status',
            inputSchema: {
              type: 'object',
              properties: {
                includeRecommendations: {
                  type: 'boolean',
                  description: 'Whether to include AI recommendations'
                }
              }
            }
          },
          {
            name: 'test_gemini_api',
            description: 'Test Gemini API connectivity',
            inputSchema: {
              type: 'object',
              properties: {
                testPrompt: {
                  type: 'string',
                  description: 'Test prompt for Gemini API'
                }
              }
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'parse_chicken_note':
            return await this.parseChickenNote(args as any);

          case 'get_business_health':
            return await this.getBusinessHealth(args as any);

          case 'test_gemini_api':
            return await this.testGeminiAPI(args as any);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private async parseChickenNote(args: { noteText: string; userRole: string }) {
    const { noteText, userRole } = args;
    
    console.log(`🤖 MCP Server: Parsing note for ${userRole}: "${noteText.substring(0, 50)}..."`);

    // Simple mock parsing for now - later we'll add real Gemini API
    const mockPattern = {
      business_type: this.detectBusinessType(noteText),
      confidence_score: 0.85,
      learned_patterns: this.extractPatterns(noteText),
      timestamp: new Date().toISOString()
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            pattern: mockPattern,
            note_id: `note_${Date.now()}`,
            suggested_actions: ['Review parsed data', 'Apply to stock if accurate']
          }, null, 2)
        }
      ]
    };
  }

  private async getBusinessHealth(args: { includeRecommendations?: boolean }) {
    console.log('📊 MCP Server: Getting business health status');

    const healthStatus = {
      overall_score: 85,
      areas: {
        sales: { score: 90, trend: 'up' },
        expenses: { score: 75, trend: 'stable' },
        inventory: { score: 80, trend: 'up' }
      },
      alerts: [
        'Stock levels normal',
        'Sales performance above average'
      ],
      timestamp: new Date().toISOString()
    };

    if (args.includeRecommendations) {
      (healthStatus as any).recommendations = [
        'Consider bulk purchasing to reduce costs',
        'Monitor inventory turnover rates',
        'Track seasonal sales patterns'
      ];
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(healthStatus, null, 2)
        }
      ]
    };
  }

  private async testGeminiAPI(args: { testPrompt?: string }) {
    const prompt = args.testPrompt || 'Test prompt for chicken business AI';
    console.log('🧪 MCP Server: Testing Gemini API connectivity');

    try {
      // Test with real Gemini API if key is available
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 100
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              api_status: 'working',
              test_response: result,
              model_used: 'gemini-2.0-flash-lite',
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              api_status: 'failed',
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString()
            }, null, 2)
          }
        ]
      };
    }
  }

  private detectBusinessType(noteText: string): string {
    const lower = noteText.toLowerCase();
    if (lower.includes('buy') || lower.includes('bought') || lower.includes('purchase')) {
      return 'purchase';
    }
    if (lower.includes('chop') || lower.includes('process') || lower.includes('cut')) {
      return 'processing';
    }
    if (lower.includes('cook') || lower.includes('fry') || lower.includes('fried')) {
      return 'cooking';
    }
    if (lower.includes('sell') || lower.includes('sold') || lower.includes('leftover')) {
      return 'sales';
    }
    if (lower.includes('send') || lower.includes('transfer') || lower.includes('branch')) {
      return 'distribution';
    }
    return 'general';
  }

  private extractPatterns(noteText: string): any {
    const patterns: any = {};
    
    // Extract numbers that might be bags, pieces, prices
    const numberMatches = noteText.match(/(\d+)\s*(bags?|pieces?|pesos?|chickens?)/gi);
    if (numberMatches) {
      numberMatches.forEach(match => {
        const [num, unit] = match.split(/\s+/);
        if (unit.toLowerCase().includes('bag')) {
          patterns.bags = parseInt(num);
        } else if (unit.toLowerCase().includes('piece')) {
          patterns.pieces = parseInt(num);
        } else if (unit.toLowerCase().includes('peso')) {
          patterns.price = parseInt(num);
        } else if (unit.toLowerCase().includes('chicken')) {
          patterns.chickens = parseInt(num);
        }
      });
    }

    // Extract supplier names (simple pattern)
    const supplierMatch = noteText.match(/\b(magnolia|bounty|cp|san miguel)\b/gi);
    if (supplierMatch) {
      patterns.supplier = supplierMatch[0];
    }

    return patterns;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('🐔 Simple Chicken Business MCP Server running...');
  }
}

// Start the server
const server = new SimpleChickenMCPServer();
server.run().catch((error) => {
  console.error('❌ Failed to start MCP server:', error);
  process.exit(1);
});