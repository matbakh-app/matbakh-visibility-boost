import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ShoppingCart, 
  Euro, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  Clock, 
  Users, 
  Store,
  Car,
  Truck,
  Lock,
  Eye,
  Crown
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import ReportPreviewModal from './ReportPreviewModal';
import RestrictedWidget from './RestrictedWidget';

interface OrdersRevenueWidgetProps {
  isPublicMode?: boolean;
  onUpgrade?: () => void;
}

const OrdersRevenueWidget: React.FC<OrdersRevenueWidgetProps> = ({ 
  isPublicMode = false,
  onUpgrade 
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('inhouse');
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    category?: 'inhouse' | 'takeaway' | 'delivery';
  }>({ isOpen: false });

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
    categories: {
      inhouse: {
        title: {
          de: 'Inhouse',
          en: 'Inhouse'
        },
        description: {
          de: 'Restaurant-Verkäufe',
          en: 'Restaurant Sales'
        },
        requirement: {
          de: 'POS-Anbindung erforderlich',
          en: 'POS integration required'
        }
      },
      takeaway: {
        title: {
          de: 'Takeaway',
          en: 'Takeaway'
        },
        description: {
          de: 'Abholbestellungen',
          en: 'Pickup Orders'
        },
        requirement: {
          de: 'GMB & Social Media Integration',
          en: 'GMB & Social Media integration'
        }
      },
      delivery: {
        title: {
          de: 'Delivery',
          en: 'Delivery'
        },
        description: {
          de: 'Lieferservice',
          en: 'Delivery Service'
        },
        requirement: {
          de: 'GMB, Social Media & Lieferdienst-Integration',
          en: 'GMB, Social Media & Delivery integration'
        }
      }
    },
    metrics: {
      todayOrders: {
        de: 'Bestellungen heute',
        en: 'Orders Today'
      },
      todayRevenue: {
        de: 'Umsatz heute',
        en: 'Revenue Today'
      },
      avgOrderValue: {
        de: 'Ø Bestellwert',
        en: 'Avg Order Value'
      },
      peakHours: {
        de: 'Stoßzeiten',
        en: 'Peak Hours'
      },
      waitTime: {
        de: 'Wartezeit',
        en: 'Wait Time'
      },
      deliveryTime: {
        de: 'Lieferzeit',
        en: 'Delivery Time'
      }
    },
    subscriptionRequired: {
      de: 'Business oder Premium Abo erforderlich',
      en: 'Business or Premium subscription required'
    },
    showPreview: {
      de: 'Vorschau anzeigen',
      en: 'Show Preview'
    },
    upgradeNow: {
      de: 'Jetzt upgraden',
      en: 'Upgrade Now'
    },
    trend7days: {
      de: '7-Tage-Trend',
      en: '7-Day Trend'
    },
    weeklyGrowth: {
      de: 'Wöchentliches Wachstum',
      en: 'Weekly Growth'
    },
    monthlyGrowth: {
      de: 'Monatliches Wachstum',
      en: 'Monthly Growth'
    },
    excellent: {
      de: 'Ausgezeichnet',
      en: 'Excellent'
    }
  };

  const getText = (key: string) => {
    const keys = key.split('.');
    let obj = translations;
    for (const k of keys) {
      obj = obj[k];
    }
    return obj?.[language] || key;
  };

  // Category data with different metrics
  const categoryData = {
    inhouse: {
      metrics: [
        {
          icon: ShoppingCart,
          label: getText('metrics.todayOrders'),
          value: '142',
          change: '+18%',
          positive: true,
          color: 'text-blue-600'
        },
        {
          icon: Euro,
          label: getText('metrics.todayRevenue'),
          value: '€3,847',
          change: '+12%',
          positive: true,
          color: 'text-green-600'
        },
        {
          icon: Users,
          label: getText('metrics.avgOrderValue'),
          value: '€27.10',
          change: '+5%',
          positive: true,
          color: 'text-purple-600'
        },
        {
          icon: Clock,
          label: getText('metrics.peakHours'),
          value: '12:00-14:00',
          change: '18:00-20:00',
          positive: true,
          color: 'text-orange-600'
        }
      ],
      chartData: [
        { day: language === 'de' ? 'Mo' : 'Mon', orders: 45, revenue: 1250 },
        { day: language === 'de' ? 'Di' : 'Tue', orders: 52, revenue: 1480 },
        { day: language === 'de' ? 'Mi' : 'Wed', orders: 61, revenue: 1720 },
        { day: language === 'de' ? 'Do' : 'Thu', orders: 58, revenue: 1650 },
        { day: language === 'de' ? 'Fr' : 'Fri', orders: 78, revenue: 2150 },
        { day: language === 'de' ? 'Sa' : 'Sat', orders: 85, revenue: 2380 },
        { day: language === 'de' ? 'So' : 'Sun', orders: 72, revenue: 2050 }
      ]
    },
    takeaway: {
      metrics: [
        {
          icon: Car,
          label: getText('metrics.todayOrders'),
          value: '87',
          change: '+22%',
          positive: true,
          color: 'text-blue-600'
        },
        {
          icon: Euro,
          label: getText('metrics.todayRevenue'),
          value: '€1,234',
          change: '+15%',
          positive: true,
          color: 'text-green-600'
        },
        {
          icon: Users,
          label: getText('metrics.avgOrderValue'),
          value: '€14.20',
          change: '+8%',
          positive: true,
          color: 'text-purple-600'
        },
        {
          icon: Clock,
          label: getText('metrics.waitTime'),
          value: '12 min',
          change: '-8%',
          positive: true,
          color: 'text-orange-600'
        }
      ],
      chartData: [
        { day: language === 'de' ? 'Mo' : 'Mon', orders: 28, revenue: 385 },
        { day: language === 'de' ? 'Di' : 'Tue', orders: 32, revenue: 445 },
        { day: language === 'de' ? 'Mi' : 'Wed', orders: 35, revenue: 520 },
        { day: language === 'de' ? 'Do' : 'Thu', orders: 38, revenue: 485 },
        { day: language === 'de' ? 'Fr' : 'Fri', orders: 45, revenue: 650 },
        { day: language === 'de' ? 'Sa' : 'Sat', orders: 52, revenue: 720 },
        { day: language === 'de' ? 'So' : 'Sun', orders: 41, revenue: 580 }
      ]
    },
    delivery: {
      metrics: [
        {
          icon: Truck,
          label: getText('metrics.todayOrders'),
          value: '64',
          change: '+28%',
          positive: true,
          color: 'text-blue-600'
        },
        {
          icon: Euro,
          label: getText('metrics.todayRevenue'),
          value: '€1,567',
          change: '+33%',
          positive: true,
          color: 'text-green-600'
        },
        {
          icon: Users,
          label: getText('metrics.avgOrderValue'),
          value: '€24.50',
          change: '+12%',
          positive: true,
          color: 'text-purple-600'
        },
        {
          icon: Clock,
          label: getText('metrics.deliveryTime'),
          value: '31 min',
          change: '-5%',
          positive: true,
          color: 'text-orange-600'
        }
      ],
      chartData: [
        { day: language === 'de' ? 'Mo' : 'Mon', orders: 18, revenue: 445 },
        { day: language === 'de' ? 'Di' : 'Tue', orders: 22, revenue: 535 },
        { day: language === 'de' ? 'Mi' : 'Wed', orders: 26, revenue: 625 },
        { day: language === 'de' ? 'Do' : 'Thu', orders: 24, revenue: 585 },
        { day: language === 'de' ? 'Fr' : 'Fri', orders: 32, revenue: 780 },
        { day: language === 'de' ? 'Sa' : 'Sat', orders: 35, revenue: 855 },
        { day: language === 'de' ? 'So' : 'Sun', orders: 28, revenue: 685 }
      ]
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inhouse': return Store;
      case 'takeaway': return Car;
      case 'delivery': return Truck;
      default: return Store;
    }
  };

  const handlePreview = (category: 'inhouse' | 'takeaway' | 'delivery') => {
    setPreviewModal({ isOpen: true, category });
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open('/pricing', '_blank');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="body-md font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'orders' ? 'Orders' : 'Revenue'}: {entry.value}
              {entry.dataKey === 'revenue' && ' €'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // All categories are restricted in public mode
  const isRestricted = isPublicMode;

  if (isRestricted) {
    return (
      <RestrictedWidget
        isRestricted={true}
        restrictionType="premium"
        context="reports"
        title={getText('title')}
        description={getText('subscriptionRequired')}
        showPreview={true}
        blurLevel="medium"
        onUpgrade={handleUpgrade}
      >
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

          <CardContent className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid grid-cols-3 mb-4">
                {Object.entries(categoryData).map(([key, _]) => {
                  const IconComponent = getCategoryIcon(key);
                  return (
                    <TabsTrigger 
                      key={key} 
                      value={key}
                      className="flex items-center gap-2 text-xs"
                    >
                      <IconComponent className="w-4 h-4" />
                      {getText(`categories.${key}.title`)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.entries(categoryData).map(([key, data]) => (
                <TabsContent key={key} value={key} className="space-y-4 h-full">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {data.metrics.map((metric, index) => (
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

                  {/* Chart */}
                  <div className="space-y-3">
                    <h4 className="body-md font-medium text-foreground">
                      {getText('trend7days')}
                    </h4>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </RestrictedWidget>
    );
  }

  return (
    <>
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

        <CardContent className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid grid-cols-3 mb-4">
              {Object.entries(categoryData).map(([key, _]) => {
                const IconComponent = getCategoryIcon(key);
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="flex items-center gap-2 text-xs"
                  >
                    <IconComponent className="w-4 h-4" />
                    {getText(`categories.${key}.title`)}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(categoryData).map(([key, data]) => (
              <TabsContent key={key} value={key} className="space-y-4 h-full">
                {/* Requirements Notice */}
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-warning mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {getText(`categories.${key}.requirement`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getText('subscriptionRequired')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {data.metrics.map((metric, index) => (
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

                {/* Chart */}
                <div className="space-y-3">
                  <h4 className="body-md font-medium text-foreground">
                    {getText('trend7days')}
                  </h4>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 touch-target"
                    onClick={() => handlePreview(key as 'inhouse' | 'takeaway' | 'delivery')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {getText('showPreview')}
                  </Button>
                  <Button size="sm" className="flex-1 touch-target" onClick={handleUpgrade}>
                    <Crown className="w-4 h-4 mr-2" />
                    {getText('upgradeNow')}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <ReportPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false })}
        reportType="orders-revenue"
        category={previewModal.category}
        onUpgrade={handleUpgrade}
      />
    </>
  );
};

export default OrdersRevenueWidget;