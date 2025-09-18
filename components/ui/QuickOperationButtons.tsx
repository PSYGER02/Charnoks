import React, { useState } from 'react';
import { offlineDB } from '../../services/offlineService';

interface QuickOperationButtonsProps {
  onOperationComplete?: (operation: any) => void;
  userRole?: 'owner' | 'worker';
}

const QuickOperationButtons: React.FC<QuickOperationButtonsProps> = ({ 
  onOperationComplete, 
  userRole = 'owner' 
}) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleQuickOperation = async (operation: any) => {
    setIsLoading(operation.type);
    
    try {
      // Save directly to IndexedDB for instant feedback
      const operationRecord = {
        local_uuid: crypto.randomUUID(),
        type: operation.type,
        data: operation.data,
        timestamp: new Date().toISOString(),
        worker_id: userRole, // You'll want to get actual user ID
        sync_status: 'pending'
      };

      await offlineDB.save('operations', operationRecord);
      
      // Also create a note record for context
      const noteRecord = {
        content: operation.description,
        user_role: userRole,
        parsed_operations: [operationRecord],
        status: 'parsed',
        sync_status: 'pending'
      };

      await offlineDB.save('notes', noteRecord);

      onOperationComplete?.(operationRecord);
      
      // Show success feedback
      // You can integrate with your existing toast/notification system
      console.log(`✅ ${operation.description} saved offline`);
      
    } catch (error) {
      console.error('❌ Failed to save operation:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const quickOperations = [
    {
      type: 'cook',
      label: '👨‍🍳 Cook 1 Bag',
      description: 'Cooked 1 bag (40 pieces)',
      data: { bags: 1, pieces: 40 },
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      type: 'cook',
      label: '👨‍🍳 Cook 5 Bags',
      description: 'Cooked 5 bags (200 pieces)',
      data: { bags: 5, pieces: 200 },
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      type: 'sale',
      label: '💰 Quick Sale',
      description: 'Sold 20 pieces at 35 pesos each',
      data: { pieces: 20, price_per_piece: 35, total: 700 },
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      type: 'transfer',
      label: '🚚 Send to Branch',
      description: 'Transferred 3 bags to branch',
      data: { bags: 3, to_branch: 'Branch 1' },
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      type: 'purchase',
      label: '📦 Receive Stock',
      description: 'Received 20 bags from supplier',
      data: { bags: 20, supplier: 'Main Supplier' },
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      type: 'waste',
      label: '🗑️ Mark Waste',
      description: 'Marked 5 pieces as waste',
      data: { pieces: 5, reason: 'Spoiled' },
      color: 'bg-red-600 hover:bg-red-700'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">⚡ Quick Operations</h3>
      <p className="text-sm text-text-secondary">
        Instantly record common operations. All data saved offline first.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickOperations.map((op, index) => (
          <button
            key={index}
            onClick={() => handleQuickOperation(op)}
            disabled={isLoading === op.type}
            className={`
              ${op.color} 
              text-white font-medium px-4 py-3 rounded-lg 
              transition-all duration-200 
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              text-sm text-center
            `}
          >
            {isLoading === op.type ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <div className="font-bold">{op.label}</div>
                <div className="text-xs opacity-90 mt-1">{op.data.bags && `${op.data.bags} bags`}{op.data.pieces && ` ${op.data.pieces} pcs`}</div>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="text-xs text-text-secondary">
        💡 All operations saved instantly to local storage and synced when online
      </div>
    </div>
  );
};

export default QuickOperationButtons;