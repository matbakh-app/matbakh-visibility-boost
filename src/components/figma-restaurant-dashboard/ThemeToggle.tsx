import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        theme-toggle relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        hover:scale-105 active:scale-95 touch-target
        ${isDark 
          ? 'bg-primary shadow-lg border-primary/20' 
          : 'bg-muted hover:bg-border border-border'
        }
      `}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="sr-only">{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
      
      {/* Toggle circle with icon */}
      <span
        className={`
          theme-toggle-icon pointer-events-none relative inline-block h-4 w-4 transform rounded-full 
          bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out
          ${isDark ? 'translate-x-5 rotate-180' : 'translate-x-0 rotate-0'}
        `}
      >
        {/* Sun Icon */}
        <span
          className={`
            absolute inset-0 flex h-full w-full items-center justify-center transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}
          `}
          aria-hidden="true"
        >
          <Sun className="h-3 w-3 text-yellow-500 drop-shadow-sm" />
        </span>
        
        {/* Moon Icon */}
        <span
          className={`
            absolute inset-0 flex h-full w-full items-center justify-center transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}
          `}
          aria-hidden="true"
        >
          <Moon className="h-3 w-3 text-slate-700 drop-shadow-sm" />
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;