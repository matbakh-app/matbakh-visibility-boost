import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Bell, 
  Settings, 
  RefreshCw, 
  Menu, 
  X,
  MapPin,
  Download,
  Search,
  HelpCircle
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/useLanguage';

interface DashboardHeaderProps {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  notificationCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedLocation,
  setSelectedLocation,
  notificationCount,
  mobileMenuOpen,
  setMobileMenuOpen,
  isDarkMode,
  toggleTheme
}) => {
  const { language } = useLanguage();

  // Header translations with new branding
  const translations = {
    appName: {
      de: 'Sichtbarkeitsanalyse',
      en: 'Visibility Check'
    },
    appSubtitle: {
      de: 'Restaurant Performance Dashboard',
      en: 'Restaurant Performance Dashboard'
    },
    notifications: {
      de: 'Benachrichtigungen',
      en: 'Notifications'
    },
    settings: {
      de: 'Einstellungen',
      en: 'Settings'
    },
    refresh: {
      de: 'Aktualisieren',
      en: 'Refresh'
    },
    export: {
      de: 'Exportieren',
      en: 'Export'
    },
    search: {
      de: 'Suchen',
      en: 'Search'
    },
    help: {
      de: 'Hilfe',
      en: 'Help'
    },
    profile: {
      de: 'Profil',
      en: 'Profile'
    },
    logout: {
      de: 'Abmelden',
      en: 'Logout'
    },
    menu: {
      de: 'Menü',
      en: 'Menu'
    },
    close: {
      de: 'Schließen',
      en: 'Close'
    },
    location: {
      de: 'Standort',
      en: 'Location'
    },
    switchLocation: {
      de: 'Standort wechseln',
      en: 'Switch Location'
    },
    viewProfile: {
      de: 'Profil anzeigen',
      en: 'View Profile'
    },
    accountSettings: {
      de: 'Kontoeinstellungen',
      en: 'Account Settings'
    },
    support: {
      de: 'Support',
      en: 'Support'
    },
    documentation: {
      de: 'Dokumentation',
      en: 'Documentation'
    },
    feedback: {
      de: 'Feedback',
      en: 'Feedback'
    },
    shortcuts: {
      de: 'Tastenkürzel',
      en: 'Keyboard Shortcuts'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Sample locations for dropdown
  const locations = [
    { 
      id: 'muc-hbf', 
      name: 'München Hauptbahnhof',
      address: 'Bayerstraße 10a, München',
      isActive: true 
    },
    { 
      id: 'ber-mitte', 
      name: 'Berlin Mitte',
      address: 'Unter den Linden 15, Berlin',
      isActive: true 
    },
    { 
      id: 'ham-speicher', 
      name: 'Hamburg Speicherstadt',
      address: 'Am Sandtorkai 4, Hamburg',
      isActive: true 
    },
    { 
      id: 'col-inner', 
      name: 'Köln Innenstadt',
      address: 'Hohe Straße 87, Köln',
      isActive: true 
    },
    { 
      id: 'fra-zeil', 
      name: 'Frankfurt Zeil',
      address: 'Zeil 112, Frankfurt am Main',
      isActive: true 
    }
  ];

  const currentLocation = locations.find(loc => loc.name === selectedLocation) || locations[0];

  const handleRefresh = () => {
    // Add refresh logic here
    console.log('Refreshing dashboard...');
  };

  const handleExport = () => {
    // Add export logic here
    console.log('Exporting dashboard data...');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        
        {/* Left Section - App Branding */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden touch-target"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? getText('close') : getText('menu')}
          >
            {mobileMenuOpen ? (
              <X className="icon-md" />
            ) : (
              <Menu className="icon-md" />
            )}
          </Button>

          {/* App Name - No Logo */}
          <div className="flex flex-col">
            <h1 className="headline-md text-foreground font-semibold tracking-tight">
              {getText('appName')}
            </h1>
            <p className="caption text-muted-foreground hidden sm:block">
              {getText('appSubtitle')}
            </p>
          </div>
        </div>

        {/* Center Section - Location Selector (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="touch-target flex items-center gap-2 max-w-xs">
                <MapPin className="icon-sm text-muted-foreground" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground truncate">
                    {currentLocation.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {currentLocation.address}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-80">
              <DropdownMenuLabel>{getText('switchLocation')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {locations.map((location) => (
                <DropdownMenuItem
                  key={location.id}
                  onClick={() => setSelectedLocation(location.name)}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      location.isActive ? 'bg-success' : 'bg-muted'
                    }`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{location.name}</span>
                      <span className="text-xs text-muted-foreground">{location.address}</span>
                    </div>
                  </div>
                  {selectedLocation === location.name && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {language === 'de' ? 'Aktiv' : 'Active'}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Section - Actions & User Menu */}
        <div className="flex items-center gap-2">
          
          {/* Search Button (Hidden on Mobile) */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex touch-target"
            aria-label={getText('search')}
          >
            <Search className="icon-sm" />
          </Button>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="touch-target"
            aria-label={getText('refresh')}
          >
            <RefreshCw className="icon-sm" />
          </Button>

          {/* Export Button (Hidden on Mobile) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="hidden sm:flex touch-target"
            aria-label={getText('export')}
          >
            <Download className="icon-sm" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative touch-target"
            aria-label={getText('notifications')}
          >
            <Bell className="icon-sm" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Language Switch - Coming Soon */}
          <Button variant="ghost" size="sm" className="touch-target">
            DE
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full touch-target">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    AD
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@sichtbarkeitsanalyse.de
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{getText('accountSettings')}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>{getText('support')}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="md:hidden">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{getText('switchLocation')}</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <span>{getText('shortcuts')}</span>
                <div className="ml-auto flex gap-1">
                  <kbd className="text-xs bg-muted px-1 rounded">Ctrl</kbd>
                  <kbd className="text-xs bg-muted px-1 rounded">K</kbd>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <span>{getText('logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Location Selector (Visible when mobile menu is open) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="icon-sm" />
              {getText('location')}
            </div>
            
            <div className="grid gap-2">
              {locations.map((location) => (
                <Button
                  key={location.id}
                  variant={selectedLocation === location.name ? "default" : "ghost"}
                  className="justify-start h-auto p-3"
                  onClick={() => {
                    setSelectedLocation(location.name);
                    setMobileMenuOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      location.isActive ? 'bg-success' : 'bg-muted'
                    }`} />
                    <div className="text-left">
                      <div className="text-sm font-medium">{location.name}</div>
                      <div className="text-xs text-muted-foreground">{location.address}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;