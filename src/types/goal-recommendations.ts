/**
 * Goal-Specific Recommendation System Types
 * Defines the structure for AI-generated recommendations based on business objectives
 */

export type GoalId = 
  | 'increase_reviews'
  | 'local_visibility' 
  | 'lunch_conversion'
  | 'ig_growth'
  | 'group_bookings';

export type Platform = 
  | 'Google' 
  | 'Instagram' 
  | 'Facebook' 
  | 'Website' 
  | 'Offline';

export type PersonaTarget = 
  | 'Solo-Sarah'        // Einzelunternehmerin, einfache Lösungen
  | 'Bewahrer-Ben'      // Traditioneller Gastronom, bewährte Methoden
  | 'Wachstums-Walter'  // Ambitionierter Unternehmer, Expansion
  | 'Ketten-Katrin';    // Managerin Restaurantkette/Franchise

export interface GoalRecommendation {
  goalId: GoalId;
  recommendationId: string;
  title: string;                 // max. 12 Wörter
  description: string;           // 3-4 Sätze, inkl. Wirkung und Umsetzungshinweis
  platform: Platform;
  impactScore: number;           // Wirkung: 1-10
  effortScore: number;           // Aufwand: 1-10
  personaTargets: PersonaTarget[];
}

export interface GoalProfile {
  goalId: GoalId;
  titleDE: string;
  titleEN: string;
  description: string;
  recommendations: GoalRecommendation[];
}

// Initial goal profiles definition
export const GOAL_PROFILES: Record<GoalId, Omit<GoalProfile, 'recommendations'>> = {
  increase_reviews: {
    goalId: 'increase_reviews',
    titleDE: 'Mehr Google-Bewertungen',
    titleEN: 'Increase Google Reviews',
    description: 'Fokus auf Maßnahmen zur Generierung echter Gästebewertungen'
  },
  local_visibility: {
    goalId: 'local_visibility',
    titleDE: 'Lokale Sichtbarkeit steigern',
    titleEN: 'Improve Local Visibility',
    description: 'Verbesserte Auffindbarkeit bei „in der Nähe"-Suchanfragen'
  },
  lunch_conversion: {
    goalId: 'lunch_conversion',
    titleDE: 'Mittagstisch pushen',
    titleEN: 'Boost Lunch Traffic',
    description: 'Sichtbarkeit und Relevanz von Mittagsangeboten und Tagesdeals erhöhen'
  },
  ig_growth: {
    goalId: 'ig_growth',
    titleDE: 'Instagram-Wachstum',
    titleEN: 'Grow Instagram Presence',
    description: 'Reels, Stories, Posts & visuelle Konsistenz zur organischen Reichweite'
  },
  group_bookings: {
    goalId: 'group_bookings',
    titleDE: 'Gruppenbuchungen erhöhen',
    titleEN: 'Increase Group Bookings',
    description: 'Buchungen für Gruppen, Familien & B2B-Termine fördern'
  }
};

// Persona definitions for targeting (aligned with established matbakh.app personas)
export const PERSONA_DEFINITIONS = {
  'Solo-Sarah': {
    name: 'Solo-Sarah',
    description: 'Einzelunternehmerin, die einfache und schnelle Lösungen braucht',
    characteristics: ['zeitknapp', 'einfache_bedienung', 'quick_wins', 'begrenzte_ressourcen'],
    platforms: ['Google', 'Instagram'],
    motivations: ['einfachheit', 'schnelle_ergebnisse', 'kosteneffizienz', 'zeitersparnis'],
    complexity: 'simple'
  },
  'Bewahrer-Ben': {
    name: 'Bewahrer-Ben', 
    description: 'Traditioneller Gastronom, der bewährte Methoden schätzt',
    characteristics: ['vorsichtig', 'bewährte_methoden', 'qualität_vor_quantität', 'lokal_verwurzelt'],
    platforms: ['Google', 'Facebook', 'Offline'],
    motivations: ['bewährte_strategien', 'risiko_minimierung', 'lokaler_fokus', 'qualität'],
    complexity: 'moderate'
  },
  'Wachstums-Walter': {
    name: 'Wachstums-Walter',
    description: 'Ambitionierter Unternehmer mit Expansionsplänen',
    characteristics: ['wachstumsorientiert', 'technologie_affin', 'risikobereit', 'skalierung_fokus'],
    platforms: ['Instagram', 'Facebook', 'Website'],
    motivations: ['wachstum', 'innovation', 'roi_optimierung', 'expansion'],
    complexity: 'advanced'
  },
  'Ketten-Katrin': {
    name: 'Ketten-Katrin',
    description: 'Managerin einer Restaurantkette oder Franchise',
    characteristics: ['multi_location', 'standardisierung', 'datengetrieben', 'effizienz_fokus'],
    platforms: ['Website', 'Google', 'Facebook'],
    motivations: ['standardisierung', 'effizienz', 'skalierbarkeit', 'benchmark_vergleiche'],
    complexity: 'advanced'
  }
} as const;