import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ComposedChart, Line, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Target, Euro, MousePointer, TrendingUp, RotateCcw, Download, BarChart3 } from 'lucide-react';
import TimeSelector from './TimeSelector';
import { WidgetStateWrapper, SkeletonChart, SkeletonCard, SkeletonList } from './WidgetStates';

const MarketingWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('7t');
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [campaignStates, setCampaignStates] = useState({
    'google-ads': true,
    'facebook-events': true,
    'instagram-food': false
  });

  const handleTimePeriodChange = (period: string, loading: boolean) => {
    setTimePeriod(period);
    setIsLoading(loading);
    if (!loading) {
      console.log(`Marketing Performance data updated for period: ${period}`);
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

  const toggleCampaign = (campaignId: string) => {
    setCampaignStates(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
    console.log(`Campaign ${campaignId} ${campaignStates[campaignId] ? 'pausiert' : 'aktiviert'}`);
  };

  const ToggleSwitch = ({ isActive, onToggle }: { isActive: boolean, onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`
        relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${isActive ? 'bg-green-500' : 'bg-gray-300'}
      `}
      style={{ width: '40px', height: '20px' }}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
          ${isActive ? 'translate-x-5' : 'translate-x-1'}
        `}
      />
    </button>
  );
  const marketingData = [
    { day: 'Mo', spend: 85, conversions: 12, clicks: 234 },
    { day: 'Di', spend: 92, conversions: 15, clicks: 278 },
    { day: 'Mi', spend: 78, conversions: 11, clicks: 201 },
    { day: 'Do', spend: 105, conversions: 18, clicks: 312 },
    { day: 'Fr', spend: 128, conversions: 22, clicks: 389 },
    { day: 'Sa', spend: 145, conversions: 28, clicks: 456 },
    { day: 'So', spend: 98, conversions: 16, clicks: 289 }
  ];

  const totalSpend = marketingData.reduce((sum, d) => sum + d.spend, 0);
  const totalConversions = marketingData.reduce((sum, d) => sum + d.conversions, 0);
  const totalClicks = marketingData.reduce((sum, d) => sum + d.clicks, 0);
  
  const costPerAcquisition = totalSpend / totalConversions;
  const roas = (totalConversions * 35) / totalSpend; // Assuming 35€ average order value
  const ctr = (totalClicks / 12500) * 100; // Assuming 12,500 impressions

  const KPICard = ({ icon: Icon, title, value, subtitle, trend, color = "text-[#2D3748]" }) => (
    <div className="text-center p-2 md:p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-center mb-1 md:mb-2">
        <Icon className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
      </div>
      <div className={`text-sm md:text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      {trend && (
        <div className={`text-xs font-medium mt-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );

  const skeletonComponent = (
    <CardContent className="space-y-4 md:space-y-6">
      {/* Chart Skeleton */}
      <div>
        <div className="w-48 h-4 bg-[#E5E7EB] rounded animate-pulse mb-3"></div>
        <SkeletonChart height="h-32" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Campaigns List Skeleton */}
      <div>
        <div className="w-32 h-4 bg-[#E5E7EB] rounded animate-pulse mb-3"></div>
        <SkeletonList items={3} />
      </div>
    </CardContent>
  );

  return (
    <Card className="h-full bg-white shadow-sm border border-gray-200 widget-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-4">
            <CardTitle className="text-base md:text-lg text-[#2D3748]">Marketing Performance</CardTitle>
            <TimeSelector 
              defaultPeriod="7t" 
              onPeriodChange={handleTimePeriodChange}
            />
          </div>
          <div className="flex items-center space-x-1 md:space-x-3">
            <button 
              className="w-8 h-8 md:w-5 md:h-5 p-1 rounded hover:bg-[#F3F4F6] button-hover min-h-[44px] md:min-h-[auto] flex items-center justify-center md:block"
              onClick={(event) => {
                console.log('Exporting Marketing Performance data...');
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
        emptyTitle="Keine Marketing-Daten verfügbar"
        emptyDescription="Warte auf Kampagnen-Daten..."
        emptyIcon={BarChart3}
      >
        <CardContent className="space-y-6">
        {/* Chart: Ad Spend vs Conversions */}
        <div>
          <h4 className="text-sm font-medium text-[#2D3748] mb-3">Ausgaben vs. Conversions</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={marketingData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                />
                <YAxis hide />
                <Bar 
                  dataKey="spend" 
                  fill="#EDF2F7" 
                  radius={[2, 2, 0, 0]}
                  maxBarSize={20}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#48BB78" 
                  strokeWidth={2}
                  dot={{ fill: '#48BB78', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-6 mt-2">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#EDF2F7] rounded"></div>
              <span className="text-xs text-gray-600">Ausgaben (€)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#48BB78] rounded-full"></div>
              <span className="text-xs text-gray-600">Conversions</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard 
            icon={Euro} 
            title="Cost per Acquisition" 
            value={`€${costPerAcquisition.toFixed(2)}`}
            trend={-8.3}
          />
          <KPICard 
            icon={Target} 
            title="ROAS" 
            value={`${roas.toFixed(1)}x`}
            subtitle="Return on Ad Spend"
            trend={12.7}
            color="text-[#48BB78]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KPICard 
            icon={MousePointer} 
            title="Klicks" 
            value={totalClicks.toLocaleString()}
            subtitle="7 Tage"
            trend={15.2}
          />
          <KPICard 
            icon={TrendingUp} 
            title="CTR" 
            value={`${ctr.toFixed(2)}%`}
            subtitle="Click-Through-Rate"
            trend={3.8}
          />
        </div>

        {/* Campaign Performance */}
        <div>
          <h4 className="text-sm font-medium text-[#2D3748] mb-3">Top Kampagnen</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-gray-600">Google Ads - Restaurant</span>
                <ToggleSwitch 
                  isActive={campaignStates['google-ads']} 
                  onToggle={() => toggleCampaign('google-ads')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#2D3748] font-medium">€285</span>
                <span className="text-green-600">+18%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-gray-600">Facebook - Events</span>
                <ToggleSwitch 
                  isActive={campaignStates['facebook-events']} 
                  onToggle={() => toggleCampaign('facebook-events')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#2D3748] font-medium">€142</span>
                <span className="text-green-600">+7%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-gray-600">Instagram - Food</span>
                <ToggleSwitch 
                  isActive={campaignStates['instagram-food']} 
                  onToggle={() => toggleCampaign('instagram-food')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#2D3748] font-medium">€198</span>
                <span className="text-red-500">-3%</span>
              </div>
            </div>
          </div>
        </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default MarketingWidget;