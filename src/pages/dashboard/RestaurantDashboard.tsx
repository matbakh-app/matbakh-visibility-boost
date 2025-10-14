import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUIMode } from '@/hooks/useUIMode';

// Dashboard Components
import RestaurantDashboardHeader from '@/components/dashboard/restaurant/RestaurantDashboardHeader';
import RestaurantDashboardGrid from '@/components/dashboard/restaurant/RestaurantDashboardGrid';
import LoadingSkeleton from '@/components/LoadingSkeleton';

// Hooks for dashboard state
import { useRestaurantDashboard } from '@/hooks/useRestaurantDashboard';

const RestaurantDashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useAuth();
  const { isInvisible } = useUIMode();
  
  const {
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
    getWidgetPriority
  } = useRestaurantDashboard();

  // Show loading skeleton while initializing
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <ErrorBoundary fallbackType="dashboard" onError={(error, errorInfo) => {
      console.error('Restaurant Dashboard Error:', error, errorInfo);
      // Send to monitoring service
    }}>
      <div className="min-h-screen bg-background transition-colors duration-300">
        <RestaurantDashboardHeader
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
          notificationCount={notificationCount}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          refreshDashboard={refreshDashboard}
          exportDashboard={exportDashboard}
        />

        {/* Main Content */}
        <main className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('title', { ns: 'dashboard' })}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('subtitle', { ns: 'dashboard' })} - {selectedLocation}
            </p>
          </div>

          <Suspense fallback={<LoadingSkeleton />}>
            <RestaurantDashboardGrid
              isWidgetVisible={isWidgetVisible}
              getWidgetPriority={getWidgetPriority}
            />
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default RestaurantDashboard;