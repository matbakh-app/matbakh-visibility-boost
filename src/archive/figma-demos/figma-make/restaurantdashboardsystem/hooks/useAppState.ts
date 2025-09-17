import { useState, useEffect } from 'react';
import { KEYBOARD_SHORTCUTS, CRITICAL_WIDGETS } from '../utils/constants';

export const useAppState = () => {
  const [selectedLocation, setSelectedLocation] = useState('Berlin Mitte');
  const [notificationCount] = useState(3);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme and settings
  useEffect(() => {
    const initializeApp = async () => {
      // Load saved theme
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setIsDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.setAttribute('data-theme', 'light');
      }

      // Load dashboard settings
      const savedSettings = localStorage.getItem('dashboard-settings');
      if (savedSettings) {
        try {
          setDashboardSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.error('Error loading dashboard settings:', error);
        }
      }

      // Preload critical data
      await preloadCriticalData();
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent) => {
      setDashboardSettings(event.detail);
    };

    window.addEventListener('dashboard-settings-changed', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('dashboard-settings-changed', handleSettingsChange as EventListener);
    };
  }, []);

  // Preload critical data
  const preloadCriticalData = async () => {
    // This would integrate with your actual data fetching logic
    console.log('Preloading critical data for widgets:', CRITICAL_WIDGETS);
  };

  // Theme toggle handler
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  };

  // Dashboard actions
  const refreshDashboard = () => {
    window.dispatchEvent(new CustomEvent('dashboard-refresh'));
  };

  const exportDashboard = () => {
    window.dispatchEvent(new CustomEvent('dashboard-export'));
  };

  // Widget visibility based on settings
  const isWidgetVisible = (widgetId: string) => {
    if (!dashboardSettings?.widgets) return true;
    return dashboardSettings.widgets[widgetId]?.isVisible !== false;
  };

  const getWidgetPriority = (widgetId: string) => {
    if (!dashboardSettings?.widgets) return 'normal';
    const widget = dashboardSettings.widgets[widgetId];
    return widget?.priority <= 5 ? 'high' : widget?.priority <= 10 ? 'normal' : 'low';
  };

  return {
    selectedLocation,
    setSelectedLocation,
    notificationCount,
    mobileMenuOpen,
    setMobileMenuOpen,
    isDarkMode,
    setIsDarkMode,
    dashboardSettings,
    setDashboardSettings,
    isLoading,
    toggleTheme,
    refreshDashboard,
    exportDashboard,
    isWidgetVisible,
    getWidgetPriority
  };
};

export const useKeyboardShortcuts = (
  toggleTheme: () => void,
  refreshDashboard: () => void,
  exportDashboard: () => void,
  setMobileMenuOpen: (open: boolean) => void
) => {
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const key = `${e.ctrlKey ? 'ctrl+' : ''}${e.metaKey ? 'cmd+' : ''}${e.key.toLowerCase()}`;
      
      switch (KEYBOARD_SHORTCUTS[key]) {
        case 'toggle-dark-mode':
          e.preventDefault();
          toggleTheme();
          break;
        case 'refresh-dashboard':
          e.preventDefault();
          refreshDashboard();
          break;
        case 'export-dashboard':
          e.preventDefault();
          exportDashboard();
          break;
        case 'open-settings':
          e.preventDefault();
          // This would be handled by SettingsPanel
          break;
        case 'close-modals':
          setMobileMenuOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [toggleTheme, refreshDashboard, exportDashboard, setMobileMenuOpen]);
};