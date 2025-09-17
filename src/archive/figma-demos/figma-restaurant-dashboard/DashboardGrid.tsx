import React, { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { SkeletonCard } from './WidgetStates';

// Core widgets - Load immediately
import AnalyticsWidget from './AnalyticsWidget';
import DeliveryTrackingWidget from './DeliveryTrackingWidget';
import ComingSoonWidget from './ComingSoonWidget';

// Mock components for now
const VisibilityScoreWidget = () => <ComingSoonWidget icon={() => <div>📊</div>} title="Visibility Score" />;
const ReviewsWidget = () => <ComingSoonWidget icon={() => <div>⭐</div>} title="Reviews" />;
const OrdersRevenueWidget = () => <ComingSoonWidget icon={() => <div>💰</div>} title="Orders & Revenue" />;
const ReservationsWidget = () => <ComingSoonWidget icon={() => <div>📅</div>} title="Reservations" />;
const MarketingWidget = () => <ComingSoonWidget icon={() => <div>📢</div>} title="Marketing" />;
const LocationOverviewWidget = () => <ComingSoonWidget icon={() => <div>📍</div>} title="Location Overview" />;
const InstagramStoriesWidget = () => <ComingSoonWidget icon={() => <div>📸</div>} title="Instagram Stories" />;
const StaffDashboardWidget = () => <ComingSoonWidget icon={() => <div>👥</div>} title="Staff Dashboard" />;
const LoyaltyProgramWidget = () => <ComingSoonWidget icon={() => <div>🎁</div>} title="Loyalty Program" />;

// Business Intelligence widgets - Lazy loaded
const CompetitorMonitoringWidget = React.lazy(() => import('./CompetitorMonitoringWidget'));
const PerformanceTrendsWidget = () => <ComingSoonWidget icon={() => <div>📈</div>} title="Performance Trends" />;
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
          <ErrorBoundary>
            <VisibilityScoreWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('reviews') && (
        <div className="order-2 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-4">
          <ErrorBoundary>
            <ReviewsWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('analytics') && (
        <div className="order-3 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-5">
          <ErrorBoundary>
            <AnalyticsWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('orders-revenue') && (
        <div className="order-4 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-4">
          <ErrorBoundary>
            <OrdersRevenueWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('reservations') && (
        <div className="order-5 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-4">
          <ErrorBoundary>
            <ReservationsWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('marketing') && (
        <div className="order-6 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-4">
          <ErrorBoundary>
            <MarketingWidget />
          </ErrorBoundary>
        </div>
      )}

      {/* Business Intelligence Widgets - Lazy Loaded */}
      
      {isWidgetVisible('competitor-monitoring') && (
        <div className="order-7 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-6" data-widget="competitor-monitoring">
          <ErrorBoundary>
            <Suspense fallback={<SkeletonCard height="h-96" />}>
              <CompetitorMonitoringWidget />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('performance-trends') && (
        <div className="order-8 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-6" data-widget="performance-trends">
          <ErrorBoundary>
            <PerformanceTrendsWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('cultural-insights') && (
        <div className="order-9 md:order-none md:col-span-2 lg:col-span-4 xl:col-span-8" data-widget="cultural-insights">
          <ErrorBoundary>
            <Suspense fallback={<SkeletonCard height="h-96" />}>
              <CulturalInsightsWidget />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('ab-testing') && (
        <div className="order-10 md:order-none md:col-span-2 lg:col-span-2 xl:col-span-4" data-widget="ab-testing">
          <ErrorBoundary>
            <Suspense fallback={<SkeletonCard height="h-96" />}>
              <ABTestingWidget />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {/* Secondary Features */}
      
      {isWidgetVisible('instagram-stories') && (
        <div className="order-11 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary>
            <InstagramStoriesWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('delivery-tracking') && (
        <div className="order-12 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary>
            <DeliveryTrackingWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('staff-dashboard') && (
        <div className="order-13 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary>
            <StaffDashboardWidget />
          </ErrorBoundary>
        </div>
      )}

      {isWidgetVisible('loyalty-program') && (
        <div className="order-14 md:order-none md:col-span-1 lg:col-span-3 xl:col-span-3">
          <ErrorBoundary>
            <LoyaltyProgramWidget />
          </ErrorBoundary>
        </div>
      )}

      {/* Location Overview - Full Width */}
      {isWidgetVisible('location-overview') && (
        <div className="order-15 md:order-none md:col-span-2 lg:col-span-6 xl:col-span-12">
          <ErrorBoundary>
            <LocationOverviewWidget />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;