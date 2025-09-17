// Event Annotations Utility Functions
// Extracted from EventAnnotations.tsx to avoid JSX parsing issues in tests

import type { VisibilityEvent, ScorePoint } from '@/types/score-history';

/**
 * Helper function to find score value at event date
 */
export const getScoreAtDate = (scoreData: ScorePoint[], eventDate: string): number => {
  // Return default if no data
  if (!scoreData || scoreData.length === 0) {
    return 0;
  }

  // Find exact match first
  const exactMatch = scoreData.find(point => point.date === eventDate);
  if (exactMatch) {
    return exactMatch.score;
  }

  // If no exact match, interpolate between closest points
  const sortedData = [...scoreData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const eventTime = new Date(eventDate).getTime();

  // Find the two closest points
  let beforePoint: ScorePoint | null = null;
  let afterPoint: ScorePoint | null = null;

  for (const point of sortedData) {
    const pointTime = new Date(point.date).getTime();
    if (pointTime <= eventTime) {
      beforePoint = point;
    } else if (pointTime > eventTime && !afterPoint) {
      afterPoint = point;
      break;
    }
  }

  // If we have both points, interpolate
  if (beforePoint && afterPoint) {
    const beforeTime = new Date(beforePoint.date).getTime();
    const afterTime = new Date(afterPoint.date).getTime();
    const ratio = (eventTime - beforeTime) / (afterTime - beforeTime);
    return beforePoint.score + (afterPoint.score - beforePoint.score) * ratio;
  }

  // If only one point, use it
  if (beforePoint) return beforePoint.score;
  if (afterPoint) return afterPoint.score;

  // Fallback
  return 0;
};

/**
 * Filter events based on date range and visible types
 */
export const filterEvents = (
  events: VisibilityEvent[],
  dateRange?: { from: Date; to: Date },
  visibleEventTypes?: string[]
): VisibilityEvent[] => {
  let filtered = [...events];

  // Filter by date range
  if (dateRange) {
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= dateRange.from && eventDate <= dateRange.to;
    });
  }

  // Filter by visible event types
  if (visibleEventTypes && visibleEventTypes.length > 0) {
    filtered = filtered.filter(event => visibleEventTypes.includes(event.type));
  }

  return filtered;
};