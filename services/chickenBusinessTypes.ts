/**
 * Shared types for chicken business operations
 * This avoids circular import issues and missing dependencies
 */

export interface ChickenBusinessPattern {
  business_type: 'purchase' | 'processing' | 'distribution' | 'cooking' | 'sales' | 'general';
  confidence_score: number;
  learned_patterns: {
    // Purchase patterns
    supplier?: string;
    product?: string;
    bags?: number;
    units_per_bag?: number;
    total_units?: number;
    cost_per_bag?: number;
    
    // Processing patterns
    input_bags?: number;
    output_parts_bags?: number;
    output_necks_bags?: number;
    parts_per_bag?: number;
    necks_per_bag?: number;
    yield_ratio?: number;
    
    // Distribution patterns
    branch?: string;
    distributed_bags?: number;
    distributed_necks?: number;
    
    // Cooking patterns
    cooked_bags?: number;
    cooked_necks?: number;
    cooking_method?: string;
    
    // Sales patterns
    leftover_parts?: number;
    price_per_part?: number;
    leftover_necks?: number;
    price_per_neck?: number;
    total_sales?: number;
    
    // General metadata
    timestamp?: string;
    worker_mentioned?: string;
    branch_mentioned?: string;
  };
}

// Stub interfaces for compatibility
export interface StockIntegrationResult {
  success: boolean;
  errors?: string[];
  applied_operations?: any[];
}

export interface AIProcessingResult {
  success: boolean;
  pattern?: ChickenBusinessPattern;
  note_id?: string;
  should_update_stock?: boolean;
  suggested_actions?: string[];
  error?: string;
}