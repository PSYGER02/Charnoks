import React, { useState, useRef, useEffect } from 'react';
import RevolutionaryChart from './RevolutionaryChart';

interface DashboardData {
  kpis: {
    title: string;
    value: string;
    change: number;
    icon: string;
    color: string;
  }[];
  charts: {
    id: string;
    title: string;
    type: 'bar' | 'line' | 'pie' | 'area';
    data: any[];
    span: 'full' | 'half' | 'third';
  }[];
}

interface RevolutionaryDashboardProps {
  data: DashboardData;
  theme?: string;
  layout?: 'grid' | 'masonry' | 'flex';
  glassmorphism?: boolean;
  className?: string;
}

const RevolutionaryDashboard: React.FC<RevolutionaryDashboardProps> = ({
  data,
  theme = 'charnoks-premium',
  layout = 'grid',
  glassmorphism = true,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [gridLayout, setGridLayout] = useState(layout);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Sample enhanced data
  const enhancedData: DashboardData = {
    kpis: [
      {
        title: 'Total Revenue',
        value: '$847,293',
        change: 12.5,
        icon: '💰',
        color: 'from-green-500 to-emerald-600'
      },
      {
        title: 'Active Users',
        value: '34,521',
        change: 8.2,
        icon: '👥',
        color: 'from-blue-500 to-cyan-600'
      },
      {
        title: 'Conversion Rate',
        value: '3.47%',
        change: -2.1,
        icon: '📈',
        color: 'from-purple-500 to-indigo-600'
      },
      {
        title: 'Performance Score',
        value: '94.2',
        change: 5.8,
        icon: '⚡',
        color: 'from-orange-500 to-red-600'
      }
    ],
    charts: [
      {
        id: 'revenue-trend',
        title: 'Revenue Trend',
        type: 'area',
        span: 'full',
        data: [
          { name: 'Jan', value: 145000 },
          { name: 'Feb', value: 183000 },
          { name: 'Mar', value: 165000 },
          { name: 'Apr', value: 198000 },
          { name: 'May', value: 220000 },
          { name: 'Jun', value: 247000 }
        ]
      },
      {
        id: 'sales-performance',
        title: 'Sales Performance',
        type: 'bar',
        span: 'half',
        data: [
          { name: 'Product A', value: 45000 },
          { name: 'Product B', value: 52000 },
          { name: 'Product C', value: 48000 },
          { name: 'Product D', value: 61000 }
        ]
      },
      {
        id: 'user-segments',
        title: 'User Segments',
        type: 'pie',
        span: 'half',
        data: [
          { name: 'Premium', value: 35 },
          { name: 'Standard', value: 45 },
          { name: 'Free', value: 20 }
        ]
      },
      {
        id: 'growth-metrics',
        title: 'Growth Metrics',
        type: 'line',
        span: 'third',
        data: [
          { name: 'Week 1', value: 85 },
          { name: 'Week 2', value: 92 },
          { name: 'Week 3', value: 78 },
          { name: 'Week 4', value: 96 }
        ]
      }
    ]
  };

  const dashboardData = data || enhancedData;

  // Layout classes
  const getLayoutClasses = () => {
    switch (gridLayout) {
      case 'masonry':
        return 'columns-1 lg:columns-2 xl:columns-3 gap-6';
      case 'flex':
        return 'flex flex-wrap gap-6';
      default:
        return 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6';
    }
  };

  const getChartSpanClasses = (span: string) => {
    if (gridLayout === 'masonry') return 'break-inside-avoid mb-6';
    if (gridLayout === 'flex') {
      switch (span) {
        case 'full': return 'w-full';
        case 'half': return 'w-full lg:w-[calc(50%-12px)]';
        case 'third': return 'w-full lg:w-[calc(33.333%-16px)]';
        default: return 'w-full lg:w-[calc(50%-12px)]';
      }
    }
    
    // Grid layout
    switch (span) {
      case 'full': return 'lg:col-span-2 xl:col-span-3';
      case 'half': return 'lg:col-span-1 xl:col-span-1';
      case 'third': return 'lg:col-span-1 xl:col-span-1';
      default: return 'lg:col-span-1 xl:col-span-1';
    }
  };

  return (
    <div 
      ref={dashboardRef}
      className={`
        revolutionary-dashboard relative
        ${glassmorphism ? 'bg-gradient-to-br from-background/90 via-background/80 to-background/90' : 'bg-background'}
        ${isFullscreen ? 'fixed inset-0 z-50 p-6 overflow-auto' : ''}
        ${className}
      `}
    >
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="animate-slide-in-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-text-secondary mt-2 text-lg">
            Real-time business insights and performance metrics
          </p>
        </div>

        {/* Dashboard Controls */}
        <div className="flex items-center gap-4 animate-slide-in-right">
          {/* Layout Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGridLayout('grid')}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                ${gridLayout === 'grid' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary hover:bg-glass-light/50'
                }
              `}
              title="Grid Layout"
            >
              ⊞
            </button>
            
            <button
              onClick={() => setGridLayout('masonry')}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                ${gridLayout === 'masonry' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary hover:bg-glass-light/50'
                }
              `}
              title="Masonry Layout"
            >
              ⊟
            </button>
            
            <button
              onClick={() => setGridLayout('flex')}
              className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                ${gridLayout === 'flex' 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary hover:bg-glass-light/50'
                }
              `}
              title="Flex Layout"
            >
              ⊡
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-8 h-8 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-glass-light/50 transition-all duration-300"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '⤢' : '⤡'}
          </button>

          {/* Refresh Button */}
          <button className="w-8 h-8 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-glass-light/50 transition-all duration-300 hover:rotate-180">
            🔄
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardData.kpis.map((kpi, index) => (
          <div
            key={kpi.title}
            className={`
              glass-card-premium p-6 rounded-xl border border-glass-border/40
              bg-gradient-to-br from-glass-light/30 via-glass-light/20 to-transparent
              backdrop-blur-xl shadow-glass-3 hover:shadow-glass-4
              transition-all duration-500 hover:scale-105
              animate-slide-in-up
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center text-xl
                  bg-gradient-to-br ${kpi.color} shadow-lg
                `}
              >
                {kpi.icon}
              </div>
              
              <div className={`
                flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                ${kpi.change > 0 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }
              `}>
                {kpi.change > 0 ? '↗' : '↘'} {Math.abs(kpi.change)}%
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-text-primary mb-1">
                {kpi.value}
              </div>
              <div className="text-sm text-text-secondary">
                {kpi.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className={getLayoutClasses()}>
        {dashboardData.charts.map((chart, index) => (
          <div
            key={chart.id}
            className={`
              ${getChartSpanClasses(chart.span)}
              animate-slide-in-up
            `}
            style={{ animationDelay: `${(index + 4) * 150}ms` }}
          >
            <RevolutionaryChart
              type={chart.type}
              data={chart.data}
              theme={theme}
              glassmorphism={glassmorphism}
              interactive={true}
              title={chart.title}
              height={chart.span === 'full' ? 400 : 350}
              className={`
                cursor-pointer transition-all duration-300
                ${selectedChart === chart.id ? 'ring-2 ring-primary-500/50 scale-105' : ''}
              `}
            />
          </div>
        ))}
      </div>

      {/* Dashboard Stats Footer */}
      <div className="mt-12 flex flex-col lg:flex-row items-center justify-between gap-6 pt-8 border-t border-glass-border/30">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm text-text-secondary">Last Updated</div>
            <div className="font-medium text-text-primary">2 minutes ago</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-text-secondary">Data Points</div>
            <div className="font-medium text-text-primary">
              {dashboardData.charts.reduce((acc, chart) => acc + chart.data.length, 0)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-text-secondary">Performance</div>
            <div className="font-medium text-green-500">Excellent</div>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-text-secondary">Live Dashboard</span>
        </div>
      </div>
    </div>
  );
};

export default RevolutionaryDashboard;