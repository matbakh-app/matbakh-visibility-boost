import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'default' | 'icon-only';
  size?: 'default' | 'sm';
}

export function ThemeToggle({ variant = 'default', size = 'default' }: ThemeToggleProps) {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const Icon = theme === 'light' ? Moon : Sun;

  if (variant === 'icon-only') {
    return (
      <Button variant="ghost" size={size} onClick={toggleTheme}>
        <Icon className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button variant="outline" size={size} onClick={toggleTheme}>
      <Icon className="w-4 h-4 mr-2" />
      {theme === 'light' ? 'Dark' : 'Light'}
    </Button>
  );
}