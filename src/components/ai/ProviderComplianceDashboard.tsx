/**
 * Provider Compliance Dashboard
 *
 * Displays provider agreement compliance status and monitoring
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Clock,
    FileText,
    Shield,
    TrendingUp,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ProviderAgreement {
  providerId: string;
  providerName: string;
  agreementId: string;
  signedDate: string;
  expiryDate: string;
  version: string;
  noTrainingOnCustomerData: boolean;
  dataProcessingAgreement: boolean;
  gdprCompliant: boolean;
  euDataResidency: boolean;
  lastVerified: string;
  verificationStatus: 'verified' | 'pending' | 'expired' | 'violated';
}

interface ComplianceViolation {
  violationId: string;
  providerId: string;
  timestamp: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  overallCompliance: 'compliant' | 'non_compliant' | 'warning';
  complianceScore: number;
  providers: Array<{
    providerId: string;
    compliant: boolean;
    agreementStatus: 'active' | 'expired' | 'missing';
    lastVerified: string;
    violations: number;
  }>;
  violations: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    resolved: number;
    pending: number;
  };
  recommendations: string[];
  nextActions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate: string;
  }>;
}

export const ProviderComplianceDashboard: React.FC = () => {
  const [agreements, setAgreements] = useState<ProviderAgreement[]>([]);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, these would be API calls
      // For now, we'll simulate the data
      const mockAgreements: ProviderAgreement[] = [
        {
          providerId: 'bedrock',
          providerName: 'Amazon Web Services (Bedrock)',
          agreementId: 'AWS-BEDROCK-DPA-2024',
          signedDate: '2024-01-15T00:00:00Z',
          expiryDate: '2025-12-31T23:59:59Z',
          version: '2024.1',
          noTrainingOnCustomerData: true,
          dataProcessingAgreement: true,
          gdprCompliant: true,
          euDataResidency: true,
          lastVerified: '2024-12-01T00:00:00Z',
          verificationStatus: 'verified'
        },
        {
          providerId: 'google',
          providerName: 'Google Cloud AI Platform',
          agreementId: 'GOOGLE-AI-DPA-2024',
          signedDate: '2024-02-01T00:00:00Z',
          expiryDate: '2025-12-31T23:59:59Z',
          version: '2024.1',
          noTrainingOnCustomerData: true,
          dataProcessingAgreement: true,
          gdprCompliant: true,
          euDataResidency: true,
          lastVerified: '2024-12-01T00:00:00Z',
          verificationStatus: 'verified'
        },
        {
          providerId: 'meta',
          providerName: 'Meta AI Platform',
          agreementId: 'META-AI-DPA-2024',
          signedDate: '2024-03-01T00:00:00Z',
          expiryDate: '2025-12-31T23:59:59Z',
          version: '2024.1',
          noTrainingOnCustomerData: true,
          dataProcessingAgreement: true,
          gdprCompliant: true,
          euDataResidency: false,
          lastVerified: '2024-12-01T00:00:00Z',
          verificationStatus: 'verified'
        }
      ];

      const mockReport: ComplianceReport = {
        reportId: 'report-' + Date.now(),
        generatedAt: new Date().toISOString(),
        overallCompliance: 'compliant',
        complianceScore: 100,
        providers: mockAgreements.map(a => ({
          providerId: a.providerId,
          compliant: true,
          agreementStatus: 'active' as const,
          lastVerified: a.lastVerified,
          violations: 0
        })),
        violations: {
          total: 0,
          byType: {},
          bySeverity: {},
          resolved: 0,
          pending: 0
        },
        recommendations: [],
        nextActions: []
      };

      setAgreements(mockAgreements);
      setViolations([]);
      setReport(mockReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'non_compliant':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVerificationStatusBadge = (status: string) => {
    const variants = {
      verified: 'default',
      pending: 'secondary',
      expired: 'destructive',
      violated: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    } as const;

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'secondary'}>
        {severity}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading compliance data: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadComplianceData}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Compliance</h1>
          <p className="text-gray-600">
            Monitor AI provider agreement compliance and "no training" guarantees
          </p>
        </div>
        <Button onClick={loadComplianceData} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getComplianceStatusIcon(report.overallCompliance)}
              Overall Compliance Status
            </CardTitle>
            <CardDescription>
              System-wide compliance with provider agreements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {report.complianceScore}%
                </div>
                <div className="text-sm text-gray-600">Compliance Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {report.providers.filter(p => p.compliant).length}/{report.providers.length}
                </div>
                <div className="text-sm text-gray-600">Compliant Providers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {report.violations.pending}
                </div>
                <div className="text-sm text-gray-600">Open Violations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {report.nextActions.filter(a => a.priority === 'high' || a.priority === 'critical').length}
                </div>
                <div className="text-sm text-gray-600">Urgent Actions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="agreements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agreements">Provider Agreements</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="report">Compliance Report</TabsTrigger>
        </TabsList>

        <TabsContent value="agreements" className="space-y-4">
          <div className="grid gap-4">
            {agreements.map((agreement) => {
              const daysUntilExpiry = getDaysUntilExpiry(agreement.expiryDate);
              const isExpiringSoon = daysUntilExpiry <= 30;
              const isExpired = daysUntilExpiry < 0;

              return (
                <Card key={agreement.providerId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {agreement.providerName}
                      </CardTitle>
                      {getVerificationStatusBadge(agreement.verificationStatus)}
                    </div>
                    <CardDescription>
                      Agreement ID: {agreement.agreementId} • Version: {agreement.version}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Agreement Details</h4>
                        <div className="space-y-1 text-sm">
                          <div>Signed: {formatDate(agreement.signedDate)}</div>
                          <div className={isExpired ? 'text-red-600 font-semibold' : isExpiringSoon ? 'text-yellow-600' : ''}>
                            Expires: {formatDate(agreement.expiryDate)}
                            {isExpiringSoon && !isExpired && ` (${daysUntilExpiry} days)`}
                            {isExpired && ` (expired ${Math.abs(daysUntilExpiry)} days ago)`}
                          </div>
                          <div>Last Verified: {formatDate(agreement.lastVerified)}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Compliance Requirements</h4>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {agreement.noTrainingOnCustomerData ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <XCircle className="h-4 w-4 text-red-500" />
                            }
                            <span className="text-sm">No Training on Customer Data</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {agreement.dataProcessingAgreement ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <XCircle className="h-4 w-4 text-red-500" />
                            }
                            <span className="text-sm">Data Processing Agreement</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {agreement.gdprCompliant ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <XCircle className="h-4 w-4 text-red-500" />
                            }
                            <span className="text-sm">GDPR Compliant</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {agreement.euDataResidency ? 
                              <CheckCircle className="h-4 w-4 text-green-500" /> : 
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            }
                            <span className="text-sm">EU Data Residency</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(isExpired || isExpiringSoon) && (
                      <Alert variant={isExpired ? "destructive" : "default"} className="mt-4">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          {isExpired 
                            ? `Agreement expired ${Math.abs(daysUntilExpiry)} days ago. Immediate renewal required.`
                            : `Agreement expires in ${daysUntilExpiry} days. Renewal recommended.`
                          }
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          {violations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Violations Found</h3>
                <p className="text-gray-600">All providers are currently compliant with their agreements.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {violations.map((violation) => (
                <Card key={violation.violationId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {violation.violationType.replace('_', ' ').toUpperCase()}
                      </CardTitle>
                      <div className="flex gap-2">
                        {getSeverityBadge(violation.severity)}
                        <Badge variant={violation.status === 'resolved' ? 'default' : 'destructive'}>
                          {violation.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      Provider: {violation.providerId} • {formatDate(violation.timestamp)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{violation.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          {report && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Compliance Report
                  </CardTitle>
                  <CardDescription>
                    Generated: {formatDate(report.generatedAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {report.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {report.nextActions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Next Actions</h4>
                        <div className="space-y-2">
                          {report.nextActions.map((action, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm">{action.action}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={action.priority === 'critical' ? 'destructive' : 'default'}>
                                  {action.priority}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Due: {formatDate(action.dueDate)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.recommendations.length === 0 && report.nextActions.length === 0 && (
                      <div className="text-center py-4">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No recommendations or actions required.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};