import React from 'react';
import { Bell, Settings, ChevronDown, MapPin, User, LogOut, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import ThemeToggle from './ThemeToggle';
import SettingsPanel from './SettingsPanel';
import { LOCATIONS } from '../utils/constants';
import matbakhLogo from 'figma:asset/af9771de077920fd4c494932ddf1e34ef296df0d.png';

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
  return (
    <header className="h-16 bg-card shadow-sm border-b border-border relative transition-colors duration-300">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Mobile: Hamburger Menu */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="touch-target p-2 button-hover"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="icon-md text-neutral" />
            ) : (
              <Menu className="icon-md text-neutral" />
            )}
          </Button>
        </div>

        {/* Desktop: Logo Left */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center space-x-3">
            <img 
              src={matbakhLogo} 
              alt="matbakh logo" 
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Mobile: Logo Center */}
        <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
          <img 
            src={matbakhLogo} 
            alt="matbakh logo" 
            className="h-7 w-auto"
          />
        </div>

        {/* Desktop: Location Switcher */}
        <div className="hidden md:flex flex-1 justify-start ml-24">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-between w-48 h-10 px-3 py-2 body-md bg-card border border-border rounded-lg hover:shadow-md button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-300">
                <div className="flex items-center space-x-2">
                  <MapPin className="icon-sm text-muted-foreground" />
                  <span className="text-foreground font-medium">{selectedLocation}</span>
                </div>
                <ChevronDown className="icon-sm text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-48 shadow-lg border border-border bg-card" 
              align="start"
            >
              {LOCATIONS.map((location) => (
                <DropdownMenuItem
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className="cursor-pointer hover:bg-accent flex items-center space-x-2 button-padding transition-colors duration-200"
                >
                  <MapPin className="icon-sm text-muted-foreground" />
                  <span className={`body-md ${location === selectedLocation ? 'font-medium text-success' : 'text-foreground'}`}>
                    {location}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* Notification Bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="touch-target p-2 hover:bg-accent button-hover transition-colors duration-200"
            >
              <Bell className="icon-md text-muted-foreground hover:text-foreground transition-colors duration-150" />
            </Button>
            {notificationCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-error text-white caption flex items-center justify-center notification-pulse"
              >
                {notificationCount}
              </Badge>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle isDark={isDarkMode} onToggle={toggleTheme} />
          </div>

          {/* User Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center space-x-2 p-1 rounded-full hover:bg-accent button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-success text-white font-medium body-md">
                    JM
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="hidden md:block icon-sm text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-48 shadow-lg border border-border bg-card" 
              align="end"
            >
              <DropdownMenuItem className="cursor-pointer hover:bg-accent flex items-center space-x-2 button-padding transition-colors duration-200">
                <User className="icon-sm text-muted-foreground" />
                <span className="body-md text-foreground">Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-accent flex items-center space-x-2 button-padding transition-colors duration-200">
                <Settings className="icon-sm text-muted-foreground" />
                <span className="body-md text-foreground">Einstellungen</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer hover:bg-accent flex items-center space-x-2 button-padding text-error transition-colors duration-200">
                <LogOut className="icon-sm" />
                <span className="body-md">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings Panel */}
          <div data-tour="settings-button">
            <SettingsPanel />
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-card shadow-lg border-t border-border z-50 transition-colors duration-300">
          <div className="p-4 space-y-4">
            {/* Mobile Location Switcher */}
            <div>
              <h3 className="headline-md text-muted-foreground mb-2">Standort wechseln</h3>
              <div className="space-y-2">
                {LOCATIONS.map((location) => (
                  <button
                    key={location}
                    onClick={() => {
                      setSelectedLocation(location);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md body-md transition-colors touch-target ${
                      location === selectedLocation 
                        ? 'bg-success text-white' 
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="icon-sm" />
                      <span>{location}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mobile Menu Items */}
            <div className="pt-4 border-t border-border">
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-md body-md text-foreground hover:bg-accent flex items-center space-x-2 touch-target transition-colors duration-200">
                  <Settings className="icon-sm" />
                  <span>Einstellungen</span>
                </button>
                <button className="w-full text-left px-3 py-2 rounded-md body-md text-error hover:bg-accent flex items-center space-x-2 touch-target transition-colors duration-200">
                  <LogOut className="icon-sm" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;