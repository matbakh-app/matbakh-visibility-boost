import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Megaphone, Target, Users, Euro, ArrowUp, ArrowDown, ExternalLink, Plus } from 'lucide-react';

const MarketingWidget: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  const campaigns = [
    {
      name: 'Herbst-Menü Promotion',
      platform: 'Google Ads',
      status: 'active',
      budget: '€450',
      spent: '€287',
      clicks: 1247,
      conversions: 23,
      roi: '+180%',
      progress: 64
    },
    {
      name: 'Instagram Stories',
      platform: 'Meta Ads',
      status: 'active',
      budget: '€200',
      spent: '€156',
      clicks: 892,
      conversions: 18,
      roi: '+145%',
      progress: 78
    },
    {
      name: 'Wochenend-Special',
      platform: 'Facebook',
      status: 'paused',
      budget: '€300',
      spent: '€89',
      clicks: 456,
      conversions: 8,
      roi: '+95%',
      progress: 30
    }
  ];

  const metrics = [
    {
      icon: Target,
      label: t('totalReach', { ns: 'dashboard' }),
      value: '45,623',
      change: '+23%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Users,
      label: t('engagement', { ns: 'dashboard' }),
      value: '8.4%',
      change: '+12%',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: Euro,
      label: t('adSpend', { ns: 'dashboard' }),
      value: '€532',
      change: '+5%',
      positive: false,
      color: 'text-orange-600'
    },
    {
      icon: Target,
      label: t('avgCPC', { ns: 'dashboard' }),
      value: '€0.42',
      change: '-8%',
      positive: true,
      color: 'text-purple-600'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>;
      case 'paused':
        return <Badge variant="secondary">Pausiert</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col" data-widget="marketing">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {t('marketingCampaigns', { ns: 'dashboard' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('adPerformance', { ns: 'dashboard' })}
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newCampaign', { ns: 'dashboard' })}
          </Button>
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

        {/* Active Campaigns */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              {t('activeCampaigns', { ns: 'dashboard' })}
            </h4>
            <Button variant="ghost" size="sm" className="text-xs">
              {t('viewAll', { ns: 'common' })}
            </Button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {campaigns.map((campaign, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-3 hover:bg-accent/10 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.platform}
                    </p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">{campaign.spent} / {campaign.budget}</span>
                  </div>
                  <Progress value={campaign.progress} className="h-1.5" />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-foreground">{campaign.clicks}</div>
                    <div className="text-muted-foreground">Klicks</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-foreground">{campaign.conversions}</div>
                    <div className="text-muted-foreground">Conversions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">{campaign.roi}</div>
                    <div className="text-muted-foreground">ROI</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-accent/20 rounded-lg">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">+34%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('monthlyROI', { ns: 'dashboard' })}
            </p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">+18%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('conversionRate', { ns: 'dashboard' })}
            </p>
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

export default MarketingWidget;