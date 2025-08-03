import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  ArrowLeft,
  Mail,
  UserPlus,
  Download,
  Share,
  Heart,
  CheckCircle,
  Star,
  TrendingUp,
  BarChart3,
  Target,
  Gift,
  Crown,
  Sparkles,
  ExternalLink,
  Copy,
  FileText
} from 'lucide-react';
import { GuestCodeInfo } from '../types/app';
import { formatCodeExpiryDate } from '../utils/appHelpers';

interface GuestResultsScreenProps {
  guestCodeInfo: GuestCodeInfo;
  onBack: () => void;
  onCreateAccount: () => void;
  onEmailResults: () => void;
}

export function GuestResultsScreen({ 
  guestCodeInfo, 
  onBack, 
  onCreateAccount, 
  onEmailResults 
}: GuestResultsScreenProps) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleEmailSubmit = () => {
    if (!email.trim()) return;
    
    // Simulate email sending
    setTimeout(() => {
      setEmailSent(true);
      onEmailResults();
    }, 1000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Visibility Check Analyse-Ergebnisse',
          text: 'Schauen Sie sich meine Restaurant-Sichtbarkeits-Analyse an!',
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy URL
      navigator.clipboard.writeText(window.location.href);
      alert('Link in Zwischenablage kopiert!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold">Visibility Check</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-success/10 text-success">
                <Gift className="w-3 h-3 mr-1" />
                Premium-Analyse
              </Badge>
              
              <Button variant="outline" onClick={handleShare}>
                <Share className="w-4 h-4 mr-2" />
                Teilen
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Code Success Banner */}
        <Alert className="mb-8 border-success/20 bg-success/5">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>✅ Vollzugang freigeschaltet von {guestCodeInfo.referrerName}</strong>
                <div className="text-sm text-muted-foreground mt-1">
                  Code: {guestCodeInfo.code} • Gültig bis {formatCodeExpiryDate(guestCodeInfo.validUntil!)}
                </div>
              </div>
              {guestCodeInfo.creditAmount && (
                <Badge variant="outline" className="text-xs">
                  +€{guestCodeInfo.creditAmount.toFixed(2)} Gutschrift an {guestCodeInfo.referrerName}
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Results Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">🎉 Ihre Analyse ist abgeschlossen!</h1>
          <p className="text-xl text-muted-foreground">
            Vollständige Premium-Insights ohne Einschränkungen
          </p>
        </div>

        {/* Main Results Grid - This would show actual analysis results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Overall Score */}
          <Card className="p-6 text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-success">78</span>
            </div>
            <h3 className="font-semibold mb-2">Visibility Score</h3>
            <p className="text-sm text-muted-foreground">Ihre Gesamtsichtbarkeit</p>
            <Badge variant="secondary" className="mt-2 bg-success/10 text-success">
              +12% vs. Durchschnitt
            </Badge>
          </Card>

          {/* Platform Breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Platform Performance</h3>
            <div className="space-y-3">
              {[
                { platform: 'Google My Business', score: 92, color: 'text-success' },
                { platform: 'Social Media', score: 67, color: 'text-warning' },
                { platform: 'Online Reviews', score: 45, color: 'text-error' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.platform}</span>
                  <span className={`font-semibold ${item.color}`}>{item.score}/100</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Insights */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">🔍 AI-Insights</h3>
            <div className="space-y-3">
              <div className="p-3 bg-success/10 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-sm font-medium text-success">Starke Performance</span>
                </div>
                <p className="text-xs text-muted-foreground">Google-Präsenz überdurchschnittlich</p>
              </div>
              
              <div className="p-3 bg-warning/10 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-3 h-3 text-warning" />
                  <span className="text-sm font-medium text-warning">Optimierungschance</span>
                </div>
                <p className="text-xs text-muted-foreground">Social Media Reichweite ausbaufähig</p>
              </div>
              
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-sm font-medium text-primary">Premium-Empfehlung</span>
                </div>
                <p className="text-xs text-muted-foreground">Review-Management priorisieren</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Analysis Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Google My Business</h3>
                <Badge variant="secondary" className="bg-success/10 text-success">Exzellent</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ihre Google-Präsenz zeigt hervorragende Performance mit hoher lokaler Sichtbarkeit und aktuellem Content.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Vollständigkeit</span>
                <span className="font-medium">95%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bewertungsqualität</span>
                <span className="font-medium">4.6/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Aktualität</span>
                <span className="font-medium">Sehr gut</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Social Media Analyse</h3>
                <Badge variant="secondary" className="bg-warning/10 text-warning">Ausbaufähig</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Moderate Aktivität mit Potential für höhere Reichweite und besseres Engagement.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Posting-Frequenz</span>
                <span className="font-medium">2x/Woche</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Engagement-Rate</span>
                <span className="font-medium">3.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Follower-Wachstum</span>
                <span className="font-medium">+8%/Monat</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Action CTAs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Creation CTA */}
          <Card className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-success/5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Account erstellen für dauerhafte Speicherung</h3>
              <p className="text-muted-foreground">
                Speichern Sie Ihre Ergebnisse dauerhaft und erhalten Sie regelmäßige Updates
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm">Alle Analyse-Ergebnisse dauerhaft gespeichert</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm">Monatliche Updates und Trend-Tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm">Personalisierte Empfehlungen und Alerts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm">PDF-Reports und White-Label Exports</span>
              </div>
            </div>

            <Button onClick={onCreateAccount} className="w-full" size="lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Kostenlos Account erstellen
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-3">
              Ihre Daten werden sicher gespeichert • DSGVO-konform
            </p>
          </Card>

          {/* Email Results CTA */}
          <Card className="p-8 border-2 border-success/20 bg-gradient-to-br from-success/5 to-warning/5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ergebnisse per Email zusenden</h3>
              <p className="text-muted-foreground">
                Erhalten Sie eine PDF-Zusammenfassung Ihrer Analyse
              </p>
            </div>

            {!showEmailForm ? (
              <Button 
                onClick={() => setShowEmailForm(true)}
                variant="outline" 
                className="w-full" 
                size="lg"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email-Versand starten
              </Button>
            ) : emailSent ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <div>
                  <h4 className="font-semibold text-success">Email versendet!</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your inbox at {email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="ihre.email@beispiel.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-center"
                />
                <div className="space-y-2">
                  <Button 
                    onClick={handleEmailSubmit}
                    disabled={!email.trim()}
                    className="w-full"
                    size="lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    PDF-Report senden
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowEmailForm(false)}
                    className="w-full"
                    size="sm"
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-3 h-3 text-warning" />
                  <span className="font-medium">Referrer-Credit</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {guestCodeInfo.referrerName} erhält €{guestCodeInfo.creditAmount?.toFixed(2)} Gutschrift für Ihre Analyse
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Thank You Section */}
        <Card className="p-6 mt-8 bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
          <div className="text-center">
            <h3 className="font-semibold mb-2">
              🙏 Vielen Dank an {guestCodeInfo.referrerName}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Diese kostenlose Premium-Analyse wurde ermöglicht durch {guestCodeInfo.referrerName}. 
              Besuchen Sie das Restaurant und unterstützen Sie lokale Businesses!
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3 h-3 mr-1" />
                Restaurant besuchen
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share className="w-3 h-3 mr-1" />
                Weiterempfehlen
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}