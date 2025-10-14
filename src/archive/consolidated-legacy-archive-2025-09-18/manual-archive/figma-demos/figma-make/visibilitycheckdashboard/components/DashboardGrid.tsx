import React, { Suspense, useState, useEffect } from 'react';
import { DashboardSettings } from '../hooks/useAppState';
import { useLanguage } from '../hooks/useLanguage';
import LazyWidget from './LazyWidget';
import LoadingSkeleton from './LoadingSkeleton';

// Import all widgets
import VisibilityScoreWidget from './VisibilityScoreWidget';
import ReviewsWidget from './ReviewsWidget';
import AnalyticsWidget from './AnalyticsWidget';
import MarketingWidget from './MarketingWidget';
import PerformanceTrendsWidget from './PerformanceTrendsWidget';
import CompetitorMonitoringWidget from './CompetitorMonitoringWidget';
import CulturalInsightsWidget from './CulturalInsightsWidget';
import ABTestingWidget from './ABTestingWidget';
import LoyaltyProgramWidget from './LoyaltyProgramWidget';
import InstagramStoriesWidget from './InstagramStoriesWidget';

interface DashboardGridProps {
  isWidgetVisible: (widgetId: string) => boolean;
  getWidgetPriority: (widgetId: string) => number;
  dashboardSettings?: DashboardSettings;
  isPublicMode?: boolean;
  className?: string;
}

