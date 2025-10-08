import React, { useState } from 'react';
import ChartLibrary from '../components/charts/ChartLibrary';
import RevolutionaryDashboard from '../components/charts/RevolutionaryDashboard';
import ChartAIAssistant from '../components/charts/ChartAIAssistant';
import Chart3D from '../components/charts/Chart3D';
import QuantumChartShowcase from '../components/charts/QuantumChartShowcase';

const ChartsShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('quantum');
  const [selectedTheme, setSelectedTheme] = useState('forest-zen');

  const tabs = [
    { id: 'quantum', name: 'Quantum Charts', icon: '⚛️' },
    { id: 'library', name: 'Chart Library', icon: '📊' },
    { id: 'dashboard', name: 'Dashboard', icon: '📈' },
    { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖' },
    { id: '3d-charts', name: '3D Charts', icon: '🎯' }
  ];

  const themes = [
    { id: 'charnoks-premium', name: 'Charnoks Premium' },
    { id: 'ocean-depth', name: 'Ocean Depth' },
    { id: 'forest-zen', name: 'Forest Zen' },
    { id: 'sunset-glow', name: 'Sunset Glow' }
  ];

  // Sample 3D data
  const sample3DData = [
    { name: 'Q1', value: 45000 },
    { name: 'Q2', value: 52000 },
    { name: 'Q3', value: 48000 },
    { name: 'Q4', value: 61000 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-glass-border/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                📊
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                  Revolutionary Charts
                </h1>
                <p className="text-sm text-text-secondary">Advanced Data Visualization Suite</p>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-3">
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="px-4 py-2 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1 mt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300
                  ${activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg scale-105'
                    : 'glass-card bg-glass-light/20 border border-glass-border/30 text-text-secondary hover:text-text-primary hover:bg-glass-light/40'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quantum Charts Tab */}
        {activeTab === 'quantum' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-4">⚛️ Quantum Chart Engine</h2>
              <p className="text-text-secondary text-lg">
                Experience the future of data visualization with quantum effects, AI insights, and revolutionary chart types.
              </p>
            </div>
            <QuantumChartShowcase />
          </div>
        )}

        {/* Chart Library Tab */}
        {activeTab === 'library' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-4">Chart Library</h2>
              <p className="text-text-secondary text-lg">
                Explore our collection of revolutionary charts with glassmorphism effects, 3D transforms, and interactive animations.
              </p>
            </div>
            <ChartLibrary />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-4">Analytics Dashboard</h2>
              <p className="text-text-secondary text-lg">
                Experience a complete dashboard with KPIs, multiple chart layouts, and real-time data visualization.
              </p>
            </div>
            <RevolutionaryDashboard
              data={{
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
                    type: 'area' as const,
                    span: 'full' as const,
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
                    type: 'bar' as const,
                    span: 'half' as const,
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
                    type: 'pie' as const,
                    span: 'half' as const,
                    data: [
                      { name: 'Premium', value: 35 },
                      { name: 'Standard', value: 45 },
                      { name: 'Free', value: 20 }
                    ]
                  }
                ]
              }}
              theme={selectedTheme}
            />
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'ai-assistant' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-4">AI Chart Assistant</h2>
              <p className="text-text-secondary text-lg">
                Let AI analyze your data and suggest the best visualization approaches with intelligent insights.
              </p>
            </div>
            <ChartAIAssistant
              data={[
                { name: 'Jan', sales: 45000, users: 1200, conversion: 3.2 },
                { name: 'Feb', sales: 52000, users: 1350, conversion: 3.8 },
                { name: 'Mar', sales: 48000, users: 1100, conversion: 4.1 },
                { name: 'Apr', sales: 61000, users: 1480, conversion: 4.5 },
                { name: 'May', sales: 55000, users: 1320, conversion: 4.2 },
                { name: 'Jun', sales: 67000, users: 1600, conversion: 4.8 }
              ]}
              onChartGenerated={(config) => {
                console.log('Generated chart:', config);
              }}
            />
          </div>
        )}

        {/* 3D Charts Tab */}
        {activeTab === '3d-charts' && (
          <div className="animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-4">3D Interactive Charts</h2>
              <p className="text-text-secondary text-lg">
                Experience next-generation 3D data visualization with interactive rotation and depth effects.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 3D Bar Chart */}
              <Chart3D
                type="3d-bar"
                data={sample3DData}
                theme={selectedTheme}
                title="3D Bar Chart"
                interactive={true}
                depth={25}
                perspective={1200}
                rotation={{ x: 20, y: 0, z: 0 }}
                lighting="directional"
                height={400}
              />

              {/* 3D Cylinder Chart */}
              <Chart3D
                type="3d-cylinder"
                data={sample3DData}
                theme={selectedTheme}
                title="3D Cylinder Chart"
                interactive={true}
                depth={20}
                perspective={1000}
                rotation={{ x: 15, y: 10, z: 0 }}
                lighting="ambient"
                height={400}
              />

              {/* Isometric View */}
              <Chart3D
                type="isometric"
                data={sample3DData}
                theme={selectedTheme}
                title="Isometric Perspective"
                interactive={true}
                depth={30}
                perspective={800}
                rotation={{ x: 30, y: 45, z: 0 }}
                lighting="spot"
                height={400}
              />

              {/* 3D Pyramid */}
              <Chart3D
                type="3d-pyramid"
                data={sample3DData}
                theme={selectedTheme}
                title="3D Pyramid Chart"
                interactive={true}
                depth={35}
                perspective={1100}
                rotation={{ x: 25, y: -15, z: 0 }}
                lighting="directional"
                height={400}
              />
            </div>

            {/* 3D Features Info */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card-premium p-6 rounded-xl border border-glass-border/40 bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent backdrop-blur-lg">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-4">
                    🎮
                  </div>
                  <h3 className="font-bold text-text-primary mb-2">Interactive Control</h3>
                  <p className="text-sm text-text-secondary">
                    Mouse-controlled rotation with smooth transitions and real-time perspective adjustments
                  </p>
                </div>
              </div>

              <div className="glass-card-premium p-6 rounded-xl border border-glass-border/40 bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent backdrop-blur-lg">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                    💡
                  </div>
                  <h3 className="font-bold text-text-primary mb-2">Dynamic Lighting</h3>
                  <p className="text-sm text-text-secondary">
                    Ambient, directional, and spot lighting effects with realistic shadow casting
                  </p>
                </div>
              </div>

              <div className="glass-card-premium p-6 rounded-xl border border-glass-border/40 bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent backdrop-blur-lg">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                    ⚡
                  </div>
                  <h3 className="font-bold text-text-primary mb-2">GPU Acceleration</h3>
                  <p className="text-sm text-text-secondary">
                    Hardware-accelerated rendering for smooth 60fps animations and transformations
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-glass-border/30 bg-glass-light/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h3 className="text-lg font-bold text-text-primary mb-2">Revolutionary Chart System</h3>
            <p className="text-text-secondary mb-4">
              Powered by React, Recharts, and advanced CSS transforms
            </p>
            
            <div className="flex items-center justify-center gap-8 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Real-time Updates
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                3D Interactive
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                AI Powered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Glassmorphism
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChartsShowcase;