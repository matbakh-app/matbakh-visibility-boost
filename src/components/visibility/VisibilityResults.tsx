
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
  Download
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

interface VisibilityResultsProps {
  businessName: string;
  overallScore: number;
  platformAnalyses: PlatformAnalysis[];
  benchmarks: BenchmarkComparison[];
  reportRequested: boolean;
  email?: string;
  onRequestDetailedReport: () => void;
  onNewAnalysis: () => void;
}

const VisibilityResults: React.FC<VisibilityResultsProps> = ({
  businessName,
  overallScore,
  platformAnalyses,
  benchmarks,
  reportRequested,
  email,
  onRequestDetailedReport,
  onNewAnalysis
}) => {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header with Overall Score */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">
            Sichtbarkeits-Analyse für {businessName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(overallScore, 100)}`}>
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
          <Card key={analysis.platform} className={`${getScoreBackground(analysis.score, analysis.maxScore)} border-2`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                {getPlatformIcon(analysis.platform)}
                <CardTitle className="text-lg">
                  {getPlatformName(analysis.platform)}
                </CardTitle>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(analysis.score, analysis.maxScore)}`}>
                {Math.round((analysis.score / analysis.maxScore) * 100)}%
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress 
                value={(analysis.score / analysis.maxScore) * 100} 
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
                      <span className={`font-bold ${getScoreColor(platformAnalyses.find(p => p.platform === 'google')?.score || 0, 100)}`}>
                        {Math.round((platformAnalyses.find(p => p.platform === 'google')?.score || 0) / (platformAnalyses.find(p => p.platform === 'google')?.maxScore || 100) * 100)}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`font-bold ${getScoreColor(platformAnalyses.find(p => p.platform === 'facebook')?.score || 0, 100)}`}>
                        {Math.round((platformAnalyses.find(p => p.platform === 'facebook')?.score || 0) / (platformAnalyses.find(p => p.platform === 'facebook')?.maxScore || 100) * 100)}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`font-bold ${getScoreColor(platformAnalyses.find(p => p.platform === 'instagram')?.score || 0, 100)}`}>
                        {Math.round((platformAnalyses.find(p => p.platform === 'instagram')?.score || 0) / (platformAnalyses.find(p => p.platform === 'instagram')?.maxScore || 100) * 100)}%
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`font-bold text-lg ${getScoreColor(overallScore, 100)}`}>
                        {overallScore}%
                      </span>
                    </td>
                  </tr>
                  {benchmarks.map((benchmark, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">{benchmark.name}</td>
                      <td className="text-center">{benchmark.scores.google}%</td>
                      <td className="text-center">{benchmark.scores.facebook}%</td>
                      <td className="text-center">{benchmark.scores.instagram}%</td>
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
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            Kostenlose Beratung vereinbaren
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisibilityResults;
