import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Eye, ArrowUp, ArrowDown, ExternalLink, MapPin, Clock, Users } from 'lucide-react';
// Simplified hook
const useLanguage = () => ({ language: 'de' as const });

const VisibilityScoreWidget: React.FC = () => {
  const { language } = useLanguage();

  // Widget translations
  const translations = {
    title: {
      de: 'Sichtbarkeits-Score',
      en: 'Visibility Score'
    },
    subtitle: {
      de: 'Google Business Profil Performance',
      en: 'Google Business Profile Performance'
    },
    currentScore: {
      de: 'Aktueller Score',
      en: 'Current Score'
    },
    trend: {
      de: 'Trend',
      en: 'Trend'
    },
    weeklyChange: {
      de: '+5.2% diese Woche',
      en: '+5.2% this week'
    },
    improvement: {
      de: 'Verbesserung',
      en: 'Improvement'
    },
    excellent: {
      de: 'Ausgezeichnet',
      en: 'Excellent'
    },
    viewDetails: {
      de: 'Details anzeigen',
      en: 'View Details'
    },
    optimize: {
      de: 'Optimieren',
      en: 'Optimize'
    },
    metricsTitle: {
      de: 'Wichtige Metriken',
      en: 'Key Metrics'
    },
    searchViews: {
      de: 'Suchanfragen',
      en: 'Search Views'
    },
    mapViews: {
      de: 'Kartenansichten',
      en: 'Map Views'
    },
    totalActions: {
      de: 'Aktionen gesamt',
      en: 'Total Actions'
    },
    avgResponseTime: {
      de: 'Ø Antwortzeit',
      en: 'Avg Response Time'
    },
    hours: {
      de: 'Std',
      en: 'hrs'
    },
    recommendations: {
      de: 'Empfehlungen',
      en: 'Recommendations'
    },
    addPhotos: {
      de: 'Neue Fotos hinzufügen',
      en: 'Add new photos'
    },
    updateHours: {
      de: 'Öffnungszeiten aktualisieren',
      en: 'Update business hours'
    },
    respondReviews: {
      de: 'Auf Bewertungen antworten',
      en: 'Respond to reviews'
    },
    postUpdates: {
      de: 'Regelmäßige Updates posten',
      en: 'Post regular updates'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  const metrics = [
    {
      icon: Eye,
      label: getText('searchViews'),
      value: '2,847',
      change: '+12%',
      positive: true
    },
    {
      icon: MapPin,
      label: getText('mapViews'),
      value: '1,523',
      change: '+8%',
      positive: true
    },
    {
      icon: Users,
      label: getText('totalActions'),
      value: '456',
      change: '+15%',
      positive: true
    },
    {
      icon: Clock,
      label: getText('avgResponseTime'),
      value: `2.4 ${getText('hours')}`,
      change: '-20%',
      positive: true
    }
  ];

  const recommendations = [
    getText('addPhotos'),
    getText('updateHours'),
    getText('respondReviews'),
    getText('postUpdates')
  ];

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="visibility-score">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <TrendingUp className="icon-md text-primary" />
              {getText('title')}
            </CardTitle>
            <p className="caption text-muted-foreground">
              {getText('subtitle')}
            </p>
          </div>
          <Badge variant="secondary" className="bg-success-light text-success">
            {getText('excellent')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Main Score Display */}
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="text-6xl font-mono font-bold text-primary">87</div>
            <div className="text-sm text-muted-foreground mt-1">
              {getText('currentScore')}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-success">
            <ArrowUp className="w-4 h-4" />
            <span className="body-md font-medium">{getText('weeklyChange')}</span>
          </div>
          
          <Progress value={87} className="w-full max-w-xs mx-auto" />
        </div>

        {/* Key Metrics Grid */}
        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">
            {getText('metricsTitle')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  <span className={`text-xs flex items-center gap-1 ${
                    metric.positive ? 'text-success' : 'text-error'
                  }`}>
                    {metric.positive ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {metric.change}
                  </span>
                </div>
                <div>
                  <div className="metric-md text-foreground">{metric.value}</div>
                  <div className="caption text-muted-foreground line-clamp-1">
                    {metric.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Recommendations */}
        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">
            {getText('recommendations')}
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <ExternalLink className="w-4 h-4 mr-2" />
            {getText('viewDetails')}
          </Button>
          <Button size="sm" className="flex-1 touch-target">
            {getText('optimize')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisibilityScoreWidget;