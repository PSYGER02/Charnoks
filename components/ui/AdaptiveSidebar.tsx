import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
  category?: string;
  shortcut?: string;
  description?: string;
}

interface AdaptiveSidebarProps {
  items: SidebarItem[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showCategories?: boolean;
  enableSearch?: boolean;
  enableShortcuts?: boolean;
}

const AdaptiveSidebar: React.FC<AdaptiveSidebarProps> = ({
  items,
  isCollapsed = false,
  onToggleCollapse,
  showCategories = true,
  enableSearch = true,
  enableShortcuts = true
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const [recentItems, setRecentItems] = React.useState<string[]>([]);

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Group items by category
  const groupedItems = React.useMemo(() => {
    if (!showCategories) {
      return { 'All': filteredItems };
    }

    const groups: Record<string, SidebarItem[]> = {};
    
    // Add recent items section if available
    if (recentItems.length > 0 && !searchQuery) {
      const recent = recentItems
        .map(id => items.find(item => item.id === id))
        .filter(Boolean) as SidebarItem[];
      
      if (recent.length > 0) {
        groups['Recent'] = recent.slice(0, 5);
      }
    }

    filteredItems.forEach(item => {
      const category = item.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      if (!groups['Recent'] || !groups['Recent'].some(r => r.id === item.id)) {
        groups[category].push(item);
      }
    });

    return groups;
  }, [filteredItems, showCategories, recentItems, searchQuery, items]);

  // Handle navigation
  const handleNavigation = (item: SidebarItem) => {
    navigate(item.path);
    
    // Add to recent items
    setRecentItems(prev => {
      const updated = [item.id, ...prev.filter(id => id !== item.id)];
      return updated.slice(0, 10);
    });
  };

  // Handle keyboard shortcuts
  React.useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + number shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const item = filteredItems[index];
        if (item) {
          handleNavigation(item);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcuts, filteredItems]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Recent': '⏱️',
      'Dashboard': '📊',
      'Sales': '💰',
      'Inventory': '📦',
      'Analytics': '📈',
      'Settings': '⚙️',
      'AI Tools': '🧠',
      'Reports': '📋',
      'General': '📁'
    };
    return icons[category] || '📂';
  };

