import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitch from '@/components/LanguageSwitch';

interface OnboardingLayoutProps {
  currentStep?: string;
  totalSteps?: number;
  onBack?: () => void;
  onHome?: () => void;
}

const STEP_ORDER = ['welcome', 'restaurant', 'brand', 'menu', 'channels', 'quickwins', 'baseline', 'done'];

export default function OnboardingLayout({ 
  currentStep = 'welcome',
  totalSteps = 7,
  onBack,
  onHome 
}: OnboardingLayoutProps) {
  const { t } = useTranslation(['onboarding', 'common']);
  
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
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
          {currentStep !== 'done' && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Schritt {Math.max(1, currentStepIndex)} von {totalSteps}</span>
                <span>{Math.round(progressPercentage)}% abgeschlossen</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
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