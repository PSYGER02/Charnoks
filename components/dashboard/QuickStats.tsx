import React, { useState, useEffect } from 'react';

interface QuickStatsProps {
  totalRevenue: number;
  transactions: number;
  netProfit: number;
}

const QuickStats: React.FC<QuickStatsProps> = ({ totalRevenue, transactions, netProfit }) => {
  const [animatedRevenue, setAnimatedRevenue] = useState(0);
  const [animatedTransactions, setAnimatedTransactions] = useState(0);
  const [animatedProfit, setAnimatedProfit] = useState(0);

  useEffect(() => {
    // Animate numbers counting up
    const animateValue = (start: number, end: number, setter: (value: number) => void, duration: number = 1000) => {
      const range = end - start;
      const increment = range / (duration / 16);
      let current = start;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          current = end;
          clearInterval(timer);
        }
        setter(Math.floor(current));
      }, 16);
    };

    animateValue(0, totalRevenue, setAnimatedRevenue, 1200);
    animateValue(0, transactions, setAnimatedTransactions, 800);
    animateValue(0, netProfit, setAnimatedProfit, 1000);
  }, [totalRevenue, transactions, netProfit]);

  return (
    <div className="modern-card p-6 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
        ⚡ Live Business Pulse
      </h3>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Revenue Indicator */}
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-2 shadow-lg animate-pulse">
              <span className="text-2xl">💰</span>
            </div>
            {totalRevenue > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
            )}
          </div>
          <div className="text-xl font-bold text-emerald-400">₱{animatedRevenue.toLocaleString()}</div>
          <div className="text-xs text-text-secondary">Total Revenue</div>
        </div>

        {/* Transactions Indicator */}
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl">🛍️</span>
            </div>
            {transactions > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {transactions > 99 ? '99+' : transactions}
              </div>
            )}
          </div>
          <div className="text-xl font-bold text-blue-400">{animatedTransactions}</div>
          <div className="text-xs text-text-secondary">Transactions</div>
        </div>

        {/* Profit Indicator */}
        <div className="text-center">
          <div className="relative">
            <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${netProfit >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'} flex items-center justify-center mb-2 shadow-lg`}>
              <span className="text-2xl">{netProfit >= 0 ? '📈' : '📉'}</span>
            </div>
          </div>
          <div className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ₱{animatedProfit.toLocaleString()}
          </div>
          <div className="text-xs text-text-secondary">Net Profit</div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 text-center">
        {totalRevenue === 0 ? (
          <div className="text-sm text-yellow-400 bg-yellow-400/10 rounded-lg p-2">
            🚀 Ready to start tracking your business!
          </div>
        ) : (
          <div className="text-sm text-green-400 bg-green-400/10 rounded-lg p-2">
            ✨ Business is active and growing!
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickStats;