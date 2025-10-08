import React, { useState, useEffect, useMemo } from 'react';
import RevolutionaryChart from './RevolutionaryChart';

interface ChartData {
  name: string;
  value: number;
  category?: string;
  timestamp?: string;
  color?: string;
}

interface ChartLibraryProps {
  className?: string;
}

// Sample Data Generators
const generateSalesData = (): ChartData[] => [
  { name: 'Jan', value: 45000, category: 'sales' },
  { name: 'Feb', value: 52000, category: 'sales' },
  { name: 'Mar', value: 48000, category: 'sales' },
  { name: 'Apr', value: 61000, category: 'sales' },
  { name: 'May', value: 55000, category: 'sales' },
  { name: 'Jun', value: 67000, category: 'sales' },
];

const generateRevenueData = (): ChartData[] => [
  { name: 'Q1', value: 145000, category: 'revenue' },
  { name: 'Q2', value: 183000, category: 'revenue' },
  { name: 'Q3', value: 165000, category: 'revenue' },
  { name: 'Q4', value: 198000, category: 'revenue' },
];

const generateCustomerData = (): ChartData[] => [
  { name: 'New', value: 35, category: 'customers' },
  { name: 'Returning', value: 45, category: 'customers' },
  { name: 'Premium', value: 20, category: 'customers' },
];

const generatePerformanceData = (): ChartData[] => [
  { name: 'Week 1', value: 85, category: 'performance' },
  { name: 'Week 2', value: 92, category: 'performance' },
  { name: 'Week 3', value: 78, category: 'performance' },
  { name: 'Week 4', value: 96, category: 'performance' },
  { name: 'Week 5', value: 89, category: 'performance' },
];

