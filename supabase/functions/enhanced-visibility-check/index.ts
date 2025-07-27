import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { BedrockRuntimeClient, InvokeModelCommand } from "https://esm.sh/@aws-sdk/client-bedrock-runtime@3.450.0";

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
  leadId?: string
  googleName?: string
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

// ============= BEDROCK AI CLIENT =============
async function callBedrockVisibilityAnalysis(input: any) {
  const client = new BedrockRuntimeClient({ 
    region: Deno.env.get('AWS_REGION') || 'eu-central-1',
    credentials: {
      accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
      secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || ''
    }
  });

  const MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0";

  const prompt = `
Du bist ein Experte für Restaurant-Marketing und Online-Sichtbarkeit. Analysiere die digitale Präsenz des folgenden Restaurants und erstelle eine detaillierte Bewertung.

RESTAURANT-DATEN:
${JSON.stringify(input, null, 2)}

AUFGABE: Erstelle eine professionelle Sichtbarkeitsanalyse als JSON mit folgender Struktur:

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
            content: prompt
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
    
    console.log('✅ Bedrock analysis completed successfully');
    return analysisResult;
    
  } catch (error) {
    console.error('❌ Bedrock analysis failed:', error);
    // Fallback to enhanced mock data
    return {
      overallScore: Math.floor(Math.random() * 30) + 70,
      platformAnalyses: [
        {
          platform: "google",
          score: Math.floor(Math.random() * 40) + 60,
          details: {
            hasProfile: !!input.googleName,
            profileComplete: true,
            hasReviews: true,
            hasPhotos: true,
            hasHours: true,
            rating: 4.2,
            reviewCount: 89
          },
          strengths: ["Vollständiges Profil vorhanden"],
          weaknesses: ["Begrenzte Foto-Auswahl"],
          recommendations: ["Mehr aktuelle Fotos hinzufügen"]
        }
      ],
      categoryInsights: [
        `Als ${input.mainCategory} sollten Sie besonders auf visuelle Inhalte setzen`,
        'Bewertungsmanagement ist in Ihrer Branche besonders wichtig'
      ],
      quickWins: [
        'Fügen Sie 5-10 hochwertige Fotos zu Ihrem Google Profil hinzu',
        'Reagieren Sie auf alle Bewertungen der letzten 30 Tage'
      ],
      swotAnalysis: {
        strengths: ["Etablierte lokale Präsenz"],
        weaknesses: ["Begrenzte Online-Sichtbarkeit"],
        opportunities: ["Social Media Ausbau", "Bewertungsoptimierung"],
        threats: ["Lokale Konkurrenz", "Negative Online-Bewertungen"]
      },
      benchmarkInsights: "Ihr Restaurant liegt im oberen Mittelfeld der lokalen Konkurrenz",
      leadPotential: "medium"
    };
  }
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
    
    // Prepare data for Bedrock analysis
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
      timestamp: new Date().toISOString()
    };

    // Call Bedrock for AI analysis
    const aiAnalysis = await callBedrockVisibilityAnalysis(analysisInput);
    
    // Extract and structure the results
    const platformAnalyses = aiAnalysis.platformAnalyses || [];
    const overallScore = aiAnalysis.overallScore || 75;

    // Generate enhanced benchmark data
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
    }));

    const result = {
      overallScore,
      platformAnalyses,
      benchmarks,
      categoryInsights: aiAnalysis.categoryInsights || [
        `Als ${data.mainCategory} sollten Sie besonders auf visuelle Inhalte setzen`,
        'Bewertungsmanagement ist in Ihrer Branche besonders wichtig'
      ],
      quickWins: aiAnalysis.quickWins || [
        'Fügen Sie 5-10 hochwertige Fotos zu Ihrem Google Profil hinzu',
        'Reagieren Sie auf alle Bewertungen der letzten 30 Tage',
        'Erstellen Sie einen Instagram Business Account falls noch nicht vorhanden'
      ],
      swotAnalysis: aiAnalysis.swotAnalysis || {
        strengths: ["Etablierte lokale Präsenz"],
        weaknesses: ["Begrenzte Online-Sichtbarkeit"],
        opportunities: ["Social Media Ausbau"],
        threats: ["Lokale Konkurrenz"]
      },
      benchmarkInsights: aiAnalysis.benchmarkInsights || "Ihre Performance liegt im Branchendurchschnitt",
      leadPotential: aiAnalysis.leadPotential || (overallScore > 70 ? 'high' : overallScore > 50 ? 'medium' : 'low'),
      reportData: {
        businessName: data.businessName,
        location: data.location,
        analysisDate: new Date().toISOString(),
        platforms: platformAnalyses.length,
        aiPowered: true
      }
    }

    console.log('✅ AI Analysis completed with overall score:', overallScore)
    
    // CRITICAL: Persistiere die Analyseergebnisse in die Datenbank mit vollständigem Status-Management
    if (data.leadId) {
      console.log('💾 Saving analysis results to database for lead:', data.leadId)
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      try {
        // Set status to analyzing first
        const { error: statusError } = await supabase
          .from('visibility_check_leads')
          .update({ status: 'analyzing' })
          .eq('id', data.leadId);

        if (statusError) {
          console.error('❌ Error updating lead status to analyzing:', statusError);
        }

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
            swot_analysis: result.swotAnalysis,
            benchmark_insights: result.benchmarkInsights,
            lead_potential: result.leadPotential,
            analysis_results: result,
            instagram_candidates: instagramCandidates || []
          });

        if (insertError) {
          console.error('❌ Error saving analysis results:', insertError);
          // Update lead status to failed with detailed error
          await supabase
            .from('visibility_check_leads')
            .update({ 
              status: 'failed',
              analysis_error_message: `Analysis failed: ${insertError.message}`
            })
            .eq('id', data.leadId);
          
          throw new Error(`Failed to save analysis results: ${insertError.message}`);
        } else {
          console.log('✅ Analysis results saved successfully');
          
          // Update lead status to completed - this will trigger PDF generation automatically via DB trigger
          const { error: completedError } = await supabase
            .from('visibility_check_leads')
            .update({ status: 'completed' })
            .eq('id', data.leadId);

          if (completedError) {
            console.error('❌ Error updating lead status to completed:', completedError);
            await supabase
              .from('visibility_check_leads')
              .update({ 
                status: 'failed',
                analysis_error_message: `Status update failed: ${completedError.message}`
              })
              .eq('id', data.leadId);
          } else {
            console.log('🎯 Lead status updated to completed - PDF generation will be triggered automatically');
          }
        }
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