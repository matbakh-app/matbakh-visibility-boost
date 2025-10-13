#!/usr/bin/env tsx
/**
 * Green Core Reliability Validator
 * Executes Green Core tests 100 times to verify 99.9% pass rate
 */
import { execSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

interface TestRun {
  runNumber: number;
  success: boolean;
  duration: number;
  error?: string;
}

export class GreenCoreReliabilityValidator {
  private results: TestRun[] = [];
  private readonly targetPassRate = 99.9; // 99.9%
  private readonly maxExecutionTime = 5 * 60 * 1000; // 5 minutes in ms

  async validateReliability(iterations: number = 100): Promise<void> {
    console.log(`🔍 Validating Green Core Reliability (${iterations} iterations)...`);
    
    for (let i = 1; i <= iterations; i++) {
      console.log(`   Run ${i}/${iterations}`);
      await this.runGreenCoreTest(i);
      
      // Progress report every 10 runs
      if (i % 10 === 0) {
        this.reportProgress();
      }
    }
    
    await this.generateFinalReport();
  }

  private async runGreenCoreTest(runNumber: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Execute Green Core tests
      execSync('./scripts/run-green-core-tests.sh', {
        stdio: 'pipe',
        timeout: this.maxExecutionTime
      });
      
      const duration = Date.now() - startTime;
      this.results.push({
        runNumber,
        success: true,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        runNumber,
        success: false,
        duration,
        error: error.message
      });
    }
  }

  private reportProgress(): void {
    const successCount = this.results.filter(r => r.success).length;
    const passRate = (successCount / this.results.length) * 100;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    
    console.log(`     Progress: ${successCount}/${this.results.length} passed (${passRate.toFixed(1)}%)`);
    console.log(`     Average duration: ${(avgDuration / 1000).toFixed(1)}s`);
  }

  private async generateFinalReport(): Promise<void> {
    const successCount = this.results.filter(r => r.success).length;
    const passRate = (successCount / this.results.length) * 100;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const maxDuration = Math.max(...this.results.map(r => r.duration));
    const minDuration = Math.min(...this.results.map(r => r.duration));
    
    const report = `# Green Core Reliability Validation Report

## Summary
- **Total Runs:** ${this.results.length}
- **Successful Runs:** ${successCount}
- **Pass Rate:** ${passRate.toFixed(2)}%
- **Target Pass Rate:** ${this.targetPassRate}%
- **Status:** ${passRate >= this.targetPassRate ? '✅ PASSED' : '❌ FAILED'}

## Performance Metrics
- **Average Duration:** ${(avgDuration / 1000).toFixed(2)}s
- **Min Duration:** ${(minDuration / 1000).toFixed(2)}s
- **Max Duration:** ${(maxDuration / 1000).toFixed(2)}s
- **Target Duration:** <300s (5 minutes)
- **Performance Status:** ${maxDuration < this.maxExecutionTime ? '✅ PASSED' : '❌ FAILED'}

## Failed Runs
${this.results.filter(r => !r.success).map(r => 
  `- Run ${r.runNumber}: ${r.error?.substring(0, 100)}...`
).join('\n') || 'None'}

## Recommendations
${this.generateRecommendations(passRate, avgDuration)}

Generated: ${new Date().toISOString()}
`;

    const reportPath = path.join(process.cwd(), 'logs', 'green-core-reliability-report.md');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, report);
    
    console.log(`\n📊 Final Results:`);
    console.log(`   Pass Rate: ${passRate.toFixed(2)}% (Target: ${this.targetPassRate}%)`);
    console.log(`   Average Duration: ${(avgDuration / 1000).toFixed(2)}s`);
    console.log(`   Status: ${passRate >= this.targetPassRate ? '✅ RELIABLE' : '❌ NEEDS IMPROVEMENT'}`);
    console.log(`   Report: ${reportPath}`);
  }

  private generateRecommendations(passRate: number, avgDuration: number): string {
    const recommendations: string[] = [];
    
    if (passRate < this.targetPassRate) {
      recommendations.push('- Investigate and fix failing test cases');
      recommendations.push('- Consider quarantining flaky tests');
      recommendations.push('- Review test environment stability');
    }
    
    if (avgDuration > 180000) { // 3 minutes
      recommendations.push('- Optimize test execution performance');
      recommendations.push('- Consider parallel execution improvements');
      recommendations.push('- Review resource allocation');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('- Green Core tests meet reliability requirements');
      recommendations.push('- Continue monitoring performance trends');
    }
    
    return recommendations.join('\n');
  }
}

// CLI Interface
async function main() {
  const validator = new GreenCoreReliabilityValidator();
  const iterations = parseInt(process.argv[2]) || 100;
  await validator.validateReliability(iterations);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
