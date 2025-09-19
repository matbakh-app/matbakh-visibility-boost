// TrendChart Demo Component for Development Testing
// Task 6.4.2.1 - Development and Testing

import React, { useState } from 'react';
import { TrendChart } from './TrendChart';
import { mockTrendData, mockVisibilityEvents, getMockDataByScoreType } from '@/data/analytics/mock-score-trend';
import type { ScoreType } from '@/types/score-history';

export const TrendChartDemo: React.FC = () => {
  const [selectedScoreType, setSelectedScoreType] = useState<ScoreType>('overall_visibility');
  const [showEvents, setShowEvents] = useState(true);

  const scoreTypes: ScoreType[] = [
    'overall_visibility',
    'google_presence',
    'social_media',
    'website_performance',
    'review_management',
    'local_seo',
    'content_quality',
    'competitive_position'
  ];

  const scoreTypeLabels: Record<ScoreType, string> = {
    overall_visibility: 'Gesamtsichtbarkeit',
    google_presence: 'Google Präsenz',
    social_media: 'Social Media',
    website_performance: 'Website Performance',
    review_management: 'Bewertungsmanagement',
    local_seo: 'Lokale SEO',
    content_quality: 'Content Qualität',
    competitive_position: 'Wettbewerbsposition'
  };

  const currentData = getMockDataByScoreType(selectedScoreType);
  const dateRange = {
    from: new Date(currentData[0]?.date || new Date()),
    to: new Date(currentData[currentData.length - 1]?.date || new Date())
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          TrendChart Demo - Sichtbarkeitsentwicklung
        </h1>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score-Typ:
            </label>
            <select
              value={selectedScoreType}
              onChange={(e) => setSelectedScoreType(e.target.value as ScoreType)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {scoreTypes.map(type => (
                <option key={type} value={type}>
                  {scoreTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showEvents}
                onChange={(e) => setShowEvents(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Events anzeigen</span>
            </label>
          </div>
        </div>

        {/* Chart Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Score-Typ:</span> {scoreTypeLabels[selectedScoreType]}
            </div>
            <div>
              <span className="font-medium">Zeitraum:</span> {dateRange.from.toLocaleDateString('de-DE')} - {dateRange.to.toLocaleDateString('de-DE')}
            </div>
            <div>
              <span className="font-medium">Datenpunkte:</span> {currentData.length}
            </div>
          </div>
        </div>
      </div>

      {/* TrendChart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <TrendChart
          data={currentData}
          scoreType={selectedScoreType}
          dateRange={dateRange}
          businessUnit="Demo Restaurant"
          events={showEvents ? mockVisibilityEvents : []}
        />
      </div>

      {/* Legend */}
      {showEvents && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Event-Legende:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {mockVisibilityEvents.map((event, i) => (
              <div key={i} className="flex items-center">
                <div className="w-3 h-0.5 bg-red-500 mr-2"></div>
                <span>{event.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};