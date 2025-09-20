/**
 * MCP Server for Chicken Business AI
 * Main entry point that registers AI tools and handles requests
 * Provides reliable access to your 6 AI services through MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import { GeminiProxyManager } from './gemini-proxy.js';
import { ChickenBusinessTools } from './tools/chicken-business-tools.js';

// Load environment variables
dotenv.config();

const server = new Server(
  {
    name: 'chicken-business-ai',
    version: '1.0.0',
    description: 'MCP Server for AI-powered chicken business management with reliable Gemini API access',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize services
const geminiProxy = new GeminiProxyManager();
const businessTools = new ChickenBusinessTools(geminiProxy);

/**
 * Tool Registry - Your existing AI services as MCP tools
 */
const AVAILABLE_TOOLS = [
  {
    name: 'process_chicken_note',
    description: 'Parse chicken business note using AI with pattern recognition',
    inputSchema: {
      type: 'object',
      properties: {
        noteText: { 
          type: 'string', 
          description: 'Raw business note text to parse' 
        },
        userRole: { 
          type: 'string', 
          enum: ['owner', 'worker'],
          description: 'Role of the user making the request'
        },
        branchId: { 
          type: 'string', 
          description: 'Branch ID if applicable' 
        }
      },
      required: ['noteText', 'userRole']
    }
  },
  {
    name: 'get_business_advice',
    description: 'Get AI business consultation from your Store Advisor',
    inputSchema: {
      type: 'object',
      properties: {
        question: { 
          type: 'string', 
          description: 'Business question to ask the AI advisor' 
        },
        userRole: { 
          type: 'string', 
          enum: ['owner', 'worker'],
          description: 'Role of the user asking the question'
        },
        context: {
          type: 'object',
          description: 'Additional business context',
          properties: {
            timeframe: { type: 'string' },
            specificArea: { type: 'string' }
          }
        }
      },
      required: ['question', 'userRole']
    }
  },
  {
    name: 'analyze_business_performance',
    description: 'Generate comprehensive business intelligence report',
    inputSchema: {
      type: 'object',
      properties: {
        timeframe: { 
          type: 'string', 
          enum: ['daily', 'weekly', 'monthly'],
          description: 'Analysis timeframe'
        },
        includeInsights: {
          type: 'boolean',
          description: 'Include AI-generated insights',
          default: true
        },
        includeRecommendations: {
          type: 'boolean', 
          description: 'Include actionable recommendations',
          default: true
        }
      },
      required: ['timeframe']
    }
  },
  {
    name: 'get_ai_proposals',
    description: 'Get AI Assistant proposals for business improvements',
    inputSchema: {
      type: 'object',
      properties: {
        proposalTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['expense_categorization', 'stock_adjustment', 'price_optimization', 'process_improvement']
          },
          description: 'Types of proposals to generate'
        },
        confidenceThreshold: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          default: 70,
          description: 'Minimum confidence score for proposals'
        }
      }
    }
  },
  {
    name: 'apply_stock_pattern',
    description: 'Apply AI-parsed pattern to actual stock and sales data',
    inputSchema: {
      type: 'object',
      properties: {
        noteId: { 
          type: 'string', 
          description: 'ID of the note with parsed pattern' 
        },
        userRole: { 
          type: 'string', 
          enum: ['owner', 'worker'] 
        },
        branchId: { 
          type: 'string', 
          description: 'Branch ID for multi-location businesses' 
        },
        dryRun: {
          type: 'boolean',
          default: false,
          description: 'Preview changes without applying them'
        }
      },
      required: ['noteId', 'userRole']
    }
  },
  {
    name: 'monitor_business_health',
    description: 'Get real-time business health monitoring alerts',
    inputSchema: {
      type: 'object',
      properties: {
        alertTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['stock_alerts', 'sales_patterns', 'expense_anomalies', 'performance_issues']
          },
          description: 'Types of alerts to check'
        },
        priority: {
          type: 'string',
          enum: ['all', 'high', 'urgent'],
          default: 'all',
          description: 'Minimum alert priority'
        }
      }
    }
  }
];

/**
 * Register tool handlers
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.log('📋 Listing available tools...');
  return { tools: AVAILABLE_TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.log(`🔧 Executing tool: ${name} with args:`, JSON.stringify(args, null, 2));
  
  try {
    let result;
    
    switch (name) {
      case 'process_chicken_note':
        if (!args?.noteText) {
          throw new Error('Missing required parameter: noteText');
        }
        result = await businessTools.processChickenNote(
          args.noteText as string,
          args.userRole as 'owner' | 'worker',
          args.branchId as string
        );
        break;
        
      case 'get_business_advice':
        if (!args?.question) {
          throw new Error('Missing required parameter: question');
        }
        result = await businessTools.getBusinessAdvice(
          args.question as string,
          args.userRole as 'owner' | 'worker',
          args.context as any
        );
        break;
        
      case 'analyze_business_performance':
        const timeframe = args?.timeframe as 'daily' | 'weekly' | 'monthly' || 'monthly';
        result = await businessTools.analyzeBusinessPerformance(
          timeframe,
          args?.includeInsights as boolean,
          args?.includeRecommendations as boolean
        );
        break;
        
      case 'get_ai_proposals':
        result = await businessTools.getAIProposals(
          args?.proposalTypes as string[] | undefined,
          args?.confidenceThreshold as number
        );
        break;
        
      case 'apply_stock_pattern':
        if (!args?.noteId) {
          throw new Error('Missing required parameter: noteId');
        }
        result = await businessTools.applyStockPattern(
          args.noteId as string,
          args.userRole as 'owner' | 'worker',
          args.branchId as string,
          args.dryRun as boolean
        );
        break;
        
      case 'monitor_business_health':
        result = await businessTools.monitorBusinessHealth(
          args?.alertTypes as string[] | undefined,
          args?.priority as 'all' | 'high' | 'urgent' | undefined
        );
        break;
        
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
    
    console.log(`✅ Tool ${name} completed successfully`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
    
  } catch (error) {
    console.error(`❌ Tool ${name} failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log error for debugging
    await businessTools.logError(name, args, errorMessage);
    
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${errorMessage}`
    );
  }
});

/**
 * Start the server
 */
async function main() {
  console.log('🚀 Starting Chicken Business MCP Server...');
  
  // Validate environment variables
  const requiredEnvVars = [
    'GEMINI_API_KEY',
    'SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Environment variables validated');
  
  // Test Gemini connection
  try {
    await geminiProxy.makeReliableRequest(
      { type: 'text', complexity: 'simple', priority: 'low' },
      'Test connection'
    );
    console.log('✅ Gemini API connection verified');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️ Gemini API test failed, but server will continue:', errorMessage);
  }
  
  // Initialize business tools
  await businessTools.initialize();
  console.log('✅ Business tools initialized');
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log('🎉 Chicken Business MCP Server is running!');
  console.log('📊 Available tools:', AVAILABLE_TOOLS.map(t => t.name).join(', '));
  console.log('🔗 Ready to handle requests from MCP clients');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down MCP server...');
  await businessTools.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down MCP server...');
  await businessTools.cleanup();
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Failed to start MCP server:', error);
    process.exit(1);
  });
}