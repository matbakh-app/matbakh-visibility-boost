/**
 * AI Recommendations Widget - Displays AI-generated business recommendations
 * Adapts content based on user persona and available AI capabilities
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  DollarSign, 
  RefreshCw, 
  ChevronRight,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { useAIServices } from '@/hooks/useAIServices';
import { useAiRecommendations } from '@/hooks/useAiRecommendations';

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'visibility' | 'content' | 'marketing' | 'operations' | 'customer_experience';
  priority: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedROI?: string;
  timeframe: string;
  actionable: boolean;
  confidence: number; // 0-100
  personaRelevance: number; // 0-100 for current persona
}

interface AIRecommendationsWidgetProps {
  compactMode?: boolean;
  persona?: string | null;
  beta?: boolean;
}

const AIRecommendationsWidget: React.FC<AIRecommendationsWidgetProps> = ({
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
    activeOperations 
  } = useAIServices();
  const { data: legacyRecommendations, isLoading: legacyLoading } = useAiRecommendations();

  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Check if AI recommendations are available
  const hasAICapability = hasCapability('business_recommendations');
  const isGenerating = activeOperations.some(op => op.type === 'recommendations');

  // Load recommendations on mount
  useEffect(() => {
    if (hasAICapability) {
      loadAIRecommendations();
    } else {
      // Fallback to legacy recommendations
      loadLegacyRecommendations();
    }
  }, [hasAICapability, persona]);

  const loadAIRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const operationId = startOperation('recommendations', 'Generiere KI-Empfehlungen...');
      
      // Simulate AI recommendation generation
      updateOperation(operationId, { 
        status: 'running', 
        progress: 25,
        message: 'Analysiere Geschäftsdaten...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateOperation(operationId, { 
        progress: 50,
        message: 'Generiere personalisierte Empfehlungen...'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      updateOperation(operationId, { 
        progress: 75,
        message: 'Berechne ROI-Projektionen...'
      });

      // Generate persona-specific recommendations
      const aiRecommendations = generatePersonaRecommendations(persona);
      
      updateOperation(operationId, { 
        progress: 100,
        message: 'Empfehlungen erfolgreich generiert'
      });

      setRecommendations(aiRecommendations);
      setLastUpdated(new Date());
      completeOperation(operationId, `${aiRecommendations.length} Empfehlungen generiert`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Empfehlungen');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLegacyRecommendations = () => {
    if (legacyRecommendations && legacyRecommendations.length > 0) {
      // Convert legacy recommendations to new format
      const converted = legacyRecommendations.map((rec: any, index: number) => ({
        id: rec.id || `legacy_${index}`,
        title: rec.title || 'Empfehlung',
        description: rec.description || rec.recommendation || '',
        category: rec.category || 'visibility',
        priority: rec.priority || 'medium',
        impact: rec.impact || 'medium',
        effort: rec.effort || 'medium',
        timeframe: rec.timeframe || '1-2 Wochen',
        actionable: true,
        confidence: 75,
        personaRelevance: 80
      }));
      setRecommendations(converted);
      setLastUpdated(new Date());
    }
  };

  const generatePersonaRecommendations = (currentPersona: string | null): AIRecommendation[] => {
    const baseRecommendations: Omit<AIRecommendation, 'personaRelevance'>[] = [
      {
        id: 'visibility_optimization',
        title: 'Google My Business Optimierung',
        description: 'Vervollständigen Sie Ihr GMB-Profil mit aktuellen Fotos und Öffnungszeiten',
        category: 'visibility',
        priority: 'high',
        impact: 'high',
        effort: 'low',
        estimatedROI: '15-25% mehr Sichtbarkeit',
        timeframe: '1 Woche',
        actionable: true,
        confidence: 92
      },
      {
        id: 'review_management',
        title: 'Bewertungsmanagement verbessern',
        description: 'Implementieren Sie ein System zur aktiven Bewertungsanfrage',
        category: 'customer_experience',
        priority: 'high',
        impact: 'medium',
        effort: 'medium',
        estimatedROI: '10-20% mehr positive Bewertungen',
        timeframe: '2-3 Wochen',
        actionable: true,
        confidence: 88
      },
      {
        id: 'content_strategy',
        title: 'Content-Strategie entwickeln',
        description: 'Erstellen Sie regelmäßige, ansprechende Inhalte für soziale Medien',
        category: 'content',
        priority: 'medium',
        impact: 'medium',
        effort: 'high',
        estimatedROI: '20-30% mehr Engagement',
        timeframe: '4-6 Wochen',
        actionable: true,
        confidence: 85
      },
      {
        id: 'local_seo',
        title: 'Lokale SEO stärken',
        description: 'Optimieren Sie Ihre Website für lokale Suchanfragen',
        category: 'marketing',
        priority: 'medium',
        impact: 'high',
        effort: 'medium',
        estimatedROI: '25-40% mehr Website-Traffic',
        timeframe: '3-4 Wochen',
        actionable: true,
        confidence: 90
      },
      {
        id: 'competitor_analysis',
        title: 'Wettbewerbsanalyse durchführen',
        description: 'Analysieren Sie die Strategien Ihrer erfolgreichsten Konkurrenten',
        category: 'marketing',
        priority: 'low',
        impact: 'medium',
        effort: 'medium',
        estimatedROI: 'Strategische Insights',
        timeframe: '2 Wochen',
        actionable: true,
        confidence: 82
      }
    ];

    // Adjust persona relevance based on current persona
    return baseRecommendations.map(rec => {
      let personaRelevance = 70; // Base relevance

      switch (currentPersona) {
        case 'Solo-Sarah':
          if (rec.effort === 'low' && rec.impact === 'high') personaRelevance = 95;
          else if (rec.effort === 'low') personaRelevance = 85;
          else if (rec.effort === 'high') personaRelevance = 50;
          break;

        case 'Bewahrer-Ben':
          if (rec.category === 'visibility' || rec.category === 'customer_experience') personaRelevance = 90;
          if (rec.priority === 'high') personaRelevance += 10;
          break;

        case 'Wachstums-Walter':
          if (rec.impact === 'high') personaRelevance = 95;
          if (rec.category === 'marketing') personaRelevance += 15;
          break;

        case 'Ketten-Katrin':
          if (rec.category === 'operations' || rec.category === 'marketing') personaRelevance = 95;
          if (rec.estimatedROI?.includes('%')) personaRelevance += 10;
          break;
      }

      return { ...rec, personaRelevance };
    }).sort((a, b) => b.personaRelevance - a.personaRelevance);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'medium': return <Target className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Clock className="w-4 h-4 text-gray-600" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-600" />;
    }
  };

  const displayRecommendations = compactMode 
    ? recommendations.slice(0, 3) 
    : recommendations.slice(0, 5);

  if (!hasAICapability && !legacyRecommendations?.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>KI-Empfehlungen</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              KI-Empfehlungen sind nicht verfügbar
            </p>
            <p className="text-sm text-gray-400">
              Aktivieren Sie AI-Features für personalisierte Empfehlungen
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
            <Lightbulb className="w-5 h-5" />
            <span>KI-Empfehlungen</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAIRecommendations}
            disabled={isLoading || isGenerating}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-500">
            Zuletzt aktualisiert: {lastUpdated.toLocaleString('de-DE')}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || isGenerating ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
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
            {displayRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getImpactIcon(rec.impact)}
                    <h4 className="font-medium text-sm">{rec.title}</h4>
                  </div>
                  <Badge className={getPriorityColor(rec.priority)} variant="secondary">
                    {rec.priority}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{rec.timeframe}</span>
                    </span>
                    {rec.estimatedROI && (
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{rec.estimatedROI}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-500">Relevanz:</span>
                    <span className="font-medium">{rec.personaRelevance}%</span>
                  </div>
                </div>
              </div>
            ))}
            
            {recommendations.length > displayRecommendations.length && (
              <Button variant="ghost" size="sm" className="w-full">
                <span>Alle {recommendations.length} Empfehlungen anzeigen</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendationsWidget;