import React from 'react';

interface SmartFABAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  color?: 'primary' | 'success' | 'warning' | 'error';
  disabled?: boolean;
}

interface SmartFABProps {
  mainAction?: SmartFABAction;
  subActions?: SmartFABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'glassmorphism' | 'solid';
}

const SmartFAB: React.FC<SmartFABProps> = ({ 
  mainAction, 
  subActions = [], 
  position = 'bottom-right', 
  theme = 'glassmorphism' 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [lastAction, setLastAction] = React.useState<string | null>(null);

  const getPositionClasses = () => {
    const positions = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6'
    };
    return positions[position];
  };

  const getSubActionPosition = (index: number) => {
    const isBottom = position.includes('bottom');
    const isRight = position.includes('right');
    
    const spacing = 70; // Distance between actions
    const offset = (index + 1) * spacing;
    
    if (position === 'bottom-right') {
      return { bottom: `${offset}px`, right: '0px' };
    } else if (position === 'bottom-left') {
      return { bottom: `${offset}px`, left: '0px' };
    } else if (position === 'top-right') {
      return { top: `${offset}px`, right: '0px' };
    } else {
      return { top: `${offset}px`, left: '0px' };
    }
  };

  const getColorClasses = (color: SmartFABAction['color'] = 'primary') => {
    const colors = {
      primary: 'from-primary via-primary to-accent',
      success: 'from-green-500 via-green-600 to-emerald-500',
      warning: 'from-yellow-500 via-orange-500 to-red-500',
      error: 'from-red-500 via-red-600 to-pink-500'
    };
    return colors[color];
  };

  const handleMainAction = () => {
    if (subActions.length > 0) {
      setIsExpanded(!isExpanded);
    } else if (mainAction) {
      mainAction.action();
      setLastAction(mainAction.id);
      // Visual feedback
      setTimeout(() => setLastAction(null), 2000);
    }
  };

  const handleSubAction = (action: SmartFABAction) => {
    action.action();
    setLastAction(action.id);
    setIsExpanded(false);
    // Visual feedback
    setTimeout(() => setLastAction(null), 2000);
  };

  return (
    <div className={`smart-fab fixed z-50 ${getPositionClasses()}`}>
      {/* Sub Actions */}
      {subActions.map((action, index) => (
        <div
          key={action.id}
          className={`
            absolute transition-all duration-500 ease-out-quart
            ${isExpanded 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-75 translate-y-4'
            }
          `}
          style={{
            ...getSubActionPosition(index),
            transitionDelay: isExpanded ? `${index * 50}ms` : '0ms'
          }}
        >
          {/* Action Label */}
          <div className={`
            absolute ${position.includes('right') ? 'right-16' : 'left-16'} 
            top-1/2 transform -translate-y-1/2
            ${position.includes('right') ? 'translate-x-0' : 'translate-x-0'}
            transition-all duration-300 ease-out-quart
            ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          `}
          style={{ transitionDelay: isExpanded ? `${(index + 1) * 100}ms` : '0ms' }}>
            <div className="glass-card-premium px-3 py-2 rounded-xl border border-glass-border/40 bg-gradient-to-br from-glass-light/40 via-glass-light/30 to-glass-light/20 backdrop-blur-xl shadow-glass-3">
              <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
                {action.label}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleSubAction(action)}
            disabled={action.disabled}
            className={`
              w-12 h-12 rounded-2xl
              glass-card-premium border border-glass-border/40
              bg-gradient-to-br ${getColorClasses(action.color)}
              backdrop-blur-2xl shadow-glass-3
              flex items-center justify-center
              transition-all duration-300 ease-out-quart
              hover:scale-110 hover:shadow-glass-4
              active:scale-95
              ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${lastAction === action.id ? 'animate-bounce scale-110' : ''}
              group relative overflow-hidden
            `}
          >
            <span className="text-lg filter drop-shadow-sm relative z-10">
              {action.icon}
            </span>
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out-cubic rounded-2xl"></div>
          </button>
        </div>
      ))}

      {/* Main FAB Button */}
      <button
        onClick={handleMainAction}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          smart-fab-main w-16 h-16 rounded-3xl
          glass-card-premium border border-glass-border/40
          bg-gradient-to-br ${getColorClasses(mainAction?.color)}
          backdrop-blur-2xl shadow-glass-3
          flex items-center justify-center
          transition-all duration-500 ease-out-quart
          hover:scale-110 hover:shadow-glass-4
          active:scale-95
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
          ${isHovered ? 'scale-110 shadow-glass-4' : ''}
          ${lastAction === mainAction?.id ? 'animate-bounce scale-110' : ''}
          group relative overflow-hidden
        `}
      >
        {/* Icon */}
        <span className={`
          text-2xl filter drop-shadow-sm relative z-10
          transition-transform duration-300 ease-out-quart
          ${isExpanded ? 'rotate-45' : 'rotate-0'}
        `}>
          {subActions.length > 0 
            ? (isExpanded ? '✕' : mainAction?.icon || '✚')
            : mainAction?.icon || '✚'
          }
        </span>
        
        {/* Revolutionary Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out-cubic rounded-3xl"></div>
        
        {/* Pulsing Ring for Attention */}
        {!isExpanded && (
          <div className="absolute inset-0 rounded-3xl border-2 border-white/30 animate-ping opacity-30"></div>
        )}
        
        {/* Smart Glow Effect */}
        <div className={`
          absolute inset-0 rounded-3xl pointer-events-none
          transition-opacity duration-500
          ${isHovered || isExpanded ? 'opacity-100' : 'opacity-0'}
          bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20
          blur-xl -z-10
        `}></div>
      </button>

      {/* Backdrop for closing */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default SmartFAB;