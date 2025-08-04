import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Megaphone, TrendingUp, Target, Eye, MousePointer, Euro, Users, Mail, Instagram, Facebook, ArrowUp, ArrowDown, ExternalLink, Plus } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { formatNumber, formatCurrency, formatPercentage, getDayNames } from '../utils/formatters';

const MarketingWidget: React.FC = () => {
  const { language } = useLanguage();

  // Widget translations
  const translations = {
    title: {
      de: 'Marketing Performance',
      en: 'Marketing Performance'
    },
    subtitle: {
      de: 'Kampagnen & ROI-Analyse',
      en: 'Campaigns & ROI Analysis'
    },
    totalSpent: {
      de: 'Ausgaben gesamt',
      en: 'Total Spent'
    },
    totalRevenue: {
      de: 'Umsatz generiert',
      en: 'Revenue Generated'
    },
    roas: {
      de: 'ROAS',
      en: 'ROAS'
    },
    ctr: {
      de: 'CTR',
      en: 'CTR'
    },
    impressions: {
      de: 'Impressionen',
      en: 'Impressions'
    },
    clicks: {
      de: 'Klicks',
      en: 'Clicks'
    },
    conversions: {
      de: 'Conversions',
      en: 'Conversions'
    },
    cpc: {
      de: 'CPC',
      en: 'CPC'
    },
    cpa: {
      de: 'CPA',
      en: 'CPA'
    },
    activeCampaigns: {
      de: 'Aktive Kampagnen',
      en: 'Active Campaigns'
    },
    campaignPerformance: {
      de: 'Kampagnen-Performance',
      en: 'Campaign Performance'
    },
    weeklySpend: {
      de: 'Wöchentliche Ausgaben',
      en: 'Weekly Spend'
    },
    channelPerformance: {
      de: 'Kanal-Performance',
      en: 'Channel Performance'
    },
    googleAds: {
      de: 'Google Ads',
      en: 'Google Ads'
    },
    facebookAds: {
      de: 'Facebook Ads',
      en: 'Facebook Ads'
    },
    instagramAds: {
      de: 'Instagram Ads',
      en: 'Instagram Ads'
    },
    emailMarketing: {
      de: 'E-Mail Marketing',
      en: 'Email Marketing'
    },
    seoOptimization: {
      de: 'SEO-Optimierung',
      en: 'SEO Optimization'
    },
    localMarketing: {
      de: 'Lokales Marketing',
      en: 'Local Marketing'
    },
    viewCampaigns: {
      de: 'Kampagnen anzeigen',
      en: 'View Campaigns'
    },
    createCampaign: {
      de: 'Neue Kampagne',
      en: 'Create Campaign'
    },
    excellent: {
      de: 'Ausgezeichnet',
      en: 'Excellent'
    },
    good: {
      de: 'Gut',
      en: 'Good'
    },
    needsImprovement: {
      de: 'Verbesserung nötig',
      en: 'Needs Improvement'
    },
    returnOnAdSpend: {
      de: 'Return on Ad Spend',
      en: 'Return on Ad Spend'
    },
    clickThroughRate: {
      de: 'Klickrate',
      en: 'Click Through Rate'
    },
    costPerClick: {
      de: 'Kosten pro Klick',
      en: 'Cost Per Click'
    },
    costPerAcquisition: {
      de: 'Kosten pro Akquisition',
      en: 'Cost Per Acquisition'
    },
    reachAndImpressions: {
      de: 'Reichweite & Impressionen',
      en: 'Reach & Impressions'
    },
    engagementRate: {
      de: 'Engagement-Rate',
      en: 'Engagement Rate'
    },
    conversionRate: {
      de: 'Conversion-Rate',
      en: 'Conversion Rate'
    },
    adSpend: {
      de: 'Werbeausgaben',
      en: 'Ad Spend'
    },
    revenue: {
      de: 'Umsatz',
      en: 'Revenue'
    },
    budget: {
      de: 'Budget',
      en: 'Budget'
    },
    remaining: {
      de: 'Verbleibend',
      en: 'Remaining'
    },
    spent: {
      de: 'Ausgegeben',
      en: 'Spent'
    },
    status: {
      de: 'Status',
      en: 'Status'
    },
    active: {
      de: 'Aktiv',
      en: 'Active'
    },
    paused: {
      de: 'Pausiert',
      en: 'Paused'
    },
    completed: {
      de: 'Abgeschlossen',
      en: 'Completed'
    },
    socialMedia: {
      de: 'Social Media',
      en: 'Social Media'
    },
    searchEngine: {
      de: 'Suchmaschinen',
      en: 'Search Engine'
    },
    display: {
      de: 'Display',
      en: 'Display'
    },
    retargeting: {
      de: 'Retargeting',
      en: 'Retargeting'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Sample data with localized day names
  const dayNames = getDayNames(language);
  const weeklySpendData = [
    { day: dayNames[1], spend: 145, revenue: 523 }, // Monday
    { day: dayNames[2], spend: 189, revenue: 678 }, // Tuesday
    { day: dayNames[3], spend: 234, revenue: 892 }, // Wednesday
    { day: dayNames[4], spend: 198, revenue: 743 }, // Thursday
    { day: dayNames[5], spend: 267, revenue: 934 }, // Friday
    { day: dayNames[6], spend: 312, revenue: 1247 }, // Saturday
    { day: dayNames[0], spend: 289, revenue: 1089 }  // Sunday
  ];

  const campaigns = [
    {
      name: language === 'de' ? 'Herbst-Menü Promotion' : 'Fall Menu Promotion',
      channel: getText('googleAds'),
      budget: 2500,
      spent: 1847,
      conversions: 89,
      roas: 4.2,
      status: 'active' as const,
      color: '#3b82f6'
    },
    {
      name: language === 'de' ? 'Wochenend-Brunch' : 'Weekend Brunch',
      channel: getText('facebookAds'),
      budget: 1200,
      spent: 978,
      conversions: 34,
      roas: 3.8,
      status: 'active' as const,
      color: '#1877f2'
    },
    {
      name: language === 'de' ? 'Instagram Stories' : 'Instagram Stories',
      channel: getText('instagramAds'),
      budget: 800,
      spent: 645,
      conversions: 28,
      roas: 2.9,
      status: 'paused' as const,
      color: '#e4405f'
    },
    {
      name: language === 'de' ? 'E-Mail Newsletter' : 'Email Newsletter',
      channel: getText('emailMarketing'),
      budget: 300,
      spent: 285,
      conversions: 67,
      roas: 8.1,
      status: 'active' as const,
      color: '#10b981'
    }
  ];

  const channels = [
    {
      name: getText('googleAds'),
      icon: Target,
      spend: 3245,
      revenue: 13678,
      roas: 4.2,
      change: '+18%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      name: getText('facebookAds'),
      icon: Facebook,
      spend: 1890,
      revenue: 7234,
      roas: 3.8,
      change: '+12%',
      positive: true,
      color: 'text-blue-700'
    },
    {
      name: getText('instagramAds'),
      icon: Instagram,
      spend: 1245,
      revenue: 3612,
      roas: 2.9,
      change: '-5%',
      positive: false,
      color: 'text-pink-600'
    },
    {
      name: getText('emailMarketing'),
      icon: Mail,
      spend: 567,
      revenue: 4598,
      roas: 8.1,
      change: '+25%',
      positive: true,
      color: 'text-green-600'
    }
  ];

  const metrics = [
    {
      icon: Euro,
      label: getText('totalSpent'),
      value: formatCurrency(6947, language),
      change: '+15%',
      positive: false,
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      label: getText('totalRevenue'),
      value: formatCurrency(29122, language),
      change: '+23%',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: Target,
      label: getText('roas'),
      value: '4.2x',
      change: '+0.3',
      positive: true,
      color: 'text-purple-600'
    },
    {
      icon: MousePointer,
      label: getText('ctr'),
      value: formatPercentage(3.4, language),
      change: '+0.8%',
      positive: true,
      color: 'text-orange-600'
    }
  ];

  const statusConfig = {
    active: {
      label: getText('active'),
      color: 'text-success',
      bgColor: 'bg-success-light'
    },
    paused: {
      label: getText('paused'),
      color: 'text-warning',
      bgColor: 'bg-warning-light'
    },
    completed: {
      label: getText('completed'),
      color: 'text-neutral',
      bgColor: 'bg-neutral/10'
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="body-md font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'spend' ? getText('adSpend') : getText('revenue')}: {formatCurrency(entry.value, language)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="marketing">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <Megaphone className="icon-md text-primary" />
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
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
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

        {/* Weekly Spend Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="body-md font-medium text-foreground">
              {getText('weeklySpend')}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {getText('adSpend')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {getText('revenue')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySpendData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="spend" 
                  fill="#3b82f6" 
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#10b981" 
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">
            {getText('channelPerformance')}
          </h4>
          
          <div className="space-y-2">
            {channels.map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3">
                  <channel.icon className={`w-4 h-4 ${channel.color}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(channel.spend, language)} → {formatCurrency(channel.revenue, language)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {channel.roas}x
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${
                      channel.positive ? 'text-success' : 'text-error'
                    }`}>
                      {channel.positive ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                      {channel.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="body-md font-medium text-foreground">
              {getText('activeCampaigns')}
            </h4>
            <Badge variant="outline" className="text-xs">
              {formatNumber(campaigns.filter(c => c.status === 'active').length, language)} {getText('active')}
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {campaigns.map((campaign, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {campaign.name}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${statusConfig[campaign.status].bgColor} ${statusConfig[campaign.status].color}`}
                      >
                        {statusConfig[campaign.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{campaign.channel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {campaign.roas}x {getText('roas')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(campaign.conversions, language)} {getText('conversions')}
                    </p>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{getText('budget')}</span>
                    <span className="text-foreground">
                      {formatCurrency(campaign.spent, language)} / {formatCurrency(campaign.budget, language)}
                    </span>
                  </div>
                  <Progress 
                    value={(campaign.spent / campaign.budget) * 100} 
                    className="w-full h-1.5" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROAS Summary */}
        <div className="p-3 bg-accent/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="body-md font-medium text-foreground">
              {getText('returnOnAdSpend')}
            </h4>
            <span className="text-lg font-mono font-bold text-success">4.2x</span>
          </div>
          <Progress value={84} className="w-full mb-2" />
          <p className="text-xs text-muted-foreground">
            {language === 'de' 
              ? 'Ziel: 4.5x - Sehr gute Performance, weiter optimieren!'
              : 'Target: 4.5x - Great performance, keep optimizing!'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <ExternalLink className="w-4 h-4 mr-2" />
            {getText('viewCampaigns')}
          </Button>
          <Button size="sm" className="flex-1 touch-target">
            <Plus className="w-4 h-4 mr-2" />
            {getText('createCampaign')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingWidget;