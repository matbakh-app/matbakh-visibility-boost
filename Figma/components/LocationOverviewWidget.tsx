import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MapPin, Star, Euro, Users, TrendingUp, TrendingDown, RotateCcw, Download, Building } from 'lucide-react';
import { Badge } from './ui/badge';
import TimeSelector from './TimeSelector';
import { WidgetStateWrapper, SkeletonCard } from './WidgetStates';

const LocationOverviewWidget = () => {
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('heute');
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const handleTimePeriodChange = (period: string, loading: boolean) => {
    setTimePeriod(period);
    setIsLoading(loading);
    if (!loading) {
      console.log(`Location Overview data updated for period: ${period}`);
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

  const locations = [
    {
      id: 'mitte',
      name: 'Berlin Mitte',
      address: 'Unter den Linden 1',
      status: 'aktiv',
      revenue: 4200,
      orders: 156,
      rating: 4.5,
      reviews: 89,
      trend: 12.5,
      occupancy: 85
    },
    {
      id: 'prenzlauer',
      name: 'Prenzlauer Berg',
      address: 'Kastanienallee 45',
      status: 'aktiv',
      revenue: 3800,
      orders: 134,
      rating: 4.3,
      reviews: 67,
      trend: 8.3,
      occupancy: 72
    },
    {
      id: 'charlottenburg',
      name: 'Charlottenburg',
      address: 'Kantstraße 123',
      status: 'wartung',
      revenue: 2100,
      orders: 78,
      rating: 4.7,
      reviews: 45,
      trend: -5.2,
      occupancy: 45
    },
    {
      id: 'kreuzberg',
      name: 'Kreuzberg',
      address: 'Bergmannstraße 67',
      status: 'aktiv',
      revenue: 3600,
      orders: 142,
      rating: 4.4,
      reviews: 78,
      trend: 15.7,
      occupancy: 78
    }
  ];

  const totalRevenue = locations.reduce((sum, loc) => sum + loc.revenue, 0);
  const totalOrders = locations.reduce((sum, loc) => sum + loc.orders, 0);
  const averageRating = locations.reduce((sum, loc) => sum + loc.rating, 0) / locations.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aktiv': return 'bg-green-100 text-green-800';
      case 'wartung': return 'bg-yellow-100 text-yellow-800';
      case 'geschlossen': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const LocationCard = ({ location }: { location: any }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1 interactive-element">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-[#2D3748]">{location.name}</h3>
          </div>
          <p className="text-sm text-gray-600">{location.address}</p>
        </div>
        <Badge className={getStatusColor(location.status)}>
          {location.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-[#2D3748]">€{location.revenue.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Umsatz heute</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-[#2D3748]">{location.orders}</div>
          <div className="text-xs text-gray-600">Bestellungen</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{location.rating}</span>
          </div>
          <div className="text-gray-600">{location.reviews} Reviews</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            {location.trend > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={`font-medium ${location.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(location.trend)}%
            </span>
          </div>
          <div className="text-gray-600">vs. gestern</div>
        </div>
        <div className="text-center">
          <div className="font-medium mb-1">{location.occupancy}%</div>
          <div className="text-gray-600">Auslastung</div>
        </div>
      </div>
    </div>
  );

  const skeletonComponent = (
    <CardContent>
      {/* Summary Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Location Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </CardContent>
  );

  return (
    <Card className="bg-white shadow-sm border border-gray-200 widget-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4">
            <CardTitle className="text-base md:text-lg text-[#2D3748]">Standort-Übersicht</CardTitle>
            <TimeSelector 
              defaultPeriod="heute" 
              onPeriodChange={handleTimePeriodChange}
            />
          </div>
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-3">
            <div className="flex items-center space-x-1 md:space-x-3">
              <button 
                className="w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-[#F3F4F6] button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block"
                onClick={(event) => {
                  console.log('Exporting Location Overview data...');
                  event.currentTarget.classList.add('success-flash');
                  setTimeout(() => event.currentTarget.classList.remove('success-flash'), 600);
                }}
                title="Export Data"
                disabled={isLoading}
              >
                <Download className="w-4 h-4 md:w-full md:h-full text-[#9CA3AF] hover:text-[#4F46E5] transition-colors duration-150" />
              </button>
              <button 
                className={`w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-[#F3F4F6] button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block ${isLoading ? 'refresh-rotate rotating' : 'refresh-rotate'}`}
                onClick={handleRefresh}
                title="Refresh Data"
                disabled={isLoading}
              >
                <RotateCcw className={`w-4 h-4 md:w-full md:h-full text-[#9CA3AF] hover:text-[#4F46E5] transition-colors duration-150 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={isLoading}>
              <SelectTrigger className="w-full md:w-48 min-h-[44px] md:min-h-[auto]">
                <SelectValue placeholder="Standort auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Standorte</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <WidgetStateWrapper
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        skeletonComponent={skeletonComponent}
        emptyTitle="Keine Standort-Daten verfügbar"
        emptyDescription="Warte auf Standort-Informationen..."
        emptyIcon={Building}
      >
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Euro className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-xl font-semibold text-[#2D3748]">€{totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Gesamtumsatz</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-xl font-semibold text-[#2D3748]">{totalOrders}</div>
              <div className="text-sm text-gray-600">Bestellungen</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-xl font-semibold text-[#2D3748]">{averageRating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Ø Bewertung</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-xl font-semibold text-[#2D3748]">{locations.length}</div>
              <div className="text-sm text-gray-600">Standorte</div>
            </div>
          </div>

          {/* Location Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {locations
              .filter(location => selectedLocation === 'all' || location.id === selectedLocation)
              .map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
          </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default LocationOverviewWidget;