/**
 * Simplified MCP Server
 * Quick implementation for testing
 */

import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { GeminiProxyManager } from './gemini-proxy-simple.js';

// Load environment variables
dotenv.config();

// Initialize services
const geminiProxy = new GeminiProxyManager();

// Create Express app for HTTP endpoints
const app = express();
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// List tools endpoint
app.post('/list-tools', (req, res) => {
  const tools = [
    {
      name: 'process_chicken_note',
      description: 'Parse and process chicken business notes',
      inputSchema: {
        type: 'object',
        properties: {
          note_text: { type: 'string' },
          user_role: { type: 'string' },
          extract_mode: { type: 'string' }
        },
        required: ['note_text']
      }
    },
    {
      name: 'get_business_advice',
      description: 'Get AI business advice',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          context: { type: 'object' }
        },
        required: ['question']
      }
    }
  ];

  res.json({
    result: {
      tools
    }
  });
});

// Call tool endpoint
app.post('/call-tool', async (req, res) => {
  try {
    const { method, params } = req.body;
    
    if (method !== 'tools/call') {
      return res.status(400).json({ error: 'Invalid method' });
    }

    const { name, arguments: args } = params;

    let result = '';

    switch (name) {
      case 'process_chicken_note':
        const noteText = args?.note_text || '';
        const prompt = `Parse this chicken business note and extract key information as JSON:
        
        Note: "${noteText}"
        
        Extract: purchases, sales, inventory changes, expenses. Return valid JSON only.`;
        
        const noteResult = await geminiProxy.makeReliableRequest('standard', prompt);
        result = noteResult.text;
        break;

      case 'get_business_advice':
        const question = args?.question || '';
        const advicePrompt = `Provide business advice for this chicken business question:
        
        Question: "${question}"
        
        Provide practical, actionable advice in plain text.`;
        
        const adviceResult = await geminiProxy.makeReliableRequest('standard', advicePrompt);
        result = adviceResult.text;
        break;

      default:
        return res.status(400).json({ error: `Unknown tool: ${name}` });
    }

    res.json({
      result: {
        content: [{
          type: 'text',
          text: result
        }]
      }
    });

  } catch (error: any) {
    console.error('Tool execution error:', error);
    res.status(500).json({ 
      error: { 
        message: error.message || 'Tool execution failed',
        code: 500 
      } 
    });
  }
});

// Start HTTP server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 MCP Server listening on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🛠️  Tools endpoint: http://localhost:${PORT}/list-tools`);
  console.log(`⚡ Call tool: http://localhost:${PORT}/call-tool`);
});

// Create MCP server (for stdio transport if needed)
const server = new Server(
  {
    name: 'chicken-business-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'process_chicken_note',
        description: 'Parse and process chicken business notes',
        inputSchema: {
          type: 'object',
          properties: {
            note_text: { type: 'string' },
            user_role: { type: 'string' }
          },
          required: ['note_text']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'process_chicken_note':
      const noteText = args?.note_text as string || '';
      const prompt = `Parse this chicken business note: "${noteText}". Return JSON with purchases, sales, inventory.`;
      
      const result = await geminiProxy.makeReliableRequest('standard', prompt);
      
      return {
        content: [{
          type: 'text',
          text: result.text
        }]
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start MCP server on stdio if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('🔗 MCP Server connected via stdio');
}

export { server, app };