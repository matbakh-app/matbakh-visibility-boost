import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Lock, Crown, Eye, ArrowRight, Clock } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import CallToActionBanner from './CallToActionBanner';

interface RestrictedWidgetProps {
  children: React.ReactNode;
  isRestricted?: boolean;
  restrictionType?: 'premium' | 'signup' | 'demo' | 'coming-soon';
  title?: string;
  description?: string;
  context?: 'analytics' | 'competitors' | 'insights' | 'reports' | 'general';
  showPreview?: boolean;
  blurLevel?: 'light' | 'medium' | 'heavy';
  onUpgrade?: () => void;
  className?: string;
}

const RestrictedWidget: React.FC<RestrictedWidgetProps> = ({
  children,
  isRestricted = true,
  restrictionType = 'premium',
  title,
  description,
  context = 'general',
  showPreview = true,
  blurLevel = 'medium',
  onUpgrade,
  className = ''
}) => {
  const { language } = useLanguage();
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Restriction-specific translations
  const translations = {
    premium: {
      badge: {
        de: 'Premium',
        en: 'Premium'
      },
      title: {
        de: 'Premium Feature freischalten',
        en: 'Unlock Premium Feature'
      },
      description: {
        de: 'Upgrade auf Premium für den vollen Zugriff',
        en: 'Upgrade to Premium for full access'
      },
      button: {
        de: 'Jetzt upgraden',
        en: 'Upgrade Now'
      },
      previewButton: {
        de: 'Vorschau anzeigen',
        en: 'Show Preview'
      }
    },
    signup: {
      badge: {
        de: 'Registrierung erforderlich',
        en: 'Sign Up Required'
      },
      title: {
        de: 'Kostenlos registrieren',
        en: 'Sign Up Free'
      },
      description: {
        de: 'Erstellen Sie ein kostenloses Konto für den Zugriff',
        en: 'Create a free account to access'
      },
      button: {
        de: 'Kostenlos registrieren',
        en: 'Sign Up Free'
      },
      previewButton: {
        de: 'Demo ansehen',
        en: 'View Demo'
      }
    },
    demo: {
      badge: {
        de: 'Demo-Daten',
        en: 'Demo Data'
      },
      title: {
        de: 'Live-Daten verfügbar',
        en: 'Live Data Available'
      },
      description: {
        de: 'Verbinden Sie Ihr Restaurant für Echtzeit-Daten',
        en: 'Connect your restaurant for real-time data'
      },
      button: {
        de: 'Restaurant verbinden',
        en: 'Connect Restaurant'
      },
      previewButton: {
        de: 'Demo erkunden',
        en: 'Explore Demo'
      }
    },
    'coming-soon': {
      badge: {
        de: 'Bald verfügbar',
        en: 'Coming Soon'
      },
      title: {
        de: 'Feature in Entwicklung',
        en: 'Feature in Development'
      },
      description: {
        de: 'Dieses Feature wird bald verfügbar sein',
        en: 'This feature will be available soon'
      },
      button: {
        de: 'Benachrichtigen',
        en: 'Notify Me'
      },
      previewButton: {
        de: 'Konzept ansehen',
        en: 'View Concept'
      }
    }
  };

  // Get appropriate icon
  const getIcon = () => {
    switch (restrictionType) {
      case 'premium': return <Crown className="w-5 h-5" />;
      case 'signup': return <ArrowRight className="w-5 h-5" />;
      case 'demo': return <Eye className="w-5 h-5" />;
      case 'coming-soon': return <Clock className="w-5 h-5" />;
      default: return <Lock className="w-5 h-5" />;
    }
  };

  // Get blur intensity
  const getBlurClass = () => {
    if (!showPreview) return '';
    switch (blurLevel) {
      case 'light': return 'backdrop-blur-sm';
      case 'medium': return 'backdrop-blur-md';
      case 'heavy': return 'backdrop-blur-lg';
      default: return 'backdrop-blur-md';
    }
  };

  // Get color scheme
  const getColorScheme = () => {
    switch (restrictionType) {
      case 'premium': return {
        bg: 'bg-primary/5',
        border: 'border-primary/20',
        text: 'text-primary',
        badgeBg: 'bg-primary/20'
      };
      case 'signup': return {
        bg: 'bg-success/5',
        border: 'border-success/20',
        text: 'text-success',
        badgeBg: 'bg-success/20'
      };
      case 'demo': return {
        bg: 'bg-warning/5',
        border: 'border-warning/20',
        text: 'text-warning',
        badgeBg: 'bg-warning/20'
      };
      case 'coming-soon': return {
        bg: 'bg-muted/5',
        border: 'border-muted/20',
        text: 'text-muted-foreground',
        badgeBg: 'bg-muted/20'
      };
      default: return {
        bg: 'bg-primary/5',
        border: 'border-primary/20',
        text: 'text-primary',
        badgeBg: 'bg-primary/20'
      };
    }
  };

  const restrictionTexts = translations[restrictionType];
  const colorScheme = getColorScheme();

  const getText = (key: string) => {
    return restrictionTexts[key]?.[language] || key;
  };

  const handleAction = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default actions based on restriction type
      switch (restrictionType) {
        case 'premium':
          window.open('/pricing', '_blank');
          break;
        case 'signup':
          window.open('/signup', '_blank');
          break;
        case 'demo':
          window.open('/connect', '_blank');
          break;
        case 'coming-soon':
          window.open('/notify', '_blank');
          break;
        default:
          window.open('/pricing', '_blank');
      }
    }
  };

  const togglePreview = () => {
    setShowFullPreview(!showFullPreview);
  };

  // If not restricted, render children normally
  if (!isRestricted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} data-restricted="true">
      {/* Background content (blurred or hidden) */}
      <div 
        className={`
          transition-all duration-300
          ${showPreview && showFullPreview ? 'opacity-30' : 'opacity-20'}
          ${showPreview ? 'filter blur-sm' : 'filter blur-md grayscale'}
        `}
        style={{ 
          pointerEvents: 'none',
          position: 'relative',
          zIndex: '1'
        }}
      >
        {children}
      </div>

      {/* Restriction overlay */}
      <div 
        className={`
          absolute inset-0 z-10
          ${colorScheme.bg} ${getBlurClass()}
          flex items-center justify-center
          transition-all duration-300
          ${showFullPreview ? 'bg-opacity-70' : 'bg-opacity-95'}
        `}
      >
        <div className="text-center space-y-4 p-6 max-w-sm">
          {/* Icon */}
          <div className={`
            w-16 h-16 mx-auto rounded-full 
            ${colorScheme.badgeBg} 
            flex items-center justify-center
          `}>
            <div className={colorScheme.text}>
              {getIcon()}
            </div>
          </div>

          {/* Badge */}
          <Badge 
            variant="secondary" 
            className={`${colorScheme.badgeBg} ${colorScheme.text} text-xs`}
          >
            {getText('badge')}
          </Badge>

          {/* Title and Description */}
          <div className="space-y-2">
            <h3 className="headline-md text-foreground">
              {title || getText('title')}
            </h3>
            <p className="body-md text-muted-foreground">
              {description || getText('description')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              onClick={handleAction}
              className="w-full"
              size="sm"
            >
              {getText('button')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {/* Preview toggle (only for premium and demo) */}
            {showPreview && (restrictionType === 'premium' || restrictionType === 'demo') && (
              <Button
                variant="outline"
                size="sm"
                onClick={togglePreview}
                className="w-full text-xs"
              >
                {showFullPreview 
                  ? (language === 'de' ? 'Vorschau ausblenden' : 'Hide Preview')
                  : getText('previewButton')
                }
                <Eye className="w-3 h-3 ml-2" />
              </Button>
            )}
          </div>

          {/* Context-specific CTA */}
          {context !== 'general' && (
            <div className="pt-2">
              <CallToActionBanner
                variant="feature"
                size="sm"
                context={context}
                showIcon={false}
                onAction={handleAction}
              />
            </div>
          )}
        </div>
      </div>

      {/* Gradient overlay for better text readability */}
      <div 
        className={`
          absolute inset-0 z-5
          bg-gradient-to-t from-background/50 to-transparent
          pointer-events-none
        `}
      />
    </div>
  );
};

export default RestrictedWidget;