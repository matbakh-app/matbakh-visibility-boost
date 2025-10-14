import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Eye, ArrowUp, ArrowDown, ExternalLink, MapPin, Clock, Users } from 'lucide-react';

const VisibilityScoreWidget: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  const metrics = [
    {
      icon: Eye,
      label: t('searchViews', { ns: 'dashboard' }),
      value: '2,847',
      change: '+12%',
      positive: true
    },
    {
      icon: MapPin,
      label: t('mapViews', { ns: 'dashboard' }),
      value: '1,523',
      change: '+8%',
      positive: true
    },
    {
      icon: Users,
      label: t('totalActions', { ns: 'dashboard' }),
      value: '456',
      change: '+15%',
      positive: true
    },
    {
      icon: Clock,
      label: t('avgResponseTime', { ns: 'dashboard' }),
      value: '2.4h',
      change: '-20%',
      positive: true
    }
  ];

  const recommendations = [
    t('addPhotos', { ns: 'dashboard' }),
    t('updateHours', { ns: 'dashboard' }),
    t('respondReviews', { ns: 'dashboard' }),
    t('postUpdates', { ns: 'dashboard' })
  ];

  return (
    <Card className="h-full flex flex-col" data-widget="visibility-score">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('visibilityScore', { ns: 'dashboard' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('googleBusinessProfile', { ns: 'dashboard' })}
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {t('excellent', { ns: 'common' })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Main Score Display */}
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="text-6xl font-mono font-bold text-primary">87</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t('currentScore', { ns: 'dashboard' })}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-green-600">
            <ArrowUp className="w-4 h-4" />
            <span className="text-sm font-medium">+5.2% {t('thisWeek', { ns: 'common' })}</span>
          </div>
          
          <Progress value={87} className="w-full max-w-xs mx-auto" />
        </div>

        {/* Key Metrics Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            {t('keyMetrics', { ns: 'dashboard' })}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  <span className={`text-xs flex items-center gap-1 ${
                    metric.positive ? 'text-green-600' : 'text-red-600'
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
                  <div className="text-lg font-semibold text-foreground">{metric.value}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {metric.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Recommendations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            {t('recommendations', { ns: 'dashboard' })}
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
          <Button variant="outline" size="sm" className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('viewDetails', { ns: 'common' })}
          </Button>
          <Button size="sm" className="flex-1">
            {t('optimize', { ns: 'dashboard' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisibilityScoreWidget;