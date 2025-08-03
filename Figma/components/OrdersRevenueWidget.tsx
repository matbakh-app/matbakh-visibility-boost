import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ShoppingBag, Euro, Star, TrendingUp, RotateCcw, Download, Package } from 'lucide-react';
import TimeSelector from './TimeSelector';
import { WidgetStateWrapper, SkeletonChart, SkeletonCard, SkeletonList } from './WidgetStates';

const OrdersRevenueWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('heute');
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const handleTimePeriodChange = (period: string, loading: boolean) => {
    setTimePeriod(period);
    setIsLoading(loading);
    if (!loading) {
      console.log(`Orders & Revenue data updated for period: ${period}`);
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

  const platformData = [
    { platform: 'UberEats', orders: 45, revenue: 1280, rating: 4.5 },
    { platform: 'Deliveroo', orders: 32, revenue: 890, rating: 4.3 },
    { platform: 'Lieferando', orders: 28, revenue: 750, rating: 4.7 },
    { platform: 'Direkt', orders: 18, revenue: 520, rating: 4.8 }
  ];

  const totalOrders = platformData.reduce((sum, p) => sum + p.orders, 0);
  const totalRevenue = platformData.reduce((sum, p) => sum + p.revenue, 0);
  const averageOrder = totalRevenue / totalOrders;
  const averageRating = platformData.reduce((sum, p) => sum + p.rating, 0) / platformData.length;

  const KPICard = ({ icon: Icon, title, value, subtitle, color = "text-success" }) => (
    <div className="text-center p-2 md:p-3 bg-muted rounded-lg">
      <div className="flex items-center justify-center mb-1 md:mb-2">
        <Icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
      </div>
      <div className={`text-sm md:text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{title}</div>
      {subtitle && <div className="text-xs text-caption-foreground mt-1">{subtitle}</div>}
    </div>
  );

  const CustomBar = (props: any) => {
    const { fill, ...rest } = props;
    return <Bar {...rest} fill="var(--color-success)" radius={[2, 2, 0, 0]} className="chart-element" />;
  };

  const skeletonComponent = (
    <CardContent className="space-y-4 md:space-y-6">
      {/* Chart Skeleton */}
      <div>
        <div className="w-48 h-4 bg-muted rounded animate-pulse mb-3"></div>
        <SkeletonChart height="h-24 md:h-32" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* List Skeleton */}
      <div>
        <div className="w-32 h-4 bg-muted rounded animate-pulse mb-3"></div>
        <SkeletonList items={4} />
      </div>
    </CardContent>
  );

  return (
    <Card className="h-full bg-card shadow-sm border border-border widget-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4">
            <CardTitle className="text-base md:text-lg text-foreground">Bestellungen & Umsatz</CardTitle>
            <TimeSelector 
              defaultPeriod="heute" 
              onPeriodChange={handleTimePeriodChange}
            />
          </div>
          <div className="flex items-center space-x-1 md:space-x-3">
            <button 
              className="w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-accent button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block"
              onClick={(event) => {
                console.log('Exporting Orders & Revenue data...');
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
        emptyTitle="Keine Bestelldaten verfügbar"
        emptyDescription="Warte auf erste Bestellungen..."
        emptyIcon={Package}
      >
        <CardContent className="space-y-4 md:space-y-6">
          {/* Platform Orders Chart */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Bestellungen nach Plattform</h4>
            <div className="h-24 md:h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis 
                    dataKey="platform" 
                    axisLine={false} 
                    tickLine={false} 
                    className="text-xs"
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis hide />
                  <CustomBar dataKey="orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <KPICard 
              icon={Euro} 
              title="Gesamtumsatz" 
              value={`€${totalRevenue.toLocaleString()}`}
              subtitle="+12% vs. gestern"
            />
            <KPICard 
              icon={ShoppingBag} 
              title="Durchschnitt" 
              value={`€${averageOrder.toFixed(0)}`}
              subtitle="pro Bestellung"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <KPICard 
              icon={Star} 
              title="Bewertung" 
              value={averageRating.toFixed(1)}
              subtitle="Durchschnitt"
            />
            <KPICard 
              icon={TrendingUp} 
              title="Bestellungen" 
              value={totalOrders.toString()}
              subtitle="heute"
            />
          </div>

          {/* Platform Details - Vertical cards on mobile */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Platform Details</h4>
            <div className="space-y-2 md:space-y-1">
              {platformData.map((platform, index) => (
                <div key={index} className="md:flex md:items-center md:justify-between text-xs bg-muted md:bg-transparent p-2 md:p-0 rounded md:rounded-none">
                  <span className="text-muted-foreground font-medium md:font-normal">{platform.platform}</span>
                  <div className="flex items-center justify-between md:justify-end md:space-x-3 mt-1 md:mt-0">
                    <span className="text-foreground font-medium">{platform.orders} Bestellungen</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span className="text-muted-foreground">{platform.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default OrdersRevenueWidget;