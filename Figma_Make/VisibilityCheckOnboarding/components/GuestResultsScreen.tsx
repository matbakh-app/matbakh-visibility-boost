import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { 
  ArrowLeft,
  Download,
  Mail,
  UserPlus,
  Crown,
  Star,
  TrendingUp,
  Globe,
  Target,
  BarChart3,
  Gift,
  Sparkles
} from 'lucide-react';
import { GuestCodeInfo } from '../types/app';
import { useI18n } from '../contexts/i18nContext';

interface GuestResultsScreenProps {
  guestCodeInfo: GuestCodeInfo;
  onBack: () => void;
  onCreateAccount: () => void;
  onEmailResults: () => void;
}

export function GuestResultsScreen({ 
  guestCodeInfo, 
  onBack, 
  onCreateAccount, 
  onEmailResults 
}: GuestResultsScreenProps) {
  const { language } = useI18n();

  const texts = {
    de: {
      headerTitle: "Sichtbarkeitsanalyse starten",
      title: "Premium Analyse-Ergebnisse",
      back: "Zurück",
      premiumAccess: "Premium-Zugang aktiviert",
      referredBy: "Empfohlen von",
      overallScore: "Gesamt-Score",
      excellent: "Ausgezeichnet!",
      emailResults: "Ergebnisse per E-Mail senden",
      createAccount: "Account erstellen",
      createAccountDesc: "Speichern Sie Ihre Ergebnisse und erhalten Sie monatliche Updates",
      downloadReport: "PDF-Report herunterladen",
      keyFindings: "Wichtige Erkenntnisse",
      recommendations: "Top Empfehlungen",
      nextSteps: "Nächste Schritte",
      findings: [
        "Ihre Google My Business Präsenz ist sehr stark",
        "Website SEO hat Verbesserungspotential", 
        "Social Media Aktivität könnte gesteigert werden",
        "Online-Bewertungen sind überdurchschnittlich gut"
      ],
      recommendationsList: [
        "Meta-Tags für lokale Suchbegriffe optimieren",
        "Regelmäßige Instagram Posts planen",
        "Aktives Review-Management implementieren"
      ]
    },
    en: {
      headerTitle: "Start Visibility Check",
      title: "Premium Analysis Results",
      back: "Back",
      premiumAccess: "Premium Access Activated",
      referredBy: "Referred by",
      overallScore: "Overall Score",
      excellent: "Excellent!",
      emailResults: "Email Results",
      createAccount: "Create Account",
      createAccountDesc: "Save your results and get monthly updates",
      downloadReport: "Download PDF Report",
      keyFindings: "Key Findings",
      recommendations: "Top Recommendations", 
      nextSteps: "Next Steps",
      findings: [
        "Your Google My Business presence is very strong",
        "Website SEO has improvement potential",
        "Social media activity could be increased", 
        "Online reviews are above average"
      ],
      recommendationsList: [
        "Optimize meta tags for local search terms",
        "Schedule regular Instagram posts",
        "Implement active review management"
      ]
    }
  };

  const t = texts[language];

  // Mock analysis data
  const overallScore = 82;
  const platforms = [
    { name: 'Google My Business', score: 91, icon: Globe },
    { name: 'Website SEO', score: 68, icon: Target },
    { name: 'Social Media', score: 74, icon: Star },
    { name: 'Online Reviews', score: 89, icon: TrendingUp }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 theme-transition">
      {/* Header with Language & Theme Switch */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 theme-transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="btn-hover-enhanced">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.back}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">{t.title}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-success/10 text-success">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
              <LanguageSwitch variant="compact" />
              <ThemeToggle variant="icon-only" size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Premium Access Banner */}
        <Card className="p-6 mb-8 border-success/20 bg-gradient-to-r from-success/5 to-primary/5 card-dark-enhanced">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center">
                <Crown className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-success mb-1">
                  {t.premiumAccess}
                </h3>
                <p className="text-muted-foreground">
                  {t.referredBy} <strong>{guestCodeInfo.referrerName}</strong>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Gift className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">
                    Premium-Features freigeschaltet
                  </span>
                </div>
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-success" />
          </div>
        </Card>

        {/* Overall Score */}
        <Card className="p-8 mb-8 border-success/20 bg-success/5 card-dark-enhanced">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-4">{t.overallScore}</h2>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-6xl font-bold text-success">{overallScore}</span>
              <div className="text-left">
                <div className="text-lg font-semibold text-success">{t.excellent}</div>
                <Progress value={overallScore} className="w-32 h-3" />
              </div>
            </div>
            <p className="text-muted-foreground">
              Ihre Restaurant-Sichtbarkeit liegt deutlich über dem Durchschnitt
            </p>
          </div>
        </Card>

        {/* Platform Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {platforms.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <Card key={index} className="p-6 card-dark-enhanced">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{platform.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${getScoreColor(platform.score)}`}>
                    {platform.score}
                  </span>
                  <Progress value={platform.score} className="flex-1 h-2" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Key Findings */}
        <Card className="p-6 mb-8 card-dark-enhanced">
          <h3 className="text-lg font-semibold mb-4">{t.keyFindings}</h3>
          <div className="space-y-3">
            {t.findings.map((finding, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-primary">{index + 1}</span>
                </div>
                <p className="text-muted-foreground">{finding}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-6 mb-8 card-dark-enhanced">
          <h3 className="text-lg font-semibold mb-4">{t.recommendations}</h3>
          <div className="space-y-4">
            {t.recommendationsList.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                <Target className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={onEmailResults}
              variant="outline"
              className="w-full btn-hover-enhanced"
            >
              <Mail className="w-4 h-4 mr-2" />
              {t.emailResults}
            </Button>
            <Button 
              onClick={() => window.print()}
              variant="outline" 
              className="w-full btn-hover-enhanced"
            >
              <Download className="w-4 h-4 mr-2" />
              {t.downloadReport}
            </Button>
          </div>

          {/* Create Account CTA */}
          <Card className="p-6 border-primary/20 bg-primary/5 card-dark-enhanced">
            <div className="text-center">
              <UserPlus className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t.createAccount}</h3>
              <p className="text-muted-foreground mb-6">
                {t.createAccountDesc}
              </p>
              <Button 
                onClick={onCreateAccount}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground btn-hover-enhanced"
              >
                <Crown className="w-4 h-4 mr-2" />
                {t.createAccount}
              </Button>
            </div>
          </Card>

          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="btn-hover-enhanced"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}