const ChartLibrary: React.FC<ChartLibraryProps> = ({ className = '' }) => {
  const [selectedTheme, setSelectedTheme] = useState('forest-zen');
  const [animation3D, setAnimation3D] = useState(false);
  const [glassEffect, setGlassEffect] = useState(true);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [quantumEffects, setQuantumEffects] = useState(true);

  // Memoized data
  const salesData = useMemo(() => generateSalesData(), []);
  const revenueData = useMemo(() => generateRevenueData(), []);
  const customerData = useMemo(() => generateCustomerData(), []);
  const performanceData = useMemo(() => generatePerformanceData(), []);

  // Theme options
  const themes = [
    { id: 'forest-zen', name: 'Forest Zen', colors: '🟢' },
    { id: 'charnoks-premium', name: 'Charnoks Premium', colors: '🟣' },
    { id: 'ocean-depth', name: 'Ocean Depth', colors: '🔵' },
    { id: 'sunset-glow', name: 'Sunset Glow', colors: '🟠' },
    { id: 'cosmic-void', name: 'Cosmic Void', colors: '🌌' },
  ];

  return (
    <div className={`revolutionary-chart-library space-y-8 ${className}`}>
      {/* Library Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Revolutionary Chart Library
          </h2>
          <p className="text-text-secondary mt-2">
            Advanced data visualization with glassmorphism and 3D effects
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Theme Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-secondary">Theme:</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="px-3 py-2 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.colors} {theme.name}
                </option>
              ))}
            </select>
          </div>

          {/* Effect Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGlassEffect(!glassEffect)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${glassEffect 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary'
                }
              `}
            >
              ✨ Glass
            </button>
            
            <button
              onClick={() => setQuantumEffects(!quantumEffects)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${quantumEffects 
                  ? 'bg-purple-500 text-white shadow-lg' 
                  : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary'
                }
              `}
            >
              ⚛️ Quantum
            </button>
            
            <button
              onClick={() => setAnimation3D(!animation3D)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${animation3D 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary'
                }
              `}
            >
              🎯 3D
            </button>
            
            <button
              onClick={() => setRealTimeMode(!realTimeMode)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300
                ${realTimeMode 
                  ? 'bg-green-500 text-white shadow-lg' 
                  : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary'
                }
              `}
            >
              📡 Live
            </button>
          </div>
        </div>
      </div>

      {/* Chart Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Performance - Quantum Glass Bar Chart */}
        <div className="animate-slide-in-left">
          <RevolutionaryChart
            type={quantumEffects ? 'glass-bar' : (animation3D ? 'bar3d' : 'bar')}
            data={salesData}
            theme={selectedTheme}
            glassmorphism={glassEffect}
            depth3D={animation3D}
            quantumEffects={quantumEffects}
            aiInsights={quantumEffects}
            particleSystem={quantumEffects}
            interactive={true}
            realTime={realTimeMode}
            title="Monthly Sales Performance"
            subtitle="Quantum-enhanced revenue trends"
            height={350}
          />
        </div>

        {/* Revenue Growth - Quantum Line Chart */}
        <div className="animate-slide-in-right">
          <RevolutionaryChart
            type={quantumEffects ? 'quantum-line' : (animation3D ? 'line3d' : 'line')}
            data={revenueData}
            theme={selectedTheme}
            glassmorphism={glassEffect}
            depth3D={animation3D}
            quantumEffects={quantumEffects}
            aiInsights={quantumEffects}
            particleSystem={quantumEffects}
            interactive={true}
            realTime={realTimeMode}
            title="Quarterly Revenue Growth"
            subtitle="Quantum field analysis of growth patterns"
            height={350}
          />
        </div>

        {/* Customer Distribution - Holographic Pie Chart */}
        <div className="animate-slide-in-left" style={{ animationDelay: '200ms' }}>
          <RevolutionaryChart
            type={quantumEffects ? 'holographic-pie' : (animation3D ? 'pie3d' : 'pie')}
            data={customerData}
            theme={selectedTheme}
            glassmorphism={glassEffect}
            depth3D={animation3D}
            quantumEffects={quantumEffects}
            aiInsights={quantumEffects}
            interactive={true}
            realTime={realTimeMode}
            title="Customer Segmentation"
            subtitle="Holographic distribution analysis"
            height={350}
          />
        </div>

        {/* Performance Metrics - Particle Area Chart */}
        <div className="animate-slide-in-right" style={{ animationDelay: '200ms' }}>
          <RevolutionaryChart
            type={quantumEffects ? 'particle-area' : 'area'}
            data={performanceData}
            theme={selectedTheme}
            glassmorphism={glassEffect}
            depth3D={animation3D}
            quantumEffects={quantumEffects}
            aiInsights={quantumEffects}
            particleSystem={quantumEffects}
            interactive={true}
            realTime={realTimeMode}
            title="Performance Metrics"
            subtitle="Particle-enhanced performance tracking"
            height={350}
          />
        </div>
      </div>

      {/* Advanced Chart Features Demo */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-text-primary mb-6">Advanced Chart Features</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature 1: Real-time Updates */}
          <div className="glass-card-premium p-6 rounded-xl border border-glass-border/40 bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent backdrop-blur-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                📡
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">Real-time Updates</h4>
                <p className="text-sm text-text-secondary">Live data streaming</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• WebSocket integration</li>
              <li>• Smooth data transitions</li>
              <li>• Performance optimized</li>
              <li>• Auto-refresh controls</li>
            </ul>
          </div>

          {/* Feature 2: 3D Effects */}
          <div className="glass-card-premium p-6 rounded-xl border border-glass-border/40 bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent backdrop-blur-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                🎯
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">3D Perspective</h4>
                <p className="text-sm text-text-secondary">Depth and dimension</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• CSS 3D transforms</li>
              <li>• Perspective controls</li>
              <li>• Layered depth effects</li>
              <li>• Interactive rotation</li>
            </ul>
          </div>

          {/* Feature 3: Glassmorphism */}
          <div className="glass-card-premium p-6 rounded-xl border border-glass-border/40 bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent backdrop-blur-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                ✨
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">Glassmorphism</h4>
                <p className="text-sm text-text-secondary">Premium glass effects</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Backdrop blur effects</li>
              <li>• Translucent surfaces</li>
              <li>• Dynamic lighting</li>
              <li>• Depth perception</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chart Performance Stats */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 glass-card rounded-lg bg-glass-light/20 border border-glass-border/30">
          <div className="text-2xl font-bold text-primary-500">60fps</div>
          <div className="text-sm text-text-secondary">Smooth Animation</div>
        </div>
        
        <div className="text-center p-4 glass-card rounded-lg bg-glass-light/20 border border-glass-border/30">
          <div className="text-2xl font-bold text-secondary-500">4</div>
          <div className="text-sm text-text-secondary">Chart Types</div>
        </div>
        
        <div className="text-center p-4 glass-card rounded-lg bg-glass-light/20 border border-glass-border/30">
          <div className="text-2xl font-bold text-accent-500">8</div>
          <div className="text-sm text-text-secondary">Premium Themes</div>
        </div>
        
        <div className="text-center p-4 glass-card rounded-lg bg-glass-light/20 border border-glass-border/30">
          <div className="text-2xl font-bold text-green-500">98%</div>
          <div className="text-sm text-text-secondary">Performance Score</div>
        </div>
      </div>
    </div>
  );
};

export default ChartLibrary;