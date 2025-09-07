import { 
  GoalRecommendationEvent, 
  GoalRecommendationContext,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationRequestSchema,
  RecommendationResponseSchema,
  RecommendationGenerationError
} from './types';
import { GoalProfileManager } from './goal-profile-manager';
import { RecommendationGenerator } from './recommendation-generator';
import { PriorityScoringEngine } from './priority-scoring-engine';
import { ProgressTrackingManager } from './progress-tracking-manager';
import { EffectivenessMeasurementEngine } from './effectiveness-measurement-engine';
import { v4 as uuidv4 } from 'uuid';

/**
 * AWS Lambda handler for Goal-Specific Recommendation System
 */
export const handler = async (
  event: GoalRecommendationEvent,
  context: GoalRecommendationContext
): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}> => {
  const startTime = Date.now();
  
  try {
    console.log('Goal-Specific Recommendations Lambda invoked', {
      requestId: context.requestId,
      httpMethod: event.httpMethod,
      path: event.path
    });

    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }

    // Route requests based on path and method
    const path = event.path;
    const method = event.httpMethod;

    if (path === '/recommendations' && method === 'POST') {
      return await handleGenerateRecommendations(event, context, headers, startTime);
    } else if (path.startsWith('/recommendations/') && path.endsWith('/progress') && method === 'GET') {
      return await handleGetProgress(event, context, headers, startTime);
    } else if (path.startsWith('/recommendations/') && path.endsWith('/progress') && method === 'PUT') {
      return await handleUpdateProgress(event, context, headers, startTime);
    } else if (path.startsWith('/recommendations/') && path.endsWith('/effectiveness') && method === 'GET') {
      return await handleGetEffectiveness(event, context, headers, startTime);
    } else if (path === '/analytics/effectiveness' && method === 'GET') {
      return await handleGetEffectivenessReport(event, context, headers, startTime);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Not Found',
          message: `Path ${path} with method ${method} not found`
        })
      };
    }

  } catch (error) {
    console.error('Lambda execution error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        requestId: context.requestId
      })
    };
  }
};

/**
 * Handle recommendation generation request
 */
