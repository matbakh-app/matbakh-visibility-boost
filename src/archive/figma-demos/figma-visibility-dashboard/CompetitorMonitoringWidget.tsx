import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Star, Users, ArrowUp, ArrowDown, Eye, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatNumber, formatCurrency } from '@/utils/formatters';

const CompetitorMonitoringWidget: React.FC = () => {
  const { language } = useLanguage();

  const translations = {
    title: { de: 'Konkurrenz-Monitoring', en: 'Competitor Monitoring' },
    subtitle: { de: 'Marktpositionierung & Benchmarks', en: 'Market Position & Benchmarks' },
    marketShare: { de: 'Marktanteil', en: 'Market Share' },
    avgRating: { de: 'Ø Bewertung', en: 'Avg Rating' },
    priceIndex: { de: 'Preis-Index', en: 'Price Index' },
    visibility: { de: 'Sichtbarkeit', en: 'Visibility' },
    viewDetails: { de: 'Details anzeigen', en: 'View Details' },
    excellent: { de: 'Ausgezeichnet', en: 'Excellent' }
  };

  const getText = (key: keyof typeof translations) => translations[key][language];

  const competitors = [
    { name: 'Restaurant Alpha', rating: 4.2, reviews: 890, priceLevel: '€€€', marketShare: 15 },
    { name: 'Bistro Beta', rating: 4.6, reviews: 1240, priceLevel: '€€', marketShare: 22 },
    { name: 'Café Gamma', rating: 4.1, reviews: 560, priceLevel: '€', marketShare: 8 }
  ];

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="competitor-monitoring">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <Target className="icon-md text-primary" />
              {getText('title')}
            </CardTitle>
            <p className="caption text-muted-foreground">{getText('subtitle')}</p>
          </div>
          <Badge variant="secondary" className="bg-success-light text-success">
            {getText('excellent')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-success flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                +5%
              </span>
            </div>
            <div>
              <div className="metric-md text-foreground">28%</div>
              <div className="caption text-muted-foreground">{getText('marketShare')}</div>
            </div>
          </div>

          <div className="bg-accent/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-success">4.6/5</span>
            </div>
            <div>
              <div className="metric-md text-foreground">#1</div>
              <div className="caption text-muted-foreground">{getText('avgRating')}</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">Hauptkonkurrenten</h4>
          <div className="space-y-2">
            {competitors.map((comp, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20">
                <div>
                  <p className="text-sm font-medium text-foreground">{comp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {comp.rating}★ • {formatNumber(comp.reviews, language)} {language === 'de' ? 'Bewertungen' : 'reviews'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{comp.priceLevel}</p>
                  <p className="text-xs text-muted-foreground">{comp.marketShare}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <Eye className="w-4 h-4 mr-2" />
            {getText('viewDetails')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitorMonitoringWidget;