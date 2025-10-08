import React from 'react';

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: string;
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandAction[];
  placeholder?: string;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  placeholder = "Type a command or search..."
}) => {
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentCommands, setRecentCommands] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Filter commands based on query
  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) {
      // Show recent commands when no query
      const recent = recentCommands
        .map(id => commands.find(cmd => cmd.id === id))
        .filter(Boolean) as CommandAction[];
      
      return recent.slice(0, 5).concat(
        commands.filter(cmd => !recentCommands.includes(cmd.id)).slice(0, 10)
      );
    }

    const searchTerm = query.toLowerCase();
    return commands
      .filter(command => 
        command.label.toLowerCase().includes(searchTerm) ||
        command.description?.toLowerCase().includes(searchTerm) ||
        command.category.toLowerCase().includes(searchTerm) ||
        command.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      )
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.label.toLowerCase().startsWith(searchTerm) ? 1 : 0;
        const bExact = b.label.toLowerCase().startsWith(searchTerm) ? 1 : 0;
        return bExact - aExact;
      });
  }, [query, commands, recentCommands]);

  // Group commands by category
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = (command: CommandAction) => {
    command.action();
    
    // Add to recent commands
    setRecentCommands(prev => {
      const updated = [command.id, ...prev.filter(id => id !== command.id)];
      return updated.slice(0, 10); // Keep only 10 recent commands
    });
    
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Navigation': '🧭',
      'Actions': '⚡',
      'Settings': '⚙️',
      'Data': '📊',
      'AI': '🧠',
      'Sales': '💰',
      'Inventory': '📦',
      'Reports': '📈'
    };
    return icons[category] || '📋';
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Command Palette Container */}
      <div className="relative w-full max-w-2xl mx-4">
        <div className="glass-card-premium border border-glass-border/40 bg-gradient-to-br from-glass-light/40 via-glass-light/30 to-glass-light/20 backdrop-blur-3xl shadow-glass-4 rounded-3xl overflow-hidden animate-slide-up">
          
          {/* Header with Search Input */}
          <div className="p-6 border-b border-glass-border/30">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <span className="text-xl text-text-secondary/60">🔍</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="
                  w-full pl-12 pr-4 py-4 rounded-2xl
                  bg-gradient-to-br from-glass-light/30 to-glass-light/10
                  border border-glass-border/50
                  text-lg text-text-primary placeholder:text-text-secondary/60
                  outline-none
                  transition-all duration-300 ease-out-quart
                  focus:border-primary focus:shadow-glass-3
                  focus:bg-gradient-to-br focus:from-glass-light/40 focus:to-glass-light/20
                "
              />
              
              {/* Shortcut Hint */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="glass-card px-2 py-1 rounded-lg bg-glass-light/30 border border-glass-border/40">
                  <span className="text-xs text-text-secondary/80 font-mono">ESC</span>
                </div>
              </div>
            </div>
            
            {/* Query Stats */}
            {query && (
              <div className="mt-3 text-sm text-text-secondary/80">
                Found {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30 flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No commands found</h3>
                <p className="text-text-secondary/80">Try searching for something else</p>
              </div>
            ) : (
              <div className="p-3">
                {Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 px-3 py-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(category)}</span>
                      <h4 className="text-sm font-bold text-text-secondary/80 uppercase tracking-wider">
                        {category}
                      </h4>
                    </div>
                    
                    {/* Category Commands */}
                    <div className="space-y-1">
                      {commands.map((command, categoryIndex) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        const isSelected = globalIndex === selectedIndex;
                        const isRecent = recentCommands.includes(command.id);
                        
                        return (
                          <button
                            key={command.id}
                            onClick={() => executeCommand(command)}
                            className={`
                              w-full text-left p-4 rounded-2xl
                              transition-all duration-200 ease-out-quart
                              group relative overflow-hidden
                              ${isSelected 
                                ? 'bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 border border-primary/40 scale-102 shadow-glass-2' 
                                : 'hover:bg-gradient-to-br hover:from-glass-light/20 hover:to-glass-light/10 hover:border-glass-border/50 border border-transparent'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                {/* Command Icon */}
                                <div className={`
                                  w-10 h-10 rounded-xl flex items-center justify-center
                                  transition-all duration-200
                                  ${isSelected 
                                    ? 'bg-primary/30 border border-primary/50 scale-110' 
                                    : 'bg-glass-light/20 border border-glass-border/30'
                                  }
                                `}>
                                  <span className="text-lg">{command.icon}</span>
                                </div>
                                
                                {/* Command Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className={`
                                      font-semibold
                                      ${isSelected ? 'text-primary' : 'text-text-primary'}
                                    `}>
                                      {command.label}
                                    </h3>
                                    {isRecent && (
                                      <div className="px-2 py-0.5 rounded-full bg-accent/20 border border-accent/40">
                                        <span className="text-xs text-accent font-semibold">Recent</span>
                                      </div>
                                    )}
                                  </div>
                                  {command.description && (
                                    <p className="text-sm text-text-secondary/80 mt-1 leading-relaxed">
                                      {command.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Shortcut */}
                              {command.shortcut && (
                                <div className="glass-card px-2 py-1 rounded-lg bg-glass-light/30 border border-glass-border/40">
                                  <span className="text-xs text-text-secondary/80 font-mono">
                                    {command.shortcut}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Hover Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out-cubic rounded-2xl pointer-events-none"></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-glass-border/30 bg-gradient-to-r from-glass-light/20 to-glass-light/10">
            <div className="flex items-center justify-between text-sm text-text-secondary/80">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="glass-card px-1.5 py-0.5 rounded bg-glass-light/30 border border-glass-border/40">
                    <span className="text-xs font-mono">↑↓</span>
                  </div>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="glass-card px-1.5 py-0.5 rounded bg-glass-light/30 border border-glass-border/40">
                    <span className="text-xs font-mono">↵</span>
                  </div>
                  <span>Select</span>
                </div>
              </div>
              <div className="text-xs">
                {filteredCommands.length > 0 && `${selectedIndex + 1} of ${filteredCommands.length}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;