async function handleGenerateRecommendations(
  event: GoalRecommendationEvent,
  context: GoalRecommendationContext,
  headers: Record<string, string>,
  startTime: number
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Bad Request',
          message: 'Request body is required'
        })
      };
    }

    // Parse and validate request
    const requestData = JSON.parse(event.body);
    const request = RecommendationRequestSchema.parse(requestData);

    // Initialize managers
    const goalProfileManager = new GoalProfileManager();
    const recommendationGenerator = new RecommendationGenerator();
    const priorityScoringEngine = new PriorityScoringEngine();

    // Create goal profile
    const goalProfile = goalProfileManager.createGoalProfile(request);

    // Generate recommendations
    const recommendations = recommendationGenerator.generateRecommendations(
      request,
      goalProfile,
      request.maxRecommendations
    );

    // Score and prioritize recommendations
    const prioritizedRecommendations = priorityScoringEngine.scoreRecommendations(
      recommendations,
      goalProfile,
      request
    );

    // Calculate summary statistics
    const summary = calculateSummary(prioritizedRecommendations);

    // Generate insights
    const insights = generateInsights(prioritizedRecommendations, goalProfile);

    // Generate next steps
    const nextSteps = generateNextSteps(prioritizedRecommendations);

    // Create response
    const response: RecommendationResponse = {
      requestId: uuidv4(),
      businessId: request.businessId,
      generatedAt: new Date().toISOString(),
      goalProfile,
      recommendations: prioritizedRecommendations,
      summary,
      insights,
      nextSteps,
      processingTime: Date.now() - startTime,
      dataQuality: {
        completeness: 0.95,
        confidence: 0.9,
        sources: ['template_library', 'business_profile', 'goal_analysis'],
        limitations: ['Limited historical data', 'Industry-specific variations may apply']
      }
    };

    const validatedResponse = RecommendationResponseSchema.parse(response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(validatedResponse)
    };

  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Invalid request format',
          details: error.message
        })
      };
    }

    throw new RecommendationGenerationError(
      `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Handle get progress request
 */
async function handleGetProgress(
  event: GoalRecommendationEvent,
  context: GoalRecommendationContext,
  headers: Record<string, string>,
  startTime: number
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  try {
    const pathParts = event.path.split('/');
    const recommendationId = pathParts[2];
    const businessId = event.queryStringParameters?.businessId;

    if (!recommendationId || !businessId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'recommendationId and businessId are required'
        })
      };
    }

    const progressManager = new ProgressTrackingManager();
    const progress = await progressManager.getProgress(recommendationId, businessId);

    if (!progress) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: 'Progress record not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(progress)
    };

  } catch (error) {
    console.error('Error getting progress:', error);
    throw error;
  }
}

/**
 * Handle update progress request
 */
async function handleUpdateProgress(
  event: GoalRecommendationEvent,
  context: GoalRecommendationContext,
  headers: Record<string, string>,
  startTime: number
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  try {
    const pathParts = event.path.split('/');
    const recommendationId = pathParts[2];
    
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Request body is required'
        })
      };
    }

    const updateData = JSON.parse(event.body);
    const { businessId, ...updates } = updateData;

    if (!businessId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'businessId is required'
        })
      };
    }

    const progressManager = new ProgressTrackingManager();
    const updatedProgress = await progressManager.updateProgress(
      recommendationId,
      businessId,
      updates
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedProgress)
    };

  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
}

/**
 * Handle get effectiveness request
 */
async function handleGetEffectiveness(
  event: GoalRecommendationEvent,
  context: GoalRecommendationContext,
  headers: Record<string, string>,
  startTime: number
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  try {
    const pathParts = event.path.split('/');
    const recommendationId = pathParts[2];
    const businessId = event.queryStringParameters?.businessId;

    if (!recommendationId || !businessId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'recommendationId and businessId are required'
        })
      };
    }

    const effectivenessEngine = new EffectivenessMeasurementEngine();
    const effectiveness = await effectivenessEngine.measureEffectiveness(
      recommendationId,
      businessId,
      {} // Would include actual metrics from query params or body
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(effectiveness)
    };

  } catch (error) {
    console.error('Error getting effectiveness:', error);
    
    if (error instanceof Error && error.message.includes('No effectiveness data')) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: error.message
        })
      };
    }
    
    throw error;
  }
}

/**
 * Handle get effectiveness report request
 */
async function handleGetEffectivenessReport(
  event: GoalRecommendationEvent,
  context: GoalRecommendationContext,
  headers: Record<string, string>,
  startTime: number
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  try {
    const businessId = event.queryStringParameters?.businessId;

    if (!businessId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'businessId is required'
        })
      };
    }

    const effectivenessEngine = new EffectivenessMeasurementEngine();
    const report = await effectivenessEngine.generateEffectivenessReport(businessId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(report)
    };

  } catch (error) {
    console.error('Error generating effectiveness report:', error);
    throw error;
  }
}

/**
 * Calculate summary statistics
 */
function calculateSummary(recommendations: any[]) {
  const quickWins = recommendations.filter(r => r.category === 'quick_win').length;
  const strategicInitiatives = recommendations.filter(r => r.category === 'strategic_initiative').length;
  const longTermInvestments = recommendations.filter(r => r.category === 'long_term_investment').length;

  // Calculate total cost estimates
  const costsWithEstimates = recommendations
    .map(r => r.recommendation.estimatedCost)
    .filter(cost => cost);

  const totalMinCost = costsWithEstimates.reduce((sum, cost) => sum + cost.min, 0);
  const totalMaxCost = costsWithEstimates.reduce((sum, cost) => sum + cost.max, 0);

  // Calculate average ROI
  const roiEstimates = recommendations
    .map(r => r.recommendation.estimatedROI)
    .filter(roi => roi);

  const averageROI = roiEstimates.length > 0 
    ? roiEstimates.reduce((sum, roi) => sum + roi.percentage, 0) / roiEstimates.length
    : 0;

  // Calculate implementation timeline
  const timeframeCounts = recommendations.reduce((counts, r) => {
    const timeframe = r.recommendation.timeframe;
    counts[timeframe] = (counts[timeframe] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return {
    totalRecommendations: recommendations.length,
    quickWins,
    strategicInitiatives,
    longTermInvestments,
    estimatedTotalCost: {
      min: totalMinCost,
      max: totalMaxCost,
      currency: 'EUR'
    },
    estimatedTotalROI: {
      percentage: Math.round(averageROI),
      timeframe: '6-12 months',
      disclaimer: 'Unverbindliche Schätzung basierend auf Branchendurchschnitt'
    },
    implementationTimeline: {
      immediate: timeframeCounts.immediate || 0,
      shortTerm: timeframeCounts.short_term || 0,
      mediumTerm: timeframeCounts.medium_term || 0,
      longTerm: timeframeCounts.long_term || 0
    }
  };
}

/**
 * Generate insights from recommendations
 */
function generateInsights(recommendations: any[], goalProfile: any) {
  const insights = [];

  // Opportunity insights
  const highImpactCount = recommendations.filter(r => r.recommendation.impact === 'high').length;
  if (highImpactCount > 0) {
    insights.push({
      type: 'opportunity',
      title: 'High-Impact Opportunities Available',
      description: `${highImpactCount} recommendations offer high business impact potential`,
      impact: 'high',
      actionable: true
    });
  }

  // Risk insights
  const highEffortCount = recommendations.filter(r => r.recommendation.effort === 'high').length;
  if (highEffortCount > recommendations.length * 0.5) {
    insights.push({
      type: 'risk',
      title: 'Resource-Intensive Implementation',
      description: 'Many recommendations require significant resources - consider phased approach',
      impact: 'medium',
      actionable: true
    });
  }

  // Trend insights
  const competitionLevel = goalProfile.industryContext.competitionLevel;
  if (competitionLevel === 'intense') {
    insights.push({
      type: 'trend',
      title: 'Competitive Market Pressure',
      description: 'High competition requires aggressive implementation of visibility improvements',
      impact: 'high',
      actionable: true
    });
  }

  // Benchmark insights
  const quickWinCount = recommendations.filter(r => r.category === 'quick_win').length;
  if (quickWinCount >= 3) {
    insights.push({
      type: 'benchmark',
      title: 'Strong Quick Win Potential',
      description: 'Multiple low-effort, high-impact opportunities available for immediate results',
      impact: 'medium',
      actionable: true
    });
  }

  return insights;
}

/**
 * Generate next steps
 */
function generateNextSteps(recommendations: any[]) {
  const nextSteps = [];

  // Prioritize top recommendations
  const topRecommendations = recommendations.slice(0, 3);
  
  nextSteps.push({
    order: 1,
    action: `Review and approve top ${topRecommendations.length} recommendations`,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
    owner: 'Business Owner'
  });

  // Start with quick wins
  const quickWins = recommendations.filter(r => r.category === 'quick_win');
  if (quickWins.length > 0) {
    nextSteps.push({
      order: 2,
      action: `Begin implementation of ${quickWins.length} quick win initiatives`,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
      owner: 'Marketing Team'
    });
  }

  // Plan strategic initiatives
  const strategic = recommendations.filter(r => r.category === 'strategic_initiative');
  if (strategic.length > 0) {
    nextSteps.push({
      order: 3,
      action: `Develop detailed implementation plan for strategic initiatives`,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month
      owner: 'Management Team'
    });
  }

  // Set up tracking
  nextSteps.push({
    order: 4,
    action: 'Establish progress tracking and measurement systems',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks
    owner: 'Operations Team'
  });

  return nextSteps;
}