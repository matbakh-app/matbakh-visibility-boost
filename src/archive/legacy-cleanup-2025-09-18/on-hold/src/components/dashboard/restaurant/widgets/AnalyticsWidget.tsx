import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Eye, MousePointer, Clock, ArrowUp, ExternalLink, Download } from 'lucide-react';

const AnalyticsWidget: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  const metrics = [
    {
      icon: Users,
      label: t('totalVisitors', { ns: 'dashboard' }),
      value: '12,847',
      change: '+18%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Eye,
      label: t('pageViews', { ns: 'dashboard' }),
      value: '45,623',
      change: '+23%',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: MousePointer,
      label: t('bounceRate', { ns: 'dashboard' }),
      value: '34.5%',
      change: '-12%',
      positive: true,
      color: 'text-orange-600'
    },
    {
      icon: Clock,
      label: t('avgSessionDuration', { ns: 'dashboard' }),
      value: '3:07',
      change: '+8%',
      positive: true,
      color: 'text-purple-600'
    }
  ];

  return (
    <Card className="h-full flex flex-col" data-widget="analytics">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('websiteAnalytics', { ns: 'dashboard' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('visitorEngagement', { ns: 'dashboard' })}
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {t('excellent', { ns: 'common' })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
                <span className={`text-xs flex items-center gap-1 ${
                  metric.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <ArrowUp className="w-3 h-3" />
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

        {/* Traffic Sources */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            {t('trafficSources', { ns: 'dashboard' })}
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-muted-foreground">Organisch</span>
              </div>
              <span className="text-sm font-medium">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-muted-foreground">Direkt</span>
              </div>
              <span className="text-sm font-medium">28%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm text-muted-foreground">Social Media</span>
              </div>
              <span className="text-sm font-medium">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm text-muted-foreground">Verweise</span>
              </div>
              <span className="text-sm font-medium">9%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('viewDetails', { ns: 'common' })}
          </Button>
          <Button size="sm" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            {t('exportReport', { ns: 'common' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;