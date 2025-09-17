import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { 
  Target, 
  Zap, 
  BarChart3,
  PlayCircle,
  TrendingUp
} from 'lucide-react';
import { GuestCodeInfo } from '@/types/app';
import { useI18n } from '@/contexts/i18nContext';

interface GuestLandingPageProps {
  onCodeValidated: (codeInfo: GuestCodeInfo) => void;
  onContinueWithoutCode: () => void;
  onLogin: () => void;
}

export function GuestLandingPage({ onCodeValidated, onContinueWithoutCode, onLogin }: GuestLandingPageProps) {
  const { language } = useI18n();

  const texts = {
    de: {
      headerTitle: "Sichtbarkeitsanalyse starten",
      heroTitle: "Restaurant Sichtbarkeits-Analyse", 
      heroSubtitle: "Entdecken Sie Ihre Online-Präsenz mit KI-gestützter Analyse",
      
      // Free Analysis Widget
      freeAnalysisTitle: "Kostenlose Sichtbarkeitsanalyse starten",
      freeAnalysisSubtitle: "Basis-Analyse mit eingeschränkten Features",
      feature1Title: "Basis-Analyse",
      feature1Desc: "Grundlegende Sichtbarkeits-Überprüfung Ihrer wichtigsten Plattformen",
      feature2Title: "Schnelle Insights",
      feature2Desc: "Sofortige Ergebnisse zu Ihrer digitalen Präsenz",
      feature3Title: "Erste Empfehlungen", 
      feature3Desc: "Grundlegende Optimierungsvorschläge für bessere Sichtbarkeit",
      freeAnalysisButton: "Basis-Analyse starten",
      freeAnalysisInfo: "Kostenlos • Keine Registrierung erforderlich • 3-5 Minuten"
    },
    en: {
      headerTitle: "Start Visibility Check",
      heroTitle: "Restaurant Visibility Analysis",
      heroSubtitle: "Discover your online presence with AI-powered analysis", 
      
      // Free Analysis Widget
      freeAnalysisTitle: "Start Free Visibility Analysis",
      freeAnalysisSubtitle: "Basic analysis with limited features",
      feature1Title: "Basic Analysis",
      feature1Desc: "Essential visibility check of your main platforms",
      feature2Title: "Quick Insights",
      feature2Desc: "Instant results about your digital presence",
      feature3Title: "Initial Recommendations",
      feature3Desc: "Basic optimization suggestions for better visibility",
      freeAnalysisButton: "Start Basic Analysis", 
      freeAnalysisInfo: "Free • No registration required • 3-5 minutes"
    }
  };

  const currentTexts = texts[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 theme-transition">
      {/* Header with Language & Theme Switch */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">{currentTexts.headerTitle}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <LanguageSwitch variant="compact" />
              <ThemeToggle variant="icon-only" size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            {currentTexts.heroTitle}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {currentTexts.heroSubtitle}
          </p>
        </div>

        {/* Single Widget - Kostenlose Sichtbarkeitsanalyse */}
        <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-success/5 card-dark-enhanced max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{currentTexts.freeAnalysisTitle}</h2>
            <p className="text-muted-foreground">
              {currentTexts.freeAnalysisSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{currentTexts.feature1Title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentTexts.feature1Desc}
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">{currentTexts.feature2Title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentTexts.feature2Desc}
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">{currentTexts.feature3Title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentTexts.feature3Desc}
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              onClick={onContinueWithoutCode}
              size="lg"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 btn-hover-enhanced text-lg font-semibold"
            >
              <Zap className="w-5 h-5 mr-2" />
              {currentTexts.freeAnalysisButton}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              {currentTexts.freeAnalysisInfo}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}