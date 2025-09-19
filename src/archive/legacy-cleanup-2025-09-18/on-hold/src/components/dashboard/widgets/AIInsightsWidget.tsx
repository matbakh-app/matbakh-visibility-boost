/**
 * AI Insights Widget - Displays AI-generated business insights and trends
 * Shows persona detection results, behavioral patterns, and strategic insights
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Users, 
  Clock,
  RefreshCw,
  Lightbulb,
  Target,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAIServices } from '@/hooks/useAIServices';

interface BusinessInsight {
  id: string;
  category: 'persona' | 'behavior' | 'trends' | 'opportunities' | 'risks';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
  actionable: boolean;
  data?: any;
}

interface PersonaDetectionResult {
  detectedPersona: string;
  confidence: number;
  characteristics: string[];
  behaviorPatterns: string[];
  recommendations: string[];
}

interface AIInsightsWidgetProps {
  compactMode?: boolean;
  persona?: string | null;
  beta?: boolean;
}

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({
  compactMode = false,
  persona = null,
  beta = false
}) => {
  const { t } = useTranslation('dashboard');
  const { 
    hasCapability, 
    startOperation, 
    updateOperation, 
    completeOperation,
    activeOperations,
    currentPersona 
  } = useAIServices();

  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [personaDetection, setPersonaDetection] = useState<PersonaDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<BusinessInsight['category']>('persona');

  const hasPersonaCapability = hasCapability('persona_detection');
  const isAnalyzing = activeOperations.some(op => op.type === 'analysis');

  useEffect(() => {
    if (hasPersonaCapability) {
      loadInsights();
    }
  }, [hasPersonaCapability, persona]);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const operationId = startOperation('analysis', 'Generiere KI-Insights...');
      
      updateOperation(operationId, { 
        status: 'running', 
        progress: 25,
        message: 'Analysiere Nutzerverhalten...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateOperation(operationId, { 
        progress: 50,
        message: 'Erkenne Verhaltensmuster...'
      });

      const [businessInsights, personaResult] = await Promise.all([
        generateBusinessInsights(persona),
        generatePersonaDetection(persona)
      ]);

      updateOperation(operationId, { 
        progress: 80,
        message: 'Erstelle Handlungsempfehlungen...'
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      setInsights(businessInsights);
      setPersonaDetection(personaResult);
      
      updateOperation(operationId, { 
        progress: 100,
        message: 'Insights erfolgreich generiert'
      });

      completeOperation(operationId, `${businessInsights.length} Insights erstellt`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Insights');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBusinessInsights = async (currentPersona: string | null): Promise<BusinessInsight[]> => {
    const baseInsights: BusinessInsight[] = [
      {
        id: 'peak_hours',
        category: 'behavior',
        title: 'Stoßzeiten-Analyse',
        description: 'Ihre Hauptbesuchszeiten sind 12:00-14:00 und 19:00-21:00. 68% der Reservierungen fallen in diese Zeiträume.',
        confidence: 92,
        impact: 'high',
        trend: 'stable',
        timeframe: 'Letzte 30 Tage',
        actionable: true,
        data: { peakHours: ['12:00-14:00', '19:00-21:00'], percentage: 68 }
      },
      {
        id: 'customer_retention',
        category: 'trends',
        title: 'Kundenbindung steigt',
        description: 'Die Wiederkehrrate ist um 15% gestiegen. Stammkunden machen jetzt 45% Ihres Umsatzes aus.',
        confidence: 88,
        impact: 'high',
        trend: 'up',
        timeframe: 'Letztes Quartal',
        actionable: true,
        data: { retentionIncrease: 15, loyalCustomerRevenue: 45 }
      },
      {
        id: 'seasonal_opportunity',
        category: 'opportunities',
        title: 'Herbst-Menü Potenzial',
        description: 'Saisonale Gerichte zeigen 23% höhere Gewinnmargen. Trüffel- und Kürbisgerichte sind besonders gefragt.',
        confidence: 85,
        impact: 'medium',
        trend: 'up',
        timeframe: 'Nächste 8 Wochen',
        actionable: true,
        data: { marginIncrease: 23, popularItems: ['Trüffel', 'Kürbis'] }
      },
      {
        id: 'online_presence_gap',
        category: 'risks',
        title: 'Online-Präsenz Lücke',
        description: 'Ihre Online-Sichtbarkeit ist 35% niedriger als der lokale Durchschnitt. Konkurrenten gewinnen digitale Marktanteile.',
        confidence: 90,
        impact: 'high',
        trend: 'down',
        timeframe: 'Letzte 6 Monate',
        actionable: true,
        data: { visibilityGap: 35, competitorAdvantage: true }
      },
      {
        id: 'review_sentiment',
        category: 'trends',
        title: 'Bewertungs-Sentiment',
        description: 'Positive Erwähnungen von "Atmosphäre" und "Service" sind um 28% gestiegen. Kunden schätzen die persönliche Betreuung.',
        confidence: 87,
        impact: 'medium',
        trend: 'up',
        timeframe: 'Letzte 60 Tage',
        actionable: false,
        data: { sentimentIncrease: 28, topMentions: ['Atmosphäre', 'Service'] }
      }
    ];

    // Filter and sort based on persona relevance
    return baseInsights.filter(insight => {
      switch (currentPersona) {
        case 'Solo-Sarah':
          return insight.impact === 'high' && insight.actionable;
        case 'Bewahrer-Ben':
          return insight.category !== 'risks' || insight.confidence > 85;
        case 'Wachstums-Walter':
          return insight.category === 'opportunities' || insight.impact === 'high';
        case 'Ketten-Katrin':
          return insight.category === 'trends' || insight.category === 'behavior';
        default:
          return true;
      }
    }).sort((a, b) => b.confidence - a.confidence);
  };

  const generatePersonaDetection = async (currentPersona: string | null): Promise<PersonaDetectionResult> => {
    // Simulate persona detection based on current persona or detect new one
    const detectedPersona = currentPersona || 'Solo-Sarah';
    
    const personaData: Record<string, Omit<PersonaDetectionResult, 'detectedPersona'>> = {
      'Solo-Sarah': {
        confidence: 87,
        characteristics: [
          'Fokus auf einfache Lösungen',
          'Zeiteffiziente Entscheidungen',
          'Praktische Umsetzung bevorzugt',
          'Kostenbewusst'
        ],
        behaviorPatterns: [
          'Kurze Dashboard-Sessions (avg. 3 min)',
          'Bevorzugt Quick-Actions',
          'Hohe Mobile-Nutzung (78%)',
          'Fokus auf ROI-Metriken'
        ],
        recommendations: [
          'Vereinfachte Dashboard-Ansicht aktivieren',
          'Mobile-First Optimierung nutzen',
          'Quick-Win Empfehlungen priorisieren',
          'Automatisierte Berichte einrichten'
        ]
      },
      'Bewahrer-Ben': {
        confidence: 82,
        characteristics: [
          'Vorsichtige Herangehensweise',
          'Wert auf bewährte Methoden',
          'Qualität vor Quantität',
          'Lokale Verwurzelung'
        ],
        behaviorPatterns: [
          'Längere Analyse-Sessions (avg. 8 min)',
          'Detaillierte Berichte bevorzugt',
          'Desktop-Nutzung dominant (85%)',
          'Fokus auf Kundenzufriedenheit'
        ],
        recommendations: [
          'Detaillierte Analysen bereitstellen',
          'Bewährte Strategien hervorheben',
          'Kundenfeedback-Integration',
          'Schritt-für-Schritt Anleitungen'
        ]
      },
      'Wachstums-Walter': {
        confidence: 91,
        characteristics: [
          'Wachstumsorientiert',
          'Technologie-affin',
          'Risikobereit',
          'Datengetrieben'
        ],
        behaviorPatterns: [
          'Intensive Dashboard-Nutzung (avg. 12 min)',
          'Alle Features werden genutzt',
          'Multi-Device Zugriff',
          'Experimentierfreudigkeit'
        ],
        recommendations: [
          'Erweiterte Analytics aktivieren',
          'Beta-Features freischalten',
          'A/B-Testing Tools nutzen',
          'Wachstumsmetriken fokussieren'
        ]
      },
      'Ketten-Katrin': {
        confidence: 89,
        characteristics: [
          'Multi-Location Management',
          'Standardisierung wichtig',
          'Effizienz-fokussiert',
          'Team-orientiert'
        ],
        behaviorPatterns: [
          'Regelmäßige Dashboard-Checks',
          'Vergleichsanalysen bevorzugt',
          'Export-Funktionen genutzt',
          'Team-Sharing aktiviert'
        ],
        recommendations: [
          'Multi-Location Dashboard',
          'Benchmark-Vergleiche aktivieren',
          'Team-Collaboration Tools',
          'Standardisierte Berichte'
        ]
      }
    };

    return {
      detectedPersona,
      ...personaData[detectedPersona]
    };
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <BarChart3 className="w-4 h-4 text-gray-600" />;
      default: return <Eye className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'persona': return <Users className="w-4 h-4" />;
      case 'behavior': return <Brain className="w-4 h-4" />;
      case 'trends': return <TrendingUp className="w-4 h-4" />;
      case 'opportunities': return <Lightbulb className="w-4 h-4" />;
      case 'risks': return <AlertCircle className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const filteredInsights = insights.filter(insight => 
    compactMode ? insight.impact === 'high' : insight.category === activeCategory
  );

  if (!hasPersonaCapability) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>KI-Insights</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              KI-Insights sind nicht verfügbar
            </p>
            <p className="text-sm text-gray-400">
              Aktivieren Sie AI-Features für intelligente Geschäftseinblicke
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>KI-Insights</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadInsights}
            disabled={isLoading || isAnalyzing}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Persona Detection Results */}
        {personaDetection && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-purple-900 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Erkannte Persona</span>
              </h4>
              <Badge variant="outline" className="text-purple-700">
                {personaDetection.confidence}% Konfidenz
              </Badge>
            </div>
            <p className="text-sm text-purple-800 mb-2">
              <strong>{personaDetection.detectedPersona}</strong>
            </p>
            <div className="text-xs text-purple-700">
              <p className="mb-1">Hauptmerkmale:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {personaDetection.characteristics.slice(0, compactMode ? 2 : 3).map((char, index) => (
                  <li key={index}>{char}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Category Tabs (only in full mode) */}
        {!compactMode && (
          <div className="flex space-x-1 overflow-x-auto">
            {(['persona', 'behavior', 'trends', 'opportunities', 'risks'] as const).map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="flex items-center space-x-1 whitespace-nowrap"
              >
                {getCategoryIcon(category)}
                <span className="capitalize">{category}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Insights */}
        {isLoading || isAnalyzing ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse border rounded-lg p-3">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInsights.slice(0, compactMode ? 3 : 5).map((insight) => (
              <div key={insight.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(insight.trend)}
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact}
                    </Badge>
                    {insight.actionable && (
                      <Target className="w-3 h-3 text-blue-600" />
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700">{insight.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{insight.timeframe}</span>
                    </span>
                    <span>Konfidenz: {insight.confidence}%</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {insight.category}
                  </Badge>
                </div>

                {insight.confidence > 0 && (
                  <Progress value={insight.confidence} className="h-1" />
                )}
              </div>
            ))}

            {filteredInsights.length === 0 && (
              <div className="text-center py-6">
                <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Keine Insights für diese Kategorie verfügbar
                </p>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {insights.length > 0 && !compactMode && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-medium text-gray-900">
                  {insights.filter(i => i.impact === 'high').length}
                </div>
                <div className="text-gray-500 text-xs">High Impact</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {insights.filter(i => i.actionable).length}
                </div>
                <div className="text-gray-500 text-xs">Actionable</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)}%
                </div>
                <div className="text-gray-500 text-xs">Avg. Confidence</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsightsWidget;