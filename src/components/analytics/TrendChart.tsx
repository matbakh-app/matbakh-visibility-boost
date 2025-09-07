// TrendChart Component - Task 6.4.2.1 + 6.4.2.4.2
// Visibility Trend Chart Component for Score Evolution Tracking with Event Annotations
// Requirements: B.3, B.4

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import type { FC } from 'react';
import type { ScorePoint, VisibilityEvent, ScoreType } from '@/types/score-history';
import { EventAnnotations, EventTooltip } from './EventAnnotations';
import { EnhancedTooltip } from './EnhancedTooltip';

type TrendChartProps = {
  data: ScorePoint[];
  scoreType: ScoreType;
  dateRange: { from: Date; to: Date };
  businessUnit?: string;
  events?: VisibilityEvent[];
  showEvents?: boolean;
  showEventLines?: boolean;
  showEventDots?: boolean;
  visibleEventTypes?: string[];
};

export const TrendChart: FC<TrendChartProps> = ({ 
  data, 
  scoreType, 
  dateRange, 
  businessUnit, 
  events = [],
  showEvents = true,
  showEventLines = true,
  showEventDots = true,
  visibleEventTypes
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<VisibilityEvent | null>(null);
  // Format date for German locale
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });
  };

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