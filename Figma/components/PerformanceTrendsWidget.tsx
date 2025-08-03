import React, { useState, useEffect } from 'react';
import { RotateCcw, Download, TrendingUp, Euro, Star, Eye, Users, Target, Lightbulb, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { WidgetStateWrapper, SkeletonText, SkeletonCard } from './WidgetStates';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

const PerformanceTrendsWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('12M');

  const timePeriods = [
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '12M', value: '12M' },
    { label: '24M', value: '24M' }
  ];

  // Sample data for charts
  const revenueData = [
    { month: 'Jan', value: 180000 },
    { month: 'Feb', value: 165000 },
    { month: 'Mar', value: 195000 },
    { month: 'Apr', value: 210000 },
    { month: 'May', value: 235000 },
    { month: 'Jun', value: 250000 },
    { month: 'Jul', value: 268000 },
    { month: 'Aug', value: 245000 },
    { month: 'Sep', value: 255000 },
    { month: 'Oct', value: 270000 },
    { month: 'Nov', value: 285000 },
    { month: 'Dec', value: 290000 }
  ];

  const ratingData = [
    { month: 'Jan', value: 4.0 },
    { month: 'Feb', value: 4.0 },
    { month: 'Mar', value: 4.1 },
    { month: 'Apr', value: 4.1 },
    { month: 'May', value: 4.2 },
    { month: 'Jun', value: 4.2 },
    { month: 'Jul', value: 4.3 },
    { month: 'Aug', value: 4.2 },
    { month: 'Sep', value: 4.3 },
    { month: 'Oct', value: 4.3 },
    { month: 'Nov', value: 4.3 },
    { month: 'Dec', value: 4.3 }
  ];

  const visibilityData = [
    { month: 'Jan', value: 75 },
    { month: 'Feb', value: 72 },
    { month: 'Mar', value: 78 },
    { month: 'Apr', value: 80 },
    { month: 'May', value: 82 },
    { month: 'Jun', value: 84 },
    { month: 'Jul', value: 86 },
    { month: 'Aug', value: 85 },
    { month: 'Sep', value: 87 },
    { month: 'Oct', value: 87 },
    { month: 'Nov', value: 87 },
    { month: 'Dec', value: 87 }
  ];

  const customerData = [
    { month: 'Jan', value: 2100 },
    { month: 'Feb', value: 1950 },
    { month: 'Mar', value: 2250 },
    { month: 'Apr', value: 2400 },
    { month: 'May', value: 2650 },
    { month: 'Jun', value: 2800 },
    { month: 'Jul', value: 2950 },
    { month: 'Aug', value: 2750 },
    { month: 'Sep', value: 2850 },
    { month: 'Oct', value: 2900 },
    { month: 'Nov', value: 2850 },
    { month: 'Dec', value: 2847 }
  ];

  const trendCards = [
    {
      id: 'revenue',
      icon: Euro,
      iconColor: 'text-white',
      iconBg: 'bg-success',
      value: '€2.34M',
      label: 'Jahresumsatz',
      trend: '+18.5%',
      trendDirection: 'up',
      subtext: 'Ziel 2025: €2.8M',
      chartType: 'sparkline',
      data: revenueData
    },
    {
      id: 'rating',
      icon: Star,
      iconColor: 'text-white',
      iconBg: 'bg-primary',
      value: '4.3★',
      label: 'Durchschnittsbewertung',
      trend: '+0.3★',
      trendDirection: 'up',
      subtext: 'Branche: 4.1★',
      chartType: 'line',
      data: ratingData
    },
    {
      id: 'visibility',
      icon: Eye,
      iconColor: 'text-white',
      iconBg: 'bg-purple-500',
      value: '87%',
      label: 'Visibility Score',
      trend: '+12%',
      trendDirection: 'up',
      subtext: 'Q4 Ziel: 92%',
      chartType: 'area',
      data: visibilityData
    },
    {
      id: 'customers',
      icon: Users,
      iconColor: 'text-white',
      iconBg: 'bg-orange-500',
      value: '2,847',
      label: 'Monatliche Kunden',
      trend: '+24%',
      trendDirection: 'up',
      subtext: '68% Wiederkehr',
      chartType: 'bar',
      data: customerData
    }
  ];

  const insights = [
    {
      icon: '💡',
      type: 'success',
      text: 'Stärkste Phase: Mai-Juli (+32%)'
    },
    {
      icon: '⚠️',
      type: 'warning',
      text: 'Schwäche: Jan-Feb (-18%)'
    },
    {
      icon: '🎯',
      type: 'info',
      text: 'Potenzial: Weekend-Reservierungen'
    }
  ];

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
  }, [selectedPeriod]);

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

  // Mobile-optimized chart rendering with consistent 120px width and 32px height
  const renderMiniChart = (card: typeof trendCards[0]) => {
    if (!card.data || card.data.length === 0) {
      return null;
    }

    const chartProps = {
      data: card.data
    };

    switch (card.chartType) {
      case 'sparkline':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...chartProps}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-success)" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart {...chartProps}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-primary)" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart {...chartProps}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-chart-5)" 
                fill="var(--color-chart-5)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart {...chartProps}>
              <Bar dataKey="value" fill="var(--color-chart-4)" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success-light text-success border-success/20';
      case 'warning':
        return 'bg-warning-light text-warning border-warning/20';
      case 'info':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Skeleton component for loading state
  const skeletonComponent = (
    <CardContent className="widget-padding">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} height="h-24" />
          ))}
        </div>
        <div className="space-y-2">
          <SkeletonText lines={3} />
        </div>
      </div>
    </CardContent>
  );

  return (
    <Card className="bg-card shadow-sm border border-border widget-card" style={{ height: '400px' }}>
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle className="headline-lg text-foreground">Performance-Trends</CardTitle>
          
          <div className="flex items-center justify-between md:justify-end space-x-4">
            {/* Time Period Selector */}
            <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
              {timePeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-3 py-1 caption font-medium rounded transition-all duration-150 ${
                    selectedPeriod === period.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button 
                className="touch-target p-2 rounded hover:bg-accent button-hover flex items-center justify-center"
                onClick={(event) => {
                  console.log('Exporting Performance Trends data...');
                  event.currentTarget.classList.add('success-flash');
                  setTimeout(() => event.currentTarget.classList.remove('success-flash'), 600);
                }}
                title="Export Data"
                disabled={isLoading}
              >
                <Download className="icon-sm text-muted-foreground hover:text-primary transition-colors duration-150" />
              </button>
              <button 
                className={`touch-target p-2 rounded hover:bg-accent button-hover flex items-center justify-center ${isLoading ? 'refresh-rotate rotating' : 'refresh-rotate'}`}
                onClick={handleRefresh}
                title="Refresh Data"
                disabled={isLoading}
              >
                <RotateCcw className={`icon-sm text-muted-foreground hover:text-primary transition-colors duration-150 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <WidgetStateWrapper
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        skeletonComponent={skeletonComponent}
        emptyTitle="Keine Performance-Daten verfügbar"
        emptyDescription="Performance-Trends werden geladen..."
        emptyIcon={Target}
      >
        <CardContent className="widget-padding pt-0 space-y-4">
          {/* Mobile: 1x4 Vertical List - Tablet/Desktop: 2x2 Grid */}
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            {trendCards.map((card) => {
              const IconComponent = card.icon;
              return (
                <div 
                  key={card.id}
                  className="bg-card border border-border rounded-lg p-4 trend-card-hover touch-target"
                  style={{ minHeight: '120px' }}
                >
                  <div className="h-full flex flex-col justify-between">
                    {/* Header with Icon and Trend */}
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-8 h-8 rounded-full ${card.iconBg} bg-opacity-100 flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span className="caption font-bold text-success">
                          {card.trend}
                        </span>
                      </div>
                    </div>

                    {/* Value and Label */}
                    <div className="mb-2">
                      <div className="metric-md text-foreground">{card.value}</div>
                      <div className="caption text-muted-foreground">{card.label}</div>
                    </div>

                    {/* Mini Chart and Subtext - Mobile Optimized */}
                    <div className="flex items-center justify-between">
                      <div className="chart-element" style={{ width: '120px', height: '32px' }}>
                        {renderMiniChart(card)}
                      </div>
                      <div className="caption text-caption-foreground text-right ml-2 flex-shrink-0">
                        {card.subtext}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insights Section */}
          <div className="space-y-2">
            <h4 className="body-md font-medium text-foreground">Strategische Insights</h4>
            <div className="grid grid-cols-1 gap-2">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg border insight-badge ${getInsightBadgeColor(insight.type)}`}
                >
                  <span className="text-base">{insight.icon}</span>
                  <span className="caption font-medium flex-1">
                    {insight.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default PerformanceTrendsWidget;