// Widget configuration with i18n support and exact priority sorting
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
    defaultSize: 'xlarge',
    category: 'analytics',
    priority: 3,
    title: { de: 'Website Analytics', en: 'Website Analytics' },
    description: { de: 'Besucher & Engagement', en: 'Visitors & Engagement' }
  },
  'marketing': {
    component: MarketingWidget,
    defaultSize: 'xlarge',
    category: 'marketing',
    priority: 6,
    title: { de: 'Marketing Performance', en: 'Marketing Performance' },
    description: { de: 'Kampagnen & ROI', en: 'Campaigns & ROI' }
  },
  'performance-trends': {
    component: PerformanceTrendsWidget,
    defaultSize: 'xlarge',
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
  'loyalty-program': {
    component: LoyaltyProgramWidget,
    defaultSize: 'medium',
    category: 'customer',
    priority: 13,
    title: { de: 'Treueprogramm', en: 'Loyalty Program' },
    description: { de: 'Kundenbindung', en: 'Customer Retention' }
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

const DashboardGrid: React.FC<DashboardGridProps> = ({
  isWidgetVisible,
  getWidgetPriority,
  dashboardSettings,
  isPublicMode = false,
  className = ''
}) => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);

  // Simulate loading time for better UX
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Get visible widgets sorted by priority (ascending)
  const getVisibleWidgets = (): WidgetId[] => {
    return (Object.keys(WIDGET_CONFIG) as WidgetId[])
      .filter(widgetId => isWidgetVisible(widgetId))
      .sort((a, b) => WIDGET_CONFIG[a].priority - WIDGET_CONFIG[b].priority);
  };

  // Get widget size class based on specification
  const getWidgetSizeClass = (widgetId: WidgetId): string => {
    const config = WIDGET_CONFIG[widgetId];
    const widgetSize = config.defaultSize;
    const isCompact = dashboardSettings?.compactView || false;
    
    if (isCompact) {
      // Compact mode - everything smaller
      const compactSizeClasses = {
        xlarge: 'col-span-2',
        large: 'col-span-2', 
        medium: 'col-span-1',
        small: 'col-span-1'
      };
      return compactSizeClasses[widgetSize];
    }
    
    // Normal mode - exact specification
    const sizeClasses = {
      xlarge: 'col-span-3', // analytics, marketing, performance-trends
      large: 'col-span-2',  // reviews  
      medium: 'col-span-1', // visibility-score, competitor-monitoring, cultural-insights, ab-testing, loyalty-program
      small: 'col-span-1'   // instagram-stories
    };

    return sizeClasses[widgetSize];
  };

  // Get minimum height based on widget type and mode
  const getWidgetMinHeight = (widgetId: WidgetId): number => {
    const config = WIDGET_CONFIG[widgetId];
    const widgetSize = config.defaultSize;
    const isCompact = dashboardSettings?.compactView || false;
    
    if (isCompact) {
      return 280; // Smaller in compact mode
    }
    
    // Specification minimum heights (optimized for better content visibility)
    const minHeights = {
      xlarge: 520, // XLarge widgets - analytics, marketing, performance-trends
      large: 440,  // Large widgets - reviews  
      medium: 360, // Medium widgets - visibility-score, competitor-monitoring, etc.
      small: 360   // Small widgets - instagram-stories
    };

    return minHeights[widgetSize];
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
      console.log(`Moving ${draggedWidget} to position of ${targetWidgetId}`);
    }
    setDraggedWidget(null);
  };

  // Render widget with error boundary
  const renderWidget = (widgetId: WidgetId, index: number) => {
    const config = WIDGET_CONFIG[widgetId];
    const WidgetComponent = config.component;
    const isDragging = draggedWidget === widgetId;
    const minHeight = getWidgetMinHeight(widgetId);

    const widgetContent = (
      <Suspense fallback={
        <div 
          className="h-full w-full rounded-lg bg-accent/20 animate-pulse flex items-center justify-center"
          style={{ minHeight: `${minHeight}px` }}
        >
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
          <WidgetComponent 
            isPublicMode={isPublicMode}
            onUpgrade={() => window.open('/pricing', '_blank')}
          />
        </LazyWidget>
      </Suspense>
    );

    return (
      <div
        key={widgetId}
        className={`
          ${getWidgetSizeClass(widgetId)}
          transition-all duration-200 ease-out
          ${isDragging ? 'opacity-50 scale-95 z-50' : 'opacity-100 scale-100 z-10'}
          relative
        `}
        draggable={!isPublicMode}
        onDragStart={() => !isPublicMode && handleDragStart(widgetId)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, widgetId)}
        data-widget-id={widgetId}
        data-widget={widgetId}
        data-widget-category={config.category}
        data-public-mode={isPublicMode.toString()}
        style={{
          animationDelay: `${index * 50}ms`,
          minHeight: `${minHeight}px`
        }}
      >
        {widgetContent}
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const visibleWidgets = getVisibleWidgets();
  const isCompact = dashboardSettings?.compactView || false;

  // Empty state
  if (visibleWidgets.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-card border border-border rounded-lg"
        style={{ 
          minHeight: '400px',
          padding: '32px'
        }}
      >
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
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        dashboard-grid-container-maximized
        ${className}
      `}
      style={{
        width: '100%',
        position: 'relative'
      }}
    >
      {/* Grid Container with optimized responsive behavior for maximum width usage */}
      <div
        className="dashboard-grid-full-width"
        style={{
          display: 'grid',
          // Responsive grid columns optimized for full width usage
          gridTemplateColumns: `
            ${window.innerWidth >= 1600 ? 'repeat(5, 1fr)' : 
              window.innerWidth >= 1400 ? 'repeat(4, 1fr)' :
              window.innerWidth >= 1024 ? 'repeat(3, 1fr)' :
              window.innerWidth >= 768 ? 'repeat(2, 1fr)' : 
              '1fr'}
          `,
          gridAutoRows: isCompact ? '300px' : '420px', // Increased row height for better content display
          gap: '24px', // Consistent 24px gap as specified
          gridAutoFlow: 'row dense', // Optimal space usage
          width: '100%',
          // Reduced padding for maximum widget width utilization
          padding: '16px', // Reduced from 24px to maximize widget space
          position: 'relative',
          zIndex: 1
        }}
        data-public-mode={isPublicMode.toString()}
        data-compact={isCompact.toString()}
      >
        {visibleWidgets.map((widgetId, index) => renderWidget(widgetId, index))}
        
        {/* Add Widget Placeholder - only for authenticated users */}
        {!isPublicMode && visibleWidgets.length < Object.keys(WIDGET_CONFIG).length && (
          <div 
            className="col-span-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-accent/20 transition-all duration-200 cursor-pointer group"
            style={{ 
              minHeight: isCompact ? '300px' : '420px',
              position: 'relative',
              zIndex: 5
            }}
          >
            <div className="text-center space-y-2" style={{ padding: '24px' }}>
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                <span className="text-2xl">+</span>
              </div>
              <p className="caption text-muted-foreground group-hover:text-foreground transition-colors">
                {language === 'de' ? 'Widget hinzufügen' : 'Add Widget'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardGrid;