import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Eye, 
  Star, 
  ArrowRight, 
  Crown, 
  BarChart3, 
  Users, 
  Globe,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useUserJourney } from '@/services/UserJourneyManager';
import { useAuth } from '@/contexts/AuthContext';

export const VCPublicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { getVCData } = useUserJourney();
  
  const vcData = getVCData();
  const businessName = vcData?.businessName || 'Ihr Restaurant';

  // Mock analysis results for SX (free) level
  const analysisResults = {
    overallScore: 45,
    googleScore: 38,
    websiteScore: 52,
    socialScore: 41,
    visibility: 'Verbesserungsbedarf',
    recommendations: [
      'Google My Business Profil optimieren',
      'Website für mobile Geräte anpassen',
      'Social Media Präsenz aufbauen'
    ]
  };

  const handleUpgrade = () => {
    if (!user) {
      openAuthModal('register');
    } else {
      navigate('/angebote');
    }
  };

  const handleNewAnalysis = () => {
    navigate('/visibilitycheck/onboarding/step1');
  };

  const handleLogin = () => {
    openAuthModal('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sichtbarkeitsanalyse für {businessName}
              </h1>
              <p className="text-gray-600 mt-1">
                Kostenlose Basis-Analyse • Upgraden Sie für detailliertere Insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Eye className="w-3 h-3 mr-1" />
                SX Version
              </Badge>
              {!user && (
                <Button variant="outline" onClick={handleLogin}>
                  Anmelden
                </Button>
              )}
              <Button onClick={handleUpgrade} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Crown className="w-4 h-4 mr-2" />
                Upgraden
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  Gesamtbewertung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {analysisResults.overallScore}
                    </div>
                    <div className="text-sm text-gray-500">von 100 Punkten</div>
                  </div>
                  <div className="flex-1">
                    <Progress value={analysisResults.overallScore} className="h-3 mb-2" />
                    <p className="text-sm text-gray-600">
                      <strong>Status:</strong> {analysisResults.visibility}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Google</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-500 mb-1">
                    {analysisResults.googleScore}
                  </div>
                  <Progress value={analysisResults.googleScore} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Website</span>
                  </div>
                  <div className="text-2xl font-bold text-green-500 mb-1">
                    {analysisResults.websiteScore}
                  </div>
                  <Progress value={analysisResults.websiteScore} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Social Media</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-500 mb-1">
                    {analysisResults.socialScore}
                  </div>
                  <Progress value={analysisResults.socialScore} className="h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Quick Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Sofort-Tipps (SX Version)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResults.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-700">Premium-Features verfügbar</span>
                  </div>
                  <p className="text-sm text-purple-600 mb-3">
                    Detaillierte SWOT-Analyse, Konkurrenzvergleich und Schritt-für-Schritt Handlungsplan
                  </p>
                  <Button onClick={handleUpgrade} size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Jetzt upgraden
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upgrade CTA */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Crown className="w-5 h-5" />
                  Upgrade zu Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Vollständige SWOT-Analyse</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Konkurrenz-Benchmarking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Handlungsempfehlungen</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Monatliche Updates</span>
                  </div>
                </div>
                <Button onClick={handleUpgrade} className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600">
                  Ab 8€/Monat upgraden
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Weitere Aktionen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleNewAnalysis} variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Neue Analyse starten
                </Button>
                
                {!user && (
                  <Button onClick={handleLogin} variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Konto erstellen
                  </Button>
                )}
                
                <Button 
                  onClick={() => navigate('/angebote')} 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Alle Pakete vergleichen
                </Button>
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700 font-medium mb-1">
                      Kostenlose SX-Version
                    </p>
                    <p className="text-xs text-blue-600">
                      Diese Analyse zeigt Grundbewertungen. Für detaillierte Insights und Handlungsempfehlungen upgraden Sie auf Premium.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};