import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { LanguageSwitch } from './LanguageSwitch';
import { 
  Bot, 
  Brain, 
  BarChart3, 
  CheckCircle, 
  Loader, 
  Sparkles,
  Zap,
  Search,
  Globe,
  Target,
  TrendingUp,
  X
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

interface PipelineStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'completed';
  estimatedTime: number; // in seconds
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
  const [elapsedTime, setElapsedTime] = useState(0);

  // Real text values based on language - CORRECTED: Direct text values instead of i18n keys
  const texts = {
    de: {
      headerTitle: "Visibility Check",
      title: "KI-Analyse läuft",
      subtitle: "Ihre Sichtbarkeits-Analyse wird erstellt",
      analyzing: "Analysiere Ihre Daten",
      step: "Schritt",
      of: "von",
      remaining: "Verbleibend",
      elapsed: "Vergangen",
      running: "Läuft",
      pipelineTitle: "Analyse-Pipeline",
      cancel: "Analyse abbrechen",
      cancelNote: "Die Analyse kann jederzeit abgebrochen werden",
      infoTitle: "Analyse-Informationen",
      plan: "Plan",
      usage: "Nutzung",
      priority: "Priorität",
      type: "Typ",
      high: "Hoch",
      normal: "Normal",
      fullAnalysis: "Vollständige Analyse",
      // Pipeline steps
      stepInitTitle: "System initialisieren",
      stepInitDesc: "Vorbereitung der Analyse-Umgebung und KI-Module",
      stepCollectionTitle: "Daten sammeln",
      stepCollectionDesc: "Erfassung von Restaurant-Informationen und Online-Präsenz",
      stepPlatformsTitle: "Plattformen analysieren", 
      stepPlatformsDesc: "Überprüfung von Google, Social Media und Review-Plattformen",
      stepAiTitle: "KI-Verarbeitung",
      stepAiDesc: "Intelligente Analyse und Mustererkennung durch Machine Learning",
      stepRecommendationsTitle: "Empfehlungen generieren",
      stepRecommendationsDesc: "Erstellung personalisierter Optimierungsvorschläge",
      stepFinalTitle: "Report finalisieren",
      stepFinalDesc: "Zusammenstellung der Ergebnisse und PDF-Generierung",
      // Plan names
      planBasic: "Basic Plan - 1 Analyse täglich",
      planBusiness: "Business Plan - 3 Analysen täglich", 
      planPremium: "Premium Plan - Unbegrenzte Analysen"
    },
    en: {
      headerTitle: "Visibility Check",
      title: "AI Analysis in Progress",
      subtitle: "Your visibility analysis is being created",
      analyzing: "Analyzing your data",
      step: "Step",
      of: "of",
      remaining: "Remaining",
      elapsed: "Elapsed",
      running: "Running",
      pipelineTitle: "Analysis Pipeline",
      cancel: "Cancel analysis",
      cancelNote: "The analysis can be cancelled at any time",
      infoTitle: "Analysis Information",
      plan: "Plan", 
      usage: "Usage",
      priority: "Priority",
      type: "Type",
      high: "High",
      normal: "Normal",
      fullAnalysis: "Full Analysis",
      // Pipeline steps
      stepInitTitle: "Initialize system",
      stepInitDesc: "Preparing analysis environment and AI modules",
      stepCollectionTitle: "Collect data",
      stepCollectionDesc: "Gathering restaurant information and online presence",
      stepPlatformsTitle: "Analyze platforms",
      stepPlatformsDesc: "Checking Google, social media and review platforms",
      stepAiTitle: "AI processing",
      stepAiDesc: "Intelligent analysis and pattern recognition through machine learning",
      stepRecommendationsTitle: "Generate recommendations",
      stepRecommendationsDesc: "Creating personalized optimization suggestions",
      stepFinalTitle: "Finalize report",
      stepFinalDesc: "Compiling results and generating PDF report",
      // Plan names
      planBasic: "Basic Plan - 1 analysis daily",
      planBusiness: "Business Plan - 3 analyses daily",
      planPremium: "Premium Plan - Unlimited analyses"
    }
  };

  const t = texts[language];

  const [steps, setSteps] = useState<PipelineStep[]>([
    {
      id: 'initialization',
      titleKey: 'stepInitTitle',
      descriptionKey: 'stepInitDesc',
      icon: <Bot className="w-5 h-5" />,
      status: 'pending',
      estimatedTime: 3
    },
    {
      id: 'data-collection',
      titleKey: 'stepCollectionTitle',
      descriptionKey: 'stepCollectionDesc',
      icon: <Search className="w-5 h-5" />,
      status: 'pending',
      estimatedTime: 15
    },
    {
      id: 'platform-analysis',
      titleKey: 'stepPlatformsTitle',
      descriptionKey: 'stepPlatformsDesc',
      icon: <Globe className="w-5 h-5" />,
      status: 'pending',
      estimatedTime: 20
    },
    {
      id: 'ai-processing',
      titleKey: 'stepAiTitle',
      descriptionKey: 'stepAiDesc',
      icon: <Brain className="w-5 h-5" />,
      status: 'pending',
      estimatedTime: 25
    },
    {
      id: 'recommendations',
      titleKey: 'stepRecommendationsTitle',
      descriptionKey: 'stepRecommendationsDesc',
      icon: <Target className="w-5 h-5" />,
      status: 'pending',
      estimatedTime: 12
    },
    {
      id: 'finalization',
      titleKey: 'stepFinalTitle',
      descriptionKey: 'stepFinalDesc',
      icon: <TrendingUp className="w-5 h-5" />,
      status: 'pending',
      estimatedTime: 5
    }
  ]);

  const totalEstimatedTime = steps.reduce((acc, step) => acc + step.estimatedTime, 0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        
        // Calculate progress based on elapsed time
        const progressPercentage = Math.min((newTime / totalEstimatedTime) * 100, 95);
        setProgress(progressPercentage);

        // Update current step
        let cumulativeTime = 0;
        let newCurrentStep = 0;
        
        for (let i = 0; i < steps.length; i++) {
          cumulativeTime += steps[i].estimatedTime;
          if (newTime <= cumulativeTime) {
            newCurrentStep = i;
            break;
          }
        }
        
        setCurrentStep(newCurrentStep);

        // Update step statuses
        setSteps(prevSteps => 
          prevSteps.map((step, index) => ({
            ...step,
            status: index < newCurrentStep ? 'completed' : 
                   index === newCurrentStep ? 'running' : 'pending'
          }))
        );

        // Complete after total estimated time + buffer
        if (newTime >= totalEstimatedTime + 2) {
          setProgress(100);
          setTimeout(() => {
            onComplete();
          }, 1000);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onComplete, totalEstimatedTime]);

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(totalEstimatedTime - elapsedTime, 0);

  const getPlanName = () => {
    switch (userPlan) {
      case 'premium': return t.planPremium;
      case 'business': return t.planBusiness;
      default: return t.planBasic;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Header with Language Switch - uses global LanguageSwitch */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">{t.headerTitle}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onCancel} size="sm">
                <X className="w-4 h-4 mr-2" />
                {t.cancel}
              </Button>
              <LanguageSwitch variant="compact" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Loading Card */}
        <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-success/5">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
              <Sparkles className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 animate-pulse bg-primary/10 rounded-2xl" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t.subtitle}
            </p>
          </div>

          {/* Progress Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <h3 className="font-semibold text-lg">{t.analyzing}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.step} {currentStep + 1} {t.of} {steps.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
                <div className="text-sm text-muted-foreground">
                  {t.remaining}: {formatTime(remainingTime)}
                </div>
              </div>
            </div>
            
            <Progress value={progress} className="h-3 mb-2" />
            <div className="text-xs text-muted-foreground text-center">
              {t.elapsed}: {formatTime(elapsedTime)} / {formatTime(totalEstimatedTime)}
            </div>
          </div>

          {/* Current Step Highlight */}
          {currentStep < steps.length && (
            <Card className="p-6 mb-6 border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  {steps[currentStep].icon}
                  <Loader className="w-3 h-3 animate-spin absolute ml-8 -mt-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-primary mb-1">
                    {t[steps[currentStep].titleKey as keyof typeof t]}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t[steps[currentStep].descriptionKey as keyof typeof t]}
                  </p>
                </div>
                <div className="text-sm text-primary font-medium">
                  {t.running}...
                </div>
              </div>
            </Card>
          )}

          {/* Pipeline Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold mb-4">{t.pipelineTitle}</h4>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  step.status === 'completed' 
                    ? 'bg-success/10 border border-success/20' 
                    : step.status === 'running'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  step.status === 'completed' 
                    ? 'bg-success/20 text-success' 
                    : step.status === 'running'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : step.status === 'running' ? (
                    <div className="relative">
                      {step.icon}
                      <Loader className="w-3 h-3 animate-spin absolute -top-1 -right-1" />
                    </div>
                  ) : (
                    step.icon
                  )}
                </div>
                
                <div className="flex-1">
                  <h5 className={`font-medium ${
                    step.status === 'completed' ? 'text-success' :
                    step.status === 'running' ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {t[step.titleKey as keyof typeof t]}
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    {t[step.descriptionKey as keyof typeof t]}
                  </p>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {step.estimatedTime}s
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Bot className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{t.infoTitle}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>{t.plan}:</strong> {getPlanName()}
              </div>
              <div>
                <strong>{t.usage}:</strong> {usedAnalyses}/{totalAnalyses === 'unlimited' ? '∞' : totalAnalyses}
              </div>
              <div>
                <strong>{t.priority}:</strong> {userPlan === 'premium' ? t.high : t.normal}
              </div>
              <div>
                <strong>{t.type}:</strong> {t.fullAnalysis}
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="mt-8 text-center">
            <Button variant="outline" onClick={onCancel} size="lg">
              <X className="w-4 h-4 mr-2" />
              {t.cancel}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {t.cancelNote}
            </p>
          </div>
        </Card>

        {/* Development Info - CLEANED: Real text implementation */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="p-4 bg-muted/50 border-dashed mt-6">
            <div className="text-center text-sm text-muted-foreground">
              🌐 <strong>Echte Texte implementiert:</strong> Keine i18n-Keys mehr • Real-time Progress • DE/EN Sprachwechsel
            </div>
            <div className="grid grid-cols-4 gap-4 mt-3 text-xs">
              <div>Progress: {Math.round(progress)}%</div>
              <div>Step: {currentStep + 1}/{steps.length}</div>
              <div>Time: {formatTime(elapsedTime)}</div>
              <div>Sprache: {language === 'de' ? 'DE 🇩🇪' : 'EN 🇺🇸'}</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}