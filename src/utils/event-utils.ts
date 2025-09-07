// Event Utility Functions - Task 6.4.2.4.1
// Helper functions for working with visibility events

import type { VisibilityEvent, EventType } from '@/types/score-history';
import { getEventStyleWithImpact } from '@/data/analytics/event-styles';

// Filter events by date range
export const filterEventsByDateRange = (
  events: VisibilityEvent[],
  startDate: Date,
  endDate: Date
): VisibilityEvent[] => {
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startDate && eventDate <= endDate;
  });
};

// Filter events by type
export const filterEventsByType = (
  events: VisibilityEvent[],
  eventTypes: EventType[]
): VisibilityEvent[] => {
  return events.filter(event => eventTypes.includes(event.type));
};

// Filter events by impact
export const filterEventsByImpact = (
  events: VisibilityEvent[],
  impacts: ('positive' | 'negative' | 'neutral')[]
): VisibilityEvent[] => {
  return events.filter(event => 
    event.impact && impacts.includes(event.impact)
  );
};

// Sort events by date (newest first)
export const sortEventsByDate = (
  events: VisibilityEvent[],
  order: 'asc' | 'desc' = 'desc'
): VisibilityEvent[] => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
};

// Group events by type
export const groupEventsByType = (
  events: VisibilityEvent[]
): Record<EventType, VisibilityEvent[]> => {
  const grouped = {} as Record<EventType, VisibilityEvent[]>;
  
  events.forEach(event => {
    if (!grouped[event.type]) {
      grouped[event.type] = [];
    }
    grouped[event.type].push(event);
  });
  
  return grouped;
};

// Get events within X days of a specific date
export const getEventsNearDate = (
  events: VisibilityEvent[],
  targetDate: Date,
  dayRange: number = 7
): VisibilityEvent[] => {
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - dayRange);
  
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + dayRange);
  
  return filterEventsByDateRange(events, startDate, endDate);
};

// Format event for tooltip display
export const formatEventForTooltip = (event: VisibilityEvent): string => {
  const style = getEventStyleWithImpact(event.type, event.impact);
  const impactText = event.impact ? ` (${event.impact})` : '';
  
  return `${style.icon} ${event.title}${impactText}${
    event.description ? `\n${event.description}` : ''
  }`;
};

// Get event summary statistics
export const getEventStatistics = (events: VisibilityEvent[]) => {
  const total = events.length;
  const byType = groupEventsByType(events);
  const byImpact = {
    positive: events.filter(e => e.impact === 'positive').length,
    negative: events.filter(e => e.impact === 'negative').length,
    neutral: events.filter(e => e.impact === 'neutral').length
  };
  
  return {
    total,
    byType: Object.entries(byType).map(([type, eventList]) => ({
      type: type as EventType,
      count: eventList.length
    })),
    byImpact
  };
};

// Check if event falls within a specific date
export const isEventOnDate = (event: VisibilityEvent, date: Date): boolean => {
  const eventDate = new Date(event.date);
  return eventDate.toDateString() === date.toDateString();
};

// Get the most recent event before a specific date
export const getLastEventBeforeDate = (
  events: VisibilityEvent[],
  date: Date
): VisibilityEvent | null => {
  const sortedEvents = sortEventsByDate(events, 'desc');
  return sortedEvents.find(event => new Date(event.date) < date) || null;
};

// Validate event data
export const validateEvent = (event: Partial<VisibilityEvent>): string[] => {
  const errors: string[] = [];
  
  if (!event.id) errors.push('Event ID is required');
  if (!event.date) errors.push('Event date is required');
  if (!event.title) errors.push('Event title is required');
  if (!event.type) errors.push('Event type is required');
  
  if (event.date && isNaN(new Date(event.date).getTime())) {
    errors.push('Event date must be a valid date');
  }
  
  return errors;
};