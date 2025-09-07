import { 
  RecommendationProgress, 
  PrioritizedRecommendation,
  RecommendationProgressSchema,
  ProgressTrackingError
} from './types';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Progress Tracking Manager
 * Manages tracking of recommendation implementation progress and effectiveness
 */
export class ProgressTrackingManager {
  private dynamoClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({ 
      region: process.env.AWS_REGION || 'eu-central-1' 
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.RECOMMENDATION_PROGRESS_TABLE || 'recommendation-progress';
  }

  /**
   * Initialize progress tracking for a recommendation
   */
  public async initializeProgress(
    recommendationId: string,
    businessId: string,
    recommendation: PrioritizedRecommendation
  ): Promise<RecommendationProgress> {
    try {
      const progress: RecommendationProgress = {
        recommendationId,
        businessId,
        status: 'not_started',
        progress: 0,
        milestones: this.createMilestonesFromSteps(recommendation.recommendation.steps),
        metrics: this.initializeMetricsFromSuccessMetrics(recommendation.recommendation.successMetrics),
        notes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const validatedProgress = RecommendationProgressSchema.parse(progress);

      await this.dynamoClient.send(new PutCommand({
        TableName: this.tableName,
        Item: validatedProgress,
        ConditionExpression: 'attribute_not_exists(recommendationId)'
      }));

      return validatedProgress;
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to initialize progress tracking: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update recommendation progress
   */
  public async updateProgress(
    recommendationId: string,
    businessId: string,
    updates: Partial<RecommendationProgress>
  ): Promise<RecommendationProgress> {
    try {
      const current = await this.getProgress(recommendationId, businessId);
      if (!current) {
        throw new Error('Progress record not found');
      }

      const updated: RecommendationProgress = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Validate the updated progress
      const validatedProgress = RecommendationProgressSchema.parse(updated);

      await this.dynamoClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { recommendationId, businessId },
        UpdateExpression: 'SET #status = :status, #progress = :progress, #milestones = :milestones, #metrics = :metrics, #notes = :notes, #updatedAt = :updatedAt, #startedAt = :startedAt, #completedAt = :completedAt, #effectiveness = :effectiveness',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#progress': 'progress',
          '#milestones': 'milestones',
          '#metrics': 'metrics',
          '#notes': 'notes',
          '#updatedAt': 'updatedAt',
          '#startedAt': 'startedAt',
          '#completedAt': 'completedAt',
          '#effectiveness': 'effectiveness'
        },
        ExpressionAttributeValues: {
          ':status': validatedProgress.status,
          ':progress': validatedProgress.progress,
          ':milestones': validatedProgress.milestones,
          ':metrics': validatedProgress.metrics,
          ':notes': validatedProgress.notes,
          ':updatedAt': validatedProgress.updatedAt,
          ':startedAt': validatedProgress.startedAt || null,
          ':completedAt': validatedProgress.completedAt || null,
          ':effectiveness': validatedProgress.effectiveness || null
        }
      }));

      return validatedProgress;
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to update progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get progress for a specific recommendation
   */
  public async getProgress(
    recommendationId: string,
    businessId: string
  ): Promise<RecommendationProgress | null> {
    try {
      const result = await this.dynamoClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { recommendationId, businessId }
      }));

      if (!result.Item) {
        return null;
      }

      return RecommendationProgressSchema.parse(result.Item);
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to get progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all progress records for a business
   */
  public async getBusinessProgress(businessId: string): Promise<RecommendationProgress[]> {
    try {
      const result = await this.dynamoClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'BusinessIdIndex', // Assumes GSI exists
        KeyConditionExpression: 'businessId = :businessId',
        ExpressionAttributeValues: {
          ':businessId': businessId
        }
      }));

      if (!result.Items) {
        return [];
      }

