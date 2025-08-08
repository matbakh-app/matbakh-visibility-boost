import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import AnalyticsWidget from './AnalyticsWidget';
import ReviewsWidget from './ReviewsWidget';
import VisibilityScoreWidget from './VisibilityScoreWidget';

function DashboardApp() {
  const { language } = useLanguage();

  // Main content translations
  const mainTexts = {
    title: {
      de: 'Visibility Dashboard',
      en: 'Visibility Dashboard'
    },
    subtitle: {
      de: 'Überblick über Ihre Restaurant-Sichtbarkeit',
      en: 'Overview of your restaurant visibility'
    },
    demoMode: {
      de: 'Demo-Modus',
      en: 'Demo Mode'
    }
  };

  const getText = (key: keyof typeof mainTexts) => {
    return mainTexts[key][language];
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {getText('title')}
                </h1>
                <p className="text-muted-foreground">
                  {getText('subtitle')}
                </p>
              </div>
              <Badge variant="secondary">
                {getText('demoMode')}
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">4.6</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Durchschnittsbewertung' : 'Avg Rating'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">87%</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Sichtbarkeit' : 'Visibility'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-chart-2">142</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Aufrufe heute' : 'Views Today'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-warning">€3.2K</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Potentieller Umsatz' : 'Potential Revenue'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <VisibilityScoreWidget />
            </div>
            
            <div className="lg:col-span-1">
              <ReviewsWidget />
            </div>
            
            <div className="lg:col-span-1 xl:col-span-1">
              <AnalyticsWidget />
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default DashboardApp;