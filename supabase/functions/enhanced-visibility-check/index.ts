import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { BedrockRuntimeClient, InvokeModelCommand } from "https://esm.sh/@aws-sdk/client-bedrock-runtime@3.450.0";

// ============= GOOGLE SERVICES INTEGRATION =============

async function fetchGMBMetrics(businessData: any, userId: string, supabase: any) {
  try {
    // Get Google OAuth token for GMB
    const { data: tokenRow } = await supabase
      .from('google_oauth_tokens')
      .select('access_token, refresh_token, gmb_account_id')
      .eq('user_id', userId)
      .eq('service_type', 'gmb')
      .single();

    if (!tokenRow || !tokenRow.access_token) {
      console.log('⚠️ No GMB OAuth token found for user:', userId);
      return null;
    }

    const gmbApiUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${tokenRow.gmb_account_id}/locations`;
    
    const response = await fetch(gmbApiUrl, {
      headers: {
        'Authorization': `Bearer ${tokenRow.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`GMB API error: ${response.status} ${response.statusText}`);
    }

    const gmbData = await response.json();
    
    // Extract key metrics from GMB response
    const metrics = {
      profileComplete: gmbData.locations?.[0]?.attributes?.length > 0,
      hasPhotos: gmbData.locations?.[0]?.photos?.length > 0,
      hasHours: !!gmbData.locations?.[0]?.regularHours,
      verificationStatus: gmbData.locations?.[0]?.verificationStatus,
      rating: gmbData.locations?.[0]?.googleRating || 0,
      reviewCount: gmbData.locations?.[0]?.reviewCount || 0,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ GMB metrics fetched successfully');
    return metrics;
    
  } catch (error) {
    console.error('❌ GMB API error:', error.message);
    return null;
  }
}

async function fetchGA4Metrics(businessData: any, userId: string, supabase: any) {
  try {
    // Get Google OAuth token for Analytics
    const { data: tokenRow } = await supabase
      .from('google_oauth_tokens')
      .select('access_token, refresh_token, ga4_property_id')
      .eq('user_id', userId)
      .eq('service_type', 'analytics')
      .single();

    if (!tokenRow || !tokenRow.access_token || !tokenRow.ga4_property_id) {
      console.log('⚠️ No GA4 OAuth token found for user:', userId);
      return null;
    }

    const ga4ApiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${tokenRow.ga4_property_id}:runReport`;
    
    const reportPayload = {
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'pageviews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' }
      ],
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }]
    };

    const response = await fetch(ga4ApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenRow.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportPayload)
    });

    if (!response.ok) {
      throw new Error(`GA4 API error: ${response.status} ${response.statusText}`);
    }

    const ga4Data = await response.json();
    
    // Process GA4 data
    const totalSessions = ga4Data.rows?.reduce((sum: number, row: any) => sum + parseInt(row.metricValues[0].value), 0) || 0;
    const totalPageviews = ga4Data.rows?.reduce((sum: number, row: any) => sum + parseInt(row.metricValues[1].value), 0) || 0;
    
    const metrics = {
      sessions: totalSessions,
      pageviews: totalPageviews,
      bounceRate: ga4Data.rows?.[0]?.metricValues[2]?.value || 0,
      avgSessionDuration: ga4Data.rows?.[0]?.metricValues[3]?.value || 0,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ GA4 metrics fetched successfully');
    return metrics;
    
  } catch (error) {
    console.error('❌ GA4 API error:', error.message);
    return null;
  }
}

async function fetchGoogleAdsMetrics(businessData: any, userId: string, supabase: any) {
  try {
    // Get Google OAuth token for Ads
    const { data: tokenRow } = await supabase
      .from('google_oauth_tokens')
      .select('access_token, refresh_token, ads_customer_id')
      .eq('user_id', userId)
      .eq('service_type', 'ads')
      .single();

    if (!tokenRow || !tokenRow.access_token || !tokenRow.ads_customer_id) {
      console.log('⚠️ No Google Ads OAuth token found for user:', userId);
      return null;
    }

    const adsApiUrl = `https://googleads.googleapis.com/v15/customers/${tokenRow.ads_customer_id}/googleAds:searchStream`;
    
    const query = `
      SELECT 
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.cost_micros
      FROM campaign 
      WHERE segments.date DURING LAST_30_DAYS
    `;

    const response = await fetch(adsApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenRow.access_token}`,
        'Content-Type': 'application/json',
        'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') || ''
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Google Ads API error: ${response.status} ${response.statusText}`);
    }

    const adsData = await response.json();
    
    // Process Ads data
    const metrics = {
      impressions: adsData.results?.[0]?.metrics?.impressions || 0,
      clicks: adsData.results?.[0]?.metrics?.clicks || 0,
      ctr: adsData.results?.[0]?.metrics?.ctr || 0,
      cost: (adsData.results?.[0]?.metrics?.costMicros || 0) / 1000000, // Convert micros to euros
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Google Ads metrics fetched successfully');
    return metrics;
    
  } catch (error) {
    console.error('❌ Google Ads API error:', error.message);
    return null;
  }
}

