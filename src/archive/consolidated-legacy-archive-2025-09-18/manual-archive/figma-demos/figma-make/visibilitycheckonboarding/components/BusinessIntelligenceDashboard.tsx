import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  Clock, 
  Calendar, 
  MapPin, 
  Star, 
  Mail, 
  Share2, 
  Eye, 
  Heart, 
  MessageSquare, 
  ShoppingCart, 
  Utensils, 
  Timer, 
  Award, 
  BarChart3, 
  PieChart, 
  Activity, 
  Globe, 
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Euro
} from 'lucide-react';

type UserPlan = 'basic' | 'business' | 'premium';

interface BusinessIntelligenceDashboardProps {
  userPlan: UserPlan;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

interface KPI {
  id: string;
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'percentage' | 'number' | 'time' | 'rating';
  icon: React.ReactNode;
  description: string;
  category: 'revenue' | 'customer' | 'marketing' | 'operational';
  isLocked?: boolean;
  planRequired?: UserPlan;
}

interface ChartData {
  label: string;
  value: number;
  change?: number;
  color?: string;
}

const mockKPIs: KPI[] = [
  // Revenue KPIs
  {
    id: 'monthly_revenue',
    label: 'Monatsumsatz',
    value: 45200,
    change: 12.5,
    trend: 'up',
    format: 'currency',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Gesamtumsatz des aktuellen Monats',
    category: 'revenue'
  },
  {
    id: 'avg_order_value',
    label: 'Ø Bestellwert',
    value: 32.50,
    change: 8.2,
    trend: 'up',
    format: 'currency',
    icon: <ShoppingCart className="w-4 h-4" />,
    description: 'Durchschnittlicher Wert pro Bestellung',
    category: 'revenue'
  },
  {
    id: 'profit_margin',
    label: 'Gewinnmarge',
    value: 18.5,
    change: -2.1,
    trend: 'down',
    format: 'percentage',
    icon: <Percent className="w-4 h-4" />,
    description: 'Prozentuale Gewinnmarge',
    category: 'revenue',
    isLocked: true,
    planRequired: 'business'
  },
  // Customer KPIs
  {
    id: 'new_customers',
    label: 'Neue Kunden',
    value: 284,
    change: 15.7,
    trend: 'up',
    format: 'number',
    icon: <Users className="w-4 h-4" />,
    description: 'Anzahl neuer Kunden diesen Monat',
    category: 'customer'
  },
  {
    id: 'customer_retention',
    label: 'Kundenbindung',
    value: 68.5,
    change: 5.3,
    trend: 'up',
    format: 'percentage',
    icon: <Heart className="w-4 h-4" />,
    description: 'Prozentsatz wiederkehrender Kunden',
    category: 'customer'
  },
  {
    id: 'customer_lifetime_value',
    label: 'Customer LTV',
    value: 450,
    change: 22.1,
    trend: 'up',
    format: 'currency',
    icon: <Award className="w-4 h-4" />,
    description: 'Durchschnittlicher Kundenwert über die Lebenszeit',
    category: 'customer',
    isLocked: true,
    planRequired: 'premium'
  },
  {
    id: 'customer_satisfaction',
    label: 'CSAT Score',
    value: 4.6,
    change: 0.3,
    trend: 'up',
    format: 'rating',
    icon: <Star className="w-4 h-4" />,
    description: 'Customer Satisfaction Score (1-5)',
    category: 'customer'
  },
  // Marketing KPIs
  {
    id: 'social_reach',
    label: 'Social Media Reichweite',
    value: 15420,
    change: -5.2,
    trend: 'down',
    format: 'number',
    icon: <Share2 className="w-4 h-4" />,
    description: 'Gesamtreichweite in sozialen Medien',
    category: 'marketing'
  },
  {
    id: 'email_open_rate',
    label: 'E-Mail Öffnungsrate',
    value: 24.8,
    change: 3.1,
    trend: 'up',
    format: 'percentage',
    icon: <Mail className="w-4 h-4" />,
    description: 'Öffnungsrate der E-Mail-Kampagnen',
    category: 'marketing'
  },
  {
    id: 'roas',
    label: 'ROAS',
    value: 3.2,
    change: 18.5,
    trend: 'up',
    format: 'number',
    icon: <Target className="w-4 h-4" />,
    description: 'Return on Ad Spend',
    category: 'marketing',
    isLocked: true,
    planRequired: 'business'
  },
  {
    id: 'cost_per_acquisition',
    label: 'CAC',
    value: 15.50,
    change: -8.7,
    trend: 'up',
    format: 'currency',
    icon: <Users className="w-4 h-4" />,
    description: 'Customer Acquisition Cost',
    category: 'marketing',
    isLocked: true,
    planRequired: 'business'
  },
  // Operational KPIs
  {
    id: 'table_turnover',
    label: 'Tischrotation',
    value: 2.8,
    change: 12.0,
    trend: 'up',
    format: 'number',
    icon: <Utensils className="w-4 h-4" />,
    description: 'Durchschnittliche Tischrotation pro Tag',
    category: 'operational'
  },
  {
    id: 'avg_wait_time',
    label: 'Ø Wartezeit',
    value: '12 Min',
    change: -15.2,
    trend: 'up',
    format: 'time',
    icon: <Timer className="w-4 h-4" />,
    description: 'Durchschnittliche Wartezeit der Kunden',
    category: 'operational'
  },
  {
    id: 'peak_hour_utilization',
    label: 'Stoßzeit-Auslastung',
    value: 89.5,
    change: 6.8,
    trend: 'up',
    format: 'percentage',
    icon: <Activity className="w-4 h-4" />,
    description: 'Auslastung während der Stoßzeiten',
    category: 'operational',
    isLocked: true,
    planRequired: 'business'
  }
];

const mockRevenueData: ChartData[] = [
  { label: 'Jan', value: 38500, change: 8.2 },
  { label: 'Feb', value: 42100, change: 9.4 },
  { label: 'Mar', value: 39800, change: -5.5 },
  { label: 'Apr', value: 45200, change: 13.6 },
  { label: 'Mai', value: 48900, change: 8.2 },
  { label: 'Jun', value: 52300, change: 6.9 }
];

const mockCustomerSegments: ChartData[] = [
  { label: 'Stammkunden', value: 45, color: '#10B981' },
  { label: 'Gelegenheitskunden', value: 35, color: '#F59E0B' },
  { label: 'Neukunden', value: 20, color: '#4F46E5' }
];

const mockMarketingChannels: ChartData[] = [
  { label: 'Google Ads', value: 28, change: 12.5, color: '#10B981' },
  { label: 'Social Media', value: 24, change: -3.2, color: '#F59E0B' },
  { label: 'Email Marketing', value: 18, change: 8.7, color: '#4F46E5' },
  { label: 'Referrals', value: 15, change: 22.1, color: '#EF4444' },
  { label: 'Organic', value: 15, change: 5.3, color: '#8B5CF6' }
];

export function BusinessIntelligenceDashboard({ 
  userPlan, 
  dateRange, 
  onDateRangeChange 
}: BusinessIntelligenceDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const formatValue = (value: number | string, format: KPI['format']) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      case 'rating':
        return `${value}/5`;
      case 'time':
        return value.toString();
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (trend: KPI['trend'], change: number) => {
    if (trend === 'up') {
      return <ArrowUpRight className="w-3 h-3 text-success" />;
    } else if (trend === 'down') {
      return <ArrowDownRight className="w-3 h-3 text-error" />;
    }
    return null;
  };

  const filteredKPIs = selectedCategory === 'all' 
    ? mockKPIs 
    : mockKPIs.filter(kpi => kpi.category === selectedCategory);

  const visibleKPIs = filteredKPIs.filter(kpi => {
    if (!kpi.isLocked) return true;
    if (kpi.planRequired === 'business' && ['business', 'premium'].includes(userPlan)) return true;
    if (kpi.planRequired === 'premium' && userPlan === 'premium') return true;
    return false;
  });

  const lockedKPIs = filteredKPIs.filter(kpi => {
    if (!kpi.isLocked) return false;
    if (kpi.planRequired === 'business' && userPlan === 'basic') return true;
    if (kpi.planRequired === 'premium' && userPlan !== 'premium') return true;
    return false;
  });

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📊 Business Intelligence</h2>
          <p className="text-muted-foreground">
            Umfassende Restaurant-Analytics und Performance-KPIs
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle KPIs</SelectItem>
              <SelectItem value="revenue">💰 Umsatz</SelectItem>
              <SelectItem value="customer">👥 Kunden</SelectItem>
              <SelectItem value="marketing">📢 Marketing</SelectItem>
              <SelectItem value="operational">⚙️ Betrieb</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Letzte 7 Tage</SelectItem>
              <SelectItem value="30d">Letzte 30 Tage</SelectItem>
              <SelectItem value="90d">Letzte 90 Tage</SelectItem>
              <SelectItem value="1y">Letztes Jahr</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="revenue">Umsatz</TabsTrigger>
          <TabsTrigger value="customers">Kunden</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="operations">Betrieb</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleKPIs.slice(0, 8).map((kpi) => (
              <Card key={kpi.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {kpi.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {kpi.category}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {formatValue(kpi.value, kpi.format)}
                    </span>
                    {getTrendIcon(kpi.trend, kpi.change)}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className={`font-medium ${
                      kpi.trend === 'up' ? 'text-success' : 
                      kpi.trend === 'down' ? 'text-error' : 'text-muted-foreground'
                    }`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                    <span className="text-muted-foreground">vs. Vormonat</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Locked KPIs */}
          {lockedKPIs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">🔒 Premium KPIs</h3>
                <Badge variant="outline">
                  {userPlan === 'basic' ? 'Business Plan erforderlich' : 'Premium Plan erforderlich'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {lockedKPIs.map((kpi) => (
                  <Card key={kpi.id} className="p-6 opacity-60 relative">
                    <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                      <Badge variant="secondary">🔒 {kpi.planRequired}</Badge>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                        {kpi.icon}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                      <div className="text-2xl font-bold text-muted-foreground">***</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quick Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Umsatzentwicklung</h4>
                <Badge variant="outline">+12.5%</Badge>
              </div>
              <div className="space-y-3">
                {mockRevenueData.slice(-3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">€{item.value.toLocaleString()}</span>
                      <span className={`text-xs ${
                        item.change && item.change > 0 ? 'text-success' : 'text-error'
                      }`}>
                        {item.change && item.change > 0 ? '+' : ''}{item.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Customer Segments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Kundensegmente</h4>
                <PieChart className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {mockCustomerSegments.map((segment, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{segment.label}</span>
                      <span className="font-medium">{segment.value}%</span>
                    </div>
                    <Progress value={segment.value} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Marketing Performance */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Marketing-Kanäle</h4>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {mockMarketingChannels.slice(0, 3).map((channel, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{channel.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{channel.value}%</span>
                      <span className={`text-xs ${
                        channel.change && channel.change > 0 ? 'text-success' : 'text-error'
                      }`}>
                        {channel.change && channel.change > 0 ? '+' : ''}{channel.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleKPIs.filter(kpi => kpi.category === 'revenue').map((kpi) => (
              <Card key={kpi.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    {kpi.icon}
                  </div>
                  {getTrendIcon(kpi.trend, kpi.change)}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <div className="text-2xl font-bold">
                    {formatValue(kpi.value, kpi.format)}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className={`font-medium ${
                      kpi.trend === 'up' ? 'text-success' : 
                      kpi.trend === 'down' ? 'text-error' : 'text-muted-foreground'
                    }`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                    <span className="text-muted-foreground">vs. Vormonat</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Revenue Chart Placeholder */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Detaillierte Umsatzanalyse</h4>
            <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Revenue Chart Integration</p>
                <p className="text-xs text-muted-foreground">Recharts Integration für detaillierte Visualisierung</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleKPIs.filter(kpi => kpi.category === 'customer').map((kpi) => (
              <Card key={kpi.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {kpi.icon}
                  </div>
                  {getTrendIcon(kpi.trend, kpi.change)}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <div className="text-2xl font-bold">
                    {formatValue(kpi.value, kpi.format)}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className={`font-medium ${
                      kpi.trend === 'up' ? 'text-success' : 
                      kpi.trend === 'down' ? 'text-error' : 'text-muted-foreground'
                    }`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                    <span className="text-muted-foreground">vs. Vormonat</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Customer Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Kundensegmentierung</h4>
              <div className="space-y-4">
                {mockCustomerSegments.map((segment, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{segment.label}</span>
                      <span className="text-sm font-bold">{segment.value}%</span>
                    </div>
                    <Progress value={segment.value} className="h-3" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Customer Journey</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Erstkontakt</span>
                  <span className="font-medium">100%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Interesse</span>
                  <span className="font-medium">68%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Erste Bestellung</span>
                  <span className="font-medium">24%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                  <span className="text-sm">Stammkunde</span>
                  <span className="font-medium text-success">15%</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleKPIs.filter(kpi => kpi.category === 'marketing').map((kpi) => (
              <Card key={kpi.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    {kpi.icon}
                  </div>
                  {getTrendIcon(kpi.trend, kpi.change)}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <div className="text-2xl font-bold">
                    {formatValue(kpi.value, kpi.format)}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className={`font-medium ${
                      kpi.trend === 'up' ? 'text-success' : 
                      kpi.trend === 'down' ? 'text-error' : 'text-muted-foreground'
                    }`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                    <span className="text-muted-foreground">vs. Vormonat</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Marketing Channels Performance */}
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Marketing-Kanal Performance</h4>
            <div className="space-y-4">
              {mockMarketingChannels.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: channel.color }}
                    />
                    <span className="font-medium">{channel.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{channel.value}%</span>
                    <span className={`text-sm ${
                      channel.change && channel.change > 0 ? 'text-success' : 'text-error'
                    }`}>
                      {channel.change && channel.change > 0 ? '+' : ''}{channel.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleKPIs.filter(kpi => kpi.category === 'operational').map((kpi) => (
              <Card key={kpi.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                    {kpi.icon}
                  </div>
                  {getTrendIcon(kpi.trend, kpi.change)}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <div className="text-2xl font-bold">
                    {formatValue(kpi.value, kpi.format)}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className={`font-medium ${
                      kpi.trend === 'up' ? 'text-success' : 
                      kpi.trend === 'down' ? 'text-error' : 'text-muted-foreground'
                    }`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                    <span className="text-muted-foreground">vs. Vormonat</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Operational Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Stoßzeiten-Analyse</h4>
              <div className="space-y-3">
                {[
                  { time: '12:00-14:00', utilization: 95, label: 'Mittag Peak' },
                  { time: '18:00-21:00', utilization: 89, label: 'Abend Peak' },
                  { time: '09:00-11:00', utilization: 34, label: 'Vormittag' },
                  { time: '15:00-17:00', utilization: 28, label: 'Nachmittag' }
                ].map((slot, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{slot.time} ({slot.label})</span>
                      <span className="font-medium">{slot.utilization}%</span>
                    </div>
                    <Progress value={slot.utilization} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Service-Qualität</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                  <span className="text-sm">Service-Geschwindigkeit</span>
                  <Badge variant="default" className="bg-success">Exzellent</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <span className="text-sm">Tischverfügbarkeit</span>
                  <Badge variant="secondary" className="bg-warning text-white">Mittel</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                  <span className="text-sm">Bestellgenauigkeit</span>
                  <Badge variant="default" className="bg-success">Sehr gut</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}