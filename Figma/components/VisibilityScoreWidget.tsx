import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, RotateCcw, Download, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { WidgetStateWrapper, SkeletonGauge, SkeletonText, SkeletonCard } from './WidgetStates';

const VisibilityScoreWidget = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const score = 78;
  const trend = 5.2;
  const isPositiveTrend = trend > 0;
  
  // Calculate gauge rotation based on score
  const rotation = (score / 100) * 180 - 90;
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)'; // Green
    if (score >= 60) return 'var(--color-warning)'; // Yellow
    return 'var(--color-error)'; // Red
  };

  const scoreColor = getScoreColor(score);

  // Simulate loading
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      setIsError(false);
      
      setTimeout(() => {
        // Simulate random states for demo
        const random = Math.random();
        if (random < 0.1) {
          setIsError(true);
        } else if (random < 0.2) {
          setIsEmpty(true);
        } else {
          setIsEmpty(false);
        }
        setIsLoading(false);
      }, Math.random() * 2000 + 1000); // 1-3 seconds
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

  // Skeleton component for loading state
  const skeletonComponent = (
    <CardContent className="flex flex-col items-center justify-center space-y-3 md:space-y-4">
      <SkeletonGauge />
      <div className="w-full space-y-2">
        <SkeletonText lines={3} />
      </div>
    </CardContent>
  );

  return (
    <Card className="h-full bg-card shadow-sm border border-border widget-card">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="headline-md text-foreground">Visibility Score</CardTitle>
          <div className="flex items-center space-x-2">
            <button 
              className="touch-target p-2 rounded hover:bg-accent button-hover flex items-center justify-center"
              onClick={() => {
                console.log('Exporting Visibility Score data...');
                // Add success flash effect
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
            <Button variant="ghost" size="sm" className="hidden md:flex body-md text-muted-foreground hover:text-success button-hover" disabled={isLoading}>
              Details
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <WidgetStateWrapper
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={handleRetry}
        skeletonComponent={skeletonComponent}
        emptyTitle="Keine Visibility-Daten verfügbar"
        emptyDescription="Visibility Score wird berechnet..."
        emptyIcon={Target}
      >
        <CardContent className="widget-padding flex flex-col items-center justify-center space-y-3 md:space-y-4">
          {/* Gauge Chart */}
          <div className="relative w-24 h-12 md:w-32 md:h-16 mb-2 md:mb-4">
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 128 64" 
              className="overflow-visible chart-element"
            >
              {/* Background Arc */}
              <path
                d="M 16 48 A 48 48 0 0 1 112 48"
                fill="none"
                stroke="var(--border)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              
              {/* Progress Arc */}
              <path
                d="M 16 48 A 48 48 0 0 1 112 48"
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 150.8} 150.8`}
                className="transition-all duration-700 ease-out"
              />
              
              {/* Needle */}
              <g transform={`translate(64, 48) rotate(${rotation})`}>
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-30"
                  stroke="var(--foreground)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="0" r="2" fill="var(--foreground)" />
              </g>
            </svg>
          </div>

          {/* Score Display */}
          <div className="text-center">
            <div className="metric-md text-foreground mb-1">{score}%</div>
            <div className="flex items-center justify-center space-x-1 caption">
              {isPositiveTrend ? (
                <TrendingUp className="icon-sm text-success" />
              ) : (
                <TrendingDown className="icon-sm text-error" />
              )}
              <span className={`font-medium ${isPositiveTrend ? 'text-success' : 'text-error'}`}>
                {Math.abs(trend)}%
              </span>
              <span className="text-caption-foreground hidden md:inline">vs. letzte Woche</span>
              <span className="text-caption-foreground md:hidden">vs. Woche</span>
            </div>
          </div>

          {/* Status Indicator - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-2 body-md text-muted-foreground">
            <Clock className="icon-sm" />
            <span>Zuletzt aktualisiert: vor 2 Stunden</span>
          </div>

          {/* Mobile Status */}
          <div className="md:hidden flex items-center space-x-2 caption text-caption-foreground">
            <Clock className="w-3 h-3" />
            <span>vor 2h</span>
          </div>

          {/* Score Categories */}
          <div className="w-full mt-2 md:mt-4 space-y-1 md:space-y-2">
            <div className="flex items-center justify-between caption">
              <span className="text-caption-foreground">Google Business</span>
              <span className="font-medium text-success">Gut</span>
            </div>
            <div className="flex items-center justify-between caption">
              <span className="text-caption-foreground">Social Media</span>
              <span className="font-medium text-warning">Durchschnitt</span>
            </div>
            <div className="flex items-center justify-between caption">
              <span className="text-caption-foreground">Website SEO</span>
              <span className="font-medium text-success">Sehr gut</span>
            </div>
          </div>
        </CardContent>
      </WidgetStateWrapper>
    </Card>
  );
};

export default VisibilityScoreWidget;