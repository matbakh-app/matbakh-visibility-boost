
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Facebook, 
  Instagram, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  Mail,
  Lightbulb,
  Target,
  BarChart3
} from 'lucide-react';

interface PlatformAnalysis {
  platform: 'google' | 'facebook' | 'instagram';
  score: number;
  maxScore: number;
  completedFeatures: string[];
  missingFeatures: string[];
  profileUrl?: string;
  recommendations: string[];
}

interface BenchmarkComparison {
  name: string;
  scores: {
    google: number;
    facebook: number;
    instagram: number;
    overall: number;
  };
  profileUrls: {
    google?: string;
    facebook?: string;
    instagram?: string;
  };
}

interface AnalysisResult {
  overallScore: number;
  platformAnalyses: PlatformAnalysis[];
  benchmarks: BenchmarkComparison[];
  categoryInsights: string[];
  quickWins: string[];
  leadPotential: 'high' | 'medium' | 'low';
  reportData: any;
}

interface VisibilityResultsProps {
  businessName: string;
  analysisResult: AnalysisResult;
  onRequestDetailedReport: () => void;
  onNewAnalysis: () => void;
  reportRequested?: boolean;
  email?: string;
}

const VisibilityResults: React.FC<VisibilityResultsProps> = ({
  businessName,
  analysisResult,
  onRequestDetailedReport,
  onNewAnalysis,
  reportRequested = false,
  email
}) => {
  const { overallScore, platformAnalyses, benchmarks, categoryInsights, quickWins, leadPotential } = analysisResult;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google': return <Search className="w-5 h-5 text-blue-600" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-800" />;
      case 'instagram': return <Instagram className="w-5 h-5 text-pink-600" />;
      default: return null;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'google': return 'Google My Business';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      default: return platform;
    }
  };

  const getLeadPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header with Overall Score */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">
            Sichtbarkeits-Analyse für {businessName}
          </CardTitle>
          <div className="flex justify-center">
            <Badge className={`px-3 py-1 text-sm font-medium border ${getLeadPotentialColor(leadPotential)}`}>
              {leadPotential === 'high' && '🎯 Hohes Verbesserungspotenzial'}
              {leadPotential === 'medium' && '📈 Mittleres Verbesserungspotenzial'}
              {leadPotential === 'low' && '✨ Starke Online-Präsenz'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              <p className="text-gray-600">Gesamtbewertung</p>
            </div>
            <div className="w-32 h-32 relative">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="transparent" stroke="#e5e7eb" strokeWidth="8"/>
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="transparent" 
                  stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${(overallScore / 100) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Analysis */}
      <div className="grid md:grid-cols-3 gap-6">
        {platformAnalyses.map((analysis) => (
          <Card key={analysis.platform} className={`${getScoreBackground(analysis.score)} border-2`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                {getPlatformIcon(analysis.platform)}
                <CardTitle className="text-lg">
                  {getPlatformName(analysis.platform)}
                </CardTitle>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                {Math.round(analysis.score)}%
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress 
                value={analysis.score} 
                className="h-2"
              />
              
              <div>
                <h4 className="font-medium text-green-800 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Vorhandene Features ({analysis.completedFeatures.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.completedFeatures.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {analysis.completedFeatures.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{analysis.completedFeatures.length - 3} weitere
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-red-800 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Fehlende Features ({analysis.missingFeatures.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.missingFeatures.slice(0, 3).map((feature, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {analysis.missingFeatures.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{analysis.missingFeatures.length - 3} weitere
                    </Badge>
                  )}
                </div>
              </div>

              {analysis.profileUrl && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={analysis.profileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Profil ansehen
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Wins Section */}
      {quickWins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Sofort umsetzbare Verbesserungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {quickWins.map((win, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-sm">{win}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Category Insights */}
      {categoryInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Branchenspezifische Erkenntnisse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {categoryInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Benchmark Comparison */}
      {benchmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Benchmark-Vergleich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Unternehmen</th>
                    <th className="text-center py-2">Google</th>
                    <th className="text-center py-2">Facebook</th>
                    <th className="text-center py-2">Instagram</th>
                    <th className="text-center py-2">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-blue-50">
                    <td className="py-3 font-medium">{businessName} (Sie)</td>
                    <td className="text-center">
                      <span className={`font-bold ${getScoreColor(platformAnalyses.find(p => p.platform === 'google')?.score || 0)}`}>
                        {Math.round(platformAnalyses.find(p => p.platform === 'google')?.score || 0)}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`font-bold ${getScoreColor(platformAnalyses.find(p => p.platform === 'facebook')?.score || 0)}`}>
                        {Math.round(platformAnalyses.find(p => p.platform === 'facebook')?.score || 0)}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`font-bold ${getScoreColor(platformAnalyses.find(p => p.platform === 'instagram')?.score || 0)}`}>
                        {Math.round(platformAnalyses.find(p => p.platform === 'instagram')?.score || 0)}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`font-bold text-lg ${getScoreColor(overallScore)}`}>
                        {overallScore}%
                      </span>
                    </td>
                  </tr>
                  {benchmarks.map((benchmark, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">{benchmark.name}</td>
                      <td className="text-center">{Math.round(benchmark.scores.google)}%</td>
                      <td className="text-center">{Math.round(benchmark.scores.facebook)}%</td>
                      <td className="text-center">{Math.round(benchmark.scores.instagram)}%</td>
                      <td className="text-center font-medium">{benchmark.scores.overall}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {!reportRequested && (
          <Button onClick={onRequestDetailedReport} className="bg-primary hover:bg-primary/90">
            <Mail className="w-4 h-4 mr-2" />
            Detaillierten Bericht per E-Mail anfordern
          </Button>
        )}
        
        {reportRequested && email && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-medium">Detaillierter Bericht wird versendet</p>
            <p className="text-green-700 text-sm">
              Ihr PDF-Report mit SWOT-Analyse und Handlungsempfehlungen wird in Kürze an {email} gesendet.
            </p>
          </div>
        )}

        <Button variant="outline" onClick={onNewAnalysis}>
          <Search className="w-4 h-4 mr-2" />
          Neue Analyse starten
        </Button>
      </div>

      {/* Next Steps Teaser */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <h3 className="font-bold text-lg mb-2">🚀 Möchten Sie Ihre Sichtbarkeit verbessern?</h3>
          <p className="text-gray-700 mb-4">
            Basierend auf Ihrer Analyse können wir Ihnen maßgeschneiderte Lösungen anbieten, 
            um Ihre Online-Präsenz zu optimieren und mehr Kunden zu gewinnen.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              Kostenlose Beratung vereinbaren
            </Button>
            <Button variant="outline">
              Mehr über unsere Services erfahren
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisibilityResults;
