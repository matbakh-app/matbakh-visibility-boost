/**
 * Business Metrics Dashboard
 *
 * Comprehensive dashboard for business metrics, conversion tracking, and ROI analysis
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { aiBusinessIntegration, type AIBusinessMetrics, type AIROIAnalysis, type PersonaBusinessProfile } from '@/lib/business-metrics/ai-business-integration';
import { businessMetricsService, type BusinessImpactReport, type ConversionFunnel, type RevenueMetrics } from '@/lib/business-metrics/business-metrics-service';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    DollarSign,
    Target,
    TrendingDown,
    TrendingUp,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface BusinessMetricsDashboardProps {
  className?: string;
}

export function BusinessMetricsDashboard({ className }: BusinessMetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel[]>([]);
  const [aiMetrics, setAIMetrics] = useState<AIBusinessMetrics[]>([]);
  const [personaProfiles, setPersonaProfiles] = useState<PersonaBusinessProfile[]>([]);
  const [roiAnalysis, setROIAnalysis] = useState<AIROIAnalysis | null>(null);
  const [businessImpactReports, setBusinessImpactReports] = useState<BusinessImpactReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinessMetrics();
  }, [timeRange, selectedSegment]);

  const loadBusinessMetrics = async () => {
    setLoading(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Load revenue metrics
      const metrics = businessMetricsService.getRevenueMetrics(
        startDate,
        endDate,
        selectedSegment === 'all' ? undefined : selectedSegment
      );
      setRevenueMetrics(metrics);

      // Load conversion funnel
      const funnel = businessMetricsService.getConversionFunnel(startDate, endDate);
      setConversionFunnel(funnel);

      // Load AI business metrics
      const aiBusinessMetrics = aiBusinessIntegration.getAIBusinessMetrics(startDate, endDate);
      setAIMetrics(aiBusinessMetrics);

      // Load persona profiles
      const profiles = aiBusinessIntegration.getPersonaBusinessProfiles(startDate, endDate);
      setPersonaProfiles(profiles);

      // Load ROI analysis
      const roi = aiBusinessIntegration.generateAIROIAnalysis(startDate, endDate);
      setROIAnalysis(roi);

      // Load business impact reports for active experiments
      const experiments = ['exp-001', 'exp-002', 'exp-003'];
      const reports = experiments
        .map(expId => businessMetricsService.generateBusinessImpactReport(expId, startDate, endDate))
        .filter((report): report is BusinessImpactReport => report !== null);
      setBusinessImpactReports(reports);

    } catch (error) {
      console.error('Failed to load business metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getMetricTrend = (value: number) => {
    if (value > 0) return { icon: TrendingUp, color: 'text-green-600' };
    if (value < 0) return { icon: TrendingDown, color: 'text-red-600' };
    return { icon: Activity, color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Business Metrics</h2>
          <p className="text-muted-foreground">
            Conversion tracking, revenue analysis, and AI ROI insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="premium-restaurants">Premium Restaurants</SelectItem>
              <SelectItem value="small-cafes">Small Cafes</SelectItem>
              <SelectItem value="franchise-chains">Franchise Chains</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {revenueMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueMetrics.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {(() => {
                  const trend = getMetricTrend(revenueMetrics.revenueGrowthRate);
                  const Icon = trend.icon;
                  return (
                    <>
                      <Icon className={`h-3 w-3 mr-1 ${trend.color}`} />
                      {formatPercentage(revenueMetrics.revenueGrowthRate)} from last period
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(revenueMetrics.conversionRate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(revenueMetrics.averageOrderValue)} avg order value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueMetrics.customerLifetimeValue)}</div>
              <p className="text-xs text-muted-foreground">
                {(revenueMetrics.retentionRate * 100).toFixed(1)}% retention rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenueMetrics.monthlyRecurringRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(revenueMetrics.annualRecurringRevenue)} ARR
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="ai-metrics">AI Metrics</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Recurring vs one-time revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueMetrics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Recurring Revenue</span>
                      <span className="text-sm">{formatCurrency(revenueMetrics.recurringRevenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(revenueMetrics.recurringRevenue / revenueMetrics.totalRevenue) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">One-time Revenue</span>
                      <span className="text-sm">{formatCurrency(revenueMetrics.oneTimeRevenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(revenueMetrics.oneTimeRevenue / revenueMetrics.totalRevenue) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top AI Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top AI Performers</CardTitle>
                <CardDescription>Best performing AI configurations by ROI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiMetrics.slice(0, 5).map((metric, index) => (
                    <div key={`${metric.provider}-${metric.model}-${metric.persona}`} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{metric.provider}</Badge>
                        <span className="text-sm font-medium">{metric.persona}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatPercentage(metric.metrics.roi)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(metric.metrics.revenueGenerated)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User journey from visitor to customer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-blue-600">{index + 1}</div>
                        <div>
                          <div className="font-medium">{stage.stage}</div>
                          <div className="text-sm text-muted-foreground">
                            {stage.conversions.toLocaleString()} of {stage.users.toLocaleString()} users
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {(stage.conversionRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(stage.revenueGenerated)}
                        </div>
                      </div>
                    </div>
                    {index < conversionFunnel.length - 1 && (
                      <div className="flex justify-center mt-2">
                        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          {(stage.dropoffRate * 100).toFixed(1)}% drop-off
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiMetrics.map((metric) => (
              <Card key={`${metric.provider}-${metric.model}-${metric.persona}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{metric.provider} - {metric.persona}</span>
                    <Badge variant={metric.metrics.roi > 0 ? "default" : "destructive"}>
                      {formatPercentage(metric.metrics.roi)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{metric.model}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Requests</div>
                      <div>{metric.metrics.totalRequests.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Success Rate</div>
                      <div>{(metric.metrics.successRate * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="font-medium">Conversions</div>
                      <div>{metric.metrics.conversions}</div>
                    </div>
                    <div>
                      <div className="font-medium">Revenue</div>
                      <div>{formatCurrency(metric.metrics.revenueGenerated)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Cost</div>
                      <div>{formatCurrency(metric.metrics.totalCost)}</div>
                    </div>
                    <div>
                      <div className="font-medium">Avg Latency</div>
                      <div>{metric.metrics.averageLatency.toFixed(0)}ms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="personas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {personaProfiles.map((profile) => (
              <Card key={profile.persona}>
                <CardHeader>
                  <CardTitle className="capitalize">{profile.persona}</CardTitle>
                  <CardDescription>
                    {profile.businessMetrics.totalUsers} users • {formatCurrency(profile.businessMetrics.totalRevenue)} revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Conversion Rate</div>
                        <div>{(profile.businessMetrics.conversionRate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="font-medium">Customer LTV</div>
                        <div>{formatCurrency(profile.businessMetrics.customerLifetimeValue)}</div>
                      </div>
                      <div>
                        <div className="font-medium">Avg Order Value</div>
                        <div>{formatCurrency(profile.characteristics.averageOrderValue)}</div>
                      </div>
                      <div>
                        <div className="font-medium">Time to Convert</div>
                        <div>{profile.characteristics.timeToConversion.toFixed(0)} min</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-sm mb-2">AI Usage</div>
                      <div className="text-sm text-muted-foreground">
                        Preferred: {profile.characteristics.preferredAIProvider} • 
                        {profile.aiUsage.averageRequestsPerDay.toFixed(1)} requests/day • 
                        {profile.aiUsage.satisfactionScore.toFixed(1)}/5 satisfaction
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-sm mb-2">Preferred Features</div>
                      <div className="flex flex-wrap gap-1">
                        {profile.aiUsage.preferredFeatures.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          {businessImpactReports.map((report) => (
            <Card key={report.experimentId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Experiment {report.experimentId}</span>
                  <div className="flex items-center space-x-2">
                    {report.significance.isSignificant ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Significant
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Significant
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  {report.significance.sampleSize.control + report.significance.sampleSize.treatment} participants • 
                  {report.significance.confidenceLevel}% confidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Revenue Impact</h4>
                    <div className="text-2xl font-bold">
                      {formatPercentage(report.metrics.lift.revenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Control: {formatCurrency(report.metrics.control.totalRevenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Treatment: {formatCurrency(report.metrics.treatment.totalRevenue)}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Conversion Impact</h4>
                    <div className="text-2xl font-bold">
                      {formatPercentage(report.metrics.lift.conversions)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Control: {(report.metrics.control.conversionRate * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Treatment: {(report.metrics.treatment.conversionRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Annual Impact</h4>
                    <div className="text-2xl font-bold">
                      {formatCurrency(report.estimatedAnnualImpact)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Estimated yearly revenue impact
                    </div>
                  </div>
                </div>

                {report.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="mr-2">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          {roiAnalysis && (
            <>
              {/* Overall ROI */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Investment ROI</CardTitle>
                  <CardDescription>
                    {roiAnalysis.period.start.toLocaleDateString()} - {roiAnalysis.period.end.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium">Total AI Cost</div>
                      <div className="text-2xl font-bold">{formatCurrency(roiAnalysis.overall.totalAICost)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Total Revenue</div>
                      <div className="text-2xl font-bold">{formatCurrency(roiAnalysis.overall.totalRevenue)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Net ROI</div>
                      <div className={`text-2xl font-bold ${roiAnalysis.overall.netROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(roiAnalysis.overall.netROI)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Payback Period</div>
                      <div className="text-2xl font-bold">
                        {roiAnalysis.overall.paybackPeriod === Infinity ? '∞' : `${roiAnalysis.overall.paybackPeriod.toFixed(0)}d`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ROI by Provider */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ROI by AI Provider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {roiAnalysis.byProvider.map((provider) => (
                        <div key={provider.provider} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium capitalize">{provider.provider}</div>
                            <div className="text-sm text-muted-foreground">
                              {provider.requests} requests • {provider.conversions} conversions
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${provider.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(provider.roi)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(provider.revenue - provider.cost)} net
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ROI by Persona</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {roiAnalysis.byPersona.map((persona) => (
                        <div key={persona.persona} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium capitalize">{persona.persona}</div>
                            <div className="text-sm text-muted-foreground">
                              {persona.users} users • {(persona.conversionRate * 100).toFixed(1)}% conversion
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${persona.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(persona.roi)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(persona.revenue - persona.cost)} net
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              {roiAnalysis.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>ROI Optimization Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {roiAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded">
                          <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'outline'}>
                            {rec.priority}
                          </Badge>
                          <div className="flex-1">
                            <div className="font-medium">{rec.type.replace('_', ' ').toUpperCase()}</div>
                            <div className="text-sm text-muted-foreground">{rec.description}</div>
                            <div className="text-sm font-medium mt-1">
                              Expected Impact: {formatCurrency(rec.expectedImpact)} • 
                              Confidence: {(rec.confidence * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}