import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RestaurantDashboardState {
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  notificationCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDarkMode: boolean;
  isLoading: boolean;
  toggleTheme: () => void;
  refreshDashboard: () => void;
  exportDashboard: () => void;
  isWidgetVisible: (widgetId: string) => boolean;
  getWidgetPriority: (widgetId: string) => 'high' | 'normal' | 'low';
}

// Default widget visibility configuration
const DEFAULT_WIDGET_CONFIG = {
  'visibility-score': { visible: true, priority: 'high' as const },
  'reviews': { visible: true, priority: 'high' as const },
  'analytics': { visible: true, priority: 'high' as const },
  'orders-revenue': { visible: true, priority: 'high' as const },
  'reservations': { visible: true, priority: 'high' as const },
  'marketing': { visible: true, priority: 'normal' as const },
  'performance-trends': { visible: true, priority: 'normal' as const },
  'location-overview': { visible: true, priority: 'low' as const },
};

export const useRestaurantDashboard = (): RestaurantDashboardState => {
  const { user } = useAuth();
  
  // State management
  const [selectedLocation, setSelectedLocation] = useState('München Hauptbahnhof');
  const [notificationCount, setNotificationCount] = useState(3);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [widgetConfig, setWidgetConfig] = useState(DEFAULT_WIDGET_CONFIG);

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Load user preferences
        const savedLocation = localStorage.getItem('restaurant-dashboard-location');
        if (savedLocation) {
          setSelectedLocation(savedLocation);
        }

        const savedTheme = localStorage.getItem('restaurant-dashboard-theme');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        }

        // Load widget configuration
        const savedWidgetConfig = localStorage.getItem('restaurant-dashboard-widgets');
        if (savedWidgetConfig) {
          try {
            const parsedConfig = JSON.parse(savedWidgetConfig);
            setWidgetConfig({ ...DEFAULT_WIDGET_CONFIG, ...parsedConfig });
          } catch (error) {
            console.error('Failed to parse widget config:', error);
          }
        }

        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Save location preference
  useEffect(() => {
    localStorage.setItem('restaurant-dashboard-location', selectedLocation);
  }, [selectedLocation]);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('restaurant-dashboard-theme', newTheme ? 'dark' : 'light');
    
    // Apply theme to document
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Dashboard actions
  const refreshDashboard = useCallback(() => {
    console.log('Refreshing restaurant dashboard...');
    // Trigger data refresh for all widgets
    window.dispatchEvent(new CustomEvent('dashboard-refresh'));
  }, []);

  const exportDashboard = useCallback(() => {
    console.log('Exporting restaurant dashboard...');
    // Implement dashboard export functionality
    window.dispatchEvent(new CustomEvent('dashboard-export'));
  }, []);

  // Widget management
  const isWidgetVisible = useCallback((widgetId: string): boolean => {
    return widgetConfig[widgetId]?.visible ?? false;
  }, [widgetConfig]);

  const getWidgetPriority = useCallback((widgetId: string): 'high' | 'normal' | 'low' => {
    return widgetConfig[widgetId]?.priority ?? 'normal';
  }, [widgetConfig]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + R: Refresh dashboard
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        refreshDashboard();
      }
      
      // Ctrl/Cmd + E: Export dashboard
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        exportDashboard();
      }
      
      // Ctrl/Cmd + T: Toggle theme
      if ((event.ctrlKey || event.metaKey) && event.key === 't') {
        event.preventDefault();
        toggleTheme();
      }
      
      // Escape: Close mobile menu
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshDashboard, exportDashboard, toggleTheme, mobileMenuOpen]);

  return {
    selectedLocation,
    setSelectedLocation,
    notificationCount,
    mobileMenuOpen,
    setMobileMenuOpen,
    isDarkMode,
    isLoading,
    toggleTheme,
    refreshDashboard,
    exportDashboard,
    isWidgetVisible,
    getWidgetPriority,
  };
};