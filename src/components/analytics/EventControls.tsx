// EventControls Component - Task 6.4.2.4.2.3
// User controls for event visibility and filtering

import React from 'react';
import type { FC } from 'react';
import type { EventType } from '@/types/score-history';
import { getEventStyle } from '@/data/analytics/event-styles';

interface EventControlsProps {
  visibleEventTypes: EventType[];
  onEventTypesChange: (types: EventType[]) => void;
  showEventLines: boolean;
  onShowEventLinesChange: (show: boolean) => void;
  showEventDots: boolean;
  onShowEventDotsChange: (show: boolean) => void;
  showEvents: boolean;
  onShowEventsChange: (show: boolean) => void;
  className?: string;
}

const allEventTypes: EventType[] = [
  'google_algorithm_update',
  'social_media_campaign',
  'review_spike',
  'visibility_dip',
  'seo_optimization',
  'platform_feature',
  'seasonal_event',
  'manual_annotation'
];

export const EventControls: FC<EventControlsProps> = ({
  visibleEventTypes,
  onEventTypesChange,
  showEventLines,
  onShowEventLinesChange,
  showEventDots,
  onShowEventDotsChange,
  showEvents,
  onShowEventsChange,
  className = ''
}) => {
  // Toggle all event types
  const handleToggleAll = () => {
    if (visibleEventTypes.length === allEventTypes.length) {
      onEventTypesChange([]);
    } else {
      onEventTypesChange(allEventTypes);
    }
  };

  // Toggle individual event type
  const handleToggleEventType = (eventType: EventType) => {
    if (visibleEventTypes.includes(eventType)) {
      onEventTypesChange(visibleEventTypes.filter(type => type !== eventType));
    } else {
      onEventTypesChange([...visibleEventTypes, eventType]);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Main Event Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Event-Annotationen</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showEvents}
            onChange={(e) => onShowEventsChange(e.target.checked)}
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Events anzeigen</span>
        </label>
      </div>

      {showEvents && (
        <>
          {/* Display Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showEventLines}
                onChange={(e) => onShowEventLinesChange(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Linien anzeigen</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showEventDots}
                onChange={(e) => onShowEventDotsChange(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Punkte anzeigen</span>
            </label>
          </div>

          {/* Event Type Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Event-Typen</h4>
              <button
                onClick={handleToggleAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {visibleEventTypes.length === allEventTypes.length ? 'Alle ausblenden' : 'Alle anzeigen'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allEventTypes.map((eventType) => {
                const style = getEventStyle(eventType);
                const isVisible = visibleEventTypes.includes(eventType);
                
                return (
                  <label
                    key={eventType}
                    className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                      isVisible 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => handleToggleEventType(eventType)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: style.color }}
                      />
                      <span className="text-xs">{style.icon}</span>
                      <span className="text-xs text-gray-700 truncate">
                        {style.label}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Event Count Summary */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {visibleEventTypes.length} von {allEventTypes.length} Event-Typen sichtbar
            </div>
          </div>
        </>
      )}
    </div>
  );
};