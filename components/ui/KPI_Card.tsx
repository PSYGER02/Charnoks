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
  const [isHovered, setIsHovered] = React.useState(false);
  const [animationProgress, setAnimationProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(100);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const getTrendColor = () => {
    if (!trend || !trendDirection) return 'text-gray-400';
    return trendDirection === 'up' ? 'text-green-400' : 'text-red-400';
  };

  const getTrendBackground = () => {
    if (!trend || !trendDirection) return 'bg-gray-500/10 border-gray-500/20';
    return trendDirection === 'up' 
      ? 'bg-green-500/15 border-green-500/30' 
      : 'bg-red-500/15 border-red-500/30';
  };

  // Enhanced sparkline with revolutionary design
  const renderRevolutionarySparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    
    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    
    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * 80;
      const y = 30 - ((value - min) / range) * 25;
      return `${x},${y}`;
    }).join(' ');

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="relative">
        <svg width="80" height="30" className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={trendDirection === 'up' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} stopOpacity="0.8"/>
              <stop offset="100%" stopColor={trendDirection === 'up' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'} stopOpacity="0.2"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Glow effect background */}
          <polyline
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="3"
            points={points}
            filter="url(#glow)"
            opacity="0.6"
          />
          
          {/* Main line */}
          <polyline
            fill="none"
            stroke={trendDirection === 'up' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
            strokeWidth="2"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: '100',
              strokeDashoffset: isHovered ? '0' : '100',
              transition: 'stroke-dashoffset 1s ease-out'
            }}
          />
          
          {/* Data points */}
          {sparklineData.map((value, index) => {
            const x = (index / (sparklineData.length - 1)) * 80;
            const y = 30 - ((value - min) / range) * 25;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={trendDirection === 'up' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                className="animate-pulse"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div 
      className={`
        revolutionary-kpi-card group relative
        glass-card-premium p-6 
        border border-glass-border/40 
        bg-gradient-to-br from-glass-light/30 via-glass-light/20 to-glass-light/10 
        backdrop-blur-2xl shadow-glass-3 rounded-2xl
        transition-all duration-500 ease-out-quart
        hover:scale-102 hover:shadow-glass-4
        ${isHovered ? 'scale-102 shadow-glass-4' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 space-y-2">
          <h3 className="text-xs font-bold text-text-secondary/80 uppercase tracking-wider leading-none">
            {title}
          </h3>
          
          {/* Animated Value Counter */}
          <div className="relative">
            <p className="text-4xl font-bold text-text-primary leading-none">
              {value}
            </p>
            
            {/* Value glow effect */}
            <div className={`
              absolute inset-0 text-4xl font-bold text-text-primary leading-none
              transition-opacity duration-500
              ${isHovered ? 'opacity-20' : 'opacity-0'}
              filter blur-sm
            `}>
              {value}
            </div>
          </div>
        </div>
        
        {/* Revolutionary Icon Container */}
        <div className={`
          w-14 h-14 rounded-2xl 
          bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10
          border border-primary/40
          flex items-center justify-center 
          transition-all duration-500 ease-out-quart
          ${isHovered ? 'scale-110 rotate-6 shadow-glass-3' : ''}
          relative overflow-hidden
        `}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 animate-gradient-x"></div>
          <span className="text-2xl relative z-10 filter drop-shadow-sm">{icon}</span>
        </div>
      </div>
      
      {/* Bottom Section with Trend and Sparkline */}
      <div className="flex items-center justify-between">
        {/* Revolutionary Trend Indicator */}
        {trend && (
          <div className={`
            flex items-center gap-2 px-3 py-2 rounded-xl
            border backdrop-blur-xl
            ${getTrendBackground()}
            transition-all duration-300 ease-out-quart
            ${isHovered ? 'scale-105' : ''}
          `}>
            <div className={`
              w-4 h-4 rounded-full flex items-center justify-center
              ${trendDirection === 'up' ? 'bg-green-400' : 'bg-red-400'}
              text-white text-xs font-bold
            `}>
              {trendDirection === 'up' ? '↗' : '↘'}
            </div>
            <span className={`text-sm font-bold ${getTrendColor()}`}>
              {trend}
            </span>
          </div>
        )}
        
        {/* Revolutionary Sparkline */}
        <div className="flex-1 flex justify-end">
          {renderRevolutionarySparkline()}
        </div>
      </div>

      {/* Revolutionary Hover Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out-cubic rounded-2xl pointer-events-none"></div>
      
      {/* Smart Glow Effect */}
      <div className={`
        absolute inset-0 rounded-2xl pointer-events-none
        transition-opacity duration-500
        ${isHovered ? 'opacity-100' : 'opacity-0'}
        bg-gradient-to-r from-primary/5 via-accent/3 to-primary/5
        blur-xl -z-10
      `}></div>
      
      {/* Performance Animation Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-accent rounded-b-2xl transition-all duration-1000 ease-out-quart"
           style={{ width: `${animationProgress}%` }}>
      </div>
    </div>
  );
};

export default KPICard;