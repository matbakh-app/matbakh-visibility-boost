import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { ChevronRight, ChevronLeft, X, Lightbulb, Target, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  category: 'new-feature' | 'improvement' | 'tip';
  isOptional?: boolean;
  actionButton?: {
    label: string;
    action: () => void;
  };
}

interface TourContextType {
  startTour: (tourId: string) => void;
  skipTour: (tourId: string) => void;
  completeTour: (tourId: string) => void;
  isActive: boolean;
  currentStep: number;
}

const TourContext = createContext<TourContextType | null>(null);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

const BUSINESS_INTELLIGENCE_TOUR: TourStep[] = [
  {
    id: 'welcome',
    target: '',
    title: '🎉 Neue Business Intelligence Features',
    description: 'Entdecke die neuen erweiterten Analyse-Tools für dein Restaurant. Diese Tour zeigt dir die wichtigsten Features.',
    position: 'center',
    category: 'new-feature'
  },
  {
    id: 'competitor-monitoring',
    target: '[data-widget="competitor-monitoring"]',
    title: 'Wettbewerber-Analyse',
    description: 'Behalte deine Konkurrenz im Blick. Vergleiche Bewertungen, Preise und Performance in Echtzeit.',
    icon: Target,
    position: 'top',
    category: 'new-feature',
    actionButton: {
      label: 'Widget erkunden',
      action: () => {
        document.querySelector('[data-widget="competitor-monitoring"]')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }
    }
  },
  {
    id: 'performance-trends',
    target: '[data-widget="performance-trends"]',
    title: 'Performance-Trends',
    description: 'Analysiere deine wichtigsten KPIs mit interaktiven Charts und strategischen Insights.',
    icon: TrendingUp,
    position: 'top',
    category: 'new-feature'
  },
  {
    id: 'cultural-insights',
    target: '[data-widget="cultural-insights"]',
    title: 'Kulturdimensionen-Analyse',
    description: 'Verstehe deine Zielgruppe besser mit Hofstede-Kulturanalyse und demografischen Insights.',
    icon: Users,
    position: 'top',
    category: 'new-feature'
  },
  {
    id: 'ab-testing',
    target: '[data-widget="ab-testing"]',
    title: 'A/B Test Performance',
    description: 'Optimiere deine Conversion-Rate mit datengestützten A/B Tests.',
    icon: BarChart3,
    position: 'left',
    category: 'new-feature'
  },
  {
    id: 'mobile-optimization',
    target: '',
    title: '📱 Mobile-Optimierung',
    description: 'Alle neuen Features sind vollständig für Mobile und Tablet optimiert. Horizontal-Scroll, Touch-Navigation und mehr.',
    position: 'center',
    category: 'improvement'
  },
  {
    id: 'settings-panel',
    target: '[data-tour="settings-button"]',
    title: 'Erweiterte Einstellungen',
    description: 'Personalisiere dein Dashboard. Widgets ein-/ausblenden, Aktualisierungsintervalle anpassen und mehr.',
    icon: Lightbulb,
    position: 'bottom',
    category: 'tip',
    isOptional: true
  }
];

interface FeatureTourProps {
  children: React.ReactNode;
}

