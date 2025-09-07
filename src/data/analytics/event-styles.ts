// Event Visual Mapping - Task 6.4.2.4.1
// Defines colors, icons, and labels for different event types

import type { EventType } from '@/types/score-history';

export interface EventStyle {
  color: string;
  icon: string;
  label: string;
  strokeDasharray?: string;
  opacity?: number;
}

export const EVENT_TYPE_STYLES: Record<EventType, EventStyle> = {
  google_algorithm_update: {
    color: '#FF6B6B',
    icon: '⚡️',
    label: 'Google Algorithmus-Update',
    strokeDasharray: '5 5',
    opacity: 0.8
  },
  social_media_campaign: {
    color: '#4ECDC4',
    icon: '#️⃣',
    label: 'Social Media Kampagne',
    strokeDasharray: '3 3',
    opacity: 0.9
  },
  review_spike: {
    color: '#FFD93D',
    icon: '⭐️',
    label: 'Bewertungsschub',
    strokeDasharray: '2 2',
    opacity: 0.9
  },
  visibility_dip: {
    color: '#A29BFE',
    icon: '↓',
    label: 'Sichtbarkeits-Einbruch',
    strokeDasharray: '8 2',
    opacity: 0.7
  },
  seo_optimization: {
    color: '#00B894',
    icon: '🔍',
    label: 'SEO-Maßnahme',
    strokeDasharray: '1 1',
    opacity: 0.8
  },
  platform_feature: {
    color: '#F368E0',
    icon: '🔧',
    label: 'Plattform-Update',
    strokeDasharray: '4 4',
    opacity: 0.8
  },
  seasonal_event: {
    color: '#FAB1A0',
    icon: '📅',
    label: 'Saisonales Ereignis',
    strokeDasharray: '6 2',
    opacity: 0.9
  },
  manual_annotation: {
    color: '#636e72',
    icon: '📝',
    label: 'Manuelle Notiz',
    strokeDasharray: '2 4',
    opacity: 0.6
  }
};

// Helper function to get event style
export const getEventStyle = (eventType: EventType): EventStyle => {
  return EVENT_TYPE_STYLES[eventType];
};

// Helper function to get event color
export const getEventColor = (eventType: EventType): string => {
  return EVENT_TYPE_STYLES[eventType].color;
};

// Helper function to get event label
export const getEventLabel = (eventType: EventType): string => {
  return EVENT_TYPE_STYLES[eventType].label;
};

// Impact-based color modifiers
export const IMPACT_MODIFIERS = {
  positive: {
    colorSuffix: '',
    iconPrefix: '✅ '
  },
  negative: {
    colorSuffix: '',
    iconPrefix: '❌ '
  },
  neutral: {
    colorSuffix: '',
    iconPrefix: 'ℹ️ '
  }
};

// Get event style with impact consideration
export const getEventStyleWithImpact = (
  eventType: EventType, 
  impact?: 'positive' | 'negative' | 'neutral'
): EventStyle => {
  const baseStyle = getEventStyle(eventType);
  
  if (!impact) return baseStyle;
  
  const modifier = IMPACT_MODIFIERS[impact];
  
  return {
    ...baseStyle,
    icon: modifier.iconPrefix + baseStyle.icon
  };
};