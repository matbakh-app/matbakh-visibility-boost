import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { Calendar, Users, Clock, AlertTriangle, RotateCcw, Download, CalendarDays } from 'lucide-react';
import TimeSelector from './TimeSelector';
import { WidgetStateWrapper, SkeletonChart, SkeletonCard, SkeletonList } from './WidgetStates';

const ReservationsWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('heute');
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const handleTimePeriodChange = (period: string, loading: boolean) => {
    setTimePeriod(period);
    setIsLoading(loading);
    if (!loading) {
      console.log(`Reservations data updated for period: ${period}`);
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
  const hourlyData = [
    { hour: '12', reservations: 8, capacity: 12 },
    { hour: '13', reservations: 12, capacity: 12 },
    { hour: '14', reservations: 6, capacity: 12 },
    { hour: '15', reservations: 3, capacity: 12 },
    { hour: '18', reservations: 10, capacity: 12 },
    { hour: '19', reservations: 12, capacity: 12 },
    { hour: '20', reservations: 11, capacity: 12 },
    { hour: '21', reservations: 9, capacity: 12 }
  ];

  const todayReservations = 42;
  const noShowRate = 8.5;
  const currentOccupancy = 75;

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 90) return 'text-red-500';
    if (occupancy >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const KPICard = ({ icon: Icon, title, value, subtitle, trend, color = "text-[#2D3748]" }) => (
    <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
      <div className="flex items-center justify-between mb-1 md:mb-2">
        <Icon className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className={`text-sm md:text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  const skeletonComponent = (
    <CardContent className="space-y-4 md:space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-3 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Chart Skeleton */}
      <div>
        <div className="w-48 h-4 bg-[#E5E7EB] rounded animate-pulse mb-3"></div>
        <SkeletonChart height="h-32" />
      </div>

      {/* Reservations List Skeleton */}
      <div>
        <div className="w-40 h-4 bg-[#E5E7EB] rounded animate-pulse mb-3"></div>
        <SkeletonList items={3} />
      </div>
    </CardContent>
  );

  return (
    <Card className="h-full bg-white shadow-sm border border-gray-200 widget-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4">
            <CardTitle className="text-base md:text-lg text-[#2D3748]">Reservierungen & Tische</CardTitle>
            <TimeSelector 
              defaultPeriod="heute" 
              onPeriodChange={handleTimePeriodChange}
            />
          </div>
          <div className="flex items-center space-x-1 md:space-x-3">
            <button 
              className="w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-[#F3F4F6] button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block"
              onClick={(event) => {
                console.log('Exporting Reservations data...');
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
        </div>
      </CardHeader>
      
      <WidgetStateWrapper
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        skeletonComponent={skeletonComponent}
        emptyTitle="Keine Reservierungen verfügbar"
        emptyDescription="Warte auf erste Reservierungen..."
        emptyIcon={CalendarDays}
      >
        <CardContent className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3">
          <KPICard 
            icon={Calendar} 
            title="Reservierungen" 
            value={todayReservations.toString()}
            subtitle="heute"
            trend={15.2}
          />
          <KPICard 
            icon={AlertTriangle} 
            title="No-Show Rate" 
            value={`${noShowRate}%`}
            trend={-3.1}
            color="text-red-500"
          />
          <KPICard 
            icon={Users} 
            title="Auslastung" 
            value={`${currentOccupancy}%`}
            subtitle="aktuell"
            color={getOccupancyColor(currentOccupancy)}
          />
        </div>

        {/* Hourly Overview Chart */}
        <div>
          <h4 className="text-sm font-medium text-[#2D3748] mb-3">Tagesübersicht (Stunden)</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                />
                <Bar 
                  dataKey="reservations" 
                  fill="#48BB78" 
                  radius={[2, 2, 0, 0]}
                  maxBarSize={30}
                />
                <Bar 
                  dataKey="capacity" 
                  fill="#EDF2F7" 
                  radius={[2, 2, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#48BB78] rounded"></div>
              <span className="text-xs text-gray-600">Reserviert</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#EDF2F7] rounded"></div>
              <span className="text-xs text-gray-600">Kapazität</span>
            </div>
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div>
          <h4 className="text-sm font-medium text-[#2D3748] mb-3">Nächste Reservierungen</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="font-medium">19:30</span>
                <span className="text-gray-600">Müller (4 Pers.)</span>
              </div>
              <span className="text-green-600 font-medium">Bestätigt</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-2 bg-gray-50 rounded text-xs space-y-2 md:space-y-0">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="font-medium">20:00</span>
                <span className="text-gray-600">Schmidt (2 Pers.)</span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-1">
                <button 
                  className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xs px-2 py-1 rounded transition-all duration-200 hover:shadow-md flex items-center justify-center min-h-[44px] md:min-h-[24px] flex-1 md:flex-none"
                  style={{ width: '100%', maxWidth: '70px', height: '44px' }}
                  onClick={() => console.log('Reservierung bestätigt für Schmidt')}
                >
                  ✓ Bestätigen
                </button>
                <button 
                  className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs px-2 py-1 rounded transition-all duration-200 hover:shadow-md flex items-center justify-center min-h-[44px] md:min-h-[24px] flex-1 md:flex-none"
                  style={{ width: '100%', maxWidth: '70px', height: '44px' }}
                  onClick={() => console.log('Reservierung abgesagt für Schmidt')}
                >
                  ✗ Absagen
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="font-medium">20:15</span>
                <span className="text-gray-600">Weber (6 Pers.)</span>
              </div>
              <span className="text-green-600 font-medium">Bestätigt</span>
            </div>
          </div>
        </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default ReservationsWidget;