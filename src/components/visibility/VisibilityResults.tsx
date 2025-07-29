
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Star, Users, TrendingUp, BarChart3, MousePointer, Eye } from 'lucide-react';
import type { AnalysisResult } from '@/types/visibility';
import PlatformProfileCard from './PlatformProfileCard';

interface VisibilityResultsProps {
  businessName: string;
  analysisResult: AnalysisResult & {
    gmb_metrics?: any;
    ga4_metrics?: any; 
    ads_metrics?: any;
    todos?: Array<{
      type: string;
      priority: 'high' | 'medium' | 'low';
      text: string;
      why: string;
    }>;
    is_fully_satisfied?: boolean;
    full_report_url?: string;
  };
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
        <div className="flex flex-col items-center gap-2">
          {/* Satisfaction Badge */}
          {analysisResult.is_fully_satisfied && (
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                ✅ 100% Satisfied - Perfekte Online-Präsenz!
              </Badge>
              {analysisResult.full_report_url && (
                <Button asChild size="sm">
                  <a href={analysisResult.full_report_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Vollständigen Report herunterladen
                  </a>
                </Button>
              )}
            </div>
          )}
          {getLeadPotentialBadge(analysisResult.leadPotential)}
          <Badge variant="outline" className="text-xs">
            {analysisResult.provider === 'bedrock' ? '🤖 Powered by Bedrock AI' : '📋 Mock Analysis'}
          </Badge>
        </div>
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

      {/* Google Metrics Section */}
      {(analysisResult.gmb_metrics || analysisResult.ga4_metrics || analysisResult.ads_metrics) && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Google Services Metriken</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Google My Business Metrics */}
            {analysisResult.gmb_metrics && Object.keys(analysisResult.gmb_metrics).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">🔍</span>
                    Google My Business
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.gmb_metrics.rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Bewertung:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{analysisResult.gmb_metrics.rating}</span>
                      </div>
                    </div>
                  )}
                  {analysisResult.gmb_metrics.reviewCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Bewertungen:</span>
                      <span className="font-medium">{analysisResult.gmb_metrics.reviewCount}</span>
                    </div>
                  )}
                  {analysisResult.gmb_metrics.profileComplete !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Profil vollständig:</span>
                      <span className={`font-medium ${analysisResult.gmb_metrics.profileComplete ? 'text-green-600' : 'text-red-600'}`}>
                        {analysisResult.gmb_metrics.profileComplete ? 'Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                  {analysisResult.gmb_metrics.hasPhotos !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Fotos vorhanden:</span>
                      <span className={`font-medium ${analysisResult.gmb_metrics.hasPhotos ? 'text-green-600' : 'text-red-600'}`}>
                        {analysisResult.gmb_metrics.hasPhotos ? 'Ja' : 'Nein'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Google Analytics 4 Metrics */}
            {analysisResult.ga4_metrics && Object.keys(analysisResult.ga4_metrics).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Google Analytics 4
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.ga4_metrics.sessions !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sitzungen:</span>
                      <span className="font-medium">{analysisResult.ga4_metrics.sessions.toLocaleString()}</span>
                    </div>
                  )}
                  {analysisResult.ga4_metrics.pageviews !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Seitenaufrufe:</span>
                      <span className="font-medium">{analysisResult.ga4_metrics.pageviews.toLocaleString()}</span>
                    </div>
                  )}
                  {analysisResult.ga4_metrics.bounceRate !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Absprungrate:</span>
                      <span className="font-medium">{(analysisResult.ga4_metrics.bounceRate * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  {analysisResult.ga4_metrics.avgSessionDuration !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ø Sitzungsdauer:</span>
                      <span className="font-medium">{Math.round(analysisResult.ga4_metrics.avgSessionDuration)}s</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Google Ads Metrics */}
            {analysisResult.ads_metrics && Object.keys(analysisResult.ads_metrics).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="w-5 h-5" />
                    Google Ads
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisResult.ads_metrics.impressions !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Impressions:</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{analysisResult.ads_metrics.impressions.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {analysisResult.ads_metrics.clicks !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Klicks:</span>
                      <span className="font-medium">{analysisResult.ads_metrics.clicks.toLocaleString()}</span>
                    </div>
                  )}
                  {analysisResult.ads_metrics.ctr !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">CTR:</span>
                      <span className="font-medium">{(analysisResult.ads_metrics.ctr * 100).toFixed(2)}%</span>
                    </div>
                  )}
                  {analysisResult.ads_metrics.cost !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Kosten:</span>
                      <span className="font-medium">€{analysisResult.ads_metrics.cost.toFixed(2)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* To-Dos Section */}
      {analysisResult.todos && analysisResult.todos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-orange-500" />
              To-Dos zur Verbesserung Ihrer Sichtbarkeit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResult.todos.map((todo, idx) => {
                const priorityColor = {
                  high: 'bg-red-50 border-red-200',
                  medium: 'bg-yellow-50 border-yellow-200',
                  low: 'bg-blue-50 border-blue-200'
                }[todo.priority];
                
                const priorityBadge = {
                  high: <Badge variant="destructive" className="text-xs">Hoch</Badge>,
                  medium: <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Mittel</Badge>,
                  low: <Badge variant="outline" className="text-xs">Niedrig</Badge>
                }[todo.priority];

                return (
                  <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg border ${priorityColor}`}>
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">{todo.type}</h4>
                        {priorityBadge}
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{todo.text}</p>
                      <p className="text-xs text-gray-600 italic">{todo.why}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
