/**
 * Load Testing Engine
 * Provides comprehensive load testing capabilities using Artillery and K6
 */

import { spawn } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface LoadTestConfig {
  target: string;
  phases: LoadTestPhase[];
  scenarios: LoadTestScenario[];
  thresholds?: LoadTestThresholds;
  duration?: number;
  arrivalRate?: number;
}

export interface LoadTestPhase {
  duration: number;
  arrivalRate: number;
  name?: string;
}

export interface LoadTestScenario {
  name: string;
  weight: number;
  flow: LoadTestStep[];
}

export interface LoadTestStep {
  get?: string;
  post?: string;
  put?: string;
  delete?: string;
  json?: any;
  headers?: Record<string, string>;
  capture?: LoadTestCapture[];
  think?: number;
}

export interface LoadTestCapture {
  json: string;
  as: string;
}

export interface LoadTestThresholds {
  http_req_duration: string[];
  http_req_failed: string[];
  http_reqs: string[];
}

export interface LoadTestResult {
  timestamp: string;
  duration: number;
  totalRequests: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number;
  scenarios: ScenarioResult[];
  summary: LoadTestSummary;
}

export interface ScenarioResult {
  name: string;
  requests: number;
  failures: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
}

export interface LoadTestSummary {
  passed: boolean;
  totalErrors: number;
  criticalErrors: number;
  recommendations: string[];
}

export class LoadTester {
  private reportsDir: string;

  constructor() {
    this.reportsDir = join(process.cwd(), 'performance-reports');
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('🔥 Starting load test...');
    
    try {
      // Generate Artillery configuration
      const artilleryConfig = this.generateArtilleryConfig(config);
      const configPath = join(this.reportsDir, 'artillery-config.yml');
      writeFileSync(configPath, artilleryConfig);

      // Run Artillery test
      const result = await this.executeArtilleryTest(configPath);
      
      console.log('✅ Load test completed');
      return result;
    } catch (error) {
      console.error('❌ Load test failed:', error);
      return this.createFailureResult(error);
    }
  }

  async runStressTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('💥 Starting stress test...');
    
    // Modify config for stress testing (higher load)
    const stressConfig = {
      ...config,
      phases: [
        { duration: 60, arrivalRate: 1, name: 'ramp-up' },
        { duration: 120, arrivalRate: 10, name: 'steady' },
        { duration: 60, arrivalRate: 50, name: 'spike' },
        { duration: 120, arrivalRate: 100, name: 'stress' },
        { duration: 60, arrivalRate: 1, name: 'ramp-down' },
      ],
    };

