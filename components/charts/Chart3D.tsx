import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

interface Chart3DProps {
  data: any[];
  type: '3d-bar' | '3d-cylinder' | '3d-pyramid' | 'isometric';
  theme?: string;
  height?: number;
  title?: string;
  interactive?: boolean;
  depth?: number;
  perspective?: number;
  rotation?: { x: number; y: number; z: number };
  lighting?: 'ambient' | 'directional' | 'spot';
  className?: string;
}

const Chart3D: React.FC<Chart3DProps> = ({
  data,
  type = '3d-bar',
  theme = 'charnoks-premium',
  height = 400,
  title,
  interactive = true,
  depth = 20,
  perspective = 1000,
  rotation = { x: 15, y: 0, z: 0 },
  lighting = 'directional',
  className = ''
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(rotation);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic rotation based on mouse movement
  useEffect(() => {
    if (!interactive || !isHovered) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = (e.clientX - centerX) / rect.width;
        const mouseY = (e.clientY - centerY) / rect.height;
        
        setCurrentRotation({
          x: rotation.x + mouseY * 20,
          y: rotation.y + mouseX * 20,
          z: rotation.z
        });
      }
    };

    if (isHovered) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovered, interactive, rotation]);

  // Theme colors
  const getThemeColors = (themeName: string) => {
    const themes = {
      'charnoks-premium': {
        primary: '#4F46E5',
        secondary: '#7C3AED', 
        accent: '#F59E0B',
        gradient: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B'],
        shadow: 'rgba(79, 70, 229, 0.4)',
        light: 'rgba(79, 70, 229, 0.1)'
      },
      'ocean-depth': {
        primary: '#0891B2',
        secondary: '#0284C7',
        accent: '#06B6D4',
        gradient: ['#0891B2', '#0284C7', '#06B6D4', '#0EA5E9'],
        shadow: 'rgba(8, 145, 178, 0.4)',
        light: 'rgba(8, 145, 178, 0.1)'
      }
    };
    
    return themes[themeName as keyof typeof themes] || themes['charnoks-premium'];
  };

  const themeColors = getThemeColors(theme);

  // 3D Styles
  const get3DContainerStyles = () => ({
    perspective: `${perspective}px`,
    perspectiveOrigin: '50% 50%'
  });

  const get3DChartStyles = () => ({
    transform: `rotateX(${currentRotation.x}deg) rotateY(${currentRotation.y}deg) rotateZ(${currentRotation.z}deg)`,
    transformStyle: 'preserve-3d' as const,
    transition: isHovered ? 'none' : 'transform 0.5s ease-out'
  });

  // Custom 3D Bar Component
  const Bar3D = ({ x, y, width, height, fill, payload }: any) => {
    const [isBarHovered, setIsBarHovered] = useState(false);
    
    return (
      <g
        onMouseEnter={() => setIsBarHovered(true)}
        onMouseLeave={() => setIsBarHovered(false)}
        style={{ cursor: 'pointer' }}
      >
        {/* Main face */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          className={`transition-all duration-300 ${isBarHovered ? 'brightness-110' : ''}`}
        />
        
        {/* Top face */}
        <polygon
          points={`${x},${y} ${x + width},${y} ${x + width + depth},${y - depth} ${x + depth},${y - depth}`}
          fill={fill}
          style={{ filter: 'brightness(1.2)' }}
          className={`transition-all duration-300 ${isBarHovered ? 'brightness-125' : ''}`}
        />
        
        {/* Right face */}
        <polygon
          points={`${x + width},${y} ${x + width},${y + height} ${x + width + depth},${y + height - depth} ${x + width + depth},${y - depth}`}
          fill={fill}
          style={{ filter: 'brightness(0.8)' }}
          className={`transition-all duration-300 ${isBarHovered ? 'brightness-90' : ''}`}
        />
        
        {/* Highlight edge */}
        <line
          x1={x}
          y1={y}
          x2={x + depth}
          y2={y - depth}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
        
        {/* Shadow */}
        <polygon
          points={`${x + depth},${y + height + depth} ${x + width + depth},${y + height + depth} ${x + width + depth * 2},${y + height} ${x + depth * 2},${y + height}`}
          fill="rgba(0,0,0,0.2)"
          style={{ transform: 'translateZ(-1px)' }}
        />
      </g>
    );
  };

  // Custom 3D Cylinder Component
  const Cylinder3D = ({ x, y, width, height, fill }: any) => {
    const centerX = x + width / 2;
    const radius = width / 2;
    
    return (
      <g>
        {/* Cylinder body */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          rx={radius}
        />
        
        {/* Top ellipse */}
        <ellipse
          cx={centerX}
          cy={y}
          rx={radius}
          ry={radius * 0.3}
          fill={fill}
          style={{ filter: 'brightness(1.3)' }}
        />
        
        {/* Bottom ellipse */}
        <ellipse
          cx={centerX}
          cy={y + height}
          rx={radius}
          ry={radius * 0.3}
          fill={fill}
          style={{ filter: 'brightness(0.7)' }}
        />
        
        {/* 3D depth effect */}
        <ellipse
          cx={centerX + depth / 2}
          cy={y - depth / 2}
          rx={radius}
          ry={radius * 0.3}
          fill={fill}
          style={{ filter: 'brightness(1.2)', opacity: 0.8 }}
        />
      </g>
    );
  };

  // Render based on chart type
  const renderChart = () => {
    switch (type) {
      case '3d-bar':
        return (
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
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
            <Tooltip />
            <Bar 
              dataKey="value" 
              shape={<Bar3D />}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={themeColors.gradient[index % themeColors.gradient.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        );

      case '3d-cylinder':
        return (
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
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
            <Tooltip />
            <Bar 
              dataKey="value" 
              shape={<Cylinder3D />}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={themeColors.gradient[index % themeColors.gradient.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        );

      default:
        return (
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <Bar dataKey="value" fill={themeColors.primary} />
          </BarChart>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`
        chart-3d-container relative overflow-hidden
        glass-card-premium p-6 rounded-2xl border border-glass-border/40
        bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-transparent
        backdrop-blur-xl shadow-glass-4
        ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}
        ${className}
      `}
      style={get3DContainerStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Title */}
      {title && (
        <h3 className="text-xl font-bold text-text-primary mb-6 animate-slide-in-right">
          {title}
        </h3>
      )}

      {/* 3D Chart Container */}
      <div
        className="chart-3d-wrapper"
        style={{
          height: height,
          ...get3DChartStyles()
        }}
      >
        {/* Ambient lighting effect */}
        {lighting === 'ambient' && (
          <div 
            className="absolute inset-0 rounded-xl opacity-30 blur-2xl -z-10"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${themeColors.light}, transparent 70%)`
            }}
          />
        )}

        {/* Directional lighting effect */}
        {lighting === 'directional' && (
          <div 
            className="absolute inset-0 rounded-xl opacity-40 blur-3xl -z-10"
            style={{
              background: `linear-gradient(135deg, ${themeColors.light}, transparent 60%)`
            }}
          />
        )}

        {/* Chart Shadow */}
        <div 
          className="absolute inset-0 rounded-xl opacity-20 blur-lg"
          style={{
            background: themeColors.shadow,
            transform: `translateX(${depth}px) translateY(${depth}px) translateZ(-${depth}px)`
          }}
        />

        {/* Main Chart */}
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>

        {/* 3D Grid Lines */}
        <svg 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            transform: `translateZ(-${depth}px)`,
            opacity: 0.1
          }}
        >
          <defs>
            <pattern id="grid3d" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid3d)" />
        </svg>
      </div>

      {/* 3D Controls */}
      {interactive && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="text-xs text-text-secondary/60 bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
            3D Interactive
          </div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        </div>
      )}

      {/* Rotation Indicator */}
      {interactive && isHovered && (
        <div className="absolute bottom-4 left-4 text-xs text-text-secondary/60 bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
          Move mouse to rotate
        </div>
      )}
    </div>
  );
};

export default Chart3D;