/* ==================================================
   CHARNOKS REVOLUTIONARY UI PATTERNS
   Advanced interaction patterns and micro-interactions
   ================================================== */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion';
import { cn } from '../utils/cn';
import { easings, durations, animationPresets } from '../animations/motion-system';

/* ==================================================
   INTELLIGENT FLOATING ACTION BUTTON
   ================================================== */

interface SmartFABProps {
  icon: React.ReactNode;
  actions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  hideOnScroll?: boolean;
  expandOnHover?: boolean;
}

export const SmartFAB: React.FC<SmartFABProps> = ({
  icon,
  actions = [],
  position = 'bottom-right',
  size = 'md',
  hideOnScroll = true,
  expandOnHover = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  };

  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY.current || currentScrollY < 100);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hideOnScroll]);

  const handleMainClick = () => {
    if (actions.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn('fixed z-50', positionClasses[position])}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: durations.normal, ease: easings.bounce }}
        >
          {/* Action Items */}
          <AnimatePresence>
            {isExpanded && actions.length > 0 && (
              <motion.div
                className="absolute bottom-full mb-4 space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: durations.fast }}
              >
                {actions.map((action, index) => (
                  <motion.button
                    key={index}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, y: 20 }}
                    transition={{ 
                      delay: index * 0.05,
                      duration: durations.fast,
                      ease: easings.bounce 
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={action.onClick}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full',
                      'bg-gray-700 border border-gray-600 text-white',
                      'hover:bg-gray-600 transition-colors duration-200',
                      'shadow-lg hover:shadow-xl'
                    )}
                    title={action.label}
                  >
                    {action.icon}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            className={cn(
              'flex items-center justify-center rounded-full',
              'bg-gradient-to-r from-primary-500 to-primary-600',
              'text-white shadow-2xl',
              'hover:from-primary-600 hover:to-primary-700',
              'focus:outline-none focus:ring-4 focus:ring-primary-500/30',
              sizeClasses[size]
            )}
            onClick={handleMainClick}
            onMouseEnter={() => expandOnHover && actions.length > 0 && setIsExpanded(true)}
            onMouseLeave={() => expandOnHover && setIsExpanded(false)}
            whileHover={{ scale: 1.1, rotate: actions.length > 0 ? 45 : 0 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: durations.fast, ease: easings.easeOut }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: durations.fast }}
            >
              {icon}
            </motion.div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ==================================================
   CONTEXTUAL COMMAND PALETTE
   ================================================== */

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    category?: string;
    action: () => void;
    keywords?: string[];
  }>;
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  placeholder = "Type a command or search..."
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = React.useMemo(() => {
    if (!query) return commands;
    
    return commands.filter(command => {
      const searchText = `${command.label} ${command.description} ${command.keywords?.join(' ')}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }, [commands, query]);

  const groupedCommands = React.useMemo(() => {
    const grouped = filteredCommands.reduce((acc, command) => {
      const category = command.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(command);
      return acc;
    }, {} as Record<string, typeof commands>);
    
    return grouped;
  }, [filteredCommands]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredCommands, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Command Palette */}
          <motion.div
            className="relative w-full max-w-2xl bg-gray-800 rounded-2xl shadow-5xl border border-gray-700 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: durations.normal, ease: easings.charnoks }}
          >
            {/* Search Input */}
            <div className="p-4 border-b border-gray-700">
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-gray-400 text-lg outline-none"
              />
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(groupedCommands).length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No commands found
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-900/50">
                      {category}
                    </div>
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      return (
                        <motion.button
                          key={command.id}
                          className={cn(
                            'w-full px-4 py-3 text-left flex items-center space-x-3',
                            'hover:bg-gray-700 transition-colors duration-150',
                            selectedIndex === globalIndex && 'bg-gray-700'
                          )}
                          onClick={() => {
                            command.action();
                            onClose();
                          }}
                          whileHover={{ x: 4 }}
                          transition={{ duration: durations.fast }}
                        >
                          {command.icon && (
                            <div className="w-5 h-5 text-gray-400">
                              {command.icon}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium">
                              {command.label}
                            </div>
                            {command.description && (
                              <div className="text-sm text-gray-400 truncate">
                                {command.description}
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ==================================================
   SMART NOTIFICATION SYSTEM
   ================================================== */

interface SmartNotificationProps {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    actions?: Array<{
      label: string;
      action: () => void;
      variant?: 'primary' | 'secondary';
    }>;
  }>;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onDismiss: (id: string) => void;
}

export const SmartNotificationSystem: React.FC<SmartNotificationProps> = ({
  notifications,
  position = 'top-right',
  onDismiss
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const typeStyles = {
    success: 'bg-green-800/90 border-green-600 text-green-100',
    error: 'bg-red-800/90 border-red-600 text-red-100',
    warning: 'bg-yellow-800/90 border-yellow-600 text-yellow-100',
    info: 'bg-blue-800/90 border-blue-600 text-blue-100'
  };

  const typeIcons = {
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

  return (
    <div className={cn('fixed z-50 space-y-3 max-w-sm w-full', positionClasses[position])}>
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            index={index}
            typeStyles={typeStyles}
            typeIcons={typeIcons}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem: React.FC<{
  notification: any;
  index: number;
  typeStyles: any;
  typeIcons: any;
  onDismiss: (id: string) => void;
}> = ({ notification, index, typeStyles, typeIcons, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!notification.duration) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (notification.duration / 50));
        if (newProgress <= 0) {
          onDismiss(notification.id);
          return 0;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [notification.duration, notification.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9, height: 0 }}
      transition={{ 
        duration: durations.normal, 
        ease: easings.charnoks,
        delay: index * 0.1 
      }}
      layout
      className={cn(
        'relative overflow-hidden rounded-xl border shadow-2xl backdrop-blur-xl',
        'p-4 max-w-sm w-full',
        typeStyles[notification.type]
      )}
    >
      {/* Progress Bar */}
      {notification.duration && (
        <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30">
          <motion.div
            className="h-full bg-current"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
        </div>
      )}

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {typeIcons[notification.type]}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">
            {notification.title}
          </h4>
          <p className="text-sm opacity-90">
            {notification.message}
          </p>

          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, actionIndex) => (
                <button
                  key={actionIndex}
                  onClick={action.action}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150',
                    action.variant === 'primary' 
                      ? 'bg-current text-gray-900 hover:opacity-90'
                      : 'border border-current hover:bg-current hover:text-gray-900'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

/* ==================================================
   ADAPTIVE SIDEBAR NAVIGATION
   ================================================== */

interface AdaptiveSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  items: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
    badge?: string | number;
    children?: Array<{
      id: string;
      label: string;
      href: string;
      onClick?: () => void;
    }>;
  }>;
  activeItemId?: string;
  collapsible?: boolean;
  width?: 'sm' | 'md' | 'lg';
}

export const AdaptiveSidebar: React.FC<AdaptiveSidebarProps> = ({
  isOpen,
  onToggle,
  items,
  activeItemId,
  collapsible = true,
  width = 'md'
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const widthClasses = {
    sm: 'w-60',
    md: 'w-72',
    lg: 'w-80'
  };

  const collapsedWidth = 'w-16';

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed lg:relative top-0 left-0 z-50 h-full',
          'bg-gray-900 border-r border-gray-800',
          'flex flex-col',
          isOpen ? widthClasses[width] : collapsedWidth,
          'transition-all duration-300 ease-out'
        )}
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
          width: isOpen ? undefined : collapsedWidth
        }}
        transition={{ duration: durations.normal, ease: easings.charnoks }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <AnimatePresence>
              {isOpen && (
                <motion.h2
                  className="text-xl font-semibold text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: durations.fast }}
                >
                  Charnoks
                </motion.h2>
              )}
            </AnimatePresence>
            
            {collapsible && (
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-150"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeItemId === item.id}
              isExpanded={expandedItems.has(item.id)}
              onToggleExpanded={() => toggleExpanded(item.id)}
              isCollapsed={!isOpen}
            />
          ))}
        </nav>
      </motion.aside>
    </>
  );
};

const SidebarItem: React.FC<{
  item: any;
  isActive: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  isCollapsed: boolean;
}> = ({ item, isActive, isExpanded, onToggleExpanded, isCollapsed }) => {
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpanded();
    } else if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div>
      <motion.button
        className={cn(
          'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg',
          'text-left font-medium transition-all duration-150',
          isActive 
            ? 'bg-primary-600 text-white' 
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        )}
        onClick={handleClick}
        whileHover={{ x: isCollapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-5 h-5 flex-shrink-0">
          {item.icon}
        </div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="flex-1 flex items-center justify-between min-w-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: durations.fast }}
            >
              <span className="truncate">{item.label}</span>
              
              <div className="flex items-center space-x-2">
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
                
                {hasChildren && (
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: durations.fast }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </motion.svg>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            className="ml-8 mt-2 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: durations.fast }}
          >
            {item.children.map((child: any) => (
              <motion.button
                key={child.id}
                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-150"
                onClick={child.onClick}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {child.label}
              </motion.button>
            ))}
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
  SmartFAB,
  CommandPalette,
  SmartNotificationSystem,
  AdaptiveSidebar
};