const FeatureTour: React.FC<FeatureTourProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTour, setCurrentTour] = useState<TourStep[]>([]);
  const [completedTours, setCompletedTours] = useState<string[]>([]);
  const [skippedTours, setSkippedTours] = useState<string[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [spotlightPosition, setSpotlightPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Load tour state from localStorage
  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem('completed-tours') || '[]');
    const skipped = JSON.parse(localStorage.getItem('skipped-tours') || '[]');
    setCompletedTours(completed);
    setSkippedTours(skipped);

    // Show welcome message for new users
    const hasSeenWelcome = localStorage.getItem('tour-welcome-seen');
    if (!hasSeenWelcome && !completed.includes('business-intelligence')) {
      setShowWelcome(true);
    }
  }, []);

  // Auto-start tour for new features
  useEffect(() => {
    const shouldStartTour = !completedTours.includes('business-intelligence') && 
                          !skippedTours.includes('business-intelligence') &&
                          showWelcome;
    
    if (shouldStartTour) {
      // Wait for DOM to be ready
      setTimeout(() => {
        startTour('business-intelligence');
      }, 2000);
    }
  }, [showWelcome, completedTours, skippedTours]);

  // Update spotlight position when step changes
  useEffect(() => {
    if (isActive && currentTour.length > 0) {
      const step = currentTour[currentStep];
      if (step?.target) {
        updateSpotlight(step.target);
      }
    }
  }, [currentStep, isActive]);

  const startTour = (tourId: string) => {
    if (tourId === 'business-intelligence') {
      setCurrentTour(BUSINESS_INTELLIGENCE_TOUR);
    }
    
    setCurrentStep(0);
    setIsActive(true);
    setShowWelcome(false);
    localStorage.setItem('tour-welcome-seen', 'true');
    
    // Track tour start
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Tour Started', { tourId });
    }
  };

  const skipTour = (tourId: string) => {
    const newSkipped = [...skippedTours, tourId];
    setSkippedTours(newSkipped);
    localStorage.setItem('skipped-tours', JSON.stringify(newSkipped));
    setIsActive(false);
    setShowWelcome(false);
    
    // Track tour skip
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Tour Skipped', { tourId, step: currentStep });
    }
  };

  const completeTour = (tourId: string) => {
    const newCompleted = [...completedTours, tourId];
    setCompletedTours(newCompleted);
    localStorage.setItem('completed-tours', JSON.stringify(newCompleted));
    setIsActive(false);
    
    // Track tour completion
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('Tour Completed', { tourId, totalSteps: currentTour.length });
    }
  };

  const nextStep = () => {
    if (currentStep < currentTour.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour('business-intelligence');
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateSpotlight = (target: string) => {
    const element = document.querySelector(target);
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      setSpotlightPosition({
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2)
      });

      // Scroll element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const getTooltipPosition = (position: TourStep['position']) => {
    const step = currentTour[currentStep];
    if (!step) return {};

    if (position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001
      };
    }

    // Position relative to spotlight
    const base = {
      position: 'absolute' as const,
      zIndex: 10001
    };

    switch (position) {
      case 'top':
        return {
          ...base,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '16px'
        };
      case 'bottom':
        return {
          ...base,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '16px'
        };
      case 'left':
        return {
          ...base,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '16px'
        };
      case 'right':
        return {
          ...base,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '16px'
        };
      default:
        return base;
    }
  };

  if (showWelcome && !isActive) {
    return (
      <>
        {children}
        <div className="fixed inset-0 bg-black/50 z-10000 flex items-center justify-center p-4">
          <Card className="max-w-md bg-card border-border">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h2 className="headline-lg text-foreground mb-2">
                  Neue Features entdecken
                </h2>
                <p className="body-md text-muted-foreground">
                  Wir haben neue Business Intelligence Features für dich entwickelt. 
                  Möchtest du eine kurze Tour machen?
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => startTour('business-intelligence')}
                  className="flex-1"
                >
                  Tour starten (2 Min)
                </Button>
                <Button
                  onClick={() => skipTour('business-intelligence')}
                  variant="outline"
                  className="flex-1"
                >
                  Später
                </Button>
              </div>

              <p className="caption text-muted-foreground">
                Du kannst die Tour jederzeit über die Einstellungen starten
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!isActive || currentTour.length === 0) {
    return (
      <TourContext.Provider value={{
        startTour,
        skipTour,
        completeTour,
        isActive,
        currentStep
      }}>
        {children}
      </TourContext.Provider>
    );
  }

  const step = currentTour[currentStep];
  const progress = ((currentStep + 1) / currentTour.length) * 100;

  return (
    <TourContext.Provider value={{
      startTour,
      skipTour,
      completeTour,
      isActive,
      currentStep
    }}>
      {children}
      
      {/* Tour Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-10000"
        style={{ pointerEvents: 'none' }}
      >
        {/* Spotlight */}
        {step.target && (
          <div
            className="absolute border-2 border-primary rounded-lg shadow-2xl pointer-events-auto"
            style={{
              left: spotlightPosition.x,
              top: spotlightPosition.y,
              width: spotlightPosition.width,
              height: spotlightPosition.height,
              boxShadow: `0 0 0 4px rgba(79, 70, 229, 0.3), 
                         0 0 0 9999px rgba(0, 0, 0, 0.5)`
            }}
          >
            {/* Tooltip */}
            <div
              className="w-80 max-w-sm"
              style={getTooltipPosition(step.position)}
            >
              <Card className="bg-card border-border shadow-2xl">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {step.icon && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <step.icon className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <Badge
                        variant={step.category === 'new-feature' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {step.category === 'new-feature' ? '✨ Neu' :
                         step.category === 'improvement' ? '⚡ Verbessert' :
                         '💡 Tipp'}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipTour('business-intelligence')}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="headline-md text-foreground">
                      {step.title}
                    </h3>
                    <p className="body-md text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  {step.actionButton && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={step.actionButton.action}
                        className="w-full"
                      >
                        {step.actionButton.label}
                      </Button>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Schritt {currentStep + 1} von {currentTour.length}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Zurück</span>
                    </Button>

                    <div className="flex space-x-2">
                      {step.isOptional && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={nextStep}
                        >
                          Überspringen
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        onClick={nextStep}
                        className="flex items-center space-x-1"
                      >
                        <span>
                          {currentStep === currentTour.length - 1 ? 'Fertig' : 'Weiter'}
                        </span>
                        {currentStep !== currentTour.length - 1 && (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Center modal for non-targeted steps */}
        {!step.target && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Card className="max-w-md bg-card border-border">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  {step.icon ? (
                    <step.icon className="w-8 h-8 text-primary" />
                  ) : (
                    <Lightbulb className="w-8 h-8 text-primary" />
                  )}
                </div>
                
                <div>
                  <h2 className="headline-lg text-foreground mb-2">
                    {step.title}
                  </h2>
                  <p className="body-md text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Schritt {currentStep + 1} von {currentTour.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Zurück
                  </Button>

                  <Button onClick={nextStep}>
                    {currentStep === currentTour.length - 1 ? 'Tour beenden' : 'Weiter'}
                    {currentStep !== currentTour.length - 1 && (
                      <ChevronRight className="w-4 h-4 ml-1" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TourContext.Provider>
  );
};

export default FeatureTour;