      return result.Items.map(item => RecommendationProgressSchema.parse(item));
    } catch (error) {
      throw new ProgressTrackingError(
        `Failed to get business progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Start implementation of a recommendation
   */
  public async startImplementation(
    recommendationId: string,
    businessId: string
  ): Promise<RecommendationProgress> {
    return this.updateProgress(recommendationId, businessId, {
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      progress: 5 // Small initial progress
    });
  }

  /**
   * Complete a milestone
   */
  public async completeMilestone(
    recommendationId: string,
    businessId: string,
    milestoneId: string
  ): Promise<RecommendationProgress> {
    const current = await this.getProgress(recommendationId, businessId);
    if (!current) {
      throw new Error('Progress record not found');
    }

    const updatedMilestones = current.milestones.map(milestone => {
      if (milestone.id === milestoneId) {
        return {
          ...milestone,
          status: 'completed' as const,
          completedDate: new Date().toISOString()
        };
      }
      return milestone;
    });

    // Calculate new progress based on completed milestones
    const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
    const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);

    // Check if all milestones are completed
    const allCompleted = updatedMilestones.every(m => m.status === 'completed');
    const newStatus = allCompleted ? 'completed' : 'in_progress';
    const completedAt = allCompleted ? new Date().toISOString() : undefined;

    return this.updateProgress(recommendationId, businessId, {
      milestones: updatedMilestones,
      progress: newProgress,
      status: newStatus,
      completedAt
    });
  }

  /**
   * Update metrics for a recommendation
   */
  public async updateMetrics(
    recommendationId: string,
    businessId: string,
    metricUpdates: Array<{ name: string; current: number }>
  ): Promise<RecommendationProgress> {
    const current = await this.getProgress(recommendationId, businessId);
    if (!current) {
      throw new Error('Progress record not found');
    }

    const updatedMetrics = current.metrics.map(metric => {
      const update = metricUpdates.find(u => u.name === metric.name);
      if (update) {
        return {
          ...metric,
          current: update.current,
          lastUpdated: new Date().toISOString()
        };
      }
      return metric;
    });

    return this.updateProgress(recommendationId, businessId, {
      metrics: updatedMetrics
    });
  }

  /**
   * Add a note to the progress tracking
   */
  public async addNote(
    recommendationId: string,
    businessId: string,
    content: string,
    author: string,
    type: 'update' | 'issue' | 'success' | 'milestone' = 'update'
  ): Promise<RecommendationProgress> {
    const current = await this.getProgress(recommendationId, businessId);
    if (!current) {
      throw new Error('Progress record not found');
    }

    const newNote = {
      id: uuidv4(),
      content,
      author,
      createdAt: new Date().toISOString(),
      type
    };

    const updatedNotes = [...current.notes, newNote];

    return this.updateProgress(recommendationId, businessId, {
      notes: updatedNotes
    });
  }

  /**
   * Record effectiveness data after completion
   */
  public async recordEffectiveness(
    recommendationId: string,
    businessId: string,
    effectiveness: {
      actualImpact: number;
      actualEffort: number;
      actualROI?: number;
      lessonsLearned: string[];
      wouldRecommendAgain?: boolean;
    }
  ): Promise<RecommendationProgress> {
    return this.updateProgress(recommendationId, businessId, {
      effectiveness
    });
  }

  /**
   * Get effectiveness analytics for completed recommendations
   */
  public async getEffectivenessAnalytics(businessId: string): Promise<{
    totalCompleted: number;
    averageImpact: number;
    averageEffort: number;
    averageROI: number;
    recommendationRate: number;
    topLessonsLearned: string[];
  }> {
    const allProgress = await this.getBusinessProgress(businessId);
    const completed = allProgress.filter(p => p.status === 'completed' && p.effectiveness);

    if (completed.length === 0) {
      return {
        totalCompleted: 0,
        averageImpact: 0,
        averageEffort: 0,
        averageROI: 0,
        recommendationRate: 0,
        topLessonsLearned: []
      };
    }

    const totalImpact = completed.reduce((sum, p) => sum + (p.effectiveness?.actualImpact || 0), 0);
    const totalEffort = completed.reduce((sum, p) => sum + (p.effectiveness?.actualEffort || 0), 0);
    const roiValues = completed.filter(p => p.effectiveness?.actualROI).map(p => p.effectiveness!.actualROI!);
    const totalROI = roiValues.reduce((sum, roi) => sum + roi, 0);
    const recommendAgain = completed.filter(p => p.effectiveness?.wouldRecommendAgain === true).length;

    // Collect and count lessons learned
    const allLessons = completed.flatMap(p => p.effectiveness?.lessonsLearned || []);
    const lessonCounts = allLessons.reduce((counts, lesson) => {
      counts[lesson] = (counts[lesson] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const topLessonsLearned = Object.entries(lessonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lesson]) => lesson);

    return {
      totalCompleted: completed.length,
      averageImpact: totalImpact / completed.length,
      averageEffort: totalEffort / completed.length,
      averageROI: roiValues.length > 0 ? totalROI / roiValues.length : 0,
      recommendationRate: (recommendAgain / completed.length) * 100,
      topLessonsLearned
    };
  }

  /**
   * Create milestones from recommendation steps
   */
  private createMilestonesFromSteps(steps: Array<{
    order: number;
    action: string;
    duration: string;
    resources: string[];
  }>) {
    return steps.map(step => ({
      id: uuidv4(),
      name: `Step ${step.order}`,
      description: step.action,
      targetDate: this.calculateTargetDate(step.duration, step.order),
      status: 'pending' as const
    }));
  }

  /**
   * Initialize metrics from success metrics
   */
  private initializeMetricsFromSuccessMetrics(successMetrics: Array<{
    metric: string;
    target: string;
    measurement: string;
  }>) {
    return successMetrics.map(metric => ({
      name: metric.metric,
      baseline: 0, // Would be populated with actual baseline data
      current: 0,
      target: this.parseTargetValue(metric.target),
      unit: this.extractUnit(metric.target),
      lastUpdated: new Date().toISOString()
    }));
  }

  /**
   * Calculate target date based on duration and step order
   */
  private calculateTargetDate(duration: string, stepOrder: number): string {
    const now = new Date();
    const daysToAdd = this.parseDurationToDays(duration) * stepOrder;
    const targetDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return targetDate.toISOString();
  }

  /**
   * Parse duration string to days
   */
  private parseDurationToDays(duration: string): number {
    const lowerDuration = duration.toLowerCase();
    
    if (lowerDuration.includes('minute')) {
      const minutes = parseInt(lowerDuration.match(/\d+/)?.[0] || '30');
      return minutes / (24 * 60); // Convert to fraction of day
    }
    
    if (lowerDuration.includes('hour')) {
      const hours = parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
      return hours / 24; // Convert to fraction of day
    }
    
    if (lowerDuration.includes('day')) {
      return parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
    }
    
    if (lowerDuration.includes('week')) {
      const weeks = parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
      return weeks * 7;
    }
    
    if (lowerDuration.includes('month')) {
      const months = parseInt(lowerDuration.match(/\d+/)?.[0] || '1');
      return months * 30;
    }
    
    return 1; // Default to 1 day
  }

  /**
   * Parse target value from target string
   */
  private parseTargetValue(target: string): number {
    const numbers = target.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      return parseInt(numbers[0]);
    }
    return 0;
  }

  /**
   * Extract unit from target string
   */
  private extractUnit(target: string): string {
    if (target.includes('%')) return '%';
    if (target.includes('€') || target.includes('EUR')) return 'EUR';
    if (target.includes('$') || target.includes('USD')) return 'USD';
    if (target.includes('views')) return 'views';
    if (target.includes('followers')) return 'followers';
    if (target.includes('orders')) return 'orders';
    if (target.includes('customers')) return 'customers';
    if (target.includes('rating')) return 'rating';
    if (target.includes('stars')) return 'stars';
    return 'count';
  }
}