// Social URL normalization functions (copied from src/lib/normalizeSocialUrls.ts)
function normalizeFacebookUrl(input: string): string {
  if (!input?.trim()) return '';
  
  const trimmed = input.trim();
  
  // Wenn bereits vollständiger Link vorhanden, bereinige doppelte Präfixe
  if (trimmed.startsWith('http')) {
    // Entferne doppelte facebook.com Präfixe
    const cleaned = trimmed.replace(/^https?:\/\/(www\.)?facebook\.com\/https?:\/\/(www\.)?facebook\.com\//, '');
    if (cleaned !== trimmed) {
      return `https://www.facebook.com/${cleaned}`;
    }
    return trimmed;
  }
  
  // Wenn nur Benutzername oder ID übergeben wurde
  return `https://www.facebook.com/${trimmed}`;
}

function normalizeInstagramUrl(input: string): string {
  if (!input?.trim()) return '';
  
  const trimmed = input.trim();
  
  // Wenn bereits vollständiger Link vorhanden
  if (trimmed.startsWith('http')) {
    return trimmed;
  }
  
  // Entferne @ Symbol falls vorhanden
  const cleanedHandle = trimmed.replace(/^@/, '');
  
  return `https://www.instagram.com/${cleanedHandle}`;
}

function extractSocialHandle(input: string, type: 'instagram' | 'facebook'): string {
  if (!input?.trim()) return '';
  
  const trimmed = input.trim();
  
  // Wenn URL: Extrahiere Handle/Slug
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      
      if (type === 'instagram') {
        return parts[0] || ''; // z. B. "saxmuenchen"
      }
      
      if (type === 'facebook') {
        // Beispiel: https://www.facebook.com/p/SAX-Essen-Trinken-100086793825776/
        if (parts.includes('p') && parts.length > 1) {
          return parts[parts.indexOf('p') + 1] || '';
        }
        return parts[0] || ''; // Page-Name oder Slug
      }
    } catch (error) {
      console.warn('Invalid URL provided:', trimmed);
      return trimmed;
    }
  }
  
  // Entferne @ Symbol falls vorhanden
  return trimmed.replace(/^@/, '');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced LeadData interface according to Phase 2 blueprint
interface LeadData {
  name: string;
  domain?: string;
  categoryId: number;
  categoryName: string;
  competitorUrls: string[];
  language: string;
  location: { 
    city: string; 
    country: string; 
    coordinates?: [number, number] 
  };
  socialLinks?: Record<string, string>;
  // Legacy fields for backward compatibility
  businessName: string;
  mainCategory: string;
  subCategory: string;
  matbakhTags: string[];
  website?: string;
  facebookName?: string;
  instagramName?: string;
  benchmarks: string[];
  email?: string;
  leadId?: string;
  googleName?: string;
  gdprConsent?: boolean;
  marketingConsent?: boolean;
}

// Enhanced VisibilityResult interface for AI response mapping
interface VisibilityResult {
  overallScore: number;
  platformAnalyses: PlatformAnalysis[];
  strengths: string[];
  weaknesses: string[];
  potentials: string[];
  missing_features: string[];
  competitor_benchmark: string[];
  categoryInsights: string[];
  quickWins: string[];
  swotAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  benchmarkInsights: string;
  leadPotential: 'high' | 'medium' | 'low';
  provider: string;
}

interface VisibilityCheckRequest extends LeadData {}

interface InstagramCandidate {
  handle: string
  score: number
  profilePicture?: string
  followerCount?: number
  bio?: string
  confidence: 'high' | 'medium' | 'low'
  matchReason: string
}

interface PlatformAnalysis {
  platform: 'google' | 'facebook' | 'instagram'
  score: number
  maxScore: number
  completedFeatures: string[]
  missingFeatures: string[]
  profileUrl?: string
  profilePicture?: string
  profileFound: boolean
  autoDetected?: boolean
  recommendations: string[]
  followerCount?: number
  reservationAvailable?: boolean
  hasHolidayHours?: boolean
  askSectionVisible?: boolean
  isListingComplete?: boolean
  category?: string
  candidates?: InstagramCandidate[]
  details?: any
  strengths?: string[]
  weaknesses?: string[]
}

// Generate Instagram handle candidates
function generateInstagramHandles(businessName: string, location: string): string[] {
  const cleanName = businessName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
  
  const cleanLocation = location.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .split(',')[0] // Take first part before comma
  
  const variants = [
    cleanName,
    `${cleanName}${cleanLocation}`,
    `${cleanName}_${cleanLocation}`,
    `restaurant_${cleanName}`,
    `${cleanName}_restaurant`,
    cleanName.substring(0, 8) + cleanLocation.substring(0, 4),
    cleanName.replace(/restaurant|gastro|bar|cafe/g, ''),
  ].filter(Boolean)
  
  return [...new Set(variants)].slice(0, 10) // Remove duplicates and limit
}

// Mock Instagram profile lookup (in real implementation, use Instagram Basic Display API)
async function fetchInstagramProfile(handle: string): Promise<{
  exists: boolean
  followers?: number
  profileImage?: string
  bio?: string
} | null> {
  // Mock implementation - replace with actual Instagram API calls
  const mockProfiles: Record<string, any> = {
    'saxmuenchen': {
      exists: true,
      followers: 1240,
      profileImage: 'https://example.com/sax_profile.jpg',
      bio: 'Restaurant in München'
    },
    'saxessenundtrinken': {
      exists: true,
      followers: 870,
      profileImage: 'https://example.com/sax2_profile.jpg',
      bio: 'Essen & Trinken in München'
    }
  }
  
  return mockProfiles[handle] || null
}

// Compute relevance score for Instagram candidates
function computeRelevanceScore(businessName: string, handle: string, followers: number): number {
  let score = 0.5 // Base score
  
  // Name similarity boost
  if (handle.includes(businessName.toLowerCase().replace(/[^a-z]/g, ''))) {
    score += 0.3
  }
  
  // Follower count boost (logarithmic)
  if (followers > 0) {
    score += Math.min(0.2, Math.log10(followers) / 10)
  }
  
  return Math.min(1.0, score)
}

