import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import OfflineProvider from './OfflineDetector';
import FeatureTour from './FeatureTour';
import DashboardHeader from './DashboardHeader';
import DashboardGrid from './DashboardGrid';
import ComingSoonWidget from './ComingSoonWidget';
import { BarChart3 } from 'lucide-react';

// Simplified hooks for basic functionality
const useLanguage = () => ({
  language: 'de' as const
});

const useAppState = () => ({
  selectedLocation: 'Hauptfiliale München',
  setSelectedLocation: () => {},
  notificationCount: 3,
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
  isDarkMode: false,
  dashboardSettings: {},
  isLoading: false,
  toggleTheme: () => {},
  refreshDashboard: () => {},
  exportDashboard: () => {},
  isWidgetVisible: () => true,
  getWidgetPriority: () => 'normal' as const
});

const useKeyboardShortcuts = () => {};

function DashboardApp() {
  const { language } = useLanguage();
  const {
    selectedLocation,
    setSelectedLocation,
    notificationCount,
    mobileMenuOpen,
    setMobileMenuOpen,
    isDarkMode,
    dashboardSettings,
    isLoading,
    toggleTheme,
    refreshDashboard,
    exportDashboard,
    isWidgetVisible,
    getWidgetPriority
  } = useAppState();

  // Setup keyboard shortcuts
  useKeyboardShortcuts();

  // Main content translations
  const mainTexts = {
    title: {
      de: 'Restaurant Dashboard',
      en: 'Restaurant Dashboard'
    },
    subtitle: {
      de: 'Übersicht aller wichtigen Kennzahlen und Metriken',
      en: 'Overview of all important metrics and KPIs'
    }
  };

  const getText = (key: keyof typeof mainTexts) => {
    return mainTexts[key][language];
  };

  // Show loading skeleton while initializing
  if (isLoading) {
    return <ComingSoonWidget icon={BarChart3} title="Dashboard wird geladen..." />;
  }

  return (
    <ErrorBoundary fallbackType="dashboard" onError={(error, errorInfo) => {
      console.error('Dashboard Error:', error, errorInfo);
      // Send to monitoring service
    }}>
      <OfflineProvider>
        <FeatureTour>
          <div className="min-h-screen bg-background transition-colors duration-300">
            <DashboardHeader
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              notificationCount={notificationCount}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
            />

            {/* Main Content */}
            <main className="p-4 md:p-6">
              <div className="mb-6">
                <h1 className="headline-xl text-foreground mb-2">
                  {getText('title')}
                </h1>
                <p className="body-lg text-muted-foreground">
                  {getText('subtitle')} - {selectedLocation}
                </p>
              </div>

              <DashboardGrid
                isWidgetVisible={isWidgetVisible}
                getWidgetPriority={getWidgetPriority}
              />
            </main>
          </div>
        </FeatureTour>
      </OfflineProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return <DashboardApp />;
}