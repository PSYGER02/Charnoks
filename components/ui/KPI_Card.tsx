import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, trendDirection }) => {
  const trendColor = trendDirection === 'up' ? 'status-positive' : 'status-negative';

  return (
    <div className="kpi-card hover-shimmer relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</h3>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <span className="text-lg">{icon}</span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trendColor}`}>
            <span className="mr-1.5 text-xs">{trendDirection === 'up' ? '▲' : '▼'}</span>
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;