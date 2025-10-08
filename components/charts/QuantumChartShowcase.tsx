import React, { useState } from 'react';
import RevolutionaryChart from './RevolutionaryChart';
import ChartAIAssistant from './ChartAIAssistant';

interface QuantumChartShowcaseProps {
  className?: string;
}

const QuantumChartShowcase: React.FC<QuantumChartShowcaseProps> = ({ className = '' }) => {
  const [selectedTheme, setSelectedTheme] = useState('charnoks-premium');
  const [quantumEnabled, setQuantumEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [neuralEnabled, setNeuralEnabled] = useState(false);

  // Sample data for all chart types
  const salesData = [
    { name: 'Jan', value: 45000, trend: 'up' },
    { name: 'Feb', value: 52000, trend: 'up' },
    { name: 'Mar', value: 48000, trend: 'down' },
    { name: 'Apr', value: 61000, trend: 'up' },
    { name: 'May', value: 55000, trend: 'down' },
    { name: 'Jun', value: 67000, trend: 'up' },
    { name: 'Jul', value: 72000, trend: 'up' }
  ];

  const performanceData = [
    { name: 'Performance', value: 92 },
    { name: 'Reliability', value: 88 },
    { name: 'Security', value: 95 },
    { name: 'Usability', value: 90 }
  ];

  const userSegments = [
    { name: 'Premium Users', value: 35 },
    { name: 'Standard Users', value: 45 },
    { name: 'Free Users', value: 20 }
  ];

  const revenueFlow = [
    { name: 'Q1', value: 145000 },
    { name: 'Q2', value: 183000 },
    { name: 'Q3', value: 220000 },
    { name: 'Q4', value: 267000 }
  ];

  const themes = [
    { id: 'charnoks-premium', name: 'Charnoks Premium', color: 'from-indigo-500 to-purple-600' },
    { id: 'ocean-depth', name: 'Ocean Depth', color: 'from-cyan-500 to-blue-600' },
    { id: 'forest-zen', name: 'Forest Zen', color: 'from-emerald-500 to-green-600' },
    { id: 'sunset-glow', name: 'Sunset Glow', color: 'from-orange-500 to-red-600' },
    { id: 'cosmic-void', name: 'Cosmic Void', color: 'from-purple-900 to-violet-600' }
  ];

  const chartTypes = [
    { type: 'quantum-line', name: 'Quantum Line', icon: '📈', description: 'Advanced line chart with quantum field effects' },
    { type: 'glass-bar', name: 'Glass Bar', icon: '📊', description: 'Glassmorphism bar chart with depth' },
    { type: 'holographic-pie', name: 'Holographic Pie', icon: '🥧', description: 'Interactive pie chart with holographic effects' },
    { type: 'particle-area', name: 'Particle Area', icon: '🌊', description: 'Area chart with particle system animation' },
    { type: 'neural-scatter', name: 'Neural Scatter', icon: '🧠', description: 'Neural network inspired scatter plot' },
    { type: 'morphing-donut', name: 'Morphing Donut', icon: '🍩', description: 'Dynamic donut chart with morphing effects' }
  ];

  return (
    <div className={`quantum-chart-showcase space-y-8 ${className}`}>
      {/* Showcase Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-500 flex items-center justify-center text-2xl animate-pulse">
            ⚛️
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
            Quantum Chart Engine
          </h1>
        </div>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          Experience the future of data visualization with AI-powered insights, quantum effects, and revolutionary chart types
        </p>
      </div>

      {/* Control Panel */}
      <div className="glass-card-premium p-6 rounded-2xl border border-glass-border/40 bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent backdrop-blur-xl">
        <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <span>⚙️</span> Quantum Controls
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Selector */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Theme Selection</label>
            <div className="grid grid-cols-1 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`
                    p-3 rounded-xl border transition-all duration-300 text-left
                    ${selectedTheme === theme.id
                      ? 'border-primary-500/60 bg-primary-500/10 shadow-lg'
                      : 'border-glass-border/40 bg-glass-light/20 hover:bg-glass-light/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.color}`} />
                    <span className="text-sm font-medium text-text-primary">{theme.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Quantum Features</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quantumEnabled}
                  onChange={(e) => setQuantumEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border/40 bg-glass-light/30 text-primary-500 focus:ring-primary-500/50"
                />
                <span className="text-sm text-text-primary">Quantum Effects ⚛️</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border/40 bg-glass-light/30 text-primary-500 focus:ring-primary-500/50"
                />
                <span className="text-sm text-text-primary">AI Insights 🧠</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={particlesEnabled}
                  onChange={(e) => setParticlesEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border/40 bg-glass-light/30 text-primary-500 focus:ring-primary-500/50"
                />
                <span className="text-sm text-text-primary">Particle System ✨</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={neuralEnabled}
                  onChange={(e) => setNeuralEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-glass-border/40 bg-glass-light/30 text-primary-500 focus:ring-primary-500/50"
                />
                <span className="text-sm text-text-primary">Neural Animation 🔗</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Type Showcase */}
      <div>
        <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">Revolutionary Chart Types</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {chartTypes.map((chartType, index) => (
            <div key={chartType.type} className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{chartType.icon}</span>
                <div>
                  <h4 className="font-bold text-text-primary">{chartType.name}</h4>
                  <p className="text-sm text-text-secondary">{chartType.description}</p>
                </div>
              </div>
              
              <RevolutionaryChart
                type={chartType.type as any}
                data={index % 2 === 0 ? salesData : index % 3 === 0 ? userSegments : performanceData}
                theme={selectedTheme}
                animation="quantum"
                glassmorphism={true}
                quantumEffects={quantumEnabled}
                aiInsights={aiEnabled}
                particleSystem={particlesEnabled}
                neuralAnimation={neuralEnabled}
                interactive={true}
                height={300}
                title={`${chartType.name} Demo`}
                subtitle={`Interactive ${chartType.name.toLowerCase()} with quantum effects`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Feature Demos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Large Quantum Line Chart */}
        <div className="xl:col-span-2">
          <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">Full-Featured Quantum Chart</h3>
          <RevolutionaryChart
            type="quantum-line"
            data={salesData}
            theme={selectedTheme}
            animation="quantum"
            glassmorphism={true}
            quantumEffects={quantumEnabled}
            aiInsights={aiEnabled}
            particleSystem={particlesEnabled}
            neuralAnimation={neuralEnabled}
            interactive={true}
            realTime={true}
            voiceControl={true}
            height={400}
            title="Advanced Sales Analytics"
            subtitle="Real-time quantum-enhanced revenue tracking with AI predictions"
            onDataPoint={(data) => console.log('Data point clicked:', data)}
            onVoiceCommand={(command) => console.log('Voice command:', command)}
          />
        </div>

        {/* Performance Donut */}
        <RevolutionaryChart
          type="morphing-donut"
          data={performanceData}
          theme={selectedTheme}
          animation="quantum"
          glassmorphism={true}
          quantumEffects={quantumEnabled}
          aiInsights={aiEnabled}
          particleSystem={particlesEnabled}
          interactive={true}
          height={350}
          title="System Performance"
          subtitle="Morphing donut chart with real-time metrics"
        />

        {/* Revenue Flow */}
        <RevolutionaryChart
          type="particle-area"
          data={revenueFlow}
          theme={selectedTheme}
          animation="particle"
          glassmorphism={true}
          quantumEffects={quantumEnabled}
          aiInsights={aiEnabled}
          particleSystem={particlesEnabled}
          interactive={true}
          height={350}
          title="Revenue Flow"
          subtitle="Particle-enhanced area chart showing cash flow"
        />
      </div>

      {/* AI Assistant Integration */}
      {aiEnabled && (
        <div>
          <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">AI Chart Assistant</h3>
          <ChartAIAssistant
            data={salesData}
            onChartGenerated={(config) => console.log('AI generated chart:', config)}
          />
        </div>
      )}

      {/* Performance Stats */}
      <div className="glass-card p-6 rounded-xl border border-glass-border/40 bg-glass-light/20">
        <h4 className="font-bold text-text-primary mb-4 text-center">Quantum Engine Performance</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-500">60</div>
            <div className="text-sm text-text-secondary">FPS</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary-500">8</div>
            <div className="text-sm text-text-secondary">Chart Types</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent-500">∞</div>
            <div className="text-sm text-text-secondary">Particles</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">95%</div>
            <div className="text-sm text-text-secondary">GPU Optimized</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumChartShowcase;