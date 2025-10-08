import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionType?: 'slide' | 'fade' | 'scale' | 'rotate' | 'glass-morph' | 'particle';
  duration?: number;
  stagger?: boolean;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  transitionType = 'glass-morph',
  duration = 800,
  stagger = true
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Reset animation state on location change
    setIsExiting(true);
    
    const exitTimer = setTimeout(() => {
      setIsExiting(false);
      setIsVisible(false);
      
      const enterTimer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      
      return () => clearTimeout(enterTimer);
    }, duration / 2);
    
    return () => clearTimeout(exitTimer);
  }, [location, duration]);

  useEffect(() => {
    // Initial mount animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const getTransitionClasses = () => {
    const base = 'transition-all ease-out-quart';
    
    switch (transitionType) {
      case 'slide':
        return `${base} ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-8 opacity-0'
        }`;
      
      case 'fade':
        return `${base} ${isVisible && !isExiting 
          ? 'opacity-100' 
          : 'opacity-0'
        }`;
      
      case 'scale':
        return `${base} ${isVisible && !isExiting 
          ? 'scale-100 opacity-100' 
          : 'scale-95 opacity-0'
        }`;
      
      case 'rotate':
        return `${base} ${isVisible && !isExiting 
          ? 'rotate-0 scale-100 opacity-100' 
          : 'rotate-3 scale-95 opacity-0'
        }`;
      
      case 'particle':
        return `${base} ${isVisible && !isExiting 
          ? 'scale-100 opacity-100 blur-0' 
          : 'scale-90 opacity-0 blur-sm'
        }`;
      
      case 'glass-morph':
      default:
        return `${base} ${isVisible && !isExiting 
          ? 'translate-y-0 scale-100 opacity-100 blur-0' 
          : 'translate-y-4 scale-98 opacity-0 blur-sm'
        }`;
    }
  };

  const staggerDelay = stagger ? 'animate-stagger-children' : '';

  return (
    <div
      className={`
        page-transition ${getTransitionClasses()} ${staggerDelay}
        ${className}
      `}
      style={{
        transitionDuration: `${duration}ms`,
        animationFillMode: 'both'
      }}
    >
      {children}
    </div>
  );
};

// Enhanced Motion Components
interface MotionCardProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'float' | 'pulse' | 'glow' | 'shimmer' | 'bounce' | 'wobble';
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = '',
  animation = 'float',
  delay = 0,
  hover = true,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (onClick) {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
      onClick();
    }
  };

  const getAnimationClasses = () => {
    let classes = ['transition-all duration-500 ease-out-quart'];
    
    // Base animation
    switch (animation) {
      case 'float':
        classes.push('animate-float');
        break;
      case 'pulse':
        classes.push('animate-pulse-subtle');
        break;
      case 'glow':
        classes.push('animate-glow-pulse');
        break;
      case 'shimmer':
        classes.push('animate-shimmer');
        break;
      case 'bounce':
        classes.push('animate-bounce-subtle');
        break;
      case 'wobble':
        classes.push('animate-wobble');
        break;
    }
    
    // Hover effects
    if (hover && isHovered) {
      classes.push('scale-105 shadow-glass-4 brightness-110');
    }
    
    // Click effects
    if (isClicked) {
      classes.push('scale-95');
    }
    
    return classes.join(' ');
  };

  return (
    <div
      className={`${getAnimationClasses()} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

// Staggered List Animation
interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  animation?: 'slide-up' | 'slide-right' | 'fade-in' | 'scale-in';
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  className = '',
  staggerDelay = 100,
  animation = 'slide-up'
}) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    children.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, index]));
      }, index * staggerDelay);
    });
  }, [children, staggerDelay]);

  const getItemClasses = (index: number) => {
    const isVisible = visibleItems.has(index);
    const base = 'transition-all duration-700 ease-out-quart';
    
    switch (animation) {
      case 'slide-up':
        return `${base} ${isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-6 opacity-0'
        }`;
      case 'slide-right':
        return `${base} ${isVisible 
          ? 'translate-x-0 opacity-100' 
          : '-translate-x-6 opacity-0'
        }`;
      case 'fade-in':
        return `${base} ${isVisible 
          ? 'opacity-100' 
          : 'opacity-0'
        }`;
      case 'scale-in':
        return `${base} ${isVisible 
          ? 'scale-100 opacity-100' 
          : 'scale-90 opacity-0'
        }`;
      default:
        return base;
    }
  };

  return (
    <div className={`staggered-list ${className}`}>
      {children.map((child, index) => (
        <div key={index} className={getItemClasses(index)}>
          {child}
        </div>
      ))}
    </div>
  );
};

// Parallax Effect Component
interface ParallaxProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.5,
  className = ''
}) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      className={`parallax ${className}`}
      style={{
        transform: `translateY(${offset}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  );
};

// Loading Animation Component
interface LoadingAnimationProps {
  type?: 'spinner' | 'dots' | 'pulse' | 'wave' | 'glass-loading';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'glass';
  className?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  type = 'glass-loading',
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-primary',
    accent: 'text-accent',
    glass: 'text-glass-light'
  };

  switch (type) {
    case 'spinner':
      return (
        <div className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
          <div className="animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        </div>
      );
    
    case 'dots':
      return (
        <div className={`flex space-x-1 ${className}`}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`
                ${sizeClasses[size]} rounded-full bg-current ${colorClasses[color]}
                animate-bounce
              `}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      );
    
    case 'pulse':
      return (
        <div className={`
          ${sizeClasses[size]} rounded-full bg-current ${colorClasses[color]}
          animate-pulse ${className}
        `} />
      );
    
    case 'wave':
      return (
        <div className={`flex space-x-1 ${className}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`
                w-1 ${sizeClasses[size].split(' ')[1]} bg-current ${colorClasses[color]}
                animate-wave
              `}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      );
    
    case 'glass-loading':
    default:
      return (
        <div className={`relative ${sizeClasses[size]} ${className}`}>
          <div className="absolute inset-0 rounded-full glass-card bg-gradient-to-br from-glass-light/40 via-glass-light/30 to-glass-light/20 border border-glass-border/40 animate-pulse"></div>
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-spin-slow"></div>
          <div className="absolute inset-2 rounded-full glass-card bg-gradient-to-br from-glass-light/60 via-glass-light/40 to-glass-light/30 animate-pulse-subtle"></div>
        </div>
      );
  }
};

// Intersection Observer Animation Hook
export const useInViewAnimation = (options?: IntersectionObserverInit) => {
  const [isInView, setIsInView] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
};

// Advanced Hover Effects
interface HoverEffectProps {
  children: React.ReactNode;
  effect?: 'lift' | 'glow' | 'tilt' | 'glass-intense' | 'shimmer-wave';
  className?: string;
}

export const HoverEffect: React.FC<HoverEffectProps> = ({
  children,
  effect = 'lift',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getEffectClasses = () => {
    if (!isHovered) return '';
    
    switch (effect) {
      case 'lift':
        return 'transform -translate-y-2 scale-105 shadow-glass-4';
      case 'glow':
        return 'shadow-glass-glow brightness-110';
      case 'tilt':
        return 'transform rotate-1 scale-105 shadow-glass-3';
      case 'glass-intense':
        return 'backdrop-blur-2xl bg-gradient-to-br from-glass-light/60 via-glass-light/40 to-glass-light/30 shadow-glass-5 scale-102';
      case 'shimmer-wave':
        return 'animate-shimmer-wave shadow-glass-3 scale-102';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        transition-all duration-500 ease-out-quart
        ${getEffectClasses()} ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

export default PageTransition;