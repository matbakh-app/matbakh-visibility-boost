import React, { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandGroup, CommandItem } from './ui/command';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  ChevronDown,
  Palette
} from 'lucide-react';
import { cn } from './ui/utils';
import { useTheme, Theme } from '../contexts/themeContext';

const themes = [
  {
    value: 'light' as Theme,
    label: 'Light',
    icon: Sun,
    description: 'Heller Modus'
  },
  {
    value: 'dark' as Theme,
    label: 'Dark',
    icon: Moon,
    description: 'Dunkler Modus'
  },
  {
    value: 'system' as Theme,
    label: 'System',
    icon: Monitor,
    description: 'System-Einstellung'
  }
];

interface ThemeToggleProps {
  variant?: 'default' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ 
  variant = 'default', 
  size = 'md',
  className,
  showLabel = true 
}: ThemeToggleProps) {
  const { theme, setTheme, actualTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const currentTheme = themes.find(t => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  // Simple icon-only toggle (light <-> dark)
  if (variant === 'icon-only') {
    return (
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'icon'}
        onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          "relative group transition-all duration-300",
          "hover:bg-muted/50 hover:scale-105 active:scale-95",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          size === 'sm' && "h-8 w-8",
          size === 'md' && "h-9 w-9", 
          size === 'lg' && "h-10 w-10",
          className
        )}
        aria-label={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} theme`}
      >
        <div className="relative w-4 h-4">
          {/* Sun Icon */}
          <Sun 
            className={cn(
              "absolute inset-0 transition-all duration-300 transform-gpu",
              actualTheme === 'dark' 
                ? "scale-0 rotate-90 opacity-0" 
                : "scale-100 rotate-0 opacity-100"
            )} 
          />
          
          {/* Moon Icon */}
          <Moon 
            className={cn(
              "absolute inset-0 transition-all duration-300 transform-gpu",
              actualTheme === 'dark' 
                ? "scale-100 rotate-0 opacity-100" 
                : "scale-0 -rotate-90 opacity-0"
            )} 
          />
        </div>
        
        {/* Ripple effect */}
        <div className={cn(
          "absolute inset-0 rounded-md bg-current opacity-0 group-active:opacity-20",
          "transition-opacity duration-150"
        )} />
      </Button>
    );
  }

  // Compact dropdown variant
  if (variant === 'compact') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={cn(
              "gap-2 transition-all duration-200",
              "hover:bg-muted/50",
              size === 'sm' && "h-8 px-2",
              size === 'md' && "h-9 px-3",
              size === 'lg' && "h-10 px-4",
              className
            )}
            aria-expanded={open}
            aria-label="Toggle theme"
          >
            <div className="relative w-4 h-4">
              <CurrentIcon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            </div>
            {showLabel && (
              <span className="text-sm font-medium">{currentTheme?.label}</span>
            )}
            <ChevronDown className={cn(
              "w-3 h-3 opacity-50 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-48 p-1" align="end">
          <Command>
            <CommandGroup>
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                return (
                  <CommandItem
                    key={themeOption.value}
                    value={themeOption.value}
                    onSelect={() => {
                      setTheme(themeOption.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "cursor-pointer gap-3 rounded-sm px-2 py-2",
                      "transition-colors duration-150",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-medium">{themeOption.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {themeOption.description}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "w-4 h-4 transition-opacity duration-150",
                        theme === themeOption.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  // Default full dropdown variant
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 transition-all duration-200",
            "hover:bg-muted/50 hover:border-muted-foreground/25",
            "focus-visible:ring-2 focus-visible:ring-ring",
            size === 'sm' && "h-8 px-3 text-xs",
            size === 'md' && "h-9 px-4 text-sm",
            size === 'lg' && "h-10 px-5 text-base",
            className
          )}
          aria-expanded={open}
          aria-label="Select theme"
        >
          <Palette className="w-4 h-4" />
          <div className="flex items-center gap-2">
            <CurrentIcon className="w-4 h-4" />
            {showLabel && (
              <span className="font-medium">{currentTheme?.label}</span>
            )}
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 opacity-50 transition-transform duration-200",
            open && "rotate-180"
          )} />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-56 p-1" align="end">
        <Command>
          <CommandGroup className="p-1">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <CommandItem
                  key={themeOption.value}
                  value={themeOption.value}
                  onSelect={() => {
                    setTheme(themeOption.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "cursor-pointer gap-3 rounded-md px-3 py-2.5",
                    "transition-all duration-150",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    "group"
                  )}
                >
                  <Icon className="w-5 h-5 transition-transform duration-150 group-hover:scale-110" />
                  <div className="flex-1">
                    <div className="font-medium">{themeOption.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "w-4 h-4 transition-all duration-200",
                      theme === themeOption.value 
                        ? "opacity-100 scale-100" 
                        : "opacity-0 scale-75"
                    )}
                  />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}