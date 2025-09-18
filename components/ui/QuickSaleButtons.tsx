import React, { useState } from 'react';
import { unifiedDataService } from '../../services/unifiedDataService';
import { useAuth } from '../../hooks/useSupabaseAuth';
import ConnectionStatus from './ConnectionStatus';

interface QuickSaleButtonsProps {
  products?: Array<{ id: string; name: string; price: number; stock: number }>;
  onSaleComplete?: (sale: any) => void;
  workerName?: string;
}

const QuickSaleButtons: React.FC<QuickSaleButtonsProps> = ({
  onSaleComplete,
  className = ''
}) => {
  const { user } = useAuth();
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleQuickSale = async (saleData: any) => {    try {
      const workerName = user?.email?.split('@')[0] || 'Worker';

      // Use unified service for all data operations
      if (saleData.type === 'expense') {
        // Save as expense
        const result = await unifiedDataService.saveExpense({
          description: saleData.description,
          amount: saleData.total,
          category: saleData.category || 'supplies',
          worker_name: workerName
        });
        
        if (result.success) {
          onSaleComplete?.({ ...saleData, id: result.id });
          console.log(`✅ ${saleData.description} recorded${result.offline ? ' offline' : ''}`);
        }
      } else {
        // Save as sale
        const result = await unifiedDataService.saveSale({
          description: saleData.description,
          total: saleData.total,
          items: saleData.items || [{ name: saleData.description, quantity: 1, price: saleData.total }],
          payment: saleData.total,
          change_due: 0,
          payment_method: 'cash',
          worker_name: workerName
        });
        
        if (result.success) {
          onSaleComplete?.({ ...saleData, id: result.id });
          console.log(`✅ ${saleData.description} recorded${result.offline ? ' offline' : ''}`);
        }
      }

    } catch (error) {
      console.error('❌ Failed to record transaction:', error);
    }
  };  const quickSales = [
    {
      type: 'sale',
      description: 'Quick Sale: 10 pieces × ₱35',
      items: [{ name: 'Chicken Pieces', quantity: 10, price: 35 }],
      total: 350,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      type: 'sale', 
      description: 'Quick Sale: 20 pieces × ₱35',
      items: [{ name: 'Chicken Pieces', quantity: 20, price: 35 }],
      total: 700,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      type: 'sale',
      description: 'Neck Sale: 10 pieces × ₱15',
      items: [{ name: 'Chicken Neck', quantity: 10, price: 15 }],
      total: 150,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      type: 'expense',
      description: 'Gas Expense: ₱500',
      items: [],
      total: 500,
      category: 'utilities',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      type: 'expense',
      description: 'Supply Expense: ₱200',
      items: [],
      total: 200,
      category: 'supplies',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">💰 Quick Transactions</h3>
      <p className="text-sm text-text-secondary">
        Record common sales and expenses instantly
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickSales.map((sale, index) => (
          <button
            key={index}
            onClick={() => handleQuickSale(sale)}
            disabled={isLoading === sale.description}
            className={`
              ${sale.color} 
              text-white font-medium px-4 py-4 rounded-lg 
              transition-all duration-200 
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              text-left
            `}
          >
            {isLoading === sale.description ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Recording...</span>
              </div>
            ) : (
              <>
                <div className="font-bold text-sm">{sale.description}</div>
                <div className="text-xs opacity-90 mt-1">
                  {sale.type === 'sale' ? '📈 Revenue' : '📉 Expense'} • ₱{sale.total}
                </div>
                {sale.items.length > 0 && (
                  <div className="text-xs opacity-75 mt-1">
                    {sale.items.map(item => `${item.quantity}× ${item.name}`).join(', ')}
                  </div>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Custom Amount Button */}
      <button
        onClick={() => {
          const amount = prompt('Enter custom sale amount (₱):');
          if (amount && !isNaN(Number(amount))) {
            handleQuickSale({
              type: 'sale',
              description: `Custom Sale: ₱${amount}`,
              items: [{ name: 'Custom Item', quantity: 1, price: Number(amount) }],
              total: Number(amount)
            });
          }
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200"
      >
        ➕ Custom Amount Sale
      </button>

      <div className="text-xs text-text-secondary">
        💡 All transactions saved offline first, synced automatically when online
      </div>
    </div>
  );
};

export default QuickSaleButtons;