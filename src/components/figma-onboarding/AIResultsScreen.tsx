import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LanguageSwitch } from './LanguageSwitch';
import { ThemeToggle } from './ThemeToggle';
import { 
  ArrowLeft,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Star,
  Globe,
  MapPin,
  Users,
  BarChart3,
  Target,
  Zap,
  Crown
} from 'lucide-react';
import { UserPlan } from '../types/app';
import { useI18n } from '../contexts/i18nContext';

interface AIResultsScreenProps {
  userPlan: UserPlan;
  onBack: () => void;
  onUpgrade: () => void;
  onScheduleNext: () => void;
}

export function AIResultsScreen({ userPlan, onBack, onUpgrade, onScheduleNext }: AIResultsScreenProps) {
  const { language } = useI18n();
  const [selectedTab, setSelectedTab] = useState('overview');

  const texts = {
    de: {
      headerTitle: "Sichtbarkeitsanalyse starten",
      title: "Analyse-Ergebnisse",
      back: "Zurück",
      downloadReport: "PDF-Report herunterladen",
      scheduleNext: "Nächste Analyse planen",
      upgrade: "Auf Premium upgraden",
      overallScore: "Gesamt-Score",
      lastUpdated: "Zuletzt aktualisiert",
      tabs: {
        overview: "Überblick",
        platforms: "Plattformen", 
        competitors: "Wettbewerber",
        recommendations: "Empfehlungen"
      },
      metrics: {
        visibility: "Sichtbarkeit",
        engagement: "Engagement",
        reach: "Reichweite",
        reviews: "Bewertungen"
      },
      platforms: {
        google: "Google My Business",
        facebook: "Facebook",
        instagram: "Instagram",
        website: "Website SEO"
      },
      status: {
        excellent: "Ausgezeichnet",
        good: "Gut", 
        needsWork: "Verbesserungsbedarf",
        critical: "Kritisch"
      }
    },
    en: {
      headerTitle: "Start Visibility Check",
      title: "Analysis Results",
      back: "Back",
      downloadReport: "Download PDF Report",
      scheduleNext: "Schedule Next Analysis",
      upgrade: "Upgrade to Premium",
      overallScore: "Overall Score",
      lastUpdated: "Last updated",
      tabs: {
        overview: "Overview",
        platforms: "Platforms",
        competitors: "Competitors", 
        recommendations: "Recommendations"
      },
      metrics: {
        visibility: "Visibility",
        engagement: "Engagement",
        reach: "Reach",
        reviews: "Reviews"
      },
      platforms: {
        google: "Google My Business",
        facebook: "Facebook",
        instagram: "Instagram",
        website: "Website SEO"
      },
      status: {
        excellent: "Excellent",
        good: "Good",
        needsWork: "Needs Work", 
        critical: "Critical"
      }
    }
  };

  const t = texts[language];

  // Mock data
  const overallScore = 78;
  const scoreChange = 12;
  const lastUpdated = new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');

  const platforms = [
    { name: t.platforms.google, score: 85, status: 'excellent', icon: Globe },
    { name: t.platforms.facebook, score: 72, status: 'good', icon: Users },
    { name: t.platforms.instagram, score: 65, status: 'needsWork', icon: Star },
    { name: t.platforms.website, score: 45, status: 'critical', icon: BarChart3 }
  ];

  const metrics = [
    { name: t.metrics.visibility, value: 78, change: 12, icon: Target },
    { name: t.metrics.engagement, value: 65, change: -3, icon: Users },
    { name: t.metrics.reach, value: 82, change: 8, icon: TrendingUp },
    { name: t.metrics.reviews, value: 91, change: 5, icon: Star }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success/10 border-success/20';
    if (score >= 60) return 'bg-warning/10 border-warning/20';
    return 'bg-error/10 border-error/20';
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
              {userPlan === 'premium' && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              <LanguageSwitch variant="compact" />
              <ThemeToggle variant="icon-only" size="sm" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Restaurant Sichtbarkeits-Analyse</h2>
              <p className="text-muted-foreground">
                {t.lastUpdated}: {lastUpdated}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="btn-hover-enhanced">
                <Download className="w-4 h-4 mr-2" />
                {t.downloadReport}
              </Button>
              <Button variant="outline" onClick={onScheduleNext} className="btn-hover-enhanced">
                <Calendar className="w-4 h-4 mr-2" />
                {t.scheduleNext}
              </Button>
              {userPlan !== 'premium' && (
                <Button onClick={onUpgrade} className="btn-hover-enhanced">
                  <Crown className="w-4 h-4 mr-2" />
                  {t.upgrade}
                </Button>
              )}
            </div>
          </div>

          {/* Overall Score Card */}
          <Card className={`p-6 ${getScoreBg(overallScore)} card-dark-enhanced`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.overallScore}</h3>
                <div className="flex items-center gap-4">
                  <span className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}
                  </span>
                  <div className="flex items-center gap-1">
                    {scoreChange > 0 ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-error" />
                    )}
                    <span className={scoreChange > 0 ? 'text-success' : 'text-error'}>
                      {scoreChange > 0 ? '+' : ''}{scoreChange}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <Progress value={overallScore} className="w-32 h-3 mb-2" />
                <p className="text-sm text-muted-foreground">von 100 Punkten</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="p-6 card-dark-enhanced">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                  <div className="flex items-center gap-1">
                    {metric.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-error" />
                    )}
                    <span className={`text-sm ${metric.change > 0 ? 'text-success' : 'text-error'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{metric.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getScoreColor(metric.value)}`}>
                    {metric.value}
                  </span>
                  <Progress value={metric.value} className="flex-1 h-2" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Platform Breakdown */}
        <Card className="p-6 card-dark-enhanced">
          <h3 className="text-lg font-semibold mb-6">Platform Breakdown</h3>
          <div className="space-y-4">
            {platforms.map((platform, index) => {
              const Icon = platform.icon;
              return (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{platform.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t.status[platform.status as keyof typeof t.status]}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Progress value={platform.score} className="w-24 h-2" />
                    <span className={`text-lg font-semibold ${getScoreColor(platform.score)} min-w-[3rem] text-right`}>
                      {platform.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recommendations Section */}
        <Card className="p-6 mt-8 card-dark-enhanced">
          <h3 className="text-lg font-semibold mb-6">Top Empfehlungen</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Google My Business optimieren</h4>
                <p className="text-sm text-muted-foreground">
                  Vervollständigen Sie Ihr Google My Business Profil mit aktuellen Öffnungszeiten und Fotos.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-warning/5 rounded-lg border border-warning/20">
              <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-warning" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Website SEO verbessern</h4>
                <p className="text-sm text-muted-foreground">
                  Lokale Keywords in Meta-Tags und Content integrieren für bessere Auffindbarkeit.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-success/5 rounded-lg border border-success/20">
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-success" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Review-Management aktivieren</h4>
                <p className="text-sm text-muted-foreground">
                  Bitten Sie zufriedene Kunden aktiv um Bewertungen auf Google und Facebook.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          <Button onClick={onBack} variant="outline" className="btn-hover-enhanced">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
          <Button onClick={onScheduleNext} className="btn-hover-enhanced">
            <Calendar className="w-4 h-4 mr-2" />
            {t.scheduleNext}
          </Button>
          {userPlan !== 'premium' && (
            <Button onClick={onUpgrade} className="btn-hover-enhanced">
              <Zap className="w-4 h-4 mr-2" />
              {t.upgrade}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}