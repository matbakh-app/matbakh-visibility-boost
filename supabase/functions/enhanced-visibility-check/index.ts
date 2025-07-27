
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface VisibilityCheckRequest {
  businessName: string
  location: string
  mainCategory: string
  subCategory: string
  matbakhTags: string[]
  website?: string
  facebookName?: string
  instagramName?: string
  benchmarks: string[]
  email?: string
}

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const data: VisibilityCheckRequest = await req.json()
    
    console.log('🚀 Enhanced visibility check started for:', data.businessName)
    
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

    // Analyze platforms
    const platformAnalyses: PlatformAnalysis[] = []
    
    // Google Analysis
    const googleAnalysis: PlatformAnalysis = {
      platform: 'google',
      score: 65,
      maxScore: 100,
      completedFeatures: ['Grundinformationen', 'Öffnungszeiten', 'Kontaktdaten'],
      missingFeatures: ['Fotos', 'Bewertungen verwalten', 'Posts'],
      profileFound: true,
      recommendations: [
        'Fügen Sie mehr Fotos hinzu',
        'Reagieren Sie auf Bewertungen',
        'Nutzen Sie Google Posts für Angebote'
      ],
      reservationAvailable: false,
      hasHolidayHours: false,
      askSectionVisible: true,
      isListingComplete: false,
      category: data.mainCategory
    }
    platformAnalyses.push(googleAnalysis)
    
    // Facebook Analysis (only if Facebook provided)
    if (data.facebookName) {
      const normalizedFbUrl = normalizeFacebookUrl(data.facebookName)
      const facebookAnalysis: PlatformAnalysis = {
        platform: 'facebook',
        score: 45,
        maxScore: 100,
        completedFeatures: ['Seiteninfo', 'Kontaktdaten'],
        missingFeatures: ['Regelmäßige Posts', 'Bewertungen', 'Events'],
        profileUrl: normalizedFbUrl,
        profileFound: true,
        recommendations: [
          'Posten Sie regelmäßig Updates',
          'Fügen Sie Events hinzu',
          'Interagieren Sie mit Kommentaren'
        ]
      }
      platformAnalyses.push(facebookAnalysis)
    }
    
    // Instagram Analysis (only if Instagram provided or candidates found)
    if (data.instagramName || instagramCandidates.length > 0) {
      const instagramUrl = data.instagramName ? 
        normalizeInstagramUrl(data.instagramName) : 
        undefined
      
      const instagramAnalysis: PlatformAnalysis = {
        platform: 'instagram',
        score: data.instagramName ? 55 : 0,
        maxScore: 100,
        completedFeatures: data.instagramName ? ['Profil eingerichtet', 'Bio'] : [],
        missingFeatures: ['Stories', 'Reels', 'Regelmäßige Posts'],
        profileUrl: instagramUrl,
        profileFound: !!data.instagramName,
        autoDetected: !data.instagramName && instagramCandidates.length > 0,
        recommendations: [
          'Nutzen Sie Stories für tägliche Updates',
          'Erstellen Sie Reels von Ihren Gerichten',
          'Verwenden Sie relevante Hashtags'
        ],
        candidates: instagramCandidates.length > 0 ? instagramCandidates : undefined
      }
      platformAnalyses.push(instagramAnalysis)
    }

    // Calculate overall score
    const overallScore = Math.round(
      platformAnalyses.reduce((sum, analysis) => sum + analysis.score, 0) / platformAnalyses.length
    )

    // Mock benchmark data
    const benchmarks = data.benchmarks.filter(Boolean).map(name => ({
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
    }))

    const result = {
      overallScore,
      platformAnalyses,
      benchmarks,
      categoryInsights: [
        `Als ${data.mainCategory} sollten Sie besonders auf visuelle Inhalte setzen`,
        'Bewertungsmanagement ist in Ihrer Branche besonders wichtig'
      ],
      quickWins: [
        'Fügen Sie 5-10 hochwertige Fotos zu Ihrem Google Profil hinzu',
        'Reagieren Sie auf alle Bewertungen der letzten 30 Tage',
        'Erstellen Sie einen Instagram Business Account falls noch nicht vorhanden'
      ],
      leadPotential: overallScore > 70 ? 'high' : overallScore > 50 ? 'medium' : 'low',
      reportData: {
        businessName: data.businessName,
        location: data.location,
        analysisDate: new Date().toISOString(),
        platforms: platformAnalyses.length
      }
    }

    console.log('✅ Analysis completed with overall score:', overallScore)
    
    // CRITICAL: Persistiere die Analyseergebnisse in die Datenbank
    if (data.leadId) {
      console.log('💾 Saving analysis results to database for lead:', data.leadId)
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Speichere Analyseergebnisse
      const { error: insertError } = await supabase
        .from('visibility_check_results')
        .insert({
          lead_id: data.leadId,
          overall_score: overallScore,
          platform_analyses: platformAnalyses,
          benchmarks: benchmarks,
          category_insights: result.categoryInsights,
          quick_wins: result.quickWins,
          lead_potential: result.leadPotential,
          analysis_results: result,
          instagram_candidates: instagramCandidates || []
        });

      if (insertError) {
        console.error('❌ Error saving analysis results:', insertError);
        // Update lead status to failed
        await supabase
          .from('visibility_check_leads')
          .update({ 
            status: 'failed',
            analysis_error_message: `Failed to save results: ${insertError.message}`
          })
          .eq('id', data.leadId);
      } else {
        console.log('✅ Analysis results saved successfully');
        // Update lead status to completed
        await supabase
          .from('visibility_check_leads')
          .update({ status: 'completed' })
          .eq('id', data.leadId);
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
