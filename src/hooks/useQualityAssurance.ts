/**
 * Quality Assurance Hook
 * Provides React integration for QA automation systems
 */

import { useState, useCallback, useEffect } from 'react';
import type { 
  QAResult, 
  QAConfig,
  SecurityScanResult,
  AccessibilityTestResult,
  CodeReviewResult
} from '@/lib/quality-assurance';

export interface UseQualityAssuranceOptions {
  autoRun?: boolean;
  files?: string[];
  urls?: string[];
  config?: QAConfig;
}

export interface QualityAssuranceState {
  isRunning: boolean;
  results: QAResult | null;
  error: string | null;
  lastRun: Date | null;
}

const getApiUrl = () => {
  // Handle both Vite (import.meta.env) and Node.js (process.env) environments
  try {
    // In browser/Vite environment
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
      return (window as any).import.meta.env.VITE_QA_API_URL;
    }
    // Try to access import.meta if available (Vite)
    if (typeof globalThis !== 'undefined' && (globalThis as any).import?.meta?.env) {
      return (globalThis as any).import.meta.env.VITE_QA_API_URL;
    }
  } catch (error) {
    // Fallback to process.env in Node.js/test environments
  }
  return process.env.VITE_QA_API_URL;
};

export const useQualityAssurance = (options: UseQualityAssuranceOptions = {}) => {
  const [state, setState] = useState<QualityAssuranceState>({
    isRunning: false,
    results: null,
    error: null,
    lastRun: null,
  });

  const ensureApi = () => {
    const url = getApiUrl();
    if (!url) throw new Error('QA API URL not configured. Please set VITE_QA_API_URL.');
    return url;
  };

  const runFullAnalysis = useCallback(async (
    files?: string[], 
    urls?: string[], 
    config?: QAConfig
  ) => {
    const targetFiles = files ?? options.files ?? [];
    const targetUrls = urls ?? options.urls ?? [];
    const targetConfig = config ?? options.config;

    if (targetFiles.length === 0 && targetUrls.length === 0) {
      setState(p => ({ ...p, error: 'No files or URLs provided for analysis' }));
      return null;
    }

    setState(p => ({ ...p, isRunning: true, error: null }));

    try {
      const api = ensureApi();
      const resp = await fetch(`${api}/api/qa/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: targetFiles, urls: targetUrls, config: targetConfig }),
      });
      if (!resp.ok) throw new Error(`QA API error: ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'QA analysis failed');

      const results = data.result as QAResult;
      setState(p => ({ ...p, isRunning: false, results, lastRun: new Date() }));
      return results;
    } catch (e) {
      setState(p => ({ ...p, isRunning: false, error: e instanceof Error ? e.message : 'QA analysis failed' }));
      return null;
    }
  }, [options.files, options.urls, options.config]);

  const runQuickScan = useCallback(async (files?: string[]) => {
    const targetFiles = files ?? options.files ?? [];
    if (targetFiles.length === 0) {
      setState(p => ({ ...p, error: 'No files provided for quick scan' }));
      return null;
    }

    setState(p => ({ ...p, isRunning: true, error: null }));
    try {
      const api = ensureApi();
      const resp = await fetch(`${api}/api/qa/quick-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: targetFiles }),
      });
      if (!resp.ok) throw new Error(`QA API error: ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Quick scan failed');

      const results = data.result as QAResult;
      setState(p => ({ ...p, isRunning: false, results, lastRun: new Date() }));
      return results;
    } catch (e) {
      setState(p => ({ ...p, isRunning: false, error: e instanceof Error ? e.message : 'Quick scan failed' }));
      return null;
    }
  }, [options.files]);

  const runSecurityScan = useCallback(async (files?: string[]): Promise<SecurityScanResult | null> => {
    const targetFiles = files ?? options.files ?? [];

    setState(p => ({ ...p, isRunning: true, error: null }));
    try {
      const api = ensureApi();
      const resp = await fetch(`${api}/api/qa/security-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: targetFiles }),
      });
      if (!resp.ok) throw new Error(`QA API error: ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Security scan failed');

      setState(p => ({ ...p, isRunning: false, lastRun: new Date() }));
      return data.result as SecurityScanResult;
    } catch (e) {
      setState(p => ({ ...p, isRunning: false, error: e instanceof Error ? e.message : 'Security scan failed' }));
      return null;
    }
  }, [options.files]);

  const runAccessibilityTest = useCallback(async (urls?: string[]): Promise<AccessibilityTestResult[] | null> => {
    const targetUrls = urls ?? options.urls ?? [];
    if (targetUrls.length === 0) {
      setState(p => ({ ...p, error: 'No URLs provided for accessibility test' }));
      return null;
    }

    setState(p => ({ ...p, isRunning: true, error: null }));
    try {
      const api = ensureApi();
      const resp = await fetch(`${api}/api/qa/accessibility-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: targetUrls }),
      });
      if (!resp.ok) throw new Error(`QA API error: ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Accessibility test failed');

      setState(p => ({ ...p, isRunning: false, lastRun: new Date() }));
      return data.result as AccessibilityTestResult[];
    } catch (e) {
      setState(p => ({ ...p, isRunning: false, error: e instanceof Error ? e.message : 'Accessibility test failed' }));
      return null;
    }
  }, [options.urls]);

  const runCodeReview = useCallback(async (files?: string[]): Promise<CodeReviewResult[] | null> => {
    const targetFiles = files ?? options.files ?? [];
    if (targetFiles.length === 0) {
      setState(p => ({ ...p, error: 'No files provided for code review' }));
      return null;
    }

    setState(p => ({ ...p, isRunning: true, error: null }));
    try {
      const api = ensureApi();
      const resp = await fetch(`${api}/api/qa/code-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: targetFiles }),
      });
      if (!resp.ok) throw new Error(`QA API error: ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'Code review failed');

      setState(p => ({ ...p, isRunning: false, lastRun: new Date() }));
      return data.result as CodeReviewResult[];
    } catch (e) {
      setState(p => ({ ...p, isRunning: false, error: e instanceof Error ? e.message : 'Code review failed' }));
      return null;
    }
  }, [options.files]);

  const clearResults = useCallback(() => {
    setState(p => ({ ...p, results: null, error: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(p => ({ ...p, error: null }));
  }, []);

  useEffect(() => {
    if (options.autoRun && ((options.files?.length ?? 0) > 0 || (options.urls?.length ?? 0) > 0)) {
      void runFullAnalysis();
    }
  }, [options.autoRun, runFullAnalysis]);

  // Computed
  const hasResults = state.results !== null;
  const hasError = state.error !== null;
  const overallScore = state.results?.overallScore ?? 0;
  const overallStatus = state.results?.overallStatus ?? 'unknown';
  const totalIssues = state.results?.summary.totalIssues ?? 0;
  const criticalIssues = state.results?.summary.criticalIssues ?? 0;

  const qualityMetrics = {
    score: overallScore,
    status: overallStatus,
    totalIssues,
    criticalIssues,
    passed: overallStatus === 'passed',
    hasWarnings: overallStatus === 'warning',
    failed: overallStatus === 'failed',
  };

  const downloadReport = useCallback((format: 'markdown' | 'json' = 'markdown') => {
    if (!state.results) return;
    const content = format === 'markdown' ? state.results.reports.markdown : state.results.reports.json;
    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.results]);

  return {
    ...state,
    hasResults,
    hasError,
    qualityMetrics,
    runFullAnalysis,
    runQuickScan,
    runSecurityScan,
    runAccessibilityTest,
    runCodeReview,
    clearResults,
    clearError,
    downloadReport,
  };
};

export default useQualityAssurance;