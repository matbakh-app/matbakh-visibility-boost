import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, ChevronDown, Info, RotateCcw, TrendingUp, Users, Globe } from 'lucide-react';
import ComingSoonWidget from './ComingSoonWidget';

const CulturalInsightsWidget = () => {
  const [selectedLocation, setSelectedLocation] = useState('Berlin Mitte');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const locations = [
    'Berlin Mitte',
    'Berlin Prenzlauer Berg', 
    'Berlin Charlottenburg',
    'Berlin Kreuzberg'
  ];

  // Simulate loading
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      setIsError(false);
      
      setTimeout(() => {
        const random = Math.random();
        if (random < 0.05) {
          setIsError(true);
        } else if (random < 0.08) {
          setIsEmpty(true);
        } else {
          setIsEmpty(false);
        }
        setIsLoading(false);
      }, Math.random() * 1500 + 1000);
    };

    loadData();
  }, [selectedLocation]);

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

  // Hofstede Cultural Dimensions Data
  const hofstedeData = [
    {
      dimension: 'Individualismus',
      value: 85,
      fullMark: 100,
      description: 'Hohe Individualität, Selbstständigkeit geschätzt'
    },
    {
      dimension: 'Machtdistanz',
      value: 45,
      fullMark: 100,
      description: 'Mittlere Hierarchie-Akzeptanz, flache Strukturen'
    },
    {
      dimension: 'Unsicherheitsvermeidung',
      value: 65,
      fullMark: 100,
      description: 'Mittlere Risikobereitschaft, Struktur geschätzt'
    },
    {
      dimension: 'Maskulinität',
      value: 35,
      fullMark: 100,
      description: 'Work-Life-Balance, Kooperation wichtig'
    },
    {
      dimension: 'Langzeitorientierung',
      value: 75,
      fullMark: 100,
      description: 'Zukunftsorientiert, nachhaltige Entscheidungen'
    }
  ];

  // Demographic Composition Data
  const demographicData = [
    { name: 'Internationale Geschäftsreisende', value: 35, color: '#3B82F6' },
    { name: 'Wohlhabende Touristen', value: 25, color: '#10B981' },
    { name: 'Lokale Professionals', value: 20, color: '#F97316' },
    { name: 'Kulturelle Expats', value: 15, color: '#8B5CF6' },
    { name: 'Premium-Lifestyle Locals', value: 5, color: '#6B7280' }
  ];

  // Behavior Patterns
  const behaviorPatterns = [
    { icon: '💼', text: 'Business Lunch Peak: 12:00-14:00' },
    { icon: '🌍', text: 'Mehrsprachiger Service erwartet (EN/DE/FR)' },
    { icon: '📱', text: 'Kontaktlose Bezahlung bevorzugt (78%)' },
    { icon: '🍷', text: 'Premium-Weine wichtig (Durchschnitt €45/Flasche)' },
    { icon: '📸', text: 'Instagram-taugliche Atmosphäre erwartet' }
  ];

  // Action Recommendations
  const actionRecommendations = [
    {
      icon: '🎯',
      category: 'MENÜ',
      recommendation: 'International mit lokalen Highlights',
      description: 'Fusion-Küche mit regionalen Zutaten'
    },
    {
      icon: '🗣️',
      category: 'SERVICE',
      recommendation: 'Professional, mehrsprachig verfügbar',
      description: 'DE/EN/FR sprechende Mitarbeiter'
    },
    {
      icon: '📲',
      category: 'TECH',
      recommendation: 'QR-Menüs + kontaktloses Payment',
      description: 'Digitale Lösungen für moderne Gäste'
    }
  ];

  const skeletonComponent = (
    <CardContent>
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        
        {/* Two Column Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-4">
            <div className="h-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </CardContent>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <div className="font-medium text-foreground mb-1">{data.dimension}</div>
          <div className="text-sm text-muted-foreground mb-1">Wert: {data.value}/100</div>
          <div className="text-xs text-muted-foreground">{data.description}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full bg-card shadow-sm border border-border widget-card">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-base md:text-lg text-foreground">
              Kulturdimensionen-Analyse
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Basiert auf Hofstede-Modell + lokale Demographics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Location Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-between w-40 md:w-48 h-9 px-3 py-2 text-sm bg-card border border-border rounded-lg hover:shadow-md button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-neutral" />
                    <span className="text-foreground font-medium truncate">{selectedLocation}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-neutral flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 shadow-lg border border-border bg-card" align="end">
                {locations.map((location) => (
                  <DropdownMenuItem
                    key={location}
                    onClick={() => setSelectedLocation(location)}
                    className="cursor-pointer hover:bg-accent flex items-center space-x-2 button-padding"
                  >
                    <MapPin className="w-3 h-3 text-neutral" />
                    <span className={`text-sm ${location === selectedLocation ? 'font-medium text-success' : 'text-muted-foreground'}`}>
                      {location}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh Button */}
            <button 
              className={`w-8 h-8 p-1 rounded hover:bg-accent button-hover flex items-center justify-center ${isLoading ? 'refresh-rotate rotating' : 'refresh-rotate'}`}
              onClick={handleRefresh}
              title="Refresh Data"
              disabled={isLoading}
            >
              <RotateCcw className={`w-4 h-4 text-muted-foreground hover:text-primary transition-colors duration-150 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </CardHeader>
      
      {isLoading ? (
        skeletonComponent
      ) : isEmpty ? (
        <ComingSoonWidget
          icon={Globe}
          title="Keine Kulturdaten verfügbar"
          description="Warte auf demographische Analyse..."
        />
      ) : (
        <CardContent className="space-y-6">
          {/* Mobile: Full-width Sections - Tablet/Desktop: Split Layout */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
            
            {/* Hofstede Radar Chart Section */}
            <div className="space-y-4">
              <h3 className="headline-md text-foreground flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Hofstede Dimensionen</span>
              </h3>
              
              {/* Mobile: Centered Radar Chart (200px diameter) */}
              <div className="flex justify-center lg:block">
                <div className="w-64 h-64 lg:w-full lg:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={hofstedeData}>
                      <PolarGrid 
                        gridType="polygon"
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                      />
                      <PolarAngleAxis 
                        dataKey="dimension" 
                        className="text-xs"
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]}
                        className="text-xs"
                        tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                        tickCount={6}
                      />
                      <Radar 
                        name="Cultural Dimensions" 
                        dataKey="value" 
                        stroke="var(--primary)" 
                        fill="var(--primary)" 
                        fillOpacity={0.3}
                        strokeWidth={2}
                        dot={{ fill: 'var(--primary)', strokeWidth: 2, r: 4 }}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Demographics & Insights Section */}
            <div className="space-y-6">
              
              {/* Demographic Composition - Mobile: Vertical Icons List */}
              <div>
                <h3 className="headline-md text-foreground mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-success" />
                  <span>Zielgruppen-Mix</span>
                </h3>
                
                {/* Mobile/Tablet: Vertical List with Icons */}
                <div className="md:hidden space-y-3">
                  {demographicData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg touch-target">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="body-md text-foreground font-medium">{item.name}</span>
                      </div>
                      <span className="body-md font-bold text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>

                {/* Desktop: Chart + Legend */}
                <div className="hidden md:grid md:grid-cols-2 gap-4">
                  {/* Mini Donut Chart */}
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {demographicData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                         <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Demographics Legend */}
                  <div className="space-y-2">
                    {demographicData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                          <div className="text-xs font-medium text-foreground">{item.value}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Behavior Patterns */}
              <div>
                <h4 className="font-medium text-foreground mb-3">Verhaltens-Patterns</h4>
                <div className="space-y-2">
                  {behaviorPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-accent rounded-lg hover:bg-card-hover transition-colors touch-target">
                      <span className="text-lg">{pattern.icon}</span>
                      <span className="text-xs text-muted-foreground">{pattern.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Recommendations - Mobile: Carousel with Dots */}
          <div>
            <h3 className="headline-md text-foreground mb-4">Handlungsempfehlungen</h3>
            
            {/* Mobile: Horizontal Scrollable Carousel */}
            <div className="md:hidden">
              <div className="flex space-x-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {actionRecommendations.map((action, index) => (
                  <div key={index} className="flex-shrink-0 w-80 bg-accent border border-border rounded-lg p-4 touch-target">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{action.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-primary mb-1">{action.category}</div>
                        <div className="text-sm font-medium text-foreground mb-1">{action.recommendation}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Dots Navigation */}
              <div className="flex justify-center space-x-2 mt-2">
                {actionRecommendations.map((_, index) => (
                  <div key={index} className="w-2 h-2 rounded-full bg-muted"></div>
                ))}
              </div>
            </div>

            {/* Tablet/Desktop: Grid Layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              {actionRecommendations.map((action, index) => (
                <div key={index} className="bg-accent border border-border rounded-lg p-4 trend-card-hover">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-primary mb-1">{action.category}</div>
                      <div className="text-sm font-medium text-foreground mb-1">{action.recommendation}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="metric-lg text-foreground mb-1">87</div>
              <div className="caption">Cultural Fit Score /100</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="caption">Zielgruppen-Abdeckung</span>
                <span className="text-sm font-medium text-foreground">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div className="text-center">
              <Badge className="bg-warning text-white caption mb-1">Hoch</Badge>
              <div className="caption">Optimierungspotenzial</div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CulturalInsightsWidget;