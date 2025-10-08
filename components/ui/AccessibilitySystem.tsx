import React, { createContext, useContext, useEffect, useState } from 'react';

// Accessibility Context
interface AccessibilityContextType {
  reducedMotion: boolean;
  highContrast: boolean;
  focusVisible: boolean;
  announcements: string[];
  announce: (message: string) => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Accessibility Provider
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [focusVisible, setFocusVisible] = useState(true);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Detect system preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(contrastQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };
    
    contrastQuery.addEventListener('change', handleChange);
    return () => contrastQuery.removeEventListener('change', handleChange);
  }, []);

  // Focus visibility detection
  useEffect(() => {
    let hadKeyboardEvent = true;
    
    const onPointerDown = () => {
      hadKeyboardEvent = false;
      setFocusVisible(false);
    };
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'Escape') {
        hadKeyboardEvent = true;
        setFocusVisible(true);
      }
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('pointerdown', onPointerDown);
    
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  // Apply global accessibility classes
  useEffect(() => {
    const body = document.body;
    
    if (reducedMotion) {
      body.classList.add('reduce-motion');
    } else {
      body.classList.remove('reduce-motion');
    }
    
    if (highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
    
    if (focusVisible) {
      body.classList.add('focus-visible');
    } else {
      body.classList.remove('focus-visible');
    }
  }, [reducedMotion, highContrast, focusVisible]);

  const announce = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
    
    // Clear announcement after screen reader has time to read it
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev);
    announce(reducedMotion ? 'Animations enabled' : 'Animations reduced');
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
    announce(highContrast ? 'Normal contrast enabled' : 'High contrast enabled');
  };

  return (
    <AccessibilityContext.Provider value={{
      reducedMotion,
      highContrast,
      focusVisible,
      announcements,
      announce,
      toggleReducedMotion,
      toggleHighContrast
    }}>
      {children}
      
      {/* Screen Reader Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Skip Link Component
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="
        sr-only focus:not-sr-only
        absolute top-4 left-4 z-50
        glass-card-premium px-4 py-2 rounded-lg
        bg-primary text-white font-semibold
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      "
    >
      {children}
    </a>
  );
};

// Accessible Button Component
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const { announce } = useAccessibility();

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-white border-primary',
    secondary: 'bg-surface hover:bg-surface/80 text-text-primary border-glass-border',
    ghost: 'bg-transparent hover:bg-glass-light/20 text-text-primary border-transparent',
    danger: 'bg-error hover:bg-error/90 text-white border-error'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[32px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[48px]'
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    if (props.onClick) {
      props.onClick(e);
    }
  };

  const ariaLabel = loading ? `${props['aria-label'] || 'Button'}, loading` : props['aria-label'];

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={`
        revolutionary-accessible-button
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        border rounded-xl font-semibold
        transition-all duration-300 ease-out-quart
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface
        disabled:opacity-50 disabled:cursor-not-allowed
        relative overflow-hidden
        ${className}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

// Accessible Input Component
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="revolutionary-input-group">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-text-primary mb-2"
      >
        {label}
        {required && (
          <span className="text-error ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <input
        {...props}
        id={inputId}
        required={required}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? 'true' : 'false'}
        className={`
          revolutionary-accessible-input
          w-full px-4 py-3 rounded-xl
          glass-card bg-glass-light/30 border border-glass-border/50
          text-text-primary placeholder:text-text-secondary/60
          transition-all duration-300 ease-out-quart
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface
          focus:border-primary focus:bg-glass-light/40
          ${error ? 'border-error focus:ring-error' : ''}
          ${className}
        `}
      />
      
      {error && (
        <div id={errorId} className="mt-2 text-sm text-error" role="alert">
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={helperId} className="mt-2 text-sm text-text-secondary">
          {helperText}
        </div>
      )}
    </div>
  );
};

// Accessible Modal Component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  const { announce } = useAccessibility();
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal after it opens
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
      
      announce(`Modal opened: ${title}`);
    } else {
      // Return focus to previous element
      previousFocusRef.current?.focus();
      announce('Modal closed');
    }
  }, [isOpen, title, announce]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab);
    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className={`
            revolutionary-accessible-modal
            glass-card-premium p-6 rounded-2xl
            bg-gradient-to-br from-glass-light/40 via-glass-light/30 to-glass-light/20
            border border-glass-border/50 shadow-glass-5
            backdrop-blur-xl
            max-w-md w-full
            transition-all duration-300 ease-out-quart
            ${className}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 id="modal-title" className="text-xl font-bold text-text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg glass-card bg-glass-light/30 border border-glass-border/40 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-glass-light/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

// Accessible Tooltip Component
interface AccessibleTooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  placement = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = React.useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={isVisible ? tooltipId.current : undefined}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={`
            absolute z-50 px-3 py-2 text-sm
            glass-card-premium bg-surface border border-glass-border/50
            rounded-lg shadow-glass-3 backdrop-blur-xl
            text-text-primary pointer-events-none
            ${placementClasses[placement]}
            animate-fade-in
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// Accessibility Settings Panel
export const AccessibilitySettings: React.FC = () => {
  const { reducedMotion, highContrast, toggleReducedMotion, toggleHighContrast } = useAccessibility();

  return (
    <div className="revolutionary-accessibility-settings p-6 glass-card rounded-2xl">
      <h3 className="text-lg font-bold text-text-primary mb-4">
        Accessibility Settings
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="reduced-motion" className="text-text-primary font-medium">
            Reduce Motion
          </label>
          <button
            id="reduced-motion"
            onClick={toggleReducedMotion}
            className={`
              w-12 h-6 rounded-full border-2 transition-colors duration-300
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${reducedMotion 
                ? 'bg-primary border-primary' 
                : 'bg-gray-300 border-gray-300'
              }
            `}
            role="switch"
            aria-checked={reducedMotion}
          >
            <div
              className={`
                w-4 h-4 bg-white rounded-full transition-transform duration-300
                ${reducedMotion ? 'transform translate-x-6' : 'transform translate-x-0'}
              `}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <label htmlFor="high-contrast" className="text-text-primary font-medium">
            High Contrast
          </label>
          <button
            id="high-contrast"
            onClick={toggleHighContrast}
            className={`
              w-12 h-6 rounded-full border-2 transition-colors duration-300
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              ${highContrast 
                ? 'bg-primary border-primary' 
                : 'bg-gray-300 border-gray-300'
              }
            `}
            role="switch"
            aria-checked={highContrast}
          >
            <div
              className={`
                w-4 h-4 bg-white rounded-full transition-transform duration-300
                ${highContrast ? 'transform translate-x-6' : 'transform translate-x-0'}
              `}
            />
          </button>
        </div>
      </div>
    </div>
  );
};