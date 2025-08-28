import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIMode } from '@/hooks/useUIMode';
import { VCResultInvisible, InvisibleModeToggle, ModeNudge } from '@/components/invisible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, Download, Share2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VCResultData {
  overall_score: number;
  confidence: number;
  subscores: {
    google_presence: number;
    social_media: number;
    website_quality: number;
    review_management: number;
  };
  trend: {
    direction: 'improving' | 'declining' | 'stable';
    change_pct: number;
    period: string;
  };
  top_actions: Array<{
    id: string;
    title: string;
    description: string;
    why: string;
    how: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    roi_estimate: number;
    priority: number;
  }>;
  evidence: Array<{
    source: string;
    type: string;
    score: number;
    details: string;
  }>;
}

export function VCResult() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { isInvisible, mode, setUIMode, effectiveMode } = useUIMode();
  const [result, setResult] = useState<VCResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNudge, setShowNudge] = useState(false);

  const runId = searchParams.get('run') || searchParams.get('r');
  const leadId = searchParams.get('lead') || searchParams.get('l');
  const token = searchParams.get('t') || searchParams.get('token'); // Token-based access (beide Parameter)

  useEffect(() => {
    if (token) {
      loadResultByToken(token);
    } else if (runId || leadId) {
      loadResult();
    } else {
      setError('Missing result identifier or token');
      setLoading(false);
    }
  }, [runId, leadId, token]);

  useEffect(() => {
    // Show nudge for time-pressed users on mobile
    const isMobile = window.innerWidth < 768;
    const hasSeenNudge = localStorage.getItem('vc_mode_nudge_seen');
    
    if (isMobile && !hasSeenNudge && effectiveMode === 'standard' && result) {
      setShowNudge(true);
    }
  }, [result, effectiveMode]);

  const loadResultByToken = async (token: string) => {
    try {
      // Call vc-result Edge Function with token
      const response = await fetch(`/functions/v1/vc-result?token=${encodeURIComponent(token)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Token nicht gefunden oder abgelaufen');
        } else if (response.status === 400) {
          throw new Error('Ungültiger Token');
        } else {
          throw new Error('Fehler beim Laden der Ergebnisse');
        }
      }
      
      const response_data = await response.json();
      
      if (response_data.ok && response_data.data) {
        setResult(response_data.data);
      } else {
        throw new Error(response_data.error || 'Unbekannter Fehler');
      }
      setLoading(false);
    } catch (err) {
      console.error('Token-based result loading failed:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Ergebnisse');
      setLoading(false);
    }
  };

  const loadResult = async () => {
    try {
      // In production, load from API
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResult({
        overall_score: 78,
        confidence: 0.92,
        subscores: {
          google_presence: 85,
          social_media: 65,
          website_quality: 72,
          review_management: 88
        },
        trend: {
          direction: 'improving',
          change_pct: 12,
          period: '30_days'
        },
        top_actions: [
          {
            id: 'optimize_gmb_photos',
            title: 'Google My Business Fotos optimieren',
            description: 'Hochwertige Fotos von Gerichten und Ambiente hinzufügen',
            why: 'Restaurants mit professionellen Fotos erhalten 42% mehr Anfragen',
            how: 'Mindestens 10 hochauflösende Fotos in verschiedenen Kategorien uploaden',
            impact: 'Bis zu 300€ mehr Umsatz pro Monat',
            effort: 'low',
            roi_estimate: 300,
            priority: 1
          },
          {
            id: 'respond_to_reviews',
            title: 'Auf alle Bewertungen antworten',
            description: 'Professionelle Antworten auf positive und negative Bewertungen',
            why: 'Antworten zeigen Kundenservice und verbessern das Ranking',
            how: 'Wöchentlich alle neuen Bewertungen beantworten, höflich und persönlich',
            impact: 'Bis zu 200€ mehr Umsatz pro Monat',
            effort: 'medium',
            roi_estimate: 200,
            priority: 2
          }
        ],
        evidence: [
          {
            source: 'google_places',
            type: 'profile_completeness',
            score: 0.85,
            details: 'Profil zu 85% vollständig'
          }
        ]
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load result');
      setLoading(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/vc/share?r=${runId}`;
    navigator.clipboard.writeText(shareUrl);
    // Show toast notification
  };

  const handleExport = () => {
    // Export to PDF/CSV
    console.log('Exporting result...');
  };

  const handleApplyAction = (actionId: string) => {
    console.log('Applying action:', actionId);
    // Navigate to action implementation
  };

  const handleExpandDetails = () => {
    console.log('Expanding details...');
    // Show detailed breakdown
  };

  const handleShowEvidence = () => {
    console.log('Showing evidence...');
    // Show evidence panel
  };

  const handleShowImpact = () => {
    console.log('Showing impact details...');
    // Show ROI breakdown
  };

  const handleShowHowTo = () => {
    console.log('Showing how-to guide...');
    // Show step-by-step guide
  };

  const handleNudgeAccept = () => {
    setUIMode('invisible');
    setShowNudge(false);
    localStorage.setItem('vc_mode_nudge_seen', 'true');
  };

  const handleNudgeDismiss = () => {
    setShowNudge(false);
    localStorage.setItem('vc_mode_nudge_seen', 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analysiere Ihre Sichtbarkeit...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {token ? 'Token-Fehler' : 'Fehler beim Laden'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'Ergebnis nicht gefunden'}
          </p>
          {token && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800">
                <strong>Mögliche Ursachen:</strong>
              </p>
              <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                <li>Der Token ist abgelaufen (gültig für 24h)</li>
                <li>Der Token wurde bereits verwendet</li>
                <li>Der Link ist fehlerhaft</li>
              </ul>
            </div>
          )}
          <div className="space-y-3">
            <Button 
              onClick={() => {
                const token = searchParams.get('t');
                window.location.href = `/vc/result/dashboard${token ? `?t=${token}` : ''}`;
              }} 
              className="w-full"
            >
              Zum Dashboard
            </Button>
            <Button 
              onClick={() => window.location.href = '/vc/quick'} 
              variant="outline"
              className="w-full"
            >
              Neuen Check starten
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'} 
              className="w-full"
            >
              Zur Startseite
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (result.trend.direction) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (result.trend.direction) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ihr Sichtbarkeits-Check</h1>
              <p className="text-gray-600">Ergebnis und Handlungsempfehlungen</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Teilen
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <InvisibleModeToggle 
                currentMode={mode} 
                onModeChange={setUIMode}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Nudge */}
      {showNudge && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <ModeNudge 
            onAccept={handleNudgeAccept}
            onDismiss={handleNudgeDismiss}
          />
        </div>
      )}

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isInvisible ? (
          <VCResultInvisible
            result={{
              confidence: result.confidence,
              topActions: result.top_actions,
              score: result.overall_score
            }}
            onExpandDetails={handleExpandDetails}
            onApplyAction={handleApplyAction}
            onShowEvidence={handleShowEvidence}
            onShowImpact={handleShowImpact}
            onShowHowTo={handleShowHowTo}
          />
        ) : (
          <div className="space-y-6">
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Gesamtscore
                    <div className="flex items-center gap-2">
                      {getTrendIcon()}
                      <span className={`text-sm ${getTrendColor()}`}>
                        {result.trend.change_pct > 0 ? '+' : ''}{result.trend.change_pct}%
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-blue-600">
                      {result.overall_score}
                    </div>
                    <div className="flex-1">
                      <Progress value={result.overall_score} className="h-3" />
                      <p className="text-sm text-gray-600 mt-2">
                        von 100 Punkten
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vertrauen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(result.confidence * 100)}%
                  </div>
                  <p className="text-sm text-gray-600">
                    Sicherheit der Analyse
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subscores */}
            <Card>
              <CardHeader>
                <CardTitle>Detailbewertung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(result.subscores).map(([key, score]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold mb-2">{score}</div>
                      <Progress value={score} className="h-2 mb-2" />
                      <p className="text-sm text-gray-600">
                        {key === 'google_presence' && 'Google Präsenz'}
                        {key === 'social_media' && 'Social Media'}
                        {key === 'website_quality' && 'Website'}
                        {key === 'review_management' && 'Bewertungen'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Empfohlene Maßnahmen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.top_actions.map((action, index) => (
                    <div key={action.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <h3 className="font-semibold">{action.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={action.effort === 'low' ? 'default' : action.effort === 'medium' ? 'secondary' : 'destructive'}>
                            {action.effort === 'low' && 'Einfach'}
                            {action.effort === 'medium' && 'Mittel'}
                            {action.effort === 'high' && 'Aufwändig'}
                          </Badge>
                          <span className="text-sm font-medium text-green-600">
                            +{action.roi_estimate}€/Monat
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{action.description}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApplyAction(action.id)}>
                          Umsetzen
                        </Button>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card>
              <CardHeader>
                <CardTitle>Datengrundlage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.evidence.map((evidence, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{evidence.source}</p>
                        <p className="text-sm text-gray-600">{evidence.details}</p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(evidence.score * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}