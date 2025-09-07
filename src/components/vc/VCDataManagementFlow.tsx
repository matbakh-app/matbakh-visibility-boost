import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Mail, 
  Building, 
  MapPin, 
  Globe, 
  Instagram, 
  Facebook,
  Star,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Download,
  Eye,
  Shield
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

// ================================================================
// Types and Interfaces
// ================================================================

interface VCFlowState {
  step: 'email' | 'confirmation' | 'business_data' | 'analysis' | 'results'
  email: string
  token: string
  leadId: string
  businessData: BusinessFormData
  analysisResults: AnalysisResults | null
  loading: boolean
  error: string | null
}

interface BusinessFormData {
  business_name: string
  business_description: string
  location: {
    street_address: string
    city: string
    state_province: string
    postal_code: string
    country: string
  }
  categories: {
    main_category: string
    sub_categories: string[]
  }
  online_presence: {
    website_url: string
    instagram_url: string
    facebook_url: string
    gmb_url: string
    tripadvisor_url: string
    yelp_url: string
  }
  benchmark_urls: string[]
  user_goal: string
  priority_areas: string[]
}

interface AnalysisResults {
  summary_score: number
  platform_scores: Record<string, number>
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  quick_wins: Array<{
    action: string
    impact: string
    effort: string
    timeline: string
  }>
  content_suggestions: string[]
  profile_health_score: number
}

// ================================================================
// Main Component
// ================================================================

