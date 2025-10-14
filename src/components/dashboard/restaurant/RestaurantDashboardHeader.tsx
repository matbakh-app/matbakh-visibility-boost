import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Bell, RotateCcw, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitch from '@/components/LanguageSwitch';

interface RestaurantDashboardHeaderProps {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  notificationCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  refreshDashboard: () => void;
  exportDashboard: () => void;
}

const locations = [
  'München Hauptbahnhof',
  'Berlin Mitte', 
  'Hamburg Speicherstadt',
  'Köln Innenstadt',
  'Frankfurt Zeil'
];

const RestaurantDashboardHeader: React.FC<RestaurantDashboardHeaderProps> = ({
  selectedLocation,
  setSelectedLocation,
  notificationCount,
  mobileMenuOpen,
  setMobileMenuOpen,
  isDarkMode,
  toggleTheme,
  refreshDashboard,
  exportDashboard,
}) => {
  const { t } = useTranslation(['dashboard', 'common']);

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-4 md:px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Mobile Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t('menu', { ns: 'common' })}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">M</span>
            </div>
            <span className="text-xl font-semibold text-foreground hidden sm:block">matbakh</span>
          </div>
        </div>

        {/* Center - Location Selector */}
        <div className="hidden md:flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <span className="text-sm">{selectedLocation}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64">
              {locations.map((location) => (
                <DropdownMenuItem
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`cursor-pointer ${
                    selectedLocation === location ? 'bg-accent' : ''
                  }`}
                >
                  <span className="text-sm">{location}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Language Switch */}
          <LanguageSwitch />
          
          {/* Theme Toggle */}
          <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          
          {/* Actions Menu - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshDashboard}
              aria-label={t('refresh', { ns: 'common' })}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={exportDashboard}
              aria-label={t('export', { ns: 'common' })}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            aria-label={t('notifications', { ns: 'common' })}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Mobile Actions Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={refreshDashboard}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('refresh', { ns: 'common' })}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportDashboard}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('export', { ns: 'common' })}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Location Selector */}
      <div className="md:hidden mt-3 pt-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <span className="text-sm">{selectedLocation}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-full">
            {locations.map((location) => (
              <DropdownMenuItem
                key={location}
                onClick={() => setSelectedLocation(location)}
                className={`cursor-pointer ${
                  selectedLocation === location ? 'bg-accent' : ''
                }`}
              >
                <span className="text-sm">{location}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default RestaurantDashboardHeader;