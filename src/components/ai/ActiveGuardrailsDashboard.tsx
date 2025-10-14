/**
 * Active Guardrails Dashboard Component
 * 
 * Provides real-time monitoring and management of AI safety guardrails
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Eye,
    Settings,
    Shield,
    TrendingUp,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface GuardrailsStatus {
  config: {
    enablePIIDetection: boolean;
    enableToxicityDetection: boolean;
    enablePromptInjection: boolean;
    enableBedrockGuardrails: boolean;
    strictMode: boolean;
    logViolations: boolean;
    blockOnViolation: boolean;
    redactionMode: 'MASK' | 'REMOVE' | 'REPLACE';
  };
  bedrockViolations: {
    totalViolations: number;
    violationsByType: Map<string, number>;
    recentViolations: any[];
    topViolatedDomains: Array<{ domain: string; count: number }>;
  };
  systemHealth: 'healthy' | 'degraded' | 'error';
}

interface GuardrailsMetrics {
  totalRequests: number;
  blockedRequests: number;
  piiDetections: number;
  toxicityDetections: number;
  promptInjections: number;
  averageProcessingTime: number;
  successRate: number;
}

export const ActiveGuardrailsDashboard: React.FC = () => {
  const [status, setStatus] = useState<GuardrailsStatus | null>(null);
  const [metrics, setMetrics] = useState<GuardrailsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration - in real implementation, this would come from API
  useEffect(() => {
    const fetchGuardrailsData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockStatus: GuardrailsStatus = {
          config: {
            enablePIIDetection: true,
            enableToxicityDetection: true,
            enablePromptInjection: true,
            enableBedrockGuardrails: true,
            strictMode: false,
            logViolations: true,
            blockOnViolation: true,
            redactionMode: 'MASK'
          },
          bedrockViolations: {
            totalViolations: 12,
            violationsByType: new Map([
              ['bedrock_user_task', 8],
              ['bedrock_audience_task', 4]
            ]),
            recentViolations: [],
            topViolatedDomains: [
              { domain: 'culinary', count: 6 },
              { domain: 'marketing', count: 4 },
              { domain: 'general', count: 2 }
            ]
          },
          systemHealth: 'healthy'
        };

        const mockMetrics: GuardrailsMetrics = {
          totalRequests: 1247,
          blockedRequests: 23,
          piiDetections: 15,
          toxicityDetections: 8,
          promptInjections: 3,
          averageProcessingTime: 45,
          successRate: 98.2
        };

        setStatus(mockStatus);
        setMetrics(mockMetrics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guardrails data');
      } finally {
        setLoading(false);
      }
    };

    fetchGuardrailsData();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchGuardrailsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConfigChange = async (key: string, value: boolean) => {
    if (!status) return;
    
    try {
      // In real implementation, this would call the API
      console.log(`Updating ${key} to ${value}`);
      
      setStatus({
        ...status,
        config: {
          ...status.config,
          [key]: value
        }
      });
    } catch (err) {
      setError(`Failed to update ${key}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Degraded</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading guardrails status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!status || !metrics) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No guardrails data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Active Guardrails Dashboard</h1>
        </div>
        {getHealthBadge(status.systemHealth)}
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.blockedRequests}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.blockedRequests / metrics.totalRequests) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">Processing success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageProcessingTime}ms</div>
            <p className="text-xs text-muted-foreground">Per request</p>
          </CardContent>
        </Card>
      </div>

      {/* Detection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Eye className="h-5 w-5 mr-2 text-blue-500" />
              PII Detections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{metrics.piiDetections}</div>
            <p className="text-sm text-muted-foreground">Personal information blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Toxicity Detections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{metrics.toxicityDetections}</div>
            <p className="text-sm text-muted-foreground">Toxic content blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Shield className="h-5 w-5 mr-2 text-red-500" />
              Prompt Injections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{metrics.promptInjections}</div>
            <p className="text-sm text-muted-foreground">Injection attempts blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Guardrails Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">PII Detection</label>
              <Switch
                checked={status.config.enablePIIDetection}
                onCheckedChange={(checked) => handleConfigChange('enablePIIDetection', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Toxicity Detection</label>
              <Switch
                checked={status.config.enableToxicityDetection}
                onCheckedChange={(checked) => handleConfigChange('enableToxicityDetection', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Prompt Injection Detection</label>
              <Switch
                checked={status.config.enablePromptInjection}
                onCheckedChange={(checked) => handleConfigChange('enablePromptInjection', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Bedrock Guardrails</label>
              <Switch
                checked={status.config.enableBedrockGuardrails}
                onCheckedChange={(checked) => handleConfigChange('enableBedrockGuardrails', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Strict Mode</label>
              <Switch
                checked={status.config.strictMode}
                onCheckedChange={(checked) => handleConfigChange('strictMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Block on Violation</label>
              <Switch
                checked={status.config.blockOnViolation}
                onCheckedChange={(checked) => handleConfigChange('blockOnViolation', checked)}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Redaction Mode:</span>
              <Badge variant="outline">{status.config.redactionMode}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bedrock Violations Summary */}
      {status.bedrockViolations.totalViolations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Bedrock Architectural Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-2xl font-bold text-orange-600">
                {status.bedrockViolations.totalViolations} violations (24h)
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Top Violated Domains:</h4>
                {status.bedrockViolations.topViolatedDomains.map((domain, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{domain.domain}</span>
                    <Badge variant="outline">{domain.count} violations</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={() => window.location.reload()}>
          Refresh Data
        </Button>
        <Button variant="outline">
          Export Logs
        </Button>
        <Button variant="outline">
          View Detailed Reports
        </Button>
      </div>
    </div>
  );
};