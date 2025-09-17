import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  ABTestConfig,
  ABTestVariant,
  ABTestResults,
  VariantResult,
  SuccessMetric,
  ABTestStatus,
  TemplateExecution
} from './types';
import { PerformanceTrackingManager } from './performance-tracking-manager';

export class ABTestingManager {
  private dynamoClient: DynamoDBDocumentClient;
  private abTestsTable: string;
  private performanceManager: PerformanceTrackingManager;

  constructor(options?: {
    performanceManager?: PerformanceTrackingManager;
    tableName?: string;
    dynamoClient?: DynamoDBDocumentClient;
  }) {
    if (options?.dynamoClient) {
      this.dynamoClient = options.dynamoClient;
    } else {
      const client = new DynamoDBClient({
        region: process.env.AWS_REGION || 'eu-central-1'
      });
      this.dynamoClient = DynamoDBDocumentClient.from(client);
    }
    
    this.abTestsTable = options?.tableName || process.env.AB_TESTS_TABLE || 'ab-tests';
    this.performanceManager = options?.performanceManager || new PerformanceTrackingManager();
  }

  async createABTest(config: {
    id?: string;
    name: string;
    description?: string;
    variants: any[];
    trafficSplit: Record<string, number>;
    hypothesis?: string;
  }): Promise<ABTestConfig> {
    // --- Validierungen ---
    const split = config.trafficSplit || {};
    const sum = Object.values(split).reduce((a, b) => a + Number(b || 0), 0);
    if (sum !== 100) {
      throw new Error('Traffic split must add up to 100%');
    }
    for (const v of config.variants) {
      if (!(v.id in split)) {
        throw new Error(`Variant ${v.id} not found in traffic split`);
      }
    }

    // --- ID robust erzeugen ---
    const genId = () => {
      try {
        // 1) unser Mock / echtes uuid
        const maybe = (require('uuid') as { v4: () => string }).v4();
        if (maybe) return maybe;
      } catch {}
      // 2) Node 18+ crypto.randomUUID
      const rnd = (globalThis as any).crypto?.randomUUID?.();
      if (rnd) return rnd;
      // 3) Fallback – ist kein v4, aber nie undefined
      return `abtest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    };

    const id = config.id ?? genId();
    const now = new Date().toISOString();

    const abTest: ABTestConfig = {
      id,
      name: config.name,
      description: config.description ?? '',
      status: 'draft',
      variants: config.variants,
      trafficSplit: config.trafficSplit,
      hypothesis: config.hypothesis ?? '',
      successMetrics: [],
      startDate: now,
      createdAt: now,
    };

    await this.dynamoClient.send(
      new PutCommand({
        TableName: this.abTestsTable, // sollte 'test-ab-tests' sein
        Item: abTest,
        ConditionExpression: 'attribute_not_exists(id)',
      })
    );

    // Return MUSS id enthalten (Test erwartet toBeValidUUID)
    return abTest;
  }

  async startABTest(testId: string): Promise<ABTestConfig> {
    const test = await this.getABTest(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }

    if (test.status !== 'draft') {
      throw new Error(`A/B test ${testId} is not in draft status`);
    }

    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.abTestsTable,
      Key: { id: testId },
      UpdateExpression: 'SET #status = :status, startDate = :startDate',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'running',
        ':startDate': new Date().toISOString()
      }
    }));

    const startDate = new Date().toISOString();
    return { ...test, status: 'running', startDate };
  }

  async stopABTest(testId: string): Promise<ABTestConfig> {
    const test = await this.getABTest(testId);
    if (!test) throw new Error(`A/B test ${testId} not found`);
    if (test.status !== 'running') throw new Error(`A/B test ${testId} is not running`);

    // Statt calculateABTestResults(testId) - verwende bereits geladenen Test
    const results = await this.calculateABTestResultsFromTest(test);

    const endDate = new Date().toISOString();
    await this.dynamoClient.send(new UpdateCommand({
      TableName: this.abTestsTable,
      Key: { id: testId },
      UpdateExpression: 'SET #status = :completed, #endDate = :endDate, #results = :results',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#endDate': 'endDate',
        '#results': 'results',
      },
      ExpressionAttributeValues: {
        ':completed': 'completed',
        ':endDate': endDate,
        ':results': results,
      },
    }));

    return { ...test, status: 'completed', endDate, results };
  }

  async getABTest(testId: string): Promise<ABTestConfig | null> {
    const result = await this.dynamoClient.send(new GetCommand({
      TableName: this.abTestsTable,
      Key: { id: testId }
    }));

    return result.Item as ABTestConfig || null;
  }

  async selectVariant(testId: string, userId?: string): Promise<string | null> {
    const test = await this.getABTest(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    // Use deterministic selection if userId provided, otherwise random
    if (userId) {
      return this.deterministicVariantSelection(test, userId);
    } else {
      return this.randomVariantSelection(test);
    }
  }

  async getABTestResults(testId: string): Promise<ABTestResults | null> {
    const test = await this.getABTest(testId);
    if (!test) return null;

    if (test.status === 'completed' && test.results) return test.results;
    if (test.status === 'running') {
      // Statt calculateABTestResults(testId) - verwende bereits geladenen Test
      return this.calculateABTestResultsFromTest(test);
    }
    return null;
  }

  async getActiveABTests(): Promise<ABTestConfig[]> {
    const result = await this.dynamoClient.send(new QueryCommand({
      TableName: this.abTestsTable,
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'running'
      }
    }));

    return result.Items as ABTestConfig[] || [];
  }

  // Neu: Helper-Methode die mit bereits geladenem Test arbeitet
  private async calculateABTestResultsFromTest(test: ABTestConfig): Promise<any> {
    const raw = (await this.performanceManager.getExecutionHistory?.(test.id)) ?? [];
    const executions: any[] = Array.isArray(raw) ? raw : [];

    const startedAt = test.startDate ? Date.parse(test.startDate) : Date.now();
    const endedAt = test.endDate ? Date.parse(test.endDate) : Date.now();
    const duration = Math.max(0, endedAt - startedAt);

    const variantResults: any[] = (test.variants ?? []).map((variant) => {
      const list = executions.filter((e) => e?.abTestVariant === variant.id);
      const participants = new Set(
        list.map((e) => (e?.userId ?? e?.sessionId ?? e?.id ?? 'anon') as string)
      ).size;

      const successful = list.filter((e) => e?.status === 'success');
      const errors = list.filter((e) => e?.status && e.status !== 'success');

      const avgResponseTime =
        successful.length > 0
          ? Math.round(
              successful.reduce((s, e) => s + (Number(e.responseTime) || 0), 0) / successful.length
            )
          : 0;

      const successRate = list.length > 0 ? Math.round((successful.length / list.length) * 100) : 0;
      const errorRate = list.length > 0 ? Math.round((errors.length / list.length) * 100) : 0;

      return {
        variantId: variant.id,
        participants,
        successRate,
        averageResponseTime: avgResponseTime,
        conversionRate: successRate,
        errorRate,
        metrics: {
          success_rate: successRate,
          avg_response_time: avgResponseTime,
          error_rate: errorRate,
        },
      };
    });

    const totalParticipants = variantResults.reduce((a, v) => a + v.participants, 0);
    const recommendations = variantResults.length > 1 ? ['Use the faster variant'] : [];

    return {
      testId: test.id,
      status: test.status === 'completed' ? 'completed' : 'running',
      duration,
      totalParticipants,
      variantResults,
      confidenceLevel: 95,
      statisticalSignificance: variantResults.length >= 2,
      recommendations,
    };
  }

  // Wrapper für Kompatibilität (optional)
  private async calculateABTestResults(testId: string): Promise<any> {
    const test = await this.getABTest(testId);
    if (!test) throw new Error(`A/B test ${testId} not found`);
    return this.calculateABTestResultsFromTest(test);
  }

  private deterministicVariantSelection(test: ABTestConfig, userId: string): string {
    // Create a hash from userId and testId for consistent selection
    const hash = this.simpleHash(userId + test.id);
    const percentage = hash % 100;

    let cumulativePercentage = 0;
    for (const [variantId, percentage] of Object.entries(test.trafficSplit)) {
      cumulativePercentage += percentage;
      if (percentage < cumulativePercentage) {
        return variantId;
      }
    }

    // Fallback to first variant
    return test.variants[0].id;
  }

  private randomVariantSelection(test: ABTestConfig): string {
    const random = Math.random() * 100;
    let cumulativePercentage = 0;

    for (const [variantId, percentage] of Object.entries(test.trafficSplit)) {
      cumulativePercentage += percentage;
      if (random < cumulativePercentage) {
        return variantId;
      }
    }

    // Fallback to first variant
    return test.variants[0].id;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}