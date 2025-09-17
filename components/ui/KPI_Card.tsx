import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down';
  sparklineData?: number[];
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, trendDirection, sparklineData }) => {
  const trendColor = trend && trendDirection ? (trendDirection === 'up' ? 'status-positive' : 'status-negative') : 'status-neutral';

  // Simple sparkline SVG
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    
    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * 60;
      const y = 20 - ((value - min) / range) * 15;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="60" height="20" className="opacity-60">
        <polyline
          fill="none"
          stroke={trendDirection === 'up' ? 'rgb(34, 197, 94)' : trendDirection === 'down' ? 'rgb(239, 68, 68)' : 'rgb(156, 163, 175)'}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="kpi-card hover-shimmer relative group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{title}</h3>
          <p className="text-3xl font-bold text-text-primary leading-none">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="text-xl">{icon}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trendColor}`}>
            <span className="mr-1.5 text-xs">{trendDirection === 'up' ? '▲' : '▼'}</span>
            <span>{trend}</span>
          </div>
        )}
        {renderSparkline()}
      </div>
    </div>
  );
};

export default KPICard;