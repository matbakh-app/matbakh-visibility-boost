// Score History Service
// Task: 1.2 Migrate ScoreHistory service from Supabase to AWS RDS
// Requirements: B.1, B.2

import { AwsRdsClient } from './aws-rds-client';
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
  private static rdsClient = new AwsRdsClient();

  /**
   * Insert a new score history record
   */
  static async insertScore(data: ScoreHistoryInsert): Promise<ScoreHistoryRecord> {
    try {
      const query = `
        INSERT INTO score_history (
          business_id, score_type, score_value, source, 
          calculated_at, meta, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        RETURNING *
      `;
      
      const params = [
        data.business_id,
        data.score_type,
        data.score_value,
        data.source,
        data.calculated_at || new Date().toISOString(),
        JSON.stringify(data.meta || {})
      ];

      const result = await this.rdsClient.executeQuery(query, params);
      
      if (!result.records || result.records.length === 0) {
        throw new Error('No record returned after insert');
      }

      return this.rdsClient.mapRecord(result.records[0]) as ScoreHistoryRecord;
    } catch (error) {
      throw new Error(`Failed to insert score history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Bulk insert multiple score history records
   */
  static async insertScores(data: ScoreHistoryInsert[]): Promise<ScoreHistoryRecord[]> {
    try {
      const results: ScoreHistoryRecord[] = [];
      
      // Execute inserts in batches to avoid query size limits
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(record => this.insertScore(record))
        );
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to insert score history records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query score history with filters
   */
  static async queryScoreHistory(query: ScoreHistoryQuery): Promise<ScoreHistoryRecord[]> {
    try {
      let sql = 'SELECT * FROM score_history WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      // Apply filters
      if (query.business_id) {
        sql += ` AND business_id = ?`;
        params.push(query.business_id);
        paramIndex++;
      }

      if (query.score_type) {
        if (Array.isArray(query.score_type)) {
          const placeholders = query.score_type.map(() => '?').join(',');
          sql += ` AND score_type IN (${placeholders})`;
          params.push(...query.score_type);
          paramIndex += query.score_type.length;
        } else {
          sql += ` AND score_type = ?`;
          params.push(query.score_type);
          paramIndex++;
        }
      }

      if (query.source) {
        if (Array.isArray(query.source)) {
          const placeholders = query.source.map(() => '?').join(',');
          sql += ` AND source IN (${placeholders})`;
          params.push(...query.source);
          paramIndex += query.source.length;
        } else {
          sql += ` AND source = ?`;
          params.push(query.source);
          paramIndex++;
        }
      }

      if (query.date_from) {
        sql += ` AND calculated_at >= ?`;
        params.push(query.date_from);
        paramIndex++;
      }

      if (query.date_to) {
        sql += ` AND calculated_at <= ?`;
        params.push(query.date_to);
        paramIndex++;
      }

      // Order by calculated_at descending
      sql += ' ORDER BY calculated_at DESC';

      // Apply limit and offset
      if (query.limit) {
        sql += ` LIMIT ?`;
        params.push(query.limit);
        paramIndex++;
      }

      if (query.offset) {
        sql += ` OFFSET ?`;
        params.push(query.offset);
        paramIndex++;
      }

      const result = await this.rdsClient.executeQuery(sql, params);
      
      return result.records?.map(record => 
        this.rdsClient.mapRecord(record) as ScoreHistoryRecord
      ) || [];
    } catch (error) {
      throw new Error(`Failed to query score history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    try {
      const updateFields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (data.score_value !== undefined) {
        updateFields.push(`score_value = ?`);
        params.push(data.score_value);
        paramIndex++;
      }

      if (data.source !== undefined) {
        updateFields.push(`source = ?`);
        params.push(data.source);
        paramIndex++;
      }

      if (data.calculated_at !== undefined) {
        updateFields.push(`calculated_at = ?`);
        params.push(data.calculated_at);
        paramIndex++;
      }

      if (data.meta !== undefined) {
        updateFields.push(`meta = ?`);
        params.push(JSON.stringify(data.meta));
        paramIndex++;
      }

      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length === 1) { // Only updated_at
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE score_history 
        SET ${updateFields.join(', ')}
        WHERE id = ?
        RETURNING *
      `;
      
      params.push(id);

      const result = await this.rdsClient.executeQuery(query, params);
      
      if (!result.records || result.records.length === 0) {
        throw new Error('Score history record not found');
      }

      return this.rdsClient.mapRecord(result.records[0]) as ScoreHistoryRecord;
    } catch (error) {
      throw new Error(`Failed to update score history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a score history record
   */
  static async deleteScore(id: string): Promise<void> {
    try {
      const query = 'DELETE FROM score_history WHERE id = ?';
      const result = await this.rdsClient.executeQuery(query, [id]);
      
      if (result.numberOfRecordsUpdated === 0) {
        throw new Error('Score history record not found');
      }
    } catch (error) {
      throw new Error(`Failed to delete score history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get latest scores for a business
   */
  static async getLatestScores(businessId: string): Promise<Record<ScoreType, number | null>> {
    try {
      const query = `
        SELECT score_type, score_value, calculated_at
        FROM score_history
        WHERE business_id = ?
        ORDER BY calculated_at DESC
      `;
      
      const result = await this.rdsClient.executeQuery(query, [businessId]);
      const data = result.records?.map(record => 
        this.rdsClient.mapRecord(record)
      ) || [];

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
        const record = data.find((d: any) => d.score_type === scoreType);
        latestScores[scoreType] = record ? record.score_value : null;
      });

      return latestScores as Record<ScoreType, number | null>;
    } catch (error) {
      throw new Error(`Failed to get latest scores: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}