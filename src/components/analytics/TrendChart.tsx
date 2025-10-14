// TrendChart Component - Master Chart Component (Consolidated)
// Supports: Trend Analysis, Forecast Display, Score Evolution
// Requirements: B.3, B.4 (Task 6.4.2.1 + 6.4.2.4.2 + Forecast Integration)

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import type { FC } from 'react';
import type { ScorePoint, VisibilityEvent, ScoreType } from '@/types/score-history';
import type { ForecastResult } from '@/lib/forecast';
import { EventAnnotations, EventTooltip } from './EventAnnotations';
import { EnhancedTooltip } from './EnhancedTooltip';
import { 
  formatDate, 
  getScoreColor, 
  generateTooltipContent, 
  CHART_PRESETS, 
  DEFAULT_CHART_MARGINS,
  DEFAULT_CHART_STYLES,
  ChartMode,
  ForecastChartData,
  TrendChartData
} from '@/utils/chart-utils';

type TrendChartProps = {
  // Core data
  data: ScorePoint[];
  scoreType?: ScoreType;
  dateRange?: { from: Date; to: Date };
  businessUnit?: string;
  
  // Chart mode and behavior
  mode?: ChartMode;
  height?: number;
  className?: string;
  
  // Event handling (trend mode)
  events?: VisibilityEvent[];
  showEvents?: boolean;
  showEventLines?: boolean;
  showEventDots?: boolean;
  visibleEventTypes?: string[];
  
  // Forecast mode specific
  forecast?: ForecastResult;
  historicalData?: ScorePoint[];
  showConfidenceInterval?: boolean;
  showTrendLine?: boolean;
};

export const TrendChart: FC<TrendChartProps> = ({ 
  data, 
  scoreType, 
  dateRange, 
  businessUnit,
  mode = 'trend',
  height,
  className = '',
  events = [],
  showEvents = true,
  showEventLines = true,
  showEventDots = true,
  visibleEventTypes,
  forecast,
  historicalData,
  showConfidenceInterval = true,
  showTrendLine = true
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<VisibilityEvent | null>(null);
  
  // Determine responsive height
  const chartHeight = height || (window.innerWidth < 768 ? 300 : mode === 'forecast' ? 450 : 400);
  
  // Prepare chart data based on mode
  const chartData = useMemo(() => {
    if (mode === 'forecast' && forecast && historicalData) {
      const combinedData: ForecastChartData[] = [];
      
      // Add historical data
      historicalData.forEach(point => {
        combinedData.push({
          date: point.date,
          value: point.score_value,
          historical_score: point.score_value,
          is_forecast: false,
          type: 'historical'
        });
      });
      
      // Add forecast data
      forecast.forecast_points.forEach(point => {
        combinedData.push({
          date: point.date,
          value: point.predicted_score,
          predicted_score: point.predicted_score,
          confidence_lower: point.confidence_lower,
          confidence_upper: point.confidence_upper,
          is_forecast: true,
          type: 'forecast'
        });
      });
      
      return combinedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    // Default trend mode
    return data.map(point => ({
      date: point.date,
      value: point.score_value,
      score_value: point.score_value,
      type: 'historical'
    }));
  }, [data, mode, forecast, historicalData]);

  // Calculate previous score for change indicator
  const getPreviousScore = (currentDate: string): number | undefined => {
    const currentIndex = data.findIndex(point => point.date === currentDate);
    if (currentIndex > 0) {
      return data[currentIndex - 1].score_value;
    }
    return undefined;
  };

  // Enhanced tooltip with rich event integration
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const currentScore = payload[0].value as number;
    const previousScore = getPreviousScore(label as string);
    
    return (
      <EnhancedTooltip
        active={active}
        payload={payload}
        label={label}
        events={showEvents ? events : []}
        previousScore={previousScore}
        businessUnit={businessUnit}
      />
    );
  };

  return (
    <div className="w-full h-[300px] sm:h-[400px] md:h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
            label={{ 
              value: 'Score', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip 
            content={CustomTooltip} 
            cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '3 3' }}
            wrapperStyle={{ outline: 'none' }}
            allowEscapeViewBox={{ x: false, y: true }}
          />
          <Line 
            type="monotone" 
            dataKey="score_value" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
            connectNulls={false}
          />
          
          {/* Enhanced Event Annotations */}
          {showEvents && (
            <EventAnnotations
              events={events}
              scoreData={data}
              dateRange={dateRange}
              visibleEventTypes={visibleEventTypes}
              showEventLines={showEventLines}
              showEventDots={showEventDots}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};