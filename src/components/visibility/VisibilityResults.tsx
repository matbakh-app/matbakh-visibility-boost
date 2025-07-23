import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Star, Users, Camera, Clock, TrendingUp, CheckCircle2, AlertCircle, ExternalLink, MapPin, Phone } from 'lucide-react';
import type { AnalysisResult } from '@/types/visibility';

interface VisibilityResultsProps {
  businessName: string;
  analysisResult: AnalysisResult;
  onRequestDetailedReport: () => void;
  onNewAnalysis: () => void;
  reportRequested: boolean;
  email?: string;
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

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'google': return '🔍';
    case 'facebook': return '📘';
    case 'instagram': return '📷';
    default: return '📊';
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'google': return 'border-blue-500';
    case 'facebook': return 'border-blue-600';
    case 'instagram': return 'border-pink-500';
    default: return 'border-gray-500';
  }
};

const getLeadPotentialBadge = (potential: string) => {
  switch (potential) {
    case 'high':
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Hoher Verbesserungsbedarf</Badge>;
    case 'medium':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Mittleres Potential</Badge>;
    case 'low':
      return <Badge variant="outline" className="bg-green-100 text-green-800">Gute Basis</Badge>;
    default:
      return <Badge variant="outline">Unbekannt</Badge>;
  }
};

const PlatformProfileCard: React.FC<{ platform: any }> = ({ platform }) => {
  return (
    <Card className={`border-2 ${getPlatformColor(platform.platform)}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 capitalize">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getPlatformIcon(platform.platform)}</span>
            <span>{platform.platform}</span>
            {platform.autoDetected && (
              <Badge variant="secondary" className="text-xs">Auto-erkannt</Badge>
            )}
          </div>
          {platform.profileUrl && (
            <a 
              href={platform.profileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-auto"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 hover:text-blue-800" />
            </a>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Picture and Basic Info */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <ScoreDonut score={platform.score} size="sm" />
          </div>
          
          {platform.profilePicture && (
            <div className="flex-shrink-0">
              <img 
                src={platform.profilePicture} 
                alt={`${platform.platform} Profilbild`}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">{platform.score}/100</p>
              {platform.followerCount && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{platform.followerCount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {platform.profileFound ? 'Profil gefunden' : 'Kein Profil gefunden'}
            </p>
          </div>
        </div>

        {/* Special Features for Google */}
        {platform.platform === 'google' && platform.profileFound && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {platform.reservationAvailable && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Reservierung</span>
              </div>
            )}
            {platform.hasHolidayHours && (
              <div className="flex items-center gap-1 text-green-600">
                <Clock className="w-3 h-3" />
                <span>Feiertagszeiten</span>
              </div>
            )}
            {platform.askSectionVisible && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Fragen & Antworten</span>
              </div>
            )}
            {platform.isListingComplete && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Vollständig</span>
              </div>
            )}
          </div>
        )}

        {/* Category Info */}
        {platform.category && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Kategorie: </span>
            {platform.category}
          </div>
        )}
        
        {/* Completed Features */}
        {platform.completedFeatures.length > 0 && (
          <div>
            <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Vorhanden
            </h4>
            <ul className="text-sm space-y-1">
              {platform.completedFeatures.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="text-green-600">• {feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Features */}
        {platform.missingFeatures.length > 0 && (
          <div>
            <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Fehlt
            </h4>
            <ul className="text-sm space-y-1">
              {platform.missingFeatures.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="text-red-600">• {feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Recommendations */}
        {platform.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Top Empfehlungen</h4>
            <ul className="text-sm space-y-1">
              {platform.recommendations.slice(0, 2).map((rec, idx) => (
                <li key={idx} className="text-blue-600">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const VisibilityResults: React.FC<VisibilityResultsProps> = ({ 
  businessName, 
  analysisResult, 
  onRequestDetailedReport, 
  onNewAnalysis,
  reportRequested,
  email 
}) => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Sichtbarkeits-Analyse für {businessName}</h1>
        <p className="text-gray-600">Umfassende Bewertung Ihrer Online-Präsenz mit Profildaten</p>
        {getLeadPotentialBadge(analysisResult.leadPotential)}
      </div>

      {/* Overall Score */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Gesamt-Sichtbarkeit
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

      {/* Platform Analysis with Profile Data */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Detaillierte Plattform-Analyse</h2>
        <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {analysisResult.platformAnalyses.map((platform) => (
            <PlatformProfileCard key={platform.platform} platform={platform} />
          ))}
        </div>
      </div>

      {/* Quick Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Sofortige Verbesserungen (Quick Wins)
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

      {/* Benchmarks */}
      {analysisResult.benchmarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Benchmark-Vergleich
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
            <CardTitle>Branchenspezifische Erkenntnisse</CardTitle>
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
        {email && !reportRequested && (
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
    </div>
  );
};

export default VisibilityResults;
