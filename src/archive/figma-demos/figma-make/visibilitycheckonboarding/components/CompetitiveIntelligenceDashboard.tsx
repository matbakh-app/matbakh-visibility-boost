import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  MapPin, 
  DollarSign, 
  Users, 
  Clock, 
  Globe, 
  Phone, 
  Mail, 
  Camera, 
  MessageSquare, 
  Heart, 
  Share2, 
  Award, 
  AlertCircle, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  Utensils,
  Calendar,
  BarChart3
} from 'lucide-react';

type UserPlan = 'basic' | 'business' | 'premium';

interface Competitor {
  id: string;
  name: string;
  category: string;
  distance: number;
  rating: number;
  reviews: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  visibility: {
    google: number;
    social: number;
    reviews: number;
    overall: number;
  };
  metrics: {
    monthlyVisitors: number;
    avgOrderValue: number;
    socialFollowers: number;
    onlinePresence: number;
  };
  strengths: string[];
  weaknesses: string[];
  marketShare: number;
  trend: 'up' | 'down' | 'neutral';
  lastAnalyzed: string;
}

interface CompetitiveIntelligenceDashboardProps {
  userPlan: UserPlan;
  onUpgrade: () => void;
}

const mockCompetitors: Competitor[] = [
  {
    id: 'comp1',
    name: 'Ristorante Milano',
    category: 'Italienisch',
    distance: 0.3,
    rating: 4.5,
    reviews: 847,
    priceRange: '$$$',
    visibility: {
      google: 92,
      social: 78,
      reviews: 85,
      overall: 85
    },
    metrics: {
      monthlyVisitors: 3200,
      avgOrderValue: 45,
      socialFollowers: 2840,
      onlinePresence: 88
    },
    strengths: ['Starke Google Präsenz', 'Hohe Bewertungsanzahl', 'Aktive Social Media'],
    weaknesses: ['Schwache Abend-Präsenz', 'Limitierte Online-Bestellungen'],
    marketShare: 24,
    trend: 'up',
    lastAnalyzed: '2024-01-15'
  },
  {
    id: 'comp2',
    name: 'Burger Palace',
    category: 'Fast Food',
    distance: 0.8,
    rating: 4.2,
    reviews: 1203,
    priceRange: '$$',
    visibility: {
      google: 76,
      social: 94,
      reviews: 72,
      overall: 81
    },
    metrics: {
      monthlyVisitors: 4500,
      avgOrderValue: 18,
      socialFollowers: 5240,
      onlinePresence: 76
    },
    strengths: ['Sehr starke Social Media', 'Hohe Besucherzahlen', 'Delivery-optimiert'],
    weaknesses: ['Niedrigere Bewertungen', 'Begrenzte Abendkarte'],
    marketShare: 31,
    trend: 'up',
    lastAnalyzed: '2024-01-14'
  },
  {
    id: 'comp3',
    name: 'Sushi Dreams',
    category: 'Japanisch',
    distance: 1.2,
    rating: 4.7,
    reviews: 456,
    priceRange: '$$$$',
    visibility: {
      google: 68,
      social: 54,
      reviews: 91,
      overall: 71
    },
    metrics: {
      monthlyVisitors: 1800,
      avgOrderValue: 68,
      socialFollowers: 980,
      onlinePresence: 62
    },
    strengths: ['Exzellente Bewertungen', 'Premium-Positionierung', 'Qualitätsfokus'],
    weaknesses: ['Schwache Social Media', 'Begrenzte Reichweite', 'Hohe Preise'],
    marketShare: 12,
    trend: 'neutral',
    lastAnalyzed: '2024-01-13'
  },
  {
    id: 'comp4',
    name: 'Café Central',
    category: 'Café',
    distance: 0.5,
    rating: 4.3,
    reviews: 324,
    priceRange: '$$',
    visibility: {
      google: 58,
      social: 45,
      reviews: 67,
      overall: 57
    },
    metrics: {
      monthlyVisitors: 2100,
      avgOrderValue: 12,
      socialFollowers: 1240,
      onlinePresence: 48
    },
    strengths: ['Gemütliche Atmosphäre', 'Stammkunden-loyal'],
    weaknesses: ['Schwache Online-Präsenz', 'Begrenzte Marketing-Aktivität', 'Veraltete Website'],
    marketShare: 8,
    trend: 'down',
    lastAnalyzed: '2024-01-12'
  }
];

const marketInsights = {
  totalMarketSize: '€2.4M',
  growthRate: 8.5,
  averageRating: 4.3,
  competitorCount: 23,
  marketLeader: 'Burger Palace',
  emergingTrend: 'Plant-based Options',
  seasonalPeak: 'Dezember (+23%)',
  customerPreference: 'Online Ordering'
};

export function CompetitiveIntelligenceDashboard({ 
  userPlan, 
  onUpgrade 
}: CompetitiveIntelligenceDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('overall');

  const filteredCompetitors = selectedCategory === 'all' 
    ? mockCompetitors 
    : mockCompetitors.filter(comp => comp.category.toLowerCase().includes(selectedCategory));

  const sortedCompetitors = [...filteredCompetitors].sort((a, b) => {
    switch (sortBy) {
      case 'overall':
        return b.visibility.overall - a.visibility.overall;
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        return a.distance - b.distance;
      case 'marketshare':
        return b.marketShare - a.marketShare;
      default:
        return 0;
    }
  });

  const getPriceRangeSymbol = (priceRange: Competitor['priceRange']) => {
    return priceRange;
  };

  const getTrendIcon = (trend: Competitor['trend']) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-success" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-error" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  const getVisibilityColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  const isFeatureLocked = userPlan === 'basic';

  if (isFeatureLocked) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center border-warning/20 bg-warning/5">
          <div className="w-16 h-16 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-xl font-bold mb-2">🎯 Competitive Intelligence</h3>
          <p className="text-muted-foreground mb-6">
            Analysieren Sie Ihre Konkurrenz und identifizieren Sie Marktchancen
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
            <div className="p-4 bg-background rounded-lg">
              <h4 className="font-medium mb-2">🏢 Competitor Analysis</h4>
              <ul className="space-y-1 text-muted-foreground text-left">
                <li>• Detaillierte Konkurrenz-Profile</li>
                <li>• Visibility-Score Vergleiche</li>
                <li>• Stärken/Schwächen Analyse</li>
              </ul>
            </div>
            
            <div className="p-4 bg-background rounded-lg">
              <h4 className="font-medium mb-2">📊 Market Intelligence</h4>
              <ul className="space-y-1 text-muted-foreground text-left">
                <li>• Marktanteil-Analyse</li>
                <li>• Trend-Identifikation</li>
                <li>• Preis-Benchmarking</li>
              </ul>
            </div>
            
            <div className="p-4 bg-background rounded-lg">
              <h4 className="font-medium mb-2">🎯 Strategic Insights</h4>
              <ul className="space-y-1 text-muted-foreground text-left">
                <li>• Opportunity Gaps</li>
                <li>• Competitive Positioning</li>
                <li>• Action Recommendations</li>
              </ul>
            </div>
          </div>
          
          <Button onClick={onUpgrade} size="lg">
            <Target className="w-5 h-5 mr-2" />
            Business Plan upgraden
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🎯 Competitive Intelligence</h2>
          <p className="text-muted-foreground">
            Marktanalyse und Wettbewerber-Insights für strategische Entscheidungen
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              <SelectItem value="italienisch">Italienisch</SelectItem>
              <SelectItem value="fast">Fast Food</SelectItem>
              <SelectItem value="japanisch">Japanisch</SelectItem>
              <SelectItem value="café">Café</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Visibility</SelectItem>
              <SelectItem value="rating">Bewertung</SelectItem>
              <SelectItem value="distance">Entfernung</SelectItem>
              <SelectItem value="marketshare">Marktanteil</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <Badge variant="outline">Markt</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Marktgröße</p>
            <div className="text-2xl font-bold">{marketInsights.totalMarketSize}</div>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-3 h-3 text-success" />
              <span className="font-medium text-success">+{marketInsights.growthRate}%</span>
              <span className="text-muted-foreground">Wachstum</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-success" />
            </div>
            <Badge variant="outline">Qualität</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Ø Bewertung</p>
            <div className="text-2xl font-bold">{marketInsights.averageRating}/5</div>
            <div className="text-sm text-muted-foreground">
              {marketInsights.competitorCount} Wettbewerber
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <Badge variant="outline">Trend</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Emerging Trend</p>
            <div className="text-sm font-bold">{marketInsights.emergingTrend}</div>
            <div className="text-sm text-muted-foreground">
              Peak: {marketInsights.seasonalPeak}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-error" />
            </div>
            <Badge variant="outline">Leader</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Marktführer</p>
            <div className="text-sm font-bold">{marketInsights.marketLeader}</div>
            <div className="text-sm text-muted-foreground">
              Präferenz: {marketInsights.customerPreference}
            </div>
          </div>
        </Card>
      </div>

      {/* Competitor Analysis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Wettbewerber-Analyse</h3>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Detailbericht
          </Button>
        </div>

        <div className="space-y-6">
          {sortedCompetitors.map((competitor) => (
            <Card key={competitor.id} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Basic Info */}
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {competitor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{competitor.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{competitor.category}</span>
                        <span>•</span>
                        <span>{getPriceRangeSymbol(competitor.priceRange)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>{competitor.distance} km entfernt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 fill-current text-warning" />
                      <span>{competitor.rating} ({competitor.reviews} Bewertungen)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(competitor.trend)}
                      <span>Marktanteil: {competitor.marketShare}%</span>
                    </div>
                  </div>
                </div>

                {/* Visibility Scores */}
                <div className="lg:col-span-3">
                  <h5 className="font-medium mb-3">Visibility Score</h5>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Google</span>
                        <span className={`font-medium ${getVisibilityColor(competitor.visibility.google)}`}>
                          {competitor.visibility.google}%
                        </span>
                      </div>
                      <Progress value={competitor.visibility.google} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Social Media</span>
                        <span className={`font-medium ${getVisibilityColor(competitor.visibility.social)}`}>
                          {competitor.visibility.social}%
                        </span>
                      </div>
                      <Progress value={competitor.visibility.social} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>Reviews</span>
                        <span className={`font-medium ${getVisibilityColor(competitor.visibility.reviews)}`}>
                          {competitor.visibility.reviews}%
                        </span>
                      </div>
                      <Progress value={competitor.visibility.reviews} className="h-2" />
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Overall</span>
                        <span className={`font-bold text-lg ${getVisibilityColor(competitor.visibility.overall)}`}>
                          {competitor.visibility.overall}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="lg:col-span-3">
                  <h5 className="font-medium mb-3">Key Metrics</h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Besucher/Monat</span>
                      <span className="font-medium">{competitor.metrics.monthlyVisitors.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ø Bestellwert</span>
                      <span className="font-medium">€{competitor.metrics.avgOrderValue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Social Follower</span>
                      <span className="font-medium">{competitor.metrics.socialFollowers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Online Präsenz</span>
                      <span className={`font-medium ${getVisibilityColor(competitor.metrics.onlinePresence)}`}>
                        {competitor.metrics.onlinePresence}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="lg:col-span-3">
                  <h5 className="font-medium mb-3">SWOT Analysis</h5>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <span className="text-sm font-medium text-success">Stärken</span>
                      </div>
                      <ul className="space-y-1">
                        {competitor.strengths.slice(0, 2).map((strength, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            • {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-3 h-3 text-error" />
                        <span className="text-sm font-medium text-error">Schwächen</span>
                      </div>
                      <ul className="space-y-1">
                        {competitor.weaknesses.slice(0, 2).map((weakness, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            • {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Market Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-semibold mb-4">🎯 Identifizierte Chancen</h4>
          <div className="space-y-4">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-success" />
                <span className="font-medium text-success">Social Media Gap</span>
              </div>
              <p className="text-sm text-muted-foreground">
                3 von 4 Hauptkonkurrenten haben schwache Social Media Präsenz - Opportunity für verstärkte Social Strategy
              </p>
            </div>
            
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="font-medium text-warning">Service-Speed</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Durchschnittliche Wartezeit der Konkurrenz: 15+ Min - Schnellerer Service als Differentiator
              </p>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">Online Ordering</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Nur 2 von 4 Konkurrenten bieten optimierte Online-Bestellung - Marktchance für Digital-First Approach
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="font-semibold mb-4">📈 Strategische Empfehlungen</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <h5 className="font-medium mb-1">Social Media Offensive</h5>
                <p className="text-sm text-muted-foreground">
                  Nutzen Sie den Social Media Gap der Konkurrenz für verstärkte Präsenz
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-success">2</span>
              </div>
              <div>
                <h5 className="font-medium mb-1">Premium Positioning</h5>
                <p className="text-sm text-muted-foreground">
                  Positionierung zwischen Burger Palace ($$) und Sushi Dreams ($$$$)
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-warning">3</span>
              </div>
              <div>
                <h5 className="font-medium mb-1">Digital Innovation</h5>
                <p className="text-sm text-muted-foreground">
                  Online-Bestellung und Delivery als Wettbewerbsvorteil ausbauen
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}