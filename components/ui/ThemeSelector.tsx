
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { Theme } from '../../types';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme, themes } = useTheme();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');

  const groupedThemes = themes.reduce((acc, currentTheme) => {
    const category = currentTheme.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(currentTheme);
    return acc;
  }, {} as Record<string, Theme[]>);

  React.useEffect(() => {
    // Set initial category to the one containing current theme
    const currentTheme = themes.find(t => t.id === theme);
    if (currentTheme && !selectedCategory) {
      setSelectedCategory(currentTheme.category);
    }
  }, [theme, themes, selectedCategory]);

  const getThemePreview = (t: Theme) => {
    const themeColors = {
      'theme-charnoks': 'from-orange-600 via-amber-500 to-yellow-400',
      'theme-ocean': 'from-blue-600 via-sky-500 to-cyan-400',
      'theme-forest': 'from-green-600 via-emerald-500 to-teal-400',
      'theme-sunset': 'from-purple-600 via-violet-500 to-indigo-400',
      'theme-light': 'from-gray-200 via-white to-gray-100',
      'theme-gray': 'from-gray-600 via-gray-500 to-gray-400',
      'theme-ruby': 'from-red-600 via-rose-500 to-pink-400',
      'theme-cosmic': 'from-indigo-600 via-purple-500 to-violet-400',
      'theme-golden': 'from-yellow-600 via-orange-500 to-amber-400',
      'theme-emerald': 'from-emerald-600 via-green-500 to-teal-400'
    };

    return themeColors[t.id as keyof typeof themeColors] || 'from-gray-600 to-gray-400';
  };

  return (
    <div className="revolutionary-theme-selector">
      {/* Main Container with Revolutionary Glassmorphism */}
      <div className="glass-card-premium p-8 border border-glass-border/40 bg-gradient-to-br from-glass-light/30 via-glass-light/20 to-glass-light/10 backdrop-blur-2xl shadow-glass-3 rounded-3xl">
        
        {/* Header with Animated Icon */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/30 via-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center">
            <span className="text-2xl filter drop-shadow-sm">🎨</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
              Revolutionary Themes
            </h3>
            <p className="text-text-secondary/80 text-sm font-medium">
              Choose your perfect visual experience
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.keys(groupedThemes).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-xl font-semibold text-sm
                transition-all duration-300 ease-out-quart
                ${selectedCategory === category 
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-glass-2' 
                  : 'glass-card bg-glass-light/50 text-text-secondary hover:text-text-primary hover:bg-glass-light/70'
                }
              `}
            >
              {category} Themes
            </button>
          ))}
        </div>

        {/* Theme Grid */}
        {Object.entries(groupedThemes).map(([category, themeList]) => (
          <div 
            key={category} 
            className={`
              transition-all duration-500 ease-out-quart
              ${selectedCategory === category ? 'block animate-fade-in' : 'hidden'}
            `}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {themeList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`
                    revolutionary-theme-card group
                    glass-card-premium p-6 rounded-2xl
                    border transition-all duration-500 ease-out-quart
                    hover:scale-105 hover:shadow-glass-4
                    ${theme === t.id 
                      ? 'border-primary shadow-glass-3 scale-105' 
                      : 'border-glass-border/40 hover:border-primary/60'
                    }
                  `}
                >
                  {/* Theme Preview */}
                  <div className="relative mb-4 overflow-hidden rounded-xl">
                    <div className={`
                      w-full h-20 bg-gradient-to-r ${getThemePreview(t)}
                      transition-all duration-500 ease-out-quart
                      group-hover:scale-110
                    `}>
                      {/* Theme Pattern Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10"></div>
                      
                      {/* Active Theme Indicator */}
                      {theme === t.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 flex items-center justify-center">
                            <span className="text-white text-lg">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className="text-center space-y-2">
                    <h4 className={`
                      font-bold text-lg
                      ${theme === t.id 
                        ? 'text-primary' 
                        : 'text-text-primary group-hover:text-primary'
                      }
                    `}>
                      {t.name}
                    </h4>
                    
                    {t.description && (
                      <p className="text-sm text-text-secondary/80 leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    {/* Color Palette Preview */}
                    <div className="flex justify-center gap-1 pt-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getThemePreview(t)} opacity-80`}></div>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getThemePreview(t)} opacity-60`}></div>
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getThemePreview(t)} opacity-40`}></div>
                    </div>
                  </div>

                  {/* Hover Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out-cubic rounded-2xl pointer-events-none"></div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Current Theme Status */}
        <div className="mt-8 glass-card bg-gradient-to-r from-primary/15 to-accent/15 border border-primary/30 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
              <span className="text-lg">🌟</span>
            </div>
            <div>
              <div className="font-bold text-primary">
                Active Theme: {themes.find(t => t.id === theme)?.name}
              </div>
              <div className="text-sm text-primary/80">
                Your interface is now using this revolutionary theme
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
