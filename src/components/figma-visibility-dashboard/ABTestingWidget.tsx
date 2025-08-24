import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Beaker, TrendingUp, Target, Users, ArrowUp, ArrowDown, Play, Pause, Plus } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatNumber, formatPercentage } from '@/utils/formatters';

const ABTestingWidget: React.FC = () => {
  const { language } = useLanguage();

  const translations = {
    title: { de: 'A/B Testing', en: 'A/B Testing' },
    subtitle: { de: 'Experimentierung & Optimierung', en: 'Experimentation & Optimization' },
    activeTests: { de: 'Aktive Tests', en: 'Active Tests' },
    conversionRate: { de: 'Conversion Rate', en: 'Conversion Rate' },
    participants: { de: 'Teilnehmer', en: 'Participants' },
    confidence: { de: 'Konfidenz', en: 'Confidence' },
    variant: { de: 'Variante', en: 'Variant' },
    control: { de: 'Kontrolle', en: 'Control' },
    running: { de: 'Läuft', en: 'Running' },
    paused: { de: 'Pausiert', en: 'Paused' },
    completed: { de: 'Abgeschlossen', en: 'Completed' },
    createTest: { de: 'Test erstellen', en: 'Create Test' },
    viewResults: { de: 'Ergebnisse anzeigen', en: 'View Results' },
    good: { de: 'Gut', en: 'Good' }
  };

  const getText = (key: keyof typeof translations) => translations[key][language];

  const tests = [
    {
      name: language === 'de' ? 'Menü-Layout Test' : 'Menu Layout Test',
      status: 'running' as const,
      participants: 1250,
      controlRate: 12.4,
      variantRate: 15.8,
      confidence: 95,
      improvement: 27.4
    },
    {
      name: language === 'de' ? 'Reservierungs-Button' : 'Booking Button',
      status: 'completed' as const,
      participants: 890,
      controlRate: 8.2,
      variantRate: 11.6,
      confidence: 98,
      improvement: 41.5
    },
    {
      name: language === 'de' ? 'Preis-Darstellung' : 'Price Display',
      status: 'paused' as const,
      participants: 445,
      controlRate: 6.8,
      variantRate: 7.1,
      confidence: 68,
      improvement: 4.4
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-success-light text-success';
      case 'completed': return 'bg-primary/10 text-primary';
      case 'paused': return 'bg-warning-light text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return Play;
      case 'paused': return Pause;
      default: return Target;
    }
  };

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="ab-testing">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <Beaker className="icon-md text-primary" />
              {getText('title')}
            </CardTitle>
            <p className="caption text-muted-foreground">{getText('subtitle')}</p>
          </div>
          <Badge variant="secondary" className="bg-success-light text-success">
            {getText('good')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Beaker className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-success">+2</span>
            </div>
            <div>
              <div className="metric-md text-foreground">3</div>
              <div className="caption text-muted-foreground">{getText('activeTests')}</div>
            </div>
          </div>

          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-success">+23%</span>
            </div>
            <div>
              <div className="metric-md text-foreground">15.8%</div>
              <div className="caption text-muted-foreground">{getText('conversionRate')}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">Laufende Tests</h4>
          <div className="space-y-3">
            {tests.map((test, index) => {
              const StatusIcon = getStatusIcon(test.status);
              return (
                <div key={index} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground">{test.name}</p>
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(test.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {getText(test.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(test.participants, language)} {getText('participants')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {test.improvement > 0 ? '+' : ''}{formatPercentage(test.improvement, language, 1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPercentage(test.confidence, language, 0)} {getText('confidence')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground">{getText('control')}</span>
                        <span className="text-foreground font-medium">
                          {formatPercentage(test.controlRate, language, 1)}
                        </span>
                      </div>
                      <Progress value={test.controlRate * 5} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-muted-foreground">{getText('variant')}</span>
                        <span className="text-foreground font-medium">
                          {formatPercentage(test.variantRate, language, 1)}
                        </span>
                      </div>
                      <Progress value={test.variantRate * 5} className="h-1.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <Target className="w-4 h-4 mr-2" />
            {getText('viewResults')}
          </Button>
          <Button size="sm" className="flex-1 touch-target">
            <Plus className="w-4 h-4 mr-2" />
            {getText('createTest')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ABTestingWidget;