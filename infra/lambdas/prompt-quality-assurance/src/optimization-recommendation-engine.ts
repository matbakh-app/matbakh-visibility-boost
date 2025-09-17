import {
  OptimizationRecommendation,
  PromptAuditRecord,
  QualityMetrics,
  GenerateRecommendationsRequest,
  QualityAssuranceError
} from './types';
import { AuditTrailManager } from './audit-trail-manager';
import { v4 as uuidv4 } from 'uuid';

export class OptimizationRecommendationEngine {
  private auditTrailManager: AuditTrailManager;
  private minDataPoints: number;
  private confidenceThreshold: number;

  constructor(
    auditTrailManager: AuditTrailManager,
    minDataPoints: number = 10,
    confidenceThreshold: number = 0.7
  ) {
    this.auditTrailManager = auditTrailManager;
    this.minDataPoints = minDataPoints;
    this.confidenceThreshold = confidenceThreshold;
  }

  /**
   * Generate optimization recommendations based on performance data
   */
  async generateRecommendations(request: GenerateRecommendationsRequest): Promise<OptimizationRecommendation[]> {
    try {
      // Get audit data for analysis
      const auditRecords = await this.auditTrailManager.getAuditTrail({
        templateId: request.templateId,
        startDate: request.timeRange ? this.getStartDateFromRange(request.timeRange) : undefined,
        limit: 1000
      });

      if (auditRecords.length < this.minDataPoints) {
        return [{
          id: uuidv4(),
          templateId: request.templateId,
          recommendationType: 'quality',
          priority: 'low',
          title: 'Insufficient Data',
          description: `Need at least ${this.minDataPoints} executions for meaningful recommendations. Current: ${auditRecords.length}`,
          suggestedChanges: {
            promptModifications: ['Increase usage to gather more performance data']
          },
          expectedImpact: {
            qualityImprovement: 0,
            performanceGain: 0,
            costReduction: 0,
            userSatisfactionIncrease: 0
          },
          confidence: 0.1,
          basedOnData: {
            executionCount: auditRecords.length,
            timeRange: request.timeRange || '30d',
            userFeedbackCount: 0
          },
          timestamp: new Date().toISOString()
        }];
      }

      const recommendations: OptimizationRecommendation[] = [];

      // Analyze different aspects and generate recommendations
      recommendations.push(...await this.analyzeQualityIssues(auditRecords, request.templateId));
      recommendations.push(...await this.analyzePerformanceIssues(auditRecords, request.templateId));
      recommendations.push(...await this.analyzeCostOptimization(auditRecords, request.templateId));
      recommendations.push(...await this.analyzeUserExperience(auditRecords, request.templateId));

      // Sort by priority and confidence
      return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });

    } catch (error) {
      throw new QualityAssuranceError(
        `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RECOMMENDATION_GENERATION_ERROR'
      );
    }
  }

  /**
   * Get recommendation effectiveness tracking
   */
  async trackRecommendationEffectiveness(
    recommendationId: string,
    beforeMetrics: QualityMetrics,
    afterMetrics: QualityMetrics
  ): Promise<{
    effectiveness: number;
    actualImpact: {
      qualityImprovement: number;
      performanceGain: number;
      userSatisfactionIncrease: number;
    };
    recommendation: string;
  }> {
    const qualityImprovement = afterMetrics.overallScore - beforeMetrics.overallScore;
    const userSatisfactionIncrease = (afterMetrics.userSatisfactionScore || 0) - (beforeMetrics.userSatisfactionScore || 0);
    
    const effectiveness = Math.max(0, Math.min(1, (qualityImprovement + userSatisfactionIncrease) / 2));
    
    let recommendation = 'Continue monitoring';
    if (effectiveness > 0.2) {
      recommendation = 'Recommendation was highly effective - consider similar optimizations';
    } else if (effectiveness > 0.1) {
      recommendation = 'Recommendation showed moderate improvement';
    } else if (effectiveness < -0.1) {
      recommendation = 'Recommendation may have had negative impact - consider reverting';
    }

    return {
      effectiveness,
      actualImpact: {
        qualityImprovement,
        performanceGain: 0, // Would calculate from performance metrics
        userSatisfactionIncrease
      },
      recommendation
    };
  }

  // Private analysis methods

  private async analyzeQualityIssues(
    auditRecords: PromptAuditRecord[],
    templateId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Calculate average quality metrics
    const avgQuality = this.calculateAverageQualityMetrics(auditRecords);
    const lowQualityRecords = auditRecords.filter(r => r.qualityMetrics.overallScore < 0.6);
    
    // Low overall quality
    if (avgQuality.overallScore < 0.7) {
      recommendations.push({
        id: uuidv4(),
        templateId,
        recommendationType: 'quality',
        priority: avgQuality.overallScore < 0.5 ? 'critical' : 'high',
        title: 'Improve Overall Output Quality',
        description: `Average quality score is ${(avgQuality.overallScore * 100).toFixed(1)}%. Consider refining prompt structure and instructions.`,
        suggestedChanges: {
          promptModifications: [
            'Add more specific instructions and examples',
            'Include quality criteria in the prompt',
            'Break down complex requests into smaller steps',
            'Add context about expected output format'
          ],
          parameterAdjustments: {
            temperature: avgQuality.coherenceScore < 0.6 ? 0.3 : undefined,
            max_tokens: avgQuality.completenessScore < 0.6 ? 'increase by 20%' : undefined
          }
        },
        expectedImpact: {
          qualityImprovement: 0.15,
          performanceGain: 0.05,
          costReduction: 0,
          userSatisfactionIncrease: 0.2
        },
        confidence: 0.8,
        basedOnData: {
          executionCount: auditRecords.length,
          timeRange: '30d',
          userFeedbackCount: auditRecords.filter(r => r.userFeedback).length
        },
        timestamp: new Date().toISOString()
      });
    }

    // Low relevance scores
    if (avgQuality.relevanceScore < 0.7) {
      recommendations.push({
        id: uuidv4(),
        templateId,
        recommendationType: 'quality',
        priority: 'high',
        title: 'Improve Response Relevance',
        description: `Relevance score is ${(avgQuality.relevanceScore * 100).toFixed(1)}%. Responses may not be addressing the core request.`,
        suggestedChanges: {
          promptModifications: [
            'Clarify the main objective in the prompt',
            'Add examples of relevant responses',
            'Include explicit instructions to stay on topic',
            'Use role-based prompting for better context'
          ]
        },
        expectedImpact: {
          qualityImprovement: 0.2,
          performanceGain: 0,
          costReduction: 0.1,
          userSatisfactionIncrease: 0.25
        },
        confidence: 0.75,
        basedOnData: {
          executionCount: auditRecords.length,
          timeRange: '30d',
          userFeedbackCount: auditRecords.filter(r => r.userFeedback).length
        },
        timestamp: new Date().toISOString()
      });
    }

    // Low coherence scores
    if (avgQuality.coherenceScore < 0.7) {
      recommendations.push({
        id: uuidv4(),
        templateId,
        recommendationType: 'quality',
        priority: 'medium',
        title: 'Improve Response Coherence',
        description: `Coherence score is ${(avgQuality.coherenceScore * 100).toFixed(1)}%. Responses may lack logical structure.`,
        suggestedChanges: {
          promptModifications: [
            'Request structured responses with clear sections',
            'Ask for step-by-step explanations',
            'Include formatting instructions (bullets, numbers)',
            'Request summary at the end'
          ],
          parameterAdjustments: {
            temperature: 0.4 // Lower temperature for more coherent responses
          }
        },
        expectedImpact: {
          qualityImprovement: 0.15,
          performanceGain: 0,
          costReduction: 0,
          userSatisfactionIncrease: 0.15
        },
        confidence: 0.7,
        basedOnData: {
          executionCount: auditRecords.length,
          timeRange: '30d',
          userFeedbackCount: auditRecords.filter(r => r.userFeedback).length
        },
        timestamp: new Date().toISOString()
      });
    }

    return recommendations;
  }

  private async analyzePerformanceIssues(
    auditRecords: PromptAuditRecord[],
    templateId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    const avgResponseTime = auditRecords.reduce((sum, r) => sum + r.performanceMetrics.responseTime, 0) / auditRecords.length;
    const slowRecords = auditRecords.filter(r => r.performanceMetrics.responseTime > 5000);
    
    // Slow response times
    if (avgResponseTime > 3000 || slowRecords.length > auditRecords.length * 0.2) {
      recommendations.push({
        id: uuidv4(),
        templateId,
        recommendationType: 'performance',
        priority: avgResponseTime > 8000 ? 'high' : 'medium',
        title: 'Optimize Response Time',
        description: `Average response time is ${(avgResponseTime / 1000).toFixed(1)}s. ${slowRecords.length} out of ${auditRecords.length} responses were slow (>5s).`,
        suggestedChanges: {
          promptModifications: [
            'Simplify complex instructions',
            'Reduce prompt length while maintaining clarity',
            'Break down complex tasks into smaller prompts'
          ],
          parameterAdjustments: {
            max_tokens: 'reduce by 20%',
            temperature: 0.5 // Moderate temperature for faster processing
          }
        },
        expectedImpact: {
          qualityImprovement: -0.05, // Slight quality trade-off
          performanceGain: 0.3,
          costReduction: 0.15,
          userSatisfactionIncrease: 0.2
        },
        confidence: 0.8,
        basedOnData: {
          executionCount: auditRecords.length,
          timeRange: '30d',
          userFeedbackCount: auditRecords.filter(r => r.userFeedback).length
        },
        timestamp: new Date().toISOString()
      });
    }

    // Low token efficiency
    const avgTokenEfficiency = auditRecords.reduce((sum, r) => sum + r.performanceMetrics.tokenEfficiency, 0) / auditRecords.length;
    if (avgTokenEfficiency < 0.3) {
      recommendations.push({
        id: uuidv4(),
        templateId,
        recommendationType: 'performance',
        priority: 'medium',
        title: 'Improve Token Efficiency',
        description: `Token efficiency is ${(avgTokenEfficiency * 100).toFixed(1)}%. Consider optimizing prompt length and structure.`,
        suggestedChanges: {
          promptModifications: [
            'Remove redundant instructions',
            'Use more concise language',
            'Combine related instructions',
            'Remove unnecessary examples'
          ]
        },
        expectedImpact: {
          qualityImprovement: 0,
          performanceGain: 0.2,
          costReduction: 0.25,
          userSatisfactionIncrease: 0.1
        },
        confidence: 0.7,
        basedOnData: {
          executionCount: auditRecords.length,
          timeRange: '30d',
          userFeedbackCount: auditRecords.filter(r => r.userFeedback).length
        },
        timestamp: new Date().toISOString()
      });
    }

    return recommendations;
  }

  private async analyzeCostOptimization(
    auditRecords: PromptAuditRecord[],
    templateId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    const avgCostPerToken = auditRecords.reduce((sum, r) => sum + r.performanceMetrics.costPerToken, 0) / auditRecords.length;
    const highCostRecords = auditRecords.filter(r => r.performanceMetrics.costPerToken > avgCostPerToken * 1.5);
    
    // High cost per execution
    if (avgCostPerToken > 0.0001 || highCostRecords.length > auditRecords.length * 0.3) {
      recommendations.push({
        id: uuidv4(),
        templateId,
        recommendationType: 'cost',
        priority: 'medium',
        title: 'Reduce Execution Costs',
        description: `Average cost per token is $${avgCostPerToken.toFixed(6)}. Consider optimizing for cost efficiency.`,
        suggestedChanges: {
          promptModifications: [
            'Reduce prompt length without losing effectiveness',
            'Use more efficient prompt patterns',
            'Implement caching for common responses'
          ],
          parameterAdjustments: {
            max_tokens: 'optimize based on actual needs',
            model: 'consider using a more cost-effective model for simpler tasks'
          }
        },
        expectedImpact: {
          qualityImprovement: -0.02,
          performanceGain: 0.1,
          costReduction: 0.3,
          userSatisfactionIncrease: 0
        },
        confidence: 0.75,
        basedOnData: {
          executionCount: auditRecords.length,
          timeRange: '30d',
          userFeedbackCount: auditRecords.filter(r => r.userFeedback).length
        },
        timestamp: new Date().toISOString()
      });
    }

    return recommendations;
  }

  private async analyzeUserExperience(
    auditRecords: PromptAuditRecord[],
    templateId: string
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    const recordsWithFeedback = auditRecords.filter(r => r.userFeedback);
    if (recordsWithFeedback.length === 0) {
      return recommendations;
    }

    const avgUserSatisfaction = recordsWithFeedback.reduce((sum, r) => 
      sum + (r.userFeedback?.rating || 0), 0
    ) / recordsWithFeedback.length / 5; // Convert to 0-1 scale

    const negativeFeeback = recordsWithFeedback.filter(r => 
      r.userFeedback && r.userFeedback.rating <= 2
    );

    // Low user satisfaction
    if (avgUserSatisfaction < 0.6) {
      const commonComplaints = this.analyzeCommonComplaints(recordsWithFeedback);
      
      recommendations.push({
        id: uuidv4(),
        templateId,
        recommendationType: 'user_experience',
        priority: avgUserSatisfaction < 0.4 ? 'high' : 'medium',
        title: 'Improve User Satisfaction',
        description: `Average user satisfaction is ${(avgUserSatisfaction * 100).toFixed(1)}%. ${negativeFeeback.length} users provided negative feedback.`,
        suggestedChanges: {
          promptModifications: [
            ...commonComplaints.map(complaint => `Address common complaint: ${complaint}`),
            'Add more personalization to responses',
            'Include more actionable advice',
            'Improve response formatting and readability'
          ]
        },
        expectedImpact: {
          qualityImprovement: 0.1,
          performanceGain: 0,
          costReduction: 0,
          userSatisfactionIncrease: 0.3
        },
        confidence: 0.8,
        basedOnData: {
          executionCount: auditRecords.length,
          timeRange: '30d',
          userFeedbackCount: recordsWithFeedback.length
        },
        timestamp: new Date().toISOString()
      });
    }

    return recommendations;
  }

  // Helper methods

  private calculateAverageQualityMetrics(auditRecords: PromptAuditRecord[]): QualityMetrics {
    if (auditRecords.length === 0) {
      return {
        relevanceScore: 0,
        coherenceScore: 0,
        completenessScore: 0,
        accuracyScore: 0,
        overallScore: 0,
        confidence: 0
      };
    }

    const sum = auditRecords.reduce((acc, record) => ({
      relevanceScore: acc.relevanceScore + record.qualityMetrics.relevanceScore,
      coherenceScore: acc.coherenceScore + record.qualityMetrics.coherenceScore,
      completenessScore: acc.completenessScore + record.qualityMetrics.completenessScore,
      accuracyScore: acc.accuracyScore + record.qualityMetrics.accuracyScore,
      overallScore: acc.overallScore + record.qualityMetrics.overallScore,
      confidence: acc.confidence + record.qualityMetrics.confidence
    }), {
      relevanceScore: 0,
      coherenceScore: 0,
      completenessScore: 0,
      accuracyScore: 0,
      overallScore: 0,
      confidence: 0
    });

    const count = auditRecords.length;
    return {
      relevanceScore: sum.relevanceScore / count,
      coherenceScore: sum.coherenceScore / count,
      completenessScore: sum.completenessScore / count,
      accuracyScore: sum.accuracyScore / count,
      overallScore: sum.overallScore / count,
      confidence: sum.confidence / count
    };
  }

  private analyzeCommonComplaints(recordsWithFeedback: PromptAuditRecord[]): string[] {
    const complaints: string[] = [];
    const feedbackTexts = recordsWithFeedback
      .map(r => r.userFeedback?.feedback)
      .filter(Boolean) as string[];

    // Simple keyword analysis for common complaints
    const complaintKeywords = {
      'too long': ['long', 'lengthy', 'verbose'],
      'not specific': ['vague', 'generic', 'not specific'],
      'not helpful': ['not helpful', 'useless', 'unhelpful'],
      'confusing': ['confusing', 'unclear', 'hard to understand'],
      'incomplete': ['incomplete', 'missing', 'not enough']
    };

    Object.entries(complaintKeywords).forEach(([complaint, keywords]) => {
      const matchingFeedback = feedbackTexts.filter(feedback =>
        keywords.some(keyword => feedback.toLowerCase().includes(keyword))
      );
      
      if (matchingFeedback.length > feedbackTexts.length * 0.2) {
        complaints.push(complaint);
      }
    });

    return complaints;
  }

  private getStartDateFromRange(timeRange: string): string {
    const now = new Date();
    const days = timeRange.includes('d') ? parseInt(timeRange) : 
                 timeRange.includes('w') ? parseInt(timeRange) * 7 :
                 timeRange.includes('m') ? parseInt(timeRange) * 30 : 30;
    
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  }
}