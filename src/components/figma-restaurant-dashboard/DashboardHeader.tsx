import React from 'react';
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
// Mock components and hooks for now
const ThemeToggle = () => <div>Theme</div>;
const LanguageSwitch = () => <div>Lang</div>;
const SettingsPanel = () => <div>Settings</div>;
const useLanguage = () => ({ language: 'de' });

interface DashboardHeaderProps {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  notificationCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const locations = [
  'München Hauptbahnhof',
  'Berlin Mitte', 
  'Hamburg Speicherstadt',
  'Köln Innenstadt',
  'Frankfurt Zeil'
];

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedLocation,
  setSelectedLocation,
  notificationCount,
  mobileMenuOpen,
  setMobileMenuOpen,
  isDarkMode,
  toggleTheme,
}) => {
  const { language } = useLanguage();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Header translations
  const headerTexts = {
    notifications: {
      de: 'Benachrichtigungen',
      en: 'Notifications'
    },
    refresh: {
      de: 'Aktualisieren',
      en: 'Refresh'
    },
    export: {
      de: 'Exportieren',
      en: 'Export'
    },
    settings: {
      de: 'Einstellungen',
      en: 'Settings'
    },
    location: {
      de: 'Standort wählen',
      en: 'Select location'
    },
    menu: {
      de: 'Menü öffnen',
      en: 'Open menu'
    }
  };

  const getText = (key: keyof typeof headerTexts) => {
    return headerTexts[key][language];
  };

  const handleRefresh = () => {
    console.log('Dashboard refresh triggered');
    // Add refresh logic here
  };

  const handleExport = () => {
    console.log('Dashboard export triggered');
    // Add export logic here
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-4 md:px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Mobile Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden touch-target"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={getText('menu')}
          >
            <Menu className="icon-md" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="body-md font-semibold text-primary-foreground">M</span>
            </div>
            <span className="headline-md text-foreground hidden sm:block">matbakh</span>
          </div>
        </div>

        {/* Center - Location Selector */}
        <div className="hidden md:flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 touch-target">
                <span className="body-md">{selectedLocation}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64">
              {locations.map((location) => (
                <DropdownMenuItem
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`cursor-pointer touch-target ${
                    selectedLocation === location ? 'bg-accent' : ''
                  }`}
                >
                  <span className="body-md">{location}</span>
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
          <ThemeToggle />
          
          {/* Actions Menu - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="touch-target"
              aria-label={getText('refresh')}
            >
              <RotateCcw className="icon-sm" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="touch-target"
              aria-label={getText('export')}
            >
              <Download className="icon-sm" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="touch-target"
              aria-label={getText('settings')}
            >
              <Settings className="icon-sm" />
            </Button>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative touch-target"
            aria-label={getText('notifications')}
          >
            <Bell className="icon-md" />
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
                <Button variant="ghost" size="sm" className="touch-target">
                  <Settings className="icon-md" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleRefresh} className="touch-target">
                  <RotateCcw className="icon-sm mr-2" />
                  {getText('refresh')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="touch-target">
                  <Download className="icon-sm mr-2" />
                  {getText('export')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="touch-target">
                  <Settings className="icon-sm mr-2" />
                  {getText('settings')}
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
            <Button variant="outline" className="w-full justify-start touch-target">
              <span className="body-md">{selectedLocation}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-full">
            {locations.map((location) => (
              <DropdownMenuItem
                key={location}
                onClick={() => setSelectedLocation(location)}
                className={`cursor-pointer touch-target ${
                  selectedLocation === location ? 'bg-accent' : ''
                }`}
              >
                <span className="body-md">{location}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Settings Panel */}
      <SettingsPanel />
    </header>
  );
};

export default DashboardHeader;