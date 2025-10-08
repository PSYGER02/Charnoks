/* ==================================================
   CHARNOKS REVOLUTIONARY COMPONENT LIBRARY
   Next-generation React components with world-class design
   ================================================== */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

/* ==================================================
   BUTTON COMPONENT SYSTEM
   ================================================== */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'destructive' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  elevated?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: `
    bg-gradient-to-r from-primary-500 to-primary-600 
    text-white border-0
    hover:from-primary-600 hover:to-primary-700
    active:from-primary-700 active:to-primary-800
    focus:ring-2 focus:ring-primary-500/50
    disabled:from-gray-400 disabled:to-gray-500
    shadow-lg hover:shadow-xl
  `,
  secondary: `
    bg-gradient-to-r from-gray-600 to-gray-700
    text-white border-0  
    hover:from-gray-700 hover:to-gray-800
    active:from-gray-800 active:to-gray-900
    focus:ring-2 focus:ring-gray-500/50
    disabled:from-gray-400 disabled:to-gray-500
    shadow-md hover:shadow-lg
  `,
  tertiary: `
    bg-transparent border border-primary-400
    text-primary-400 
    hover:bg-primary-500/10 hover:border-primary-300 hover:text-primary-300
    active:bg-primary-500/20
    focus:ring-2 focus:ring-primary-500/50
    disabled:border-gray-500 disabled:text-gray-500
  `,
  ghost: `
    bg-transparent border-0
    text-gray-300
    hover:bg-gray-800/50 hover:text-white
    active:bg-gray-800/80
    focus:ring-2 focus:ring-gray-500/50
    disabled:text-gray-600
  `,
  destructive: `
    bg-gradient-to-r from-red-500 to-red-600
    text-white border-0
    hover:from-red-600 hover:to-red-700
    active:from-red-700 active:to-red-800
    focus:ring-2 focus:ring-red-500/50
    disabled:from-gray-400 disabled:to-gray-500
    shadow-lg hover:shadow-xl
  `,
  success: `
    bg-gradient-to-r from-green-500 to-green-600
    text-white border-0
    hover:from-green-600 hover:to-green-700
    active:from-green-700 active:to-green-800
    focus:ring-2 focus:ring-green-500/50
    disabled:from-gray-400 disabled:to-gray-500
    shadow-lg hover:shadow-xl
  `,
  warning: `
    bg-gradient-to-r from-yellow-500 to-yellow-600
    text-white border-0
    hover:from-yellow-600 hover:to-yellow-700
    active:from-yellow-700 active:to-yellow-800
    focus:ring-2 focus:ring-yellow-500/50
    disabled:from-gray-400 disabled:to-gray-500
    shadow-lg hover:shadow-xl
  `
};

const buttonSizes = {
  xs: 'px-2 py-1 text-xs rounded-md min-h-[24px]',
  sm: 'px-3 py-1.5 text-sm rounded-lg min-h-[32px]',
  md: 'px-4 py-2 text-base rounded-lg min-h-[40px]',
  lg: 'px-6 py-3 text-lg rounded-xl min-h-[48px]',
  xl: 'px-8 py-4 text-xl rounded-xl min-h-[56px]',
  '2xl': 'px-10 py-5 text-2xl rounded-2xl min-h-[64px]'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  elevated = false,
  glow = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const buttonClass = cn(
    // Base styles
    'relative inline-flex items-center justify-center',
    'font-medium transition-all duration-300 ease-out',
    'focus:outline-none focus-visible:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transform hover:scale-[1.02] active:scale-[0.98]',
    
    // Variant styles
    buttonVariants[variant],
    
    // Size styles
    buttonSizes[size],
    
    // Conditional styles
    fullWidth && 'w-full',
    elevated && 'shadow-2xl hover:shadow-3xl',
    glow && `drop-shadow-glow-${variant}`,
    loading && 'cursor-wait',
    
    className
  );

  const iconClass = cn(
    'flex-shrink-0',
    size === 'xs' && 'w-3 h-3',
    size === 'sm' && 'w-4 h-4',
    size === 'md' && 'w-5 h-5',
    size === 'lg' && 'w-6 h-6',
    size === 'xl' && 'w-7 h-7',
    size === '2xl' && 'w-8 h-8',
    iconPosition === 'left' && children && 'mr-2',
    iconPosition === 'right' && children && 'ml-2'
  );

  const LoadingSpinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(iconClass, 'border-2 border-current border-t-transparent rounded-full')}
    />
  );

  return (
    <motion.button
      className={buttonClass}
      disabled={disabled || loading}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className={iconClass}>{icon}</span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && (
              <span className={iconClass}>{icon}</span>
            )}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

