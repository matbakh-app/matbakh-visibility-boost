import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitch from '@/components/LanguageSwitch';
import { 
  Star, 
  TrendingUp, 
  Users, 
  Euro, 
  MapPin, 
  Calendar,
  BarChart3,
  Target,
  Lightbulb,
  Crown,
  Sparkles
} from 'lucide-react';

interface VCResultData {
  business_info: {
    name: string;
    location: string;
    category: string;
  };
  visibility_score: {
    overall_score: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    change: string;
    subscores: {
      google_presence: number;
      social_media: number;
      website_quality: number;
      review_management: number;
    };
  };
  quick_stats: {
    avg_rating: number;
    occupancy_today: number;
    revenue_today: number;
    guests_today: number;
  };
  premium_analyses: {
    swot: boolean;
    cultural_analysis: boolean;
    balanced_scorecard: boolean;
    action_recommendations: boolean;
  };
}

export default function VCResultDashboard() {
  const { t, i18n } = useTranslation(['vc_result', 'common']);
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<VCResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('t');

  useEffect(() => {
    const fetchVCResult = async () => {
      if (!token) {
        setError('No token provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/vc-result?token=${token}`);
        if (!response.ok) {
          throw new Error('Failed to fetch VC result');
        }
        
        const result = await response.json();
        
        // Mock data for demo - replace with actual API response
        const mockData: VCResultData = {
          business_info: {
            name: result.data?.business_name || 'Ihr Restaurant',
            location: 'Berlin Mitte',
            category: 'Restaurant'
          },
          visibility_score: {
            overall_score: 78,
            confidence: 0.92,
            trend: 'up',
            change: '+12%',
            subscores: {
              google_presence: 85,
              social_media: 65,
              website_quality: 72,
              review_management: 88
            }
          },
          quick_stats: {
            avg_rating: 4.6,
            occupancy_today: 87,
            revenue_today: 3200,
            guests_today: 142
          },
          premium_analyses: {
            swot: false,
            cultural_analysis: false,
            balanced_scorecard: false,
            action_recommendations: false
          }
        };
        
        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchVCResult();
  }, [token]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || 'Failed to load visibility check results'}
            </p>
            <Button 
              className="mt-4 w-full" 
              onClick={() => window.location.href = '/vc/quick'}
            >
              Start New Check
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Visibility Check</h1>
                  <p className="text-sm text-muted-foreground">Ergebnis Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <LanguageSwitch />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Business Info Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span>{data.business_info.location}</span>
            <span>•</span>
            <span>{data.business_info.category}</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{data.business_info.name}</h2>
          <p className="text-muted-foreground">
            Ihre Sichtbarkeitsanalyse wurde erfolgreich abgeschlossen
          </p>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {data.quick_stats.avg_rating}
              </div>
              <div className="text-sm text-muted-foreground">
                Durchschnittsbewertung
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {data.quick_stats.occupancy_today}%
              </div>
              <div className="text-sm text-muted-foreground">
                Auslastung heute
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-3">
                <Euro className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                €{(data.quick_stats.revenue_today / 1000).toFixed(1)}K
              </div>
              <div className="text-sm text-muted-foreground">
                Umsatz heute
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {data.quick_stats.guests_today}
              </div>
              <div className="text-sm text-muted-foreground">
                Gäste heute
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Visibility Score */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Sichtbarkeits-Score</span>
                  <Badge variant="secondary" className="ml-auto">
                    {data.visibility_score.change}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold mb-2 ${getScoreColor(data.visibility_score.overall_score)}`}>
                    {data.visibility_score.overall_score}
                  </div>
                  <div className="text-muted-foreground">
                    von 100 Punkten (Vertrauen: {Math.round(data.visibility_score.confidence * 100)}%)
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h4 className="font-semibold mb-3">Detailbewertung</h4>
                  
                  {Object.entries(data.visibility_score.subscores).map(([key, score]) => {
                    const labels = {
                      google_presence: 'Google Präsenz',
                      social_media: 'Social Media',
                      website_quality: 'Website Qualität',
                      review_management: 'Bewertungsmanagement'
                    };
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm">{labels[key as keyof typeof labels]}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                score >= 80 ? 'bg-green-500' : 
                                score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                            {score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Action Items */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5" />
                  <span>Sofortige Maßnahmen</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Stärken nutzen</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Ihre Bewertungen sind ausgezeichnet. Teilen Sie positive Reviews in sozialen Medien.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium text-yellow-800">Verbesserung möglich</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Social Media Präsenz ausbau. Regelmäßige Posts können Ihre Sichtbarkeit um 25% steigern.
                  </p>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-800">Dringend</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Website-Ladezeit optimieren. Langsame Seiten kosten bis zu 30% der Besucher.
                  </p>
                </div>

                <Button className="w-full mt-4">
                  Detaillierte Empfehlungen anzeigen
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Premium Analysis Widgets */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-6">Premium Analysen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* SWOT Analysis */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <Badge className="mb-3">Premium</Badge>
                <h4 className="font-semibold mb-2">SWOT Analyse</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Strategische Analyse Ihrer Stärken, Schwächen, Chancen und Risiken
                </p>
                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    Jetzt Stärken nutzen
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Upgrade buchen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cultural Analysis */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <Badge className="mb-3">Premium</Badge>
                <h4 className="font-semibold mb-2">Umfeld-Analyse</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Kulturelle Marktanalyse basierend auf Hofstede-Dimensionen
                </p>
                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    Jetzt aktivieren
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Upgrade buchen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Balanced Scorecard */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <Badge className="mb-3">Premium</Badge>
                <h4 className="font-semibold mb-2">Balanced Scorecard</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ganzheitliches KPI-Bewertungssystem für Ihr Restaurant
                </p>
                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    Neue Perspektiven sichern
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Upgrade buchen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Recommendations */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <Badge className="mb-3">Premium</Badge>
                <h4 className="font-semibold mb-2">Handlungsempfehlungen</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  KI-gestützte, personalisierte Empfehlungen für Ihr Business
                </p>
                <div className="space-y-2">
                  <Button className="w-full" size="sm">
                    Empfehlungen erhalten
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Upgrade buchen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Bereit, Ihre Sichtbarkeit zu maximieren?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Nutzen Sie unsere professionellen Services, um Ihre Online-Präsenz zu optimieren 
              und mehr Kunden zu gewinnen. Starten Sie noch heute!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Kostenlose Beratung buchen
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                Services ansehen
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}