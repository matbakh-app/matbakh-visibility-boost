import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar, ArrowUp, ArrowDown, Target, Users, Euro, Clock } from 'lucide-react';

const PerformanceTrendsWidget: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);

  // Sample data for trends
  const monthlyData = [
    { month: 'Jan', revenue: 45000, visitors: 2400, orders: 890, satisfaction: 4.2 },
    { month: 'Feb', revenue: 48000, visitors: 2600, orders: 920, satisfaction: 4.3 },
    { month: 'Mar', revenue: 52000, visitors: 2800, orders: 980, satisfaction: 4.4 },
    { month: 'Apr', revenue: 49000, visitors: 2700, orders: 940, satisfaction: 4.3 },
    { month: 'Mai', revenue: 55000, visitors: 3100, orders: 1050, satisfaction: 4.5 },
    { month: 'Jun', revenue: 58000, visitors: 3300, orders: 1120, satisfaction: 4.6 },
    { month: 'Jul', revenue: 62000, visitors: 3500, orders: 1200, satisfaction: 4.6 },
    { month: 'Aug', revenue: 59000, visitors: 3400, orders: 1150, satisfaction: 4.5 },
    { month: 'Sep', revenue: 61000, visitors: 3600, orders: 1180, satisfaction: 4.7 },
    { month: 'Okt', revenue: 64000, visitors: 3800, orders: 1250, satisfaction: 4.7 },
    { month: 'Nov', revenue: 67000, visitors: 4000, orders: 1300, satisfaction: 4.8 },
    { month: 'Dez', revenue: 72000, visitors: 4200, orders: 1400, satisfaction: 4.8 }
  ];

  const kpis = [
    {
      icon: Euro,
      label: t('monthlyRevenue', { ns: 'dashboard' }),
      current: '€72,000',
      previous: '€67,000',
      change: '+7.5%',
      positive: true,
      color: 'text-green-600'
    },
    {
      icon: Users,
      label: t('monthlyVisitors', { ns: 'dashboard' }),
      current: '4,200',
      previous: '4,000',
      change: '+5.0%',
      positive: true,
      color: 'text-blue-600'
    },
    {
      icon: Target,
      label: t('conversionRate', { ns: 'dashboard' }),
      current: '33.3%',
      previous: '32.5%',
      change: '+0.8%',
      positive: true,
      color: 'text-purple-600'
    },
    {
      icon: Clock,
      label: t('customerSatisfaction', { ns: 'dashboard' }),
      current: '4.8/5',
      previous: '4.7/5',
      change: '+2.1%',
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
              {entry.name}: {entry.value}
              {entry.dataKey === 'revenue' && ' €'}
              {entry.dataKey === 'satisfaction' && '/5'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col" data-widget="performance-trends">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('performanceTrends', { ns: 'dashboard' })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('yearlyAnalysis', { ns: 'dashboard' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {t('growing', { ns: 'dashboard' })}
            </Badge>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              2024
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi, index) => (
            <div key={index} className="bg-accent/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className={`text-xs flex items-center gap-1 ${
                  kpi.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.positive ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {kpi.change}
                </span>
              </div>
              <div>
                <div className="text-lg font-semibold text-foreground">{kpi.current}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {kpi.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue & Visitors Trend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              {t('revenueVisitorsTrend', { ns: 'dashboard' })}
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-muted-foreground">Umsatz</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs text-muted-foreground">Besucher</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#visitorsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Satisfaction Trend */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            {t('satisfactionTrend', { ns: 'dashboard' })}
          </h4>
          
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                />
                <YAxis hide domain={[4.0, 5.0]} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="satisfaction" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-accent/20 rounded-lg">
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">+18%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('yearlyGrowth', { ns: 'dashboard' })}
            </p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-sm font-medium text-foreground">€684k</div>
            <p className="text-xs text-muted-foreground">
              {t('totalRevenue', { ns: 'dashboard' })}
            </p>
          </div>
          
          <div className="text-center space-y-1">
            <div className="text-sm font-medium text-foreground">39.2k</div>
            <p className="text-xs text-muted-foreground">
              {t('totalVisitors', { ns: 'dashboard' })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceTrendsWidget;