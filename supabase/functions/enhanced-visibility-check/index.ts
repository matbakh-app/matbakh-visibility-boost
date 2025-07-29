import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { BedrockRuntimeClient, InvokeModelCommand } from "https://esm.sh/@aws-sdk/client-bedrock-runtime@3.450.0";

// GOOGLE SERVICES INTEGRATION
// -----------------------------------------------------------------------------
// Replace with your Google Maps API key
const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

// Function to fetch place details from Google Places API
async function fetchPlaceDetails(placeId: string) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ Google Maps API key not set. Skipping place details fetch.');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,website,opening_hours,photos,reviews&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK') {
      return data.result;
    } else {
      console.error('❌ Google Places API error:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching place details:', error);
    return null;
  }
}

// Function to fetch place ID from Google Places API based on business name and location
async function fetchPlaceId(businessName: string, location: string) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️ Google Maps API key not set. Skipping place ID fetch.');
    return null;
  }

  const query = `${businessName} in ${location}`;
  const encodedQuery = encodeURIComponent(query);
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodedQuery}&inputtype=textquery&fields=place_id&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.candidates.length > 0) {
      return data.candidates[0].place_id;
    } else {
      console.warn('⚠️ No place ID found for:', query, data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching place ID:', error);
    return null;
  }
}

// Function to fetch Google Business Profile data
async function fetchGoogleBusinessProfile(businessName: string, location: string) {
  try {
    // Fetch place ID
    const placeId = await fetchPlaceId(businessName, location);
    if (!placeId) {
      console.warn('⚠️ No place ID found for:', businessName, location);
      return null;
    }

    // Fetch place details
    const placeDetails = await fetchPlaceDetails(placeId);
    if (!placeDetails) {
      console.warn('⚠️ No place details found for place ID:', placeId);
      return null;
    }

    // Extract relevant data
    const googleData = {
      name: placeDetails.name,
      rating: placeDetails.rating || 0,
      formatted_phone_number: placeDetails.formatted_phone_number || '',
      website: placeDetails.website || '',
      opening_hours: placeDetails.opening_hours ? placeDetails.opening_hours.weekday_text : [],
      photos: placeDetails.photos ? placeDetails.photos.map((photo: any) => photo.photo_reference) : [],
      reviews: placeDetails.reviews ? placeDetails.reviews.map((review: any) => ({
        author_name: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time
      })) : []
    };

    console.log('✅ Google Business Profile data fetched successfully');
    return googleData;

  } catch (error) {
    console.error('❌ Error fetching Google Business Profile data:', error);
    return null;
  }
}

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

// ============= FACEBOOK GRAPH API INTEGRATION =============
// Function to fetch Facebook page data
async function fetchFacebookPageData(pageName: string, accessToken: string) {
  if (!pageName) {
    console.warn('⚠️ No Facebook page name provided. Skipping Facebook data fetch.');
    return null;
  }

  const graphApiUrl = `https://graph.facebook.com/v18.0/${pageName}?fields=id,name,fan_count,about,website,emails,location,cover,profile_picture&access_token=${accessToken}`;

  try {
    const response = await fetch(graphApiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Facebook Graph API error:', data.error.message);
      return null;
    }

    console.log('✅ Facebook page data fetched successfully');
    return data;

  } catch (error) {
    console.error('❌ Error fetching Facebook page data:', error);
    return null;
  }
}

// ============= INSTAGRAM API INTEGRATION =============
// Function to fetch Instagram profile data
async function fetchInstagramProfileData(username: string, accessToken: string) {
  if (!username) {
    console.warn('⚠️ No Instagram username provided. Skipping Instagram data fetch.');
    return null;
  }

  const apiUrl = `https://graph.instagram.com/v18.0/me?fields=id,username,profile_picture_url,name,biography,followers_count,follows_count,website&access_token=${accessToken}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Instagram API error:', data.error.message);
      return null;
    }

    console.log('✅ Instagram profile data fetched successfully');
    return data;

  } catch (error) {
    console.error('❌ Error fetching Instagram profile data:', error);
    return null;
  }
}

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

// UTILITY FUNCTIONS
// -----------------------------------------------------------------------------
// Function to generate a random score between a min and max value
function getRandomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate a random item from an array
function getRandomItem(array: any[]): any {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to generate a random boolean value
function getRandomBoolean(): boolean {
  return Math.random() < 0.5;
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
      categoryContext.length > 0 ? `Ihre Unterkategorie \"${categoryContext[0]}\" bietet spezielle Möglichkeiten` : 'Nutzen Sie branchenspezifische Features'
    ],
    quickWins: [
      hasGoogleProfile ? 'Fügen Sie 5-10 hochwertige Fotos zu Ihrem Google Profil hinzu' : 'Erstellen Sie ein Google My Business Profil',
      'Reagieren Sie auf alle Bewertungen der letzten 30 Tage',
      !hasInstagramProfile ? 'Erstellen Sie einen Instagram Business Account' : 'Nutzen Sie Instagram Stories regelmäßig'
    ],
    swotAnalysis: {
      strengths: [
        hasGoogleProfile ? "Vollständiges Google My Business Profil" : "Etablierte lokale Präsenz",
        `Spezialisierung im Bereich ${businessType}`,
        input.hasGoogleData ? "Messbare Online-Performance" : "Grundlegende Webpräsenz"
      ],
      weaknesses: [
        !hasGoogleProfile ? "Fehlende Google My Business Präsenz" : "Begrenzte Foto-Dokumentation",
        !hasFacebookProfile && !hasInstagramProfile ? "Keine Social Media Strategie" : "Inkonsistente Social Media Aktivität",
        "Fehlende Online-Reservierungsmöglichkeiten"
      ],
      opportunities: [
        "Lokales SEO-Potenzial durch Google My Business",
        `${businessType}-spezifische Instagram-Strategien`,
        "Bewertungsmanagement als Differenzierungsfaktor",
        "Integration von Online-Reservierungssystemen"
      ],
      threats: [
        "Konkurrenz mit stärkerer Online-Präsenz",
        "Veränderte Kundenerwartungen (Online-First)",
        "Negative Bewertungen ohne Management",
        "Verpasste lokale Suchtrends"
      ]
    },
    benchmarkInsights: `Ihr ${businessType} liegt ${hasGoogleProfile ? 'über' : 'unter'} dem Branchendurchschnitt. Besonders ${!hasInstagramProfile ? 'visuelle Präsenz' : 'Engagement-Rate'} bietet Verbesserungspotenzial.`,
    leadPotential: hasGoogleProfile && (hasFacebookProfile || hasInstagramProfile) ? 'high' : hasGoogleProfile || hasFacebookProfile || hasInstagramProfile ? 'medium' : 'low',
    provider: 'mock-enhanced-v2.1'
  };
}

// ============= INLINE TODO GENERATOR FOR EDGE FUNCTION =============

function generateTodosInline(analysis: any, industry: string) {
  const todos: any[] = [];

  // Google My Business Checks
  if (!analysis.gmb_metrics?.hasPhotos && !analysis.google?.photos?.length) {
    todos.push({
      type: 'Google: Fotos fehlen',
      priority: 'high',
      text: 'Fügen Sie professionelle Bilder bei Google My Business hinzu.',
      why: 'Erhöht Klickrate und Ranking um bis zu 35%.',
    });
  }

  if (!analysis.gmb_metrics?.hasHours && !analysis.google?.hasHours) {
    todos.push({
      type: 'Google: Öffnungszeiten fehlen',
      priority: 'high',
      text: 'Hinterlegen Sie vollständige Öffnungszeiten.',
      why: 'Wichtig für lokale Suche und Gästeplanung.',
    });
  }

  if (!analysis.gmb_metrics?.profileComplete && !analysis.google?.profileComplete) {
    todos.push({
      type: 'Google: Profil unvollständig',
      priority: 'medium',
      text: 'Vervollständigen Sie Ihr Google My Business Profil.',
      why: 'Vollständige Profile werden 42% öfter kontaktiert.',
    });
  }

  // Check platform analyses for missing features
  const googlePlatform = analysis.platformAnalyses?.find((p: any) => p.platform === 'google');
  const facebookPlatform = analysis.platformAnalyses?.find((p: any) => p.platform === 'facebook');
  const instagramPlatform = analysis.platformAnalyses?.find((p: any) => p.platform === 'instagram');

  if (facebookPlatform && !facebookPlatform.profileFound) {
    todos.push({
      type: 'Meta: Keine Facebook-Seite',
      priority: 'medium',
      text: 'Erstellen Sie eine Facebook Business-Seite.',
      why: 'Erreicht wichtige Zielgruppen und ermöglicht direkten Kundenkontakt.',
    });
  }

  if (instagramPlatform && !instagramPlatform.profileFound) {
    todos.push({
      type: 'Instagram: Kein Business Account',
      priority: 'medium',
      text: 'Erstellen Sie einen Instagram Business Account.',
      why: 'Erschließt eine wichtige Zielgruppe unter 35 Jahren.',
    });
  }

  // Industry-specific checks
  if (industry === 'hospitality') {
    if ((analysis.overallScore || 0) < 70) {
      todos.push({
        type: 'Gastronomie: Online-Reservierung fehlt',
        priority: 'high',
        text: 'Integrieren Sie ein Online-Reservierungssystem.',
        why: '68% der Gäste bevorzugen Online-Buchungen.',
      });
    }

    if (analysis.gmb_metrics?.rating && analysis.gmb_metrics.rating < 4.0) {
      todos.push({
        type: 'Gastronomie: Bewertungen verbessern',
        priority: 'high',
        text: 'Implementieren Sie aktives Bewertungsmanagement.',
        why: 'Bewertungen unter 4.0 reduzieren Buchungen um 70%.',
      });
    }
  }

  return todos;
}

// ============= MAIN EDGE FUNCTION =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    // ============= SAFE INPUT VALIDATION =============
    const safeBusinessName = requestData.businessName || '';
    const safeLocation = requestData.location || '';
    const safeMainCategory = requestData.mainCategory || requestData.mainCategories?.[0] || 'restaurant';
    const safeSubCategory = requestData.subCategory || requestData.subCategories?.[0] || '';
    const safeIndustry = requestData.industry || 'hospitality';
    const safeLanguage = requestData.language || 'de';
    
    console.log('📥 Enhanced visibility check request received:', {
      businessName: safeBusinessName,
      location: safeLocation,
      mainCategory: safeMainCategory,
      subCategory: safeSubCategory,
      industry: safeIndustry
    });

    // Validate required fields
    if (!safeBusinessName || !safeLocation) {
      console.error('❌ Missing required fields:', { businessName: safeBusinessName, location: safeLocation });
      return new Response(JSON.stringify({
        error: 'ValidationError',
        message: 'Firmenname und Standort sind erforderlich',
        userMessage: 'Bitte geben Sie sowohl den Firmennamen als auch den Standort an.'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use safe values for further processing
    const processedData = {
      ...requestData,
      businessName: safeBusinessName,
      location: safeLocation,
      mainCategory: safeMainCategory,
      subCategory: safeSubCategory,
      industry: safeIndustry,
      language: safeLanguage
    };

    // Check for lead ID and update lead status
    const leadId = processedData.leadId;
    if (leadId) {
      console.log('🆔 Updating lead status to processing:', leadId);
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('visibility_check_leads')
          .update({ status: 'processing' })
          .eq('id', leadId);
      } catch (updateError) {
        console.error('⚠️ Failed to update lead status:', updateError);
        // Continue processing even if lead update fails
      }
    }

    // Extract normalized handles with robust input handling
    const instagramHandle = extractSocialHandle(processedData.instagramName || processedData.instagram || '', 'instagram');
    const facebookHandle = extractSocialHandle(processedData.facebookName || processedData.facebook || '', 'facebook');

    // ============= ENHANCED DATA PREPARATION =============
    const businessData = {
      name: safeBusinessName,
      location: safeLocation,
      category: safeMainCategory,
      subCategory: safeSubCategory,
      website: processedData.website || '',
      facebookProfile: normalizeFacebookUrl(processedData.facebookName || processedData.facebook || ''),
      instagramProfile: normalizeInstagramUrl(processedData.instagramName || processedData.instagram || ''),
      competitors: processedData.benchmarks || [],
      
      // Phase 2: Enhanced fields
      categoryId: processedData.categoryId || null,
      categoryName: processedData.categoryName || safeMainCategory,
      competitorUrls: processedData.competitorUrls || [],
      language: safeLanguage,
      locationData: processedData.locationData || null,
      socialLinks: processedData.socialLinks || {},
      
      // For prompts and AI analysis
      businessType: safeMainCategory.toLowerCase(),
      industry: safeIndustry,
      
      // Handles for social validation
      facebookHandle,
      instagramHandle,
      
      // Status flags
      hasGoogleData: processedData.hasGoogleData || false,
      gdprConsent: processedData.gdprConsent || false,
      marketingConsent: processedData.marketingConsent || false
    };

    console.log('🔄 Processed business data:', {
      name: businessData.name,
      location: businessData.location,
      category: businessData.category,
      industry: businessData.industry
    });

    // ============= MOCK ANALYSIS WITH TODOS INTEGRATION =============
    console.log('🧠 Generating comprehensive mock analysis...');
    
    const categoryContext = [safeSubCategory, processedData.matbakhCategory].filter(Boolean);
    const mockAnalysis = generateMockAnalysis({
      ...processedData,
      businessName: safeBusinessName,
      location: safeLocation,
      mainCategory: safeMainCategory,
      subCategory: safeSubCategory
    }, categoryContext, []);
    
    // Generate todos using inline function (same logic as external todoGenerator)
    const todos = generateTodosInline(mockAnalysis, safeIndustry);
    const is_fully_satisfied = todos.length === 0 || (mockAnalysis.overallScore || 0) >= 80;
    
    // Add todos to analysis result
    const enrichedAnalysis = {
      ...mockAnalysis,
      todos,
      is_fully_satisfied,
      leadId: leadId || null,
      generatedAt: new Date().toISOString()
    };

    console.log('✅ Analysis complete:', {
      overallScore: enrichedAnalysis.overallScore,
      todoCount: todos.length,
      isFullySatisfied: is_fully_satisfied
    });

    // ============= UPDATE DATABASE WITH RESULTS =============
    if (leadId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase
          .from('visibility_check_results')
          .upsert({
            lead_id: leadId,
            analysis_result: enrichedAnalysis,
            is_fully_satisfied,
            status: 'completed',
            updated_at: new Date().toISOString()
          });

        await supabase
          .from('visibility_check_leads')
          .update({ status: 'completed' })
          .eq('id', leadId);

        console.log('✅ Database updated successfully');
      } catch (dbError) {
        console.error('❌ Failed to update database:', dbError);
        // Continue without failing the entire request
      }
    }

    return new Response(
      JSON.stringify(enrichedAnalysis),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Enhanced visibility check error:', error);
    
    // Update lead status to failed if leadId exists
    try {
      const leadId = requestData?.leadId;
      if (leadId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('visibility_check_leads')
          .update({ 
            status: 'failed',
            error_message: error.message 
          })
          .eq('id', leadId);
      }
    } catch (updateError) {
      console.error('❌ Failed to update lead status to failed:', updateError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'InternalServerError',
        message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
        details: error.message,
        userMessage: 'Die Analyse konnte nicht durchgeführt werden. Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
