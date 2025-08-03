import React, { useState, useEffect } from 'react';
import { RotateCcw, Download, TrendingUp, TrendingDown, ArrowRight, Target, Users, Star, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { WidgetStateWrapper, SkeletonText, SkeletonCard, SkeletonList } from './WidgetStates';

const CompetitorMonitoringWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30T');

  const timePeriods = [
    { label: '7T', value: '7T' },
    { label: '30T', value: '30T' },
    { label: '90T', value: '90T' }
  ];

  const competitors = [
    {
      id: 1,
      name: 'matbakh Restaurant',
      rating: 4.3,
      reviews: 127,
      priceLevel: '€€€',
      distance: '—',
      trend: 0,
      trendValue: '—',
      isOwn: true
    },
    {
      id: 2,
      name: 'Zur Letzten Instanz',
      rating: 4.2,
      reviews: 847,
      priceLevel: '€€€',
      distance: '0.3km',
      trend: 1,
      trendValue: '+0.1',
      isOwn: false
    },
    {
      id: 3,
      name: 'Restaurant Tim Raue',
      rating: 4.6,
      reviews: 1203,
      priceLevel: '€€€€',
      distance: '0.8km',
      trend: 0,
      trendValue: '0.0',
      isOwn: false
    },
    {
      id: 4,
      name: 'Lokal Modern',
      rating: 4.1,
      reviews: 456,
      priceLevel: '€€',
      distance: '0.5km',
      trend: -1,
      trendValue: '-0.2',
      isOwn: false
    },
    {
      id: 5,
      name: 'Prenzlauer Garten',
      rating: 4.4,
      reviews: 623,
      priceLevel: '€€€',
      distance: '1.2km',
      trend: 1,
      trendValue: '+0.3',
      isOwn: false
    },
    {
      id: 6,
      name: 'Hackescher Hof',
      rating: 3.9,
      reviews: 789,
      priceLevel: '€€',
      distance: '0.7km',
      trend: 1,
      trendValue: '+0.1',
      isOwn: false
    }
  ];

  const kpiData = {
    ranking: {
      position: 2,
      total: 47,
      category: 'Premium-Kategorie',
      badge: 'Top 5%'
    },
    rating: {
      value: 4.3,
      average: 4.1,
      comparison: 'vs. 4.1★ Durchschnitt'
    },
    reviewVelocity: {
      weekly: 12,
      average: 8,
      trend: 'up'
    },
    pricing: {
      advantage: 15,
      segment: 'Premium-Segment',
      badge: 'Preis-Vorteil'
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

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-success" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-error" />;
    return <ArrowRight className="w-3 h-3 text-neutral" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-error';
    return 'text-neutral';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  // Skeleton component for loading state
  const skeletonComponent = (
    <CardContent className="widget-padding">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SkeletonCard />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
          <SkeletonCard height="h-20" />
        </div>
      </div>
    </CardContent>
  );

  return (
    <Card className="bg-white shadow-sm border border-gray-200 widget-card" style={{ height: '400px' }}>
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle className="headline-lg text-[#2D3748]">Wettbewerber-Analyse Berlin Mitte</CardTitle>
          
          <div className="flex items-center justify-between md:justify-end space-x-4">
            {/* Time Period Selector */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {timePeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-3 py-1 caption font-medium rounded transition-all duration-150 ${
                    selectedPeriod === period.value
                      ? 'bg-white text-[#2D3748] shadow-sm'
                      : 'text-neutral hover:text-[#2D3748]'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button 
                className="touch-target p-2 rounded hover:bg-[#F3F4F6] button-hover flex items-center justify-center"
                onClick={(event) => {
                  console.log('Exporting Competitor Analysis data...');
                  event.currentTarget.classList.add('success-flash');
                  setTimeout(() => event.currentTarget.classList.remove('success-flash'), 600);
                }}
                title="Export Data"
                disabled={isLoading}
              >
                <Download className="icon-sm text-neutral hover:text-primary-brand transition-colors duration-150" />
              </button>
              <button 
                className={`touch-target p-2 rounded hover:bg-[#F3F4F6] button-hover flex items-center justify-center ${isLoading ? 'refresh-rotate rotating' : 'refresh-rotate'}`}
                onClick={handleRefresh}
                title="Refresh Data"
                disabled={isLoading}
              >
                <RotateCcw className={`icon-sm text-neutral hover:text-primary-brand transition-colors duration-150 ${isLoading ? 'animate-spin' : ''}`} />
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
        emptyTitle="Keine Konkurrenz-Daten verfügbar"
        emptyDescription="Wettbewerber-Analyse wird geladen..."
        emptyIcon={Target}
      >
        <CardContent className="widget-padding pt-0">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 xl:gap-6 h-full">
            {/* Left Side - Competitor Table (60%) */}
            <div className="xl:col-span-3 min-h-0">
              {/* Desktop Table */}
              <div className="hidden xl:block h-full">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
                  {/* Table Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4 body-md font-medium text-[#2D3748]">Restaurant</div>
                      <div className="col-span-2 body-md font-medium text-[#2D3748]">Bewertung</div>
                      <div className="col-span-2 body-md font-medium text-[#2D3748]">Reviews</div>
                      <div className="col-span-1 body-md font-medium text-[#2D3748]">Preis</div>
                      <div className="col-span-2 body-md font-medium text-[#2D3748]">Entfernung</div>
                      <div className="col-span-1 body-md font-medium text-[#2D3748]">Trend</div>
                    </div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
                    {competitors.map((competitor, index) => (
                      <div 
                        key={competitor.id}
                        className={`px-4 py-3 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm ${
                          competitor.isOwn ? 'bg-blue-50' : index % 2 === 1 ? 'bg-[#F8F9FA]' : 'bg-white'
                        }`}
                      >
                        <div className="grid grid-cols-12 gap-2 items-center">
                          {/* Restaurant Name */}
                          <div className="col-span-4">
                            <div className="body-md font-medium text-[#2D3748]">
                              {competitor.name}
                            </div>
                          </div>
                          
                          {/* Rating */}
                          <div className="col-span-2">
                            <div className="flex items-center space-x-1">
                              <span className="body-md font-medium text-[#2D3748]">{competitor.rating}</span>
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            </div>
                          </div>
                          
                          {/* Reviews */}
                          <div className="col-span-2">
                            <span className="caption text-neutral">({competitor.reviews})</span>
                          </div>
                          
                          {/* Price Level */}
                          <div className="col-span-1">
                            <span className="caption font-medium text-[#2D3748]">{competitor.priceLevel}</span>
                          </div>
                          
                          {/* Distance */}
                          <div className="col-span-2">
                            <span className="caption text-neutral">{competitor.distance}</span>
                          </div>
                          
                          {/* Trend */}
                          <div className="col-span-1">
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(competitor.trend)}
                              <span className={`caption font-medium ${getTrendColor(competitor.trend)}`}>
                                {competitor.trendValue}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile: Horizontal Scrollable Cards */}
              <div className="md:hidden">
                <div className="flex space-x-4 overflow-x-auto pb-4 swipe-container scroll-indicator">
                  {competitors.map((competitor) => (
                    <div 
                      key={competitor.id}
                      className={`flex-shrink-0 w-80 p-4 rounded-lg border touch-target mobile-widget-card ${
                        competitor.isOwn 
                          ? 'bg-[#EBF4FF] border-blue-200' 
                          : 'bg-card border-border'
                      }`}
                      style={{ height: '150px' }}
                    >
                      <div className="h-full flex flex-col justify-between">
                        {/* Restaurant Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="body-md font-medium text-foreground flex-1 pr-2 line-clamp-2">
                            {competitor.name}
                          </div>
                          {competitor.isOwn ? (
                            <Badge className="bg-primary text-white caption whitespace-nowrap">
                              Mein Restaurant
                            </Badge>
                          ) : (
                            <div className="flex items-center space-x-1 whitespace-nowrap">
                              {getTrendIcon(competitor.trend)}
                              <span className={`caption font-medium ${getTrendColor(competitor.trend)}`}>
                                {competitor.trendValue}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Rating and Details */}
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <span className="body-md font-medium text-foreground">{competitor.rating}</span>
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            </div>
                            <div className="caption text-muted-foreground">({competitor.reviews})</div>
                          </div>
                          <div className="space-y-1 text-right">
                            <div className="caption font-medium text-foreground">{competitor.priceLevel}</div>
                            {!competitor.isOwn && (
                              <div className="flex items-center justify-end space-x-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="caption text-muted-foreground">{competitor.distance}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Show All Button */}
                <div className="flex justify-center mt-4">
                  <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg button-hover touch-target body-md font-medium">
                    Alle Konkurrenten anzeigen ({competitors.length})
                  </button>
                </div>
              </div>

              {/* Tablet: Vertical Cards */}
              <div className="hidden md:block xl:hidden space-y-3 max-h-80 overflow-y-auto">
                {competitors.map((competitor) => (
                  <div 
                    key={competitor.id}
                    className={`p-4 rounded-lg border touch-target ${
                      competitor.isOwn 
                        ? 'bg-[#EBF4FF] border-blue-200' 
                        : 'bg-card border-border hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Restaurant Header */}
                      <div className="flex items-center justify-between">
                        <div className="body-md font-medium text-foreground flex-1 pr-2">
                          {competitor.name}
                          {competitor.isOwn && (
                            <Badge className="ml-2 bg-primary text-white caption">
                              Mein Restaurant
                            </Badge>
                          )}
                        </div>
                        {!competitor.isOwn && (
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(competitor.trend)}
                            <span className={`caption font-medium ${getTrendColor(competitor.trend)}`}>
                              {competitor.trendValue}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Rating and Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <span className="body-md font-medium text-foreground">{competitor.rating}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          </div>
                          <div className="caption text-muted-foreground">({competitor.reviews} Reviews)</div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="caption font-medium text-foreground">{competitor.priceLevel}</div>
                          {!competitor.isOwn && (
                            <div className="flex items-center justify-end space-x-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <span className="caption text-muted-foreground">{competitor.distance}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - KPI Cards (40%) */}
            <div className="xl:col-span-2 space-y-4 min-h-0 overflow-y-auto">
              {/* Ranking Position Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="metric-lg text-[#2D3748]">#{kpiData.ranking.position}</div>
                    <Badge className="bg-success-light text-success caption">
                      {kpiData.ranking.badge}
                    </Badge>
                  </div>
                  <div className="caption text-neutral">
                    von {kpiData.ranking.total} Restaurants in {kpiData.ranking.category}
                  </div>
                </div>
              </div>

              {/* Rating Performance Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="metric-md text-[#2D3748]">{kpiData.rating.value}★</div>
                  </div>
                  <div className="caption text-neutral">{kpiData.rating.comparison}</div>
                  {/* Rating Comparison Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="caption text-neutral">matbakh</span>
                      <span className="caption font-medium">{kpiData.rating.value}★</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(kpiData.rating.value / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="caption text-neutral">Durchschnitt</span>
                      <span className="caption">{kpiData.rating.average}★</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(kpiData.rating.average / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Velocity Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="metric-md text-[#2D3748]">+{kpiData.reviewVelocity.weekly}</div>
                    <TrendingUp className="icon-sm text-success" />
                  </div>
                  <div className="caption text-neutral">
                    Reviews/Woche vs. {kpiData.reviewVelocity.average} Durchschnitt
                  </div>
                </div>
              </div>

              {/* Price Positioning Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="metric-md text-[#2D3748]">{kpiData.pricing.advantage}%</div>
                    <Badge className="bg-primary-brand text-white caption">
                      {kpiData.pricing.badge}
                    </Badge>
                  </div>
                  <div className="caption text-neutral">
                    günstiger als {kpiData.pricing.segment}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default CompetitorMonitoringWidget;