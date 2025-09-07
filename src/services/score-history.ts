// Score History Service
// Task: 6.4.1 Create ScoreHistory Database Schema
// Requirements: B.1, B.2

import { supabase } from '@/integrations/supabase/client';
import type { 
  ScoreHistoryRecord, 
  ScoreHistoryInsert, 
  ScoreHistoryUpdate,
  ScoreHistoryQuery,
  ScoreEvolutionData,
  ScoreHistoryAnalytics,
  ScoreType,
  ScoreSource
} from '@/types/score-history';

export class ScoreHistoryService {
  /**
   * Insert a new score history record
   */
  static async insertScore(data: ScoreHistoryInsert): Promise<ScoreHistoryRecord> {
    const { data: result, error } = await supabase
      .from('score_history')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert score history: ${error.message}`);
    }

    return result;
  }

  /**
   * Bulk insert multiple score history records
   */
  static async insertScores(data: ScoreHistoryInsert[]): Promise<ScoreHistoryRecord[]> {
    const { data: result, error } = await supabase
      .from('score_history')
      .insert(data)
      .select();

    if (error) {
      throw new Error(`Failed to insert score history records: ${error.message}`);
    }

    return result;
  }

  /**
   * Query score history with filters
   */
  static async queryScoreHistory(query: ScoreHistoryQuery): Promise<ScoreHistoryRecord[]> {
    let supabaseQuery = supabase
      .from('score_history')
      .select('*')
      .order('calculated_at', { ascending: false });

    // Apply filters
    if (query.business_id) {
      supabaseQuery = supabaseQuery.eq('business_id', query.business_id);
    }

    if (query.score_type) {
      if (Array.isArray(query.score_type)) {
        supabaseQuery = supabaseQuery.in('score_type', query.score_type);
      } else {
        supabaseQuery = supabaseQuery.eq('score_type', query.score_type);
      }
    }

    if (query.source) {
      if (Array.isArray(query.source)) {
        supabaseQuery = supabaseQuery.in('source', query.source);
      } else {
        supabaseQuery = supabaseQuery.eq('source', query.source);
      }
    }

    if (query.date_from) {
      supabaseQuery = supabaseQuery.gte('calculated_at', query.date_from);
    }

    if (query.date_to) {
      supabaseQuery = supabaseQuery.lte('calculated_at', query.date_to);
    }

    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }

    if (query.offset) {
      supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 50) - 1);
    }

    // Execute the query
    const result = await supabaseQuery;
    
    if (result.error) {
      throw new Error(`Failed to query score history: ${result.error.message}`);
    }

    return result.data || [];
  }

  /**
   * Get score evolution data for a specific business and score type
   */
  static async getScoreEvolution(
    businessId: string, 
    scoreType: ScoreType, 
    days: number = 30
  ): Promise<ScoreEvolutionData> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const records = await this.queryScoreHistory({
      business_id: businessId,
      score_type: scoreType,
      date_from: dateFrom.toISOString(),
      limit: 100
    });

    if (records.length === 0) {
      return {
        score_type: scoreType,
        data_points: [],
        trend: 'stable',
        change_percentage: 0,
        period_days: days
      };
    }

    // Sort by date ascending for trend calculation
    const sortedRecords = records.sort((a, b) => 
      new Date(a.calculated_at).getTime() - new Date(b.calculated_at).getTime()
    );

    const dataPoints = sortedRecords.map(record => ({
      date: record.calculated_at,
      score: record.score_value,
      source: record.source,
      confidence: record.meta?.confidence_score
    }));

    // Calculate trend
    const firstScore = sortedRecords[0].score_value;
    const lastScore = sortedRecords[sortedRecords.length - 1].score_value;
    const changePercentage = ((lastScore - firstScore) / firstScore) * 100;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(changePercentage) > 5) {
      trend = changePercentage > 0 ? 'increasing' : 'decreasing';
    }

    return {
      score_type: scoreType,
      data_points: dataPoints,
      trend,
      change_percentage: changePercentage,
      period_days: days
    };
  }

  /**
   * Get comprehensive analytics for a business
   */
  static async getBusinessAnalytics(businessId: string): Promise<ScoreHistoryAnalytics> {
    const scoreTypes: ScoreType[] = [
      'overall_visibility',
      'google_presence',
      'social_media',
      'website_performance',
      'review_management'
    ];

    const evolutionPromises = scoreTypes.map(scoreType => 
      this.getScoreEvolution(businessId, scoreType, 30)
    );

    const scoreEvolution = await Promise.all(evolutionPromises);

    // Calculate overall trend
    const overallEvolution = scoreEvolution.find(e => e.score_type === 'overall_visibility');
    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    
    if (overallEvolution && Math.abs(overallEvolution.change_percentage) > 3) {
      overallTrend = overallEvolution.change_percentage > 0 ? 'improving' : 'declining';
    }

    // Generate insights
    const keyInsights: string[] = [];
    const recommendations: string[] = [];

    scoreEvolution.forEach(evolution => {
      if (evolution.data_points.length > 0) {
        const latestScore = evolution.data_points[evolution.data_points.length - 1].score;
        
        if (evolution.trend === 'increasing') {
          keyInsights.push(`${evolution.score_type} improved by ${evolution.change_percentage.toFixed(1)}%`);
        } else if (evolution.trend === 'decreasing') {
          keyInsights.push(`${evolution.score_type} declined by ${Math.abs(evolution.change_percentage).toFixed(1)}%`);
          recommendations.push(`Focus on improving ${evolution.score_type} (current score: ${latestScore.toFixed(1)})`);
        }
      }
    });

    return {
      business_id: businessId,
      overall_trend: overallTrend,
      score_evolution: scoreEvolution,
      key_insights: keyInsights,
      recommendations: recommendations,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Update a score history record
   */
  static async updateScore(id: string, data: ScoreHistoryUpdate): Promise<ScoreHistoryRecord> {
    const { data: result, error } = await supabase
      .from('score_history')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update score history: ${error.message}`);
    }

    return result;
  }

  /**
   * Delete a score history record
   */
  static async deleteScore(id: string): Promise<void> {
    const { error } = await supabase
      .from('score_history')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete score history: ${error.message}`);
    }
  }

  /**
   * Get latest scores for a business
   */
  static async getLatestScores(businessId: string): Promise<Record<ScoreType, number | null>> {
    const { data, error } = await supabase
      .from('score_history')
      .select('score_type, score_value, calculated_at')
      .eq('business_id', businessId)
      .order('calculated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get latest scores: ${error.message}`);
    }

    // Get the most recent score for each type
    const latestScores: Record<string, number | null> = {};
    const scoreTypes: ScoreType[] = [
      'overall_visibility',
      'google_presence',
      'social_media',
      'website_performance',
      'review_management',
      'local_seo',
      'content_quality',
      'competitive_position'
    ];

    scoreTypes.forEach(scoreType => {
      const record = data?.find(d => d.score_type === scoreType);
      latestScores[scoreType] = record ? record.score_value : null;
    });

    return latestScores as Record<ScoreType, number | null>;
  }
}