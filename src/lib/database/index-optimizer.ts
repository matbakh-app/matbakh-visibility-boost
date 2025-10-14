/**
 * Database Index Optimization Analyzer
 * 
 * This module provides intelligent index optimization recommendations including:
 * - Query pattern analysis and index suggestions
 * - Performance impact estimation and cost-benefit analysis
 * - Automatic index monitoring and maintenance recommendations
 * - Index usage statistics and optimization opportunities
 * - Schema analysis and composite index recommendations
 */

import { publishMetric } from '../monitoring';

// Index types supported by PostgreSQL
export type IndexType = 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin' | 'bloom';

// Index recommendation with detailed analysis
export interface IndexRecommendation {
  id: string;
  tableName: string;
  columns: string[];
  indexType: IndexType;
  
  // Performance analysis
  estimatedImpact: 'critical' | 'high' | 'medium' | 'low';
  currentCostMs: number;
  estimatedCostMs: number;
  improvementPercentage: number;
  
  // Usage analysis
  affectedQueries: string[];
  queryFrequency: number; // queries per hour
  totalTimeSpentMs: number; // total time spent on affected queries
  
  // Implementation details
  createStatement: string;
  estimatedSizeMB: number;
  maintenanceCost: 'low' | 'medium' | 'high';
  
  // Priority and scoring
  priority: number; // 0-100
  confidenceScore: number; // 0-100
  
  // Metadata
  reason: string;
  createdAt: number;
  lastAnalyzed: number;
  status: 'pending' | 'implemented' | 'rejected' | 'monitoring';
}

// Query analysis result
export interface QueryAnalysis {
  queryId: string;
  normalizedQuery: string;
  executionTimeMs: number;
  executionCount: number;
  planCost: number;
  
  // Table and column analysis
  tablesAccessed: string[];
  columnsInWhere: Array<{ table: string; column: string; operator: string }>;
  columnsInOrderBy: Array<{ table: string; column: string; direction: 'ASC' | 'DESC' }>;
  columnsInJoin: Array<{ leftTable: string; leftColumn: string; rightTable: string; rightColumn: string }>;
  columnsInGroupBy: Array<{ table: string; column: string }>;
  
  // Index usage
  indexesUsed: string[];
  missingIndexes: string[];
  
  // Performance indicators
  seqScans: number;
  indexScans: number;
  rowsExamined: number;
  rowsReturned: number;
  
  timestamp: number;
}

// Index usage statistics
export interface IndexUsageStats {
  indexName: string;
  tableName: string;
  columns: string[];
  indexType: IndexType;
  
  // Usage metrics
  totalScans: number;
  tuplesRead: number;
  tuplesReturned: number;
  
  // Performance metrics
  averageScanTimeMs: number;
  totalScanTimeMs: number;
  
  // Maintenance metrics
  sizeMB: number;
  lastVacuum?: number;
  lastAnalyze?: number;
  
  // Efficiency metrics
  selectivity: number; // 0-1, how selective the index is
  utilizationScore: number; // 0-100, how well utilized the index is
  
  timestamp: number;
}

// Schema analysis for optimization opportunities
export interface SchemaAnalysis {
  tableName: string;
  totalRows: number;
  totalSizeMB: number;
  
  // Column statistics
  columns: Array<{
    name: string;
    dataType: string;
    nullable: boolean;
    distinctValues: number;
    selectivity: number;
    averageLength?: number;
  }>;
  
  // Current indexes
  existingIndexes: Array<{
    name: string;
    columns: string[];
    type: IndexType;
    sizeMB: number;
    unique: boolean;
  }>;
  
  // Query patterns
  commonQueryPatterns: Array<{
    pattern: string;
    frequency: number;
    averageTimeMs: number;
  }>;
  
  timestamp: number;
}

class DatabaseIndexOptimizer {
  private queryAnalyses: QueryAnalysis[] = [];
  private indexRecommendations: IndexRecommendation[] = [];
  private indexUsageStats: IndexUsageStats[] = [];
  private schemaAnalyses: SchemaAnalysis[] = [];
  
  private isInitialized = false;
  private analysisInterval?: NodeJS.Timeout;
  