  const isActiveItem = (item: SidebarItem) => {
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <div className={`
      adaptive-sidebar h-full
      glass-card-premium border-r border-glass-border/40
      bg-gradient-to-b from-glass-light/40 via-glass-light/30 to-glass-light/20
      backdrop-blur-3xl shadow-glass-3
      transition-all duration-500 ease-out-quart
      ${isCollapsed ? 'w-20' : 'w-80'}
      flex flex-col
    `}>
      
      {/* Header */}
      <div className="p-6 border-b border-glass-border/30">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="space-y-1">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Charnoks POS
              </h2>
              <p className="text-sm text-text-secondary/80">
                Revolutionary Interface
              </p>
            </div>
          )}
          
          {/* Collapse Toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`
                w-10 h-10 rounded-xl
                glass-card bg-glass-light/30 border border-glass-border/40
                flex items-center justify-center
                transition-all duration-300 ease-out-quart
                hover:scale-110 hover:bg-glass-light/50
                ${isCollapsed ? 'mx-auto' : ''}
              `}
            >
              <span className={`
                text-lg transition-transform duration-300
                ${isCollapsed ? 'rotate-180' : ''}
              `}>
                ◀
              </span>
            </button>
          )}
        </div>
        
        {/* Search Bar */}
        {!isCollapsed && enableSearch && (
          <div className="mt-4 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <span className="text-text-secondary/60">🔍</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search navigation..."
              className="
                w-full pl-10 pr-4 py-3 rounded-xl
                bg-gradient-to-br from-glass-light/30 to-glass-light/10
                border border-glass-border/50
                text-text-primary placeholder:text-text-secondary/60
                outline-none text-sm
                transition-all duration-300 ease-out-quart
                focus:border-primary focus:shadow-glass-2
                focus:bg-gradient-to-br focus:from-glass-light/40 focus:to-glass-light/20
              "
            />
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="mb-6 last:mb-0">
            {/* Category Header */}
            {!isCollapsed && showCategories && (
              <div className="flex items-center gap-2 px-2 py-2 mb-3">
                <span className="text-sm">{getCategoryIcon(category)}</span>
                <h3 className="text-xs font-bold text-text-secondary/80 uppercase tracking-wider">
                  {category}
                </h3>
              </div>
            )}
            
            {/* Category Items */}
            <div className="space-y-2">
              {categoryItems.map((item, index) => {
                const isActive = isActiveItem(item);
                const isHovered = hoveredItem === item.id;
                
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleNavigation(item)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`
                        w-full text-left p-4 rounded-2xl
                        transition-all duration-300 ease-out-quart
                        group relative overflow-hidden
                        ${isActive 
                          ? 'bg-gradient-to-br from-primary/25 via-primary/20 to-primary/15 border border-primary/50 shadow-glass-3 scale-102' 
                          : 'hover:bg-gradient-to-br hover:from-glass-light/30 hover:to-glass-light/20 hover:border-glass-border/50 border border-transparent hover:scale-102'
                        }
                        ${isCollapsed ? 'px-2' : ''}
                      `}
                    >
                      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
                        {/* Item Icon */}
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                          transition-all duration-300 ease-out-quart
                          ${isActive 
                            ? 'bg-primary/30 border border-primary/50 text-primary scale-110' 
                            : 'bg-glass-light/20 border border-glass-border/30 text-text-secondary'
                          }
                          ${isHovered && !isActive ? 'scale-110 bg-glass-light/30' : ''}
                        `}>
                          <span className="text-lg">{item.icon}</span>
                        </div>
                        
                        {/* Item Info */}
                        {!isCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className={`
                                font-semibold transition-colors duration-200
                                ${isActive ? 'text-primary' : 'text-text-primary'}
                              `}>
                                {item.label}
                              </h3>
                              
                              {/* Badge */}
                              {item.badge && (
                                <div className={`
                                  px-2 py-1 rounded-full text-xs font-bold
                                  ${isActive 
                                    ? 'bg-primary/20 border border-primary/40 text-primary' 
                                    : 'bg-accent/20 border border-accent/40 text-accent'
                                  }
                                `}>
                                  {item.badge}
                                </div>
                              )}
                            </div>
                            
                            {/* Description */}
                            {item.description && (
                              <p className="text-sm text-text-secondary/80 mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Keyboard Shortcut */}
                        {!isCollapsed && enableShortcuts && index < 9 && (
                          <div className="glass-card px-2 py-1 rounded-lg bg-glass-light/30 border border-glass-border/40">
                            <span className="text-xs text-text-secondary/80 font-mono">
                              ⌘{index + 1}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Hover Shimmer Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out-cubic rounded-2xl pointer-events-none"></div>
                    </button>
                    
                    {/* Tooltip for Collapsed State */}
                    {isCollapsed && isHovered && (
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-4 z-50">
                        <div className="glass-card-premium p-3 rounded-xl border border-glass-border/40 bg-gradient-to-br from-glass-light/40 via-glass-light/30 to-glass-light/20 backdrop-blur-xl shadow-glass-3 animate-fade-in">
                          <div className="flex items-center gap-3 whitespace-nowrap">
                            <span className="text-lg">{item.icon}</span>
                            <div>
                              <h4 className="font-semibold text-text-primary">{item.label}</h4>
                              {item.description && (
                                <p className="text-sm text-text-secondary/80 mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-glass-border/30">
        {!isCollapsed ? (
          <div className="glass-card bg-gradient-to-r from-accent/15 to-primary/15 border border-accent/30 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
                <span className="text-sm">🚀</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-accent">Revolutionary UI</div>
                <div className="text-xs text-accent/80">Powered by advanced design</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 flex items-center justify-center">
            <span className="text-lg">🚀</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveSidebar;