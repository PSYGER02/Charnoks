/**
 * Unified MCP Client Service
 * Routes all AI operations through the MCP server for consistency and reliability
 * Replaces direct Gemini API calls with MCP-mediated requests
 */

export interface MCPToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  success: boolean;
  result?: any;
  error?: string;
}

export interface MCPHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    gemini: {
      overall: string;
      models: Record<string, any>;
    };
    supabase: {
      status: string;
    };
  };
  uptime: number;
  version: string;
}

class MCPClientService {
  private baseUrl: string;
  private authToken: string;
  private retryCount: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    // Get MCP server URL from environment or default to local
    this.baseUrl = import.meta.env.VITE_MCP_SERVER_URL || 
                   process.env.MCP_SERVER_URL || 
                   'http://localhost:3002';
    
    this.authToken = import.meta.env.VITE_MCP_AUTH_TOKEN || 
                     process.env.MCP_AUTH_TOKEN || 
                     'dev-token';
  }

  /**
   * Call an MCP tool with retry logic
   */
  async callTool(request: MCPToolRequest): Promise<MCPToolResponse> {
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/api/tools/call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            'X-Request-ID': crypto.randomUUID()
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          throw new Error(`MCP API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.warn(`MCP call attempt ${attempt} failed:`, error);
        
        if (attempt === this.retryCount) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Get MCP server health status
   */
  async getHealth(): Promise<MCPHealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`MCP health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse chicken business note using MCP
   */
  async parseChickenNote(
    content: string, 
    userRole: 'owner' | 'worker',
    branchId?: string
  ): Promise<MCPToolResponse> {
    return this.callTool({
      name: 'parse_chicken_note',
      arguments: {
        content,
        user_role: userRole,
        branch_id: branchId,
        local_uuid: crypto.randomUUID()
      }
    });
  }

  /**
   * Get business advice using MCP
   */
  async getBusinessAdvice(
    question: string,
    userRole: 'owner' | 'worker',
    businessContext?: string
  ): Promise<MCPToolResponse> {
    return this.callTool({
      name: 'business_advice',
      arguments: {
        question,
        user_role: userRole,
        business_context: businessContext,
        context: {}
      }
    });
  }

  /**
   * Generate embeddings using MCP
   */
  async generateEmbeddings(texts: string[]): Promise<MCPToolResponse> {
    return this.callTool({
      name: 'generate_embeddings',
      arguments: {
        texts,
        model: 'text-embedding-004'
      }
    });
  }

  /**
   * Sync operations to database using MCP
   */
  async syncOperations(operations: any[]): Promise<MCPToolResponse> {
    return this.callTool({
      name: 'sync_operations',
      arguments: {
        operations
      }
    });
  }

  /**
   * Generate sales forecast using MCP
   */
  async getSalesForecast(
    historicalData: any[],
    period: string = '7_days'
  ): Promise<MCPToolResponse> {
    return this.callTool({
      name: 'sales_forecast',
      arguments: {
        historical_data: historicalData,
        forecast_period: period
      }
    });
  }

  /**
   * Get AI insights from sales data using MCP
   */
  async getAIInsights(
    salesData: any[],
    expenseData: any[]
  ): Promise<MCPToolResponse> {
    return this.callTool({
      name: 'ai_insights',
      arguments: {
        sales_data: salesData,
        expense_data: expenseData
      }
    });
  }

  /**
   * Test MCP server connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.status !== 'unhealthy';
    } catch {
      return false;
    }
  }

  /**
   * Get available tools from MCP server
   */
  async getAvailableTools(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tools/list`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get tools: ${response.status}`);
      }
      
      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.warn('Failed to get MCP tools:', error);
      return [];
    }
  }
}

// Create singleton instance
export const mcpClient = new MCPClientService();

// Export for direct use
export default mcpClient;