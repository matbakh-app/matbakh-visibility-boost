/**
 * Quality Assurance Dashboard Component
 * Provides UI for running and viewing QA analysis results
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Code, 
  Accessibility, 
  BarChart3, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import type { QAResult, QAConfig } from '@/lib/quality-assurance';

interface QADashboardProps {
  files?: string[];
  urls?: string[];
  config?: QAConfig;
  onResultsChange?: (results: QAResult) => void;
}

export const QADashboard: React.FC<QADashboardProps> = ({
  files = [],
  urls = [],
  config,
  onResultsChange,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<QAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  // Check QA API availability on mount
  React.useEffect(() => {
    const checkApiStatus = async () => {
      const qaApiUrl = import.meta.env.VITE_QA_API_URL;
      if (!qaApiUrl) {
        setApiStatus('unavailable');
        return;
      }

      try {
        const response = await fetch(`${qaApiUrl}/health`);
        if (response.ok) {
          setApiStatus('available');
        } else {
          setApiStatus('unavailable');
        }
      } catch (error) {
        setApiStatus('unavailable');
      }
    };

    checkApiStatus();
  }, []);

  const runQAAnalysis = useCallback(async () => {
    if (files.length === 0 && urls.length === 0) {
      setError('Please provide files or URLs to analyze');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const qaApiUrl = import.meta.env.VITE_QA_API_URL;
      if (!qaApiUrl) throw new Error('QA API URL not configured. Set VITE_QA_API_URL.');

      const resp = await fetch(`${qaApiUrl}/api/qa/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, urls, config }),
      });
      if (!resp.ok) throw new Error(`QA API error: ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || 'QA analysis failed');
      setResults(data.result as QAResult);
      onResultsChange?.(data.result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'QA analysis failed';
      setError(errorMessage);
    } finally {
      setIsRunning(false);
    }
  }, [files, urls, config, onResultsChange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadReport = (format: 'markdown' | 'json') => {
    if (!results) return;

    const content = format === 'markdown' ? results.reports.markdown : results.reports.json;
    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quality Assurance Dashboard</h2>
          <p className="text-muted-foreground">
            Automated code review, security scanning, accessibility testing, and quality gates
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runQAAnalysis} 
            disabled={isRunning || (files.length === 0 && urls.length === 0) || apiStatus !== 'available'}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running Analysis...' : 'Run QA Analysis'}
          </Button>
          {results && (
            <>
              <Button 
                variant="outline" 
                onClick={() => downloadReport('markdown')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download MD
              </Button>
              <Button 
                variant="outline" 
                onClick={() => downloadReport('json')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download JSON
              </Button>
            </>
          )}
        </div>
      </div>

      {/* API Status Alert */}
      {apiStatus === 'unavailable' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            QA API is not available. Please start the QA server with `npm run qa:server` or set VITE_QA_API_URL environment variable.
          </AlertDescription>
        </Alert>
      )}

      {apiStatus === 'checking' && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>Checking QA API availability...</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Status */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Running Quality Assurance Analysis</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing {files.length} files and {urls.length} URLs...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Overview */}
      {results && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {getStatusIcon(results.overallStatus)}
                  <div>
                    <p className="text-2xl font-bold">{results.overallScore}</p>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{results.summary.totalIssues}</p>
                    <p className="text-sm text-muted-foreground">Total Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{results.summary.criticalIssues}</p>
                    <p className="text-sm text-muted-foreground">Critical Issues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(results.overallStatus)}>
                    {results.overallStatus.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Overall Status</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {results.results.codeReview && (
                <TabsTrigger value="code-review" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Code Review
                </TabsTrigger>
              )}
              {results.results.security && (
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
              )}
              {results.results.accessibility && (
                <TabsTrigger value="accessibility" className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4" />
                  Accessibility
                </TabsTrigger>
              )}
              {results.results.qualityGates && (
                <TabsTrigger value="quality" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Quality Gates
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                  <CardDescription>
                    Generated on {new Date(results.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Quality Score</span>
                        <span>{results.overallScore}/100</span>
                      </div>
                      <Progress value={results.overallScore} className="h-2" />
                    </div>

                    {results.summary.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Key Recommendations</h4>
                        <ul className="space-y-1">
                          {results.summary.recommendations.slice(0, 5).map((rec, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {results.results.codeReview && (
              <TabsContent value="code-review" className="space-y-4">
                <div className="grid gap-4">
                  {results.results.codeReview.map((review, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{review.filePath}</CardTitle>
                        <CardDescription>
                          Score: {review.overallScore}/100 • {review.suggestions.length} suggestions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-500">{review.summary.criticalIssues}</p>
                            <p className="text-sm text-muted-foreground">Critical</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-500">{review.summary.securityIssues}</p>
                            <p className="text-sm text-muted-foreground">Security</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-500">{review.summary.performanceIssues}</p>
                            <p className="text-sm text-muted-foreground">Performance</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{review.summary.totalIssues}</p>
                            <p className="text-sm text-muted-foreground">Total</p>
                          </div>
                        </div>
                        
                        {review.suggestions.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium">Top Suggestions</h5>
                            {review.suggestions.slice(0, 3).map((suggestion, suggestionIndex) => (
                              <div key={suggestionIndex} className="border-l-4 border-blue-500 pl-4 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={suggestion.severity === 'error' ? 'destructive' : 'secondary'}>
                                    {suggestion.severity}
                                  </Badge>
                                  <Badge variant="outline">{suggestion.category}</Badge>
                                  <span className="text-sm text-muted-foreground">Line {suggestion.line}</span>
                                </div>
                                <p className="text-sm font-medium">{suggestion.message}</p>
                                {suggestion.suggestion && (
                                  <p className="text-sm text-muted-foreground mt-1">{suggestion.suggestion}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}

            {results.results.security && (
              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Scan Results
                    </CardTitle>
                    <CardDescription>
                      {results.results.security.totalVulnerabilities} vulnerabilities found
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">{results.results.security.summary.critical}</p>
                        <p className="text-sm text-muted-foreground">Critical</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">{results.results.security.summary.high}</p>
                        <p className="text-sm text-muted-foreground">High</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-500">{results.results.security.summary.medium}</p>
                        <p className="text-sm text-muted-foreground">Medium</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{results.results.security.summary.low}</p>
                        <p className="text-sm text-muted-foreground">Low</p>
                      </div>
                    </div>

                    {results.results.security.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Security Recommendations</h5>
                        <ul className="space-y-1">
                          {results.results.security.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-red-500 mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {results.results.accessibility && (
              <TabsContent value="accessibility" className="space-y-4">
                <div className="grid gap-4">
                  {results.results.accessibility.map((test, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Accessibility className="h-5 w-5" />
                          {test.url}
                        </CardTitle>
                        <CardDescription>
                          WCAG {test.wcagLevel} • Score: {test.score}/100
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-500">{test.summary.critical}</p>
                            <p className="text-sm text-muted-foreground">Critical</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-500">{test.summary.serious}</p>
                            <p className="text-sm text-muted-foreground">Serious</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-500">{test.summary.moderate}</p>
                            <p className="text-sm text-muted-foreground">Moderate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-500">{test.passes}</p>
                            <p className="text-sm text-muted-foreground">Passes</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Accessibility Score</span>
                            <span>{test.score}/100</span>
                          </div>
                          <Progress value={test.score} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}

            {results.results.qualityGates && (
              <TabsContent value="quality" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Quality Gates
                    </CardTitle>
                    <CardDescription>
                      Overall Status: {results.results.qualityGates.overallStatus}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Quality Score</span>
                          <span>{results.results.qualityGates.qualityScore}/100</span>
                        </div>
                        <Progress value={results.results.qualityGates.qualityScore} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{results.results.qualityGates.coverage.lines}%</p>
                          <p className="text-sm text-muted-foreground">Line Coverage</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{results.results.qualityGates.bugs}</p>
                          <p className="text-sm text-muted-foreground">Bugs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{results.results.qualityGates.codeSmells}</p>
                          <p className="text-sm text-muted-foreground">Code Smells</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{results.results.qualityGates.technicalDebt}</p>
                          <p className="text-sm text-muted-foreground">Tech Debt</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <Badge className={`text-lg px-3 py-1 ${results.results.qualityGates.maintainabilityRating === 'A' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {results.results.qualityGates.maintainabilityRating}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">Maintainability</p>
                        </div>
                        <div className="text-center">
                          <Badge className={`text-lg px-3 py-1 ${results.results.qualityGates.reliabilityRating === 'A' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {results.results.qualityGates.reliabilityRating}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">Reliability</p>
                        </div>
                        <div className="text-center">
                          <Badge className={`text-lg px-3 py-1 ${results.results.qualityGates.securityRating === 'A' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {results.results.qualityGates.securityRating}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">Security</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default QADashboard;