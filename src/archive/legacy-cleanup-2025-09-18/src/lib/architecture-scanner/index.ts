/**
 * Architecture Scanner Engine - Main Export
 * System architecture analysis and cleanup planning
 */

export { ArchitectureScanner } from './architecture-scanner';
export { FileSystemCrawler } from './file-system-crawler';
export { OriginDetector } from './origin-detector';
export { UsageAnalyzer } from './usage-analyzer';
export { TestCoverageAnalyzer } from './test-coverage-analyzer';
export { TestSelectionEngine, runTestSelection } from './test-selection-engine';
export { LegacyComponentDetector } from './legacy-component-detector';

export type {
  ArchitectureMap,
  ComponentInfo,
  ComponentMap,
  ComponentOrigin,
  RiskLevel,
  UsageAnalysis,
  OriginMarker,
  ScanOptions,
  TestCoverageInfo,
  CleanupPriorityItem
} from './types';

export type {
  TestCoverageMap,
  TestMappingInfo,
  IntegrationTestInfo,
  InterfaceMismatch,
  SafeTestSuite,
  TestExecutionPlan,
  KiroComponentFilter
} from './test-selection-engine';

export type {
  LegacyComponent,
  BackendDependency,
  RouteUsage,
  ArchivalPlan,
  BackupPlan
} from './legacy-component-detector';

// Convenience function for quick architecture scan
export async function scanSystemArchitecture(options?: {
  outputFile?: string;
  includeRoadmap?: boolean;
}) {
  const { ArchitectureScanner } = await import('./architecture-scanner');
  
  console.log('🚀 Starting system architecture scan...');
  
  const architectureMap = await ArchitectureScanner.scanArchitecture();
  
  if (options?.outputFile) {
    await ArchitectureScanner.exportArchitectureMap(architectureMap, options.outputFile);
  }
  
  if (options?.includeRoadmap) {
    const roadmap = ArchitectureScanner.generateCleanupRoadmap(architectureMap);
    console.log('\n📋 Cleanup Roadmap Summary:');
    console.log(`Total Components: ${roadmap.summary.totalComponents}`);
    console.log(`Components to Cleanup: ${roadmap.summary.toCleanup}`);
    console.log(`Estimated Hours: ${roadmap.summary.estimatedHours}`);
    console.log(`Phase 1 (Quick Wins): ${roadmap.phase1.length} items`);
    console.log(`Phase 2 (Medium Effort): ${roadmap.phase2.length} items`);
    console.log(`Phase 3 (High Effort): ${roadmap.phase3.length} items`);
  }
  
  return architectureMap;
}