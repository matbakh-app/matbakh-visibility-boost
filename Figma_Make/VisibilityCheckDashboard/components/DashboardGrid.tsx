import React, { Suspense, useState, useEffect } from 'react';
import { DashboardSettings } from '../hooks/useAppState';
import { useLanguage } from '../hooks/useLanguage';
import LazyWidget from './LazyWidget';
import LoadingSkeleton from './LoadingSkeleton';

// Import all widgets
import VisibilityScoreWidget from './VisibilityScoreWidget';
import ReviewsWidget from './ReviewsWidget';
import AnalyticsWidget from './AnalyticsWidget';
import OrdersRevenueWidget from './OrdersRevenueWidget';
import ReservationsWidget from './ReservationsWidget';
import MarketingWidget from './MarketingWidget';
import LocationOverviewWidget from './LocationOverviewWidget';
import PerformanceTrendsWidget from './PerformanceTrendsWidget';
import CompetitorMonitoringWidget from './CompetitorMonitoringWidget';
import CulturalInsightsWidget from './CulturalInsightsWidget';
import ABTestingWidget from './ABTestingWidget';
import StaffDashboardWidget from './StaffDashboardWidget';
import LoyaltyProgramWidget from './LoyaltyProgramWidget';
import DeliveryTrackingWidget from './DeliveryTrackingWidget';
import InstagramStoriesWidget from './InstagramStoriesWidget';
import ComingSoonWidget from './ComingSoonWidget';

interface DashboardGridProps {
  isWidgetVisible: (widgetId: string) => boolean;
  getWidgetPriority: (widgetId: string) => number;
  dashboardSettings?: DashboardSettings;
}

// Widget configuration with i18n support
const WIDGET_CONFIG = {
  'visibility-score': {
    component: VisibilityScoreWidget,
    defaultSize: 'medium',
    category: 'performance',
    priority: 1,
    title: { de: 'Sichtbarkeits-Score', en: 'Visibility Score' },
    description: { de: 'Google Business Performance', en: 'Google Business Performance' }
  },
  'reviews': {
    component: ReviewsWidget,
    defaultSize: 'large',
    category: 'customer',
    priority: 2,
    title: { de: 'Bewertungen', en: 'Reviews' },
    description: { de: 'Multi-Platform Bewertungen', en: 'Multi-Platform Reviews' }
  },
  'analytics': {
    component: AnalyticsWidget,
    defaultSize: 'large',
    category: 'analytics',
    priority: 3,
    title: { de: 'Website Analytics', en: 'Website Analytics' },
    description: { de: 'Besucher & Engagement', en: 'Visitors & Engagement' }
  },
  'orders-revenue': {
    component: OrdersRevenueWidget,
    defaultSize: 'large',
    category: 'business',
    priority: 4,
    title: { de: 'Bestellungen & Umsatz', en: 'Orders & Revenue' },
    description: { de: 'Verkaufs-Performance', en: 'Sales Performance' }
  },
  'reservations': {
    component: ReservationsWidget,
    defaultSize: 'large',
    category: 'operations',
    priority: 5,
    title: { de: 'Reservierungen', en: 'Reservations' },
    description: { de: 'Tischmanagement', en: 'Table Management' }
  },
  'marketing': {
    component: MarketingWidget,
    defaultSize: 'large',
    category: 'marketing',
    priority: 6,
    title: { de: 'Marketing Performance', en: 'Marketing Performance' },
    description: { de: 'Kampagnen & ROI', en: 'Campaigns & ROI' }
  },
  'location-overview': {
    component: LocationOverviewWidget,
    defaultSize: 'medium',
    category: 'operations',
    priority: 7,
    title: { de: 'Standort-Übersicht', en: 'Location Overview' },
    description: { de: 'Restaurant-Details', en: 'Restaurant Details' }
  },
  'performance-trends': {
    component: PerformanceTrendsWidget,
    defaultSize: 'large',
    category: 'analytics',
    priority: 8,
    title: { de: 'Performance-Trends', en: 'Performance Trends' },
    description: { de: 'KPI-Entwicklung', en: 'KPI Development' }
  },
  'competitor-monitoring': {
    component: CompetitorMonitoringWidget,
    defaultSize: 'medium',
    category: 'intelligence',
    priority: 9,
    title: { de: 'Konkurrenz-Monitoring', en: 'Competitor Monitoring' },
    description: { de: 'Marktanalyse', en: 'Market Analysis' }
  },
  'cultural-insights': {
    component: CulturalInsightsWidget,
    defaultSize: 'medium',
    category: 'intelligence',
    priority: 10,
    title: { de: 'Kultur-Insights', en: 'Cultural Insights' },
    description: { de: 'Zielgruppen-Analyse', en: 'Audience Analysis' }
  },
  'ab-testing': {
    component: ABTestingWidget,
    defaultSize: 'medium',
    category: 'optimization',
    priority: 11,
    title: { de: 'A/B Testing', en: 'A/B Testing' },
    description: { de: 'Experimentierung', en: 'Experimentation' }
  },
  'staff-dashboard': {
    component: StaffDashboardWidget,
    defaultSize: 'large',
    category: 'operations',
    priority: 12,
    title: { de: 'Personal-Dashboard', en: 'Staff Dashboard' },
    description: { de: 'Team-Management', en: 'Team Management' }
  },
  'loyalty-program': {
    component: LoyaltyProgramWidget,
    defaultSize: 'medium',
    category: 'customer',
    priority: 13,
    title: { de: 'Treueprogramm', en: 'Loyalty Program' },
    description: { de: 'Kundenbindung', en: 'Customer Retention' }
  },
  'delivery-tracking': {
    component: DeliveryTrackingWidget,
    defaultSize: 'medium',
    category: 'operations',
    priority: 14,
    title: { de: 'Lieferung-Tracking', en: 'Delivery Tracking' },
    description: { de: 'Lieferservice', en: 'Delivery Service' }
  },
  'instagram-stories': {
    component: InstagramStoriesWidget,
    defaultSize: 'small',
    category: 'marketing',
    priority: 15,
    title: { de: 'Instagram Stories', en: 'Instagram Stories' },
    description: { de: 'Social Media', en: 'Social Media' }
  }
} as const;

