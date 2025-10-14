/**
 * QA Test Page
 * Demonstrates the Quality Assurance system
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import QADashboard from '@/components/quality-assurance/QADashboard';
import useQualityAssurance from '@/hooks/useQualityAssurance';
import type { QAConfig } from '@/lib/quality-assurance';

const QATestPage: React.FC = () => {
  const [files, setFiles] = useState<string[]>(['src/components/ui/button.tsx', 'src/hooks/useAuth.ts']);
  const [urls, setUrls] = useState<string[]>(['http://localhost:5173', 'http://localhost:5173/dashboard']);
  const [newFile, setNewFile] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const qaConfig: QAConfig = {
    aiCodeReview: { enabled: true },
    security: { 
      enabled: true,
      policy: {
        allowedSeverities: ['low', 'medium'],
        maxVulnerabilities: { critical: 0, high: 0, medium: 5, low: 10 },
        failOnNewVulnerabilities: true,
      }
    },
    accessibility: { 
      enabled: true,
      config: {
        wcagLevel: 'AA',
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        allowedViolations: { critical: 0, serious: 0, moderate: 2, minor: 5 },
      }
    },
    qualityGates: { 
      enabled: true,
      config: {
        thresholds: {
          coverage: 80,
          duplicatedLines: 3,
          maintainabilityRating: 'B',
          reliabilityRating: 'A',
          securityRating: 'A',
          codeSmells: 50,
          bugs: 0,
          vulnerabilities: 0,
        },
        enabledChecks: ['coverage', 'duplicatedLines', 'maintainability', 'reliability', 'security'],
      }
    },
  };

  const {
    isRunning,
    results,
    error,
    hasResults,
    qualityMetrics,
    runFullAnalysis,
    runQuickScan,
    runSecurityScan,
    runAccessibilityTest,
    runCodeReview,
    clearResults,
    downloadReport,
  } = useQualityAssurance({
    files,
    urls,
    config: qaConfig,
  });

  const addFile = () => {
    if (newFile.trim() && !files.includes(newFile.trim())) {
      setFiles([...files, newFile.trim()]);
      setNewFile('');
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    if (newUrl.trim() && !urls.includes(newUrl.trim())) {
      setUrls([...urls, newUrl.trim()]);
      setNewUrl('');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Quality Assurance System</h1>
        <p className="text-muted-foreground">
          Automated code review, security scanning, accessibility testing, and quality gates
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">QA Dashboard</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="individual">Individual Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <QADashboard
            files={files}
            urls={urls}
            config={qaConfig}
            onResultsChange={(newResults) => {
              console.log('QA Results updated:', newResults);
            }}
          />
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Files Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Files to Analyze</CardTitle>
                <CardDescription>
                  Specify TypeScript/JavaScript files for code review and security scanning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., src/components/Button.tsx"
                    value={newFile}
                    onChange={(e) => setNewFile(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFile()}
                  />
                  <Button onClick={addFile}>Add</Button>
                </div>
                
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-mono">{file}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* URLs Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>URLs to Test</CardTitle>
                <CardDescription>
                  Specify URLs for accessibility testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., http://localhost:3000"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                  />
                  <Button onClick={addUrl}>Add</Button>
                </div>
                
                <div className="space-y-2">
                  {urls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-mono">{url}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUrl(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QA Configuration Display */}
          <Card>
            <CardHeader>
              <CardTitle>QA Configuration</CardTitle>
              <CardDescription>
                Current quality assurance settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(qaConfig, null, 2)}
                readOnly
                className="font-mono text-sm h-64"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Individual Test Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Individual QA Tests</CardTitle>
                <CardDescription>
                  Run specific QA components independently
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => runQuickScan()}
                    disabled={isRunning || files.length === 0}
                    variant="outline"
                  >
                    Quick Scan
                  </Button>
                  
                  <Button
                    onClick={() => runCodeReview()}
                    disabled={isRunning || files.length === 0}
                    variant="outline"
                  >
                    Code Review
                  </Button>
                  
                  <Button
                    onClick={() => runSecurityScan()}
                    disabled={isRunning}
                    variant="outline"
                  >
                    Security Scan
                  </Button>
                  
                  <Button
                    onClick={() => runAccessibilityTest()}
                    disabled={isRunning || urls.length === 0}
                    variant="outline"
                  >
                    Accessibility Test
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => runFullAnalysis()}
                    disabled={isRunning || (files.length === 0 && urls.length === 0)}
                    className="flex-1"
                  >
                    {isRunning ? 'Running...' : 'Run Full Analysis'}
                  </Button>
                  
                  {hasResults && (
                    <Button
                      onClick={clearResults}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Results Summary</CardTitle>
                <CardDescription>
                  Quick overview of QA analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasResults ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overall Status:</span>
                      <Badge 
                        variant={
                          qualityMetrics.status === 'passed' ? 'default' :
                          qualityMetrics.status === 'warning' ? 'secondary' : 'destructive'
                        }
                      >
                        {qualityMetrics.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Quality Score:</span>
                      <span className="font-bold">{qualityMetrics.score}/100</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Total Issues:</span>
                      <span className="font-bold">{qualityMetrics.totalIssues}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Critical Issues:</span>
                      <span className="font-bold text-red-500">{qualityMetrics.criticalIssues}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => downloadReport('markdown')}
                        variant="outline"
                        size="sm"
                      >
                        Download MD
                      </Button>
                      <Button
                        onClick={() => downloadReport('json')}
                        variant="outline"
                        size="sm"
                      >
                        Download JSON
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No results yet. Run a QA analysis to see results here.
                  </p>
                )}

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Demo Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Demo Instructions</CardTitle>
              <CardDescription>
                How to test the QA system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">1. Code Review Demo</h4>
                  <p className="text-muted-foreground">
                    Add some TypeScript files from your src directory and run a code review. 
                    The AI will analyze code quality, security issues, and provide suggestions.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">2. Security Scan Demo</h4>
                  <p className="text-muted-foreground">
                    Run a security scan to check for vulnerabilities in dependencies and code. 
                    This includes npm audit and static code analysis.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">3. Accessibility Test Demo</h4>
                  <p className="text-muted-foreground">
                    Add URLs of running applications to test accessibility compliance. 
                    Make sure the URLs are accessible from this environment.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">4. Full Analysis Demo</h4>
                  <p className="text-muted-foreground">
                    Run the complete QA pipeline to see all systems working together. 
                    This provides a comprehensive quality assessment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QATestPage;