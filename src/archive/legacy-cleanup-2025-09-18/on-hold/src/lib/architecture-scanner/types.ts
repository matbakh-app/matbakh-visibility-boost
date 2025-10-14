/**
 * Architecture Scanner Types
 * Defines interfaces for system architecture analysis and cleanup
 */

export type ComponentOrigin = 'lovable' | 'supabase' | 'kiro' | 'unknown';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ComponentInfo {
  path: string;
  origin: ComponentOrigin;
  isActive: boolean;
  isTested: boolean;
  hasKiroAlternative: boolean;
  kiroAlternative?: string;
  dependencies: string[];
  riskLevel: RiskLevel;
  recommendedAction: 'keep' | 'replace_with_kiro' | 'archive' | 'delete';
  lastModified: Date;
  fileSize: number;
  imports: string[];
  exports: string[];
}

export interface ComponentMap {
  [path: string]: ComponentInfo;
}

export interface ArchitectureMap {
  scanTimestamp: string;
  totalComponents: number;
  componentsByOrigin: Record<ComponentOrigin, number>;
  components: ComponentMap;
  cleanupPriority: CleanupPriorityItem[];
  testCoverage: TestCoverageInfo;
}

export interface CleanupPriorityItem {
  component: string;
  priority: number;
  reason: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface TestCoverageInfo {
  totalFiles: number;
  testedFiles: number;
  coveragePercentage: number;
  uncoveredComponents: string[];
}

export interface UsageAnalysis {
  isImported: boolean;
  importedBy: string[];
  exportsUsed: string[];
  unusedExports: string[];
  circularDependencies: string[];
}

export interface OriginMarker {
  type: 'comment' | 'import' | 'pattern' | 'filename';
  pattern: string | RegExp;
  origin: ComponentOrigin;
  confidence: number; // 0-1
}

export interface ScanOptions {
  directories: string[];
  excludePatterns: string[];
  includePatterns: string[];
  followSymlinks: boolean;
  maxDepth: number;
}