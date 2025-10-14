import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  RefreshCw,
  Users,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types for DSGVO compliance data
interface ConsentMetrics {
  totalConsents: number;
  activeConsents: number;
  expiredConsents: number;
  withdrawnConsents: number;
  consentsByType: Record<string, number>;
  consentsBySource: Record<string, number>;
  averageConsentDuration: number;
  renewalRate: number;
}

interface ComplianceViolation {
  id: string;
  type: 'missing_consent' | 'expired_consent' | 'unauthorized_access' | 'data_breach' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

interface QuarantineStats {
  totalQuarantined: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  byRiskLevel: Record<string, number>;
  byViolationType: Record<string, number>;
}

interface ComplianceReport {
  reportId: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: {
    totalConsentInteractions: number;
    consentGranted: number;
    consentWithdrawn: number;
    dataAccessEvents: number;
    policyViolations: number;
  };
  consentMetrics: ConsentMetrics;
  violations: ComplianceViolation[];
  recommendations: string[];
}

export const DSGVOComplianceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [consentMetrics, setConsentMetrics] = useState<ConsentMetrics | null>(null);
  const [quarantineStats, setQuarantineStats] = useState<QuarantineStats | null>(null);
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const { toast } = useToast();

  // Load compliance data
  const loadComplianceData = async () => {
    try {
      setRefreshing(true);
      
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      startDate.setDate(startDate.getDate() - days);

      // Fetch data from multiple endpoints
      const [consentResponse, quarantineResponse, violationsResponse, reportResponse] = await Promise.all([
        fetch('/api/dsgvo/consent-metrics', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch('/api/dsgvo/quarantine-stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch(`/api/dsgvo/violations?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch(`/api/dsgvo/compliance-report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ]);

      if (consentResponse.ok) {
        const consentData = await consentResponse.json();
        setConsentMetrics(consentData.metrics);
      }

      if (quarantineResponse.ok) {
        const quarantineData = await quarantineResponse.json();
        setQuarantineStats(quarantineData.statistics);
      }

      if (violationsResponse.ok) {
        const violationsData = await violationsResponse.json();
        setViolations(violationsData.violations || []);
      }

      if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        setComplianceReport(reportData.report);
      }

    } catch (error) {
      console.error('Error loading compliance data:', error);
      toast({
        title: 'Fehler beim Laden der Compliance-Daten',
        description: 'Die DSGVO-Compliance-Daten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate compliance report
  const generateReport = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90); // 90-day report

      const response = await fetch('/api/dsgvo/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          format: 'pdf'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DSGVO-Compliance-Report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Compliance-Report generiert',
          description: 'Der DSGVO-Compliance-Report wurde erfolgreich heruntergeladen.'
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Fehler beim Generieren des Reports',
        description: 'Der Compliance-Report konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate compliance score
  const calculateComplianceScore = (): number => {
    if (!consentMetrics || !quarantineStats) return 0;

    let score = 100;
    
    // Deduct points for expired consents
    if (consentMetrics.expiredConsents > 0) {
      const expiredRatio = consentMetrics.expiredConsents / consentMetrics.totalConsents;
      score -= expiredRatio * 30;
    }

    // Deduct points for critical violations
    const criticalViolations = violations.filter(v => v.severity === 'critical' && !v.resolved);
    score -= criticalViolations.length * 20;

    // Deduct points for high-risk quarantined files
    const criticalQuarantine = quarantineStats.byRiskLevel.critical || 0;
    score -= criticalQuarantine * 5;

    return Math.max(0, Math.round(score));
  };

  // Get compliance status
  const getComplianceStatus = (score: number): { status: string; color: string; icon: React.ReactNode } => {
    if (score >= 90) {
      return { status: 'Excellent', color: 'text-green-600', icon: <CheckCircle className="h-5 w-5" /> };
    } else if (score >= 75) {
      return { status: 'Good', color: 'text-blue-600', icon: <Shield className="h-5 w-5" /> };
    } else if (score >= 60) {
      return { status: 'Needs Attention', color: 'text-yellow-600', icon: <AlertTriangle className="h-5 w-5" /> };
    } else {
      return { status: 'Critical', color: 'text-red-600', icon: <XCircle className="h-5 w-5" /> };
    }
  };

  useEffect(() => {
    loadComplianceData();
  }, [selectedPeriod]);

  if (loading && !consentMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Lade DSGVO-Compliance-Daten...</span>
      </div>
    );
  }

  const complianceScore = calculateComplianceScore();
  const complianceStatus = getComplianceStatus(complianceScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DSGVO Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Überwachung und Verwaltung der DSGVO-Compliance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={loadComplianceData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Button onClick={generateReport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Report generieren
          </Button>
        </div>
      </div>

      {/* Compliance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Compliance-Score
          </CardTitle>
          <CardDescription>
            Gesamtbewertung der DSGVO-Compliance basierend auf aktuellen Metriken
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {complianceStatus.icon}
              <span className={`text-2xl font-bold ${complianceStatus.color}`}>
                {complianceScore}%
              </span>
              <Badge variant={complianceScore >= 75 ? 'default' : 'destructive'}>
                {complianceStatus.status}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Letztes Update</p>
              <p className="text-sm font-medium">
                {new Date().toLocaleString('de-DE')}
              </p>
            </div>
          </div>
          <Progress value={complianceScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Period Selection */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Zeitraum:</span>
        <div className="flex space-x-1">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === '7d' ? '7 Tage' : period === '30d' ? '30 Tage' : '90 Tage'}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="consents">Einverständnisse</TabsTrigger>
          <TabsTrigger value="violations">Verstöße</TabsTrigger>
          <TabsTrigger value="quarantine">Quarantäne</TabsTrigger>
          <TabsTrigger value="reports">Berichte</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Einverständnisse</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consentMetrics?.activeConsents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  von {consentMetrics?.totalConsents || 0} gesamt
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abgelaufene Einverständnisse</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {consentMetrics?.expiredConsents || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Erneuerung erforderlich
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offene Verstöße</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {violations.filter(v => !v.resolved).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sofortige Aufmerksamkeit erforderlich
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quarantäne-Dateien</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quarantineStats?.pendingReview || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Warten auf Überprüfung
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          {violations.some(v => v.severity === 'critical' && !v.resolved) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Kritische Compliance-Verstöße erkannt!</AlertTitle>
              <AlertDescription>
                Es wurden {violations.filter(v => v.severity === 'critical' && !v.resolved).length} kritische 
                Verstöße identifiziert, die sofortige Aufmerksamkeit erfordern.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Consents Tab */}
        <TabsContent value="consents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Einverständnisse nach Typ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {consentMetrics && Object.entries(consentMetrics.consentsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Einverständnisse nach Quelle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {consentMetrics && Object.entries(consentMetrics.consentsBySource).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{source}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Erneuerungsrate</CardTitle>
              <CardDescription>
                Prozentsatz der Einverständnisse, die erfolgreich erneuert wurden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Progress value={consentMetrics?.renewalRate || 0} className="h-3" />
                </div>
                <span className="text-2xl font-bold">
                  {Math.round(consentMetrics?.renewalRate || 0)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <div className="space-y-4">
            {violations.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-muted-foreground">Keine Verstöße im ausgewählten Zeitraum</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              violations.map((violation) => (
                <Card key={violation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        {violation.severity === 'critical' && <XCircle className="h-5 w-5 text-red-600 mr-2" />}
                        {violation.severity === 'high' && <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />}
                        {violation.severity === 'medium' && <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />}
                        {violation.severity === 'low' && <Eye className="h-5 w-5 text-blue-600 mr-2" />}
                        {violation.type.replace('_', ' ').toUpperCase()}
                      </CardTitle>
                      <Badge variant={violation.resolved ? 'default' : 'destructive'}>
                        {violation.resolved ? 'Behoben' : 'Offen'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(violation.timestamp).toLocaleString('de-DE')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{violation.description}</p>
                    {violation.resolution && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>Lösung:</strong> {violation.resolution}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Quarantine Tab */}
        <TabsContent value="quarantine" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quarantäne nach Risikostufe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quarantineStats && Object.entries(quarantineStats.byRiskLevel).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{level}</span>
                      <Badge 
                        variant={level === 'critical' ? 'destructive' : level === 'high' ? 'secondary' : 'outline'}
                      >
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quarantäne nach Verstoßtyp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quarantineStats && Object.entries(quarantineStats.byViolationType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm">{type.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance-Berichte</CardTitle>
              <CardDescription>
                Generieren und herunterladen von DSGVO-Compliance-Berichten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={generateReport} disabled={loading} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Vollständigen Compliance-Report generieren
                </Button>
                
                {complianceReport && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Letzter Report</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Generiert am:</p>
                        <p>{new Date(complianceReport.generatedAt).toLocaleString('de-DE')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Zeitraum:</p>
                        <p>
                          {new Date(complianceReport.period.start).toLocaleDateString('de-DE')} - {' '}
                          {new Date(complianceReport.period.end).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Empfehlungen:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {complianceReport.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};