export default function VCDataManagementFlow() {
  const [state, setState] = useState<VCFlowState>({
    step: 'email',
    email: '',
    token: '',
    leadId: '',
    businessData: {
      business_name: '',
      business_description: '',
      location: {
        street_address: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'DE'
      },
      categories: {
        main_category: '',
        sub_categories: []
      },
      online_presence: {
        website_url: '',
        instagram_url: '',
        facebook_url: '',
        gmb_url: '',
        tripadvisor_url: '',
        yelp_url: ''
      },
      benchmark_urls: [],
      user_goal: '',
      priority_areas: []
    },
    analysisResults: null,
    loading: false,
    error: null
  })

  // Check for confirmation token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token) {
      setState(prev => ({ ...prev, token, step: 'confirmation' }))
      handleEmailConfirmation(token)
    }
  }, [])

  // ================================================================
  // Step 1: Email Collection
  // ================================================================

  const handleEmailSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.functions.invoke('vc-data-management/collect-email', {
        body: {
          email: state.email,
          language: 'de',
          utm_source: new URLSearchParams(window.location.search).get('utm_source'),
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          referrer_url: document.referrer
        }
      })

      if (error) throw error

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        leadId: data.lead_id,
        step: 'confirmation'
      }))

    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to submit email' 
      }))
    }
  }

  // ================================================================
  // Step 2: Email Confirmation
  // ================================================================

  const handleEmailConfirmation = async (token: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.functions.invoke('vc-data-management/confirm-email', {
        body: { token }
      })

      if (error) throw error

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        leadId: data.lead_id,
        step: 'business_data'
      }))

    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Invalid or expired confirmation token' 
      }))
    }
  }

  // ================================================================
  // Step 3: Business Data Collection
  // ================================================================

  const handleBusinessDataSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.functions.invoke('vc-data-management/submit-business-data', {
        body: {
          token: state.token,
          ...state.businessData
        }
      })

      if (error) throw error

      if (data.ready_for_analysis) {
        // Automatically trigger analysis
        await handleAnalysisTrigger()
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: `Data completeness: ${data.completeness_score}%. Please fill in more information for better analysis.`
        }))
      }

    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to submit business data' 
      }))
    }
  }

  // ================================================================
  // Step 4: AI Analysis Trigger
  // ================================================================

  const handleAnalysisTrigger = async () => {
    setState(prev => ({ ...prev, loading: true, error: null, step: 'analysis' }))

    try {
      const { data, error } = await supabase.functions.invoke('vc-data-management/trigger-analysis', {
        body: { token: state.token }
      })

      if (error) throw error

      // Poll for results
      setTimeout(() => {
        handleResultsRetrieval()
      }, 5000) // Wait 5 seconds then check for results

    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to trigger analysis' 
      }))
    }
  }

  // ================================================================
  // Step 5: Results Retrieval
  // ================================================================

  const handleResultsRetrieval = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('vc-data-management/get-results', {
        method: 'GET',
        body: { token: state.token }
      })

      if (error) throw error

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        analysisResults: data.analysis_results,
        step: 'results'
      }))

    } catch (error: any) {
      // If results not ready, try again in 10 seconds
      if (error.message.includes('not completed')) {
        setTimeout(() => {
          handleResultsRetrieval()
        }, 10000)
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message || 'Failed to retrieve results' 
        }))
      }
    }
  }

  // ================================================================
  // Render Functions
  // ================================================================

  const renderEmailStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="w-5 h-5" />
          Sichtbarkeitsanalyse starten
        </CardTitle>
        <CardDescription>
          Geben Sie Ihre E-Mail-Adresse ein, um eine kostenlose Analyse Ihrer Online-Sichtbarkeit zu erhalten.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmission} className="space-y-4">
          <div>
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={state.email}
              onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
              placeholder="ihre@email.de"
              required
            />
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox id="consent" required />
            <Label htmlFor="consent" className="text-sm">
              Ich stimme der Verarbeitung meiner Daten für die Sichtbarkeitsanalyse zu. 
              <a href="/datenschutz" className="text-blue-600 hover:underline ml-1">
                Datenschutzerklärung
              </a>
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={state.loading}>
            {state.loading ? 'Wird gesendet...' : 'Analyse starten'}
          </Button>
        </form>

        {state.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{state.error}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderConfirmationStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          E-Mail bestätigt
        </CardTitle>
        <CardDescription>
          Ihre E-Mail wurde erfolgreich bestätigt. Sie können nun mit der Datenerfassung fortfahren.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <Button onClick={() => setState(prev => ({ ...prev, step: 'business_data' }))}>
            Weiter zur Datenerfassung
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderBusinessDataStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Unternehmensdaten
          </CardTitle>
          <CardDescription>
            Geben Sie Informationen zu Ihrem Unternehmen ein für eine präzise Analyse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBusinessDataSubmission} className="space-y-6">
            {/* Basic Business Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business_name">Unternehmensname *</Label>
                <Input
                  id="business_name"
                  value={state.businessData.business_name}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    businessData: { ...prev.businessData, business_name: e.target.value }
                  }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="main_category">Hauptkategorie *</Label>
                <Select
                  value={state.businessData.categories.main_category}
                  onValueChange={(value) => setState(prev => ({
                    ...prev,
                    businessData: {
                      ...prev.businessData,
                      categories: { ...prev.businessData.categories, main_category: value }
                    }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Café</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="catering">Catering</SelectItem>
                    <SelectItem value="food_truck">Food Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="business_description">Beschreibung</Label>
              <Textarea
                id="business_description"
                value={state.businessData.business_description}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  businessData: { ...prev.businessData, business_description: e.target.value }
                }))}
                placeholder="Kurze Beschreibung Ihres Unternehmens..."
              />
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Standort
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Stadt *</Label>
                  <Input
                    id="city"
                    value={state.businessData.location.city}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      businessData: {
                        ...prev.businessData,
                        location: { ...prev.businessData.location, city: e.target.value }
                      }
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">PLZ</Label>
                  <Input
                    id="postal_code"
                    value={state.businessData.location.postal_code}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      businessData: {
                        ...prev.businessData,
                        location: { ...prev.businessData.location, postal_code: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Online Presence */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Online-Präsenz
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website_url">Website</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={state.businessData.online_presence.website_url}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      businessData: {
                        ...prev.businessData,
                        online_presence: { ...prev.businessData.online_presence, website_url: e.target.value }
                      }
                    }))}
                    placeholder="https://ihre-website.de"
                  />
                </div>
                <div>
                  <Label htmlFor="gmb_url">Google My Business</Label>
                  <Input
                    id="gmb_url"
                    type="url"
                    value={state.businessData.online_presence.gmb_url}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      businessData: {
                        ...prev.businessData,
                        online_presence: { ...prev.businessData.online_presence, gmb_url: e.target.value }
                      }
                    }))}
                    placeholder="Google My Business URL"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram_url">Instagram</Label>
                  <Input
                    id="instagram_url"
                    type="url"
                    value={state.businessData.online_presence.instagram_url}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      businessData: {
                        ...prev.businessData,
                        online_presence: { ...prev.businessData.online_presence, instagram_url: e.target.value }
                      }
                    }))}
                    placeholder="https://instagram.com/ihr-profil"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook_url">Facebook</Label>
                  <Input
                    id="facebook_url"
                    type="url"
                    value={state.businessData.online_presence.facebook_url}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      businessData: {
                        ...prev.businessData,
                        online_presence: { ...prev.businessData.online_presence, facebook_url: e.target.value }
                      }
                    }))}
                    placeholder="https://facebook.com/ihr-profil"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setState(prev => ({ ...prev, step: 'email' }))}>
                Zurück
              </Button>
              <Button type="submit" disabled={state.loading}>
                {state.loading ? 'Wird gespeichert...' : 'Analyse starten'}
              </Button>
            </div>
          </form>

          {state.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{state.error}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalysisStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Analyse läuft
        </CardTitle>
        <CardDescription>
          Unsere KI analysiert Ihre Online-Sichtbarkeit. Dies kann einige Minuten dauern.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <Progress value={75} className="w-full" />
        <p className="text-sm text-muted-foreground">
          Analysiere Google-Präsenz, Social Media und Wettbewerber...
        </p>
      </CardContent>
    </Card>
  )

  const renderResultsStep = () => {
    if (!state.analysisResults) return null

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Overall Score */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Ihre Sichtbarkeits-Bewertung
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {state.analysisResults.summary_score}
            </div>
            <div className="text-lg text-muted-foreground mb-4">von 100 Punkten</div>
            <Progress value={state.analysisResults.summary_score} className="w-full max-w-md mx-auto" />
          </CardContent>
        </Card>

        {/* Platform Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Plattform-Bewertungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(state.analysisResults.platform_scores).map(([platform, score]) => (
                <div key={platform} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{score}</div>
                  <div className="text-sm text-muted-foreground capitalize">{platform}</div>
                  <Progress value={score} className="mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SWOT Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Stärken</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {state.analysisResults.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Schwächen</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {state.analysisResults.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Quick Wins */}
        <Card>
          <CardHeader>
            <CardTitle>Sofortige Verbesserungen</CardTitle>
            <CardDescription>
              Diese Maßnahmen können Sie schnell umsetzen für bessere Sichtbarkeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {state.analysisResults.quick_wins.map((win, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{win.action}</h4>
                    <div className="flex gap-2">
                      <Badge variant={win.impact === 'high' ? 'default' : 'secondary'}>
                        {win.impact} Impact
                      </Badge>
                      <Badge variant={win.effort === 'low' ? 'default' : 'secondary'}>
                        {win.effort} Aufwand
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Zeitrahmen: {win.timeline}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            PDF herunterladen
          </Button>
          <Button>
            <Eye className="w-4 h-4 mr-2" />
            Detaillierte Analyse
          </Button>
        </div>

        {/* GDPR Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">Datenschutz</p>
                <p className="text-blue-700">
                  Ihre Daten werden DSGVO-konform verarbeitet und nach 180 Tagen automatisch gelöscht. 
                  Sie können jederzeit eine Löschung beantragen oder Ihre Daten exportieren.
                </p>
                <div className="mt-2 space-x-4">
                  <button className="text-blue-600 hover:underline text-sm">
                    Daten exportieren
                  </button>
                  <button className="text-blue-600 hover:underline text-sm">
                    Löschung beantragen
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ================================================================
  // Main Render
  // ================================================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {['email', 'confirmation', 'business_data', 'analysis', 'results'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${state.step === step ? 'bg-blue-600 text-white' : 
                    ['email', 'confirmation', 'business_data', 'analysis', 'results'].indexOf(state.step) > index 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 text-gray-600'}
                `}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${['email', 'confirmation', 'business_data', 'analysis', 'results'].indexOf(state.step) > index 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {state.step === 'email' && renderEmailStep()}
        {state.step === 'confirmation' && renderConfirmationStep()}
        {state.step === 'business_data' && renderBusinessDataStep()}
        {state.step === 'analysis' && renderAnalysisStep()}
        {state.step === 'results' && renderResultsStep()}
      </div>
    </div>
  )
}