  // Configuration
  private config = {
    analysisIntervalMs: 300000, // 5 minutes
    minQueryFrequency: 10, // minimum queries per hour to consider
    minImprovementPercentage: 20, // minimum improvement to recommend
    maxRecommendations: 50,
    retentionDays: 7
  };

  /**
   * Initialize the index optimizer
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing database index optimizer...');
      
      // Load existing schema analysis
      await this.performSchemaAnalysis();
      
      // Load current index usage statistics
      await this.collectIndexUsageStats();
      
      // Start periodic analysis
      this.startPeriodicAnalysis();
      
      this.isInitialized = true;
      console.log('Database index optimizer initialized');
      
    } catch (error) {
      console.error('Failed to initialize index optimizer:', error);
      throw error;
    }
  }

  /**
   * Analyze a query for index optimization opportunities
   */
  public async analyzeQuery(
    queryId: string,
    query: string,
    executionTimeMs: number,
    planCost: number = 0,
    indexesUsed: string[] = [],
    executionPlan?: any
  ): Promise<void> {
    try {
      const analysis = await this.performQueryAnalysis(
        queryId, query, executionTimeMs, planCost, indexesUsed, executionPlan
      );
      
      // Store analysis
      this.queryAnalyses.push(analysis);
      
      // Keep only recent analyses
      this.cleanupOldAnalyses();
      
      // Generate recommendations if query is slow or frequent
      if (executionTimeMs > 1000 || this.getQueryFrequency(analysis.normalizedQuery) > this.config.minQueryFrequency) {
        await this.generateRecommendationsForQuery(analysis);
      }
      
    } catch (error) {
      console.error('Failed to analyze query:', error);
    }
  }

  /**
   * Perform detailed query analysis
   */
  private async performQueryAnalysis(
    queryId: string,
    query: string,
    executionTimeMs: number,
    planCost: number,
    indexesUsed: string[],
    executionPlan?: any
  ): Promise<QueryAnalysis> {
    const normalizedQuery = this.normalizeQuery(query);
    
    // Parse query structure
    const queryStructure = this.parseQueryStructure(query);
    
    // Analyze execution plan if available
    const planAnalysis = executionPlan ? this.analyzePlan(executionPlan) : {
      seqScans: 0,
      indexScans: indexesUsed.length,
      rowsExamined: 0,
      rowsReturned: 0
    };
    
    return {
      queryId,
      normalizedQuery,
      executionTimeMs,
      executionCount: this.getQueryExecutionCount(normalizedQuery),
      planCost,
      tablesAccessed: queryStructure.tables,
      columnsInWhere: queryStructure.whereColumns,
      columnsInOrderBy: queryStructure.orderByColumns,
      columnsInJoin: queryStructure.joinColumns,
      columnsInGroupBy: queryStructure.groupByColumns,
      indexesUsed,
      missingIndexes: [], // Will be populated by recommendation engine
      seqScans: planAnalysis.seqScans,
      indexScans: planAnalysis.indexScans,
      rowsExamined: planAnalysis.rowsExamined,
      rowsReturned: planAnalysis.rowsReturned,
      timestamp: Date.now()
    };
  }

