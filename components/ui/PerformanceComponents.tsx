import React from 'react';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<any>;
}

interface QuickStatsGridProps {
  stats: StatItem[];
}

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({ stats }) => {
  return (
    <div className="modern-card p-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">📊 Quick Stats</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <IconComponent className="w-5 h-5 text-blue-400" />
                <span className={`text-sm font-medium ${stat.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change >= 0 ? '+' : ''}{stat.change}%
                </span>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-text-secondary">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ProgressIndicatorProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  label,
  value,
  max = 100,
  color = '#059669'
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="modern-card p-6">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-text-primary">{label}</h4>
        <span className="text-sm text-text-secondary">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      <div className="text-right mt-1">
        <span className="text-sm font-medium text-text-primary">{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
};

interface ActivityItem {
  time: string;
  title: string;
  description: string;
  type: 'sale' | 'worker' | 'system' | 'note';
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return '💰';
      case 'worker': return '👷';
      case 'system': return '⚙️';
      case 'note': return '📝';
      default: return '📋';
    }
  };

  return (
    <div className="modern-card p-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">🕒 Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="text-lg">{getActivityIcon(activity.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary">{activity.title}</p>
                <p className="text-xs text-text-secondary">{activity.time}</p>
              </div>
              <p className="text-sm text-text-secondary mt-1">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PerformanceRanking: React.FC<{
  totalRevenue: number;
  netProfit: number;
  transactions: number;
  salesTrend: any[];
}> = () => {
  return (
    <div className="modern-card p-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">🏆 Performance Ranking</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">#1</div>
          <div className="text-sm text-text-secondary">Revenue Leader</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">#2</div>
          <div className="text-sm text-text-secondary">Profit Margin</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">#3</div>
          <div className="text-sm text-text-secondary">Transaction Volume</div>
        </div>
      </div>
    </div>
  );
};
