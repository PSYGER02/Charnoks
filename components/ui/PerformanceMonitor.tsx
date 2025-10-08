import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  bundleSize: number;
  jsHeapSize: number;
  loadTime: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  budgets?: {
    fcp?: number;
    lcp?: number;
    fid?: number;
    cls?: number;
    bundleSize?: number;
  };
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  budgets = {
    fcp: 1800, // 1.8s
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1 score
    bundleSize: 500 // 500KB
  }
}) => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const newMetrics: Partial<PerformanceMetrics> = {
        ttfb: navigation.responseStart - navigation.requestStart,
        loadTime: navigation.loadEventEnd - navigation.loadEventStart
      };

      // Collect paint metrics
      paint.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          newMetrics.fcp = entry.startTime;
        }
      });

      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.jsHeapSize = memory.usedJSHeapSize / 1024 / 1024; // MB
      }

      // Bundle size estimation
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.name.endsWith('.js'));
      const totalSize = jsResources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
      newMetrics.bundleSize = totalSize / 1024; // KB

      setMetrics(newMetrics);
      checkBudgets(newMetrics);
    };

    const checkBudgets = (currentMetrics: Partial<PerformanceMetrics>) => {
      const newViolations: string[] = [];

      if (budgets.fcp && currentMetrics.fcp && currentMetrics.fcp > budgets.fcp) {
        newViolations.push(`FCP exceeded budget: ${currentMetrics.fcp.toFixed(0)}ms > ${budgets.fcp}ms`);
      }
      if (budgets.lcp && currentMetrics.lcp && currentMetrics.lcp > budgets.lcp) {
        newViolations.push(`LCP exceeded budget: ${currentMetrics.lcp.toFixed(0)}ms > ${budgets.lcp}ms`);
      }
      if (budgets.fid && currentMetrics.fid && currentMetrics.fid > budgets.fid) {
        newViolations.push(`FID exceeded budget: ${currentMetrics.fid.toFixed(0)}ms > ${budgets.fid}ms`);
      }
      if (budgets.cls && currentMetrics.cls && currentMetrics.cls > budgets.cls) {
        newViolations.push(`CLS exceeded budget: ${currentMetrics.cls.toFixed(3)} > ${budgets.cls}`);
      }
      if (budgets.bundleSize && currentMetrics.bundleSize && currentMetrics.bundleSize > budgets.bundleSize) {
        newViolations.push(`Bundle size exceeded budget: ${currentMetrics.bundleSize.toFixed(0)}KB > ${budgets.bundleSize}KB`);
      }

      setViolations(newViolations);
    };

    // Performance Observer for Web Vitals
    const observeWebVitals = () => {
      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            setMetrics(prev => ({ ...prev, cls: clsValue }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
          console.warn('Performance Observer not fully supported');
        }
      }
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      collectMetrics();
      observeWebVitals();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          collectMetrics();
          observeWebVitals();
        }, 1000);
      });
    }
  }, [enabled]);

  if (!enabled) return null;

  const getScoreColor = (value: number, budget: number, reverse = false) => {
    const ratio = value / budget;
    if (reverse) {
      return ratio > 1.2 ? 'text-error' : ratio > 1 ? 'text-warning' : 'text-success';
    }
    return ratio < 0.8 ? 'text-success' : ratio < 1 ? 'text-warning' : 'text-error';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="glass-card-premium p-4 rounded-xl border border-glass-border/50 bg-gradient-to-br from-glass-light/40 via-glass-light/30 to-glass-light/20 backdrop-blur-xl shadow-glass-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text-primary">Performance</h3>
          <div className={`w-3 h-3 rounded-full ${violations.length === 0 ? 'bg-success' : 'bg-warning'}`} />
        </div>

        <div className="space-y-2 text-xs">
          {metrics.fcp && (
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">FCP:</span>
              <span className={getScoreColor(metrics.fcp, budgets.fcp || 1800)}>
                {metrics.fcp.toFixed(0)}ms
              </span>
            </div>
          )}
          
          {metrics.lcp && (
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">LCP:</span>
              <span className={getScoreColor(metrics.lcp, budgets.lcp || 2500)}>
                {metrics.lcp.toFixed(0)}ms
              </span>
            </div>
          )}
          
          {metrics.fid && (
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">FID:</span>
              <span className={getScoreColor(metrics.fid, budgets.fid || 100)}>
                {metrics.fid.toFixed(0)}ms
              </span>
            </div>
          )}
          
          {metrics.cls !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">CLS:</span>
              <span className={getScoreColor(metrics.cls, budgets.cls || 0.1)}>
                {metrics.cls.toFixed(3)}
              </span>
            </div>
          )}
          
          {metrics.bundleSize && (
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Bundle:</span>
              <span className={getScoreColor(metrics.bundleSize, budgets.bundleSize || 500)}>
                {metrics.bundleSize.toFixed(0)}KB
              </span>
            </div>
          )}
          
          {metrics.jsHeapSize && (
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Memory:</span>
              <span className="text-text-primary">
                {metrics.jsHeapSize.toFixed(1)}MB
              </span>
            </div>
          )}
        </div>

        {violations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-glass-border/30">
            <div className="text-xs text-warning font-semibold mb-1">Budget Violations:</div>
            {violations.map((violation, index) => (
              <div key={index} className="text-xs text-warning opacity-80">
                {violation}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Resource preloading component
export const ResourcePreloader: React.FC<{ resources: string[] }> = ({ resources }) => {
  useEffect(() => {
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
  }, [resources]);

  return null;
};

// Critical CSS inline component
export const CriticalCSS: React.FC<{ css: string }> = ({ css }) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [css]);

  return null;
};

export default PerformanceMonitor;