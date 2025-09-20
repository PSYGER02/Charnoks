/**
 * TypeScript type definitions for the enhanced MCP server
 */

import express from 'express';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      user?: {
        id: string;
        email?: string;
        role: string;
      };
    }
  }
}

export interface ModelCapabilities {
  maxTokens: number;
  rateLimit: { rpm: number; tpm: number };
  costTier: 'low' | 'medium' | 'high';
  features: string[];
  bestFor: string[];
}

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

export interface ChickenBusinessNote {
  id?: string;
  local_uuid?: string;
  branch_id: string;
  author_id: string;
  content: string;
  parsed?: any;
  status: 'pending' | 'parsed' | 'confirmed' | 'synced';
  created_at?: string;
}

export interface RequestContext {
  userId?: string;
  requestId: string;
  userRole?: string;
  branchId?: string;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  implementation: (args: any, context: RequestContext) => Promise<any>;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: any;
  component?: string;
  requestId?: string;
  userId?: string;
  timestamp?: Date;
}

export interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    userId?: string;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    gemini: {
      overall: 'healthy' | 'degraded' | 'unhealthy';
      models?: Record<string, any>;
    };
    supabase: {
      status: 'healthy' | 'unhealthy';
      error?: string;
    };
  };
  environment?: string;
}

export interface ToolResponse {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: any;
  }>;
  count?: number;
}

export interface ParseNoteResult {
  note_id: string;
  parsed: any;
  embedding_id?: string;
  status: string;
}

export interface SyncOperationResult {
  local_uuid: string;
  status: 'success' | 'error';
  server_id?: string;
  error?: string;
}

export interface BusinessAnalysisResult {
  summary: string;
  metadata: {
    summary_id?: string;
    data_points: {
      notes: number;
      operations: number;
    };
    date_range: {
      from: string;
      to: string;
    };
    processing_time: number;
  };
}

export interface EmbeddingResult {
  embeddings: number[][];
  dimensions: number;
  model: string;
  metadata: {
    processingTime: number;
    requestId: string;
  };
}

export interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}