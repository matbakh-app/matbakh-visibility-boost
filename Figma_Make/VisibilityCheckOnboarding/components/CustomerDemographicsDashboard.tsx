import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Heart, 
  Star, 
  Calendar, 
  ShoppingCart, 
  Smartphone, 
  DollarSign,
  UserCheck,
  UserPlus,
  UserX,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Mail,
  MessageSquare,
  Cake,
  Briefcase,
  Home,
  Car,
  Coffee,
  Utensils,
  Wine,
  Baby,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Timer,
  CreditCard,
  Wallet
} from 'lucide-react';

type UserPlan = 'basic' | 'business' | 'premium';

interface CustomerSegment {
  id: string;
  name: string;
  size: number;
  percentage: number;
  avgSpend: number;
  visitFrequency: number;
  growthRate: number;
  characteristics: string[];
  preferredItems: string[];
  peakTimes: string[];
  color: string;
}

interface CustomerPersona {
  id: string;
  name: string;
  avatar: string;
  age: string;
  occupation: string;
  income: string;
  description: string;
  behavior: {
    visitFrequency: string;
    avgSpend: number;
    preferredTime: string;
    paymentMethod: string;
    orderType: string;
  };
  preferences: string[];
  painPoints: string[];
  marketingChannels: string[];
  size: number;
}

interface CustomerJourneyStage {
  stage: string;
  customers: number;
  conversionRate: number;
  avgTime: string;
  dropoffReasons: string[];
  optimizations: string[];
}

interface CustomerDemographicsDashboardProps {
  userPlan: UserPlan;
  onUpgrade: () => void;
}

const mockCustomerSegments: CustomerSegment[] = [
  {
    id: 'regulars',
    name: 'Stammkunden',
    size: 1240,
    percentage: 45,
    avgSpend: 42.50,
    visitFrequency: 3.2,
    growthRate: 8.5,
    characteristics: ['Hohe Loyalität', 'Preisunempfindlich', 'Empfehlen weiter'],
    preferredItems: ['Tagesgericht', 'Weine', 'Desserts'],
    peakTimes: ['18:00-20:00', 'Donnerstag-Samstag'],
    color: '#10B981'
  },
  {
    id: 'occasional',
    name: 'Gelegenheitskunden',
    size: 960,
    percentage: 35,
    avgSpend: 28.80,
    visitFrequency: 1.1,
    growthRate: 4.2,
    characteristics: ['Preisbewusst', 'Event-getrieben', 'Social Media aktiv'],
    preferredItems: ['Burger', 'Pizza', 'Getränke'],
    peakTimes: ['12:00-14:00', 'Wochenende'],
    color: '#F59E0B'
  },
  {
    id: 'newcomers',
    name: 'Neukunden',
    size: 550,
    percentage: 20,
    avgSpend: 24.30,
    visitFrequency: 0.3,
    growthRate: 15.7,
    characteristics: ['Experimentierfreudig', 'Bewertungen wichtig', 'First Impression'],
    preferredItems: ['Signature Dishes', 'Empfehlungen', 'Appetizer'],
    peakTimes: ['19:00-21:00', 'Freitag-Sonntag'],
    color: '#4F46E5'
  }
];