// ============= ENHANCED MOCK ANALYSIS FUNCTION - PHASE 2 =============
function generateMockAnalysis(input: any, categoryContext: string[], benchmarkData: any[]) {
  const businessType = input.mainCategory || 'restaurant';
  const hasGoogleProfile = !!input.googleName;
  const hasFacebookProfile = !!input.facebookName;
  const hasInstagramProfile = !!input.instagramName;
  
  return {
    overallScore: Math.floor(Math.random() * 30) + 70,
    platformAnalyses: [
      {
        platform: "google",
        score: hasGoogleProfile ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30) + 30,
        details: {
          hasProfile: hasGoogleProfile,
          profileComplete: hasGoogleProfile,
          hasReviews: hasGoogleProfile,
          hasPhotos: hasGoogleProfile,
          hasHours: hasGoogleProfile,
          rating: hasGoogleProfile ? 4.2 : 0,
          reviewCount: hasGoogleProfile ? 89 : 0
        },
        strengths: hasGoogleProfile ? ["Vollständiges Profil vorhanden", "Gute Bewertungen"] : [],
        weaknesses: hasGoogleProfile ? ["Begrenzte Foto-Auswahl"] : ["Kein Google Profil gefunden"],
        recommendations: hasGoogleProfile ? ["Mehr aktuelle Fotos hinzufügen"] : ["Google My Business Profil erstellen"]
      },
      {
        platform: "facebook",
        score: hasFacebookProfile ? Math.floor(Math.random() * 30) + 50 : Math.floor(Math.random() * 20) + 20,
        details: {
          hasProfile: hasFacebookProfile,
          profileComplete: hasFacebookProfile,
          hasPhotos: hasFacebookProfile,
          followerCount: hasFacebookProfile ? Math.floor(Math.random() * 500) + 100 : 0
        },
        strengths: hasFacebookProfile ? ["Facebook Seite vorhanden"] : [],
        weaknesses: hasFacebookProfile ? ["Wenig Aktivität"] : ["Keine Facebook Präsenz"],
        recommendations: hasFacebookProfile ? ["Regelmäßige Posts"] : ["Facebook Business Seite erstellen"]
      },
      {
        platform: "instagram",
        score: hasInstagramProfile ? Math.floor(Math.random() * 30) + 40 : Math.floor(Math.random() * 20) + 15,
        details: {
          hasProfile: hasInstagramProfile,
          followerCount: hasInstagramProfile ? Math.floor(Math.random() * 800) + 200 : 0,
          hasPhotos: hasInstagramProfile
        },
        strengths: hasInstagramProfile ? ["Instagram Account vorhanden", "Visuelle Inhalte"] : [],
        weaknesses: hasInstagramProfile ? ["Begrenzte Reichweite"] : ["Keine Instagram Präsenz"],
        recommendations: hasInstagramProfile ? ["Story-Highlights nutzen"] : ["Instagram Business Account erstellen"]
      }
    ],
    // Phase 2: New required fields with realistic mock data
    strengths: [
      hasGoogleProfile ? "Vollständiges Google My Business Profil" : "Lokale Bekanntheit vorhanden",
      input.hasGoogleData ? "Echte Metriken verfügbar" : "Grundlegende Online-Präsenz",
      `Spezialisierung als ${businessType} erkennbar`
    ],
    weaknesses: [
      !hasGoogleProfile ? "Fehlendes Google My Business Profil" : "Begrenzte Foto-Auswahl",
      !hasFacebookProfile && !hasInstagramProfile ? "Keine Social Media Präsenz" : "Unregelmäßige Social Media Aktivität",
      "Fehlende Online-Reservierungsmöglichkeiten"
    ],
    potentials: [
      "Instagram Marketing für visuelle Speisepräsentation",
      hasGoogleProfile ? "Google Posts für tagesaktuelle Angebote" : "Google My Business Profil Optimierung",
      "Bewertungsmanagement zur Vertrauensbildung",
      `${businessType}-spezifische Features nutzen`
    ],
    missing_features: [
      !hasGoogleProfile ? "Google My Business Profil" : "Online-Reservierungssystem",
      "Digitale Speisekarte mit aktuellen Preisen",
      !hasInstagramProfile ? "Instagram Business Account" : "Instagram Story-Highlights",
      "Lieferservice-Integration"
    ],
    competitor_benchmark: [
      `Branchendurchschnitt für ${businessType}: 4.1 Sterne, 95 Bewertungen`,
      "Konkurrenten nutzen verstärkt Social Media Marketing",
      hasGoogleProfile ? "Ihre Google-Präsenz ist überdurchschnittlich" : "Konkurrenten haben bessere Google-Sichtbarkeit",
      "Lokale Konkurrenz nutzt Online-Reservierungssysteme"
    ],
    categoryInsights: [
      `Als ${businessType} sollten Sie besonders auf visuelle Inhalte setzen`,
      'Bewertungsmanagement ist in Ihrer Branche besonders wichtig',
      categoryContext.length > 0 ? `Ihre Unterkategorie "${categoryContext[0]}" bietet spezielle Möglichkeiten` : 'Nutzen Sie branchenspezifische Features'
    ],
    quickWins: [
      hasGoogleProfile ? 'Fügen Sie 5-10 hochwertige Fotos zu Ihrem Google Profil hinzu' : 'Erstellen Sie ein Google My Business Profil',
      'Reagieren Sie auf alle Bewertungen der letzten 30 Tage',
      !hasInstagramProfile ? 'Erstellen Sie einen Instagram Business Account' : 'Nutzen Sie Instagram Stories regelmäßig'
    ],
    swotAnalysis: {
      strengths: [
        "Etablierte lokale Präsenz", 
        hasGoogleProfile ? "Vollständiges Google-Profil" : "Bekannter Name in der Nachbarschaft"
      ],
      weaknesses: [
        !hasGoogleProfile ? "Fehlende Google-Sichtbarkeit" : "Begrenzte Online-Sichtbarkeit",
        "Wenig Social Media Aktivität"
      ],
      opportunities: [
        "Social Media Ausbau", 
        "Bewertungsmanagement",
        `${businessType}-spezifisches Marketing`
      ],
      threats: [
        "Starke lokale Konkurrenz", 
        "Digitale Transformation in der Gastronomie",
        "Negative Bewertungen"
      ]
    },
    benchmarkInsights: benchmarkData.length > 0 
      ? `Basierend auf ${benchmarkData.length} Branchenbenchmarks liegt Ihre Performance im mittleren Bereich`
      : "Mock-Daten - Ihre Performance liegt im Branchendurchschnitt",
    leadPotential: hasGoogleProfile && (hasFacebookProfile || hasInstagramProfile) ? "high" : 
                   hasGoogleProfile ? "medium" : "low",
    provider: "mockAnalysis"
  };
}

// ============= BEDROCK AI CLIENT WITH LOCALIZED i18n PROMPTS - PHASE 2 =============
async function callBedrockVisibilityAnalysis(input: any, categoryContext: string[], benchmarkData: any[], language: string = 'de') {
  const client = new BedrockRuntimeClient({ 
    region: Deno.env.get('AWS_BEDROCK_REGION') || 'eu-central-1',
    credentials: {
      accessKeyId: Deno.env.get('AWS_BEDROCK_ACCESS_KEY_ID') || '',
      secretAccessKey: Deno.env.get('AWS_BEDROCK_SECRET_ACCESS_KEY') || ''
    }
  });

  const MODEL_ID = Deno.env.get('AWS_BEDROCK_MODEL_ID') || "anthropic.claude-3-5-sonnet-20241022-v2:0";

  // Enhanced data context including Google Services metrics
  const businessData = {
    name: input.businessName,
    location: input.location,
    category: input.mainCategory,
    competitors: benchmarkData.map(b => b.name || b.metric_name).filter(Boolean).join(', ') || 'Keine Benchmark-Daten',
    googleProfile: input.googleName || 'Nicht angegeben',
    facebookProfile: input.facebookName || 'Nicht angegeben', 
    instagramProfile: input.instagramName || 'Nicht angegeben',
    hasGoogleData: input.hasGoogleData || false,
    gmbMetrics: input.gmbMetrics,
    ga4Metrics: input.ga4Metrics,
    adsMetrics: input.adsMetrics
  };

  // Enhanced category-specific requirements based on restaurant type
  const categoryRequirements = getCategorySpecificRequirements(input.mainCategory, language);

  // Task 1A: System-Prompt (Übersichtsanalyse) mit i18n
  const systemPrompt = createSystemPrompt(businessData, categoryRequirements, language);
  
  // Task 1B: Detail-Prompt (SWOT & Empfehlungen) mit i18n  
  const detailPrompt = createDetailPrompt(businessData, language);

// ============= i18n PROMPT HELPER FUNCTIONS - PHASE 2 =============

// Task 1A: System-Prompt (Übersichtsanalyse) mit i18n
function createSystemPrompt(businessData: any, categoryRequirements: string, language: string): string {
  const prompts = {
    de: {
      system: `Du bist ein KI-Analyst für Unternehmenssichtbarkeit. Nutze als Datenquellen: Google My Business Eintrag (Vorhandensein, Vollständigkeit), Webseite (Meta-Tags, strukturierte Daten), Social Media (Facebook, Instagram, TripAdvisor), Branchen-Kategorie (${businessData.category}), Wettbewerbsdaten (${businessData.competitors}).`,
      overview: `Analysiere die Online-Präsenz von ${businessData.name} als ${businessData.category} im Vergleich zu: ${businessData.competitors}. Erstelle eine strukturierte JSON-Antwort mit praktischen, umsetzbaren Empfehlungen.`,
      categoryContext: `Als ${businessData.category} solltest du besonders auf ${categoryRequirements} achten. Nutze branchenspezifische Benchmarks für ${language}.`,
      dataAvailable: `VERFÜGBARE ECHTE DATEN:
       ${businessData.hasGoogleData ? '✅ Google Services Metriken verfügbar' : '❌ Keine Google-Anbindung'}
       ${businessData.gmbMetrics ? `• GMB: ${businessData.gmbMetrics.rating || 'N/A'} Sterne, ${businessData.gmbMetrics.reviewCount || 0} Bewertungen` : ''}
       ${businessData.ga4Metrics ? `• GA4: ${businessData.ga4Metrics.sessions || 0} Sessions, ${businessData.ga4Metrics.pageviews || 0} Pageviews` : ''}
       ${businessData.adsMetrics ? `• Ads: ${businessData.adsMetrics.impressions || 0} Impressions, €${businessData.adsMetrics.cost || 0} Kosten` : ''}`,
      jsonStructure: `Gib ausschließlich im JSON-Format aus: { strengths: [...], weaknesses: [...], potentials: [...], missing_features: [...], competitor_benchmark: [...], swotAnalysis: {...}, quickWins: [...], categoryInsights: [...], benchmarkInsights: '...', leadPotential: 'high/medium/low' }`
    },
    en: {
      system: `You are an AI analyst for business visibility. Use as data sources: Google My Business entry (existence, completeness), Website (meta tags, structured data), Social Media (Facebook, Instagram, TripAdvisor), Industry category (${businessData.category}), Competitor data (${businessData.competitors}).`,
      overview: `Analyze the online presence of ${businessData.name} as ${businessData.category} compared to: ${businessData.competitors}. Create a structured JSON response with practical, actionable recommendations.`,
      categoryContext: `As a ${businessData.category} you should particularly focus on ${categoryRequirements}. Use industry-specific benchmarks for ${language}.`,
      dataAvailable: `AVAILABLE REAL DATA:
       ${businessData.hasGoogleData ? '✅ Google Services metrics available' : '❌ No Google connection'}
       ${businessData.gmbMetrics ? `• GMB: ${businessData.gmbMetrics.rating || 'N/A'} stars, ${businessData.gmbMetrics.reviewCount || 0} reviews` : ''}
       ${businessData.ga4Metrics ? `• GA4: ${businessData.ga4Metrics.sessions || 0} sessions, ${businessData.ga4Metrics.pageviews || 0} pageviews` : ''}
       ${businessData.adsMetrics ? `• Ads: ${businessData.adsMetrics.impressions || 0} impressions, €${businessData.adsMetrics.cost || 0} cost` : ''}`,
      jsonStructure: `Output exclusively in JSON format: { strengths: [...], weaknesses: [...], potentials: [...], missing_features: [...], competitor_benchmark: [...], swotAnalysis: {...}, quickWins: [...], categoryInsights: [...], benchmarkInsights: '...', leadPotential: 'high/medium/low' }`
    }
  };

  const lang = prompts[language as keyof typeof prompts] || prompts.de;
  
  return `${lang.system}
       
  ${lang.overview}
       
  BESONDERE ANFORDERUNGEN:
  ${lang.categoryContext}
       
  ${lang.dataAvailable}
       
  ${lang.jsonStructure}`;
}

// Task 1B: Detail-Prompt (SWOT & Empfehlungen) mit i18n
function createDetailPrompt(businessData: any, language: string): string {
  const prompts = {
    de: {
      detailSwot: `Erzeuge eine detaillierte SWOT-Analyse für das Unternehmen ${businessData.name}. Nutze: zuvor generierte Übersichtsergebnisse, Branchen-Benchmarks, Social Media Signale. Gib strukturiertes JSON mit swot und recommendations aus.`,
      requirements: `Erstelle konkrete, umsetzbare Empfehlungen mit Priorisierung nach Aufwand (1-5) und Wirkung (1-5).`,
      competitorAnalysis: `Vergleiche ${businessData.name} mit den Mitbewerbern: ${businessData.competitors}. Identifiziere Wettbewerbsvorteile und Aufholpotential.`
    },
    en: {
      detailSwot: `Generate a detailed SWOT analysis for the company ${businessData.name}. Use: previously generated overview results, industry benchmarks, social media signals. Provide structured JSON with swot and recommendations.`,
      requirements: `Create concrete, actionable recommendations with prioritization by effort (1-5) and impact (1-5).`,
      competitorAnalysis: `Compare ${businessData.name} with competitors: ${businessData.competitors}. Identify competitive advantages and catch-up potential.`
    }
  };

  const lang = prompts[language as keyof typeof prompts] || prompts.de;
  
  return `RESTAURANT-DATEN:
– Name: ${businessData.name}
– Standort: ${businessData.location}
– Kategorie: ${businessData.category}
– Social Handles:
  • Google: ${businessData.googleProfile}
  • Facebook: ${businessData.facebookProfile}
  • Instagram: ${businessData.instagramProfile}
– Benchmark-Unternehmen: ${businessData.competitors}

AUFGABE: ${lang.detailSwot}

${lang.requirements}

${lang.competitorAnalysis}

ERWARTETES JSON-FORMAT:

{
  "overallScore": 75,
  "platformAnalyses": [
    {
      "platform": "google",
      "score": 85,
      "details": {
        "hasProfile": true,
        "profileComplete": true,
        "hasReviews": true,
        "hasPhotos": true,
        "hasHours": true,
        "rating": 4.5,
        "reviewCount": 120
      },
      "strengths": ["Vollständiges Profil", "Gute Bewertungen"],
      "weaknesses": ["Wenige aktuelle Fotos"],
      "recommendations": ["Mehr Fotos hochladen", "Auf Bewertungen antworten"]
    }
  ],
  "strengths": [
    "Vollständiges Google My Business Profil vorhanden",
    "Gute Durchschnittsbewertung von 4.5 Sternen",
    "Regelmäßige Bewertungen zeigen aktive Kundenbasis"
  ],
  "weaknesses": [
    "Begrenzte Fotoauswahl auf Google My Business",
    "Keine aktive Social Media Präsenz erkennbar",
    "Öffnungszeiten nicht immer aktuell"
  ],
  "potentials": [
    "Instagram Marketing für visuelle Speisepräsentation",
    "Facebook Events für Veranstaltungen und Aktionen",
    "Google Posts für tagesaktuelle Angebote"
  ],
  "missing_features": [
    "Online-Reservierungssystem fehlt",
    "Keine digitale Speisekarte verlinkt",
    "Fehlende Integration von Lieferdiensten"
  ],
  "competitor_benchmark": [
    "Konkurrent A: 4.2 Sterne, 89 Bewertungen, aktive Instagram-Präsenz",
    "Konkurrent B: 4.0 Sterne, 156 Bewertungen, Online-Reservierung verfügbar",
    "Branchendurchschnitt: 4.1 Sterne, 95 Bewertungen"
  ],
  "categoryInsights": [
    "Als italienisches Restaurant sollten Sie besonders auf visuelle Inhalte setzen",
    "Bewertungsmanagement ist in Ihrer Branche entscheidend"
  ],
  "quickWins": [
    "Fügen Sie 5-10 hochwertige Fotos hinzu",
    "Reagieren Sie auf alle Bewertungen der letzten 30 Tage",
    "Aktualisieren Sie Ihre Öffnungszeiten"
  ],
  "swotAnalysis": {
    "strengths": ["Gute Bewertungen", "Vollständiges Google-Profil"],
    "weaknesses": ["Wenige Fotos", "Keine Social Media Präsenz"],
    "opportunities": ["Instagram Marketing", "Bewertungsmanagement"],
    "threats": ["Starke lokale Konkurrenz", "Negative Bewertungen"]
  },
  "benchmarkInsights": "Ihr Restaurant liegt 15% über dem Branchendurchschnitt",
  "leadPotential": "high"
}

WICHTIG: 
- Sei spezifisch und konstruktiv
- Nutze die tatsächlichen Daten aus dem Input
- Gib praktische, umsetzbare Empfehlungen
- Bewerte realistisch basierend auf den verfügbaren Informationen
- Antworte NUR mit dem JSON, keine zusätzlichen Erklärungen
`;
}

// Execute Bedrock analysis with i18n prompts
  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: "user", 
            content: systemPrompt + "\n\n" + detailPrompt
          }
        ]
      })
    });

    const response = await client.send(command);
    const text = new TextDecoder().decode(response.body);
    const jsonData = JSON.parse(text);
    
    // Extract the content from Claude's response
    const content = jsonData.content[0].text;
    
    // Parse the JSON from the content
    const analysisResult = JSON.parse(content);
    
    console.log('✅ Bedrock analysis completed successfully with i18n prompts');
    return {
      ...analysisResult,
      provider: "bedrock-i18n"
    };
    
  } catch (error) {
    console.error('❌ Bedrock analysis failed:', error);
    throw error; // Let the fallback logic handle this
  }
}

