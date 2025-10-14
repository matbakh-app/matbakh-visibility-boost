// Recommendation Debug Component - Task 6.4.4.6
// Demo component for testing and debugging recommendation triggers
// Requirements: B.3

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  useRecommendations, 
  useMultipleRecommendations, 
  useRecommendationStats 
} from '@/hooks/useRecommendations';
import { evaluateScoreTrend } from '@/lib/recommendation/recommendationTrigger';
import { getContextualThresholds } from '@/lib/recommendation/thresholds';
import type { ScorePoint, TriggerContext } from '@/types/recommendation';

const RecommendationDebug: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('dropping');
  const [customData, setCustomData] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [context, setContext] = useState<Partial<TriggerContext>>({
    scoreType: 'overall_visibility',
    industry: 'restaurant',
    businessId: 'demo-business'
  });

  // Generate sample data based on scenario
  const sampleData = useMemo(() => {
    const baseDate = new Date();\n    const generateScores = (pattern: string): ScorePoint[] => {
      return Array.from({ length: 30 }, (_, i) => {
        let scoreValue = 65;
        
        switch (pattern) {
          case 'dropping':
            scoreValue = 80 - (i <= 14 ? (i * 25) / 14 : 25) + (Math.random() - 0.5) * 3;
            break;
          case 'stagnant':
            scoreValue = 45 + (Math.random() - 0.5) * 2;
            break;
          case 'improving':
            scoreValue = 40 + (i * 1.2) + (Math.random() - 0.5) * 3;
            break;
          case 'volatile':
            scoreValue = 60 + (Math.random() - 0.5) * 40;
            break;
          default:
            scoreValue = 65 + (Math.random() - 0.5) * 5;
        }
        
        return {
          id: `${pattern}-${i}`,
          business_id: 'demo-business',
          score_type: context.scoreType || 'overall_visibility',
          score_value: Math.max(0, Math.min(100, scoreValue)),
          date: new Date(baseDate.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          calculated_at: new Date().toISOString(),
          source: 'demo',
          meta: { scenario: pattern }
        };
      });
    };

    if (customData.trim()) {
      try {
        return JSON.parse(customData) as ScorePoint[];
      } catch (e) {
        console.warn('Invalid custom data, using sample data');
      }
    }

    return generateScores(selectedScenario);
  }, [selectedScenario, customData, context.scoreType]);

  // Multiple score types for comprehensive testing
  const multipleScoreData = useMemo(() => ({
    google_visibility: sampleData,
    instagram_engagement: sampleData.map(point => ({
      ...point,
      score_type: 'instagram_engagement',
      score_value: point.score_value * 0.8 + Math.random() * 10
    })),
    review_score: sampleData.map(point => ({
      ...point,
      score_type: 'review_score',
      score_value: Math.min(5, (point.score_value / 20) + Math.random() * 0.5)
    }))
  }), [sampleData]);

  // Hooks for testing
  const singleRecommendation = useRecommendations(
    context.scoreType || 'overall_visibility',
    sampleData,
    context,
    { autoRefresh, minConfidenceThreshold: 0.2 }
  );

  const multipleRecommendations = useMultipleRecommendations(
    multipleScoreData,
    context,
    { autoRefresh }
  );

  const stats = useRecommendationStats(multipleScoreData, context);

  // Manual trigger evaluation
  const manualEvaluation = useMemo(() => {
    const triggerContext: TriggerContext = {
      scoreType: context.scoreType || 'overall_visibility',
      businessId: context.businessId,
      industry: context.industry
    };
    
    return evaluateScoreTrend(sampleData, undefined, triggerContext);
  }, [sampleData, context]);

  const thresholds = useMemo(() => {
    return getContextualThresholds(
      context.scoreType || 'overall_visibility',
      context.industry
    );
  }, [context.scoreType, context.industry]);

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'review_google': return '🔍';
      case 'check_ig': return '📱';
      case 'update_photos': return '📸';
      case 'respond_reviews': return '💬';
      case 'optimize_seo': return '🔧';
      case 'boost_social': return '🚀';
      default: return '⚡';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recommendation System Debug</h1>
          <p className="text-muted-foreground">
            Test und Debug-Interface für das Score-basierte Empfehlungssystem
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
            />
            <label htmlFor="auto-refresh" className="text-sm">Auto Refresh</label>
          </div>
          <Button onClick={singleRecommendation.refresh} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="single" className="space-y-4">
        <TabsList>
          <TabsTrigger value="single">Single Score</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Scores</TabsTrigger>
          <TabsTrigger value="manual">Manual Evaluation</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scenario Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Test Scenario</CardTitle>
                <CardDescription>
                  Wählen Sie ein Testszenario oder verwenden Sie eigene Daten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {['dropping', 'stagnant', 'improving', 'volatile'].map((scenario) => (
                    <Button
                      key={scenario}
                      variant={selectedScenario === scenario ? 'default' : 'outline'}
                      onClick={() => setSelectedScenario(scenario)}
                      className="capitalize"
                    >
                      {scenario}
                    </Button>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Data (JSON)</label>
                  <Textarea
                    placeholder="Eigene ScorePoint[] Daten als JSON..."
                    value={customData}
                    onChange={(e) => setCustomData(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Single Recommendation Result */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Result</CardTitle>
                <CardDescription>
                  Ergebnis für {context.scoreType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {singleRecommendation.error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{singleRecommendation.error}</AlertDescription>
                  </Alert>
                ) : singleRecommendation.recommendation ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getSeverityColor(singleRecommendation.recommendation.estimatedImpact)}>
                        {singleRecommendation.recommendation.estimatedImpact}
                      </Badge>
                      <span className="text-2xl">
                        {getActionIcon(singleRecommendation.recommendation.action)}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">{singleRecommendation.recommendation.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {singleRecommendation.recommendation.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Priority:</span> {singleRecommendation.recommendation.priority}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {singleRecommendation.recommendation.timeToImplement}
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span> {(singleRecommendation.confidence * 100).toFixed(1)}%
                      </div>
                      <div>
                        <span className="font-medium">Reason:</span> {singleRecommendation.recommendation.triggerReason}
                      </div>
                    </div>
                    
                    <Progress value={singleRecommendation.confidence * 100} className="w-full" />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Keine Empfehlung ausgelöst</p>
                    <p className="text-sm">Confidence: {(singleRecommendation.confidence * 100).toFixed(1)}%</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trigger Details */}
          {singleRecommendation.triggerResult && (
            <Card>
              <CardHeader>
                <CardTitle>Trigger Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Triggered:</span> {singleRecommendation.triggerResult.triggered ? '✅' : '❌'}
                  </div>
                  <div>
                    <span className="font-medium">Reason:</span> {singleRecommendation.triggerResult.reason || 'None'}
                  </div>
                  <div>
                    <span className="font-medium">Action:</span> {singleRecommendation.triggerResult.action || 'None'}
                  </div>
                  <div>
                    <span className="font-medium">Severity:</span> {singleRecommendation.triggerResult.severity || 'None'}
                  </div>
                </div>
                
                {singleRecommendation.triggerResult.metadata && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h5 className="font-medium mb-2">Metadata</h5>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(singleRecommendation.triggerResult.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="multiple" className="space-y-4">
          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalTriggers}</div>
                <p className="text-xs text-muted-foreground">Total Triggers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{(stats.averageConfidence * 100).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.triggersByReason.drop}</div>
                <p className="text-xs text-muted-foreground">Drop Triggers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.triggersByReason.stagnation}</div>
                <p className="text-xs text-muted-foreground">Stagnation Triggers</p>
              </CardContent>
            </Card>
          </div>

          {/* Multiple Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>All Recommendations</CardTitle>
              <CardDescription>
                Empfehlungen für alle Score-Typen (sortiert nach Priorität)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {multipleRecommendations.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {multipleRecommendations.recommendations.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getActionIcon(rec.action)}</span>
                          <h4 className="font-semibold">{rec.title}</h4>
                          <Badge className={getSeverityColor(rec.estimatedImpact)}>
                            {rec.estimatedImpact}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Priority: {rec.priority}</div>
                        <div className="text-xs text-muted-foreground">{rec.timeToImplement}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => multipleRecommendations.dismissRecommendation(rec.id)}
                          className="mt-1"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Empfehlungen ausgelöst
                </div>
              )}
            </CardContent>
          </Card>

          {/* Highest Priority Recommendation */}
          {multipleRecommendations.highestPriorityRecommendation && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">🚨 Highest Priority Action</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {getActionIcon(multipleRecommendations.highestPriorityRecommendation.action)}
                  </span>
                  <div>
                    <h4 className="font-semibold text-orange-800">
                      {multipleRecommendations.highestPriorityRecommendation.title}
                    </h4>
                    <p className="text-sm text-orange-700">
                      {multipleRecommendations.highestPriorityRecommendation.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Evaluation</CardTitle>
              <CardDescription>
                Direkte Auswertung ohne React Hooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Evaluation Result</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Triggered:</span>
                      <span>{manualEvaluation.triggered ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reason:</span>
                      <span>{manualEvaluation.reason || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Action:</span>
                      <span>{manualEvaluation.action || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Severity:</span>
                      <span>{manualEvaluation.severity || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span>{((manualEvaluation.confidence || 0) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Active Thresholds</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Drop Threshold:</span>
                      <span>{(thresholds.dropThreshold * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stagnation Range:</span>
                      <span>{(thresholds.stagnationRange * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Evaluation Period:</span>
                      <span>{thresholds.evaluationPeriod} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Min Data Points:</span>
                      <span>{thresholds.minDataPoints}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {manualEvaluation.metadata && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Metadata</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                    {JSON.stringify(manualEvaluation.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Context Configuration</CardTitle>
              <CardDescription>
                Konfigurieren Sie den Kontext für die Empfehlungsauswertung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Score Type</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={context.scoreType}
                    onChange={(e) => setContext(prev => ({ ...prev, scoreType: e.target.value }))}
                  >
                    <option value="overall_visibility">Overall Visibility</option>
                    <option value="google_visibility">Google Visibility</option>
                    <option value="instagram_engagement">Instagram Engagement</option>
                    <option value="review_score">Review Score</option>
                    <option value="seo_visibility">SEO Visibility</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={context.industry}
                    onChange={(e) => setContext(prev => ({ ...prev, industry: e.target.value }))}
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="professional_services">Professional Services</option>
                    <option value="hospitality">Hospitality</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Business ID</label>
                  <input
                    type="text"
                    className="w-full mt-1 p-2 border rounded-md"
                    value={context.businessId}
                    onChange={(e) => setContext(prev => ({ ...prev, businessId: e.target.value }))}
                    placeholder="demo-business"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Sample Data Preview</h4>
                <div className="text-sm text-muted-foreground">
                  {sampleData.length} data points from {sampleData[0]?.date} to {sampleData[sampleData.length - 1]?.date}
                </div>
                <div className="mt-2 max-h-40 overflow-auto">
                  <pre className="text-xs bg-muted p-3 rounded-lg">
                    {JSON.stringify(sampleData.slice(0, 5), null, 2)}
                    {sampleData.length > 5 && '\n... and ' + (sampleData.length - 5) + ' more'}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecommendationDebug;