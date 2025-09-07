// EventAnnotations Component - Task 6.4.2.4.2.1
// Visual event layer for TrendChart with Recharts integration

import React from 'react';
import { ReferenceDot, ReferenceLine } from 'recharts';
import type { VisibilityEvent, ScorePoint } from '@/types/score-history';
import { getEventStyleWithImpact, getEventStyle } from '@/data/analytics/event-styles';
import { formatEventForTooltip } from '@/utils/event-utils';

interface EventAnnotationsProps {
  events: VisibilityEvent[];
  scoreData: ScorePoint[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  visibleEventTypes?: string[];
  showEventLines?: boolean;
  showEventDots?: boolean;
}

// Custom tooltip component for events
const EventTooltip = ({ event }: { event: VisibilityEvent }) => {
  const style = getEventStyleWithImpact(event.type, event.impact);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{style.icon}</span>
        <span className="font-semibold text-sm text-gray-900">{event.title}</span>
      </div>
      
      <div className="text-xs text-gray-600 mb-1">
        {new Date(event.date).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </div>
      
      {event.description && (
        <div className="text-xs text-gray-700 mb-2">
          {event.description}
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-gray-500">
          {style.label}
        </span>
        {event.impact && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            event.impact === 'positive' 
              ? 'bg-green-100 text-green-700' 
              : event.impact === 'negative'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {event.impact === 'positive' ? 'Positiv' : 
             event.impact === 'negative' ? 'Negativ' : 'Neutral'}
          </span>
        )}
      </div>
    </div>
  );
};

// Helper function to find score value at event date
const getScoreAtDate = (scoreData: ScorePoint[], eventDate: string): number => {
  // Return default if no data
  if (!scoreData || scoreData.length === 0) {
    return 50;
  }
  
  // Find exact match first
  const exactMatch = scoreData.find(point => point.date === eventDate);
  if (exactMatch) return exactMatch.score_value;
  
  // Find closest date if no exact match
  const eventTime = new Date(eventDate).getTime();
  let closestPoint = scoreData[0];
  let minDiff = Math.abs(new Date(scoreData[0].date).getTime() - eventTime);
  
  for (const point of scoreData) {
    const diff = Math.abs(new Date(point.date).getTime() - eventTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestPoint = point;
    }
  }
  
  return closestPoint?.score_value || 50; // Default to middle if no data
};

// Filter events based on date range and visible types
const filterEvents = (
  events: VisibilityEvent[],
  dateRange?: { from: Date; to: Date },
  visibleEventTypes?: string[]
): VisibilityEvent[] => {
  let filtered = events;
  
  // Filter by date range
  if (dateRange) {
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= dateRange.from && eventDate <= dateRange.to;
    });
  }
  
  // Filter by visible event types
  if (visibleEventTypes !== undefined) {
    if (visibleEventTypes.length === 0) {
      return []; // No types selected means no events shown
    }
    filtered = filtered.filter(event => 
      visibleEventTypes.includes(event.type)
    );
  }
  
  return filtered;
};

export const EventAnnotations: React.FC<EventAnnotationsProps> = ({
  events,
  scoreData,
  dateRange,
  visibleEventTypes,
  showEventLines = true,
  showEventDots = true
}) => {
  // Filter events based on props
  const filteredEvents = filterEvents(events, dateRange, visibleEventTypes);
  
  if (filteredEvents.length === 0) {
    return null;
  }
  
  return (
    <>
      {filteredEvents.map((event) => {
        const style = getEventStyleWithImpact(event.type, event.impact);
        const scoreValue = getScoreAtDate(scoreData, event.date);
        
        return (
          <React.Fragment key={event.id}>
            {/* Event Reference Line */}
            {showEventLines && (
              <ReferenceLine
                x={event.date}
                stroke={style.color}
                strokeDasharray={style.strokeDasharray || '2 2'}
                strokeWidth={2}
                opacity={style.opacity || 0.7}
                label={{
                  value: style.icon,
                  position: 'top',
                  offset: 10,
                  style: {
                    fontSize: '14px',
                    fill: style.color,
                    fontWeight: 'bold'
                  }
                }}
              />
            )}
            
            {/* Event Reference Dot */}
            {showEventDots && (
              <ReferenceDot
                x={event.date}
                y={scoreValue}
                r={6}
                fill={style.color}
                stroke="#ffffff"
                strokeWidth={2}
                opacity={0.9}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

// Export custom tooltip for external use
export { EventTooltip };

// Export helper functions
export { getScoreAtDate, filterEvents };