const mockCustomerPersonas: CustomerPersona[] = [
  {
    id: 'business_professional',
    name: 'Business Professional',
    avatar: 'BP',
    age: '30-45',
    occupation: 'Manager/Consultant',
    income: '€4.000-6.000',
    description: 'Berufstätige mit hohem Einkommen, schätzen Qualität und Service',
    behavior: {
      visitFrequency: 'Wöchentlich',
      avgSpend: 45.80,
      preferredTime: 'Abends (18-20h)',
      paymentMethod: 'Kreditkarte',
      orderType: 'Dine-in'
    },
    preferences: ['Premium Weine', 'Business Lunch', 'Ruhige Atmosphäre'],
    painPoints: ['Lange Wartezeiten', 'Keine Reservierung', 'Laute Umgebung'],
    marketingChannels: ['LinkedIn', 'Email', 'Google Ads'],
    size: 35
  },
  {
    id: 'young_family',
    name: 'Junge Familie',
    avatar: 'JF',
    age: '25-40',
    occupation: 'Angestellt',
    income: '€2.500-4.000',
    description: 'Familien mit Kindern, preisbewusst aber qualitätsorientiert',
    behavior: {
      visitFrequency: '2x Monat',
      avgSpend: 38.20,
      preferredTime: 'Mittags + früher Abend',
      paymentMethod: 'EC-Karte',
      orderType: 'Mix (Dine-in/Takeaway)'
    },
    preferences: ['Kindermenü', 'Familienfreundlich', 'Gesunde Optionen'],
    painPoints: ['Hohe Preise', 'Keine Spielecke', 'Lange Bestellzeit'],
    marketingChannels: ['Facebook', 'Instagram', 'WhatsApp'],
    size: 28
  },
  {
    id: 'student',
    name: 'Student/Young Professional',
    avatar: 'ST',
    age: '18-28',
    occupation: 'Student/Berufsanfänger',
    income: '€800-2.500',
    description: 'Preisorientierte junge Zielgruppe, social media affin',
    behavior: {
      visitFrequency: '1x Monat',
      avgSpend: 22.50,
      preferredTime: 'Späte Abende',
      paymentMethod: 'App/Digital',
      orderType: 'Delivery/Takeaway'
    },
    preferences: ['Günstige Preise', 'Große Portionen', 'Trendy Food'],
    painPoints: ['Zu teuer', 'Keine Happy Hour', 'Lange Lieferzeit'],
    marketingChannels: ['TikTok', 'Instagram', 'Snapchat'],
    size: 22
  },
  {
    id: 'senior',
    name: 'Senior Citizen',
    avatar: 'SC',
    age: '60+',
    occupation: 'Rentner',
    income: '€1.500-3.000',
    description: 'Ältere Kundschaft, schätzt Tradition und persönlichen Service',
    behavior: {
      visitFrequency: '2-3x Woche',
      avgSpend: 32.80,
      preferredTime: 'Mittags (11-14h)',
      paymentMethod: 'Bar/EC-Karte',
      orderType: 'Dine-in'
    },
    preferences: ['Traditionelle Küche', 'Persönlicher Service', 'Ruhige Zeiten'],
    painPoints: ['Zu laute Musik', 'Komplizierte Bestellung', 'Unfreundliches Personal'],
    marketingChannels: ['Zeitung', 'Radio', 'Word of Mouth'],
    size: 15
  }
];

const mockCustomerJourney: CustomerJourneyStage[] = [
  {
    stage: 'Awareness',
    customers: 10000,
    conversionRate: 100,
    avgTime: '0 Tage',
    dropoffReasons: [],
    optimizations: ['SEO verbessern', 'Social Media Präsenz']
  },
  {
    stage: 'Interest',
    customers: 6800,
    conversionRate: 68,
    avgTime: '3 Tage',
    dropoffReasons: ['Negative Bewertungen', 'Preise zu hoch', 'Unattraktives Menü'],
    optimizations: ['Review Management', 'Preisanpassung', 'Menü Update']
  },
  {
    stage: 'Consideration',
    customers: 4200,
    conversionRate: 42,
    avgTime: '7 Tage',
    dropoffReasons: ['Keine Reservierung möglich', 'Schlechte Website', 'Konkurrenz'],
    optimizations: ['Online Reservierung', 'Website Redesign', 'USP stärken']
  },
  {
    stage: 'First Visit',
    customers: 2400,
    conversionRate: 24,
    avgTime: '14 Tage',
    dropoffReasons: ['Lange Wartezeit', 'Service-Qualität', 'Ambiente'],
    optimizations: ['Prozesse optimieren', 'Staff Training', 'Renovierung']
  },
  {
    stage: 'Repeat Customer',
    customers: 1200,
    conversionRate: 12,
    avgTime: '30 Tage',
    dropoffReasons: ['Keine Loyalität-Programme', 'Wenig Abwechslung'],
    optimizations: ['Loyalty Programm', 'Saisonales Menü', 'Personal Touch']
  }
];

