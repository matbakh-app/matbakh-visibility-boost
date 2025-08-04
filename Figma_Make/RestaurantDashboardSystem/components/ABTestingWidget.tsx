import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Plus, TrendingUp, Trophy, Clock, Target, ArrowUp, Play, StopCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { WidgetStateWrapper, SkeletonChart, SkeletonCard } from './WidgetStates';

const ABTestingWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

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

  // Active Tests Data
  const activeTests = [
    {
      id: 1,
      name: "Reservierung Button-Farbe",
      duration: "14 Tage aktiv",
      confidence: 67,
      variants: {
        a: { name: "Blau", value: 3.2, type: "%" },
        b: { name: "Grün", value: 4.1, type: "%" }
      },
      lift: 28,
      metric: "Conversion",
      status: "running",
      isSignificant: false
    },
    {
      id: 2,
      name: "Mobile Menu-Layout",
      duration: "21 Tage aktiv",
      confidence: 89,
      variants: {
        a: { name: "Standard Grid", value: 156, type: " Orders/Tag" },
        b: { name: "Kategorie-Tabs", value: 189, type: " Orders/Tag" }
      },
      lift: 21,
      metric: "Orders",
      status: "ready",
      isSignificant: true
    }
  ];

  // Completed Tests
  const completedTests = [
    { name: "Instagram CTA", lift: 35, metric: "Engagement", status: "implemented" },
    { name: "Checkout Flow", lift: 12, metric: "Completion", status: "live", duration: "2 Wochen" },
    { name: "Hero Images", lift: 8, metric: "Bounce Reduction", status: "implemented" }
  ];

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 70) return 'text-warning';
    return 'text-error';
  };

  // Get confidence ring color
  const getConfidenceRingColor = (confidence: number) => {
    if (confidence >= 90) return '#10B981'; // Green
    if (confidence >= 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // Progress ring component
  const ProgressRing = ({ value, size = 60, strokeWidth = 4, color = '#10B981' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative">
        <svg height={size} width={size} className="rotate-[-90deg]">
          <circle
            stroke="#E5E7EB"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-foreground">{value}%</span>
        </div>
      </div>
    );
  };

  const skeletonComponent = (
    <CardContent>
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        
        {/* Active Tests Skeleton */}
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </CardContent>
  );

  return (
    <Card className="h-full bg-white shadow-sm border border-gray-200 widget-card">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-base md:text-lg text-[#2D3748]">
              A/B Test Performance
            </CardTitle>
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 caption">
              2 aktive • 3 abgeschlossen
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* New Test Button */}
            <Button 
              size="sm" 
              className="h-8 px-3 bg-success hover:bg-success/90 text-white button-hover"
              onClick={() => console.log('Start new test')}
            >
              <Plus className="w-3 h-3 mr-1" />
              <span className="text-xs">Neuen Test starten</span>
            </Button>

            {/* Refresh Button */}
            <button 
              className={`w-8 h-8 p-1 rounded hover:bg-[#F3F4F6] button-hover flex items-center justify-center ${isLoading ? 'refresh-rotate rotating' : 'refresh-rotate'}`}
              onClick={handleRefresh}
              title="Refresh Data"
              disabled={isLoading}
            >
              <RotateCcw className={`w-4 h-4 text-[#9CA3AF] hover:text-[#4F46E5] transition-colors duration-150 ${isLoading ? 'animate-spin' : ''}`} />
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
        emptyTitle="Keine A/B Tests aktiv"
        emptyDescription="Starte deinen ersten Test..."
        emptyIcon={Target}
      >
        <CardContent className="space-y-6">
          {/* Active Tests Section */}
          <div>
            <h3 className="headline-md text-[#2D3748] mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary-brand" />
              <span>Aktive Tests</span>
            </h3>
            
            <div className="space-y-4">
              {activeTests.map((test) => {
                const liftDirection = test.lift > 0 ? 'up' : 'down';
                const liftColor = test.lift > 0 ? 'text-success' : 'text-error';
                const confidenceColor = getConfidenceRingColor(test.confidence);
                
                return (
                  <div 
                    key={test.id} 
                    className="bg-accent border border-border rounded-lg p-4 trend-card-hover touch-target"
                    style={{ minHeight: '180px' }}
                  >
                    <div className="h-full flex flex-col justify-between space-y-4">
                      {/* Test Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                          <h4 className="font-medium text-foreground mb-1">{test.name}</h4>
                          <Badge className="bg-blue-50 text-blue-600 border border-blue-200 caption">
                            {test.duration}
                          </Badge>
                        </div>
                        {/* Mobile: Larger Progress Ring (60px) */}
                        <ProgressRing 
                          value={test.confidence} 
                          size={60}
                          strokeWidth={5}
                          color={confidenceColor}
                        />
                      </div>

                      {/* Mobile: Vertical Variant Comparison */}
                      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                        <div className="text-center p-3 bg-card border border-border rounded touch-target">
                          <div className="text-xs text-muted-foreground mb-1">Variante A (Control)</div>
                          <div className="font-medium text-foreground mb-1">"{test.variants.a.name}"</div>
                          <div className="text-sm font-medium">{test.variants.a.value}{test.variants.a.type}</div>
                        </div>
                        <div className="text-center p-3 bg-card border border-border rounded touch-target">
                          <div className="text-xs text-muted-foreground mb-1">Variante B (Test)</div>
                          <div className="font-medium text-foreground mb-1">"{test.variants.b.name}"</div>
                          <div className="text-sm font-medium">{test.variants.b.value}{test.variants.b.type}</div>
                        </div>
                      </div>

                      {/* Lift Indicator */}
                      <div className="flex items-center justify-center">
                        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${test.lift > 0 ? 'bg-success/10' : 'bg-error/10'}`}>
                          <ArrowUp className={`w-4 h-4 ${liftColor} ${liftDirection === 'down' ? 'rotate-180' : ''}`} />
                          <span className={`font-medium ${liftColor}`}>+{test.lift}%</span>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="space-y-3">
                        <div className="text-center">
                          <span className={`text-sm font-medium ${getConfidenceColor(test.confidence)}`}>
                            {test.confidence}% Konfidenz 
                            {test.isSignificant ? ' (Signifikant!)' : ' (Ziel: 95%)'}
                          </span>
                        </div>
                        
                        {/* Mobile: Full-width buttons (44px height) */}
                        <div className="space-y-2 md:space-y-0 md:flex md:space-x-2">
                          {test.isSignificant ? (
                            <Button 
                              size="sm" 
                              className="w-full md:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground button-hover touch-target"
                              style={{ minHeight: '44px' }}
                              onClick={() => console.log(`Implement winner for ${test.name}`)}
                            >
                              <Trophy className="w-4 h-4 mr-2" />
                              <span className="text-sm">🏆 Gewinner implementieren</span>
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full md:flex-1 button-hover touch-target"
                                style={{ minHeight: '44px' }}
                                onClick={() => console.log(`Continue ${test.name}`)}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                <span className="text-sm">Fortsetzen</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full md:flex-1 button-hover touch-target"
                                style={{ minHeight: '44px' }}
                                onClick={() => console.log(`Stop ${test.name}`)}
                              >
                                <StopCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm">Beenden</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Tests Summary */}
          <div>
            <h4 className="font-medium text-[#2D3748] mb-3 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Abgeschlossene Tests</span>
            </h4>
            <div className="space-y-2">
              {completedTests.map((test, index) => {
                const testIcons = ['📊', '📱', '🎨'];
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-2">
                      <span>{testIcons[index]}</span>
                      <span className="text-xs text-gray-700">
                        {test.name}: +{test.lift}% {test.metric}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-success text-white caption">
                        ✅ {test.status === 'implemented' ? 'Implementiert' : `Live seit ${test.duration}`}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insights Footer */}
          <div className="pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <span>🏆</span>
                <span className="text-gray-700">
                  <span className="font-medium">Champion:</span> Grüne Action-Buttons (+28%)
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span>💡</span>
                <span className="text-gray-700">
                  <span className="font-medium">Nächster Test:</span> Weekend-Menü Layouts
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span>📈</span>
                <span className="text-gray-700">
                  <span className="font-medium">Success-Rate:</span> 78% positive Ergebnisse
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default ABTestingWidget;