import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Eye, 
  Star, 
  Crown, 
  BarChart3, 
  Users, 
  Globe,
  CheckCircle,
  Zap,
  Target,
  Calendar,
  Download,
  Settings
} from 'lucide-react';
import { useUserJourney } from '@/services/UserJourneyManager';
import { useAuth } from '@/contexts/AuthContext';

// Subscription levels
type SubscriptionLevel = 'basic' | 'business' | 'premium';

export const VCMemberDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getVCData } = useUserJourney();
  
  const vcData = getVCData();
  const businessName = vcData?.businessName || 'Ihr Restaurant';
  
  // Mock user subscription level - in real app this would come from user data
  const subscriptionLevel: SubscriptionLevel = 'business'; // basic, business, premium

  const getSubscriptionInfo = (level: SubscriptionLevel) => {
    switch (level) {
      case 'basic':
        return {
          name: 'Basic',
          price: '8€/Monat',
          color: 'blue',
          features: ['1x VC pro Monat', 'Basis-Report', '3 Handlungsempfehlungen']
        };
      case 'business':
        return {
          name: 'Business',
          price: '39€/Monat',
          color: 'purple',
          features: ['SWOT-Analyse', 'Konkurrenzvergleich', 'KPIs & Trends', '1 Kanal-Management']
        };
      case 'premium':
        return {
          name: 'Premium',
          price: '79€/Monat',
          color: 'gold',
          features: ['Vollständiges Dashboard', 'Unbegrenzte VCs', '3 Kanäle Management', 'Automatisierung']
        };
    }
  };

  const subscription = getSubscriptionInfo(subscriptionLevel);

  // Enhanced analysis results based on subscription level
  const analysisResults = {
    overallScore: subscriptionLevel === 'basic' ? 45 : subscriptionLevel === 'business' ? 67 : 82,
    googleScore: subscriptionLevel === 'basic' ? 38 : 65,
    websiteScore: subscriptionLevel === 'basic' ? 52 : 71,
    socialScore: subscriptionLevel === 'basic' ? 41 : 58,
    visibility: subscriptionLevel === 'basic' ? 'Verbesserungsbedarf' : subscriptionLevel === 'business' ? 'Gut' : 'Sehr gut',
    recommendations: subscriptionLevel === 'basic' 
      ? ['Google My Business optimieren', 'Website verbessern', 'Social Media aufbauen']
      : subscriptionLevel === 'business'
      ? ['Content-Strategie entwickeln', 'Bewertungsmanagement', 'Local SEO optimieren', 'Social Media Automatisierung']
      : ['KI-basierte Personalisierung', 'Omnichannel-Strategie', 'Predictive Analytics nutzen', 'Automatisierte Kampagnen', 'Kundenjourney optimieren']
  };

  const handleUpgrade = () => {
    navigate('/angebote');
  };

  const handleNewAnalysis = () => {
    navigate('/visibilitycheck/onboarding/step1');
  };

  const handleSettings = () => {
    navigate('/dashboard/settings');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Dashboard für {businessName}
              </h1>
              <p className="text-muted-foreground mt-1">
                Willkommen zurück, {user?.email?.split('@')[0] || 'User'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant="secondary" 
                className={`${
                  subscription.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                  subscription.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}
              >
                <Crown className="w-3 h-3 mr-1" />
                {subscription.name} Plan
              </Badge>
              <Button variant="outline" onClick={handleSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Einstellungen
              </Button>
              {subscriptionLevel !== 'premium' && (
                <Button onClick={handleUpgrade} className="bg-gradient-to-r from-purple-600 to-blue-600">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgraden
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
            <TabsTrigger value="recommendations">Empfehlungen</TabsTrigger>
            <TabsTrigger value="management" disabled={subscriptionLevel === 'basic'}>
              Kanal-Management
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Metrics */}
              <div className="lg:col-span-2 space-y-6">
                {/* Overall Score */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      Sichtbarkeits-Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {analysisResults.overallScore}
                        </div>
                        <div className="text-sm text-muted-foreground">von 100 Punkten</div>
                      </div>
                      <div className="flex-1">
                        <Progress value={analysisResults.overallScore} className="h-3 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          <strong>Status:</strong> {analysisResults.visibility}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Breakdown */}
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
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Current Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Ihr Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold">{subscription.name}</div>
                      <div className="text-muted-foreground">{subscription.price}</div>
                    </div>
                    <div className="space-y-2">
                      {subscription.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    {subscriptionLevel !== 'premium' && (
                      <Button onClick={handleUpgrade} className="w-full mt-4">
                        Upgraden
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Schnellaktionen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={handleNewAnalysis} variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Neue Analyse
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Report herunterladen
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Termine planen
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Detaillierte Analyse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Erweiterte Analyse-Features werden hier angezeigt basierend auf Ihrem {subscription.name} Plan.
                </p>
                {subscriptionLevel === 'basic' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-700 text-sm">
                      Upgraden Sie auf Business oder Premium für SWOT-Analyse, Konkurrenzvergleich und erweiterte Metriken.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Target className="w-5 h-5" />
                  Handlungsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-medium">{rec}</span>
                        {subscriptionLevel !== 'basic' && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Detaillierte Umsetzungsschritte verfügbar in Ihrem {subscription.name} Plan.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channel Management Tab */}
          <TabsContent value="management">
            <Card>
              <CardHeader>
                <CardTitle>Kanal-Management</CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionLevel === 'basic' ? (
                  <div className="text-center py-8">
                    <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
                    <p className="text-muted-foreground mb-4">
                      Kanal-Management ist verfügbar ab dem Business Plan.
                    </p>
                    <Button onClick={handleUpgrade}>
                      Jetzt upgraden
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Kanal-Management Features werden hier angezeigt für {subscription.name} Plan.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};