/**
 * Debug script to check IndexedDB content and identify double expense issue
 */

import { offlineDB } from './services/offlineService';

async function debugIndexedDB() {
  try {
    await offlineDB.init();
    console.log('🔍 IndexedDB Debug Analysis');
    
    // Get all expenses
    const expenses = await offlineDB.getAll('expenses');
    console.log(`📊 Total expenses in IndexedDB: ${expenses.length}`);
    
    if (expenses.length > 0) {
      console.log('🔍 First 5 expense records:');
      expenses.slice(0, 5).forEach((expense, index) => {
        console.log(`${index + 1}.`, {
          id: expense.id,
          local_uuid: expense.local_uuid,
          description: expense.description,
          amount: expense.amount,
          sync_status: expense.sync_status,
          created_at: expense.created_at
        });
      });
      
      // Check for potential duplicates
      const duplicates = findDuplicateExpenses(expenses);
      if (duplicates.length > 0) {
        console.log('🚨 Potential duplicate expenses found:');
        duplicates.forEach(dup => {
          console.log(`  - ${dup.description} (${dup.amount}) appears ${dup.count} times`);
        });
      } else {
        console.log('✅ No duplicate expenses found in IndexedDB');
      }
    }

    // Get all sales
    const sales = await offlineDB.getAll('sales');
    console.log(`📊 Total sales in IndexedDB: ${sales.length}`);
    
    if (sales.length > 0) {
      console.log('🔍 First 5 sales records:');
      sales.slice(0, 5).forEach((sale, index) => {
        console.log(`${index + 1}.`, {
          id: sale.id,
          local_uuid: sale.local_uuid,
          total: sale.total,
          sync_status: sale.sync_status,
          created_at: sale.created_at
        });
      });
    }

    // Check pending sync status
    const pendingExpenses = await offlineDB.getPending('expenses');
    const pendingSales = await offlineDB.getPending('sales');
    
    console.log(`🔄 Pending sync: ${pendingExpenses.length} expenses, ${pendingSales.length} sales`);
    
    return {
      expenses: expenses.length,
      sales: sales.length,
      pendingExpenses: pendingExpenses.length,
      pendingSales: pendingSales.length
    };

  } catch (error) {
    console.error('❌ IndexedDB debug failed:', error);
    return null;
  }
}

function findDuplicateExpenses(expenses: any[]) {
  const groups: { [key: string]: number } = {};
  
  expenses.forEach(expense => {
    const key = `${expense.description}_${expense.amount}`;
    groups[key] = (groups[key] || 0) + 1;
  });
  
  return Object.entries(groups)
    .filter(([key, count]) => count > 1)
    .map(([key, count]) => {
      const [description, amount] = key.split('_');
      return { description, amount: parseFloat(amount), count };
    });
}

// Export for use in browser console or other modules
export { debugIndexedDB };

// Auto-run if this file is loaded directly
if (typeof window !== 'undefined' && window.location) {
  window.debugIndexedDB = debugIndexedDB;
  console.log('💡 Debug function available: window.debugIndexedDB()');
}