/* ==================================================
   INPUT COMPONENT SYSTEM
   ================================================== */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'default' | 'filled' | 'outlined' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  success?: boolean;
}

const inputVariants = {
  default: `
    bg-gray-800/50 border border-gray-600
    focus:bg-gray-800 focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50
    hover:border-gray-500
  `,
  filled: `
    bg-gray-700 border border-transparent
    focus:bg-gray-600 focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50
    hover:bg-gray-650
  `,
  outlined: `
    bg-transparent border-2 border-gray-600
    focus:border-primary-400 focus:ring-1 focus:ring-primary-400/50
    hover:border-gray-500
  `,
  ghost: `
    bg-transparent border-0 border-b-2 border-gray-600
    focus:border-primary-400 focus:ring-0
    hover:border-gray-500
    rounded-none
  `
};

const inputSizes = {
  sm: 'px-3 py-2 text-sm rounded-lg min-h-[36px]',
  md: 'px-4 py-3 text-base rounded-xl min-h-[44px]',
  lg: 'px-5 py-4 text-lg rounded-xl min-h-[52px]',
  xl: 'px-6 py-5 text-xl rounded-2xl min-h-[60px]'
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  variant = 'default',
  inputSize = 'md',
  loading = false,
  success = false,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  const inputClass = cn(
    // Base styles
    'w-full font-medium transition-all duration-300 ease-out',
    'text-white placeholder-gray-400',
    'focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    
    // Variant styles
    inputVariants[variant],
    
    // Size styles
    inputSizes[inputSize],
    
    // State styles
    hasError && 'border-red-500 focus:border-red-400 focus:ring-red-400/50',
    hasSuccess && 'border-green-500 focus:border-green-400 focus:ring-green-400/50',
    
    // Icon padding
    icon && iconPosition === 'left' && 'pl-10',
    icon && iconPosition === 'right' && 'pr-10',
    
    className
  );

  const iconClass = cn(
    'absolute top-1/2 transform -translate-y-1/2 text-gray-400',
    inputSize === 'sm' && 'w-4 h-4',
    inputSize === 'md' && 'w-5 h-5',
    inputSize === 'lg' && 'w-6 h-6',
    inputSize === 'xl' && 'w-7 h-7',
    iconPosition === 'left' && 'left-3',
    iconPosition === 'right' && 'right-3',
    hasError && 'text-red-400',
    hasSuccess && 'text-green-400'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full"
    >
      {label && (
        <motion.label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-200 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        <input
          id={inputId}
          className={inputClass}
          {...props}
        />
        
        {icon && (
          <div className={iconClass}>
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="border-2 border-current border-t-transparent rounded-full w-full h-full"
              />
            ) : (
              icon
            )}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {(error || hint) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            {error && (
              <p className="text-sm text-red-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {hint && !error && (
              <p className="text-sm text-gray-400">{hint}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ==================================================
   CARD COMPONENT SYSTEM
   ================================================== */

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'outlined' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
  glow?: boolean;
  className?: string;
}

const cardVariants = {
  default: 'bg-gray-800 border border-gray-700',
  elevated: 'bg-gray-800 border border-gray-700 shadow-2xl',
  glass: 'bg-gray-800/50 backdrop-blur-xl border border-gray-600/50',
  outlined: 'bg-transparent border-2 border-gray-600',
  gradient: 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-gray-700'
};

const cardPadding = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10'
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  interactive = false,
  glow = false,
  className
}) => {
  const cardClass = cn(
    // Base styles
    'rounded-2xl transition-all duration-300 ease-out',
    
    // Variant styles
    cardVariants[variant],
    
    // Padding styles
    cardPadding[padding],
    
    // Interactive styles
    interactive && 'cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]',
    hover && 'hover:shadow-3xl hover:border-gray-600',
    glow && 'hover:shadow-glow-primary',
    
    className
  );

  const MotionCard = interactive ? motion.div : 'div';

  const motionProps = interactive ? {
    whileHover: { scale: 1.02, y: -4 },
    whileTap: { scale: 0.98 },
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: "easeOut" }
  } : {};

  return (
    <MotionCard className={cardClass} {...motionProps}>
      {children}
    </MotionCard>
  );
};

/* ==================================================
   MODAL COMPONENT SYSTEM
   ================================================== */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const modalSizes = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[95vw] max-h-[95vh]'
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true
}) => {
  React.useEffect(() => {
    if (!closeOnEscape) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              'relative w-full bg-gray-800 rounded-3xl shadow-5xl border border-gray-700',
              'max-h-[90vh] overflow-auto',
              modalSizes[size]
            )}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                {title && (
                  <h2 className="text-xl font-semibold text-white">{title}</h2>
                )}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="ml-auto"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  />
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ==================================================
   TOAST NOTIFICATION SYSTEM
   ================================================== */

interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose?: (id: string) => void;
}

const toastVariants = {
  success: 'bg-green-800 border-green-600 text-green-100',
  error: 'bg-red-800 border-red-600 text-red-100',
  warning: 'bg-yellow-800 border-yellow-600 text-yellow-100',
  info: 'bg-blue-800 border-blue-600 text-blue-100'
};

const toastIcons = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose
}) => {
  React.useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        'flex items-start p-4 rounded-xl border shadow-lg max-w-sm w-full',
        'backdrop-blur-xl',
        toastVariants[type]
      )}
    >
      <div className="flex-shrink-0 mr-3">
        {toastIcons[type]}
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-medium text-sm mb-1">{title}</p>
        )}
        <p className="text-sm opacity-90">{message}</p>
      </div>
      
      {onClose && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onClose(id)}
          className="ml-2 opacity-70 hover:opacity-100"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
      )}
    </motion.div>
  );
};

