import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Star, TrendingUp, BarChart3, Users, Lightbulb, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AnalysisResult } from '@/types/visibility';
import PlatformProfileCard from './PlatformProfileCard';

interface VisibilityResultsEnhancedProps {
  businessName: string;
  analysisResult: AnalysisResult & {
    gmb_metrics?: any;
    ga4_metrics?: any;
    ads_metrics?: any;
    swotAnalysis?: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    recommendations?: Array<{
      task: string;
      impact: number;
      effort: number;
      priority?: 'high' | 'medium' | 'low';
    }>;
  };
  onRequestDetailedReport?: () => void;
  onNewAnalysis: () => void;
  reportRequested?: boolean;
  email?: string;
  showFullAnalysis?: boolean; // For paid users
}

const ScoreDonut: React.FC<{ score: number; size?: 'sm' | 'lg' }> = ({ score, size = 'lg' }) => {
  const radius = size === 'lg' ? 40 : 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`relative ${size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={getScoreColor(score)}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${size === 'lg' ? 'text-xl' : 'text-sm'} font-bold ${getScoreColor(score)}`}>
        {score}%
      </div>
    </div>
  );
};

const VisibilityResultsEnhanced: React.FC<VisibilityResultsEnhancedProps> = ({ 
  businessName, 
  analysisResult, 
  onRequestDetailedReport, 
  onNewAnalysis,
  reportRequested = false,
  email,
  showFullAnalysis = false
}) => {
  const { t } = useTranslation(['ai', 'common']);

  const getLeadPotentialBadge = (potential: string) => {
    switch (potential) {
      case 'high':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">{t('ai:analysis.leadPotential')} Hoch</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('ai:analysis.leadPotential')} Mittel</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-green-100 text-green-800">{t('ai:analysis.leadPotential')} Niedrig</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">
          {t('ai:analysis.overallScore')} für {businessName}
        </h1>
        <p className="text-gray-600">
          Umfassende KI-basierte Bewertung Ihrer Online-Präsenz
        </p>
        <div className="flex flex-col items-center gap-2">
          {getLeadPotentialBadge(analysisResult.leadPotential)}
          <Badge variant="outline" className="text-xs">
            {analysisResult.provider === 'bedrock' ? '🤖 Powered by AWS Bedrock' : '📋 Mock Analysis'}
          </Badge>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {t('ai:analysis.overallScore')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <ScoreDonut score={analysisResult.overallScore} size="lg" />
          <div className="text-center">
            <p className="text-2xl font-bold">{analysisResult.overallScore}/100 Punkte</p>
            <p className="text-gray-600">
              {analysisResult.overallScore >= 80 && "Sehr gute Online-Präsenz"}
              {analysisResult.overallScore >= 60 && analysisResult.overallScore < 80 && "Solide Basis mit Verbesserungspotential"}
              {analysisResult.overallScore < 60 && "Erhebliches Verbesserungspotential vorhanden"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Platform Analysis */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Detaillierte Plattform-Analyse</h2>
        <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {analysisResult.platformAnalyses.map((platform) => (
            <PlatformProfileCard key={platform.platform} platform={platform} />
          ))}
        </div>
      </div>

      {/* Google Services Metrics (if available) */}
      {(analysisResult.gmb_metrics || analysisResult.ga4_metrics || analysisResult.ads_metrics) && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Google Services Metriken</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Render Google metrics similar to original VisibilityResults */}
            {/* ... GMB, GA4, Ads metrics cards ... */}
          </div>
        </div>
      )}

      {/* Quick Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            {t('ai:analysis.quickWins')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {analysisResult.quickWins.map((win, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <p className="text-sm">{win}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SWOT Analysis - Enhanced for paid users */}
      {showFullAnalysis && analysisResult.swotAnalysis && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="w-5 h-5" />
                {t('ai:analysis.strengths')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisResult.swotAnalysis.strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{item}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Target className="w-5 h-5" />
                {t('ai:analysis.weaknesses')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisResult.swotAnalysis.weaknesses.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{item}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Star className="w-5 h-5" />
                {t('ai:analysis.opportunities')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisResult.swotAnalysis.opportunities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{item}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <BarChart3 className="w-5 h-5" />
                {t('ai:analysis.threats')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysisResult.swotAnalysis.threats.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{item}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations - Enhanced for paid users */}
      {showFullAnalysis && analysisResult.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              {t('ai:analysis.recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResult.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{rec.task}</h4>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                      {rec.priority === 'high' ? 'Hoch' : rec.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Aufwand: {rec.effort}/5</span>
                    <span>Wirkung: {rec.impact}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmarks */}
      {analysisResult.benchmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('ai:analysis.benchmark')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Unternehmen</th>
                    <th className="text-center p-2">Google</th>
                    <th className="text-center p-2">Facebook</th>
                    <th className="text-center p-2">Instagram</th>
                    <th className="text-center p-2">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-blue-50 font-medium">
                    <td className="p-2">{businessName} (Sie)</td>
                    <td className="text-center p-2">{analysisResult.platformAnalyses.find(p => p.platform === 'google')?.score || 0}%</td>
                    <td className="text-center p-2">{analysisResult.platformAnalyses.find(p => p.platform === 'facebook')?.score || 0}%</td>
                    <td className="text-center p-2">{analysisResult.platformAnalyses.find(p => p.platform === 'instagram')?.score || 0}%</td>
                    <td className="text-center p-2 font-bold">{analysisResult.overallScore}%</td>
                  </tr>
                  {analysisResult.benchmarks.map((benchmark, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{benchmark.name}</td>
                      <td className="text-center p-2">{Math.round(benchmark.scores.google)}%</td>
                      <td className="text-center p-2">{Math.round(benchmark.scores.facebook)}%</td>
                      <td className="text-center p-2">{Math.round(benchmark.scores.instagram)}%</td>
                      <td className="text-center p-2 font-medium">{Math.round(benchmark.scores.overall)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Insights */}
      {analysisResult.categoryInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('ai:analysis.categoryInsights')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysisResult.categoryInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {email && onRequestDetailedReport && !reportRequested && (
          <Button onClick={onRequestDetailedReport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Detaillierten PDF-Report anfordern
          </Button>
        )}
        
        {reportRequested && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-green-700 font-medium">
              ✅ Detaillierter Report wurde an {email} gesendet!
            </p>
          </div>
        )}
        
        <Button variant="outline" onClick={onNewAnalysis}>
          Neue Analyse starten
        </Button>
      </div>

      {/* Upgrade Notice for Free Users */}
      {!showFullAnalysis && (
        <Card className="border-primary">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Vollständige SWOT-Analyse verfügbar</h3>
            <p className="text-gray-600 mb-4">
              Erhalten Sie detaillierte Handlungsempfehlungen, Prioritäten und eine vollständige SWOT-Analyse.
            </p>
            <Button className="flex items-center gap-2 mx-auto">
              <Star className="w-4 h-4" />
              Paket buchen für vollständige Analyse
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VisibilityResultsEnhanced;