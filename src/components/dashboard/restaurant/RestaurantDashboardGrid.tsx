import React, { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SkeletonCard } from '@/components/LoadingSkeleton';

// Core widgets - Load immediately
import VisibilityScoreWidget from './widgets/VisibilityScoreWidget';
import ReviewsWidget from './widgets/ReviewsWidget';
import AnalyticsWidget from './widgets/AnalyticsWidget';
import OrdersRevenueWidget from './widgets/OrdersRevenueWidget';
import ReservationsWidget from './widgets/ReservationsWidget';
import MarketingWidget from './widgets/MarketingWidget';

// Business Intelligence widgets - Lazy loaded
const LocationOverviewWidget = React.lazy(() => import('./widgets/LocationOverviewWidget'));
const PerformanceTrendsWidget = React.lazy(() => import('./widgets/PerformanceTrendsWidget'));

interface RestaurantDashboardGridProps {
  isWidgetVisible: (widgetId: string) => boolean;
  getWidgetPriority: (widgetId: string) => 'high' | 'normal' | 'low';
}

const RestaurantDashboardGrid: React.FC<RestaurantDashboardGridProps> = ({
  isWidgetVisible,
  getWidgetPriority
}) => {
  return (
    <div className="flex flex-col space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-12 md:gap-4 lg:gap-4">
      
      {/* Core Analytics - High Priority */}
      
      {isWidgetVisible('visibility-score') && (
        <div className="order-1 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary widgetName="Visibility Score">
            <VisibilityScoreWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('reviews') && (
        <div className="order-2 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-4">
          <ErrorBoundary widgetName="Google Reviews">
            <ReviewsWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('analytics') && (
        <div className="order-3 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-5">
          <ErrorBoundary widgetName="Multi-Platform Analytics">
            <AnalyticsWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('orders-revenue') && (
        <div className="order-4 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-4">
          <ErrorBoundary widgetName="Orders & Revenue">
            <OrdersRevenueWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('reservations') && (
        <div className="order-5 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-4">
          <ErrorBoundary widgetName="Reservations">
            <ReservationsWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('marketing') && (
        <div className="order-6 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-4">
          <ErrorBoundary widgetName="Marketing Performance">
            <MarketingWidget />
          </ErrorBoundary>
        </div>
      )}

      {/* Business Intelligence Widgets - Lazy Loaded */}
      
      {isWidgetVisible('performance-trends') && (
        <div className="order-7 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-6" data-widget="performance-trends">
          <ErrorBoundary widgetName="Performance-Trends">
            <Suspense fallback={<SkeletonCard height="h-96" />}>
              <PerformanceTrendsWidget />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {/* Location Overview - Full Width */}
      {isWidgetVisible('location-overview') && (
        <div className="order-8 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-12">
          <ErrorBoundary widgetName="Location Overview">
            <Suspense fallback={<SkeletonCard height="h-64" />}>
              <LocationOverviewWidget />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboardGrid;