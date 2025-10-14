import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Euro, TrendingUp, ArrowUp, ArrowDown, Calendar, Clock, Users } from 'lucide-react';

const OrdersRevenueWidget: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  // Sample data for charts
  const weeklyData = [
    { day: 'Mo', orders: 45, revenue: 1250 },
    { day: 'Di', orders: 52, revenue: 1480 },
    { day: 'Mi', orders: 61, revenue: 1720 },
    { day: 'Do', orders: 58, revenue: 1650 },
    { day: 'Fr', orders: 78, revenue: 2150 },
    { day: 'Sa', orders: 85, revenue: 2380 },
    { day: 'So', orders: 72, revenue: 2050 }
  ];

  const metrics = [
    {
      icon: ShoppingCart,
      label: t('ordersToday', { ns: 'dashboard' }),
      value: '142',
      change: '+18%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Euro,
      label: t('revenueToday', { ns: 'dashboard' }),
      value: '€3,847',
      change: '+12%',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: Users,
      label: t('avgOrderValue', { ns: 'dashboard' }),
      value: '€27.10',
      change: '+5%',
      positive: true,
      color: 'text-purple-600'
    },
    {
      icon: Clock,
      label: t('peakHours', { ns: 'dashboard' }),
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
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'orders' ? t('orders', { ns: 'dashboard' }) : t('revenue', { ns: 'dashboard' })}: {entry.value}
              {entry.dataKey === 'revenue' && ' €'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col" data-widget="orders-revenue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('ordersRevenue', { ns: 'dashboard' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('salesAnalysis', { ns: 'dashboard' })}
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

        {/* Chart Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              {t('weeklyTrend', { ns: 'dashboard' })}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {t('orders', { ns: 'dashboard' })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {t('revenue', { ns: 'dashboard' })}
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
            <div className="flex items-center justify-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">+23%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('weeklyGrowth', { ns: 'dashboard' })}
            </p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">+15%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('monthlyGrowth', { ns: 'dashboard' })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            {t('viewDetails', { ns: 'common' })}
          </Button>
          <Button size="sm" className="flex-1">
            {t('exportData', { ns: 'common' })}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersRevenueWidget;