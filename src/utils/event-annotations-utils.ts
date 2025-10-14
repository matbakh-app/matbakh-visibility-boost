// Event Annotations Utility Functions
// Extracted from EventAnnotations.tsx to avoid JSX parsing issues in tests

import type { VisibilityEvent, ScorePoint } from '@/types/score-history';

export type ScorePoint = { date: string; score_value: number };

/**
 * Helper function to find score value at event date
 */
export const getScoreAtDate = (points: ScorePoint[], dateISO: string, defaultScore = 50): number => {
  if (!points || points.length === 0) return defaultScore;
  const target = new Date(dateISO).getTime();

  // exact match
  const exact = points.find(p => {
    const pDate = new Date(p.date).toISOString().slice(0,10);
    const targetDate = dateISO.slice(0,10);
    return pDate === targetDate;
  });
  if (exact) return exact.score_value;

  // nearest by absolute day diff
  let best: ScorePoint | undefined;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const p of points) {
    const d = Math.abs(new Date(p.date).getTime() - target);
    if (d < bestDiff) {
      best = p;
      bestDiff = d;
    }
  }
  return best?.score_value ?? defaultScore;
};

export type EventItem = {
  id: string;
  date: string;
  title: string;
  type: string;
  impact?: 'positive' | 'negative' | 'neutral';
  description?: string;
};

/**
 * Filter events based on date range and visible types
 */
export const filterEvents = (
  events: EventItem[] = [],
  range?: { from: Date; to: Date } | { start: string; end: string },
  visibleTypes?: string[]
): EventItem[] => {
  let out = events;
  if (range) {
    let startTime: number, endTime: number;
    
    if ('from' in range && 'to' in range) {
      // Handle Date objects
      startTime = range.from.getTime();
      endTime = range.to.getTime();
    } else if ('start' in range && 'end' in range) {
      // Handle string dates
      startTime = new Date(range.start).getTime();
      endTime = new Date(range.end).getTime();
    } else {
      return out;
    }
    
    out = out.filter(ev => {
      const t = new Date(ev.date).getTime();
      return t >= startTime && t <= endTime;
    });
  }
  // Important: if visibleTypes provided but empty → no events
  if (Array.isArray(visibleTypes)) {
    if (visibleTypes.length === 0) return [];
    out = out.filter(ev => visibleTypes.includes(ev.type));
  }
  return out;
};