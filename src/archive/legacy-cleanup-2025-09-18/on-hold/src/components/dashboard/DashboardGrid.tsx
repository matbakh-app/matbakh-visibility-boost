import React from 'react';
import { useTranslation } from 'react-i18next';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import VisibilityScoreWidget from './widgets/VisibilityScoreWidget';
import ReviewsWidget from './widgets/ReviewsWidget';
import OrdersWidget from './widgets/OrdersWidget';
import ReservationsWidget from './widgets/ReservationsWidget';
import AdAnalyticsWidget from './widgets/AdAnalyticsWidget';
import BookingPortalWidget from './widgets/BookingPortalWidget';

interface DashboardGridProps {
  enabledWidgets?: string[];
  userRole?: 'admin' | 'manager' | 'user';
}

// Feature flags configuration
const WIDGET_FEATURE_FLAGS = {
  visibilityWidget: true,
  reviewsWidget: true,
  ordersWidget: true,
  reservationWidget: true,
  adAnalyticsWidget: true,
  bookingWidget: true,
};

// Role-based widget permissions
const WIDGET_PERMISSIONS = {
  visibilityWidget: ['admin', 'manager', 'user'],
  reviewsWidget: ['admin', 'manager', 'user'],
  ordersWidget: ['admin', 'manager'],
  reservationWidget: ['admin', 'manager'],
  adAnalyticsWidget: ['admin', 'manager'],
  bookingWidget: ['admin', 'manager', 'user'],
};

const DashboardGrid: React.FC<DashboardGridProps> = ({ 
  enabledWidgets = Object.keys(WIDGET_FEATURE_FLAGS),
  userRole = 'user'
}) => {
  const { t } = useTranslation('dashboard');

  const isWidgetEnabled = (widgetKey: string): boolean => {
    // Check feature flag
    if (!WIDGET_FEATURE_FLAGS[widgetKey as keyof typeof WIDGET_FEATURE_FLAGS]) {
      return false;
    }

    // Check if widget is in enabled list
    if (!enabledWidgets.includes(widgetKey)) {
      return false;
    }

    // Check user permissions
    const allowedRoles = WIDGET_PERMISSIONS[widgetKey as keyof typeof WIDGET_PERMISSIONS];
    return allowedRoles.includes(userRole);
  };

  return (
    <div className="space-y-6">
      {/* Main Grid - Primary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isWidgetEnabled('visibilityWidget') && (
          <div className="lg:col-span-1">
            <WidgetErrorBoundary widgetName="Sichtbarkeits-Score">
              <VisibilityScoreWidget />
            </WidgetErrorBoundary>
          </div>
        )}
        
        {isWidgetEnabled('reviewsWidget') && (
          <div className="lg:col-span-1">
            <WidgetErrorBoundary widgetName="Bewertungen">
              <ReviewsWidget />
            </WidgetErrorBoundary>
          </div>
        )}
        
        {isWidgetEnabled('ordersWidget') && (
          <div className="lg:col-span-1">
            <WidgetErrorBoundary widgetName="Bestellungen">
              <OrdersWidget />
            </WidgetErrorBoundary>
          </div>
        )}
      </div>

      {/* Secondary Grid - Analytics & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isWidgetEnabled('reservationWidget') && (
          <div>
            <WidgetErrorBoundary widgetName="Reservierungen">
              <ReservationsWidget />
            </WidgetErrorBoundary>
          </div>
        )}
        
        {isWidgetEnabled('adAnalyticsWidget') && (
          <div>
            <WidgetErrorBoundary widgetName="Werbeanzeigen">
              <AdAnalyticsWidget />
            </WidgetErrorBoundary>
          </div>
        )}
      </div>

      {/* Full Width Widgets */}
      {isWidgetEnabled('bookingWidget') && (
        <div className="w-full">
          <WidgetErrorBoundary widgetName="Buchungsportale">
            <BookingPortalWidget />
          </WidgetErrorBoundary>
        </div>
      )}

      {/* Empty State for when no widgets are enabled */}
      {!Object.keys(WIDGET_FEATURE_FLAGS).some(key => isWidgetEnabled(key)) && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Widgets verfügbar
          </h3>
          <p className="text-gray-500">
            Kontaktieren Sie Ihren Administrator, um Widgets zu aktivieren.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;