/* ==================================================
   LOADING COMPONENTS
   ================================================== */

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
}

const spinnerSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const spinnerColors = {
  primary: 'border-primary-500',
  secondary: 'border-gray-400',
  white: 'border-white',
  gray: 'border-gray-600'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary'
}) => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn(
        'border-2 border-t-transparent rounded-full',
        spinnerSizes[size],
        spinnerColors[color]
      )}
    />
  );
};

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className
}) => {
  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-700 rounded',
            i === lines - 1 && 'w-3/4',
            i === 0 && 'w-1/2'
          )}
        />
      ))}
    </div>
  );
};

/* ==================================================
   DROPDOWN COMPONENT
   ================================================== */

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  offset?: number;
  closeOnSelect?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  placement = 'bottom-left',
  offset = 8,
  closeOnSelect = true
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const placementClasses = {
    'bottom-left': 'top-full left-0',
    'bottom-right': 'top-full right-0',
    'top-left': 'bottom-full left-0',
    'top-right': 'bottom-full right-0'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: placement.includes('top') ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: placement.includes('top') ? 10 : -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              'absolute z-dropdown min-w-[200px]',
              'bg-gray-800 border border-gray-700 rounded-xl shadow-5xl',
              'py-2 backdrop-blur-xl',
              placementClasses[placement]
            )}
            style={{ 
              marginTop: placement.includes('bottom') ? offset : undefined,
              marginBottom: placement.includes('top') ? offset : undefined
            }}
            onClick={closeOnSelect ? () => setIsOpen(false) : undefined}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================
   TOOLTIP COMPONENT
   ================================================== */

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'absolute z-tooltip px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl',
              'whitespace-nowrap pointer-events-none',
              placementClasses[placement]
            )}
          >
            {content}
            <div className={cn('absolute w-0 h-0 border-4', arrowClasses[placement])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================
   EXPORTS
   ================================================== */

export {
  Button,
  Input,
  Card,
  Modal,
  Toast,
  LoadingSpinner,
  LoadingSkeleton,
  Dropdown,
  Tooltip
};

// Component composition examples and patterns
export const ButtonGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('flex gap-2', className)}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('pb-4 border-b border-gray-700 mb-6', className)}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => (
  <div className={cn('pt-4 border-t border-gray-700 mt-6', className)}>
    {children}
  </div>
);