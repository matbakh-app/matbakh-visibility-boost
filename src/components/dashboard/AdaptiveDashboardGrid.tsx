/**
 * Adaptive Dashboard Grid - Automatically adjusts layout based on available AI services
 * Implements progressive feature disclosure and persona-adaptive interface
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIServices } from '@/hooks/useAIServices';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import WidgetErrorBoundary from './WidgetErrorBoundary';

// Import existing widgets
import VisibilityScoreWidget from './widgets/VisibilityScoreWidget';
import ReviewsWidget from './widgets/ReviewsWidget';
import OrdersWidget from './widgets/OrdersWidget';
import ReservationsWidget from './widgets/ReservationsWidget';
import AdAnalyticsWidget from './widgets/AdAnalyticsWidget';
import BookingPortalWidget from './widgets/BookingPortalWidget';

// Import new AI-powered widgets
import AIRecommendationsWidget from './widgets/AIRecommendationsWidget';
import AIAnalysisWidget from './widgets/AIAnalysisWidget';
import AIContentWidget from './widgets/AIContentWidget';
import AIInsightsWidget from './widgets/AIInsightsWidget';
import AIStatusWidget from './widgets/AIStatusWidget';
import PersonaSelectionWidget from './widgets/PersonaSelectionWidget';

interface AdaptiveDashboardGridProps {
  userRole?: 'admin' | 'manager' | 'user';
  compactMode?: boolean;
  showPersonaSelector?: boolean;
}

interface WidgetConfig {
  id: string;
  component: React.ComponentType<any>;
  title: string;
  category: 'core' | 'ai' | 'analytics' | 'management';
  requiredCapabilities?: string[];
  requiredFeatures?: string[];
  requiredRoles?: string[];
  gridSize: {
    cols: number;
    rows?: number;
  };
  priority: number;
  beta?: boolean;
}

const AdaptiveDashboardGrid: React.FC<AdaptiveDashboardGridProps> = ({
  userRole = 'user',
  compactMode = false,
  showPersonaSelector = true
}) => {
  const { t } = useTranslation('dashboard');
  const { hasFeature, hasRole } = useFeatureAccess();
  const {
    portfolio,
    isLoading,
    shouldShowWidget,
    getWidgetPriority,
    currentPersona,
    hasCapability,
    getAvailableServices
  } = useAIServices();

  // Define all available widgets with their configurations
  const widgetConfigs: WidgetConfig[] = useMemo(() => [
    // Core Business Widgets
    {
      id: 'visibility_score',
      component: VisibilityScoreWidget,
      title: t('widgets.visibilityScore.title', 'Sichtbarkeits-Score'),
      category: 'core',
      gridSize: { cols: 1 },
      priority: 100
    },
    {
      id: 'reviews',
      component: ReviewsWidget,
      title: t('widgets.reviews.title', 'Bewertungen'),
      category: 'core',
      gridSize: { cols: 1 },
      priority: 90
    },
    {
      id: 'orders',
      component: OrdersWidget,
      title: t('widgets.orders.title', 'Bestellungen'),
      category: 'management',
      requiredRoles: ['admin', 'manager'],
      gridSize: { cols: 1 },
      priority: 80
    },
    {
      id: 'reservations',
      component: ReservationsWidget,
      title: t('widgets.reservations.title', 'Reservierungen'),
      category: 'management',
      requiredRoles: ['admin', 'manager'],
      gridSize: { cols: 1 },
      priority: 75
    },
    {
      id: 'ad_analytics',
      component: AdAnalyticsWidget,
      title: t('widgets.adAnalytics.title', 'Werbeanzeigen'),
      category: 'analytics',
      requiredRoles: ['admin', 'manager'],
      gridSize: { cols: 2 },
      priority: 70
    },
    {
      id: 'booking_portal',
      component: BookingPortalWidget,
      title: t('widgets.bookingPortal.title', 'Buchungsportale'),
      category: 'management',
      gridSize: { cols: 3 },
      priority: 65
    },

    // AI-Powered Widgets
    {
      id: 'ai_recommendations',
      component: AIRecommendationsWidget,
      title: t('widgets.aiRecommendations.title', 'KI-Empfehlungen'),
      category: 'ai',
      requiredCapabilities: ['business_recommendations'],
      requiredFeatures: ['ai_analysis'],
      gridSize: { cols: 2 },
      priority: 95
    },
    {
      id: 'ai_analysis',
      component: AIAnalysisWidget,
      title: t('widgets.aiAnalysis.title', 'KI-Analyse'),
      category: 'ai',
      requiredCapabilities: ['vc_analysis', 'competitive_analysis'],
      requiredFeatures: ['ai_analysis'],
      gridSize: { cols: 2 },
      priority: 85
    },
    {
      id: 'ai_content',
      component: AIContentWidget,
      title: t('widgets.aiContent.title', 'KI-Content'),
      category: 'ai',
      requiredCapabilities: ['content_generation'],
      requiredFeatures: ['ai_content'],
      gridSize: { cols: 1 },
      priority: 75,
      beta: true
    },
    {
      id: 'ai_insights',
      component: AIInsightsWidget,
      title: t('widgets.aiInsights.title', 'KI-Insights'),
      category: 'ai',
      requiredCapabilities: ['persona_detection'],
      requiredFeatures: ['ai_analysis'],
      gridSize: { cols: 1 },
      priority: 70
    },
    {
      id: 'ai_status',
      component: AIStatusWidget,
      title: t('widgets.aiStatus.title', 'KI-Status'),
      category: 'ai',
      gridSize: { cols: 1 },
      priority: 60
    },
    {
      id: 'persona_selection',
      component: PersonaSelectionWidget,
      title: t('widgets.personaSelection.title', 'Persona-Auswahl'),
      category: 'ai',
      gridSize: { cols: 1 },
      priority: 55
    }
  ], [t]);

  // Filter and sort widgets based on availability and permissions
  const availableWidgets = useMemo(() => {
    return widgetConfigs
      .filter(widget => {
        // Check role permissions
        if (widget.requiredRoles && !widget.requiredRoles.includes(userRole)) {
          return false;
        }

        // Check feature access
        if (widget.requiredFeatures && !widget.requiredFeatures.some(f => hasFeature(f))) {
          return false;
        }

        // Check AI capabilities
        if (widget.requiredCapabilities && !widget.requiredCapabilities.some(c => hasCapability(c))) {
          return false;
        }

        // Check if AI widget should be shown
        if (widget.category === 'ai' && !shouldShowWidget(widget.id)) {
          return false;
        }

        // Hide persona selector if disabled
        if (widget.id === 'persona_selection' && !showPersonaSelector) {
          return false;
        }

        // Hide beta features for simple personas
        if (widget.beta && currentPersona === 'Solo-Sarah') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by priority (higher first)
        const priorityA = getWidgetPriority(a.id) || a.priority;
        const priorityB = getWidgetPriority(b.id) || b.priority;
        return priorityB - priorityA;
      });
  }, [
    widgetConfigs,
    userRole,
    hasFeature,
    hasCapability,
    shouldShowWidget,
    showPersonaSelector,
    currentPersona,
    getWidgetPriority
  ]);

  // Group widgets by category for better layout
  const widgetsByCategory = useMemo(() => {
    const groups: Record<string, WidgetConfig[]> = {
      ai: [],
      core: [],
      analytics: [],
      management: []
    };

    availableWidgets.forEach(widget => {
      groups[widget.category].push(widget);
    });

    return groups;
  }, [availableWidgets]);

  // Render widget with error boundary
  const renderWidget = (widget: WidgetConfig, key: string) => {
    const Widget = widget.component;
    
    return (
      <div
        key={key}
        className={`
          ${widget.gridSize.cols === 1 ? 'lg:col-span-1' : ''}
          ${widget.gridSize.cols === 2 ? 'lg:col-span-2' : ''}
          ${widget.gridSize.cols === 3 ? 'lg:col-span-3' : ''}
          ${compactMode ? 'h-48' : 'h-auto'}
        `}
      >
        <WidgetErrorBoundary widgetName={widget.title}>
          <Widget 
            compactMode={compactMode}
            persona={currentPersona}
            beta={widget.beta}
          />
        </WidgetErrorBoundary>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state when no widgets are available
  if (availableWidgets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('dashboard.noWidgets.title', 'Keine Widgets verfügbar')}
        </h3>
        <p className="text-gray-500">
          {t('dashboard.noWidgets.description', 'Kontaktieren Sie Ihren Administrator, um Widgets zu aktivieren.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Service Status Banner */}
      {portfolio && portfolio.activeServices > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-900">
                {t('dashboard.aiStatus.active', {
                  count: portfolio.activeServices,
                  total: portfolio.services.length,
                  defaultValue: `${portfolio.activeServices} von ${portfolio.services.length} KI-Services aktiv`
                })}
              </span>
            </div>
            <div className="text-xs text-blue-700">
              {t('dashboard.aiStatus.healthScore', {
                score: portfolio.healthScore,
                defaultValue: `Gesundheit: ${portfolio.healthScore}%`
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Widgets Section */}
      {widgetsByCategory.ai.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            {t('dashboard.sections.ai', 'KI-gestützte Funktionen')}
            {currentPersona && (
              <span className="ml-2 text-sm text-gray-500">
                ({currentPersona})
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgetsByCategory.ai.map((widget, index) => 
              renderWidget(widget, `ai-${index}`)
            )}
          </div>
        </div>
      )}

      {/* Core Business Widgets */}
      {widgetsByCategory.core.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {t('dashboard.sections.core', 'Kernfunktionen')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgetsByCategory.core.map((widget, index) => 
              renderWidget(widget, `core-${index}`)
            )}
          </div>
        </div>
      )}

      {/* Analytics Widgets */}
      {widgetsByCategory.analytics.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {t('dashboard.sections.analytics', 'Analytics')}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {widgetsByCategory.analytics.map((widget, index) => 
              renderWidget(widget, `analytics-${index}`)
            )}
          </div>
        </div>
      )}

      {/* Management Widgets */}
      {widgetsByCategory.management.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            {t('dashboard.sections.management', 'Management')}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {widgetsByCategory.management.map((widget, index) => 
              renderWidget(widget, `management-${index}`)
            )}
          </div>
        </div>
      )}

      {/* Progressive Feature Disclosure Message */}
      {portfolio && portfolio.services.some(s => s.status !== 'active') && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            {t('dashboard.progressiveDisclosure', 
              'Weitere KI-Features werden verfügbar, sobald zusätzliche Services aktiviert werden.'
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdaptiveDashboardGrid;