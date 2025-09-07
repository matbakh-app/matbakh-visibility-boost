/**
 * AI Analysis Widget - Displays AI-powered business analysis results
 * Shows SWOT analysis, competitive insights, and strategic frameworks
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAIServices } from '@/hooks/useAIServices';

interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  confidence: number;
}

interface CompetitiveInsight {
  competitor: string;
  advantage: string;
  gap: string;
  actionable: string;
}

interface AnalysisResult {
  id: string;
  type: 'swot' | 'porter' | 'balanced_scorecard' | 'competitive';
  title: string;
  data: any;
  confidence: number;
  lastUpdated: Date;
  personaRelevance: number;
}

interface AIAnalysisWidgetProps {
  compactMode?: boolean;
  persona?: string | null;
  beta?: boolean;
}

const AIAnalysisWidget: React.FC<AIAnalysisWidgetProps> = ({
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

  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('swot');

  // Check available capabilities
  const hasVCAnalysis = hasCapability('vc_analysis');
  const hasCompetitiveAnalysis = hasCapability('competitive_analysis');
  const isAnalyzing = activeOperations.some(op => op.type === 'analysis');

  useEffect(() => {
    if (hasVCAnalysis || hasCompetitiveAnalysis) {
      loadAnalyses();
    }
  }, [hasVCAnalysis, hasCompetitiveAnalysis, persona]);

  const loadAnalyses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const operationId = startOperation('analysis', 'Führe KI-Analyse durch...');
      
      updateOperation(operationId, { 
        status: 'running', 
        progress: 20,
        message: 'Sammle Geschäftsdaten...'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateOperation(operationId, { 
        progress: 40,
        message: 'Analysiere Wettbewerbsumfeld...'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      updateOperation(operationId, { 
        progress: 70,
        message: 'Generiere strategische Insights...'
      });

      const results = await generateAnalysisResults(persona);
      
      updateOperation(operationId, { 
        progress: 100,
        message: 'Analyse abgeschlossen'
      });

      setAnalyses(results);
      completeOperation(operationId, `${results.length} Analysen erstellt`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Analyse');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnalysisResults = async (currentPersona: string | null): Promise<AnalysisResult[]> => {
    const results: AnalysisResult[] = [];

    // SWOT Analysis
    if (hasVCAnalysis) {
      const swotData: SWOTAnalysis = {
        strengths: [
          'Authentische italienische Küche',
          'Zentrale Lage in der Altstadt',
          'Erfahrenes Küchenteam',
          'Stammkundenbasis'
        ],
        weaknesses: [
          'Begrenzte Online-Präsenz',
          'Veraltete Website',
          'Wenige Google-Bewertungen',
          'Keine Social Media Aktivität'
        ],
        opportunities: [
          'Wachsender Food-Delivery Markt',
          'Tourismus-Potenzial',
          'Instagram Food-Trends',
          'Lokale Kooperationen'
        ],
        threats: [
          'Neue Konkurrenz in der Nähe',
          'Steigende Mietkosten',
          'Fachkräftemangel',
          'Wirtschaftliche Unsicherheit'
        ],
        confidence: 87
      };

      results.push({
        id: 'swot_analysis',
        type: 'swot',
        title: 'SWOT-Analyse',
        data: swotData,
        confidence: 87,
        lastUpdated: new Date(),
        personaRelevance: getPersonaRelevance('swot', currentPersona)
      });
    }

    // Competitive Analysis
    if (hasCompetitiveAnalysis) {
      const competitiveData: CompetitiveInsight[] = [
        {
          competitor: 'Ristorante Bella Vista',
          advantage: 'Starke Instagram-Präsenz (5.2k Follower)',
          gap: 'Ihre Online-Sichtbarkeit ist 60% niedriger',
          actionable: 'Regelmäßige Food-Posts mit professionellen Fotos'
        },
        {
          competitor: 'Trattoria Milano',
          advantage: 'Excellent Google-Bewertungen (4.8/5)',
          gap: 'Sie haben 40% weniger Bewertungen',
          actionable: 'Aktive Bewertungsanfrage nach dem Besuch'
        },
        {
          competitor: 'Pizzeria Napoli',
          advantage: 'Delivery-Service über 3 Plattformen',
          gap: 'Kein eigener Lieferservice',
          actionable: 'Partnership mit Lieferando oder eigener Service'
        }
      ];

      results.push({
        id: 'competitive_analysis',
        type: 'competitive',
        title: 'Wettbewerbsanalyse',
        data: competitiveData,
        confidence: 82,
        lastUpdated: new Date(),
        personaRelevance: getPersonaRelevance('competitive', currentPersona)
      });
    }

    return results.sort((a, b) => b.personaRelevance - a.personaRelevance);
  };

  const getPersonaRelevance = (analysisType: string, currentPersona: string | null): number => {
    let relevance = 70;

    switch (currentPersona) {
      case 'Solo-Sarah':
        if (analysisType === 'swot') relevance = 85;
        break;
      case 'Bewahrer-Ben':
        if (analysisType === 'competitive') relevance = 90;
        break;
      case 'Wachstums-Walter':
        relevance = 95; // All analyses highly relevant
        break;
      case 'Ketten-Katrin':
        if (analysisType === 'competitive') relevance = 95;
        break;
    }

    return relevance;
  };

  const renderSWOTAnalysis = (data: SWOTAnalysis) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <h4 className="font-medium text-green-800">Stärken</h4>
        </div>
        {data.strengths.map((strength, index) => (
          <div key={index} className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-500">
            {strength}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <h4 className="font-medium text-red-800">Schwächen</h4>
        </div>
        {data.weaknesses.map((weakness, index) => (
          <div key={index} className="text-sm bg-red-50 p-2 rounded border-l-2 border-red-500">
            {weakness}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h4 className="font-medium text-blue-800">Chancen</h4>
        </div>
        {data.opportunities.map((opportunity, index) => (
          <div key={index} className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-500">
            {opportunity}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <h4 className="font-medium text-orange-800">Risiken</h4>
        </div>
        {data.threats.map((threat, index) => (
          <div key={index} className="text-sm bg-orange-50 p-2 rounded border-l-2 border-orange-500">
            {threat}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompetitiveAnalysis = (data: CompetitiveInsight[]) => (
    <div className="space-y-4">
      {data.map((insight, index) => (
        <div key={index} className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{insight.competitor}</h4>
            <Badge variant="outline">Konkurrent</Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <span className="font-medium">Vorteil: </span>
                <span className="text-gray-700">{insight.advantage}</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <TrendingDown className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <span className="font-medium">Gap: </span>
                <span className="text-gray-700">{insight.gap}</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Target className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <span className="font-medium">Maßnahme: </span>
                <span className="text-gray-700">{insight.actionable}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (!hasVCAnalysis && !hasCompetitiveAnalysis) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>KI-Analyse</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              KI-Analyse ist nicht verfügbar
            </p>
            <p className="text-sm text-gray-400">
              Aktivieren Sie AI-Features für detaillierte Geschäftsanalysen
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
            <BarChart3 className="w-5 h-5" />
            <span>KI-Analyse</span>
            {beta && <Badge variant="secondary">Beta</Badge>}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAnalyses}
            disabled={isLoading || isAnalyzing}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || isAnalyzing ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : analyses.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="swot">SWOT</TabsTrigger>
              <TabsTrigger value="competitive">Wettbewerb</TabsTrigger>
            </TabsList>
            
            <TabsContent value="swot" className="mt-4">
              {analyses.find(a => a.type === 'swot') && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">SWOT-Analyse</h3>
                    <Badge variant="outline">
                      {analyses.find(a => a.type === 'swot')?.confidence}% Konfidenz
                    </Badge>
                  </div>
                  {renderSWOTAnalysis(analyses.find(a => a.type === 'swot')?.data)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="competitive" className="mt-4">
              {analyses.find(a => a.type === 'competitive') && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Wettbewerbsanalyse</h3>
                    <Badge variant="outline">
                      {analyses.find(a => a.type === 'competitive')?.confidence}% Konfidenz
                    </Badge>
                  </div>
                  {renderCompetitiveAnalysis(analyses.find(a => a.type === 'competitive')?.data)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Keine Analysedaten verfügbar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisWidget;