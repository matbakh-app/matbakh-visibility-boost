import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from './useLanguage';

export interface DashboardSettings {
  theme: 'light' | 'dark' | 'system';
  compactView: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  enableAnimations: boolean;
  showTooltips: boolean;
  highContrast: boolean;
  enableNotifications: boolean;
  exportFormat: 'pdf' | 'excel' | 'csv';
  dataRetention: number; // days
  widgetVisibility: Record<string, boolean>;
  widgetPriority: Record<string, number>;
  lastUpdated: string;
}

export interface NotificationConfig {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  actionUrl?: string;
}

export interface LocationData {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  isActive: boolean;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  theme: 'system',
  compactView: false,
  autoRefresh: true,
  refreshInterval: 30,
  enableAnimations: true,
  showTooltips: true,
  highContrast: false,
  enableNotifications: true,
  exportFormat: 'pdf',
  dataRetention: 90,
  widgetVisibility: {
    'visibility-score': true,
    'reviews': true,
    'analytics': true,
    'orders-revenue': true,
    'reservations': true,
    'marketing': true,
    'location-overview': true,
    'performance-trends': true,
    'competitor-monitoring': false,
    'cultural-insights': false,
    'ab-testing': false,
    'staff-dashboard': true,
    'loyalty-program': false,
    'delivery-tracking': true,
    'instagram-stories': false
  },
  widgetPriority: {
    'visibility-score': 1,
    'orders-revenue': 2,
    'reservations': 3,
    'reviews': 4,
    'analytics': 5,
    'marketing': 6,
    'location-overview': 7,
    'performance-trends': 8,
    'staff-dashboard': 9,
    'delivery-tracking': 10,
    'competitor-monitoring': 11,
    'cultural-insights': 12,
    'ab-testing': 13,
    'loyalty-program': 14,
    'instagram-stories': 15
  },
  lastUpdated: new Date().toISOString()
};

const DEFAULT_LOCATIONS: LocationData[] = [
  {
    id: 'muc-hbf',
    name: 'München Hauptbahnhof',
    address: 'Bayerstraße 10a',
    city: 'München',
    country: 'Deutschland',
    timezone: 'Europe/Berlin',
    isActive: true
  },
  {
    id: 'ber-mitte',
    name: 'Berlin Mitte',
    address: 'Unter den Linden 15',
    city: 'Berlin',
    country: 'Deutschland',
    timezone: 'Europe/Berlin',
    isActive: true
  },
  {
    id: 'ham-speicher',
    name: 'Hamburg Speicherstadt',
    address: 'Am Sandtorkai 4',
    city: 'Hamburg',
    country: 'Deutschland',
    timezone: 'Europe/Berlin',
    isActive: true
  },
  {
    id: 'col-inner',
    name: 'Köln Innenstadt',
    address: 'Hohe Straße 87',
    city: 'Köln',
    country: 'Deutschland',
    timezone: 'Europe/Berlin',
    isActive: true
  },
  {
    id: 'fra-zeil',
    name: 'Frankfurt Zeil',
    address: 'Zeil 112',
    city: 'Frankfurt am Main',
    country: 'Deutschland',
    timezone: 'Europe/Berlin',
    isActive: true
  }
];

