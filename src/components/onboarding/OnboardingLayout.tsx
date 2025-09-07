import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitch from '@/components/LanguageSwitch';

interface OnboardingLayoutProps {
  onBack?: () => void;
  onHome?: () => void;
}

const STEP_ORDER = [
  { path: '/onboarding', name: 'welcome', title: 'Willkommen' },
  { path: '/onboarding/restaurant', name: 'restaurant', title: 'Restaurant' },
  { path: '/onboarding/brand', name: 'brand', title: 'Marke' },
  { path: '/onboarding/menu', name: 'menu', title: 'Menü' },
  { path: '/onboarding/channels', name: 'channels', title: 'Kanäle' },
  { path: '/onboarding/quickwins', name: 'quickwins', title: 'Quick Wins' },
  { path: '/onboarding/baseline', name: 'baseline', title: 'Analyse' },
  { path: '/onboarding/done', name: 'done', title: 'Fertig' }
];

export default function OnboardingLayout({ 
  onBack,
  onHome 
}: OnboardingLayoutProps) {
  const { t } = useTranslation(['onboarding', 'common']);
  const location = useLocation();
  
  // Determine current step from URL
  const currentStepIndex = STEP_ORDER.findIndex(step => step.path === location.pathname);
  const currentStep = currentStepIndex >= 0 ? STEP_ORDER[currentStepIndex] : STEP_ORDER[0];
  const totalSteps = STEP_ORDER.length - 1; // Exclude 'done' from count
  const displayStepIndex = Math.max(1, currentStepIndex + 1);
  const progressPercentage = Math.max(0, Math.min(100, (currentStepIndex / (totalSteps - 1)) * 100));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && currentStepIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold">matbakh</h1>
                  <p className="text-xs text-muted-foreground">Restaurant Setup</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {onHome && (
                <Button variant="ghost" size="sm" onClick={onHome}>
                  <Home className="w-4 h-4" />
                </Button>
              )}
              <LanguageSwitch />
              <ThemeToggle />
            </div>
          </div>
          
          {/* Progress Bar */}
          {currentStep.name !== 'done' && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Schritt {displayStepIndex} von {totalSteps}</span>
                <span>{Math.round(progressPercentage)}% abgeschlossen</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              
              {/* Step Navigation */}
              <div className="flex items-center justify-center mt-3 space-x-2">
                {STEP_ORDER.slice(0, -1).map((step, index) => (
                  <div
                    key={step.name}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index < currentStepIndex
                        ? 'bg-primary'
                        : index === currentStepIndex
                        ? 'bg-primary/60'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              © 2025 matbakh.app - Restaurant Digital Presence
            </div>
            <div className="flex items-center space-x-4">
              <a href="/legal/datenschutz" className="hover:text-foreground">
                Datenschutz
              </a>
              <a href="/legal/impressum" className="hover:text-foreground">
                Impressum
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}