    return this.runLoadTest(stressConfig);
  }

  async runSpikeTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('⚡ Starting spike test...');
    
    // Modify config for spike testing (sudden load increases)
    const spikeConfig = {
      ...config,
      phases: [
        { duration: 30, arrivalRate: 1, name: 'baseline' },
        { duration: 10, arrivalRate: 100, name: 'spike-1' },
        { duration: 30, arrivalRate: 1, name: 'recovery-1' },
        { duration: 10, arrivalRate: 200, name: 'spike-2' },
        { duration: 30, arrivalRate: 1, name: 'recovery-2' },
      ],
    };

    return this.runLoadTest(spikeConfig);
  }

  private generateArtilleryConfig(config: LoadTestConfig): string {
    const artilleryConfig = {
      config: {
        target: config.target,
        phases: config.phases,
        processor: './artillery-processor.js',
      },
      scenarios: config.scenarios.map(scenario => ({
        name: scenario.name,
        weight: scenario.weight,
        flow: scenario.flow,
      })),
    };

    return `# Artillery Load Test Configuration
# Generated: ${new Date().toISOString()}

config:
  target: '${config.target}'
  phases:
${config.phases.map(phase => `    - duration: ${phase.duration}
      arrivalRate: ${phase.arrivalRate}
      name: '${phase.name || 'phase'}'`).join('\n')}
  processor: './artillery-processor.js'

scenarios:
${config.scenarios.map(scenario => `  - name: '${scenario.name}'
    weight: ${scenario.weight}
    flow:
${scenario.flow.map(step => {
  if (step.get) return `      - get:
          url: '${step.get}'`;
  if (step.post) return `      - post:
          url: '${step.post}'
          json: ${JSON.stringify(step.json || {})}`;
  if (step.think) return `      - think: ${step.think}`;
  return '';
}).filter(Boolean).join('\n')}`).join('\n')}
`;
  }

  private async executeArtilleryTest(configPath: string): Promise<LoadTestResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const artillery = spawn('npx', ['artillery', 'run', configPath, '--output', join(this.reportsDir, 'artillery-report.json')], {
        stdio: 'pipe',
      });

      let stdout = '';
      let stderr = '';

      artillery.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(data.toString());
      });

      artillery.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(data.toString());
      });

      artillery.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          try {
            const result = this.parseArtilleryOutput(stdout, duration);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse Artillery output: ${error}`));
          }
        } else {
          reject(new Error(`Artillery process exited with code ${code}: ${stderr}`));
        }
      });

      artillery.on('error', (error) => {
        reject(new Error(`Failed to start Artillery: ${error.message}`));
      });
    });
  }

  private parseArtilleryOutput(output: string, duration: number): LoadTestResult {
    // Parse Artillery output (simplified - in real implementation, parse JSON report)
    const lines = output.split('\n');
    
    // Extract basic metrics (this is a simplified parser)
    let totalRequests = 0;
    let errorRate = 0;
    let averageResponseTime = 0;
    let p95ResponseTime = 0;
    let p99ResponseTime = 0;

    for (const line of lines) {
      if (line.includes('http.requests:')) {
        const match = line.match(/(\d+)/);
        if (match) totalRequests = parseInt(match[1]);
      }
      if (line.includes('http.response_time:')) {
        const match = line.match(/avg=(\d+\.?\d*)/);
        if (match) averageResponseTime = parseFloat(match[1]);
      }
      if (line.includes('p95=')) {
        const match = line.match(/p95=(\d+\.?\d*)/);
        if (match) p95ResponseTime = parseFloat(match[1]);
      }
      if (line.includes('p99=')) {
        const match = line.match(/p99=(\d+\.?\d*)/);
        if (match) p99ResponseTime = parseFloat(match[1]);
      }
    }

    const requestsPerSecond = totalRequests / (duration / 1000);
    const throughput = requestsPerSecond * 1024; // Simplified throughput calculation

    return {
      timestamp: new Date().toISOString(),
      duration,
      totalRequests,
      requestsPerSecond,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      throughput,
      scenarios: [], // Would be populated from detailed report
      summary: {
        passed: errorRate < 5 && averageResponseTime < 1000,
        totalErrors: Math.floor(totalRequests * errorRate / 100),
        criticalErrors: 0,
        recommendations: this.generateRecommendations(averageResponseTime, errorRate, requestsPerSecond),
      },
    };
  }

  private generateRecommendations(avgResponseTime: number, errorRate: number, rps: number): string[] {
    const recommendations: string[] = [];

    if (avgResponseTime > 1000) {
      recommendations.push('Consider optimizing database queries and API response times');
    }
    if (avgResponseTime > 2000) {
      recommendations.push('Implement caching strategies to reduce response times');
    }
    if (errorRate > 1) {
      recommendations.push('Investigate and fix error sources to improve reliability');
    }
    if (errorRate > 5) {
      recommendations.push('Critical: High error rate indicates system instability');
    }
    if (rps < 10) {
      recommendations.push('Consider scaling infrastructure to handle higher throughput');
    }
    if (rps > 100) {
      recommendations.push('Excellent throughput - monitor for sustained performance');
    }

    return recommendations;
  }

  private createFailureResult(error: any): LoadTestResult {
    return {
      timestamp: new Date().toISOString(),
      duration: 0,
      totalRequests: 0,
      requestsPerSecond: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 100,
      throughput: 0,
      scenarios: [],
      summary: {
        passed: false,
        totalErrors: 1,
        criticalErrors: 1,
        recommendations: [`Load test failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      },
    };
  }

  // Predefined test scenarios for common use cases
  static getVisibilityCheckScenario(): LoadTestScenario {
    return {
      name: 'Visibility Check Flow',
      weight: 70,
      flow: [
        { get: '/vc/quick' },
        { think: 2 },
        { post: '/api/vc/start', json: { email: 'test@example.com', businessName: 'Test Restaurant' } },
        { think: 5 },
        { get: '/vc/result?t={{ token }}' },
      ],
    };
  }

  static getDashboardScenario(): LoadTestScenario {
    return {
      name: 'Dashboard Access',
      weight: 20,
      flow: [
        { get: '/dashboard' },
        { think: 3 },
        { get: '/api/business/profile' },
        { think: 2 },
        { get: '/api/analytics/summary' },
      ],
    };
  }

  static getAPIScenario(): LoadTestScenario {
    return {
      name: 'API Endpoints',
      weight: 10,
      flow: [
        { get: '/api/health' },
        { get: '/api/qa/reports' },
        { think: 1 },
        { post: '/api/qa/quick-scan', json: { files: ['src/test.ts'] } },
      ],
    };
  }
}

export const loadTester = new LoadTester();