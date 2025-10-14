// TrendAnalytics Demo Component - Combined TrendChart + TrendFilters
// Task 6.4.2.3 - Filter Controls Integration Demo

import React, { useState } from 'react';
import { TrendChart } from './TrendChart';
import { TrendFilters } from './TrendFilters';
import { EventControls } from './EventControls';
import { getMockDataByScoreType, mockVisibilityEvents, mockBusinessUnits } from '@/data/analytics/mock-score-trend';
import type { TrendFilters as TrendFiltersType, ScoreType, EventType } from '@/types/score-history';

export const TrendAnalyticsDemo: React.FC = () => {
  // Initialize filters with default values
  const [filters, setFilters] = useState<TrendFiltersType>({
    scoreType: 'overall_visibility',
    dateRange: {
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date()
    },
    businessUnit: undefined
  });

  // Event control states
  const [showEvents, setShowEvents] = useState(true);
  const [showEventLines, setShowEventLines] = useState(true);
  const [showEventDots, setShowEventDots] = useState(true);
  const [visibleEventTypes, setVisibleEventTypes] = useState<EventType[]>([
    'google_algorithm_update',
    'social_media_campaign',
    'review_spike',
    'seo_optimization'
  ]);

  // Get filtered data based on current filters
  const getFilteredData = () => {
    let data = getMockDataByScoreType(filters.scoreType);
    
    // Filter by date range
    data = data.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= filters.dateRange.from && pointDate <= filters.dateRange.to;
    });
    
    // Filter by business unit (in real implementation, this would filter actual data)
    // For demo purposes, we'll just modify the business_id in the data
    if (filters.businessUnit) {
      data = data.map(point => ({
        ...point,
        business_id: filters.businessUnit!
      }));
    }
    
    return data;
  };

  const filteredData = getFilteredData();
  const selectedBusinessUnit = filters.businessUnit 
    ? mockBusinessUnits.find(unit => unit.id === filters.businessUnit)
    : null;

  // Filter events by date range
  const filteredEvents = showEvents ? mockVisibilityEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= filters.dateRange.from && eventDate <= filters.dateRange.to;
  }) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sichtbarkeits-Trend Analyse
        </h1>
        <p className="text-gray-600">
          Interaktive Analyse der Sichtbarkeitsentwicklung mit Filtern und Event-Annotationen
        </p>
      </div>

      {/* Filters */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Filter & Einstellungen
        </h2>
        <TrendFilters
          value={filters}
          onChange={setFilters}
          businessUnits={mockBusinessUnits}
        />
      </div>

      {/* Event Controls */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Event-Einstellungen
        </h2>
        <EventControls
          visibleEventTypes={visibleEventTypes}
          onEventTypesChange={setVisibleEventTypes}
          showEventLines={showEventLines}
          onShowEventLinesChange={setShowEventLines}
          showEventDots={showEventDots}
          onShowEventDotsChange={setShowEventDots}
          showEvents={showEvents}
          onShowEventsChange={setShowEvents}
        />
      </div>

      {/* Data Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Datenpunkte:</span> {filteredData.length}
          </div>
          <div>
            <span className="font-medium">Events:</span> {filteredEvents.length}
          </div>
          <div>
            <span className="font-medium">Sichtbare Event-Typen:</span> {visibleEventTypes.length}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Trend-Visualisierung
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {filteredData.length > 0 ? (
            <TrendChart
              data={filteredData}
              scoreType={filters.scoreType}
              dateRange={filters.dateRange}
              businessUnit={selectedBusinessUnit?.name}
              events={filteredEvents}
              showEvents={showEvents}
              showEventLines={showEventLines}
              showEventDots={showEventDots}
              visibleEventTypes={visibleEventTypes}
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">Keine Daten verfügbar</p>
                <p className="text-sm">Bitte passen Sie den Zeitraum an oder wählen Sie eine andere Metrik.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Summary */}
      {filteredData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Statistik-Übersicht
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(filteredData[filteredData.length - 1]?.score_value || 0)}
              </div>
              <div className="text-sm text-gray-600">Aktueller Score</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(Math.max(...filteredData.map(d => d.score_value)))}
              </div>
              <div className="text-sm text-gray-600">Höchster Score</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {Math.round(Math.min(...filteredData.map(d => d.score_value)))}
              </div>
              <div className="text-sm text-gray-600">Niedrigster Score</div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(filteredData.reduce((sum, d) => sum + d.score_value, 0) / filteredData.length)}
              </div>
              <div className="text-sm text-gray-600">Durchschnitt</div>
            </div>
          </div>
        </div>
      )}

      {/* Event Legend */}
      {filteredEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Event-Übersicht
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((event, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-4 h-0.5 bg-red-500 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.label}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString('de-DE')} • {event.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};