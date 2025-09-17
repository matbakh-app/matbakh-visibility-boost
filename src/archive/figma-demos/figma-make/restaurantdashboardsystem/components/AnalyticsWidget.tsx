import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Users, Eye, MousePointer, Clock, ArrowUp, ArrowDown, ExternalLink, Download } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { formatNumber, formatPercentage, formatDuration, getDayNames } from '../utils/formatters';

const AnalyticsWidget: React.FC = () => {
  const { language } = useLanguage();

  // Widget translations
  const translations = {
    title: {
      de: 'Website Analytics',
      en: 'Website Analytics'
    },
    subtitle: {
      de: 'Besucher- und Engagement-Metriken',
      en: 'Visitor and Engagement Metrics'
    },
    totalVisitors: {
      de: 'Besucher gesamt',
      en: 'Total Visitors'
    },
    pageViews: {
      de: 'Seitenaufrufe',
      en: 'Page Views'
    },
    bounceRate: {
      de: 'Absprungrate',
      en: 'Bounce Rate'
    },
    avgSessionDuration: {
      de: 'Ø Sitzungsdauer',
      en: 'Avg Session Duration'
    },
    conversionRate: {
      de: 'Conversion Rate',
      en: 'Conversion Rate'
    },
    organicTraffic: {
      de: 'Organischer Traffic',
      en: 'Organic Traffic'
    },
    directTraffic: {
      de: 'Direkter Traffic',
      en: 'Direct Traffic'
    },
    socialTraffic: {
      de: 'Social Media Traffic',
      en: 'Social Media Traffic'
    },
    referralTraffic: {
      de: 'Verweis-Traffic',
      en: 'Referral Traffic'
    },
    weeklyTrend: {
      de: '7-Tage-Trend',
      en: '7-Day Trend'
    },
    trafficSources: {
      de: 'Traffic-Quellen',
      en: 'Traffic Sources'
    },
    topPages: {
      de: 'Top Seiten',
      en: 'Top Pages'
    },
    viewDetails: {
      de: 'Details anzeigen',
      en: 'View Details'
    },
    exportReport: {
      de: 'Report exportieren',
      en: 'Export Report'
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
    increase: {
      de: 'Steigerung',
      en: 'Increase'
    },
    decrease: {
      de: 'Rückgang',
      en: 'Decrease'
    },
    visitors: {
      de: 'Besucher',
      en: 'Visitors'
    },
    pages: {
      de: 'Seiten',
      en: 'Pages'
    },
    home: {
      de: 'Startseite',
      en: 'Home'
    },
    menu: {
      de: 'Speisekarte',
      en: 'Menu'
    },
    about: {
      de: 'Über uns',
      en: 'About'
    },
    contact: {
      de: 'Kontakt',
      en: 'Contact'
    },
    reservations: {
      de: 'Reservierungen',
      en: 'Reservations'
    },
    thisWeek: {
      de: 'Diese Woche',
      en: 'This Week'
    },
    lastWeek: {
      de: 'Letzte Woche',
      en: 'Last Week'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Sample data with localized day names
  const dayNames = getDayNames(language);
  const weeklyData = [
    { day: dayNames[1], visitors: 245, pageViews: 856 }, // Monday
    { day: dayNames[2], visitors: 289, pageViews: 978 }, // Tuesday
    { day: dayNames[3], visitors: 356, pageViews: 1204 }, // Wednesday
    { day: dayNames[4], visitors: 334, pageViews: 1156 }, // Thursday
    { day: dayNames[5], visitors: 412, pageViews: 1489 }, // Friday
    { day: dayNames[6], visitors: 498, pageViews: 1876 }, // Saturday
    { day: dayNames[0], visitors: 467, pageViews: 1623 }  // Sunday
  ];

  const trafficSources = [
    { name: getText('organicTraffic'), value: 45, color: '#10b981' },
    { name: getText('directTraffic'), value: 28, color: '#3b82f6' },
    { name: getText('socialTraffic'), value: 18, color: '#f59e0b' },
    { name: getText('referralTraffic'), value: 9, color: '#ef4444' }
  ];

  const topPages = [
    { page: getText('home'), views: 2847, change: 12 },
    { page: getText('menu'), views: 1934, change: 8 },
    { page: getText('reservations'), views: 1256, change: -3 },
    { page: getText('about'), views: 876, change: 15 },
    { page: getText('contact'), views: 543, change: 5 }
  ];

  const metrics = [
    {
      icon: Users,
      label: getText('totalVisitors'),
      value: formatNumber(12847, language),
      change: '+18%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Eye,
      label: getText('pageViews'),
      value: formatNumber(45623, language),
      change: '+23%',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: MousePointer,
      label: getText('bounceRate'),
      value: formatPercentage(34.5, language),
      change: '-12%',
      positive: true,
      color: 'text-orange-600'
    },
    {
      icon: Clock,
      label: getText('avgSessionDuration'),
      value: formatDuration(187, language),
      change: '+8%',
      positive: true,
      color: 'text-purple-600'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="body-md font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'visitors' ? getText('visitors') : getText('pageViews')}: {formatNumber(entry.value, language)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for very small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {formatPercentage(percent * 100, language, 0)}
      </text>
    );
  };

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="analytics">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="headline-md text-foreground flex items-center gap-2">
              <BarChart3 className="icon-md text-primary" />
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

        {/* Weekly Trend Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="body-md font-medium text-foreground">
              {getText('weeklyTrend')}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {getText('visitors')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {getText('pageViews')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="visitors" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pageViews" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources Pie Chart */}
        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">
            {getText('trafficSources')}
          </h4>
          
          <div className="flex items-center gap-4">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={40}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-2">
              {trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {source.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-foreground">
                    {formatPercentage(source.value, language, 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="space-y-3">
          <h4 className="body-md font-medium text-foreground">
            {getText('topPages')}
          </h4>
          
          <div className="space-y-2">
            {topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{page.page}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(page.views, language)} {getText('pageViews').toLowerCase()}
                  </p>
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  page.change > 0 ? 'text-success' : 'text-error'
                }`}>
                  {page.change > 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {Math.abs(page.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Rate Progress */}
        <div className="space-y-3 p-3 bg-accent/20 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="body-md font-medium text-foreground">
              {getText('conversionRate')}
            </h4>
            <span className="text-sm font-medium text-success">
              {formatPercentage(4.2, language)}
            </span>
          </div>
          <Progress value={42} className="w-full" />
          <p className="text-xs text-muted-foreground">
            {language === 'de' 
              ? 'Ziel: 5% - Du bist auf dem richtigen Weg!'
              : 'Target: 5% - You\'re on the right track!'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <ExternalLink className="w-4 h-4 mr-2" />
            {getText('viewDetails')}
          </Button>
          <Button size="sm" className="flex-1 touch-target">
            <Download className="w-4 h-4 mr-2" />
            {getText('exportReport')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;