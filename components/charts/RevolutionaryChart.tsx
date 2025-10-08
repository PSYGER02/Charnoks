import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts';

interface RevolutionaryChartProps {
  type: 'quantum-line' | 'glass-bar' | 'holographic-pie' | 'neural-scatter' | 'particle-area' | '3d-surface' | 'morphing-donut' | 'crystal-heatmap' | 'bar' | 'line' | 'pie' | 'area' | 'bar3d' | 'line3d' | 'pie3d';
  data: any[];
  theme?: string;
  animation?: 'smooth' | 'bounce' | 'elastic' | 'spring' | 'quantum' | 'neural' | 'particle';
  glassmorphism?: boolean;
  depth3D?: boolean;
  perspective?: string;
  interactive?: boolean;
  realTime?: boolean;
  particleSystem?: boolean;
  aiInsights?: boolean;
  voiceControl?: boolean;
  collaboration?: boolean;
  quantumEffects?: boolean;
  neuralAnimation?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
  height?: number;
  width?: number;
  onDataPoint?: (data: any) => void;
  onVoiceCommand?: (command: string) => void;
}

const RevolutionaryChart: React.FC<RevolutionaryChartProps> = ({
  type,
  data,
  theme = 'forest-zen',
  animation = 'quantum',
  glassmorphism = true,
  depth3D = false,
  perspective = '45deg',
  interactive = true,
  realTime = false,
  particleSystem = true,
  aiInsights = true,
  voiceControl = false,
  collaboration = false,
  quantumEffects = true,
  neuralAnimation = false,
  className = '',
  title,
  subtitle,
  height = 400,
  width,
  onDataPoint,
  onVoiceCommand
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredData, setHoveredData] = useState<any>(null);
  const [particles, setParticles] = useState<Array<{id: string, x: number, y: number, opacity: number, scale: number}>>([]);
  const [quantumState, setQuantumState] = useState(0);
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [collaborators, setCollaborators] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [neuralNetwork, setNeuralNetwork] = useState<Array<{x: number, y: number, connections: number[]}>>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Quantum Effects System
  useEffect(() => {
    if (!quantumEffects) return;
    
    const interval = setInterval(() => {
      setQuantumState((prev: number) => (prev + 0.05) % (Math.PI * 2));
    }, 50);
    
    return () => clearInterval(interval);
  }, [quantumEffects]);

  // Particle System
  useEffect(() => {
    if (!particleSystem || !chartRef.current) return;
    
    const createParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: `particle-${i}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: Math.random() * 0.6 + 0.2,
        scale: Math.random() * 0.8 + 0.2
      }));
      setParticles(newParticles);
    };
    
    createParticles();
    const interval = setInterval(createParticles, 3000);
    
    return () => clearInterval(interval);
  }, [particleSystem]);

  // AI Insights Generation
  useEffect(() => {
    if (!aiInsights || !data.length) return;
    
    const generateInsight = () => {
      const values = data.map(d => d.value || 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const trend = values[values.length - 1] > values[0] ? 'increasing' : 'decreasing';
      const volatility = Math.max(...values) - Math.min(...values);
      
      setAiPrediction({
        trend,
        average: avg.toFixed(2),
        volatility: volatility.toFixed(2),
        confidence: Math.random() * 30 + 70,
        insight: `Data shows ${trend} trend with ${volatility > avg ? 'high' : 'low'} volatility`
      });
    };
    
    generateInsight();
    const interval = setInterval(generateInsight, 5000);
    
    return () => clearInterval(interval);
  }, [aiInsights, data]);

  // Neural Network Animation
  useEffect(() => {
    if (!neuralAnimation) return;
    
    const generateNetwork = () => {
      const nodes = Array.from({ length: 8 }, (_, i) => ({
        x: (i % 4) * 25 + 12.5,
        y: Math.floor(i / 4) * 50 + 25,
        connections: Array.from({ length: Math.random() * 3 + 1 }, () => Math.floor(Math.random() * 8))
      }));
      setNeuralNetwork(nodes);
    };
    
    generateNetwork();
    const interval = setInterval(generateNetwork, 2000);
    
    return () => clearInterval(interval);
  }, [neuralAnimation]);

  // Canvas Animation Loop
  useEffect(() => {
    if (!canvasRef.current || (!particleSystem && !quantumEffects && !neuralAnimation)) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw quantum field
      if (quantumEffects) {
        ctx.save();
        const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
        gradient.addColorStop(0, `hsla(${(quantumState * 180 / Math.PI) % 360}, 70%, 60%, 0.1)`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      
      // Draw particles
      if (particleSystem) {
        particles.forEach(particle => {
          ctx.save();
          ctx.globalAlpha = particle.opacity * Math.sin(quantumState + particle.x) * 0.5 + 0.5;
          ctx.translate(particle.x * canvas.width / 100, particle.y * canvas.height / 100);
          ctx.scale(particle.scale, particle.scale);
          
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
          gradient.addColorStop(0, '#4F46E5');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(-5, -5, 10, 10);
          ctx.restore();
        });
      }
      
      // Draw neural connections
      if (neuralAnimation && neuralNetwork.length > 0) {
        ctx.strokeStyle = 'rgba(79, 70, 229, 0.3)';
        ctx.lineWidth = 1;
        
        neuralNetwork.forEach(node => {
          node.connections.forEach(connectionIndex => {
            if (connectionIndex < neuralNetwork.length) {
              const target = neuralNetwork[connectionIndex];
              ctx.beginPath();
              ctx.moveTo(node.x * canvas.width / 100, node.y * canvas.height / 100);
              ctx.lineTo(target.x * canvas.width / 100, target.y * canvas.height / 100);
              ctx.stroke();
            }
          });
          
          // Draw node
          ctx.fillStyle = `hsla(${(quantumState * 180 / Math.PI + node.x) % 360}, 70%, 60%, 0.8)`;
          ctx.beginPath();
          ctx.arc(node.x * canvas.width / 100, node.y * canvas.height / 100, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [particles, quantumState, neuralNetwork, particleSystem, quantumEffects, neuralAnimation]);

  // Voice Control System
  useEffect(() => {
    if (!voiceControl) return;
    
    // Simulated voice recognition
    const handleVoiceCommand = (command: string) => {
      onVoiceCommand?.(command);
      
      if (command.includes('zoom')) {
        // Handle zoom command
      } else if (command.includes('filter')) {
        // Handle filter command
      } else if (command.includes('analyze')) {
        // Trigger AI analysis
      }
    };
    
    // Mock voice commands for demo
    if (isVoiceListening) {
      const timeout = setTimeout(() => {
        handleVoiceCommand('analyze trends');
        setIsVoiceListening(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [voiceControl, isVoiceListening, onVoiceCommand]);

  // Theme color schemes with quantum enhancement
  const getThemeColors = (themeName: string) => {
    const themes = {
      'charnoks-premium': {
        primary: '#4F46E5',
        secondary: '#7C3AED',
        accent: '#F59E0B',
        gradient: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B'],
        quantum: ['#6366F1', '#8B5CF6', '#F472B6', '#FBBF24'],
        neural: ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7'],
        background: 'from-indigo-500/20 via-purple-500/20 to-pink-500/20',
        glow: 'rgba(79, 70, 229, 0.4)'
      },
      'ocean-depth': {
        primary: '#0891B2',
        secondary: '#0284C7',
        accent: '#06B6D4',
        gradient: ['#0891B2', '#0284C7', '#06B6D4', '#0EA5E9'],
        quantum: ['#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6'],
        neural: ['#0891B2', '#0EA5E9', '#3B82F6', '#6366F1'],
        background: 'from-cyan-500/20 via-blue-500/20 to-teal-500/20',
        glow: 'rgba(8, 145, 178, 0.4)'
      },
      'forest-zen': {
        primary: '#059669',
        secondary: '#047857',
        accent: '#10B981',
        gradient: ['#059669', '#047857', '#10B981', '#34D399'],
        quantum: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
        neural: ['#047857', '#059669', '#10B981', '#34D399'],
        background: 'from-emerald-500/20 via-green-500/20 to-teal-500/20',
        glow: 'rgba(5, 150, 105, 0.4)'
      },
      'sunset-glow': {
        primary: '#EA580C',
        secondary: '#DC2626',
        accent: '#F59E0B',
        gradient: ['#EA580C', '#DC2626', '#F59E0B', '#FBBF24'],
        quantum: ['#F97316', '#EF4444', '#F59E0B', '#FBBF24'],
        neural: ['#DC2626', '#EA580C', '#F97316', '#F59E0B'],
        background: 'from-orange-500/20 via-red-500/20 to-amber-500/20',
        glow: 'rgba(234, 88, 12, 0.4)'
      },
      'cosmic-void': {
        primary: '#7C3AED',
        secondary: '#5B21B6',
        accent: '#C084FC',
        gradient: ['#7C3AED', '#5B21B6', '#C084FC', '#DDD6FE'],
        quantum: ['#8B5CF6', '#7C3AED', '#C084FC', '#DDD6FE'],
        neural: ['#5B21B6', '#7C3AED', '#8B5CF6', '#C084FC'],
        background: 'from-purple-900/20 via-violet-800/20 to-purple-700/20',
        glow: 'rgba(124, 58, 237, 0.5)'
      }
    };
    
    return themes[themeName as keyof typeof themes] || themes['charnoks-premium'];
  };

  const themeColors = getThemeColors(theme);

  // Enhanced Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          revolutionary-chart-tooltip glass-card-premium p-4 rounded-xl border border-glass-border/50 
          bg-gradient-to-br from-glass-light/80 via-glass-light/60 to-glass-light/40 
          backdrop-blur-xl shadow-glass-4 animate-fade-in
          ${quantumEffects ? 'animate-quantum-glow' : ''}
        `}>
          <div className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            {quantumEffects && <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />}
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className={`w-3 h-3 rounded-full ${quantumEffects ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-secondary">{entry.name}:</span>
              <span className="font-semibold text-text-primary">{entry.value}</span>
              {aiInsights && aiPrediction && (
                <span className="text-xs text-accent-500 ml-1">
                  ({aiPrediction.confidence.toFixed(0)}% confidence)
                </span>
              )}
            </div>
          ))}
          {aiInsights && aiPrediction && (
            <div className="mt-3 pt-2 border-t border-glass-border/30">
              <div className="text-xs text-text-secondary">AI Insight:</div>
              <div className="text-xs text-primary-400 mt-1">{aiPrediction.insight}</div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Quantum Chart Variants
  const renderQuantumLine = () => {
    const colors = quantumEffects ? themeColors.quantum : themeColors.gradient;
    
    return (
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={quantumEffects ? `hsla(${(quantumState * 180 / Math.PI) % 360}, 70%, 60%, 0.3)` : "rgba(255,255,255,0.1)"}
          className={quantumEffects ? 'animate-pulse' : ''}
        />
        <XAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={colors[0]}
          strokeWidth={quantumEffects ? 4 : 3}
          dot={{ 
            fill: colors[1], 
            strokeWidth: quantumEffects ? 3 : 2, 
            r: quantumEffects ? 8 : 6,
            className: quantumEffects ? 'animate-pulse' : ''
          }}
          activeDot={{ 
            r: quantumEffects ? 12 : 8, 
            fill: colors[2],
            className: quantumEffects ? 'animate-quantum-pulse' : ''
          }}
          className="drop-shadow-lg"
        />
        {quantumEffects && (
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={colors[2]}
            strokeWidth={2}
            strokeOpacity={0.4}
            strokeDasharray="5 5"
            dot={false}
            className="animate-dash"
          />
        )}
      </LineChart>
    );
  };

  const renderGlassBar = () => {
    const colors = glassmorphism ? themeColors.gradient : themeColors.quantum;
    
    return (
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="rgba(255,255,255,0.1)"
          vertical={false}
        />
        <XAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="value" 
          radius={[8, 8, 0, 0]}
          className="drop-shadow-lg"
        >
          {data.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]}
              fillOpacity={glassmorphism ? 0.8 : 1}
              className={quantumEffects ? 'animate-quantum-glow' : ''}
            />
          ))}
        </Bar>
        {glassmorphism && (
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
            fill="url(#glass-gradient)"
            fillOpacity={0.3}
          />
        )}
      </BarChart>
    );
  };

  const renderHolographicPie = () => {
    const colors = quantumEffects ? themeColors.quantum : themeColors.gradient;
    
    return (
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={120}
          innerRadius={quantumEffects ? 50 : 40}
          fill={themeColors.primary}
          dataKey="value"
          className="drop-shadow-lg"
        >
          {data.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]}
              className={quantumEffects ? 'animate-holographic-spin' : ''}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {quantumEffects && (
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={130}
            innerRadius={125}
            fill="none"
            stroke={themeColors.accent}
            strokeWidth={2}
            strokeOpacity={0.6}
            dataKey="value"
            className="animate-spin-slow"
          />
        )}
      </PieChart>
    );
  };

  const renderParticleArea = () => {
    const colors = particleSystem ? themeColors.neural : themeColors.gradient;
    
    return (
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="rgba(255,255,255,0.1)"
        />
        <XAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={colors[0]}
          strokeWidth={3}
          fill={`url(#particle-gradient-${theme})`}
          className={particleSystem ? 'animate-particle-flow' : ''}
        />
        <defs>
          <linearGradient id={`particle-gradient-${theme}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
            <stop offset="50%" stopColor={colors[1]} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={colors[2]} stopOpacity={0.1}/>
          </linearGradient>
          {glassmorphism && (
            <linearGradient id="glass-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
          )}
        </defs>
      </AreaChart>
    );
  };

  // 3D Transform styles
  const get3DStyles = () => {
    if (!depth3D) return {};
    
    return {
      transform: `perspective(1000px) rotateX(${perspective}) rotateY(5deg)`,
      transformStyle: 'preserve-3d' as const,
    };
  };

  // Render different chart types with quantum enhancements
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    // Revolutionary Quantum Chart Types
    switch (type) {
      case 'quantum-line':
        return renderQuantumLine();
      
      case 'glass-bar':
        return renderGlassBar();
      
      case 'holographic-pie':
        return renderHolographicPie();
      
      case 'particle-area':
        return renderParticleArea();
      
      case 'neural-scatter':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={neuralAnimation ? themeColors.neural[0] + '40' : "rgba(255,255,255,0.1)"}
              className={neuralAnimation ? 'animate-pulse' : ''}
            />
            <XAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={themeColors.neural[0]}
              strokeWidth={2}
              dot={{ 
                fill: themeColors.neural[1], 
                strokeWidth: 3, 
                r: 8,
                className: neuralAnimation ? 'animate-neural-pulse' : ''
              }}
              className="drop-shadow-lg"
            />
          </LineChart>
        );
      
      case 'morphing-donut':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={quantumEffects ? 60 + Math.sin(quantumState) * 10 : 60}
              fill={themeColors.primary}
              dataKey="value"
              className="drop-shadow-lg"
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={themeColors.quantum[index % themeColors.quantum.length]}
                  className="animate-morph"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );
      
      case 'crystal-heatmap':
        return renderParticleArea(); // Fallback to particle area for now
      
      case '3d-surface':
        return renderGlassBar(); // Fallback to glass bar for now

      // Classic Chart Types (Enhanced)
      case 'bar':
      case 'bar3d':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill={themeColors.primary}
              radius={[4, 4, 0, 0]}
              className="drop-shadow-lg"
            />
          </BarChart>
        );

      case 'line':
      case 'line3d':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={themeColors.primary}
              strokeWidth={3}
              dot={{ fill: themeColors.accent, strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: themeColors.accent }}
              className="drop-shadow-lg"
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={themeColors.primary}
              strokeWidth={2}
              fill={`url(#gradient-${theme})`}
            />
            <defs>
              <linearGradient id={`gradient-${theme}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColors.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={themeColors.primary} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        );

      case 'pie':
      case 'pie3d':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={40}
              fill={themeColors.primary}
              dataKey="value"
              className="drop-shadow-lg"
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={themeColors.gradient[index % themeColors.gradient.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default:
        return renderQuantumLine();
    }
  };

  return (
    <div 
      ref={chartRef}
      className={`
        revolutionary-chart relative overflow-hidden
        ${glassmorphism ? 'glass-card-premium' : 'bg-surface'}
        p-6 rounded-2xl border border-glass-border/40
        ${glassmorphism ? `bg-gradient-to-br ${themeColors.background}` : ''}
        ${glassmorphism ? 'backdrop-blur-xl shadow-glass-4' : 'shadow-lg'}
        transition-all duration-700 ease-out-quart
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
        ${interactive ? 'hover:scale-102 hover:shadow-glass-5' : ''}
        ${quantumEffects ? 'animate-quantum-border' : ''}
        ${className}
      `}
      style={{
        ...get3DStyles(),
        animationDelay: '200ms'
      }}
      onMouseEnter={() => {
        if (interactive) {
          setHoveredData(data);
          onDataPoint?.(data);
        }
      }}
      onMouseLeave={() => interactive && setHoveredData(null)}
    >
      {/* Quantum Field Canvas */}
      {(quantumEffects || particleSystem || neuralAnimation) && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none rounded-2xl"
          width={width || 800}
          height={height}
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Chart Header */}
      {(title || subtitle) && (
        <div className="mb-6 relative z-10">
          {title && (
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-text-primary animate-slide-in-right">
                {title}
              </h3>
              {quantumEffects && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
              )}
            </div>
          )}
          {subtitle && (
            <p className="text-sm text-text-secondary/80 animate-slide-in-right" style={{ animationDelay: '100ms' }}>
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* AI Insights Panel */}
      {aiInsights && aiPrediction && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20 animate-slide-in-down">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs">
              🧠
            </div>
            <span className="text-sm font-medium text-text-primary">AI Analysis</span>
            <div className="ml-auto text-xs text-accent-500 font-medium">
              {aiPrediction.confidence.toFixed(0)}% confidence
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            {aiPrediction.insight}
          </div>
        </div>
      )}

      {/* Voice Control Indicator */}
      {voiceControl && (
        <button
          onClick={() => setIsVoiceListening(!isVoiceListening)}
          className={`
            absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center text-sm z-10
            transition-all duration-300
            ${isVoiceListening 
              ? 'bg-red-500 text-white animate-pulse shadow-lg' 
              : 'glass-card bg-glass-light/30 border border-glass-border/40 text-text-secondary hover:text-text-primary hover:bg-glass-light/50'
            }
          `}
        >
          🎤
        </button>
      )}

      {/* Collaboration Indicators */}
      {collaboration && collaborators.length > 0 && (
        <div className="absolute top-4 left-4 flex items-center gap-1 z-10">
          {collaborators.slice(0, 3).map((collaborator, index) => (
            <div
              key={collaborator.id}
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm animate-bounce"
              style={{ 
                backgroundColor: collaborator.color,
                animationDelay: `${index * 200}ms`
              }}
              title={collaborator.name}
            />
          ))}
          {collaborators.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold">
              +{collaborators.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Chart Container */}
      <div 
        className={`
          chart-container relative z-10
          ${animation === 'quantum' ? 'animate-quantum-fade-in' : ''}
          ${animation === 'neural' ? 'animate-neural-fade-in' : ''}
          ${animation === 'particle' ? 'animate-particle-fade-in' : ''}
          ${animation === 'smooth' ? 'animate-smooth-fade-in' : ''}
          ${animation === 'bounce' ? 'animate-bounce-subtle' : ''}
          ${animation === 'elastic' ? 'animate-wobble' : ''}
        `}
        style={{ 
          height: height,
          width: width || '100%',
          animationDelay: '300ms'
        }}
      >
        {/* Background Quantum Glow Effect */}
        {quantumEffects && (
          <div 
            className="absolute inset-0 rounded-xl opacity-30 blur-3xl -z-10 animate-quantum-glow"
            style={{
              background: `conic-gradient(from ${quantumState}rad, ${themeColors.primary}20, ${themeColors.secondary}20, ${themeColors.accent}20, ${themeColors.primary}20)`
            }}
          />
        )}

        {/* Neural Network Background */}
        {neuralAnimation && neuralNetwork.length > 0 && (
          <div className="absolute inset-0 -z-10 opacity-20">
            <svg className="w-full h-full">
              {neuralNetwork.map((node, index) => 
                node.connections.map((connectionIndex: number) => {
                  if (connectionIndex < neuralNetwork.length) {
                    const target = neuralNetwork[connectionIndex];
                    return (
                      <line
                        key={`${index}-${connectionIndex}`}
                        x1={`${node.x}%`}
                        y1={`${node.y}%`}
                        x2={`${target.x}%`}
                        y2={`${target.y}%`}
                        stroke={themeColors.neural[1]}
                        strokeWidth="1"
                        className="animate-pulse"
                      />
                    );
                  }
                  return null;
                })
              )}
              {neuralNetwork.map((node, index) => (
                <circle
                  key={index}
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="3"
                  fill={themeColors.neural[0]}
                  className="animate-pulse"
                />
              ))}
            </svg>
          </div>
        )}

        {/* Chart Shimmer Effect */}
        {interactive && hoveredData && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer rounded-xl pointer-events-none" />
        )}

        {/* Main Chart */}
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>

        {/* Real-time Indicator */}
        {realTime && (
          <div className="absolute top-4 right-16 flex items-center gap-2 z-10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-text-secondary font-medium">LIVE</span>
          </div>
        )}

        {/* 3D Depth Layers */}
        {depth3D && (
          <>
            <div 
              className="absolute inset-0 rounded-xl border border-glass-border/20 -translate-x-1 -translate-y-1 -z-10"
              style={{ transform: 'translateZ(-10px)' }}
            />
            <div 
              className="absolute inset-0 rounded-xl border border-glass-border/10 -translate-x-2 -translate-y-2 -z-10"
              style={{ transform: 'translateZ(-20px)' }}
            />
          </>
        )}
      </div>

      {/* Enhanced Chart Controls */}
      {interactive && (
        <div className="mt-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onDataPoint?.(data)}
              className="w-8 h-8 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-glass-light/50 transition-all duration-300"
              title="Chart Types"
            >
              📊
            </button>
            <button 
              onClick={() => {/* Toggle animation */}}
              className="w-8 h-8 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-glass-light/50 transition-all duration-300"
              title="Animations"
            >
              ✨
            </button>
            <button 
              onClick={() => {/* Toggle quantum effects */}}
              className={`
                w-8 h-8 rounded-lg glass-card border border-glass-border/40 flex items-center justify-center transition-all duration-300
                ${quantumEffects 
                  ? 'bg-primary-500 text-white shadow-lg' 
                  : 'bg-glass-light/30 text-text-secondary hover:text-text-primary hover:bg-glass-light/50'
                }
              `}
              title="Quantum Effects"
            >
              ⚛️
            </button>
            {aiInsights && (
              <button 
                onClick={() => {/* Generate new AI insight */}}
                className="w-8 h-8 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-glass-light/50 transition-all duration-300"
                title="AI Insights"
              >
                🧠
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-text-secondary/60">
            <span>{data.length} data points</span>
            {quantumEffects && <span className="text-primary-400">Quantum Enhanced</span>}
            {neuralAnimation && <span className="text-secondary-400">Neural Active</span>}
            {particleSystem && <span className="text-accent-400">Particles On</span>}
          </div>
        </div>
      )}

      {/* Chart Performance Monitor */}
      {(quantumEffects || neuralAnimation || particleSystem) && (
        <div className="absolute bottom-2 left-2 text-xs text-text-secondary/40 z-10">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
            <span>60fps</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevolutionaryChart;