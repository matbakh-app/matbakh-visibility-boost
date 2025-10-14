/**
 * Persona Type Definitions for Advanced Persona System
 * 
 * These types define the structure for persona detection, behavior tracking,
 * and psychology-based optimization in the matbakh.app platform.
 */

// Core persona types based on restaurant owner research
export type PersonaType = 
  | 'Solo-Sarah'      // Time-pressed single restaurant owner
  | 'Bewahrer-Ben'    // Security-focused traditional owner
  | 'Wachstums-Walter' // Growth-oriented expansion-minded owner
  | 'Ketten-Katrin';  // Enterprise/chain management

// User behavior tracking for persona detection
export interface UserBehavior {
  sessionId: string;
  userId: string;
  timestamp: string;
  
  // Interaction patterns
  clickPatterns: ClickPattern[];
  navigationFlow: NavigationEvent[];
  timeSpent: TimeSpentMetrics;
  
  // Content engagement
  contentInteractions: ContentInteraction[];
  featureUsage: FeatureUsage[];
  
  // Decision-making indicators
  decisionSpeed: number; // 0-1 scale (fast to slow)
  informationConsumption: InformationConsumption;
  
  // Technical context
  deviceType: 'mobile' | 'tablet' | 'desktop';
  sessionDuration: number; // milliseconds
  pageViews: number;
}

export interface ClickPattern {
  elementType: string;
  elementId: string;
  timestamp: string;
  context: string;
}

export interface NavigationEvent {
  fromPage: string;
  toPage: string;
  timestamp: string;
  method: 'click' | 'back' | 'forward' | 'direct';
}

export interface TimeSpentMetrics {
  totalSession: number;
  perPage: Record<string, number>;
  activeTime: number;
  idleTime: number;
}

export interface ContentInteraction {
  contentType: 'text' | 'image' | 'video' | 'chart' | 'form';
  contentId: string;
  interactionType: 'view' | 'click' | 'scroll' | 'hover' | 'download';
  duration: number;
  timestamp: string;
}

export interface FeatureUsage {
  featureName: string;
  usageCount: number;
  lastUsed: string;
  completionRate: number; // 0-1 scale
}

export interface InformationConsumption {
  preferredContentLength: 'short' | 'medium' | 'long';
  readingSpeed: number; // words per minute
  comprehensionIndicators: {
    scrollBehavior: 'fast' | 'moderate' | 'slow';
    returnVisits: number;
    actionTaken: boolean;
  };
}

// Persona detection results
export interface PersonaDetectionResult {
  detectedPersona: PersonaType;
  confidence: number; // 0-1 scale
  reasoning: string[];
  alternativePersonas: {
    persona: PersonaType;
    confidence: number;
  }[];
  behaviorAnalysis: BehaviorAnalysis;
  recommendations: PersonaRecommendation[];
}

export interface BehaviorAnalysis {
  decisionMakingStyle: 'analytical' | 'intuitive' | 'mixed';
  informationProcessing: 'detailed' | 'summary' | 'visual';
  riskTolerance: 'low' | 'medium' | 'high';
  technologyComfort: 'beginner' | 'intermediate' | 'advanced';
  timeAvailability: 'limited' | 'moderate' | 'flexible';
}

export interface PersonaRecommendation {
  type: 'ui' | 'content' | 'feature' | 'onboarding';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  implementation: string;
}

// AIDA Framework integration
export type AidaPhase = 'attention' | 'interest' | 'desire' | 'action';

export interface AidaOptimization {
  phase: AidaPhase;
  persona: PersonaType;
  content: AidaContent;
  triggers: PsychologyTrigger[];
  metrics: AidaMetrics;
}

export interface AidaContent {
  headline: string;
  subheadline?: string;
  bodyText: string;
  callToAction: string;
  visualElements: string[];
  socialProof?: string[];
}

export interface PsychologyTrigger {
  type: 'social_proof' | 'scarcity' | 'authority' | 'reciprocity' | 
        'commitment' | 'liking' | 'loss_aversion' | 'anchoring';
  implementation: string;
  strength: 'subtle' | 'moderate' | 'strong';
  ethical: boolean;
}

export interface AidaMetrics {
  engagementRate: number;
  conversionRate: number;
  timeToAction: number;
  dropoffPoints: string[];
}

// Persona-specific configurations
export interface PersonaConfig {
  persona: PersonaType;
  displayName: string;
  description: string;
  characteristics: string[];
  preferences: PersonaPreferences;
  onboardingFlow: OnboardingStep[];
  uiAdaptations: UiAdaptation[];
}

export interface PersonaPreferences {
  contentLength: 'short' | 'medium' | 'long';
  visualStyle: 'minimal' | 'standard' | 'rich';
  interactionStyle: 'guided' | 'exploratory' | 'expert';
  communicationTone: 'formal' | 'friendly' | 'professional';
  decisionSupport: 'high' | 'medium' | 'low';
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  duration: number; // estimated minutes
  required: boolean;
  personaSpecific: boolean;
}

export interface UiAdaptation {
  component: string;
  adaptationType: 'layout' | 'content' | 'behavior' | 'styling';
  changes: Record<string, any>;
  conditions: string[];
}

// A/B Testing for persona optimization
export interface PersonaAbTest {
  id: string;
  name: string;
  persona: PersonaType;
  variants: AbTestVariant[];
  metrics: AbTestMetrics;
  status: 'draft' | 'running' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
}

export interface AbTestVariant {
  id: string;
  name: string;
  trafficAllocation: number; // 0-1 scale
  changes: UiAdaptation[];
  conversionGoals: string[];
}

export interface AbTestMetrics {
  participants: number;
  conversions: number;
  conversionRate: number;
  statisticalSignificance: number;
  confidenceInterval: [number, number];
}

// Admin and debugging interfaces
export interface PersonaDebugInfo {
  sessionId: string;
  userId: string;
  detectionHistory: PersonaDetectionResult[];
  behaviorTimeline: UserBehavior[];
  abTestParticipation: string[];
  overrides: PersonaOverride[];
}

export interface PersonaOverride {
  id: string;
  adminUserId: string;
  targetUserId: string;
  originalPersona: PersonaType;
  overridePersona: PersonaType;
  reason: string;
  timestamp: string;
  expiresAt?: string;
}

// Event tracking for analytics
export interface PersonaEvent {
  eventType: 'detection' | 'adaptation' | 'conversion' | 'feedback';
  persona: PersonaType;
  userId: string;
  sessionId: string;
  timestamp: string;
  data: Record<string, any>;
  source: 'automatic' | 'manual' | 'admin_override';
}

// Integration with existing matbakh systems
export interface PersonaIntegration {
  visibilityCheck: {
    persona: PersonaType;
    adaptedResults: any;
    presentationStyle: string;
  };
  onboarding: {
    persona: PersonaType;
    customizedFlow: OnboardingStep[];
    completionRate: number;
  };
  dashboard: {
    persona: PersonaType;
    widgetConfiguration: any[];
    layoutPreferences: any;
  };
}