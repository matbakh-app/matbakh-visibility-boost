import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { BlurredContent } from './PaywallOverlay';
import { 
  Bot, 
  Brain, 
  Target, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Users,
  DollarSign,
  Eye,
  MapPin,
  Calendar,
  Zap,
  Crown,
  Lock,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Star,
  Globe,
  Search,
  Share,
  Download,
  Settings,
  AlertCircle,
  Info
} from 'lucide-react';

type UserPlan = 'basic' | 'business' | 'premium';

interface AIResultsScreenProps {
  userPlan: UserPlan;
  onBack: () => void;
  onUpgrade: () => void;
  onScheduleNext: () => void;
}

interface ConfidenceScore {
  label: string;
  score: number;
  status: 'high' | 'medium' | 'low';
  description: string;
}

interface AIInsight {
  title: string;
  value: string;
  description: string;
  confidence: number;
  isLocked: boolean;
  planRequired?: 'business' | 'premium';
}

const analysisMetadata = {
  id: '#VC-2024-001547',
  duration: '4m 23s',
  timestamp: new Date().toLocaleString('de-DE'),
  dataPoints: 847,
  sourcesAnalyzed: 23
};

export function AIResultsScreen({ userPlan, onBack, onUpgrade, onScheduleNext }: AIResultsScreenProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAIChat, setShowAIChat] = useState(false);

  const confidenceScores: ConfidenceScore[] = [
    {
      label: 'Data-Quality',
      score: 94,
      status: 'high',
      description: 'Sehr hohe Datenqualität aus verifizierten Quellen'
    },
    {
      label: 'AI-Confidence',
      score: 87,
      status: 'high',
      description: 'Hohe Sicherheit der KI-Analyse'
    },
    {
      label: 'Prediction-Accuracy',
      score: 82,
      status: 'high',
      description: 'Basierend auf historischen Daten'
    },
    {
      label: 'Recommendation-Strength',
      score: 91,
      status: 'high',
      description: 'Stark empfohlene Handlungsschritte'
    }
  ];

  const bedrockInsights: AIInsight[] = [
    {
      title: 'Sentiment-Analyse',
      value: '89% positive Customer-Mentions',
      description: 'Kundenbewertungen zeigen überwiegend positive Stimmung',
      confidence: 92,
      isLocked: false
    },
    {
      title: 'Trend-Prediction',
      value: 'Sichtbarkeit wird um 15% steigen (nächste 30 Tage)',
      description: 'Prognostizierte Entwicklung basierend auf aktuellen Trends',
      confidence: 84,
      isLocked: userPlan === 'basic',
      planRequired: 'business'
    },
    {
      title: 'Competitive-Gap-Analysis',
      value: '3 kritische Schwächen vs. Top-Konkurrenz',
      description: 'Identifizierte Verbesserungsbereiche im Wettbewerbsvergleich',
      confidence: 88,
      isLocked: userPlan === 'basic',
      planRequired: 'business'
    },
    {
      title: 'Language-Processing',
      value: 'Bewertungs-Themen: Essen (94%), Service (87%), Atmosphäre (78%)',
      description: 'Automatische Kategorisierung der Kundenfeedback-Themen',
      confidence: 91,
      isLocked: userPlan === 'basic',
      planRequired: 'business'
    }
  ];

  const onpalInsights: AIInsight[] = [
    {
      title: 'Local-Market-Trends',
      value: 'Berlin Food-Scene: +23% Plant-based Interest',
      description: 'Lokale Marktentwicklungen in Ihrer Region',
      confidence: 86,
      isLocked: userPlan === 'basic',
      planRequired: 'business'
    },
    {
      title: 'Seasonal-Insights',
      value: 'Winter-Menü-Trends: Comfort Food +45%',
      description: 'Saisonale Präferenzen und Trends',
      confidence: 79,
      isLocked: userPlan === 'basic',
      planRequired: 'business'
    },
    {
      title: 'Price-Optimization',
      value: 'Ihre Preise 12% unter Premium-Segment-Optimum',
      description: 'Preispositionierung im Marktkontext',
      confidence: 83,
      isLocked: userPlan !== 'premium',
      planRequired: 'premium'
    },
    {
      title: 'Customer-Journey-Mapping',
      value: '67% entdecken via Google, 23% via Social',
      description: 'Analyse der Kundenreise und Touchpoints',
      confidence: 88,
      isLocked: userPlan !== 'premium',
      planRequired: 'premium'
    }
  ];

  const getConfidenceColor = (status: ConfidenceScore['status']) => {
    switch (status) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'Sehr hoch';
    if (score >= 80) return 'Hoch';
    if (score >= 70) return 'Mittel';
    return 'Niedrig';
  };

  const renderAIInsight = (insight: AIInsight, index: number) => {
    if (insight.isLocked) {
      return (
        <BlurredContent key={index} className="p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{insight.title}</h4>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {insight.planRequired === 'business' ? 'Business' : 'Premium'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-Insights in {insight.planRequired === 'business' ? 'Business' : 'Premium'} Plan verfügbar
          </p>
        </BlurredContent>
      );
    }

    return (
      <div key={index} className="p-4 bg-background rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{insight.title}</h4>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {insight.confidence}% confidence
            </div>
            <div className={`w-2 h-2 rounded-full ${
              insight.confidence >= 85 ? 'bg-success' : 
              insight.confidence >= 70 ? 'bg-warning' : 'bg-error'
            }`} />
          </div>
        </div>
        <p className="font-medium text-sm mb-2">{insight.value}</p>
        <p className="text-xs text-muted-foreground">{insight.description}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Zurück
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div>
                <h1 className="font-bold">🤖 KI-gestützte Sichtbarkeits-Analyse</h1>
                <p className="text-sm text-muted-foreground">
                  Powered by AWS Bedrock + OnPal Intelligence
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Report
              </Button>
              
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                Teilen
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Analysis Metadata */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{analysisMetadata.id}</div>
                <div className="text-sm text-muted-foreground">Analysis-ID</div>
                <div className="text-xs text-muted-foreground mt-1">für Support-Referenz</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{analysisMetadata.duration}</div>
                <div className="text-sm text-muted-foreground">Analyse abgeschlossen</div>
                <div className="text-xs text-muted-foreground mt-1">{analysisMetadata.timestamp}</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{analysisMetadata.dataPoints}</div>
                <div className="text-sm text-muted-foreground">Datenpunkte analysiert</div>
                <div className="text-xs text-muted-foreground mt-1">aus {analysisMetadata.sourcesAnalyzed} Quellen</div>
              </div>
              
              <div className="text-center">
                <Badge variant="default" className="mb-2">
                  <Crown className="w-3 h-3 mr-1" />
                  {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} Plan
                </Badge>
                <div className="text-sm text-muted-foreground">Aktueller Plan</div>
                {userPlan !== 'premium' && (
                  <Button variant="link" size="sm" onClick={onUpgrade} className="text-xs p-0 h-auto">
                    Upgrade verfügbar
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main AI Insights */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bedrock AI Section */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">🧠 AWS Bedrock Intelligenz</h2>
                    <p className="text-sm text-muted-foreground">
                      Erweiterte KI-Analyse mit Natural Language Processing
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {bedrockInsights.map((insight, index) => renderAIInsight(insight, index))}
                </div>

                {userPlan === 'basic' && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Erweiterte Bedrock AI-Features</h4>
                        <p className="text-sm text-muted-foreground">
                          Trend-Predictions und Competitive Intelligence
                        </p>
                      </div>
                      <Button size="sm" onClick={onUpgrade}>
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* OnPal Intelligence Section */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">🎯 OnPal Markt-Intelligence</h2>
                    <p className="text-sm text-muted-foreground">
                      Branchenspezifische Insights und lokale Markttrends
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {onpalInsights.map((insight, index) => renderAIInsight(insight, index))}
                </div>

                {userPlan !== 'premium' && (
                  <div className="mt-6 p-4 bg-warning/5 rounded-lg border border-warning/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Premium OnPal Features</h4>
                        <p className="text-sm text-muted-foreground">
                          Price-Optimization und Customer-Journey-Mapping
                        </p>
                      </div>
                      <Button size="sm" onClick={onUpgrade}>
                        <Crown className="w-4 h-4 mr-2" />
                        Premium
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Premium AI Chat */}
              {userPlan === 'premium' && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold">🤖 Custom AI-Prompts</h3>
                      <p className="text-sm text-muted-foreground">Fragen Sie die KI direkt</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Fragen Sie die KI zu Ihren Analyseergebnissen..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => {
                          setShowAIChat(true);
                          setCustomPrompt('');
                        }}
                        disabled={!customPrompt.trim()}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Fragen
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start"
                        onClick={() => setCustomPrompt('Wie kann ich meine Bewertungen verbessern?')}
                      >
                        "Wie kann ich meine Bewertungen verbessern?"
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start"
                        onClick={() => setCustomPrompt('Welche Marketingkanäle sollte ich priorisieren?')}
                      >
                        "Welche Marketingkanäle priorisieren?"
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Confidence Scores */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI-Confidence Scores</h3>
                    <p className="text-sm text-muted-foreground">Reliability-Indicators</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {confidenceScores.map((score, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{score.label}</span>
                        <span className={`text-sm font-bold ${getConfidenceColor(score.status)}`}>
                          {score.score}% ({getConfidenceLabel(score.score)})
                        </span>
                      </div>
                      <Progress value={score.score} className="h-2" />
                      <p className="text-xs text-muted-foreground">{score.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Next AI Analysis */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Next AI-Analysis</h3>
                    <p className="text-sm text-muted-foreground">Scheduling & Tracking</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>🔄 Nächste AI-Analyse: Morgen 08:00</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>🤖 Erwartete Verbesserungen werden getrackt</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Brain className="w-4 h-4" />
                      <span>📊 AI lernt aus Ihren Implementierungen</span>
                    </div>
                  </div>

                  <Button onClick={onScheduleNext} className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    AI-Analyse-Frequenz anpassen
                  </Button>
                </div>
              </Card>

              {/* Plan Comparison */}
              {userPlan !== 'premium' && (
                <Card className="p-6 bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                  <div className="text-center space-y-4">
                    <Crown className="w-8 h-8 text-warning mx-auto" />
                    <div>
                      <h4 className="font-bold">Upgrade für mehr AI-Power</h4>
                      <p className="text-sm text-muted-foreground">
                        {userPlan === 'basic' ? 'Business Plan' : 'Premium Plan'} Features
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {(userPlan === 'basic' ? [
                        '✅ Trend-Predictions (30 Tage)',
                        '✅ Competitive Intelligence',
                        '✅ Erweiterte Sentiment-Analyse',
                        '✅ Lokale Markt-Trends'
                      ] : [
                        '✅ Predictive Analytics',
                        '✅ Custom AI-Prompts',
                        '✅ Price-Optimization',
                        '✅ Customer-Journey-Mapping'
                      ]).map((feature, index) => (
                        <div key={index} className="text-left">{feature}</div>
                      ))}
                    </div>
                    
                    <Button onClick={onUpgrade} className="w-full">
                      <Crown className="w-4 h-4 mr-2" />
                      Jetzt upgraden
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* AI Attribution Footer */}
          <Card className="p-6 bg-muted/30">
            <div className="text-center space-y-4">
              <h4 className="font-semibold">🤖 AI-Attribution & Technologie</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-background rounded-lg">
                  <div className="font-medium mb-1">Technologie</div>
                  <div className="text-muted-foreground">AWS Bedrock (Anthropic Claude)</div>
                </div>
                
                <div className="p-3 bg-background rounded-lg">
                  <div className="font-medium mb-1">Marktdaten</div>
                  <div className="text-muted-foreground">OnPal Restaurant Intelligence</div>
                </div>
                
                <div className="p-3 bg-background rounded-lg">
                  <div className="font-medium mb-1">Datenqualität</div>
                  <div className="text-muted-foreground">94% verified sources</div>
                </div>
                
                <div className="p-3 bg-background rounded-lg">
                  <div className="font-medium mb-1">Analyse-Methodik</div>
                  <div className="text-muted-foreground">Explainable AI</div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Datenschutz-konform</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>EU-GDPR compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>ISO 27001 zertifiziert</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}