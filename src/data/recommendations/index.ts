/**
 * Goal-Specific Recommendations Index
 * Central aggregation of all AI-generated recommendations by goal
 */

import { GoalId, GoalProfile, GoalRecommendation, PersonaTarget, GOAL_PROFILES } from '../../types/goal-recommendations';

// Import all recommendation sets
import increase_reviews_recommendations from './increase_reviews';
import local_visibility_recommendations from './local_visibility';
import lunch_conversion_recommendations from './lunch_conversion';
import ig_growth_recommendations from './ig_growth';
import group_bookings_recommendations from './group_bookings';

// Aggregate all recommendations by goal
const RECOMMENDATIONS_BY_GOAL: Record<GoalId, GoalRecommendation[]> = {
  increase_reviews: increase_reviews_recommendations,
  local_visibility: local_visibility_recommendations,
  lunch_conversion: lunch_conversion_recommendations,
  ig_growth: ig_growth_recommendations,
  group_bookings: group_bookings_recommendations
};

/**
 * Get all recommendations for a specific goal
 */
export function getRecommendationsByGoal(goalId: GoalId): GoalRecommendation[] {
  return RECOMMENDATIONS_BY_GOAL[goalId] || [];
}

/**
 * Get complete goal profile with recommendations
 */
export function getGoalProfile(goalId: GoalId): GoalProfile {
  const baseProfile = GOAL_PROFILES[goalId];
  const recommendations = getRecommendationsByGoal(goalId);
  
  return {
    ...baseProfile,
    recommendations
  };
}

/**
 * Get all available goal profiles with recommendations
 */
export function getAllGoalProfiles(): GoalProfile[] {
  return Object.keys(GOAL_PROFILES).map(goalId => 
    getGoalProfile(goalId as GoalId)
  );
}

/**
 * Get recommendations sorted by impact/effort score
 */
export function getRecommendationsSorted(
  goalId: GoalId, 
  sortBy: 'impact' | 'effort' | 'combined' = 'combined'
): GoalRecommendation[] {
  const recommendations = getRecommendationsByGoal(goalId);
  
  return recommendations.sort((a, b) => {
    switch (sortBy) {
      case 'impact':
        return b.impactScore - a.impactScore;
      case 'effort':
        return a.effortScore - b.effortScore; // Lower effort = better
      case 'combined':
        // Combined score: Impact/Effort ratio (higher is better)
        const scoreA = a.impactScore / a.effortScore;
        const scoreB = b.impactScore / b.effortScore;
        return scoreB - scoreA;
      default:
        return 0;
    }
  });
}

/**
 * Filter recommendations by persona target
 */
export function getRecommendationsByPersona(
  goalId: GoalId, 
  persona: PersonaTarget
): GoalRecommendation[] {
  const recommendations = getRecommendationsByGoal(goalId);
  return recommendations.filter(rec => 
    rec.personaTargets.includes(persona)
  );
}

/**
 * Filter recommendations by platform
 */
export function getRecommendationsByPlatform(
  goalId: GoalId, 
  platform: 'Google' | 'Instagram' | 'Facebook' | 'Website' | 'Offline'
): GoalRecommendation[] {
  const recommendations = getRecommendationsByGoal(goalId);
  return recommendations.filter(rec => rec.platform === platform);
}

/**
 * Get quick wins (high impact, low effort)
 */
export function getQuickWins(goalId: GoalId): GoalRecommendation[] {
  const recommendations = getRecommendationsByGoal(goalId);
  return recommendations.filter(rec => 
    rec.impactScore >= 7 && rec.effortScore <= 4
  );
}

/**
 * Get strategic initiatives (high impact, higher effort)
 */
export function getStrategicInitiatives(goalId: GoalId): GoalRecommendation[] {
  const recommendations = getRecommendationsByGoal(goalId);
  return recommendations.filter(rec => 
    rec.impactScore >= 8 && rec.effortScore >= 6
  );
}

/**
 * Calculate goal completion metrics
 */
export function calculateGoalMetrics(goalId: GoalId) {
  const recommendations = getRecommendationsByGoal(goalId);
  const totalRecommendations = recommendations.length;
  const quickWins = getQuickWins(goalId).length;
  const strategicInitiatives = getStrategicInitiatives(goalId).length;
  
  const avgImpact = recommendations.reduce((sum, rec) => sum + rec.impactScore, 0) / totalRecommendations;
  const avgEffort = recommendations.reduce((sum, rec) => sum + rec.effortScore, 0) / totalRecommendations;
  
  const platformDistribution = recommendations.reduce((dist, rec) => {
    dist[rec.platform] = (dist[rec.platform] || 0) + 1;
    return dist;
  }, {} as Record<string, number>);
  
  return {
    totalRecommendations,
    quickWins,
    strategicInitiatives,
    avgImpact: Math.round(avgImpact * 10) / 10,
    avgEffort: Math.round(avgEffort * 10) / 10,
    platformDistribution
  };
}

// Export all recommendation sets for direct access
export {
  increase_reviews_recommendations,
  local_visibility_recommendations,
  lunch_conversion_recommendations,
  ig_growth_recommendations,
  group_bookings_recommendations,
  RECOMMENDATIONS_BY_GOAL,
  GOAL_PROFILES
};