export function CustomerDemographicsDashboard({ 
  userPlan, 
  onUpgrade 
}: CustomerDemographicsDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  const isFeatureLocked = (requiredPlan: UserPlan) => {
    const planLevels = { basic: 1, business: 2, premium: 3 };
    return planLevels[userPlan] < planLevels[requiredPlan];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">👥 Customer Demographics & Behavior</h2>
          <p className="text-muted-foreground">
            Detaillierte Kundenanalyse mit Segmentierung und Behavioral Insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Tage</SelectItem>
              <SelectItem value="30d">30 Tage</SelectItem>
              <SelectItem value="90d">90 Tage</SelectItem>
              <SelectItem value="1y">1 Jahr</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="segments">Segmente</TabsTrigger>
          <TabsTrigger value="personas">Personas</TabsTrigger>
          <TabsTrigger value="journey">Customer Journey</TabsTrigger>
          <TabsTrigger value="behavior">Verhalten</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Customer Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary">Gesamt</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Aktive Kunden</p>
                <div className="text-2xl font-bold">2.750</div>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="w-3 h-3 text-success" />
                  <span className="font-medium text-success">+12.5%</span>
                  <span className="text-muted-foreground">vs. Vormonat</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-success" />
                </div>
                <Badge variant="secondary">Akquisition</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Neukunden</p>
                <div className="text-2xl font-bold">284</div>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="w-3 h-3 text-success" />
                  <span className="font-medium text-success">+15.7%</span>
                  <span className="text-muted-foreground">vs. Vormonat</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-warning" />
                </div>
                <Badge variant="secondary">Loyalität</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <div className="text-2xl font-bold">68.5%</div>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="w-3 h-3 text-success" />
                  <span className="font-medium text-success">+5.3%</span>
                  <span className="text-muted-foreground">vs. Vormonat</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-error" />
                </div>
                <Badge variant="secondary">LTV</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Customer LTV</p>
                <div className="text-2xl font-bold">€450</div>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUpRight className="w-3 h-3 text-success" />
                  <span className="font-medium text-success">+22.1%</span>
                  <span className="text-muted-foreground">vs. Vormonat</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Customer Segments Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Kundensegmente</h4>
              <div className="space-y-4">
                {mockCustomerSegments.map((segment) => (
                  <div key={segment.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="font-medium">{segment.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{segment.percentage}%</span>
                        <div className="text-xs text-muted-foreground">
                          {segment.size} Kunden
                        </div>
                      </div>
                    </div>
                    <Progress value={segment.percentage} className="h-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Ø Ausgaben:</span>
                        <span className="font-medium ml-2">€{segment.avgSpend}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Besuche/Monat:</span>
                        <span className="font-medium ml-2">{segment.visitFrequency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Demografische Verteilung</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Altersverteilung</h5>
                  <div className="space-y-2">
                    {[
                      { range: '18-25', percentage: 22, color: '#4F46E5' },
                      { range: '26-35', percentage: 28, color: '#10B981' },
                      { range: '36-50', percentage: 32, color: '#F59E0B' },
                      { range: '51+', percentage: 18, color: '#EF4444' }
                    ].map((age) => (
                      <div key={age.range} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: age.color }}
                          />
                          <span className="text-sm">{age.range} Jahre</span>
                        </div>
                        <span className="font-medium">{age.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Geschlechterverteilung</h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weiblich</span>
                      <span className="font-medium">54%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Männlich</span>
                      <span className="font-medium">46%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {mockCustomerSegments.map((segment) => (
              <Card key={segment.id} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${segment.color}20` }}
                    >
                      <Users className="w-6 h-6" style={{ color: segment.color }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{segment.name}</h3>
                      <p className="text-muted-foreground">
                        {segment.size} Kunden ({segment.percentage}% der Gesamtkundschaft)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={segment.growthRate > 10 ? 'default' : 'secondary'}
                      className={segment.growthRate > 10 ? 'bg-success' : ''}
                    >
                      {segment.growthRate > 0 ? '+' : ''}{segment.growthRate}% Wachstum
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Kennzahlen</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ø Ausgaben</span>
                        <span className="font-medium">€{segment.avgSpend}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Besuche/Monat</span>
                        <span className="font-medium">{segment.visitFrequency}x</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Jahresumsatz</span>
                        <span className="font-medium">€{(segment.avgSpend * segment.visitFrequency * 12).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Charakteristika</h4>
                    <div className="space-y-2">
                      {segment.characteristics.map((char, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2">
                          {char}
                        </Badge>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Beliebte Artikel:</p>
                      <div className="space-y-1">
                        {segment.preferredItems.map((item, index) => (
                          <div key={index} className="text-sm">• {item}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Verhalten</h4>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Stoßzeiten:</p>
                      <div className="space-y-1">
                        {segment.peakTimes.map((time, index) => (
                          <div key={index} className="text-sm">• {time}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Personas Tab */}
        <TabsContent value="personas" className="space-y-6">
          {isFeatureLocked('business') ? (
            <Card className="p-8 text-center border-warning/20 bg-warning/5">
              <div className="w-16 h-16 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-bold mb-2">Customer Personas</h3>
              <p className="text-muted-foreground mb-6">
                Detaillierte Kundenpersonas mit Behavioral Insights
              </p>
              <Button onClick={onUpgrade} size="lg">
                <Users className="w-5 h-5 mr-2" />
                Business Plan upgraden
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockCustomerPersonas.map((persona) => (
                <Card key={persona.id} className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {persona.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{persona.name}</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>{persona.age} Jahre • {persona.occupation}</div>
                        <div>Einkommen: {persona.income}</div>
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {persona.size}% der Kundschaft
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm mb-6 text-muted-foreground">
                    {persona.description}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Verhalten</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Besuche:</span>
                          <div className="font-medium">{persona.behavior.visitFrequency}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ø Ausgaben:</span>
                          <div className="font-medium">€{persona.behavior.avgSpend}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bevorzugte Zeit:</span>
                          <div className="font-medium">{persona.behavior.preferredTime}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Zahlung:</span>
                          <div className="font-medium">{persona.behavior.paymentMethod}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Präferenzen</h4>
                      <div className="flex flex-wrap gap-1">
                        {persona.preferences.slice(0, 3).map((pref, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Pain Points</h4>
                      <div className="space-y-1 text-sm">
                        {persona.painPoints.slice(0, 2).map((pain, index) => (
                          <div key={index} className="text-muted-foreground">• {pain}</div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Marketing Kanäle</h4>
                      <div className="flex flex-wrap gap-1">
                        {persona.marketingChannels.map((channel, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Customer Journey Tab */}
        <TabsContent value="journey" className="space-y-6">
          {isFeatureLocked('premium') ? (
            <Card className="p-8 text-center border-primary/20 bg-primary/5">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Customer Journey Analysis</h3>
              <p className="text-muted-foreground mb-6">
                Detaillierte Customer Journey mit Conversion-Tracking und Optimierungsempfehlungen
              </p>
              <Button onClick={onUpgrade} size="lg">
                <Activity className="w-5 h-5 mr-2" />
                Premium upgraden für Journey Analytics
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-6">Customer Journey Funnel</h4>
                <div className="space-y-4">
                  {mockCustomerJourney.map((stage, index) => (
                    <div key={index} className="relative">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{index + 1}</span>
                            </div>
                            <h5 className="font-medium">{stage.stage}</h5>
                          </div>
                          <div className="text-2xl font-bold">{stage.customers.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Kunden</div>
                        </div>

                        <div className="space-y-2">
                          <div className="font-medium">Conversion Rate</div>
                          <div className="text-2xl font-bold text-success">{stage.conversionRate}%</div>
                          <Progress value={stage.conversionRate} className="h-2" />
                        </div>

                        <div className="space-y-2">
                          <div className="font-medium">Durchschnittliche Zeit</div>
                          <div className="text-lg font-bold">{stage.avgTime}</div>
                          <div className="text-sm text-muted-foreground">bis nächste Stufe</div>
                        </div>

                        <div className="space-y-2">
                          <div className="font-medium">Top Drop-off Gründe</div>
                          <div className="space-y-1">
                            {stage.dropoffReasons.slice(0, 2).map((reason, reasonIndex) => (
                              <div key={reasonIndex} className="text-sm text-muted-foreground">
                                • {reason}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {index < mockCustomerJourney.length - 1 && (
                        <div className="flex justify-center my-2">
                          <ArrowDownRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="font-semibold mb-4">Optimierungsempfehlungen</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-error/10 rounded-lg border border-error/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-error" />
                        <span className="font-medium text-error">Kritischer Drop-off</span>
                      </div>
                      <p className="text-sm mb-2">68% Verlust zwischen Awareness und Interest</p>
                      <ul className="text-sm space-y-1">
                        <li>• Review Management intensivieren</li>
                        <li>• Preistransparenz verbessern</li>
                        <li>• Menü attraktiver gestalten</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-warning" />
                        <span className="font-medium text-warning">Conversion Optimierung</span>
                      </div>
                      <p className="text-sm mb-2">Nur 24% schaffen den ersten Besuch</p>
                      <ul className="text-sm space-y-1">
                        <li>• Online-Reservierung einführen</li>
                        <li>• Website Performance verbessern</li>
                        <li>• USP besser kommunizieren</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-success" />
                        <span className="font-medium text-success">Retention stärken</span>
                      </div>
                      <p className="text-sm mb-2">50% Chance auf Stammkunden bei zweitem Besuch</p>
                      <ul className="text-sm space-y-1">
                        <li>• Loyalty-Programm einführen</li>
                        <li>• Personalisierte Angebote</li>
                        <li>• Follow-up E-Mails</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">Upsell Potential</span>
                      </div>
                      <p className="text-sm mb-2">Durchschnittlicher Bon kann um 15% gesteigert werden</p>
                      <ul className="text-sm space-y-1">
                        <li>• Staff Training für Empfehlungen</li>
                        <li>• Menü-Engineering</li>
                        <li>• Cross-Selling Strategien</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Besuchsverhalten</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Wochentag-Verteilung</h5>
                  <div className="space-y-2">
                    {[
                      { day: 'Montag', visitors: 180, percentage: 12 },
                      { day: 'Dienstag', visitors: 210, percentage: 14 },
                      { day: 'Mittwoch', visitors: 250, percentage: 17 },
                      { day: 'Donnerstag', visitors: 320, percentage: 22 },
                      { day: 'Freitag', visitors: 380, percentage: 26 },
                      { day: 'Samstag', visitors: 420, percentage: 29 },
                      { day: 'Sonntag', visitors: 290, percentage: 20 }
                    ].map((day) => (
                      <div key={day.day} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day.day}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={day.percentage} className="w-20 h-2" />
                          <span className="text-sm font-medium w-12">{day.visitors}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold mb-4">Zahlungsverhalten</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { method: 'EC-Karte', percentage: 45, icon: <CreditCard className="w-4 h-4" /> },
                    { method: 'Bar', percentage: 28, icon: <Wallet className="w-4 h-4" /> },
                    { method: 'Kreditkarte', percentage: 20, icon: <CreditCard className="w-4 h-4" /> },
                    { method: 'Digital/App', percentage: 7, icon: <Smartphone className="w-4 h-4" /> }
                  ].map((payment) => (
                    <div key={payment.method} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {payment.icon}
                        <span className="font-medium text-sm">{payment.method}</span>
                      </div>
                      <div className="text-2xl font-bold">{payment.percentage}%</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <h5 className="font-medium mb-2">Durchschnittlicher Bon</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mittags:</span>
                      <div className="font-medium">€28.50</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Abends:</span>
                      <div className="font-medium">€42.80</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h4 className="font-semibold mb-4">Präferenzen & Trends</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 className="font-medium mb-3">Beliebte Menü-Kategorien</h5>
                <div className="space-y-2">
                  {[
                    { category: 'Hauptspeisen', percentage: 68, trend: 'up' },
                    { category: 'Getränke', percentage: 89, trend: 'up' },
                    { category: 'Vorspeisen', percentage: 34, trend: 'down' },
                    { category: 'Desserts', percentage: 42, trend: 'up' }
                  ].map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span className="text-sm">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cat.percentage}%</span>
                        {cat.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3 text-success" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-error" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-3">Service-Präferenzen</h5>
                <div className="space-y-2">
                  {[
                    { service: 'Dine-in', percentage: 72 },
                    { service: 'Takeaway', percentage: 21 },
                    { service: 'Delivery', percentage: 7 }
                  ].map((service) => (
                    <div key={service.service} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{service.service}</span>
                        <span className="font-medium">{service.percentage}%</span>
                      </div>
                      <Progress value={service.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-3">Saisonale Trends</h5>
                <div className="space-y-3">
                  <div className="p-3 bg-success/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <span className="text-sm font-medium text-success">Trend: Healthy Options</span>
                    </div>
                    <p className="text-xs text-muted-foreground">+23% Nachfrage nach vegetarischen Gerichten</p>
                  </div>
                  
                  <div className="p-3 bg-warning/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Coffee className="w-3 h-3 text-warning" />
                      <span className="text-sm font-medium text-warning">Trend: Coffee Culture</span>
                    </div>
                    <p className="text-xs text-muted-foreground">+18% Specialty Coffee Bestellungen</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}