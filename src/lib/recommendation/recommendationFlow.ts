// Recommendation Flow Integration - Task 6.4.4.4
// Bridge between trigger system and goal-specific recommendations (Task 6.3)
// Requirements: B.3, B.4

import type { ScorePoint } from '@/types/score-history';
import type { 
  TriggeredRecommendation, 
  ScoreBasedRecommendationContext,
  RecommendationTriggerResult 
} from '@/types/recommendation';
import { evaluateScoreTrend } from './recommendationTrigger';

// Import existing goal recommendations from Task 6.3
import { increaseReviewsRecommendations } from '@/data/recommendations/increase_reviews';
import { localVisibilityRecommendations } from '@/data/recommendations/local_visibility';
import { lunchConversionRecommendations } from '@/data/recommendations/lunch_conversion';
import { igGrowthRecommendations } from '@/data/recommendations/ig_growth';
import { groupBookingsRecommendations } from '@/data/recommendations/group_bookings';

/**
 * Generate triggered recommendation by combining trigger analysis with goal-specific recommendations
 */
export function getTriggeredRecommendation(
  scoreType: string, 
  scores: ScorePoint[],
  businessCategory?: string,
  businessId?: string
): TriggeredRecommendation | null {
  // Evaluate if trigger conditions are met
  const trigger = evaluateScoreTrend(scores, scoreType, businessCategory);
  
  if (!trigger.triggered || !trigger.reason || !trigger.action) {
    return null;
  }

  // Create context for recommendation generation
  const context: ScoreBasedRecommendationContext = {
    scoreType,
    businessId,
    currentScore: trigger.metadata?.currentScore || 0,
    previousScore: trigger.metadata?.previousScore,
    trend: trigger.reason === 'drop' ? 'down' : 'flat',
    timeframe: trigger.metadata?.timeframe || '14 days'
  };

  // Generate specific recommendation based on trigger action
  const recommendation = generateRecommendationForAction(trigger, context);
  
  if (!recommendation) {
    return null;
  }

  return {
    id: generateRecommendationId(scoreType, trigger.reason),
    scoreType,
    trigger,
    recommendation,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Generate specific recommendation based on trigger action and context
 */
function generateRecommendationForAction(
  trigger: RecommendationTriggerResult,
  context: ScoreBasedRecommendationContext
) {
  const { action, severity, reason } = trigger;
  
  switch (action) {
    case 'review_google':
      return generateGoogleRecommendation(trigger, context);
    
    case 'check_ig':
      return generateInstagramRecommendation(trigger, context);
    
    case 'update_content':
      return generateContentRecommendation(trigger, context);
    
    case 'improve_seo':
      return generateSEORecommendation(trigger, context);
    
    case 'boost_reviews':
      return generateReviewsRecommendation(trigger, context);
    
    case 'optimize_website':
      return generateWebsiteRecommendation(trigger, context);
    
    default:
      return generateGenericRecommendation(trigger, context);
  }
}

/**
 * Generate Google My Business focused recommendation
 */
function generateGoogleRecommendation(
  trigger: RecommendationTriggerResult,
  context: ScoreBasedRecommendationContext
) {
  const isStagnation = trigger.reason === 'stagnation';
  const severity = trigger.severity || 'medium';
  
  // Use local visibility recommendations as base
  const baseRecommendations = localVisibilityRecommendations.filter(rec => 
    rec.category === 'google_my_business'
  );
  
  const selectedRec = baseRecommendations[0]; // Take first relevant recommendation
  
  return {
    title: isStagnation 
      ? 'Google My Business Profil reaktivieren'
      : `Google Präsenz ${severity === 'high' ? 'dringend' : ''} verbessern`,
    description: isStagnation
      ? `Ihr Google My Business Profil zeigt seit ${context.timeframe} keine Aktivität. Zeit für eine Auffrischung!`
      : `Ihr Google Sichtbarkeits-Score ist in den letzten ${context.timeframe} um ${Math.abs((trigger.metadata?.scoreChange || 0) * 100).toFixed(1)}% gesunken.`,
    actionItems: selectedRec ? [
      selectedRec.title,
      ...selectedRec.steps.slice(0, 3) // Take first 3 steps
    ] : [
      'Google My Business Profil aktualisieren',
      'Neue Fotos hochladen',
      'Öffnungszeiten überprüfen',
      'Auf Bewertungen antworten'
    ],
    priority: severity,
    estimatedImpact: severity === 'high' ? '+15-25 Punkte' : '+8-15 Punkte',
    timeToImplement: '2-4 Stunden'
  };
}

/**
 * Generate Instagram/Social Media recommendation
 */
function generateInstagramRecommendation(
  trigger: RecommendationTriggerResult,
  context: ScoreBasedRecommendationContext
) {
  const baseRecommendations = igGrowthRecommendations.filter(rec => 
    rec.category === 'content_creation'
  );
  
  const selectedRec = baseRecommendations[0];
  
  return {
    title: 'Instagram Präsenz stärken',
    description: `Ihre Social Media Sichtbarkeit benötigt Aufmerksamkeit. Aktuelle Entwicklung: ${(trigger.metadata?.scoreChange || 0) > 0 ? 'Stagnation' : 'Rückgang'} über ${context.timeframe}.`,
    actionItems: selectedRec ? [
      selectedRec.title,
      ...selectedRec.steps.slice(0, 3)
    ] : [
      'Neue Instagram Posts erstellen',
      'Stories regelmäßig posten',
      'Hashtag-Strategie überarbeiten',
      'Community Engagement erhöhen'
    ],
    priority: trigger.severity || 'medium',
    estimatedImpact: '+10-20 Punkte',
    timeToImplement: '3-5 Stunden'
  };
}

/**
 * Generate content update recommendation
 */
function generateContentRecommendation(
  trigger: RecommendationTriggerResult,
  context: ScoreBasedRecommendationContext
) {
  return {
    title: 'Content-Strategie überarbeiten',
    description: `Ihre Inhalte benötigen eine Auffrischung. ${trigger.reason === 'stagnation' ? 'Stagnation' : 'Rückgang'} über ${context.timeframe} deutet auf veralteten Content hin.`,
    actionItems: [
      'Website-Texte aktualisieren',
      'Neue Blog-Artikel erstellen',
      'Social Media Content planen',
      'Saisonale Angebote hervorheben'
    ],
    priority: trigger.severity || 'medium',
    estimatedImpact: '+8-18 Punkte',
    timeToImplement: '4-6 Stunden'
  };
}

/**
 * Generate SEO improvement recommendation
 */
function generateSEORecommendation(
  trigger: RecommendationTriggerResult,
  context: ScoreBasedRecommendationContext
) {
  return {
    title: 'SEO-Optimierung durchführen',
    description: `Ihre Suchmaschinenoptimierung zeigt Verbesserungspotential. Optimierung kann die Sichtbarkeit nachhaltig steigern.`,
    actionItems: [
      'Meta-Descriptions überarbeiten',
      'Lokale Keywords optimieren',
      'Ladezeiten verbessern',
      'Mobile Optimierung prüfen'
    ],
    priority: trigger.severity || 'low',
    estimatedImpact: '+5-12 Punkte',
    timeToImplement: '2-3 Stunden'
  };
}

/**
 * Generate reviews boost recommendation
 */
function generateReviewsRecommendation(
  trigger: RecommendationTriggerResult,
  context: ScoreBasedRecommendationContext
) {
  const baseRecommendations = increaseReviewsRecommendations.filter(rec => 
    rec.category === 'review_generation'
  );
  
  const selectedRec = baseRecommendations[0];
  
  return {
    title: 'Bewertungsmanagement aktivieren',
    description: `Ihr Bewertungs-Score benötigt Aufmerksamkeit. Aktive Bewertungsgewinnung kann schnelle Verbesserungen bringen.`,
    actionItems: selectedRec ? [
      selectedRec.title,
      ...selectedRec.steps.slice(0, 3)
    ] : [
      'Bewertungen aktiv anfragen',
      'Auf bestehende Bewertungen antworten',
      'Bewertungs-QR-Code erstellen',
      'Follow-up E-Mails einrichten'
    ],
    priority: trigger.severity || 'high',
    estimatedImpact: '+12-25 Punkte',
    timeToImplement: '1-2 Stunden'
  };
}

/**
 * Generate website optimization recommendation
 */
function generateWebsiteRecommendation(
  trigger: RecommendationTriggerResult,
  context: ScoreBasedRecommendationContext
) {
  return {
    title: 'Website-Performance optimieren',
    description: `Ihre Website-Performance zeigt kritische Schwächen. Sofortige Optimierung erforderlich.`,
    actionItems: [
      'Ladezeiten analysieren und verbessern',
      'Mobile Responsiveness prüfen',
      'Broken Links reparieren',
      'SSL-Zertifikat überprüfen'
    ],
    priority: 'high',
    estimatedImpact: '+15-30 Punkte',
    timeToImplement: '3-8 Stunden'
  };
}

/**
 * Generate generic recommendation as fallback
 */
function generateGenericRecommendation(
  trigger: RecommendationTriggerResult,
  context: ScoreBasedRecommendationContext
) {
  return {
    title: 'Digitale Präsenz verbessern',
    description: `Ihre Online-Sichtbarkeit zeigt ${trigger.reason === 'stagnation' ? 'Stagnation' : 'einen Rückgang'} über ${context.timeframe}. Eine umfassende Überprüfung wird empfohlen.`,
    actionItems: [
      'Google My Business Profil überprüfen',
      'Social Media Aktivität erhöhen',
      'Website-Inhalte aktualisieren',
      'Bewertungsmanagement aktivieren'
    ],
    priority: trigger.severity || 'medium',
    estimatedImpact: '+10-20 Punkte',
    timeToImplement: '4-6 Stunden'
  };
}

/**
 * Generate unique recommendation ID
 */
function generateRecommendationId(scoreType: string, reason: string): string {
  const timestamp = Date.now();
  // Use crypto.randomUUID() for secure ID generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const uuid = crypto.randomUUID().split('-')[0]; // Use first part of UUID
    return `rec_${scoreType}_${reason}_${timestamp}_${uuid}`;
  }
  // Fallback for environments without crypto.randomUUID
  const fallback = timestamp.toString(36);
  return `rec_${scoreType}_${reason}_${timestamp}_${fallback}`;
}

/**
 * Batch process multiple score types and return prioritized recommendations
 */
export function getBatchTriggeredRecommendations(
  scoreData: Record<string, ScorePoint[]>,
  businessCategory?: string,
  businessId?: string
): TriggeredRecommendation[] {
  const recommendations: TriggeredRecommendation[] = [];
  
  for (const [scoreType, scores] of Object.entries(scoreData)) {
    const recommendation = getTriggeredRecommendation(
      scoreType, 
      scores, 
      businessCategory, 
      businessId
    );
    
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }
  
  // Sort by priority and confidence
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.recommendation.priority];
    const bPriority = priorityOrder[b.recommendation.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return (b.trigger.confidence || 0) - (a.trigger.confidence || 0);
  });
}