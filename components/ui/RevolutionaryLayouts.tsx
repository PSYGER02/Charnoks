import React from 'react';

interface GridLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  autoFit?: boolean;
  className?: string;
  animateChildren?: boolean;
  staggerDelay?: number;
}

const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = 3,
  gap = 'md',
  responsive = true,
  autoFit = false,
  className = '',
  animateChildren = true,
  staggerDelay = 100
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  const getGridClasses = () => {
    if (autoFit) {
      return 'grid-auto-fit-300';
    }
    
    if (responsive) {
      return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(columns, 3)} lg:grid-cols-${columns}`;
    }
    
    return `grid grid-cols-${columns}`;
  };

  const childrenArray = React.Children.toArray(children);

  return (
    <div 
      className={`
        revolutionary-grid-layout
        ${getGridClasses()}
        ${gapClasses[gap]}
        ${animateChildren ? 'animate-stagger-children' : ''}
        ${className}
      `}
    >
      {childrenArray.map((child, index) => (
        <div
          key={index}
          className={`
            grid-item
            ${animateChildren ? 'animate-slide-in-up' : ''}
            transition-all duration-500 ease-out-quart
          `}
          style={{
            animationDelay: animateChildren ? `${index * staggerDelay}ms` : '0ms'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Specialized Grid Components
interface MasonryLayoutProps {
  children: React.ReactNode;
  columns?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const MasonryLayout: React.FC<MasonryLayoutProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = ''
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12'
  };

  return (
    <div 
      className={`
        masonry-layout
        ${gapClasses[gap]}
        ${className}
      `}
      style={{
        columnCount: columns,
        columnFill: 'balance'
      }}
    >
      {React.Children.map(children, (child, index) => (
        <div 
          className="break-inside-avoid mb-6 animate-fade-in"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Revolutionary Card Container with Glassmorphism
interface CardContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium' | 'elevated' | 'minimal';
  hover?: 'lift' | 'glow' | 'tilt' | 'glass-intense';
  className?: string;
  onClick?: () => void;
  animateOnMount?: boolean;
  delay?: number;
}

export const CardContainer: React.FC<CardContainerProps> = ({
  children,
  variant = 'default',
  hover = 'lift',
  className = '',
  onClick,
  animateOnMount = true,
  delay = 0
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (animateOnMount) {
      const timer = setTimeout(() => setMounted(true), delay);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, [animateOnMount, delay]);

  const getVariantClasses = () => {
    switch (variant) {
      case 'premium':
        return 'glass-card-premium bg-gradient-to-br from-glass-light/40 via-glass-light/30 to-glass-light/20 border border-glass-border/50 shadow-glass-4';
      case 'elevated':
        return 'glass-card bg-gradient-to-br from-glass-light/50 via-glass-light/40 to-glass-light/30 border border-glass-border/60 shadow-glass-5';
      case 'minimal':
        return 'glass-card bg-glass-light/20 border border-glass-border/30 shadow-glass-2';
      default:
        return 'glass-card bg-gradient-to-br from-glass-light/30 to-glass-light/20 border border-glass-border/40 shadow-glass-3';
    }
  };

  const getHoverClasses = () => {
    switch (hover) {
      case 'lift':
        return 'hover-lift';
      case 'glow':
        return 'hover-glow';
      case 'tilt':
        return 'hover-tilt';
      case 'glass-intense':
        return 'hover-glass-intense';
      default:
        return 'hover-lift';
    }
  };

  return (
    <div
      className={`
        revolutionary-card-container
        ${getVariantClasses()}
        ${getHoverClasses()}
        backdrop-blur-xl rounded-2xl p-6
        transition-all duration-500 ease-out-quart
        ${onClick ? 'cursor-pointer' : ''}
        ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Responsive Container with Breakpoint Awareness
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  center?: boolean;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'md',
  center = true,
  className = ''
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
    xl: 'px-12 py-8'
  };

  return (
    <div
      className={`
        responsive-container
        ${maxWidthClasses[maxWidth]}
        ${paddingClasses[padding]}
        ${center ? 'mx-auto' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Revolutionary Flex Layout with Advanced Options
interface FlexLayoutProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
  className?: string;
  animateChildren?: boolean;
}

export const FlexLayout: React.FC<FlexLayoutProps> = ({
  children,
  direction = 'row',
  align = 'center',
  justify = 'start',
  wrap = false,
  gap = 'md',
  responsive = true,
  className = '',
  animateChildren = false
}) => {
  const directionClasses = {
    row: responsive ? 'flex-col sm:flex-row' : 'flex-row',
    column: responsive ? 'flex-col' : 'flex-col',
    'row-reverse': responsive ? 'flex-col-reverse sm:flex-row-reverse' : 'flex-row-reverse',
    'column-reverse': 'flex-col-reverse'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  return (
    <div
      className={`
        revolutionary-flex-layout
        flex
        ${directionClasses[direction]}
        ${alignClasses[align]}
        ${justifyClasses[justify]}
        ${wrap ? 'flex-wrap' : 'flex-nowrap'}
        ${gapClasses[gap]}
        ${animateChildren ? 'animate-stagger-children' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Revolutionary Section with Background Effects
interface SectionLayoutProps {
  children: React.ReactNode;
  background?: 'glass' | 'gradient' | 'solid' | 'pattern';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fullHeight?: boolean;
  className?: string;
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({
  children,
  background = 'glass',
  spacing = 'lg',
  fullHeight = false,
  className = ''
}) => {
  const backgroundClasses = {
    glass: 'bg-gradient-to-br from-glass-light/20 via-glass-light/10 to-glass-light/5 backdrop-blur-sm',
    gradient: 'bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5',
    solid: 'bg-surface',
    pattern: 'bg-glass-pattern'
  };

  const spacingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  };

  return (
    <section
      className={`
        revolutionary-section
        ${backgroundClasses[background]}
        ${spacingClasses[spacing]}
        ${fullHeight ? 'min-h-screen' : ''}
        relative overflow-hidden
        ${className}
      `}
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-glass-light/5 to-transparent pointer-events-none" />
      
      {children}
    </section>
  );
};

export default GridLayout;