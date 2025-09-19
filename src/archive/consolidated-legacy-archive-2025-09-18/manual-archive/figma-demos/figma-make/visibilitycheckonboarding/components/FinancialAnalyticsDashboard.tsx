import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  Calculator, 
  CreditCard, 
  Receipt, 
  Wallet, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Euro,
  Percent,
  Calendar,
  Clock,
  Building,
  Users,
  ShoppingCart,
  Utensils,
  Truck,
  Zap
} from 'lucide-react';

type UserPlan = 'basic' | 'business' | 'premium';

interface FinancialMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'percentage' | 'number';
  target?: number;
  category: 'revenue' | 'costs' | 'profit' | 'cash';
  description: string;
  isLocked?: boolean;
  planRequired?: UserPlan;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  change: number;
  subcategories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
}

interface FinancialAnalyticsDashboardProps {
  userPlan: UserPlan;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onUpgrade: () => void;
}

const mockFinancialMetrics: FinancialMetric[] = [
  // Revenue Metrics
  {
    id: 'total_revenue',
    label: 'Gesamtumsatz',
    value: 52300,
    change: 8.5,
    trend: 'up',
    format: 'currency',
    target: 55000,
    category: 'revenue',
    description: 'Gesamter Monatsumsatz inklusive aller Kanäle'
  },
  {
    id: 'food_revenue',
    label: 'Speisen-Umsatz',
    value: 38400,
    change: 6.2,
    trend: 'up',
    format: 'currency',
    category: 'revenue',
    description: 'Umsatz durch Speisen-Verkauf'
  },
  {
    id: 'beverage_revenue',
    label: 'Getränke-Umsatz',
    value: 13900,
    change: 15.3,
    trend: 'up',
    format: 'currency',
    category: 'revenue',
    description: 'Umsatz durch Getränke-Verkauf'
  },
  
  // Cost Metrics
  {
    id: 'total_costs',
    label: 'Gesamtkosten',
    value: 41200,
    change: 4.1,
    trend: 'up',
    format: 'currency',
    category: 'costs',
    description: 'Alle operativen Kosten des Monats'
  },
  {
    id: 'cogs',
    label: 'Warenkosten (COGS)',
    value: 18500,
    change: 2.8,
    trend: 'up',
    format: 'currency',
    category: 'costs',
    description: 'Kosten für Lebensmittel und Getränke'
  },
  {
    id: 'staff_costs',
    label: 'Personalkosten',
    value: 15600,
    change: 6.5,
    trend: 'up',
    format: 'currency',
    category: 'costs',
    description: 'Gehälter, Sozialversicherung und Benefits'
  },
  
  // Profit Metrics
  {
    id: 'gross_profit',
    label: 'Bruttogewinn',
    value: 33800,
    change: 12.4,
    trend: 'up',
    format: 'currency',
    category: 'profit',
    description: 'Umsatz minus Warenkosten',
    isLocked: true,
    planRequired: 'business'
  },
  {
    id: 'net_profit',
    label: 'Nettogewinn',
    value: 11100,
    change: 18.9,
    trend: 'up',
    format: 'currency',
    category: 'profit',
    description: 'Gewinn nach allen Kosten',
    isLocked: true,
    planRequired: 'business'
  },
  {
    id: 'profit_margin',
    label: 'Gewinnmarge',
    value: 21.2,
    change: 2.3,
    trend: 'up',
    format: 'percentage',
    target: 25,
    category: 'profit',
    description: 'Nettogewinn in Prozent des Umsatzes',
    isLocked: true,
    planRequired: 'business'
  },
  
  // Cash Flow Metrics
  {
    id: 'cash_flow',
    label: 'Cashflow',
    value: 9800,
    change: -5.2,
    trend: 'down',
    format: 'currency',
    category: 'cash',
    description: 'Netto-Geldfluss des Monats',
    isLocked: true,
    planRequired: 'premium'
  },
  {
    id: 'accounts_receivable',
    label: 'Forderungen',
    value: 4200,
    change: 8.7,
    trend: 'up',
    format: 'currency',
    category: 'cash',
    description: 'Ausstehende Zahlungen von Kunden',
    isLocked: true,
    planRequired: 'premium'
  }
];

const mockCostBreakdown: CostBreakdown[] = [
  {
    category: 'Warenkosten',
    amount: 18500,
    percentage: 35.4,
    change: 2.8,
    subcategories: [
      { name: 'Lebensmittel', amount: 13200, percentage: 71.4 },
      { name: 'Getränke', amount: 3800, percentage: 20.5 },
      { name: 'Verpackung', amount: 1500, percentage: 8.1 }
    ]
  },
  {
    category: 'Personalkosten',
    amount: 15600,
    percentage: 29.8,
    change: 6.5,
    subcategories: [
      { name: 'Gehälter', amount: 11200, percentage: 71.8 },
      { name: 'Sozialversicherung', amount: 2800, percentage: 17.9 },
      { name: 'Benefits', amount: 1600, percentage: 10.3 }
    ]
  },
  {
    category: 'Betriebskosten',
    amount: 7100,
    percentage: 13.6,
    change: -1.2,
    subcategories: [
      { name: 'Miete', amount: 3500, percentage: 49.3 },
      { name: 'Strom/Gas', amount: 1800, percentage: 25.4 },
      { name: 'Versicherungen', amount: 1800, percentage: 25.4 }
    ]
  }
];

const mockProfitabilityAnalysis = {
  bestPerformingCategory: 'Getränke',
  worstPerformingCategory: 'Vorspeisen',
  averageOrderMargin: 18.5,
  peakHourMargin: 24.2,
  offPeakMargin: 12.8,
  deliveryMargin: 15.3,
  dineInMargin: 22.1
};

export function FinancialAnalyticsDashboard({ 
  userPlan, 
  dateRange, 
  onDateRangeChange,
  onUpgrade 
}: FinancialAnalyticsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const formatValue = (value: number, format: FinancialMetric['format']) => {
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (trend: FinancialMetric['trend'], change: number) => {
    if (trend === 'up') {
      return <ArrowUpRight className="w-3 h-3 text-success" />;
    } else if (trend === 'down') {
      return <ArrowDownRight className="w-3 h-3 text-error" />;
    }
    return null;
  };

  const getMetricIcon = (category: FinancialMetric['category']) => {
    switch (category) {
      case 'revenue': return <DollarSign className="w-4 h-4" />;
      case 'costs': return <Receipt className="w-4 h-4" />;
      case 'profit': return <TrendingUp className="w-4 h-4" />;
      case 'cash': return <Wallet className="w-4 h-4" />;
      default: return <Calculator className="w-4 h-4" />;
    }
  };

  const getMetricColor = (category: FinancialMetric['category']) => {
    switch (category) {
      case 'revenue': return 'success';
      case 'costs': return 'error';
      case 'profit': return 'primary';
      case 'cash': return 'warning';
      default: return 'secondary';
    }
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? mockFinancialMetrics 
    : mockFinancialMetrics.filter(metric => metric.category === selectedCategory);

  const visibleMetrics = filteredMetrics.filter(metric => {
    if (!metric.isLocked) return true;
    if (metric.planRequired === 'business' && ['business', 'premium'].includes(userPlan)) return true;
    if (metric.planRequired === 'premium' && userPlan === 'premium') return true;
    return false;
  });

  const lockedMetrics = filteredMetrics.filter(metric => {
    if (!metric.isLocked) return false;
    if (metric.planRequired === 'business' && userPlan === 'basic') return true;
    if (metric.planRequired === 'premium' && userPlan !== 'premium') return true;
    return false;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">💰 Financial Analytics</h2>
          <p className="text-muted-foreground">
            Umfassende Finanzanalyse mit P&L, Cashflow und Kostenstruktur
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kennzahlen</SelectItem>
              <SelectItem value="revenue">💰 Umsatz</SelectItem>
              <SelectItem value="costs">💸 Kosten</SelectItem>
              <SelectItem value="profit">📈 Gewinn</SelectItem>
              <SelectItem value="cash">💳 Cashflow</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Tage</SelectItem>
              <SelectItem value="30d">30 Tage</SelectItem>
              <SelectItem value="90d">90 Tage</SelectItem>
              <SelectItem value="1y">1 Jahr</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="costs">Kosten</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
          <TabsTrigger value="forecasting">Prognose</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleMetrics.slice(0, 8).map((metric) => (
              <Card key={metric.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 bg-${getMetricColor(metric.category)}/10 rounded-lg flex items-center justify-center`}>
                    {getMetricIcon(metric.category)}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {metric.category}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {formatValue(metric.value, metric.format)}
                    </span>
                    {getTrendIcon(metric.trend, metric.change)}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className={`font-medium ${
                      metric.trend === 'up' ? 'text-success' : 
                      metric.trend === 'down' ? 'text-error' : 'text-muted-foreground'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="text-muted-foreground">vs. Vormonat</span>
                  </div>
                  {metric.target && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Ziel:</span>
                        <span>{formatValue(metric.target, metric.format)}</span>
                      </div>
                      <Progress 
                        value={(metric.value / metric.target) * 100} 
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Locked Metrics */}
          {lockedMetrics.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">🔒 Premium Financial Metrics</h3>
                <Badge variant="outline">
                  {userPlan === 'basic' ? 'Business Plan erforderlich' : 'Premium Plan erforderlich'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {lockedMetrics.map((metric) => (
                  <Card key={metric.id} className="p-6 opacity-60 relative">
                    <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                      <Badge variant="secondary">🔒 {metric.planRequired}</Badge>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                        {getMetricIcon(metric.category)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                      <div className="text-2xl font-bold text-muted-foreground">***</div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="text-center">
                <Button onClick={onUpgrade}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Plan upgraden für Financial Intelligence
                </Button>
              </div>
            </div>
          )}

          {/* Quick Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Gewinn & Verlust</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Umsatz</span>
                  <span className="font-medium text-success">€52.300</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Warenkosten</span>
                  <span className="font-medium text-error">-€18.500</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Personalkosten</span>
                  <span className="font-medium text-error">-€15.600</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Betriebskosten</span>
                  <span className="font-medium text-error">-€7.100</span>
                </div>
                <hr className="border-muted" />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Nettogewinn</span>
                  <span className="font-bold text-primary">€11.100</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Profitabilität nach Kategorie</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">🥤 Getränke</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">28.5%</span>
                    <ArrowUpRight className="w-3 h-3 text-success" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">🍝 Hauptspeisen</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">22.1%</span>
                    <ArrowUpRight className="w-3 h-3 text-success" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">🍰 Desserts</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">18.3%</span>
                    <div className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">🥗 Vorspeisen</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">12.7%</span>
                    <ArrowDownRight className="w-3 h-3 text-error" />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Cashflow Situation</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Einnahmen</span>
                  <span className="font-medium text-success">€54.200</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ausgaben</span>
                  <span className="font-medium text-error">€44.400</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Netto-Cashflow</span>
                  <span className="font-medium text-primary">€9.800</span>
                </div>
                <hr className="border-muted" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Liquidität</span>
                  <Badge variant="default" className="bg-success">Gut</Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* P&L Tab */}
        <TabsContent value="pnl" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Detaillierte P&L Rechnung</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Umsatzerlöse</span>
                    <span className="text-success">€52.300</span>
                  </div>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Speisen-Umsatz</span>
                      <span>€38.400</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Getränke-Umsatz</span>
                      <span>€13.900</span>
                    </div>
                  </div>
                </div>

                <hr className="border-muted" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between font-medium">
                    <span>Warenkosten</span>
                    <span className="text-error">-€18.500</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-semibold text-primary">
                    <span>Bruttogewinn</span>
                    <span>€33.800</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Bruttomarge: 64.6%
                  </div>
                </div>

                <hr className="border-muted" />

                <div className="space-y-2">
                  <div className="font-medium">Betriebskosten</div>
                  <div className="ml-4 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Personalkosten</span>
                      <span>€15.600</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Miete & Nebenkosten</span>
                      <span>€5.300</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Marketing</span>
                      <span>€1.800</span>
                    </div>
                  </div>
                </div>

                <hr className="border-muted" />

                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Nettogewinn</span>
                  <span className="text-success">€11.100</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Nettomarge: 21.2%
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Jahresvergleich</h4>
              <div className="space-y-4">
                {[
                  { month: 'Jan 2024', revenue: 48200, profit: 9800, margin: 20.3 },
                  { month: 'Feb 2024', revenue: 51100, profit: 10650, margin: 20.8 },
                  { month: 'Mar 2024', revenue: 49800, profit: 9600, margin: 19.3 },
                  { month: 'Apr 2024', revenue: 52300, profit: 11100, margin: 21.2 }
                ].map((data, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{data.month}</span>
                      <Badge variant="outline">{data.margin}% Marge</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Umsatz</div>
                        <div className="font-medium">€{data.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Gewinn</div>
                        <div className="font-medium text-success">€{data.profit.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Kostenstruktur-Analyse</h4>
              <div className="space-y-4">
                {mockCostBreakdown.map((category, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">€{category.amount.toLocaleString()}</span>
                        <Badge variant="secondary">{category.percentage}%</Badge>
                        <span className={`text-sm ${
                          category.change > 0 ? 'text-error' : 'text-success'
                        }`}>
                          {category.change > 0 ? '+' : ''}{category.change}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4 space-y-2">
                      {category.subcategories.map((sub, subIndex) => (
                        <div key={subIndex} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{sub.name}</span>
                          <div className="flex items-center gap-2">
                            <span>€{sub.amount.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">({sub.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Kosten-Optimierung</h4>
              <div className="space-y-4">
                <div className="p-4 bg-error/10 rounded-lg border border-error/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-error" />
                    <span className="font-medium text-error">Hohe Personalkosten</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Personalkosten 29.8% des Umsatzes - Branchendurchschnitt: 25%
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Schichtplanung optimieren
                  </Button>
                </div>
                
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="font-medium text-warning">Energiekosten steigen</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    +15% Energiekosten vs. Vormonat - Effizienzmaßnahmen empfohlen
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Energieaudit starten
                  </Button>
                </div>
                
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="font-medium text-success">Warenkosten optimiert</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Warenkosten unter Branchendurchschnitt - gute Einkaufsverhandlungen
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Cashflow Tab */}
        <TabsContent value="cashflow" className="space-y-6">
          {userPlan === 'basic' ? (
            <Card className="p-8 text-center border-warning/20 bg-warning/5">
              <div className="w-16 h-16 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold mb-2">Cashflow-Analyse</h3>
              <p className="text-muted-foreground mb-6">
                Detaillierte Cashflow-Analyse und Liquiditäts-Management
              </p>
              <Button onClick={onUpgrade} size="lg">
                <CreditCard className="w-5 h-5 mr-2" />
                Premium upgraden für Cashflow-Intelligence
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Cashflow-Statement</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="font-medium">Operative Cashflows</div>
                    <div className="ml-4 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Nettogewinn</span>
                        <span className="text-success">€11.100</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Abschreibungen</span>
                        <span>€2.400</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Forderungsänderung</span>
                        <span className="text-error">-€1.200</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-muted" />

                  <div className="space-y-2">
                    <div className="font-medium">Investitions-Cashflows</div>
                    <div className="ml-4 space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Gerätekäufe</span>
                        <span className="text-error">-€3.500</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Renovierungen</span>
                        <span className="text-error">-€1.800</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-muted" />

                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Netto-Cashflow</span>
                    <span className="text-primary">€9.800</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold mb-4">Liquiditäts-Prognose</h4>
                <div className="space-y-4">
                  <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Aktuelle Liquidität</span>
                      <Badge variant="default" className="bg-success">Sehr gut</Badge>
                    </div>
                    <div className="text-2xl font-bold text-success">€28.400</div>
                    <div className="text-sm text-muted-foreground">
                      Ausreichend für 3,2 Monate Betrieb
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium">Kommende Zahlungen</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Miete (15.05.)</span>
                        <span className="font-medium text-error">-€3.500</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Gehälter (31.05.)</span>
                        <span className="font-medium text-error">-€11.200</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Lieferanten (10.05.)</span>
                        <span className="font-medium text-error">-€6.800</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          {userPlan !== 'premium' ? (
            <Card className="p-8 text-center border-primary/20 bg-primary/5">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Financial Forecasting</h3>
              <p className="text-muted-foreground mb-6">
                KI-basierte Finanzprognosen und Planungstools
              </p>
              <Button onClick={onUpgrade} size="lg">
                <Zap className="w-5 h-5 mr-2" />
                Premium upgraden für AI Forecasting
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Umsatz-Prognose</h4>
                <div className="space-y-4">
                  {[
                    { month: 'Mai 2024', predicted: 54800, confidence: 87, factors: ['Saisonalität +8%', 'Marketing +3%'] },
                    { month: 'Jun 2024', predicted: 58200, confidence: 82, factors: ['Sommersaison +12%', 'Events +5%'] },
                    { month: 'Jul 2024', predicted: 61500, confidence: 78, factors: ['Peak Season +18%', 'Tourismus +8%'] }
                  ].map((forecast, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{forecast.month}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{forecast.confidence}% Konfidenz</Badge>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-success mb-2">
                        €{forecast.predicted.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Prognose-Faktoren:</p>
                        <ul className="list-disc list-inside ml-2">
                          {forecast.factors.map((factor, i) => (
                            <li key={i}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold mb-4">Kosten-Prognose</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-warning" />
                      <span className="font-medium text-warning">Kostenrisiken</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• Energiekosten: +12% erwartet (Juni)</li>
                      <li>• Personalkosten: +8% (Tariflohnerhöhung)</li>
                      <li>• Rohstoffpreise: +5% (Inflation)</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="font-medium text-success">Optimierungspotentiale</span>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• Automatisierung: -6% Personalkosten möglich</li>
                      <li>• Menü-Optimierung: -3% Warenkosten</li>
                      <li>• Energieeffizienz: -8% Nebenkosten</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}