// Category-specific requirements function
function getCategorySpecificRequirements(category: string, language: string = 'de'): string {
  const requirements: Record<string, {de: string, en: string}> = {
    'restaurant': {
      de: 'Hochwertige Speisefotos, Öffnungszeiten, Online-Reservierungen, aktuelle Speisekarte, Bewertungsmanagement',
      en: 'High-quality food photos, opening hours, online reservations, current menu, review management'
    },
    'cafe': {
      de: 'Atmosphäre-Fotos, WiFi-Information, Frühstückszeiten, Events, Instagram-Präsenz',
      en: 'Atmosphere photos, WiFi information, breakfast times, events, Instagram presence'
    },
    'bar': {
      de: 'Getränkekarte, Happy Hour Zeiten, Event-Ankündigungen, Atmosphere, Social Media',
      en: 'Drink menu, happy hour times, event announcements, atmosphere, social media'
    },
    'pizzeria': {
      de: 'Lieferservice-Integration, Online-Bestellung, Speisekarte mit Preisen, Bewertungen',
      en: 'Delivery service integration, online ordering, menu with prices, reviews'
    },
    'fastfood': {
      de: 'Schnelle Bestellung, Drive-Through Info, Öffnungszeiten, Preisliste, Mobile Apps',
      en: 'Quick ordering, drive-through info, opening hours, price list, mobile apps'
    },
    'bakery': {
      de: 'Frische Produkte, Tagesangebote, Frühe Öffnungszeiten, Vorbestellungen',
      en: 'Fresh products, daily specials, early opening hours, pre-orders'
    }
  };
  
  const categoryKey = category.toLowerCase();
  const req = requirements[categoryKey] || requirements['restaurant'];
  return language === 'de' ? req.de : req.en;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const data: VisibilityCheckRequest = await req.json()
    
    console.log('🚀 Enhanced AI-powered visibility check started for:', data.businessName)
    
    // Generate Instagram candidates if no explicit Instagram provided
    const instagramCandidates: InstagramCandidate[] = []
    
    if (!data.instagramName) {
      const candidateHandles = generateInstagramHandles(data.businessName, data.location)
      
      for (const handle of candidateHandles) {
        const profile = await fetchInstagramProfile(handle)
        if (profile?.exists) {
          const score = computeRelevanceScore(data.businessName, handle, profile.followers || 0)
          
          instagramCandidates.push({
            handle,
            score,
            profilePicture: profile.profileImage,
            followerCount: profile.followers,
            bio: profile.bio,
            confidence: score > 0.8 ? 'high' : score > 0.6 ? 'medium' : 'low',
            matchReason: `Name ähnlich zu "${data.businessName}"`
          })
        }
      }
      
      // Sort by score, highest first
      instagramCandidates.sort((a, b) => b.score - a.score)
    }

    console.log('🔍 Performing comprehensive AI-powered visibility analysis...')
    
// Initialize Supabase client for data queries
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Google Services Integration
    const useGoogleServices = Deno.env.get('USE_GOOGLE_SERVICES') === 'true';
    console.log('🔌 Using Google Services:', useGoogleServices);
    
    let gmbMetrics = null;
    let ga4Metrics = null;
    let adsMetrics = null;

    if (useGoogleServices && data.leadId) {
      try {
        // Get Google OAuth tokens for this user/lead
        const { data: leadData } = await supabase
          .from('visibility_check_leads')
          .select('user_id, email')
          .eq('id', data.leadId)
          .single();

        if (leadData?.user_id) {
          // Fetch Google metrics from authenticated APIs
          gmbMetrics = await fetchGMBMetrics(data, leadData.user_id, supabase);
          ga4Metrics = await fetchGA4Metrics(data, leadData.user_id, supabase);
          adsMetrics = await fetchGoogleAdsMetrics(data, leadData.user_id, supabase);
          
          console.log('📊 Fetched Google Services data:', {
            gmb: !!gmbMetrics,
            ga4: !!ga4Metrics, 
            ads: !!adsMetrics
          });
        }
      } catch (error) {
        console.warn('⚠️ Google Services API error, falling back to mock data:', error.message);
        // Continue with mock data as fallback
      }
    }

    // 2.1.1: Load related categories for dynamic prompting using new Many-to-Many model
    const { data: relatedCats } = await supabase
      .from('gmb_categories')
      .select(`
        name_de, 
        name_en,
        description_de,
        description_en,
        keywords,
        related_categories!inner(
          related_category_id,
          relationship_type,
          strength
        )
      `)
      .eq('category_id', data.mainCategory);
    
    const locale = 'de'; // Can be dynamic based on user locale
    const relatedCategories = (relatedCats || [])
      .map(c => ({
        name: locale === 'de' ? c.name_de : c.name_en,
        description: locale === 'de' ? c.description_de : c.description_en,
        keywords: c.keywords || [],
        relationshipType: c.related_categories?.[0]?.relationship_type
      }))
      .filter(cat => cat.name);
    
    // Top-3 related categories for prompt with keywords
    const promptCategories = relatedCategories.slice(0, 3);
    console.log('📋 Using related categories for AI context:', promptCategories);

    // 2.1.2: Load benchmark data from industry_benchmarks table
    const { data: benchmarkData } = await supabase
      .from('industry_benchmarks')
      .select('*')
      .eq('industry', data.mainCategory)
      .limit(5);
    
    const benchmarks = benchmarkData || [];
    console.log('📊 Loaded industry benchmarks:', benchmarks.length);
    
    // Prepare data for Bedrock analysis with Google metrics
    const analysisInput = {
      businessName: data.businessName,
      mainCategory: data.mainCategory,
      location: data.location,
      googleName: data.googleName,
      facebookName: data.facebookName,
      instagramName: data.instagramName,
      instagramCandidates: instagramCandidates,
      benchmarks: data.benchmarks,
      industry: data.mainCategory,
      timestamp: new Date().toISOString(),
      // Real Google data integration
      gmbMetrics,
      ga4Metrics,
      adsMetrics,
      hasGoogleData: !!(gmbMetrics || ga4Metrics || adsMetrics)
    };

    // Dual-Pipeline: Feature Flag + Fallback Logic
    const useBedrock = Deno.env.get('USE_BEDROCK') === 'true';
    console.log('🤖 Using Bedrock AI:', useBedrock);
    
    let aiAnalysis;
    try {
      if (useBedrock) {
        aiAnalysis = await callBedrockVisibilityAnalysis(analysisInput, promptCategories, benchmarks);
      } else {
        console.log('📝 Using mock analysis (USE_BEDROCK=false)');
        aiAnalysis = generateMockAnalysis(analysisInput, promptCategories, benchmarks);
      }
    } catch (error) {
      console.warn('❌ Bedrock failed, using mock fallback:', error.message);
      aiAnalysis = generateMockAnalysis(analysisInput, promptCategories, benchmarks);
    }
    
    // Phase 2: Enhanced AI-Response Mapping - Extract all required fields
    const {
      overallScore,
      platformAnalyses,
      strengths,
      weaknesses,
      potentials,
      missing_features,
      competitor_benchmark,
      categoryInsights,
      quickWins,
      swotAnalysis,
      benchmarkInsights,
      leadPotential
    } = aiAnalysis;

    // Generate enhanced benchmark data using industry_benchmarks
    const enhancedBenchmarks = benchmarks.length > 0 
      ? benchmarks.map(benchmark => ({
          name: benchmark.metric_name || 'Benchmark',
          scores: {
            google: Math.round(benchmark.metric_value * 0.8),
            facebook: Math.round(benchmark.metric_value * 0.7),
            instagram: Math.round(benchmark.metric_value * 0.6),
            overall: Math.round(benchmark.metric_value)
          },
          profileUrls: {
            google: `https://www.google.com/maps/search/${encodeURIComponent(data.businessName)}`,
            facebook: `https://www.facebook.com/search/top?q=${encodeURIComponent(data.businessName)}`,
            instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(data.businessName.replace(/\s+/g, ''))}`
          },
          percentileRank: benchmark.percentile_rank || null,
          sampleSize: benchmark.sample_size || null
        }))
      : data.benchmarks.filter(Boolean).map(name => ({
          name,
          scores: {
            google: Math.floor(Math.random() * 40) + 60,
            facebook: Math.floor(Math.random() * 40) + 50,
            instagram: Math.floor(Math.random() * 40) + 45,
            overall: Math.floor(Math.random() * 30) + 65
          },
          profileUrls: {
            google: `https://www.google.com/maps/search/${encodeURIComponent(name)}`,
            facebook: `https://www.facebook.com/search/top?q=${encodeURIComponent(name)}`,
            instagram: `https://www.instagram.com/explore/tags/${encodeURIComponent(name.replace(/\s+/g, ''))}`
          }
        }));

    // Phase 2: Enhanced result structure with all required fields
    const result = {
      overallScore,
      platformAnalyses,
      benchmarks: enhancedBenchmarks,
      // Phase 2: New required fields
      strengths: strengths || [
        "Etablierte lokale Präsenz",
        "Grundlegende Online-Sichtbarkeit vorhanden"
      ],
      weaknesses: weaknesses || [
        "Begrenzte Social Media Präsenz",
        "Fehlende strategische Online-Ausrichtung"
      ],
      potentials: potentials || [
        "Ausbau der digitalen Kanäle",
        "Verbesserung der Kundeninteraktion"
      ],
      missing_features: missing_features || [
        "Online-Reservierungssystem",
        "Aktive Social Media Strategie"
      ],
      competitor_benchmark: competitor_benchmark || [
        "Durchschnittliche Performance im Branchenvergleich"
      ],
      // Existing fields with fallbacks
      categoryInsights: categoryInsights || [
        `Als ${data.mainCategory} sollten Sie besonders auf visuelle Inhalte setzen`,
        'Bewertungsmanagement ist in Ihrer Branche besonders wichtig'
      ],
      quickWins: quickWins || [
        'Fügen Sie 5-10 hochwertige Fotos zu Ihrem Google Profil hinzu',
        'Reagieren Sie auf alle Bewertungen der letzten 30 Tage',
        'Erstellen Sie einen Instagram Business Account falls noch nicht vorhanden'
      ],
      swotAnalysis: swotAnalysis || {
        strengths: ["Etablierte lokale Präsenz"],
        weaknesses: ["Begrenzte Online-Sichtbarkeit"],
        opportunities: ["Social Media Ausbau"],
        threats: ["Lokale Konkurrenz"]
      },
      benchmarkInsights: benchmarkInsights || "Ihre Performance liegt im Branchendurchschnitt",
      leadPotential: leadPotential || (overallScore > 70 ? 'high' : overallScore > 50 ? 'medium' : 'low'),
      reportData: {
        businessName: data.businessName,
        location: data.location,
        analysisDate: new Date().toISOString(),
        platforms: platformAnalyses.length,
        aiPowered: true,
        provider: aiAnalysis.provider || 'enhanced'
      }
    }

    console.log('✅ AI Analysis completed with overall score:', overallScore)
    
    // 2.2.2: Ergebnis-Mapping & Persistierung der AI-Antwort
    if (data.leadId) {
      console.log('💾 Saving analysis results to database for lead:', data.leadId)

      try {
        // Set status to analyzing first
        const { error: statusError } = await supabase
          .from('visibility_check_leads')
          .update({ status: 'analyzing' })
          .eq('id', data.leadId);

        if (statusError) {
          console.error('❌ Error updating lead status to analyzing:', statusError);
        }

        // Task 3: AI-Response-Mapping - Enhanced Insert-Objekt mit Phase-2-Feldern
        const provider = aiAnalysis.provider || (useBedrock ? 'bedrock' : 'mockAnalysis');
        
        // Extract AI recommendations with proper mapping
        const mappedRecommendations = aiAnalysis.recommendations?.map((rec: any) => ({
          task: rec.task || rec.description || '',
          impact: typeof rec.impact === 'number' ? rec.impact : 3,
          effort: typeof rec.effort === 'number' ? rec.effort : 3,
          priority: rec.priority || (rec.impact > 4 ? 'high' : rec.impact > 2 ? 'medium' : 'low')
        })) || [];

        const insertPayload = {
          lead_id: data.leadId,
          overall_score: overallScore,
          platform_analyses: platformAnalyses,
          
          // Task 3: AI-Response-Mapping - Neue Phase-2-Felder
          strengths: strengths || [],
          weaknesses: weaknesses || [],
          potentials: potentials || [],
          missing_features: missing_features || [],
          competitor_benchmark: competitor_benchmark || [],
          trends: aiAnalysis.trends || {},         // Google Trends Data added
          
          // Enhanced SWOT mit Recommendations-Mapping
          swot_analysis: {
            ...swotAnalysis,
            recommendations: mappedRecommendations
          },
          
          // Bestehende Felder mit Fallbacks
          category_insights: categoryInsights || [],
          quick_wins: quickWins || [],
          benchmark_insights: benchmarkInsights || "Analyse abgeschlossen",
          lead_potential: leadPotential || 'medium',
          
          // Metadaten und Raw-Daten
          analysis_results: aiAnalysis,            // vollständiges Raw-JSON für spätere Audits
          instagram_candidates: instagramCandidates,
          provider,                                // Provider-Tracking (bedrock/mockAnalysis)
          
          // Google Services Integration
          gmb_metrics: gmbMetrics || {},           // Google My Business Metriken
          ga4_metrics: ga4Metrics || {},           // Google Analytics 4 Metriken  
          ads_metrics: adsMetrics || {}            // Google Ads Metriken
        };

        // Speichere in visibility_check_results
        const { error: insertErr } = await supabase
          .from('visibility_check_results')
          .insert(insertPayload);

        if (insertErr) {
          console.error('❌ Insert AI results failed:', insertErr);
          await supabase
            .from('visibility_check_leads')
            .update({ status: 'failed', analysis_error_message: insertErr.message })
            .eq('id', data.leadId);
          throw insertErr;
        }

        // Status auf „completed" setzen → PDF-Trigger via DB-Trigger greift
        const { error: statusErr } = await supabase
          .from('visibility_check_leads')
          .update({ status: 'completed' })
          .eq('id', data.leadId);

        if (statusErr) {
          console.error('❌ Updating status to completed failed:', statusErr);
          await supabase
            .from('visibility_check_leads')
            .update({ status: 'failed', analysis_error_message: statusErr.message })
            .eq('id', data.leadId);
          throw statusErr;
        }

        console.log('✅ AI results persisted and lead marked completed');
        
      } catch (error) {
        console.error('❌ Critical error in analysis workflow:', error);
        // Ensure lead is marked as failed in any error case
        await supabase
          .from('visibility_check_leads')
          .update({ 
            status: 'failed',
            analysis_error_message: `Critical workflow error: ${error.message}`
          })
          .eq('id', data.leadId);
        
        throw error;
      }
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Error in enhanced-visibility-check:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})