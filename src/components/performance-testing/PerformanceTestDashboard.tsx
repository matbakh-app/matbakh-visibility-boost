/**
 * Performance Test Dashboard Component
 * Interactive dashboard for running and viewing performance tests
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import usePerformanceTesting from '@/hooks/usePerformanceTesting';

interface PerformanceTestDashboardProps {
  defaultTarget?: string;
  onResultsChange?: (results: any) => void;
}

export default function PerformanceTestDashboard({ 
  defaultTarget = 'http://localhost:3000',
  onResultsChange 
}: PerformanceTestDashboardProps) {
  const {
    isRunning,
    results,
    loadTestResults,
    regressionResults,
    benchmarkResults,
    error,
    runTestSuite,
    runLoadTest,
    runStressTest,
    runSpikeTest,
    analyzeRegressions,
    compareBenchmarks,
    clearResults,
    clearError,
    getStandardSuite,
  } = usePerformanceTesting();

  const [target, setTarget] = useState(defaultTarget);
  const [testType, setTestType] = useState<'suite' | 'load' | 'stress' | 'spike'>('suite');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('staging');

  const handleRunTest = async () => {
    clearError();
    
    if (!target) {
      return;
    }

    let result = null;

    try {
      switch (testType) {
        case 'suite':
          const suite = getStandardSuite(target);
          suite.config.environment = environment;
          result = await runTestSuite(suite);
          break;
        case 'load':
          result = await runLoadTest({
            target,
            phases: [
              { duration: 60, arrivalRate: 5, name: 'ramp-up' },
              { duration: 120, arrivalRate: 10, name: 'steady' },
              { duration: 60, arrivalRate: 5, name: 'ramp-down' },
            ],
            scenarios: [],
          });
          break;
        case 'stress':
          result = await runStressTest({
            target,
            phases: [],
            scenarios: [],
          });
          break;
        case 'spike':
          result = await runSpikeTest({
            target,
            phases: [],
            scenarios: [],
          });
          break;
      }

      if (result && onResultsChange) {
        onResultsChange(result);
      }
    } catch (err) {
      console.error('Test execution failed:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Testing Dashboard
          </CardTitle>
          <CardDescription>
            Run comprehensive performance tests and analyze results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target URL</Label>
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="http://localhost:3000"
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="testType">Test Type</Label>
              <Select value={testType} onValueChange={(value: any) => setTestType(value)} disabled={isRunning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suite">Full Test Suite</SelectItem>
                  <SelectItem value="load">Load Test</SelectItem>
                  <SelectItem value="stress">Stress Test</SelectItem>
                  <SelectItem value="spike">Spike Test</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select value={environment} onValueChange={(value: any) => setEnvironment(value)} disabled={isRunning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleRunTest} 
              disabled={isRunning || !target}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isRunning ? 'Running Test...' : 'Run Performance Test'}
            </Button>
            
            {(results || loadTestResults || error) && (
              <Button variant="outline" onClick={clearResults}>
                Clear Results
              </Button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {(results || loadTestResults) && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="regression">Regression Analysis</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {results && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Overall Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(results.overallStatus)}
                          <Badge className={getStatusColor(results.overallStatus)}>
                            {results.overallStatus.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Performance Score</p>
                        <p className="text-2xl font-bold">{results.summary.performanceScore}/100</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Progress value={results.summary.performanceScore} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tests Passed</p>
                      <p className="text-2xl font-bold">
                        {results.summary.passedTests}/{results.summary.totalTests}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round((results.summary.passedTests / results.summary.totalTests) * 100)}% success rate
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                      <p className="text-2xl font-bold">{results.summary.averageResponseTime.toFixed(0)}ms</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {results.summary.totalThroughput.toFixed(1)} req/s throughput
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {loadTestResults && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{loadTestResults.totalRequests.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Requests/Second</p>
                      <p className="text-2xl font-bold">{loadTestResults.requestsPerSecond.toFixed(1)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                      <p className="text-2xl font-bold">{loadTestResults.averageResponseTime.toFixed(0)}ms</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                      <p className="text-2xl font-bold">{loadTestResults.errorRate.toFixed(1)}%</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            {results?.testResults.map((test, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{test.testName}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <Badge className={getStatusColor(test.status)}>
                        {test.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>Type: {test.type} | Duration: {test.duration}ms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                      <p className="text-lg font-semibold">{test.metrics.responseTime.toFixed(2)}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Throughput</p>
                      <p className="text-lg font-semibold">{test.metrics.throughput.toFixed(2)} req/s</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                      <p className="text-lg font-semibold">{test.metrics.errorRate.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Concurrency</p>
                      <p className="text-lg font-semibold">{test.metrics.concurrency}</p>
                    </div>
                  </div>
                  {test.error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{test.error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="regression" className="space-y-4">
            {regressionResults ? (
              <Card>
                <CardHeader>
                  <CardTitle>Regression Analysis</CardTitle>
                  <CardDescription>
                    Comparison with historical performance data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant={regressionResults.hasRegression ? "destructive" : "default"}>
                        {regressionResults.hasRegression ? "Regressions Found" : "No Regressions"}
                      </Badge>
                      <Badge variant="outline">
                        Severity: {regressionResults.severity}
                      </Badge>
                    </div>
                    
                    {regressionResults.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {regressionResults.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No regression analysis available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="benchmarks" className="space-y-4">
            {benchmarkResults ? (
              <Card>
                <CardHeader>
                  <CardTitle>Benchmark Comparison</CardTitle>
                  <CardDescription>
                    Comparison with industry benchmarks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        Ranking: {benchmarkResults.overallRanking.overall}
                      </Badge>
                      <Badge variant="outline">
                        {benchmarkResults.overallRanking.percentile}th Percentile
                      </Badge>
                    </div>
                    
                    {benchmarkResults.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {benchmarkResults.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No benchmark comparison available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}