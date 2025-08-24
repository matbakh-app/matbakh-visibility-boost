import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, ArrowUp, ArrowDown, BarChart3, Target, Users, Euro, Clock, ExternalLink, Download } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatNumber, formatCurrency, formatPercentage, getDayNames } from '@/utils/formatters';

const PerformanceTrendsWidget: React.FC = () => {
  const { language } = useLanguage();

  // Widget translations
  const translations = {
    title: {
      de: 'Performance-Trends',
      en: 'Performance Trends'
    },
    subtitle: {
      de: 'KPI-Entwicklung & Prognosen',
      en: 'KPI Development & Forecasts'
    },
    dailyRevenue: {
      de: 'Täglicher Umsatz',
      en: 'Daily Revenue'
    },
    customerSatisfaction: {
      de: 'Kundenzufriedenheit',
      en: 'Customer Satisfaction'
    },
    operationalEfficiency: {
      de: 'Betriebseffizienz',
      en: 'Operational Efficiency'
    },
    operationalEfficiencyExplanation: {
      de: 'Wie reibungslos Ihr Restaurant läuft (Personal, Küche, Service)',
      en: 'How smoothly your restaurant runs (staff, kitchen, service)'
    },
    averageOrderValue: {
      de: 'Durchschnittlicher Bestellwert',
      en: 'Average Order Value'
    },
    averageOrderValueExplanation: {
      de: 'Was ein Gast durchschnittlich pro Besuch ausgibt',
      en: 'What a guest spends on average per visit'
    },
    dailyGuests: {
      de: 'Tägliche Gäste',
      en: 'Daily Guests'
    },
    dailyGuestsExplanation: {
      de: 'Anzahl Gäste, die täglich Ihr Restaurant besuchen',
      en: 'Number of guests visiting your restaurant daily'
    },
    revenuePerGuest: {
      de: 'Umsatz pro Gast',
      en: 'Revenue per Guest'
    },
    tableUtilization: {
      de: 'Tischauslastung',
      en: 'Table Utilization'
    },
    tableUtilizationExplanation: {
      de: 'Wie gut Ihre Tische ausgelastet sind (%)',
      en: 'How well your tables are utilized (%)'
    },
    waitTime: {
      de: 'Wartezeit',
      en: 'Wait Time'
    },
    waitTimeExplanation: {
      de: 'Wie lange Gäste auf einen Tisch warten müssen',
      en: 'How long guests have to wait for a table'
    },
    keyMetrics: {
      de: 'Wichtige Kennzahlen',
      en: 'Key Metrics'
    },
    trendAnalysis: {
      de: 'Trend-Analyse',
      en: 'Trend Analysis'
    },
    weeklyComparison: {
      de: 'Wochenvergleich',
      en: 'Weekly Comparison'
    },
    monthlyGrowth: {
      de: 'Monatliches Wachstum',
      en: 'Monthly Growth'
    },
    yearOverYear: {
      de: 'Jahr-zu-Jahr',
      en: 'Year over Year'
    },
    forecast: {
      de: 'Prognose',
      en: 'Forecast'
    },
    predicted: {
      de: 'Prognostiziert',
      en: 'Predicted'
    },
    actual: {
      de: 'Tatsächlich',
      en: 'Actual'
    },
    target: {
      de: 'Ziel',
      en: 'Target'
    },
    performance: {
      de: 'Performance',
      en: 'Performance'
    },
    insights: {
      de: 'Erkenntnisse',
      en: 'Insights'
    },
    recommendations: {
      de: 'Empfehlungen',
      en: 'Recommendations'
    },
    improving: {
      de: 'Verbesserung',
      en: 'Improving'
    },
    declining: {
      de: 'Rückgang',
      en: 'Declining'
    },
    stable: {
      de: 'Stabil',
      en: 'Stable'
    },
    strongGrowth: {
      de: 'Starkes Wachstum',
      en: 'Strong Growth'
    },
    moderateGrowth: {
      de: 'Moderates Wachstum',
      en: 'Moderate Growth'
    },
    needsAttention: {
      de: 'Aufmerksamkeit erforderlich',
      en: 'Needs Attention'
    },
    minutes: {
      de: 'Min',
      en: 'min'
    },
    vs: {
      de: 'vs',
      en: 'vs'
    },
    lastPeriod: {
      de: 'Vorperiode',
      en: 'Last Period'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Sample data with localized day names
  const dayNames = getDayNames(language);
  const trendData = [
    { 
      day: dayNames[1], 
      revenue: 2840, 
      guests: 94, 
      satisfaction: 4.3,
      efficiency: 87,
      target: 3000,
      predicted: 2950
    },
    { 
      day: dayNames[2], 
      revenue: 3120, 
      guests: 108, 
      satisfaction: 4.5,
      efficiency: 89,
      target: 3000,
      predicted: 3100
    },
    { 
      day: dayNames[3], 
      revenue: 3450, 
      guests: 125, 
      satisfaction: 4.4,
      efficiency: 91,
      target: 3000,
      predicted: 3400
    },
    { 
      day: dayNames[4], 
      revenue: 3280, 
      guests: 118, 
      satisfaction: 4.6,
      efficiency: 88,
      target: 3000,
      predicted: 3350
    },
    { 
      day: dayNames[5], 
      revenue: 4150, 
      guests: 156, 
      satisfaction: 4.7,
      efficiency: 93,
      target: 3000,
      predicted: 4200
    },
    { 
      day: dayNames[6], 
      revenue: 4780, 
      guests: 189, 
      satisfaction: 4.8,
      efficiency: 95,
      target: 3000,
      predicted: 4850
    },
    { 
      day: dayNames[0], 
      revenue: 4230, 
      guests: 167, 
      satisfaction: 4.6,
      efficiency: 92,
      target: 3000,
      predicted: 4300
    }
  ];

  const metrics = [
    {
      icon: Euro,
      label: getText('dailyRevenue'),
      value: formatCurrency(3694, language),
      change: '+18.5%',
      trend: 'up',
      color: 'text-green-600',
      status: getText('strongGrowth')
    },
    {
      icon: Users,
      label: getText('dailyGuests'),
      value: formatNumber(137, language),
      change: '+12.3%',
      trend: 'up',
      color: 'text-blue-600',
      status: getText('improving')
    },
    {
      icon: Target,
      label: getText('customerSatisfaction'),
      value: '4.6/5',
      change: '+0.2',
      trend: 'up',
      color: 'text-purple-600',
      status: language === 'de' ? 'Exzellent' : 'Excellent'
    },
    {
      icon: BarChart3,
      label: getText('operationalEfficiency'),
      value: formatPercentage(90.7, language, 1),
      change: '+3.2%',
      trend: 'up',
      color: 'text-orange-600',
      status: getText('improving')
    }
  ];

  const insights = [
    {
      type: 'positive',
      title: language === 'de' ? 'Wochenendperformance' : 'Weekend Performance',
      description: language === 'de' 
        ? 'Umsatz am Wochenende 45% über dem Wochendurchschnitt'
        : 'Weekend revenue 45% above weekday average',
      impact: '+€2,340'
    },
    {
      type: 'attention',
      title: language === 'de' ? 'Wartezeiten' : 'Wait Times',
      description: language === 'de'
        ? 'Durchschnittliche Wartezeit gestiegen auf 18 Minuten'
        : 'Average wait time increased to 18 minutes',
      impact: '-0.2★'
    },
    {
      type: 'opportunity',
      title: language === 'de' ? 'Mittagsgeschäft' : 'Lunch Business',
      description: language === 'de'
        ? 'Potenzial für 25% mehr Umsatz zwischen 12-14 Uhr'
        : 'Potential for 25% more revenue between 12-2 PM',
      impact: '+€890'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="body-md font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            let displayValue = entry.value;
            if (entry.dataKey === 'revenue' || entry.dataKey === 'target' || entry.dataKey === 'predicted') {
              displayValue = formatCurrency(entry.value, language);
            } else if (entry.dataKey === 'guests') {
              displayValue = `${formatNumber(entry.value, language)} ${getText('dailyGuests').toLowerCase()}`;
            } else if (entry.dataKey === 'satisfaction') {
              displayValue = `${entry.value}/5`;
            } else if (entry.dataKey === 'efficiency') {
              displayValue = formatPercentage(entry.value, language, 0);
            }
            
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {displayValue}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-l-success bg-success-light';
      case 'attention': return 'border-l-warning bg-warning-light';
      case 'opportunity': return 'border-l-primary bg-primary/10';
      default: return 'border-l-muted bg-muted/10';
    }
  };

  return (
    <Card className="widget-card h-full flex flex-col shadow-lg" data-widget="performance-trends" style={{ padding: '24px' }}>
      <CardHeader className="pb-4 px-0">
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
          <Badge variant="secondary" className="bg-success-light text-success shadow-sm">
            {getText('strongGrowth')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-8 px-0">
        {/* Key Metrics Grid - Full Width 16px Grid */}
        <div className="grid grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-accent/30 rounded-lg shadow-sm p-4 space-y-3 min-h-[128px]">
              <div className="flex items-center justify-between">
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                <span className={`text-xs flex items-center gap-1 font-medium ${
                  metric.trend === 'up' ? 'text-success' : 'text-error'
                }`}>
                  {metric.trend === 'up' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {metric.change}
                </span>
              </div>
              <div>
                <div className="metric-md text-foreground mb-1">{metric.value}</div>
                <div className="caption text-muted-foreground line-clamp-2 mb-2">
                  {metric.label}
                </div>
                {/* KPI Explanations for restaurant owners */}
                {metric.label === getText('dailyGuests') && (
                  <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {getText('dailyGuestsExplanation')}
                  </div>
                )}
                {metric.label === getText('operationalEfficiency') && (
                  <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {getText('operationalEfficiencyExplanation')}
                  </div>
                )}
                <div className="text-xs text-success font-medium">
                  {metric.status}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Analysis Section - Side by Side Layout */}
        <div className="grid grid-cols-3 gap-6">
          {/* Trend Chart - Takes 2/3 width */}
          <div className="col-span-2 space-y-4 bg-card/50 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="body-md font-medium text-foreground">
                {getText('trendAnalysis')}
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-xs text-muted-foreground">
                    {getText('actual')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-xs text-muted-foreground">
                    {getText('target')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-xs text-muted-foreground">
                    {getText('predicted')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                    name={getText('actual')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={getText('target')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                    name={getText('predicted')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats Summary - Takes 1/3 width */}
          <div className="space-y-4">
            <div className="bg-card/50 rounded-lg p-4 shadow-sm">
              <h4 className="body-md font-medium text-foreground mb-4">
                {getText('performance')}
              </h4>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="metric-lg text-success">+23%</div>
                  <div className="caption text-muted-foreground">{getText('weeklyComparison')}</div>
                </div>
                <div className="text-center">
                  <div className="metric-lg text-primary">+18%</div>
                  <div className="caption text-muted-foreground">{getText('monthlyGrowth')}</div>
                </div>
                <div className="text-center">
                  <div className="metric-lg text-purple-600">+34%</div>
                  <div className="caption text-muted-foreground">{getText('yearOverYear')}</div>
                </div>
              </div>
            </div>

            {/* Additional KPIs */}
            <div className="space-y-3">
              <div className="bg-card/80 rounded-lg p-3 shadow-sm">
                <div className="text-sm font-medium text-foreground">{getText('averageOrderValue')}</div>
                <div className="text-lg font-medium text-primary">{formatCurrency(26.90, language)}</div>
                <div className="text-xs text-success">+5% vs. last week</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getText('averageOrderValueExplanation')}
                </div>
              </div>
              
              <div className="bg-card/80 rounded-lg p-3 shadow-sm">
                <div className="text-sm font-medium text-foreground">{getText('tableUtilization')}</div>
                <div className="text-lg font-medium text-primary">87%</div>
                <div className="text-xs text-success">+3% vs. last week</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getText('tableUtilizationExplanation')}
                </div>
              </div>
              
              <div className="bg-card/80 rounded-lg p-3 shadow-sm">
                <div className="text-sm font-medium text-foreground">{getText('waitTime')}</div>
                <div className="text-lg font-medium text-warning">18 {getText('minutes')}</div>
                <div className="text-xs text-error">+2 min vs. target</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getText('waitTimeExplanation')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights - Full Width */}
        <div className="space-y-4 bg-card/50 rounded-lg p-4 shadow-sm">
          <h4 className="body-md font-medium text-foreground">
            {getText('insights')}
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className={`border-l-4 p-4 rounded-r-lg shadow-sm ${getInsightColor(insight.type)}`}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {insight.title}
                    </p>
                    <Badge variant="outline" className="text-xs shadow-sm">
                      {insight.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons - Full Width with 16px Grid */}
        <div className="flex gap-4 pt-4">
          <Button variant="outline" size="sm" className="flex-1 touch-target h-10 shadow-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            {language === 'de' ? 'Details' : 'Details'}
          </Button>
          <Button size="sm" className="flex-1 touch-target h-10 shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            {language === 'de' ? 'Berichte' : 'Reports'}
          </Button>
          <Button variant="secondary" size="sm" className="touch-target h-10 px-6 shadow-sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            {language === 'de' ? 'Analyse' : 'Analysis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceTrendsWidget;