import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ScatterChart, Scatter, Cell, Tooltip, ReferenceArea } from 'recharts';
import { Users, Eye, TrendingUp, MousePointer, RotateCcw, Download, BarChart3, Euro, Star, Settings, BookOpen, Calendar, UserPlus, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import TimeSelector from './TimeSelector';
import { WidgetStateWrapper, SkeletonChart, SkeletonCard } from './WidgetStates';

const AnalyticsWidget = () => {
  const [activeTab, setActiveTab] = useState('google');
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('7t');
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const handleTimePeriodChange = (period: string, loading: boolean) => {
    setTimePeriod(period);
    setIsLoading(loading);
    if (!loading) {
      console.log(`Analytics data updated for period: ${period}`);
    }
  };

  // Simulate loading
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      setIsError(false);
      
      setTimeout(() => {
        const random = Math.random();
        if (random < 0.1) {
          setIsError(true);
        } else if (random < 0.15) {
          setIsEmpty(true);
        } else {
          setIsEmpty(false);
        }
        setIsLoading(false);
      }, Math.random() * 2000 + 1000);
    };

    loadData();
  }, []);

  const handleRetry = () => {
    setIsError(false);
    setIsEmpty(false);
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsEmpty(false);
    }, 1500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIsError(false);
    setIsEmpty(false);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  // Simplified data for mobile (fewer data points)
  const googleData = [
    { name: 'Mo', visits: 240, clicks: 45, impressions: 1200 },
    { name: 'Di', visits: 320, clicks: 62, impressions: 1450 },
    { name: 'Mi', visits: 280, clicks: 58, impressions: 1380 },
    { name: 'Do', visits: 390, clicks: 78, impressions: 1680 },
    { name: 'Fr', visits: 450, clicks: 89, impressions: 1820 },
    { name: 'Sa', visits: 520, clicks: 102, impressions: 2100 },
    { name: 'So', visits: 380, clicks: 71, impressions: 1520 }
  ];

  const socialData = [
    { name: 'Mo', engagement: 45, reach: 890, clicks: 23 },
    { name: 'Di', engagement: 52, reach: 1200, clicks: 31 },
    { name: 'Mi', engagement: 48, reach: 1100, clicks: 28 },
    { name: 'Do', engagement: 67, reach: 1350, clicks: 42 },
    { name: 'Fr', engagement: 78, reach: 1450, clicks: 48 },
    { name: 'Sa', engagement: 89, reach: 1680, clicks: 56 },
    { name: 'So', engagement: 65, reach: 1280, clicks: 38 }
  ];

  // Mobile simplified data (every other day)
  const mobileGoogleData = googleData.filter((_, index) => index % 2 === 0);
  const mobileSocialData = socialData.filter((_, index) => index % 2 === 0);

  // Impact/Effort Matrix Data
  const actionBubbles = [
    { 
      name: "SMS No-Show Prevention", 
      effort: 25, 
      impact: 85, 
      roi: 180, 
      size: 1200,
      description: "No-Show Rate von 8.5% auf 4% reduzieren",
      timeline: "2-4 Wochen"
    },
    { 
      name: "Instagram Food Marketing", 
      effort: 45, 
      impact: 70, 
      roi: 140, 
      size: 800,
      description: "Social Reichweite +300%, Neukunden +25%",
      timeline: "Sofort starten"
    },
    { 
      name: "Corporate Catering", 
      effort: 65, 
      impact: 90, 
      roi: 220, 
      size: 1500,
      description: "Neuer Revenue Stream, €50K+ zusätzlich",
      timeline: "3-6 Monate"
    },
    { 
      name: "Loyalty Program", 
      effort: 75, 
      impact: 60, 
      roi: 110, 
      size: 600,
      description: "Kundenbindung +15%, Wiederkäufe +25%",
      timeline: "4-8 Wochen"
    },
    { 
      name: "Staff Training Plus", 
      effort: 40, 
      impact: 50, 
      roi: 95, 
      size: 400,
      description: "Service-Qualität +20%, Mitarbeiterzufriedenheit +10%",
      timeline: "6-12 Wochen"
    },
    { 
      name: "Menu Optimization", 
      effort: 30, 
      impact: 65, 
      roi: 125, 
      size: 700,
      description: "Profitabilität +18%, Bestelleffizienz +12%",
      timeline: "3-5 Wochen"
    }
  ];

  // Get bubble color based on ROI using design tokens
  const getBubbleColor = (roi: number) => {
    if (roi >= 150) return 'var(--color-success)'; // Green - High ROI
    if (roi >= 120) return 'var(--color-chart-1)'; // Blue - Medium-High ROI
    if (roi >= 100) return 'var(--color-warning)'; // Yellow - Medium ROI
    return 'var(--color-error)'; // Red - Low ROI
  };

  // Priority Actions (Top 3)
  const priorityActions = actionBubbles
    .sort((a, b) => {
      // Sort by impact first, then by ROI, then by effort (lower is better)
      if (b.impact !== a.impact) return b.impact - a.impact;
      if (b.roi !== a.roi) return b.roi - a.roi;
      return a.effort - b.effort;
    })
    .slice(0, 3);

  const MetricCard = ({ icon: Icon, title, value, change, color = "text-success" }) => (
    <div className="bg-muted p-2 md:p-3 rounded-lg">
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <Icon className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
        <span className={`text-xs font-medium ${color}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      </div>
      <div className="text-sm md:text-lg font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{title}</div>
    </div>
  );

  const skeletonComponent = (
    <CardContent>
      <div className="space-y-3 md:space-y-4">
        {/* Tabs Skeleton */}
        <div className="flex bg-muted rounded-md p-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex-1 h-8 bg-border rounded animate-pulse mx-1"></div>
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Chart Skeleton */}
        <SkeletonChart height="h-24 md:h-32" />
      </div>
    </CardContent>
  );

  return (
    <Card className="h-full bg-card shadow-sm border border-border widget-card">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4">
            <CardTitle className="text-base md:text-lg text-foreground">Multi-Platform Analytics</CardTitle>
            <TimeSelector 
              defaultPeriod="7t" 
              onPeriodChange={handleTimePeriodChange}
            />
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <button 
              className="w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-accent button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block"
              onClick={(event) => {
                console.log('Exporting Analytics data...');
                event.currentTarget.classList.add('success-flash');
                setTimeout(() => event.currentTarget.classList.remove('success-flash'), 600);
              }}
              title="Export Data"
              disabled={isLoading}
            >
              <Download className="w-4 h-4 md:w-full md:h-full text-muted-foreground hover:text-primary transition-colors duration-150" />
            </button>
            <button 
              className={`w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-accent button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block ${isLoading ? 'refresh-rotate rotating' : 'refresh-rotate'}`}
              onClick={handleRefresh}
              title="Refresh Data"
              disabled={isLoading}
            >
              <RotateCcw className={`w-4 h-4 md:w-full md:h-full text-muted-foreground hover:text-primary transition-colors duration-150 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      
      <WidgetStateWrapper
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        skeletonComponent={skeletonComponent}
        emptyTitle="Keine Analytics-Daten verfügbar"
        emptyDescription="Warte auf Traffic-Daten..."
        emptyIcon={BarChart3}
      >
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-4">
            <TabsList className="grid w-full grid-cols-5 bg-muted">
              <TabsTrigger value="google" className="text-xs md:text-sm">Google Analytics</TabsTrigger>
              <TabsTrigger value="search" className="text-xs md:text-sm">Search Console</TabsTrigger>
              <TabsTrigger value="social" className="text-xs md:text-sm">Social Media</TabsTrigger>
              <TabsTrigger value="bsc" className="text-xs md:text-sm">BSC</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs md:text-sm">Empfehlungen</TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <MetricCard 
                  icon={Users} 
                  title="Besucher" 
                  value="2,847" 
                  change={12.5} 
                />
                <MetricCard 
                  icon={Eye} 
                  title="Seitenaufrufe" 
                  value="4,326" 
                  change={8.3} 
                />
                <MetricCard 
                  icon={TrendingUp} 
                  title="Conversion" 
                  value="3.2%" 
                  change={-2.1}
                  color="text-error" 
                />
              </div>
              <div className="h-24 md:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={window.innerWidth < 768 ? mobileGoogleData : googleData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                    <YAxis hide />
                    <Line 
                      type="monotone" 
                      dataKey="visits" 
                      stroke="var(--color-success)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-success)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "var(--color-success)", strokeWidth: 2, fill: "var(--card)", className: "animate-pulse" }}
                      className="chart-element"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <MetricCard 
                  icon={Eye} 
                  title="Impressionen" 
                  value="12.4K" 
                  change={15.7} 
                />
                <MetricCard 
                  icon={MousePointer} 
                  title="Klicks" 
                  value="421" 
                  change={9.2} 
                />
                <MetricCard 
                  icon={TrendingUp} 
                  title="CTR" 
                  value="3.4%" 
                  change={5.1} 
                />
              </div>
              <div className="h-24 md:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={window.innerWidth < 768 ? mobileGoogleData : googleData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                    <YAxis hide />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="var(--color-success)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-success)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "var(--color-success)", strokeWidth: 2, fill: "var(--card)", className: "animate-pulse" }}
                      className="chart-element"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <MetricCard 
                  icon={Users} 
                  title="Reichweite" 
                  value="8.9K" 
                  change={22.3} 
                />
                <MetricCard 
                  icon={TrendingUp} 
                  title="Engagement" 
                  value="6.7%" 
                  change={18.5} 
                />
                <MetricCard 
                  icon={MousePointer} 
                  title="Klicks" 
                  value="234" 
                  change={-4.2}
                  color="text-error" 
                />
              </div>
              <div className="h-24 md:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={window.innerWidth < 768 ? mobileSocialData : socialData}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs" />
                    <YAxis hide />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="var(--color-success)" 
                      strokeWidth={2}
                      dot={{ fill: "var(--color-success)", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "var(--color-success)", strokeWidth: 2, fill: "var(--card)", className: "animate-pulse" }}
                      className="chart-element"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="bsc" className="space-y-4">
              {/* Balanced Scorecard 2x2 Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Perspective */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-success px-4 py-3">
                    <h3 className="text-white font-medium flex items-center space-x-2">
                      <span>💰</span>
                      <span className="text-sm md:text-base">Finanzielle Leistung</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Umsatzwachstum</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">18.5%</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;15%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">EBITDA-Marge</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">12.3%</span>
                        <span className="text-warning">⚠️</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;15%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Kosteneffizienz</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">87%</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;85%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">ROI Marketing</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">5.8x</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;4x</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Cash Flow</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">€145K</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;€120K</div>
                  </div>
                </div>

                {/* Customer Perspective */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-primary px-4 py-3">
                    <h3 className="text-white font-medium flex items-center space-x-2">
                      <span>👥</span>
                      <span className="text-sm md:text-base">Kundenzufriedenheit</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Kundenzufriedenheit</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">4.3★</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;4.0★</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">NPS Score</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">+42</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;+30</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Kundenbindung</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">68%</span>
                        <span className="text-warning">⚠️</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;75%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Beschwerden</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">2.1%</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &lt;3%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Weiterempfehlung</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">78%</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;70%</div>
                  </div>
                </div>

                {/* Process Perspective */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-purple-500 px-4 py-3">
                    <h3 className="text-white font-medium flex items-center space-x-2">
                      <span>⚙️</span>
                      <span className="text-sm md:text-base">Interne Prozesse</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Lieferzeit</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">23min</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &lt;25min</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Reservierung-Effizienz</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">91.5%</span>
                        <span className="text-warning">⚠️</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;95%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Qualitätskontrolle</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">96%</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;95%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Digitalisierungsgrad</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">78%</span>
                        <span className="text-warning">⚠️</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;85%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Bestellfehler</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">1.2%</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &lt;2%</div>
                  </div>
                </div>

                {/* Learning & Development Perspective */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="bg-orange-500 px-4 py-3">
                    <h3 className="text-white font-medium flex items-center space-x-2">
                      <span>📚</span>
                      <span className="text-sm md:text-base">Lernen & Entwicklung</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Mitarbeiterzufriedenheit</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">8.2/10</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;8.0</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Schulungsstunden</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">32h/Jahr</span>
                        <span className="text-warning">⚠️</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;40h</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Innovation-Score</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">72%</span>
                        <span className="text-warning">⚠️</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;80%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Technologie-Adoption</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">85%</span>
                        <span className="text-success">✅</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &gt;80%</div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Mitarbeiterfluktuation</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs md:text-sm font-medium">15%</span>
                        <span className="text-warning">⚠️</span>
                      </div>
                    </div>
                    <div className="text-xs text-caption-foreground">Ziel: &lt;20%</div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="body-md font-medium text-foreground mb-3">Strategische Prioritäten</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">🚨 Kritische Bereiche</span>
                    <span className="text-warning font-medium">EBITDA-Marge, Kundenbindung</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">✅ Stärken</span>
                    <span className="text-success font-medium">Kundenzufriedenheit, Kosteneffizienz</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">🎯 Nächste Schritte</span>
                    <span className="text-primary font-medium">Personal schulen, Digitalisierung</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {/* Impact/Effort Matrix */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="body-md font-medium text-foreground mb-3">Impact/Effort Matrix</h4>
                <div className="h-48 md:h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis 
                        type="number" 
                        dataKey="effort" 
                        name="Aufwand" 
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="impact" 
                        name="Impact" 
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
                                <p className="font-medium text-foreground">{data.name}</p>
                                <p className="text-xs text-muted-foreground">{data.description}</p>
                                <p className="text-xs text-caption-foreground mt-1">ROI: {data.roi}% | {data.timeline}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter data={actionBubbles}>
                        {actionBubbles.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBubbleColor(entry.roi)} />
                        ))}
                      </Scatter>
                      
                      {/* Quadrant lines */}
                      <ReferenceArea x1={0} x2={50} y1={50} y2={100} fill="var(--color-success)" fillOpacity={0.1} />
                      <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="var(--color-warning)" fillOpacity={0.1} />
                      <ReferenceArea x1={0} x2={50} y1={0} y2={50} fill="var(--color-chart-1)" fillOpacity={0.1} />
                      <ReferenceArea x1={50} x2={100} y1={0} y2={50} fill="var(--color-error)" fillOpacity={0.1} />
                    </ScatterChart>
                  </ResponsiveContainer>
                  
                  {/* Quadrant Labels */}
                  <div className="absolute top-2 left-2 text-xs font-medium text-success">Quick Wins</div>
                  <div className="absolute top-2 right-2 text-xs font-medium text-warning">Major Projects</div>
                  <div className="absolute bottom-2 left-2 text-xs font-medium text-chart-1">Fill-ins</div>
                  <div className="absolute bottom-2 right-2 text-xs font-medium text-error">Thankless Tasks</div>
                </div>
              </div>

              {/* Priority Actions */}
              <div className="space-y-3">
                <h4 className="body-md font-medium text-foreground">Top 3 Empfehlungen</h4>
                {priorityActions.map((action, index) => (
                  <div key={action.name} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={`px-2 py-1 text-xs ${index === 0 ? 'bg-success text-white' : index === 1 ? 'bg-warning text-white' : 'bg-primary text-white'}`}>
                          #{index + 1}
                        </Badge>
                        <h5 className="body-md font-medium text-foreground">{action.name}</h5>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-success font-medium">ROI: {action.roi}%</div>
                        <div className="text-xs text-caption-foreground">{action.timeline}</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <span className="text-caption-foreground">Aufwand:</span>
                        <Progress value={action.effort} className="w-12 h-2" />
                        <span className="text-muted-foreground">{action.effort}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-caption-foreground">Impact:</span>
                        <Progress value={action.impact} className="w-12 h-2" />
                        <span className="text-muted-foreground">{action.impact}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default AnalyticsWidget;