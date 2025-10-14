// Mock Data for TrendChart Development and Testing
// Task 6.4.2.2 - Dummy Chart Data + Types

import type { ScorePoint, VisibilityEvent } from '@/types/score-history';

// Generate 30 days of realistic score trend data
export const mockTrendData: ScorePoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));

  // Create realistic score progression with some variance
  const baseScore = 65;
  const trendFactor = Math.sin(i / 8) * 15; // Gradual trend
  const randomVariance = (Math.random() - 0.5) * 8; // Daily variance
  const scoreValue = Math.max(0, Math.min(100, baseScore + trendFactor + randomVariance));

  return {
    date: date.toISOString().split('T')[0],
    score_type: 'overall_visibility',
    score_value: Math.round(scoreValue * 10) / 10, // Round to 1 decimal
    business_id: 'business-123'
  };
});

// Enhanced Mock visibility events - Task 6.4.2.4.1
export const mockVisibilityEvents: VisibilityEvent[] = [
  {
    id: 'event-1',
    date: mockTrendData[5].date,
    title: 'Google Ads Kampagne gestartet',
    type: 'social_media_campaign',
    description: 'Neue Google Ads für Mittagsmenü mit 300€ Budget.',
    impact: 'positive'
  },
  {
    id: 'event-2',
    date: mockTrendData[12].date,
    title: 'Bewertungsschub nach Event',
    type: 'review_spike',
    description: '15 neue 5-Sterne Bewertungen nach Weinverkostung.',
    impact: 'positive'
  },
  {
    id: 'event-3',
    date: mockTrendData[21].date,
    title: 'Google Core Update',
    type: 'google_algorithm_update',
    description: 'Algorithmusänderung beeinflusst lokale Suchergebnisse.',
    impact: 'negative'
  },
  {
    id: 'event-4',
    date: mockTrendData[25].date,
    title: 'SEO-Optimierung Website',
    type: 'seo_optimization',
    description: 'Neue Landing Page für vegane Gerichte optimiert.',
    impact: 'positive'
  },
  {
    id: 'event-5',
    date: mockTrendData[8].date,
    title: 'Sommerfest-Saison',
    type: 'seasonal_event',
    description: 'Erhöhte Nachfrage durch Biergarten-Saison.',
    impact: 'positive'
  },
  {
    id: 'event-6',
    date: mockTrendData[18].date,
    title: 'Konkurrenz-Eröffnung',
    type: 'visibility_dip',
    description: 'Neues italienisches Restaurant in der Nähe eröffnet.',
    impact: 'negative'
  }
];

// Mock data for different score types
export const mockScoreTypeData = {
  overall_visibility: mockTrendData,
  google_presence: mockTrendData.map(point => ({
    ...point,
    score_type: 'google_presence' as const,
    score_value: Math.max(0, Math.min(100, point.score_value + (Math.random() - 0.5) * 10))
  })),
  social_media: mockTrendData.map(point => ({
    ...point,
    score_type: 'social_media' as const,
    score_value: Math.max(0, Math.min(100, point.score_value + (Math.random() - 0.5) * 15))
  })),
  website_performance: mockTrendData.map(point => ({
    ...point,
    score_type: 'website_performance' as const,
    score_value: Math.max(0, Math.min(100, point.score_value + (Math.random() - 0.5) * 12))
  }))
};

// Helper function to get mock data by score type
export const getMockDataByScoreType = (scoreType: string): ScorePoint[] => {
  return mockScoreTypeData[scoreType as keyof typeof mockScoreTypeData] || mockTrendData;
};

// Mock business units for TrendFilters testing
export const mockBusinessUnits = [
  { id: 'unit-1', name: 'Hauptfiliale München' },
  { id: 'unit-2', name: 'Filiale Berlin' },
  { id: 'unit-3', name: 'Filiale Hamburg' },
  { id: 'unit-4', name: 'Filiale Köln' }
];

// Export event styles for easy access
export { EVENT_TYPE_STYLES, getEventStyle, getEventColor, getEventLabel } from './event-styles';