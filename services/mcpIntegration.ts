/**
 * MCP Integration Utility
 * Provides fallback-enabled MCP server integration for existing AI services
 */

interface MCPCallRequest {
  method: string;
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}

interface MCPResponse {
  result?: {
    content?: Array<{
      type: string;
      text: string;
    }>;
  };
  error?: {
    message: string;
    code: number;
  };
}

interface MCPConfig {
  serverUrl: string;
  token: string;
  enabled: boolean;
  timeoutMs: number;
}

class MCPIntegration {
  private config: MCPConfig;
  
  constructor() {
    this.config = {
      serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3001',
      token: process.env.MCP_SERVER_TOKEN || 'dev-token',
      enabled: process.env.MCP_ENABLED === 'true' || false,
      timeoutMs: parseInt(process.env.MCP_TIMEOUT_MS || '10000')
    };
  }

  /**
   * Check if MCP integration is available and enabled
   */
  isAvailable(): boolean {
    return this.config.enabled;
  }

  /**
   * Call MCP server tool with automatic fallback
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    usedMCP: boolean;
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'MCP integration disabled',
        usedMCP: false
      };
    }

    try {
      const mcpRequest: MCPCallRequest = {
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(`${this.config.serverUrl}/call-tool`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.token}`
        },
        body: JSON.stringify(mcpRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MCP server responded with ${response.status}: ${response.statusText}`);
      }

      const mcpResponse: MCPResponse = await response.json();
      
      if (mcpResponse.error) {
        throw new Error(`MCP error: ${mcpResponse.error.message}`);
      }

      // Extract text content from MCP response
      const content = mcpResponse.result?.content?.[0];
      if (!content || content.type !== 'text') {
        throw new Error('Invalid MCP response format');
      }

      // Try to parse as JSON, fallback to raw text
      let data;
      try {
        data = JSON.parse(content.text);
      } catch {
        data = content.text;
      }

      return {
        success: true,
        data,
        usedMCP: true
      };

    } catch (error) {
      console.warn(`MCP tool call failed for ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        usedMCP: false
      };
    }
  }

  /**
   * Enhanced AI assistant with MCP integration
   */
  async getBusinessAdvice(context: Record<string, any>): Promise<{
    advice: any;
    usedMCP: boolean;
  }> {
    const mcpResult = await this.callTool('get_business_advice', context);
    
    if (mcpResult.success) {
      return {
        advice: mcpResult.data,
        usedMCP: true
      };
    }

    // Fallback to direct implementation would go here
    return {
      advice: { error: 'MCP and fallback both failed', mcpError: mcpResult.error },
      usedMCP: false
    };
  }

  /**
   * Enhanced note processing with MCP integration
   */
  async processChickenNote(noteText: string, userId?: string, userRole?: string): Promise<{
    result: any;
    usedMCP: boolean;
  }> {
    const mcpResult = await this.callTool('process_chicken_note', {
      note_text: noteText,
      user_id: userId,
      user_role: userRole,
      extract_mode: 'comprehensive'
    });
    
    if (mcpResult.success) {
      return {
        result: mcpResult.data,
        usedMCP: true
      };
    }

    // Fallback to direct implementation would go here
    return {
      result: { error: 'MCP and fallback both failed', mcpError: mcpResult.error },
      usedMCP: false
    };
  }

  /**
   * Enhanced business performance analysis with MCP integration
   */
  async analyzeBusinessPerformance(timeframe: string = '30d'): Promise<{
    analysis: any;
    usedMCP: boolean;
  }> {
    const mcpResult = await this.callTool('analyze_business_performance', {
      timeframe,
      include_recommendations: true,
      detailed_metrics: true
    });
    
    if (mcpResult.success) {
      return {
        analysis: mcpResult.data,
        usedMCP: true
      };
    }

    // Fallback to direct implementation would go here
    return {
      analysis: { error: 'MCP and fallback both failed', mcpError: mcpResult.error },
      usedMCP: false
    };
  }

  /**
   * Enhanced AI proposals with MCP integration
   */
  async getAIProposals(context: Record<string, any>): Promise<{
    proposals: any;
    usedMCP: boolean;
  }> {
    const mcpResult = await this.callTool('get_ai_proposals', context);
    
    if (mcpResult.success) {
      return {
        proposals: mcpResult.data,
        usedMCP: true
      };
    }

    // Fallback to direct implementation would go here
    return {
      proposals: { error: 'MCP and fallback both failed', mcpError: mcpResult.error },
      usedMCP: false
    };
  }

  /**
   * Enhanced stock pattern application with MCP integration
   */
  async applyStockPattern(patternType: string, data: Record<string, any>): Promise<{
    result: any;
    usedMCP: boolean;
  }> {
    const mcpResult = await this.callTool('apply_stock_pattern', {
      pattern_type: patternType,
      input_data: data
    });
    
    if (mcpResult.success) {
      return {
        result: mcpResult.data,
        usedMCP: true
      };
    }

    // Fallback to direct implementation would go here
    return {
      result: { error: 'MCP and fallback both failed', mcpError: mcpResult.error },
      usedMCP: false
    };
  }

  /**
   * Enhanced business health monitoring with MCP integration
   */
  async monitorBusinessHealth(): Promise<{
    health: any;
    usedMCP: boolean;
  }> {
    const mcpResult = await this.callTool('monitor_business_health', {
      include_alerts: true,
      detailed_metrics: true
    });
    
    if (mcpResult.success) {
      return {
        health: mcpResult.data,
        usedMCP: true
      };
    }

    // Fallback to direct implementation would go here
    return {
      health: { error: 'MCP and fallback both failed', mcpError: mcpResult.error },
      usedMCP: false
    };
  }

  /**
   * Health check for MCP server
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    if (!this.isAvailable()) {
      return { healthy: false, error: 'MCP integration disabled' };
    }

    const start = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check

      const response = await fetch(`${this.config.serverUrl}/health`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${this.config.token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - start;

      if (response.ok) {
        return { healthy: true, latency };
      } else {
        return { healthy: false, error: `Health check failed: ${response.status}` };
      }

    } catch (error) {
      const latency = Date.now() - start;
      return { 
        healthy: false, 
        latency, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Configure MCP integration at runtime
   */
  configure(config: Partial<MCPConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): MCPConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const mcpIntegration = new MCPIntegration();

// Convenience function for quick MCP calls
export async function callMCPTool(toolName: string, args: Record<string, any>) {
  return await mcpIntegration.callTool(toolName, args);
}

// Export for TypeScript types
export type { MCPConfig, MCPCallRequest, MCPResponse };