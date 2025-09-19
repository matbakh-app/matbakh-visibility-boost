import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight, Crown, TrendingUp, Users, ChevronRight, Sparkles, Target, BarChart3 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface CallToActionBannerProps {
  variant?: 'primary' | 'upgrade' | 'feature' | 'widget-overlay' | 'footer' | 'sidebar';
  size?: 'sm' | 'md' | 'lg';
  context?: 'reports' | 'analytics' | 'competitors' | 'insights' | 'general';
  showIcon?: boolean;
  className?: string;
  onAction?: () => void;
}

const CallToActionBanner: React.FC<CallToActionBannerProps> = ({
  variant = 'primary',
  size = 'md',
  context = 'general',
  showIcon = true,
  className = '',
  onAction
}) => {
  const { language } = useLanguage();

  // Context-specific translations
  const translations = {
    // General CTAs
    general: {
      title: {
        de: 'Vollständigen Bericht freischalten',
        en: 'Unlock Full Report'
      },
      subtitle: {
        de: 'Entdecken Sie Ihr ganzes Potenzial',
        en: 'Discover Your Full Potential'
      },
      description: {
        de: 'Erhalten Sie Zugang zu allen Premium-Features und detaillierten Analysen',
        en: 'Get access to all premium features and detailed analytics'
      },
      button: {
        de: 'Jetzt upgraden',
        en: 'Upgrade Now'
      }
    },
    // Analytics specific
    analytics: {
      title: {
        de: 'Erweiterte Analytics freischalten',
        en: 'Unlock Advanced Analytics'
      },
      subtitle: {
        de: 'Sehen Sie, was Ihre Wettbewerber besser machen',
        en: 'See what your competitors do better'
      },
      description: {
        de: 'Detaillierte Einblicke in Performance-Trends und Wettbewerbsanalysen',
        en: 'Detailed insights into performance trends and competitive analysis'
      },
      button: {
        de: 'Analytics aktivieren',
        en: 'Activate Analytics'
      }
    },
    // Reports specific
    reports: {
      title: {
        de: 'Premium-Berichte freischalten',
        en: 'Unlock Premium Reports'
      },
      subtitle: {
        de: 'Vollständige Einsichten in Ihre Restaurant-Performance',
        en: 'Complete insights into your restaurant performance'
      },
      description: {
        de: 'Exportierbare Berichte, historische Daten und Trend-Analysen',
        en: 'Exportable reports, historical data and trend analysis'
      },
      button: {
        de: 'Berichte freischalten',
        en: 'Unlock Reports'
      }
    },
    // Competitors specific
    competitors: {
      title: {
        de: 'Wettbewerber-Monitoring aktivieren',
        en: 'Activate Competitor Monitoring'
      },
      subtitle: {
        de: 'Bleiben Sie der Konkurrenz einen Schritt voraus',
        en: 'Stay one step ahead of the competition'
      },
      description: {
        de: 'Überwachen Sie Preise, Bewertungen und Marketing-Strategien Ihrer Konkurrenten',
        en: 'Monitor prices, reviews and marketing strategies of your competitors'
      },
      button: {
        de: 'Monitoring starten',
        en: 'Start Monitoring'
      }
    },
    // Insights specific
    insights: {
      title: {
        de: 'KI-Insights freischalten',
        en: 'Unlock AI Insights'
      },
      subtitle: {
        de: 'Intelligente Handlungsempfehlungen erhalten',
        en: 'Get intelligent action recommendations'
      },
      description: {
        de: 'KI-gestützte Analysen und personalisierte Optimierungsvorschläge',
        en: 'AI-powered analysis and personalized optimization suggestions'
      },
      button: {
        de: 'KI aktivieren',
        en: 'Activate AI'
      }
    }
  };

  // Widget overlay translations
  const overlayTranslations = {
    title: {
      de: 'Premium Feature',
      en: 'Premium Feature'
    },
    subtitle: {
      de: 'Upgrade erforderlich',
      en: 'Upgrade Required'
    },
    description: {
      de: 'Melden Sie sich an, um diese Funktion zu nutzen',
      en: 'Sign up to access this feature'
    },
    button: {
      de: 'Jetzt registrieren',
      en: 'Sign Up Now'
    }
  };

  // Footer CTA translations
  const footerTranslations = {
    title: {
      de: 'Bereit für mehr Sichtbarkeit?',
      en: 'Ready for More Visibility?'
    },
    description: {
      de: 'Starten Sie noch heute und optimieren Sie Ihre Restaurant-Performance',
      en: 'Get started today and optimize your restaurant performance'
    },
    button: {
      de: 'Kostenlos testen',
      en: 'Try Free'
    },
    secondary: {
      de: 'Angebote ansehen',
      en: 'View Plans'
    }
  };

  // Get appropriate translations
  const getTexts = () => {
    if (variant === 'widget-overlay') return overlayTranslations;
    if (variant === 'footer') return footerTranslations;
    return translations[context] || translations.general;
  };

  const texts = getTexts();
  const getText = (key: string, fallback: string = '') => {
    const nested = key.split('.').reduce((obj, k) => obj?.[k], texts);
    return nested?.[language] || fallback;
  };

  // Size variants
  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  };

  // Icons based on context
  const getIcon = () => {
    switch (context) {
      case 'analytics': return <BarChart3 className="w-5 h-5" />;
      case 'competitors': return <Target className="w-5 h-5" />;
      case 'insights': return <Sparkles className="w-5 h-5" />;
      case 'reports': return <TrendingUp className="w-5 h-5" />;
      default: return <Crown className="w-5 h-5" />;
    }
  };

  // Handle CTA click
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      // Default action - redirect to pricing page
      window.open('/pricing', '_blank');
    }
  };

  // Variant implementations
  switch (variant) {
    case 'widget-overlay':
      return (
        <div className={`
          absolute inset-0 z-20
          bg-background/95 backdrop-blur-sm
          flex items-center justify-center
          border border-border rounded-lg
          transition-all duration-200
          ${className}
        `}>
          <div className="text-center space-y-3 p-4 max-w-xs">
            {showIcon && (
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
            )}
            
            <div className="space-y-1">
              <Badge variant="secondary" className="text-xs">
                {getText('title')}
              </Badge>
              <h4 className="headline-md text-foreground">
                {getText('subtitle')}
              </h4>
              <p className="caption text-muted-foreground">
                {getText('description')}
              </p>
            </div>
            
            <Button 
              size="sm" 
              onClick={handleAction}
              className="w-full"
            >
              {getText('button')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      );

    case 'footer':
      return (
        <Card className={`bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 ${className}`}>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="headline-lg text-foreground">
                  {getText('title')}
                </h3>
                <p className="body-md text-muted-foreground max-w-2xl mx-auto">
                  {getText('description')}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={handleAction}>
                  {getText('button')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="lg" onClick={handleAction}>
                  {getText('secondary')}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );

    case 'sidebar':
      return (
        <Card className={`border-primary/20 bg-primary/5 ${className}`}>
          <CardContent className="p-4">
            <div className="space-y-3">
              {showIcon && getIcon()}
              
              <div className="space-y-1">
                <h4 className="headline-md text-foreground">
                  {getText('title')}
                </h4>
                <p className="caption text-muted-foreground">
                  {getText('description')}
                </p>
              </div>
              
              <Button size="sm" className="w-full" onClick={handleAction}>
                {getText('button')}
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );



    case 'feature':
      return (
        <Card className={`border-success/20 bg-success/5 ${className}`}>
          <CardContent className={sizeClasses[size]}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="headline-md text-foreground">
                  {getText('title')}
                </h4>
                <p className="caption text-muted-foreground">
                  {getText('subtitle')}
                </p>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleAction}>
                {getText('button')}
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      );

    default: // primary
      return (
        <Card className={`bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 ${className}`}>
          <CardContent className={sizeClasses[size]}>
            <div className="flex items-start space-x-4">
              {showIcon && (
                <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  {getIcon()}
                </div>
              )}
              
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <h3 className="headline-lg text-foreground">
                    {getText('title')}
                  </h3>
                  <p className="body-md text-muted-foreground">
                    {getText('description')}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleAction}>
                    {getText('button')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={handleAction}>
                    {language === 'de' ? 'Mehr erfahren' : 'Learn More'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
  }
};

export default CallToActionBanner;