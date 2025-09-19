import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Users, TrendingUp, Clock, Heart, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const CulturalInsightsWidget: React.FC = () => {
  const { language } = useLanguage();

  const translations = {
    title: { de: 'Kultur-Insights', en: 'Cultural Insights' },
    subtitle: { de: 'Zielgruppen-Analyse', en: 'Audience Analysis' },
    demographics: { de: 'Demografien', en: 'Demographics' },
    preferences: { de: 'Präferenzen', en: 'Preferences' },
    peakTimes: { de: 'Stoßzeiten', en: 'Peak Times' },
    viewReport: { de: 'Bericht anzeigen', en: 'View Report' },
    good: { de: 'Gut', en: 'Good' }
  };

  const getText = (key: keyof typeof translations) => translations[key][language];

  const insights = [
    {
      category: language === 'de' ? 'Altersgruppen' : 'Age Groups',
      data: ['25-34 (35%)', '35-44 (28%)', '45-54 (22%)']
    },
    {
      category: language === 'de' ? 'Bevorzugte Küche' : 'Preferred Cuisine',
      data: ['Mediterran (42%)', 'Asiatisch (31%)', 'Regional (27%)']
    },
    {
      category: language === 'de' ? 'Besuchszeiten' : 'Visit Times',
      data: ['Abends (45%)', 'Mittags (35%)', 'Wochenende (20%)']
    }
  ];

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="cultural-insights">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <Globe className="icon-md text-primary" />
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
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">{getText('demographics')}</span>
            </div>
            <div>
              <div className="metric-md text-foreground">25-34</div>
              <div className="caption text-muted-foreground">Hauptzielgruppe</div>
            </div>
          </div>

          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-600" />
              <span className="text-xs text-muted-foreground">{getText('preferences')}</span>
            </div>
            <div>
              <div className="metric-md text-foreground">42%</div>
              <div className="caption text-muted-foreground">Mediterran</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">Zielgruppen-Insights</h4>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="space-y-2">
                <p className="text-sm font-medium text-foreground">{insight.category}</p>
                <div className="space-y-1">
                  {insight.data.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.split(' (')[0]}</span>
                      <span className="text-foreground font-medium">{item.split(' (')[1]?.replace(')', '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <ExternalLink className="w-4 h-4 mr-2" />
            {getText('viewReport')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CulturalInsightsWidget;