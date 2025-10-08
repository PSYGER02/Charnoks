import React from 'react';

// Performance-optimized lazy loading utility
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ComponentType<any>
) => {
  const LazyComponent = React.lazy(importFn);
  
  const WrappedComponent = (props: any) => {
    const FallbackComponent = fallback || (() => 
      React.createElement('div', {
        className: 'flex items-center justify-center p-8'
      }, React.createElement('div', {
        className: 'w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin'
      }))
    );

    return React.createElement(
      React.Suspense,
      { fallback: React.createElement(FallbackComponent) },
      React.createElement(LazyComponent, props)
    );
  };
  
  return WrappedComponent;
};

// Critical CSS inlining utility
export const inlineCritical = (css: string) => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);
  }
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const measurePerformance = (name: string, fn: () => void) => {
    if (typeof performance !== 'undefined') {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
    } else {
      fn();
    }
  };

  const measureAsyncPerformance = async (name: string, fn: () => Promise<void>) => {
    if (typeof performance !== 'undefined') {
      const start = performance.now();
      await fn();
      const end = performance.now();
      console.log(`${name} took ${end - start} milliseconds`);
    } else {
      await fn();
    }
  };

  return { measurePerformance, measureAsyncPerformance };
};

// Image optimization utility
export const optimizeImage = (src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
} = {}) => {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // For development, return original src
  if (process.env.NODE_ENV === 'development') {
    return src;
  }
  
  // In production, you would integrate with an image optimization service
  let optimizedSrc = src;
  
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);
  
  if (params.toString()) {
    optimizedSrc += `?${params.toString()}`;
  }
  
  return optimizedSrc;
};

// GPU acceleration utility for animations
export const enableGPUAcceleration = (element: HTMLElement) => {
  element.style.transform = 'translateZ(0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
  element.style.willChange = 'transform, opacity';
};

// Memory management for large datasets
export class VirtualizedList {
  private container: HTMLElement;
  private items: any[];
  private itemHeight: number;
  private viewportHeight: number;
  private scrollTop: number = 0;
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 };

  constructor(
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    viewportHeight: number
  ) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.viewportHeight = viewportHeight;
    this.calculateVisibleRange();
    this.setupScrollListener();
  }

  private calculateVisibleRange() {
    const start = Math.floor(this.scrollTop / this.itemHeight);
    const end = Math.min(
      start + Math.ceil(this.viewportHeight / this.itemHeight) + 1,
      this.items.length
    );
    this.visibleRange = { start, end };
  }

  private setupScrollListener() {
    this.container.addEventListener('scroll', () => {
      this.scrollTop = this.container.scrollTop;
      this.calculateVisibleRange();
      this.render();
    });
  }

  render() {
    // Implementation would render only visible items
    const visibleItems = this.items.slice(this.visibleRange.start, this.visibleRange.end);
    return visibleItems;
  }

  getVisibleItems() {
    return this.items.slice(this.visibleRange.start, this.visibleRange.end);
  }
}

// Bundle size analyzer utility
export const analyzeBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    
    const totalJSSize = jsResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
    
    const totalCSSSize = cssResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
    
    console.log('Bundle Analysis:', {
      totalJSSize: `${(totalJSSize / 1024).toFixed(2)} KB`,
      totalCSSSize: `${(totalCSSSize / 1024).toFixed(2)} KB`,
      totalSize: `${((totalJSSize + totalCSSSize) / 1024).toFixed(2)} KB`,
      loadTime: `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
      jsResources: jsResources.length,
      cssResources: cssResources.length
    });
  }
};

// Progressive loading utility
export const useProgressiveLoading = <T>(
  loader: () => Promise<T>,
  fallback: T
) => {
  const [data, setData] = React.useState<T>(fallback);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    
    loader().then(result => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    }).catch(error => {
      if (!cancelled) {
        console.error('Progressive loading failed:', error);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
};

// Web Workers utility for heavy computations
export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private busy: boolean[] = [];

  constructor(workerScript: string, poolSize: number = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      this.workers.push(worker);
      this.busy.push(false);
      
      worker.onmessage = (e) => {
        this.busy[i] = false;
        this.processQueue();
      };
    }
  }

  execute(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    const availableWorkerIndex = this.busy.findIndex(busy => !busy);
    if (availableWorkerIndex === -1) return;

    const { data, resolve, reject } = this.queue.shift()!;
    this.busy[availableWorkerIndex] = true;
    
    const worker = this.workers[availableWorkerIndex];
    
    const handleMessage = (e: MessageEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      resolve(e.data);
    };
    
    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      reject(error);
    };
    
    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage(data);
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.busy = [];
    this.queue = [];
  }
}

// CSS-in-JS optimization
export const createOptimizedStyles = (styles: Record<string, any>) => {
  const optimized: Record<string, string> = {};
  
  Object.entries(styles).forEach(([key, value]) => {
    if (typeof value === 'object') {
      // Flatten nested styles and optimize
      const flattened = Object.entries(value)
        .map(([prop, val]) => `${prop}: ${val}`)
        .join('; ');
      optimized[key] = flattened;
    } else {
      optimized[key] = value;
    }
  });
  
  return optimized;
};

// Animation frame throttling
export const useAnimationFrame = (callback: () => void, deps: React.DependencyList) => {
  const callbackRef = React.useRef(callback);
  const frameRef = React.useRef<number>();

  React.useEffect(() => {
    callbackRef.current = callback;
  });

  React.useEffect(() => {
    const tick = () => {
      callbackRef.current();
      frameRef.current = requestAnimationFrame(tick);
    };
    
    frameRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, deps);
};

// Critical resource preloading
export const preloadCriticalResources = (resources: string[]) => {
  if (typeof document === 'undefined') return;

  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.match(/\.(woff2?|ttf|otf)$/)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (resource.match(/\.(jpg|jpeg|png|webp|avif|svg)$/)) {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  });
};

// Performance budget checker
export const checkPerformanceBudget = (budgets: {
  maxJSSize?: number; // in KB
  maxCSSSize?: number; // in KB
  maxLoadTime?: number; // in ms
  maxFCP?: number; // First Contentful Paint in ms
  maxLCP?: number; // Largest Contentful Paint in ms
}) => {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    
    entries.forEach(entry => {
      if (entry.entryType === 'paint') {
        if (entry.name === 'first-contentful-paint' && budgets.maxFCP) {
          if (entry.startTime > budgets.maxFCP) {
            console.warn(`FCP exceeded budget: ${entry.startTime}ms > ${budgets.maxFCP}ms`);
          }
        }
      }
      
      if (entry.entryType === 'largest-contentful-paint' && budgets.maxLCP) {
        if (entry.startTime > budgets.maxLCP) {
          console.warn(`LCP exceeded budget: ${entry.startTime}ms > ${budgets.maxLCP}ms`);
        }
      }
    });
  });

  observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
};

// Export performance optimization utilities
export default {
  createLazyComponent,
  inlineCritical,
  usePerformanceMonitor,
  optimizeImage,
  enableGPUAcceleration,
  VirtualizedList,
  analyzeBundleSize,
  useProgressiveLoading,
  WorkerPool,
  createOptimizedStyles,
  useAnimationFrame,
  preloadCriticalResources,
  checkPerformanceBudget
};