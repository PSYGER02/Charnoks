/**
 * Data Deduplication Service
 * Prevents duplicate expense entries and ensures clean data sync
 */

import { offlineDB } from './offlineService';
import { supabase } from '../src/supabaseConfig';

class DataDeduplicationService {
  
  /**
   * Check for and remove duplicate expenses based on multiple criteria
   */
  async removeDuplicateExpenses(): Promise<{ removed: number; remaining: number }> {
    try {
      const expenses = await offlineDB.getAll('expenses');
      console.log(`🔍 Checking ${expenses.length} expenses for duplicates...`);
      
      const duplicates = this.findDuplicateExpenses(expenses);
      
      if (duplicates.length === 0) {
        console.log('✅ No duplicate expenses found');
        return { removed: 0, remaining: expenses.length };
      }
      
      console.log(`🚨 Found ${duplicates.length} duplicate expense groups`);
      
      // Remove duplicates - keep only the first occurrence
      let removedCount = 0;
      for (const group of duplicates) {
        const duplicateItems = group.items.slice(1); // Keep first, remove rest
        
        for (const item of duplicateItems) {
          await offlineDB.softDelete('expenses', item.local_uuid);
          removedCount++;
          console.log(`❌ Removed duplicate expense: ${item.description} (${item.amount})`);
        }
      }
      
      return { 
        removed: removedCount, 
        remaining: expenses.length - removedCount 
      };
      
    } catch (error) {
      console.error('Failed to remove duplicate expenses:', error);
      return { removed: 0, remaining: 0 };
    }
  }

  /**
   * Find duplicate expenses using smart matching
   */
  private findDuplicateExpenses(expenses: any[]): Array<{ key: string; items: any[] }> {
    const groups: { [key: string]: any[] } = {};
    
    expenses.forEach(expense => {
      if (expense.deleted) return; // Skip soft-deleted items
      
      // Create a compound key for matching duplicates
      const key = `${expense.description?.toLowerCase()}_${expense.amount}_${new Date(expense.created_at).toDateString()}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(expense);
    });
    
    // Return only groups with duplicates
    return Object.entries(groups)
      .filter(([key, items]) => items.length > 1)
      .map(([key, items]) => ({ key, items }));
  }

  /**
   * Check for and remove duplicate sales
   */
  async removeDuplicateSales(): Promise<{ removed: number; remaining: number }> {
    try {
      const sales = await offlineDB.getAll('sales');
      console.log(`🔍 Checking ${sales.length} sales for duplicates...`);
      
      const duplicates = this.findDuplicateSales(sales);
      
      if (duplicates.length === 0) {
        console.log('✅ No duplicate sales found');
        return { removed: 0, remaining: sales.length };
      }
      
      console.log(`🚨 Found ${duplicates.length} duplicate sale groups`);
      
      let removedCount = 0;
      for (const group of duplicates) {
        const duplicateItems = group.items.slice(1); // Keep first, remove rest
        
        for (const item of duplicateItems) {
          await offlineDB.softDelete('sales', item.local_uuid);
          removedCount++;
          console.log(`❌ Removed duplicate sale: ${item.total} (${new Date(item.created_at).toLocaleString()})`);
        }
      }
      
      return { 
        removed: removedCount, 
        remaining: sales.length - removedCount 
      };
      
    } catch (error) {
      console.error('Failed to remove duplicate sales:', error);
      return { removed: 0, remaining: 0 };
    }
  }

  /**
   * Find duplicate sales using smart matching
   */
  private findDuplicateSales(sales: any[]): Array<{ key: string; items: any[] }> {
    const groups: { [key: string]: any[] } = {};
    
    sales.forEach(sale => {
      if (sale.deleted) return; // Skip soft-deleted items
      
      // Create a compound key for matching duplicates
      const key = `${sale.total}_${sale.payment}_${new Date(sale.created_at).getTime()}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(sale);
    });
    
    // Return only groups with duplicates (allow 1 minute tolerance for timing)
    return Object.entries(groups)
      .filter(([key, items]) => {
        if (items.length <= 1) return false;
        
        // Check if items are created within 1 minute of each other
        const times = items.map(item => new Date(item.created_at).getTime());
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        return (maxTime - minTime) < 60000; // 1 minute tolerance
      })
      .map(([key, items]) => ({ key, items }));
  }

  /**
   * Clean all duplicate data and return summary
   */
  async cleanAllDuplicates(): Promise<{ 
    expenses: { removed: number; remaining: number };
    sales: { removed: number; remaining: number };
    summary: string;
  }> {
    console.log('🧹 Starting comprehensive duplicate cleanup...');
    
    const [expenseResults, salesResults] = await Promise.all([
      this.removeDuplicateExpenses(),
      this.removeDuplicateSales()
    ]);

    const summary = `Cleanup complete: Removed ${expenseResults.removed} duplicate expenses and ${salesResults.removed} duplicate sales. Remaining: ${expenseResults.remaining} expenses, ${salesResults.remaining} sales.`;
    
    console.log(`✅ ${summary}`);
    
    return {
      expenses: expenseResults,
      sales: salesResults,
      summary
    };
  }

  /**
   * Prevent expense from being saved to both tables
   * This addresses the core double-save issue
   */
  async validateSaveOperation(table: string, data: any): Promise<{ valid: boolean; reason?: string }> {
    // Ensure expenses only go to expenses table
    if (table === 'expenses' && data.type === 'sale') {
      return { valid: false, reason: 'Sale data should not be saved to expenses table' };
    }
    
    // Ensure sales only go to sales table  
    if (table === 'sales' && data.type === 'expense') {
      return { valid: false, reason: 'Expense data should not be saved to sales table' };
    }
    
    // Check for recent duplicates
    const existingData = await offlineDB.getAll(table);
    const recentDuplicate = existingData.find(item => {
      if (table === 'expenses') {
        return item.description === data.description &&
               item.amount === data.amount &&
               Math.abs(new Date(item.created_at).getTime() - Date.now()) < 30000; // 30 second window
      } else if (table === 'sales') {
        return item.total === data.total &&
               item.payment === data.payment &&
               Math.abs(new Date(item.created_at).getTime() - Date.now()) < 30000; // 30 second window
      }
      return false;
    });
    
    if (recentDuplicate) {
      return { valid: false, reason: 'Duplicate entry detected - too similar to recent record' };
    }
    
    return { valid: true };
  }

  /**
   * Get statistics about data quality
   */
  async getDataQualityStats() {
    try {
      const [expenses, sales] = await Promise.all([
        offlineDB.getAll('expenses'),
        offlineDB.getAll('sales')
      ]);

      const expenseDuplicates = this.findDuplicateExpenses(expenses);
      const salesDuplicates = this.findDuplicateSales(sales);
      
      return {
        expenses: {
          total: expenses.length,
          active: expenses.filter(e => !e.deleted).length,
          duplicateGroups: expenseDuplicates.length,
          pending: expenses.filter(e => e.sync_status === 'pending').length
        },
        sales: {
          total: sales.length,
          active: sales.filter(s => !s.deleted).length,
          duplicateGroups: salesDuplicates.length,
          pending: sales.filter(s => s.sync_status === 'pending').length
        }
      };
    } catch (error) {
      console.error('Failed to get data quality stats:', error);
      return null;
    }
  }
}

export const dataDeduplicationService = new DataDeduplicationService();

// Export convenience functions
export const cleanDuplicates = () => dataDeduplicationService.cleanAllDuplicates();
export const validateSave = (table: string, data: any) => dataDeduplicationService.validateSaveOperation(table, data);
export const getDataStats = () => dataDeduplicationService.getDataQualityStats();