type WidgetId = keyof typeof WIDGET_CONFIG;
type WidgetSize = 'small' | 'medium' | 'large';

const DashboardGrid: React.FC<DashboardGridProps> = ({
  isWidgetVisible,
  getWidgetPriority,
  dashboardSettings
}) => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);

  // Simulate loading time for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Get visible widgets sorted by priority
  const getVisibleWidgets = (): WidgetId[] => {
    return (Object.keys(WIDGET_CONFIG) as WidgetId[])
      .filter(widgetId => isWidgetVisible(widgetId))
      .sort((a, b) => getWidgetPriority(a) - getWidgetPriority(b));
  };

  // Get widget size class
  const getWidgetSizeClass = (widgetId: WidgetId, size?: WidgetSize): string => {
    const widgetSize = size || WIDGET_CONFIG[widgetId].defaultSize;
    const isCompact = dashboardSettings?.compactView || false;
    
    const sizeClasses = {
      small: isCompact ? 'col-span-1 row-span-1' : 'col-span-1 row-span-2',
      medium: isCompact ? 'col-span-1 row-span-1' : 'col-span-1 row-span-2',
      large: isCompact ? 'col-span-2 row-span-1' : 'col-span-2 row-span-2'
    };

    return sizeClasses[widgetSize];
  };

  // Drag and drop handlers
  const handleDragStart = (widgetId: WidgetId) => {
    setDraggedWidget(widgetId);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: WidgetId) => {
    e.preventDefault();
    if (draggedWidget && draggedWidget !== targetWidgetId) {
      // Here you could implement widget reordering logic
      console.log(`Moving ${draggedWidget} to position of ${targetWidgetId}`);
    }
    setDraggedWidget(null);
  };

  // Render widget with error boundary
  const renderWidget = (widgetId: WidgetId, index: number) => {
    const config = WIDGET_CONFIG[widgetId];
    const WidgetComponent = config.component;
    const isDragging = draggedWidget === widgetId;

    return (
      <div
        key={widgetId}
        className={`
          ${getWidgetSizeClass(widgetId)}
          transition-all duration-200 ease-out
          ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
          ${isDragging ? 'z-50' : 'z-0'}
        `}
        draggable={true}
        onDragStart={() => handleDragStart(widgetId)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, widgetId)}
        data-widget-id={widgetId}
        data-widget-category={config.category}
        style={{
          animationDelay: `${index * 50}ms`
        }}
      >
        <Suspense fallback={
          <div className="h-full w-full rounded-lg bg-accent/20 animate-pulse flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-muted rounded-full mx-auto animate-spin"></div>
              <p className="caption text-muted-foreground">
                {language === 'de' ? 'Lädt...' : 'Loading...'}
              </p>
            </div>
          </div>
        }>
          <LazyWidget
            title={config.title[language]}
            description={config.description[language]}
            category={config.category}
            isVisible={true}
            onVisibilityChange={() => {}}
          >
            <WidgetComponent />
          </LazyWidget>
        </Suspense>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const visibleWidgets = getVisibleWidgets();

  // Empty state
  if (visibleWidgets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-2 border-muted-foreground rounded-full"></div>
          </div>
          <h3 className="headline-md text-foreground">
            {language === 'de' ? 'Keine Widgets verfügbar' : 'No Widgets Available'}
          </h3>
          <p className="body-md text-muted-foreground">
            {language === 'de' 
              ? 'Aktivieren Sie Widgets in den Einstellungen, um Ihr Dashboard anzupassen.'
              : 'Enable widgets in settings to customize your dashboard.'
            }
          </p>
          <ComingSoonWidget />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        grid gap-4 md:gap-6 
        ${dashboardSettings?.compactView 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[200px]'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[280px]'
        }
        transition-all duration-300 ease-out
      `}
      style={{
        gridAutoFlow: 'row dense'
      }}
    >
      {visibleWidgets.map((widgetId, index) => renderWidget(widgetId, index))}
      
      {/* Add Widget Placeholder */}
      {visibleWidgets.length < Object.keys(WIDGET_CONFIG).length && (
        <div className="col-span-1 row-span-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-accent/20 transition-all duration-200 cursor-pointer group">
          <div className="text-center space-y-2 p-4">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
              <span className="text-lg">+</span>
            </div>
            <p className="caption text-muted-foreground group-hover:text-foreground transition-colors">
              {language === 'de' ? 'Widget hinzufügen' : 'Add Widget'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;