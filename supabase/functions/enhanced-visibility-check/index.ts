
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface PlatformAnalysis {
  platform: 'google' | 'facebook' | 'instagram'
  score: number
  maxScore: number
  completedFeatures: string[]
  missingFeatures: string[]
  profileUrl?: string
  recommendations: string[]
}

interface BenchmarkComparison {
  name: string
  scores: {
    google: number
    facebook: number
    instagram: number
    overall: number
  }
  profileUrls: {
    google?: string
    facebook?: string
    instagram?: string
  }
}

interface AnalysisResult {
  overallScore: number
  platformAnalyses: PlatformAnalysis[]
  benchmarks: BenchmarkComparison[]
  categoryInsights: string[]
  quickWins: string[]
  leadPotential: 'high' | 'medium' | 'low'
  reportData: any
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Get category-specific weights
function getCategoryWeights(mainCategory: string, matbakhTags: string[]): { google: number, facebook: number, instagram: number } {
  // Default weights for restaurants
  let weights = { google: 0.4, facebook: 0.3, instagram: 0.3 }
  
  // Restaurant/Food categories - Google is most important
  if (mainCategory.includes('restaurant') || mainCategory.includes('food')) {
    weights = { google: 0.5, facebook: 0.25, instagram: 0.25 }
  }
  
  // Social-heavy businesses (bars, cafes) - Instagram more important
  const socialTags = ['live_music', 'rooftop', 'craft_beer', 'wine_bar', 'cocktail_bar']
  if (matbakhTags.some(tag => socialTags.includes(tag))) {
    weights = { google: 0.35, facebook: 0.25, instagram: 0.4 }
  }
  
  // Delivery/Takeout focused - Google dominates
  if (matbakhTags.includes('delivery') || matbakhTags.includes('takeout')) {
    weights = { google: 0.6, facebook: 0.2, instagram: 0.2 }
  }
  
  return weights
}

// Analyze Google My Business
async function analyzeGooglePresence(businessName: string, location: string): Promise<PlatformAnalysis> {
  const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
  
  if (!GOOGLE_PLACES_API_KEY) {
    console.log('⚠️ Google Places API key not found - using demo data')
    return {
      platform: 'google',
      score: 65 + Math.random() * 25, // 65-90 range for demo
      maxScore: 100,
      completedFeatures: [
        'Google My Business listing exists',
        'Basic information filled',
        'Photos uploaded',
        'Opening hours listed'
      ],
      missingFeatures: [
        'Incomplete business description',
        'No recent posts',
        'Missing Q&A section'
      ],
      recommendations: [
        'Add business description',
        'Upload more food photos',
        'Create Google posts regularly',
        'Encourage customer reviews'
      ]
    }
  }

  try {
    console.log(`🔍 Analyzing Google presence for: ${businessName} in ${location}`)
    
    // Search for the business
    const searchQuery = encodeURIComponent(`${businessName} ${location}`)
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${searchQuery}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${GOOGLE_PLACES_API_KEY}`

    const placeResponse = await fetch(findPlaceUrl)
    const placeData = await placeResponse.json()
    
    if (!placeData.candidates || placeData.candidates.length === 0) {
      return {
        platform: 'google',
        score: 0,
        maxScore: 100,
        completedFeatures: [],
        missingFeatures: ['Business not found on Google', 'Google My Business profile needed'],
        recommendations: ['Create Google My Business profile', 'Claim your business listing']
      }
    }

    const candidate = placeData.candidates[0]
    const placeId = candidate.place_id
    
    // Get detailed information
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,opening_hours,photos,rating,user_ratings_total,reviews,international_phone_number,url,types,business_status&key=${GOOGLE_PLACES_API_KEY}`

    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()
    const details = detailsData.result

    console.log(`✅ Found Google listing: ${details.name}`)

    // Calculate score based on completeness and quality
    let score = 0
    const completedFeatures = []
    const missingFeatures = []
    const recommendations = []

    // Basic presence (20 points)
    score += 20
    completedFeatures.push('Google My Business listing exists')

    // Website (15 points)
    if (details.website) {
      score += 15
      completedFeatures.push('Website listed')
    } else {
      missingFeatures.push('Website URL missing')
      recommendations.push('Add your website URL to Google My Business')
    }

    // Opening hours (15 points)
    if (details.opening_hours) {
      score += 15
      completedFeatures.push('Opening hours listed')
    } else {
      missingFeatures.push('Opening hours not set')
      recommendations.push('Add complete opening hours')
    }

    // Photos (20 points)
    if (details.photos && details.photos.length > 0) {
      const photoScore = Math.min(details.photos.length * 2, 20)
      score += photoScore
      completedFeatures.push(`${details.photos.length} photos uploaded`)
      
      if (details.photos.length < 10) {
        recommendations.push('Upload more photos (food, interior, exterior)')
      }
    } else {
      missingFeatures.push('No photos uploaded')
      recommendations.push('Upload high-quality photos of your business')
    }

    // Reviews & Rating (25 points)
    if (details.rating && details.user_ratings_total) {
      const ratingScore = (details.rating / 5) * 15
      const reviewScore = Math.min(details.user_ratings_total / 10, 10)
      score += ratingScore + reviewScore
      
      completedFeatures.push(`${details.rating}★ rating with ${details.user_ratings_total} reviews`)
      
      if (details.rating < 4.0) {
        recommendations.push('Improve service quality to increase rating')
      }
      if (details.user_ratings_total < 20) {
        recommendations.push('Encourage customers to leave reviews')
      }
    } else {
      missingFeatures.push('No reviews or rating')
      recommendations.push('Encourage first customers to leave reviews')
    }

    // Phone number (5 points)
    if (details.international_phone_number) {
      score += 5
      completedFeatures.push('Phone number listed')
    } else {
      missingFeatures.push('Phone number missing')
      recommendations.push('Add your phone number')
    }

    return {
      platform: 'google',
      score: Math.round(score),
      maxScore: 100,
      completedFeatures,
      missingFeatures,
      profileUrl: details.url,
      recommendations
    }

  } catch (error) {
    console.error('❌ Google analysis error:', error)
    return {
      platform: 'google',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['Google analysis failed'],
      recommendations: ['Check business name and location']
    }
  }
}

// Analyze Facebook presence
async function analyzeFacebookPresence(facebookName: string): Promise<PlatformAnalysis> {
  if (!facebookName) {
    return {
      platform: 'facebook',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['No Facebook page specified'],
      recommendations: ['Create a Facebook business page']
    }
  }

  try {
    console.log(`📘 Analyzing Facebook: ${facebookName}`)
    
    // Demo scoring (später: Facebook Graph API)
    const mockScore = 45 + Math.random() * 40 // 45-85 range
    
    return {
      platform: 'facebook',
      score: Math.round(mockScore),
      maxScore: 100,
      completedFeatures: [
        'Facebook page exists',
        'Basic information filled',
        'Recent posts available'
      ],
      missingFeatures: [
        'Opening hours not set',
        'No call-to-action button',
        'Limited photo gallery'
      ],
      profileUrl: `https://facebook.com/${facebookName}`,
      recommendations: [
        'Complete all business information',
        'Add call-to-action button',
        'Upload more photos',
        'Post regularly (2-3 times per week)'
      ]
    }
  } catch (error) {
    console.error('❌ Facebook analysis error:', error)
    return {
      platform: 'facebook',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['Facebook analysis failed'],
      recommendations: ['Check Facebook page name']
    }
  }
}

// Analyze Instagram presence
async function analyzeInstagramPresence(instagramName: string): Promise<PlatformAnalysis> {
  if (!instagramName) {
    return {
      platform: 'instagram',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['No Instagram account specified'],
      recommendations: ['Create an Instagram business account']
    }
  }

  try {
    console.log(`📷 Analyzing Instagram: ${instagramName}`)
    
    // Demo scoring (später: Instagram Basic Display API)
    const mockScore = 35 + Math.random() * 50 // 35-85 range
    
    return {
      platform: 'instagram',
      score: Math.round(mockScore),
      maxScore: 100,
      completedFeatures: [
        'Instagram account exists',
        'Bio information filled',
        'Recent posts available'
      ],
      missingFeatures: [
        'Not a business account',
        'No contact button',
        'Limited story highlights'
      ],
      profileUrl: `https://instagram.com/${instagramName.replace('@', '')}`,
      recommendations: [
        'Switch to business account',
        'Add contact information',
        'Create story highlights',
        'Post consistently (daily)',
        'Use relevant hashtags'
      ]
    }
  } catch (error) {
    console.error('❌ Instagram analysis error:', error)
    return {
      platform: 'instagram',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['Instagram analysis failed'],
      recommendations: ['Check Instagram username']
    }
  }
}

// Generate benchmarks
async function generateBenchmarks(businessName: string, location: string, mainCategory: string, userBenchmarks: string[]): Promise<BenchmarkComparison[]> {
  const benchmarks: BenchmarkComparison[] = []
  
  // If user provided benchmarks, use those
  if (userBenchmarks.filter(b => b.trim()).length > 0) {
    for (const benchmark of userBenchmarks.filter(b => b.trim())) {
      benchmarks.push({
        name: benchmark,
        scores: {
          google: 65 + Math.random() * 30, // 65-95 range
          facebook: 45 + Math.random() * 40, // 45-85 range  
          instagram: 40 + Math.random() * 45, // 40-85 range
          overall: 0 // Will calculate below
        },
        profileUrls: {
          google: `https://maps.google.com/?q=${encodeURIComponent(benchmark + ' ' + location)}`,
          facebook: `https://facebook.com/search/top/?q=${encodeURIComponent(benchmark)}`,
          instagram: `https://instagram.com/explore/tags/${encodeURIComponent(benchmark.replace(/\s+/g, ''))}/`
        }
      })
    }
  } else {
    // Generate AI-suggested benchmarks based on category and location
    const suggestedBenchmarks = [
      `Top ${mainCategory} in ${location.split(',')[0]}`,
      `Popular ${mainCategory} nearby`,
      `Similar ${mainCategory} concept`
    ]
    
    for (const benchmark of suggestedBenchmarks) {
      benchmarks.push({
        name: benchmark,
        scores: {
          google: 60 + Math.random() * 35,
          facebook: 40 + Math.random() * 45,
          instagram: 35 + Math.random() * 50,
          overall: 0
        },
        profileUrls: {}
      })
    }
  }
  
  // Calculate overall scores
  benchmarks.forEach(benchmark => {
    benchmark.scores.overall = Math.round(
      (benchmark.scores.google + benchmark.scores.facebook + benchmark.scores.instagram) / 3
    )
  })
  
  return benchmarks
}

// Generate category-specific insights
function generateCategoryInsights(mainCategory: string, matbakhTags: string[], platformAnalyses: PlatformAnalysis[]): string[] {
  const insights = []
  
  // Restaurant-specific insights
  if (mainCategory.includes('restaurant') || mainCategory.includes('food')) {
    insights.push('Restaurants benefit most from Google My Business optimization - 70% of diners check GMB before visiting')
    
    if (matbakhTags.includes('delivery')) {
      insights.push('Delivery services should prioritize Google presence for local search visibility')
    }
    
    if (matbakhTags.includes('outdoor_seating')) {
      insights.push('Outdoor seating is a key differentiator - showcase it prominently in photos')
    }
  }
  
  // Social media focused insights
  const socialTags = ['live_music', 'rooftop', 'craft_beer', 'wine_bar']
  if (matbakhTags.some(tag => socialTags.includes(tag))) {
    insights.push('Experience-focused businesses like yours should invest heavily in Instagram content')
  }
  
  // Analysis-based insights
  const googleAnalysis = platformAnalyses.find(p => p.platform === 'google')
  if (googleAnalysis && googleAnalysis.score < 60) {
    insights.push('Your Google presence needs immediate attention - this is where most customers discover local businesses')
  }
  
  return insights
}

// Save analysis to database
async function saveAnalysis(request: VisibilityCheckRequest, result: AnalysisResult) {
  try {
    const { data, error } = await supabase
      .from('visibility_check_leads')
      .insert({
        business_name: request.businessName,
        location: request.location,
        email: request.email || null,
        website: request.website || null,
        facebook_name: request.facebookName || null,
        instagram_name: request.instagramName || null,
        main_category: request.mainCategory,
        sub_category: request.subCategory,
        matbakh_tags: request.matbakhTags,
        benchmarks: request.benchmarks.filter(b => b.trim()),
        check_type: request.email ? 'with_email' : 'anon',
        result_status: 'success',
        analysis_result: result,
        overall_score: result.overallScore,
        lead_potential: result.leadPotential
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Database save error:', error)
    } else {
      console.log('✅ Analysis saved to database')
    }

    return data
  } catch (error) {
    console.error('❌ Database save failed:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting Enhanced Visibility Check')
    
    const request: VisibilityCheckRequest = await req.json()
    console.log('📝 Request received:', {
      business: request.businessName,
      location: request.location,
      category: request.mainCategory,
      tags: request.matbakhTags.length
    })

    // Get category-specific weights
    const weights = getCategoryWeights(request.mainCategory, request.matbakhTags)
    console.log('⚖️ Category weights:', weights)

    // Analyze all platforms in parallel
    const [googleAnalysis, facebookAnalysis, instagramAnalysis, benchmarks] = await Promise.all([
      analyzeGooglePresence(request.businessName, request.location),
      analyzeFacebookPresence(request.facebookName || ''),
      analyzeInstagramPresence(request.instagramName || ''),
      generateBenchmarks(request.businessName, request.location, request.mainCategory, request.benchmarks)
    ])

    const platformAnalyses = [googleAnalysis, facebookAnalysis, instagramAnalysis]
    
    // Calculate weighted overall score
    const overallScore = Math.round(
      googleAnalysis.score * weights.google +
      facebookAnalysis.score * weights.facebook +
      instagramAnalysis.score * weights.instagram
    )

    // Generate insights and recommendations
    const categoryInsights = generateCategoryInsights(request.mainCategory, request.matbakhTags, platformAnalyses)
    const quickWins = []
    
    // Collect quick wins from all platforms
    platformAnalyses.forEach(analysis => {
      analysis.recommendations.slice(0, 2).forEach(rec => {
        if (!quickWins.includes(rec)) {
          quickWins.push(rec)
        }
      })
    })

    // Determine lead potential
    let leadPotential: 'high' | 'medium' | 'low' = 'medium'
    if (overallScore < 40) leadPotential = 'high'
    else if (overallScore > 75) leadPotential = 'low'

    const result: AnalysisResult = {
      overallScore,
      platformAnalyses,
      benchmarks,
      categoryInsights,
      quickWins: quickWins.slice(0, 5),
      leadPotential,
      reportData: {
        businessName: request.businessName,
        location: request.location,
        category: request.mainCategory,
        tags: request.matbakhTags,
        analyzedAt: new Date().toISOString(),
        weights
      }
    }

    // Save to database
    await saveAnalysis(request, result)

    console.log(`✅ Analysis complete: ${overallScore}% overall score, ${leadPotential} potential`)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Enhanced Visibility Check Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
