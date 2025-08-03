import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineProvider from './components/OfflineDetector';
import FeatureTour from './components/FeatureTour';
import DashboardHeader from './components/DashboardHeader';
import DashboardGrid from './components/DashboardGrid';
import LoadingSkeleton from './components/LoadingSkeleton';
import { useAppState, useKeyboardShortcuts } from './hooks/useAppState';

export default function App() {
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
  useKeyboardShortcuts(toggleTheme, refreshDashboard, exportDashboard, setMobileMenuOpen);

  // Show loading skeleton while initializing
  if (isLoading) {
    return <LoadingSkeleton />;
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
                <h1 className="headline-xl text-foreground mb-2">Restaurant Dashboard</h1>
                <p className="body-lg text-muted-foreground">
                  Übersicht aller wichtigen Kennzahlen und Metriken - {selectedLocation}
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