import React, { useState, useEffect } from 'react';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  period: string;
  icon: string;
  color: string;
}

interface QuickGoalsProps {
  totalRevenue: number;
  transactions: number;
}

const QuickGoals: React.FC<QuickGoalsProps> = ({ totalRevenue, transactions }) => {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    // Create dynamic goals based on current performance
    const weeklyRevenueTarget = Math.max(10000, totalRevenue * 1.2); // 20% growth target
    const dailyTransactionTarget = Math.max(10, Math.ceil(transactions / 7) + 3); // +3 transactions per day

    const currentGoals: Goal[] = [
      {
        id: '1',
        title: 'Weekly Revenue',
        target: weeklyRevenueTarget,
        current: totalRevenue,
        period: 'This Week',
        icon: '🎯',
        color: 'emerald'
      },
      {
        id: '2',
        title: 'Daily Transactions',
        target: dailyTransactionTarget,
        current: Math.ceil(transactions / 7),
        period: 'Per Day',
        icon: '🚀',
        color: 'blue'
      },
      {
        id: '3',
        title: 'Customer Growth',
        target: 50,
        current: Math.min(50, transactions * 2), // Estimate customers
        period: 'This Month',
        icon: '👥',
        color: 'purple'
      }
    ];

    setGoals(currentGoals);
  }, [totalRevenue, transactions]);

  const getProgressPercentage = (current: number, target: number): number => {
    return Math.min(100, (current / target) * 100);
  };

  const getColorClasses = (color: string, percentage: number) => {
    const baseColors = {
      emerald: {
        bg: 'bg-emerald-500',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20'
      },
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-400',
        border: 'border-blue-500/20'
      },
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-400',
        border: 'border-purple-500/20'
      }
    };

    return baseColors[color as keyof typeof baseColors] || baseColors.emerald;
  };

  return (
    <div className="modern-card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
        🏆 Quick Goals
      </h3>

      <div className="space-y-4">
        {goals.map((goal) => {
          const percentage = getProgressPercentage(goal.current, goal.target);
          const colors = getColorClasses(goal.color, percentage);
          const isComplete = percentage >= 100;

          return (
            <div key={goal.id} className={`border rounded-lg p-4 transition-all duration-300 ${colors.border} ${isComplete ? 'bg-green-500/5' : 'bg-gray-800/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{goal.icon}</span>
                  <div>
                    <h4 className="font-medium text-text-primary text-sm">{goal.title}</h4>
                    <p className="text-xs text-text-secondary">{goal.period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${colors.text}`}>
                    {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${colors.bg} ${isComplete ? 'animate-pulse' : ''}`}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                ></div>
              </div>

              {/* Status */}
              <div className="mt-2 text-xs">
                {isComplete ? (
                  <span className="text-green-400 font-medium">🎉 Goal achieved!</span>
                ) : percentage > 75 ? (
                  <span className="text-yellow-400 font-medium">🔥 Almost there!</span>
                ) : percentage > 50 ? (
                  <span className="text-blue-400 font-medium">📈 Good progress</span>
                ) : (
                  <span className="text-gray-400">💪 Keep going</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="mt-4 p-3 bg-gradient-to-r from-emerald-900/20 to-blue-900/20 rounded-lg border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Overall Progress</span>
          <span className="text-sm font-bold text-emerald-400">
            {(goals.reduce((acc, goal) => acc + getProgressPercentage(goal.current, goal.target), 0) / goals.length).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000"
            style={{
              width: `${goals.reduce((acc, goal) => acc + getProgressPercentage(goal.current, goal.target), 0) / goals.length}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default QuickGoals;