  /**
   * Generate index recommendations for a specific query
   */
  private async generateRecommendationsForQuery(analysis: QueryAnalysis): Promise<void> {
    const recommendations: Partial<IndexRecommendation>[] = [];
    
    // Analyze WHERE clause columns
    for (const whereCol of analysis.columnsInWhere) {
      const recommendation = await this.analyzeWhereClauseIndex(whereCol, analysis);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
    
    // Analyze ORDER BY columns
    for (const orderCol of analysis.columnsInOrderBy) {
      const recommendation = await this.analyzeOrderByIndex(orderCol, analysis);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
    
    // Analyze JOIN columns
    for (const joinCol of analysis.columnsInJoin) {
      const recommendation = await this.analyzeJoinIndex(joinCol, analysis);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }
    
    // Analyze composite index opportunities
    const compositeRecommendations = await this.analyzeCompositeIndexes(analysis);
    recommendations.push(...compositeRecommendations);
    
    // Process and store recommendations
    for (const rec of recommendations) {
      if (rec.columns && rec.tableName) {
        await this.addIndexRecommendation(rec as IndexRecommendation);
      }
    }
  }

  /**
   * Analyze WHERE clause for index opportunities
   */
  private async analyzeWhereClauseIndex(
    whereCol: { table: string; column: string; operator: string },
    analysis: QueryAnalysis
  ): Promise<Partial<IndexRecommendation> | null> {
    const { table, column, operator } = whereCol;
    
    // Check if index already exists
    if (await this.indexExists(table, [column])) {
      return null;
    }
    
    // Determine best index type based on operator and data type
    const columnInfo = await this.getColumnInfo(table, column);
    const indexType = this.determineIndexType(columnInfo, operator);
    
    // Estimate impact
    const impact = await this.estimateIndexImpact(table, [column], analysis);
    
    return {
      tableName: table,
      columns: [column],
      indexType,
      estimatedImpact: impact.level,
      currentCostMs: analysis.executionTimeMs,
      estimatedCostMs: analysis.executionTimeMs * (1 - impact.improvement),
      improvementPercentage: impact.improvement * 100,
      reason: `WHERE clause on ${column} with operator ${operator}`,
      priority: this.calculatePriority(impact, analysis),
      confidenceScore: impact.confidence
    };
  }

  /**
   * Analyze ORDER BY for index opportunities
   */
  private async analyzeOrderByIndex(
    orderCol: { table: string; column: string; direction: 'ASC' | 'DESC' },
    analysis: QueryAnalysis
  ): Promise<Partial<IndexRecommendation> | null> {
    const { table, column } = orderCol;
    
    // Check if index already exists
    if (await this.indexExists(table, [column])) {
      return null;
    }
    
    // ORDER BY typically benefits from B-tree indexes
    const impact = await this.estimateIndexImpact(table, [column], analysis);
    
    return {
      tableName: table,
      columns: [column],
      indexType: 'btree',
      estimatedImpact: impact.level,
      currentCostMs: analysis.executionTimeMs,
      estimatedCostMs: analysis.executionTimeMs * (1 - impact.improvement),
      improvementPercentage: impact.improvement * 100,
      reason: `ORDER BY on ${column}`,
      priority: this.calculatePriority(impact, analysis) * 0.8, // Slightly lower priority than WHERE
      confidenceScore: impact.confidence
    };
  }

  /**
   * Analyze JOIN for index opportunities
   */
  private async analyzeJoinIndex(
    joinCol: { leftTable: string; leftColumn: string; rightTable: string; rightColumn: string },
    analysis: QueryAnalysis
  ): Promise<Partial<IndexRecommendation> | null> {
    const { leftTable, leftColumn, rightTable, rightColumn } = joinCol;
    
    // Check both sides of the join
    const recommendations: Partial<IndexRecommendation>[] = [];
    
    // Left side
    if (!await this.indexExists(leftTable, [leftColumn])) {
      const impact = await this.estimateIndexImpact(leftTable, [leftColumn], analysis);
      recommendations.push({
        tableName: leftTable,
        columns: [leftColumn],
        indexType: 'btree',
        estimatedImpact: impact.level,
        currentCostMs: analysis.executionTimeMs,
        estimatedCostMs: analysis.executionTimeMs * (1 - impact.improvement),
        improvementPercentage: impact.improvement * 100,
        reason: `JOIN condition on ${leftTable}.${leftColumn}`,
        priority: this.calculatePriority(impact, analysis) * 1.2, // Higher priority for JOINs
        confidenceScore: impact.confidence
      });
    }
    
    // Right side
    if (!await this.indexExists(rightTable, [rightColumn])) {
      const impact = await this.estimateIndexImpact(rightTable, [rightColumn], analysis);
      recommendations.push({
        tableName: rightTable,
        columns: [rightColumn],
        indexType: 'btree',
        estimatedImpact: impact.level,
        currentCostMs: analysis.executionTimeMs,
        estimatedCostMs: analysis.executionTimeMs * (1 - impact.improvement),
        improvementPercentage: impact.improvement * 100,
        reason: `JOIN condition on ${rightTable}.${rightColumn}`,
        priority: this.calculatePriority(impact, analysis) * 1.2,
        confidenceScore: impact.confidence
      });
    }
    
    return recommendations[0] || null; // Return first recommendation
  }

  /**
   * Analyze composite index opportunities
   */
  private async analyzeCompositeIndexes(analysis: QueryAnalysis): Promise<Partial<IndexRecommendation>[]> {
    const recommendations: Partial<IndexRecommendation>[] = [];
    
    // Group columns by table
    const tableColumns = new Map<string, Set<string>>();
    
    // Collect WHERE columns
    analysis.columnsInWhere.forEach(col => {
      if (!tableColumns.has(col.table)) {
        tableColumns.set(col.table, new Set());
      }
      tableColumns.get(col.table)!.add(col.column);
    });
    
    // Add ORDER BY columns to the same table
    analysis.columnsInOrderBy.forEach(col => {
      if (tableColumns.has(col.table)) {
        tableColumns.get(col.table)!.add(col.column);
      }
    });
    
    // Generate composite index recommendations
    for (const [table, columns] of tableColumns) {
      if (columns.size >= 2) {
        const columnArray = Array.from(columns);
        
        // Check if composite index already exists
        if (!await this.indexExists(table, columnArray)) {
          const impact = await this.estimateIndexImpact(table, columnArray, analysis);
          
          if (impact.improvement > 0.3) { // Only recommend if significant improvement
            recommendations.push({
              tableName: table,
              columns: columnArray,
              indexType: 'btree',
              estimatedImpact: impact.level,
              currentCostMs: analysis.executionTimeMs,
              estimatedCostMs: analysis.executionTimeMs * (1 - impact.improvement),
              improvementPercentage: impact.improvement * 100,
              reason: `Composite index for multiple conditions on ${table}`,
              priority: this.calculatePriority(impact, analysis) * 1.5, // Higher priority for composite
              confidenceScore: impact.confidence * 0.9 // Slightly lower confidence
            });
          }
        }
      }
    }
    
    return recommendations;
  }

  /**
   * Perform comprehensive schema analysis
   */
  private async performSchemaAnalysis(): Promise<void> {
    try {
      // Get list of tables (mock implementation)
      const tables = await this.getTables();
      
      for (const tableName of tables) {
        const analysis = await this.analyzeTableSchema(tableName);
        this.schemaAnalyses.push(analysis);
      }
      
      console.log(`Schema analysis completed for ${tables.length} tables`);
      
    } catch (error) {
      console.error('Failed to perform schema analysis:', error);
    }
  }

  /**
   * Analyze individual table schema
   */
  private async analyzeTableSchema(tableName: string): Promise<SchemaAnalysis> {
    // Mock implementation - in production, would query actual database
    const mockAnalysis: SchemaAnalysis = {
      tableName,
      totalRows: Math.floor(Math.random() * 1000000) + 1000,
      totalSizeMB: Math.floor(Math.random() * 500) + 10,
      columns: [
        {
          name: 'id',
          dataType: 'uuid',
          nullable: false,
          distinctValues: Math.floor(Math.random() * 100000),
          selectivity: 1.0
        },
        {
          name: 'created_at',
          dataType: 'timestamp',
          nullable: false,
          distinctValues: Math.floor(Math.random() * 50000),
          selectivity: 0.8
        },
        {
          name: 'status',
          dataType: 'varchar',
          nullable: true,
          distinctValues: 5,
          selectivity: 0.2
        }
      ],
      existingIndexes: [
        {
          name: `${tableName}_pkey`,
          columns: ['id'],
          type: 'btree',
          sizeMB: 5,
          unique: true
        }
      ],
      commonQueryPatterns: [
        {
          pattern: `SELECT * FROM ${tableName} WHERE status = ?`,
          frequency: 100,
          averageTimeMs: 150
        }
      ],
      timestamp: Date.now()
    };
    
    return mockAnalysis;
  }

  /**
   * Collect index usage statistics
   */
  private async collectIndexUsageStats(): Promise<void> {
    try {
      // Mock implementation - in production, would query pg_stat_user_indexes
      const mockStats: IndexUsageStats[] = [
        {
          indexName: 'profiles_pkey',
          tableName: 'profiles',
          columns: ['id'],
          indexType: 'btree',
          totalScans: 1000,
          tuplesRead: 50000,
          tuplesReturned: 1000,
          averageScanTimeMs: 5,
          totalScanTimeMs: 5000,
          sizeMB: 10,
          selectivity: 1.0,
          utilizationScore: 95,
          timestamp: Date.now()
        }
      ];
      
      this.indexUsageStats = mockStats;
      
    } catch (error) {
      console.error('Failed to collect index usage stats:', error);
    }
  }

  /**
   * Add or update index recommendation
   */
  private async addIndexRecommendation(recommendation: Partial<IndexRecommendation>): Promise<void> {
    if (!recommendation.tableName || !recommendation.columns) return;
    
    // Check if similar recommendation already exists
    const existing = this.indexRecommendations.find(r => 
      r.tableName === recommendation.tableName &&
      JSON.stringify(r.columns.sort()) === JSON.stringify(recommendation.columns.sort())
    );
    
    if (existing) {
      // Update existing recommendation
      existing.queryFrequency += 1;
      existing.totalTimeSpentMs += recommendation.currentCostMs || 0;
      existing.lastAnalyzed = Date.now();
      
      // Recalculate priority
      existing.priority = Math.min(100, existing.priority + 5);
    } else {
      // Create new recommendation
      const newRecommendation: IndexRecommendation = {
        id: `idx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        tableName: recommendation.tableName,
        columns: recommendation.columns,
        indexType: recommendation.indexType || 'btree',
        estimatedImpact: recommendation.estimatedImpact || 'medium',
        currentCostMs: recommendation.currentCostMs || 0,
        estimatedCostMs: recommendation.estimatedCostMs || 0,
        improvementPercentage: recommendation.improvementPercentage || 0,
        affectedQueries: [],
        queryFrequency: 1,
        totalTimeSpentMs: recommendation.currentCostMs || 0,
        createStatement: this.generateCreateStatement(
          recommendation.tableName,
          recommendation.columns,
          recommendation.indexType || 'btree'
        ),
        estimatedSizeMB: await this.estimateIndexSize(recommendation.tableName, recommendation.columns),
        maintenanceCost: this.estimateMaintenanceCost(recommendation.columns.length),
        priority: recommendation.priority || 50,
        confidenceScore: recommendation.confidenceScore || 70,
        reason: recommendation.reason || 'Performance optimization',
        createdAt: Date.now(),
        lastAnalyzed: Date.now(),
        status: 'pending'
      };
      
      this.indexRecommendations.push(newRecommendation);
    }
    
    // Sort by priority and keep only top recommendations
    this.indexRecommendations.sort((a, b) => b.priority - a.priority);
    this.indexRecommendations = this.indexRecommendations.slice(0, this.config.maxRecommendations);
  }

  /**
   * Start periodic analysis
   */
  private startPeriodicAnalysis(): void {
    this.analysisInterval = setInterval(async () => {
      await this.performPeriodicAnalysis();
    }, this.config.analysisIntervalMs);
  }

  /**
   * Perform periodic analysis and maintenance
   */
  private async performPeriodicAnalysis(): Promise<void> {
    try {
      // Update index usage statistics
      await this.collectIndexUsageStats();
      
      // Analyze query patterns for new recommendations
      await this.analyzeQueryPatterns();
      
      // Clean up old data
      this.cleanupOldAnalyses();
      
      // Publish metrics
      await this.publishMetrics();
      
    } catch (error) {
      console.error('Periodic analysis failed:', error);
    }
  }

  /**
   * Analyze query patterns for optimization opportunities
   */
  private async analyzeQueryPatterns(): Promise<void> {
    // Group queries by pattern
    const patterns = new Map<string, QueryAnalysis[]>();
    
    this.queryAnalyses.forEach(analysis => {
      if (!patterns.has(analysis.normalizedQuery)) {
        patterns.set(analysis.normalizedQuery, []);
      }
      patterns.get(analysis.normalizedQuery)!.push(analysis);
    });
    
    // Analyze each pattern
    for (const [pattern, analyses] of patterns) {
      const totalTime = analyses.reduce((sum, a) => sum + a.executionTimeMs, 0);
      const avgTime = totalTime / analyses.length;
      const frequency = analyses.length;
      
      // Generate recommendations for frequently slow queries
      if (frequency >= this.config.minQueryFrequency && avgTime > 500) {
        const representativeAnalysis = analyses[0];
        await this.generateRecommendationsForQuery(representativeAnalysis);
      }
    }
  }

  /**
   * Utility methods
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/('[^']*'|"[^"]*")/g, '?')
      .replace(/\b\d+\b/g, '?')
      .trim()
      .toLowerCase();
  }

  private parseQueryStructure(query: string) {
    // Simple query parsing (in production, would use proper SQL parser)
    const lowerQuery = query.toLowerCase();
    
    return {
      tables: this.extractTables(query),
      whereColumns: this.extractWhereColumns(query),
      orderByColumns: this.extractOrderByColumns(query),
      joinColumns: this.extractJoinColumns(query),
      groupByColumns: this.extractGroupByColumns(query)
    };
  }

  private extractTables(query: string): string[] {
    const matches = query.match(/(?:from|join|into|update)\s+(\w+)/gi);
    return matches ? matches.map(m => m.split(/\s+/)[1]) : [];
  }

  private extractWhereColumns(query: string): Array<{ table: string; column: string; operator: string }> {
    // Simplified extraction
    const matches = query.match(/where\s+(\w+)\.?(\w+)\s*([=<>!]+)/gi);
    return matches ? matches.map(m => {
      const parts = m.split(/\s+/);
      const column = parts[1];
      const operator = parts[2] || '=';
      return { table: 'unknown', column, operator };
    }) : [];
  }

  private extractOrderByColumns(query: string): Array<{ table: string; column: string; direction: 'ASC' | 'DESC' }> {
    const matches = query.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/gi);
    return matches ? matches.map(m => {
      const parts = m.split(/\s+/);
      const column = parts[2];
      const direction = (parts[3]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';
      return { table: 'unknown', column, direction };
    }) : [];
  }

  private extractJoinColumns(query: string): Array<{ leftTable: string; leftColumn: string; rightTable: string; rightColumn: string }> {
    // Simplified JOIN extraction
    return [];
  }

  private extractGroupByColumns(query: string): Array<{ table: string; column: string }> {
    const matches = query.match(/group\s+by\s+(\w+)/gi);
    return matches ? matches.map(m => {
      const column = m.split(/\s+/)[2];
      return { table: 'unknown', column };
    }) : [];
  }

  private analyzePlan(plan: any) {
    // Mock plan analysis
    return {
      seqScans: 1,
      indexScans: 0,
      rowsExamined: 1000,
      rowsReturned: 10
    };
  }

  private getQueryExecutionCount(normalizedQuery: string): number {
    return this.queryAnalyses.filter(a => a.normalizedQuery === normalizedQuery).length;
  }

  private getQueryFrequency(normalizedQuery: string): number {
    const analyses = this.queryAnalyses.filter(a => a.normalizedQuery === normalizedQuery);
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return analyses.filter(a => a.timestamp > hourAgo).length;
  }

  private async indexExists(tableName: string, columns: string[]): Promise<boolean> {
    // Mock implementation
    return Math.random() < 0.3; // 30% chance index exists
  }

  private async getColumnInfo(tableName: string, columnName: string) {
    // Mock column info
    return {
      dataType: 'varchar',
      nullable: true,
      distinctValues: 1000
    };
  }

  private determineIndexType(columnInfo: any, operator: string): IndexType {
    if (operator === '=' && columnInfo.distinctValues < 100) {
      return 'hash';
    }
    if (columnInfo.dataType === 'text' && operator.includes('LIKE')) {
      return 'gin';
    }
    return 'btree'; // Default
  }

  private async estimateIndexImpact(tableName: string, columns: string[], analysis: QueryAnalysis) {
    // Mock impact estimation
    const improvement = Math.random() * 0.7 + 0.1; // 10-80% improvement
    const confidence = Math.random() * 30 + 70; // 70-100% confidence
    
    let level: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    if (improvement > 0.6) level = 'critical';
    else if (improvement > 0.4) level = 'high';
    else if (improvement > 0.2) level = 'medium';
    else level = 'low';
    
    return { improvement, confidence, level };
  }

  private calculatePriority(impact: any, analysis: QueryAnalysis): number {
    let priority = impact.improvement * 50; // Base priority from improvement
    priority += Math.min(analysis.executionTimeMs / 100, 30); // Add for slow queries
    priority += Math.min(this.getQueryFrequency(analysis.normalizedQuery), 20); // Add for frequent queries
    return Math.min(100, Math.round(priority));
  }

  private generateCreateStatement(tableName: string, columns: string[], indexType: IndexType): string {
    const indexName = `idx_${tableName}_${columns.join('_')}`;
    const columnList = columns.join(', ');
    
    if (indexType === 'btree') {
      return `CREATE INDEX ${indexName} ON ${tableName} (${columnList});`;
    } else {
      return `CREATE INDEX ${indexName} ON ${tableName} USING ${indexType} (${columnList});`;
    }
  }

  private async estimateIndexSize(tableName: string, columns: string[]): Promise<number> {
    // Mock size estimation
    return Math.random() * 50 + 5; // 5-55 MB
  }

  private estimateMaintenanceCost(columnCount: number): 'low' | 'medium' | 'high' {
    if (columnCount === 1) return 'low';
    if (columnCount <= 3) return 'medium';
    return 'high';
  }

  private async getTables(): Promise<string[]> {
    // Mock table list
    return ['profiles', 'business_partners', 'visibility_check_leads', 'visibility_check_results'];
  }

  private cleanupOldAnalyses(): void {
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    this.queryAnalyses = this.queryAnalyses.filter(a => a.timestamp > cutoff);
  }

  private async publishMetrics(): Promise<void> {
    try {
      const commonDimensions = {
        Service: 'DatabaseIndexOptimizer',
        Environment: process.env.NODE_ENV || 'development',
        Component: 'IndexOptimizer'
      };

      await Promise.all([
        publishMetric({
          metricName: 'db_index_recommendations_total',
          value: this.indexRecommendations.length,
          unit: 'Count',
          dimensions: commonDimensions
        }),
        publishMetric({
          metricName: 'db_index_recommendations_high_priority',
          value: this.indexRecommendations.filter(r => r.priority > 80).length,
          unit: 'Count',
          dimensions: commonDimensions
        }),
        publishMetric({
          metricName: 'db_queries_analyzed',
          value: this.queryAnalyses.length,
          unit: 'Count',
          dimensions: commonDimensions
        })
      ]);
    } catch (error) {
      console.warn('Failed to publish index optimizer metrics:', error);
    }
  }

  /**
   * Public API methods
   */
  public getRecommendations(): IndexRecommendation[] {
    return [...this.indexRecommendations].sort((a, b) => b.priority - a.priority);
  }

  public getHighPriorityRecommendations(): IndexRecommendation[] {
    return this.getRecommendations().filter(r => r.priority > 80);
  }

  public getQueryAnalyses(): QueryAnalysis[] {
    return [...this.queryAnalyses];
  }

  public getIndexUsageStats(): IndexUsageStats[] {
    return [...this.indexUsageStats];
  }

  public getSchemaAnalyses(): SchemaAnalysis[] {
    return [...this.schemaAnalyses];
  }

  public async implementRecommendation(recommendationId: string): Promise<void> {
    const recommendation = this.indexRecommendations.find(r => r.id === recommendationId);
    if (recommendation) {
      recommendation.status = 'implemented';
      console.log(`Index recommendation implemented: ${recommendation.createStatement}`);
    }
  }

  public async rejectRecommendation(recommendationId: string, reason: string): Promise<void> {
    const recommendation = this.indexRecommendations.find(r => r.id === recommendationId);
    if (recommendation) {
      recommendation.status = 'rejected';
      console.log(`Index recommendation rejected: ${reason}`);
    }
  }

  public getOptimizationSummary() {
    const recommendations = this.getRecommendations();
    const highPriority = recommendations.filter(r => r.priority > 80);
    const totalPotentialImprovement = recommendations.reduce((sum, r) => sum + r.improvementPercentage, 0);
    
    return {
      totalRecommendations: recommendations.length,
      highPriorityRecommendations: highPriority.length,
      averageImprovementPercentage: recommendations.length > 0 ? totalPotentialImprovement / recommendations.length : 0,
      totalQueriesAnalyzed: this.queryAnalyses.length,
      tablesAnalyzed: this.schemaAnalyses.length,
      lastAnalysis: Math.max(...this.queryAnalyses.map(a => a.timestamp), 0)
    };
  }

  /**
   * Shutdown the optimizer
   */
  public destroy(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    this.isInitialized = false;
  }
}

// Global index optimizer instance
export const indexOptimizer = new DatabaseIndexOptimizer();

// Export for manual usage
export { DatabaseIndexOptimizer };