import React from 'react';
import { Button } from './ui/button';
import { Sun, Moon } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
  showLabel?: boolean;
  disabled?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDarkMode,
  onToggle,
  size = 'md',
  variant = 'ghost',
  showLabel = false,
  disabled = false
}) => {
  const { language } = useLanguage();

  // Theme toggle translations
  const translations = {
    lightMode: {
      de: 'Heller Modus',
      en: 'Light Mode'
    },
    darkMode: {
      de: 'Dunkler Modus',
      en: 'Dark Mode'
    },
    toggleTheme: {
      de: 'Theme umschalten',
      en: 'Toggle Theme'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Size variants
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={variant}
        size="icon"
        onClick={onToggle}
        disabled={disabled}
        className={`
          theme-toggle
          ${sizeClasses[size]}
          relative overflow-hidden
          transition-all duration-300 ease-in-out
          hover:scale-105 active:scale-95
          focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={getText('toggleTheme')}
        title={isDarkMode ? getText('lightMode') : getText('darkMode')}
      >
        {/* Background gradient effect */}
        <div 
          className={`
            absolute inset-0 transition-all duration-500 ease-in-out
            ${isDarkMode 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900' 
              : 'bg-gradient-to-br from-yellow-50 to-orange-50'
            }
            opacity-20 rounded-md
          `}
        />
        
        {/* Sun Icon */}
        <Sun 
          className={`
            theme-toggle-icon ${iconSizes[size]}
            absolute transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
            text-amber-500
            ${isDarkMode 
              ? 'transform rotate-90 scale-0 opacity-0' 
              : 'transform rotate-0 scale-100 opacity-100'
            }
          `}
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`
            theme-toggle-icon ${iconSizes[size]}
            absolute transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
            text-slate-700 dark:text-slate-300
            ${isDarkMode 
              ? 'transform rotate-0 scale-100 opacity-100' 
              : 'transform -rotate-90 scale-0 opacity-0'
            }
          `}
        />
        
        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-md overflow-hidden">
          <div 
            className={`
              absolute inset-0 bg-white dark:bg-slate-200
              rounded-full scale-0 opacity-0
              transition-all duration-200 ease-out
              ${!disabled ? 'active:scale-150 active:opacity-20' : ''}
            `}
          />
        </div>
      </Button>

      {/* Optional Label */}
      {showLabel && (
        <span 
          className={`
            ${labelSizes[size]} 
            font-medium text-foreground
            transition-colors duration-300
            ${disabled ? 'opacity-50' : ''}
          `}
        >
          {isDarkMode ? getText('darkMode') : getText('lightMode')}
        </span>
      )}
    </div>
  );
};

export default ThemeToggle;