export function useAppState() {
  const { language } = useLanguage();
  
  // Core state
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [selectedLocation, setSelectedLocation] = useState<string>(DEFAULT_LOCATIONS[0].name);
  const [locations] = useState<LocationData[]>(DEFAULT_LOCATIONS);
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Theme management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    const savedTheme = localStorage.getItem('dashboard-theme');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Initialize app state
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load saved settings
        const savedSettings = localStorage.getItem('dashboard-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setDashboardSettings(prev => ({ ...prev, ...parsed }));
        }

        // Load saved location
        const savedLocation = localStorage.getItem('dashboard-location');
        if (savedLocation && locations.find(loc => loc.name === savedLocation)) {
          setSelectedLocation(savedLocation);
        }

        // Generate sample notifications
        generateSampleNotifications();

        // Apply theme
        applyTheme();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app state:', error);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initializeApp, 800); // Simulate loading time
    return () => clearTimeout(timer);
  }, []);

  // Theme management
  const applyTheme = useCallback(() => {
    const theme = dashboardSettings.theme;
    let shouldBeDark = false;

    if (theme === 'dark') {
      shouldBeDark = true;
    } else if (theme === 'light') {
      shouldBeDark = false;
    } else {
      // system
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDarkMode(shouldBeDark);
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
    localStorage.setItem('dashboard-theme', shouldBeDark ? 'dark' : 'light');
  }, [dashboardSettings.theme]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!dashboardSettings.autoRefresh) return;

    const interval = setInterval(() => {
      if (!document.hidden) { // Only refresh if tab is visible
        refreshDashboard();
      }
    }, dashboardSettings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [dashboardSettings.autoRefresh, dashboardSettings.refreshInterval]);

  // Save settings to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('dashboard-settings', JSON.stringify(dashboardSettings));
    }, 500); // Debounce settings saves

    return () => clearTimeout(timeoutId);
  }, [dashboardSettings]);

  // Save selected location
  useEffect(() => {
    localStorage.setItem('dashboard-location', selectedLocation);
  }, [selectedLocation]);

  // Generate sample notifications based on language
  const generateSampleNotifications = useCallback(() => {
    const sampleNotifications: NotificationConfig[] = [
      {
        id: '1',
        type: 'warning',
        title: language === 'de' ? 'Hohe Auslastung' : 'High Occupancy',
        message: language === 'de' 
          ? 'Restaurant ist zu 95% ausgelastet. Wartezeiten können steigen.'
          : 'Restaurant is 95% occupied. Wait times may increase.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
        actionable: true,
        actionUrl: '/reservations'
      },
      {
        id: '2',
        type: 'success',
        title: language === 'de' ? 'Neue 5-Sterne Bewertung' : 'New 5-Star Review',
        message: language === 'de'
          ? 'Maria Schmidt hat eine ausgezeichnete Bewertung hinterlassen.'
          : 'Maria Schmidt left an excellent review.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        actionable: true,
        actionUrl: '/reviews'
      },
      {
        id: '3',
        type: 'info',
        title: language === 'de' ? 'Wöchentlicher Bericht' : 'Weekly Report',
        message: language === 'de'
          ? 'Ihr Wochenbericht ist bereit zur Ansicht.'
          : 'Your weekly report is ready for review.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: true,
        actionable: true,
        actionUrl: '/reports'
      }
    ];

    setNotifications(sampleNotifications);
  }, [language]);

  // Regenerate notifications when language changes
  useEffect(() => {
    generateSampleNotifications();
  }, [generateSampleNotifications]);

  // Dashboard actions
  const toggleTheme = useCallback(() => {
    setDashboardSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastRefresh(new Date());
      
      // Add success notification
      const successNotification: NotificationConfig = {
        id: Date.now().toString(),
        type: 'success',
        title: language === 'de' ? 'Dashboard aktualisiert' : 'Dashboard Refreshed',
        message: language === 'de' 
          ? 'Alle Daten wurden erfolgreich aktualisiert.'
          : 'All data has been successfully updated.',
        timestamp: new Date(),
        read: false,
        actionable: false
      };
      
      setNotifications(prev => [successNotification, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [language]);

  const exportDashboard = useCallback(async () => {
    try {
      // Simulate export functionality
      const exportData = {
        settings: dashboardSettings,
        location: selectedLocation,
        timestamp: new Date().toISOString(),
        language
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Add success notification
      const exportNotification: NotificationConfig = {
        id: Date.now().toString(),
        type: 'success',
        title: language === 'de' ? 'Export erfolgreich' : 'Export Successful',
        message: language === 'de'
          ? 'Dashboard-Daten wurden exportiert.'
          : 'Dashboard data has been exported.',
        timestamp: new Date(),
        read: false,
        actionable: false
      };
      
      setNotifications(prev => [exportNotification, ...prev].slice(0, 10));
    } catch (error) {
      console.error('Dashboard export failed:', error);
    }
  }, [dashboardSettings, selectedLocation, language]);

  // Widget management
  const isWidgetVisible = useCallback((widgetId: string): boolean => {
    return dashboardSettings.widgetVisibility[widgetId] ?? false;
  }, [dashboardSettings.widgetVisibility]);

  const getWidgetPriority = useCallback((widgetId: string): number => {
    return dashboardSettings.widgetPriority[widgetId] ?? 999;
  }, [dashboardSettings.widgetPriority]);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setDashboardSettings(prev => ({
      ...prev,
      widgetVisibility: {
        ...prev.widgetVisibility,
        [widgetId]: !prev.widgetVisibility[widgetId]
      },
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  const updateWidgetPriority = useCallback((widgetId: string, priority: number) => {
    setDashboardSettings(prev => ({
      ...prev,
      widgetPriority: {
        ...prev.widgetPriority,
        [widgetId]: priority
      },
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  const updateSettings = useCallback((updates: Partial<DashboardSettings>) => {
    setDashboardSettings(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  // Notification management
  const notificationCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Current location data
  const currentLocation = useMemo(() => {
    return locations.find(loc => loc.name === selectedLocation) || locations[0];
  }, [locations, selectedLocation]);

  return {
    // Core state
    isLoading,
    dashboardSettings,
    selectedLocation,
    setSelectedLocation,
    locations,
    currentLocation,
    isDarkMode,
    mobileMenuOpen,
    setMobileMenuOpen,
    lastRefresh,
    isRefreshing,

    // Notifications
    notifications,
    notificationCount,
    markNotificationAsRead,
    clearNotification,
    clearAllNotifications,

    // Actions
    toggleTheme,
    refreshDashboard,
    exportDashboard,
    updateSettings,

    // Widget management
    isWidgetVisible,
    getWidgetPriority,
    toggleWidgetVisibility,
    updateWidgetPriority,

    // Computed values
    enableAnimations: dashboardSettings.enableAnimations,
    compactView: dashboardSettings.compactView,
    autoRefresh: dashboardSettings.autoRefresh
  };
}

// Keyboard shortcuts hook
export function useKeyboardShortcuts(
  toggleTheme: () => void,
  refreshDashboard: () => void,
  exportDashboard: () => void,
  setMobileMenuOpen: (open: boolean) => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const { key, ctrlKey, metaKey, shiftKey } = event;
      const isModifierPressed = ctrlKey || metaKey;

      // Theme toggle: Ctrl/Cmd + Shift + T
      if (isModifierPressed && shiftKey && key === 'T') {
        event.preventDefault();
        toggleTheme();
        return;
      }

      // Refresh: Ctrl/Cmd + R (if not default browser refresh)
      if (isModifierPressed && key === 'r' && !event.defaultPrevented) {
        event.preventDefault();
        refreshDashboard();
        return;
      }

      // Export: Ctrl/Cmd + E
      if (isModifierPressed && key === 'e') {
        event.preventDefault();
        exportDashboard();
        return;
      }

      // Toggle mobile menu: Escape
      if (key === 'Escape') {
        setMobileMenuOpen(false);
        return;
      }

      // Mobile menu: M key
      if (key === 'm' || key === 'M') {
        setMobileMenuOpen(prev => !prev);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, refreshDashboard, exportDashboard, setMobileMenuOpen]);
}