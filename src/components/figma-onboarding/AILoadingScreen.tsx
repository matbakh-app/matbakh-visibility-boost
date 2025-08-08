import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { 
  Bot, 
  Zap, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  BarChart3,
  Globe,
  Target,
  TrendingUp,
  Search,
  Sparkles,
  Crown
} from 'lucide-react';
import { UserPlan } from '../types/app';
import { useI18n } from '../contexts/i18nContext';

interface AILoadingScreenProps {
  isVisible: boolean;
  onComplete: () => void;
  onCancel: () => void;
  userPlan: UserPlan;
  usedAnalyses: number;
  totalAnalyses: number | 'unlimited';
}

export function AILoadingScreen({ 
  isVisible, 
  onComplete, 
  onCancel, 
  userPlan,
  usedAnalyses,
  totalAnalyses 
}: AILoadingScreenProps) {
  const { language } = useI18n();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const texts = {
    de: {
      headerTitle: "Sichtbarkeitsanalyse starten",
      title: "KI-Analyse läuft",
      subtitle: "Ihre Restaurant-Sichtbarkeit wird analysiert",
      cancel: "Abbrechen",
      complete: "Analyse abgeschlossen",
      viewResults: "Ergebnisse anzeigen",
      estimatedTime: "Geschätzte Zeit: 3-5 Minuten",
      priority: "Priority-Verarbeitung",
      standardQueue: "Standard-Warteschlange",
      steps: [
        "Sammle Restaurant-Daten...",
        "Analysiere Online-Präsenz...",
        "Überprüfe Sichtbarkeit auf Plattformen...",
        "Vergleiche mit Wettbewerbern...",
        "Generiere Empfehlungen...",
        "Erstelle PDF-Report..."
      ]
    },
    en: {
      headerTitle: "Start Visibility Check",
      title: "AI Analysis Running",
      subtitle: "Your restaurant visibility is being analyzed",
      cancel: "Cancel",
      complete: "Analysis completed",
      viewResults: "View Results",
      estimatedTime: "Estimated time: 3-5 minutes",
      priority: "Priority Processing",
      standardQueue: "Standard Queue",
      steps: [
        "Collecting restaurant data...",
        "Analyzing online presence...",
        "Checking platform visibility...",
        "Comparing with competitors...",
        "Generating recommendations...",
        "Creating PDF report..."
      ]
    }
  };

  const t = texts[language];

  useEffect(() => {
    if (!isVisible) return;

    const duration = 12000; // 12 seconds total
    const stepDuration = duration / t.steps.length;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100));
        
        // Update current step based on progress
        const newStep = Math.floor((newProgress / 100) * t.steps.length);
        setCurrentStep(Math.min(newStep, t.steps.length - 1));
        
        if (newProgress >= 100) {
          setIsComplete(true);
          clearInterval(interval);
          
          // Auto-complete after showing 100% for a moment
          setTimeout(() => {
            onComplete();
          }, 1500);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, onComplete, t.steps.length]);

  if (!isVisible) return null;

  const isPremium = userPlan === 'premium';
  const isGuest = totalAnalyses === 'unlimited'; // Guest users get premium experience

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 theme-transition">
      {/* Header with Language & Theme Switch */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onCancel} className="btn-hover-enhanced">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.cancel}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">{t.title}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {(isPremium || isGuest) && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Crown className="w-3 h-3 mr-1" />
                  {t.priority}
                </Badge>
              )}
              <LanguageSwitch variant="compact" />
              <ThemeToggle variant="icon-only" size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="w-full max-w-2xl">
          {/* Main Loading Card */}
          <Card className="p-8 card-dark-enhanced">
            <div className="text-center mb-8">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Bot className={`w-10 h-10 text-primary ${!isComplete ? 'animate-pulse' : ''}`} />
                </div>
                {!isComplete && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center animate-spin">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
                {isComplete && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                {isComplete ? t.complete : t.title}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t.subtitle}
              </p>

              {/* Priority Badge */}
              {(isPremium || isGuest) && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Crown className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">{t.priority}</span>
                </div>
              )}
              
              {/* Progress Bar */}
              <div className="mb-6">
                <Progress value={progress} className="h-3 mb-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{Math.round(progress)}%</span>
                  <span>{t.estimatedTime}</span>
                </div>
              </div>
            </div>

            {/* Current Step */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {isComplete ? t.complete : t.steps[currentStep]}
                  </p>
                  {!isComplete && (
                    <p className="text-sm text-muted-foreground">
                      Schritt {currentStep + 1} von {t.steps.length}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Globe className="w-5 h-5 text-primary" />
                <span className="text-sm">Online-Präsenz Analyse</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Target className="w-5 h-5 text-success" />
                <span className="text-sm">Wettbewerber-Vergleich</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-warning" />
                <span className="text-sm">Optimierungs-Tipps</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Search className="w-5 h-5 text-error" />
                <span className="text-sm">Sichtbarkeits-Score</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {isComplete ? (
                <Button 
                  onClick={onComplete}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground btn-hover-enhanced"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t.viewResults}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={onCancel}
                  className="btn-hover-enhanced"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t.cancel}
                </Button>
              )}
            </div>
          </Card>

          {/* Usage Info */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 rounded-lg border theme-transition">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {totalAnalyses === 'unlimited' 
                  ? 'Unlimited analyses' 
                  : `${usedAnalyses + 1}/${totalAnalyses} analyses used this month`
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}