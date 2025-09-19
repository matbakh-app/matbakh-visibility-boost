import React, { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LazyWidget from './LazyWidget';
import { SkeletonCard } from './WidgetStates';

// Core widgets - Load immediately
import VisibilityScoreWidget from './VisibilityScoreWidget';
import ReviewsWidget from './ReviewsWidget';
import AnalyticsWidget from './AnalyticsWidget';
import OrdersRevenueWidget from './OrdersRevenueWidget';
import ReservationsWidget from './ReservationsWidget';
import MarketingWidget from './MarketingWidget';
import LocationOverviewWidget from './LocationOverviewWidget';
import InstagramStoriesWidget from './InstagramStoriesWidget';
import DeliveryTrackingWidget from './DeliveryTrackingWidget';
import StaffDashboardWidget from './StaffDashboardWidget';
import LoyaltyProgramWidget from './LoyaltyProgramWidget';

// Business Intelligence widgets - Lazy loaded
const CompetitorMonitoringWidget = React.lazy(() => import('./CompetitorMonitoringWidget'));
const PerformanceTrendsWidget = React.lazy(() => import('./PerformanceTrendsWidget'));
const CulturalInsightsWidget = React.lazy(() => import('./CulturalInsightsWidget'));
const ABTestingWidget = React.lazy(() => import('./ABTestingWidget'));

interface DashboardGridProps {
  isWidgetVisible: (widgetId: string) => boolean;
  getWidgetPriority: (widgetId: string) => 'high' | 'normal' | 'low';
}

const DashboardGrid: React.FC<DashboardGridProps> = ({
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
      
      {isWidgetVisible('competitor-monitoring') && (
        <div className="order-7 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-6" data-widget="competitor-monitoring">
          <ErrorBoundary widgetName="Wettbewerber-Analyse">
            <LazyWidget
              priority={getWidgetPriority('competitor-monitoring')}
              cacheKey="competitor-monitoring"
              preloadData={true}
            >
              <Suspense fallback={<SkeletonCard height="h-96" />}>
                <CompetitorMonitoringWidget />
              </Suspense>
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('performance-trends') && (
        <div className="order-8 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-6" data-widget="performance-trends">
          <ErrorBoundary widgetName="Performance-Trends">
            <LazyWidget
              priority={getWidgetPriority('performance-trends')}
              cacheKey="performance-trends"
              preloadData={true}
            >
              <Suspense fallback={<SkeletonCard height="h-96" />}>
                <PerformanceTrendsWidget />
              </Suspense>
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('cultural-insights') && (
        <div className="order-9 md:order-none md:col-span-2 lg:col-span-4 xl:col-span-8" data-widget="cultural-insights">
          <ErrorBoundary widgetName="Kulturdimensionen-Analyse">
            <LazyWidget
              priority={getWidgetPriority('cultural-insights')}
              cacheKey="cultural-insights"
              preloadData={false}
            >
              <Suspense fallback={<SkeletonCard height="h-96" />}>
                <CulturalInsightsWidget />
              </Suspense>
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('ab-testing') && (
        <div className="order-10 md:order-none md:col-span-2 lg:col-span-2 xl:col-span-4" data-widget="ab-testing">
          <ErrorBoundary widgetName="A/B Test Performance">
            <LazyWidget
              priority={getWidgetPriority('ab-testing')}
              cacheKey="ab-testing"
              preloadData={true}
            >
              <Suspense fallback={<SkeletonCard height="h-96" />}>
                <ABTestingWidget />
              </Suspense>
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}

      {/* Secondary Features */}
      
      {isWidgetVisible('instagram-stories') && (
        <div className="order-11 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary widgetName="Instagram Stories">
            <LazyWidget priority="low">
              <InstagramStoriesWidget />
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('delivery-tracking') && (
        <div className="order-12 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary widgetName="Delivery Tracking">
            <LazyWidget priority="low">
              <DeliveryTrackingWidget />
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('staff-dashboard') && (
        <div className="order-13 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary widgetName="Staff Dashboard">
            <LazyWidget priority="low">
              <StaffDashboardWidget />
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('loyalty-program') && (
        <div className="order-14 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary widgetName="Loyalty Program">
            <LazyWidget priority="low">
              <LoyaltyProgramWidget />
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}

      {/* Location Overview - Full Width */}
      {isWidgetVisible('location-overview') && (
        <div className="order-15 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-12">
          <ErrorBoundary widgetName="Location Overview">
            <LazyWidget priority="low">
              <LocationOverviewWidget />
            </LazyWidget>
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;