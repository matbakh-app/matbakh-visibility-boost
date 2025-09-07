/**
 * Tests for Goal-Specific Recommendations System
 */

import { 
  getRecommendationsByGoal,
  getGoalProfile,
  getAllGoalProfiles,
  getRecommendationsSorted,
  getQuickWins,
  getStrategicInitiatives,
  calculateGoalMetrics
} from '../index';
import { GoalId } from '../../types/goal-recommendations';

describe('Goal-Specific Recommendations', () => {
  const testGoalId: GoalId = 'increase_reviews';

  describe('getRecommendationsByGoal', () => {
    it('should return recommendations for a valid goal', () => {
      const recommendations = getRecommendationsByGoal(testGoalId);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Check structure of first recommendation
      const firstRec = recommendations[0];
      expect(firstRec).toHaveProperty('goalId', testGoalId);
      expect(firstRec).toHaveProperty('recommendationId');
      expect(firstRec).toHaveProperty('title');
      expect(firstRec).toHaveProperty('description');
      expect(firstRec).toHaveProperty('platform');
      expect(firstRec).toHaveProperty('impactScore');
      expect(firstRec).toHaveProperty('effortScore');
      expect(firstRec).toHaveProperty('personaTargets');
    });

    it('should return empty array for invalid goal', () => {
      const recommendations = getRecommendationsByGoal('invalid_goal' as GoalId);
      expect(recommendations).toEqual([]);
    });
  });

  describe('getGoalProfile', () => {
    it('should return complete goal profile with recommendations', () => {
      const profile = getGoalProfile(testGoalId);
      
      expect(profile).toHaveProperty('goalId', testGoalId);
      expect(profile).toHaveProperty('titleDE');
      expect(profile).toHaveProperty('titleEN');
      expect(profile).toHaveProperty('description');
      expect(profile).toHaveProperty('recommendations');
      expect(Array.isArray(profile.recommendations)).toBe(true);
      expect(profile.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getAllGoalProfiles', () => {
    it('should return all goal profiles', () => {
      const profiles = getAllGoalProfiles();
      
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(5); // We have 5 goals defined
      
      // Check that each profile has the required structure
      profiles.forEach(profile => {
        expect(profile).toHaveProperty('goalId');
        expect(profile).toHaveProperty('titleDE');
        expect(profile).toHaveProperty('titleEN');
        expect(profile).toHaveProperty('description');
        expect(profile).toHaveProperty('recommendations');
      });
    });
  });

  describe('getRecommendationsSorted', () => {
    it('should sort recommendations by impact score', () => {
      const recommendations = getRecommendationsSorted(testGoalId, 'impact');
      
      expect(recommendations.length).toBeGreaterThan(1);
      
      // Check that recommendations are sorted by impact (descending)
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].impactScore).toBeGreaterThanOrEqual(
          recommendations[i + 1].impactScore
        );
      }
    });

    it('should sort recommendations by effort score', () => {
      const recommendations = getRecommendationsSorted(testGoalId, 'effort');
      
      expect(recommendations.length).toBeGreaterThan(1);
      
      // Check that recommendations are sorted by effort (ascending)
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].effortScore).toBeLessThanOrEqual(
          recommendations[i + 1].effortScore
        );
      }
    });

    it('should sort recommendations by combined score', () => {
      const recommendations = getRecommendationsSorted(testGoalId, 'combined');
      
      expect(recommendations.length).toBeGreaterThan(1);
      
      // Check that recommendations are sorted by impact/effort ratio (descending)
      for (let i = 0; i < recommendations.length - 1; i++) {
        const ratioA = recommendations[i].impactScore / recommendations[i].effortScore;
        const ratioB = recommendations[i + 1].impactScore / recommendations[i + 1].effortScore;
        expect(ratioA).toBeGreaterThanOrEqual(ratioB);
      }
    });
  });

  describe('getQuickWins', () => {
    it('should return only high impact, low effort recommendations', () => {
      const quickWins = getQuickWins(testGoalId);
      
      quickWins.forEach(rec => {
        expect(rec.impactScore).toBeGreaterThanOrEqual(7);
        expect(rec.effortScore).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('getStrategicInitiatives', () => {
    it('should return only high impact, high effort recommendations', () => {
      const strategic = getStrategicInitiatives(testGoalId);
      
      strategic.forEach(rec => {
        expect(rec.impactScore).toBeGreaterThanOrEqual(8);
        expect(rec.effortScore).toBeGreaterThanOrEqual(6);
      });
    });
  });

  describe('calculateGoalMetrics', () => {
    it('should calculate correct metrics for a goal', () => {
      const metrics = calculateGoalMetrics(testGoalId);
      
      expect(metrics).toHaveProperty('totalRecommendations');
      expect(metrics).toHaveProperty('quickWins');
      expect(metrics).toHaveProperty('strategicInitiatives');
      expect(metrics).toHaveProperty('avgImpact');
      expect(metrics).toHaveProperty('avgEffort');
      expect(metrics).toHaveProperty('platformDistribution');
      
      expect(typeof metrics.totalRecommendations).toBe('number');
      expect(typeof metrics.quickWins).toBe('number');
      expect(typeof metrics.strategicInitiatives).toBe('number');
      expect(typeof metrics.avgImpact).toBe('number');
      expect(typeof metrics.avgEffort).toBe('number');
      expect(typeof metrics.platformDistribution).toBe('object');
      
      // Averages should be between 1 and 10
      expect(metrics.avgImpact).toBeGreaterThanOrEqual(1);
      expect(metrics.avgImpact).toBeLessThanOrEqual(10);
      expect(metrics.avgEffort).toBeGreaterThanOrEqual(1);
      expect(metrics.avgEffort).toBeLessThanOrEqual(10);
    });
  });

  describe('Recommendation Data Quality', () => {
    it('should have valid data for all goals', () => {
      const allGoals: GoalId[] = ['increase_reviews', 'local_visibility', 'lunch_conversion', 'ig_growth', 'group_bookings'];
      
      allGoals.forEach(goalId => {
        const recommendations = getRecommendationsByGoal(goalId);
        
        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations.length).toBeLessThanOrEqual(10); // Reasonable upper limit
        
        recommendations.forEach(rec => {
          // Check required fields
          expect(rec.goalId).toBe(goalId);
          expect(rec.recommendationId).toBeTruthy();
          expect(rec.title).toBeTruthy();
          expect(rec.description).toBeTruthy();
          expect(rec.platform).toBeTruthy();
          
          // Check score ranges
          expect(rec.impactScore).toBeGreaterThanOrEqual(1);
          expect(rec.impactScore).toBeLessThanOrEqual(10);
          expect(rec.effortScore).toBeGreaterThanOrEqual(1);
          expect(rec.effortScore).toBeLessThanOrEqual(10);
          
          // Check persona targets
          expect(Array.isArray(rec.personaTargets)).toBe(true);
          expect(rec.personaTargets.length).toBeGreaterThan(0);
          rec.personaTargets.forEach(persona => {
            expect(['Solo-Sarah', 'Bewahrer-Ben', 'Wachstums-Walter', 'Ketten-Katrin']).toContain(persona);
          });
          
          // Check platform values
          expect(['Google', 'Instagram', 'Facebook', 'Website', 'Offline']).toContain(rec.platform);
          
          // Check title length (should be reasonable)
          expect(rec.title.split(' ').length).toBeLessThanOrEqual(15);
          
          // Check description length (should be substantial but not too long)
          expect(rec.description.length).toBeGreaterThan(50);
          expect(rec.description.length).toBeLessThan(1000);
        });
      });
    });
  });
});