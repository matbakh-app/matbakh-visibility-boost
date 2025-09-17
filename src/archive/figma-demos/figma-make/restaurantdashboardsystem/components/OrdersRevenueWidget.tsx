import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Euro, TrendingUp, ArrowUp, ArrowDown, Calendar, Clock, Users } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

const OrdersRevenueWidget: React.FC = () => {
  const { language } = useLanguage();

  // Widget translations
  const translations = {
    title: {
      de: 'Bestellungen & Umsatz',
      en: 'Orders & Revenue'
    },
    subtitle: {
      de: 'Verkaufs- und Umsatzanalyse',
      en: 'Sales and Revenue Analysis'
    },
    todayOrders: {
      de: 'Bestellungen heute',
      en: 'Orders Today'
    },
    todayRevenue: {
      de: 'Umsatz heute',
      en: 'Revenue Today'
    },
    weeklyGrowth: {
      de: 'Wöchentliches Wachstum',
      en: 'Weekly Growth'
    },
    monthlyGrowth: {
      de: 'Monatliches Wachstum',
      en: 'Monthly Growth'
    },
    avgOrderValue: {
      de: 'Ø Bestellwert',
      en: 'Avg Order Value'
    },
    totalCustomers: {
      de: 'Kunden gesamt',
      en: 'Total Customers'
    },
    peakHours: {
      de: 'Stoßzeiten',
      en: 'Peak Hours'
    },
    conversionRate: {
      de: 'Conversion Rate',
      en: 'Conversion Rate'
    },
    viewDetails: {
      de: 'Details anzeigen',
      en: 'View Details'
    },
    exportData: {
      de: 'Daten exportieren',
      en: 'Export Data'
    },
    excellent: {
      de: 'Ausgezeichnet',
      en: 'Excellent'
    },
    trend7days: {
      de: '7-Tage-Trend',
      en: '7-Day Trend'
    },
    orders: {
      de: 'Bestellungen',
      en: 'Orders'
    },
    revenue: {
      de: 'Umsatz',
      en: 'Revenue'
    },
    currency: {
      de: '€',
      en: '€'
    },
    increase: {
      de: 'Steigerung',
      en: 'Increase'
    },
    decrease: {
      de: 'Rückgang',
      en: 'Decrease'
    }
  };

  const getText = (key: keyof typeof translations) => {
    return translations[key][language];
  };

  // Sample data for charts
  const weeklyData = [
    { day: language === 'de' ? 'Mo' : 'Mon', orders: 45, revenue: 1250 },
    { day: language === 'de' ? 'Di' : 'Tue', orders: 52, revenue: 1480 },
    { day: language === 'de' ? 'Mi' : 'Wed', orders: 61, revenue: 1720 },
    { day: language === 'de' ? 'Do' : 'Thu', orders: 58, revenue: 1650 },
    { day: language === 'de' ? 'Fr' : 'Fri', orders: 78, revenue: 2150 },
    { day: language === 'de' ? 'Sa' : 'Sat', orders: 85, revenue: 2380 },
    { day: language === 'de' ? 'So' : 'Sun', orders: 72, revenue: 2050 }
  ];

  const metrics = [
    {
      icon: ShoppingCart,
      label: getText('todayOrders'),
      value: '142',
      change: '+18%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Euro,
      label: getText('todayRevenue'),
      value: `${getText('currency')}3,847`,
      change: '+12%',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: Users,
      label: getText('avgOrderValue'),
      value: `${getText('currency')}27.10`,
      change: '+5%',
      positive: true,
      color: 'text-purple-600'
    },
    {
      icon: Clock,
      label: getText('peakHours'),
      value: '12:00-14:00',
      change: '18:00-20:00',
      positive: true,
      color: 'text-orange-600'
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="body-md font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'orders' ? getText('orders') : getText('revenue')}: {entry.value}
              {entry.dataKey === 'revenue' && ` ${getText('currency')}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="widget-card h-full flex flex-col" data-widget="orders-revenue">
      <CardHeader className="pb-3">
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

        {/* Chart Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="body-md font-medium text-foreground">
              {getText('trend7days')}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {getText('orders')}
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
          
          <div className="h-40 w-full">
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
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-accent/20 rounded-lg">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-success">
              <ArrowUp className="w-4 h-4" />
              <span className="body-md font-medium">+23%</span>
            </div>
            <p className="caption text-muted-foreground">
              {getText('weeklyGrowth')}
            </p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-success">
              <ArrowUp className="w-4 h-4" />
              <span className="body-md font-medium">+15%</span>
            </div>
            <p className="caption text-muted-foreground">
              {getText('monthlyGrowth')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1 touch-target">
            <Calendar className="w-4 h-4 mr-2" />
            {getText('viewDetails')}
          </Button>
          <Button size="sm" className="flex-1 touch-target">
            {getText('exportData')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersRevenueWidget;