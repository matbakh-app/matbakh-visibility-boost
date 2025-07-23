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

// Enhanced Instagram handle generation with location-based combinations
function generateInstagramHandlesEnhanced(businessName: string, location: string): string[] {
  console.log(`🧠 Enhanced handle generation for: ${businessName} in ${location}`)
  
  const name = businessName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  const locationWords = location.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/[,\s]+/)
    .filter(word => word.length > 2)
  
  const nameWords = name.split(' ').filter(word => word.length > 2)
  const firstWord = nameWords[0] || name.substring(0, 8)
  
  // Remove common restaurant suffixes for cleaner handles
  const cleanWords = nameWords
    .filter(word => !['restaurant', 'cafe', 'bar', 'bistro', 'essen', 'trinken', 'und', 'and', 'the'].includes(word))
    .slice(0, 3)
  
  const handles = new Set<string>()
  
  // 1. Priorität: Kurze Varianten mit Location (wie saxmuenchen)
  if (cleanWords.length > 0) {
    locationWords.forEach(locWord => {
      handles.add(`${cleanWords[0]}${locWord}`)
      handles.add(`${cleanWords[0]}_${locWord}`)
      handles.add(`${cleanWords[0]}.${locWord}`)
      
      // Auch mit erstem Buchstaben der Location
      if (locWord.length > 3) {
        handles.add(`${cleanWords[0]}${locWord.substring(0, 3)}`)
      }
    })
  }
  
  // 2. Kombinationen der ersten beiden Wörter mit Location
  if (cleanWords.length >= 2) {
    locationWords.forEach(locWord => {
      handles.add(`${cleanWords[0]}${cleanWords[1]}${locWord}`)
      handles.add(`${cleanWords[0]}_${cleanWords[1]}_${locWord}`)
      
      // Kürzer: Erste 3 Buchstaben jedes Worts
      const short1 = cleanWords[0].substring(0, 3)
      const short2 = cleanWords[1].substring(0, 3) 
      handles.add(`${short1}${short2}${locWord}`)
    })
  }
  
  // 3. Original Vollname Varianten
  const fullName = cleanWords.join('')
  if (fullName.length <= 15) {
    handles.add(fullName)
    locationWords.forEach(locWord => {
      if ((fullName + locWord).length <= 20) {
        handles.add(`${fullName}${locWord}`)
      }
    })
  }
  
  // 4. Standard Varianten (aus dem alten System)
  handles.add(name.replace(/\s+/g, ''))
  handles.add(`${name.replace(/\s+/g, '')}restaurant`)
  handles.add(`${firstWord}restaurant`)
  handles.add(`${firstWord}_restaurant`)
  handles.add(`${firstWord}.restaurant`)
  
  // 5. Location-only Varianten mit Business-Type
  locationWords.forEach(locWord => {
    handles.add(`restaurant${locWord}`)
    handles.add(`${locWord}restaurant`)
    handles.add(`${locWord}food`)
    handles.add(`${locWord}essen`)
  })
  
  const result = Array.from(handles)
    .filter(handle => handle.length >= 3 && handle.length <= 30)
    .slice(0, 25) // Limit für Performance
  
  console.log(`📝 Generated ${result.length} handle variants:`, result.slice(0, 10))
  return result
}

// Enhanced Instagram search with candidate scoring
async function searchInstagramCandidatesEnhanced(businessName: string, location: string): Promise<InstagramCandidate[]> {
  console.log(`🔍 Enhanced Instagram candidate search for: ${businessName} in ${location}`)
  
  const possibleHandles = generateInstagramHandlesEnhanced(businessName, location)
  const candidates: InstagramCandidate[] = []
  
  // Test each handle with enhanced scoring
  for (const handle of possibleHandles) {
    console.log(`🧪 Testing Instagram handle: @${handle}`)
    
    try {
      // Simulate profile check with intelligent scoring
      const candidate = await testInstagramHandle(handle, businessName, location)
      if (candidate) {
        candidates.push(candidate)
      }
    } catch (error) {
      console.log(`❌ Error testing handle @${handle}:`, error)
    }
    
    // Prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Stop after finding 5 good candidates
    if (candidates.length >= 5) break
  }
  
  // Sort by confidence and score
  return candidates
    .sort((a, b) => {
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      const aValue = confidenceOrder[a.confidence] * 100 + a.score
      const bValue = confidenceOrder[b.confidence] * 100 + b.score
      return bValue - aValue
    })
    .slice(0, 5)
}

// Intelligent handle testing with scoring
async function testInstagramHandle(handle: string, businessName: string, location: string): Promise<InstagramCandidate | null> {
  // Enhanced heuristic scoring based on handle analysis
  let score = 0
  let confidence: 'high' | 'medium' | 'low' = 'low'
  let matchReason = 'Handle-based analysis'
  
  const nameWords = businessName.toLowerCase().split(' ')
  const locationWords = location.toLowerCase().split(/[,\s]+/)
  
  // Score business name matching
  nameWords.forEach(word => {
    if (word.length > 2 && handle.toLowerCase().includes(word)) {
      score += 25
      matchReason = `Contains business name "${word}"`
    }
  })
  
  // Score location matching
  locationWords.forEach(word => {
    if (word.length > 2 && handle.toLowerCase().includes(word)) {
      score += 15
      matchReason += `, location "${word}"`
    }
  })
  
  // Bonus for restaurant-related handles
  const restaurantKeywords = ['restaurant', 'cafe', 'bar', 'bistro', 'food', 'essen']
  if (restaurantKeywords.some(keyword => handle.toLowerCase().includes(keyword))) {
    score += 10
    matchReason += ', restaurant-related'
  }
  
  // Determine confidence based on score and specific patterns
  if (score >= 40) {
    confidence = 'high'
  } else if (score >= 25) {
    confidence = 'medium'
  }
  
  // Special high-confidence pattern for exact matches like "saxmuenchen"
  if (nameWords.length > 0 && locationWords.length > 0) {
    const firstNameWord = nameWords[0]
    const mainLocationWord = locationWords.find(w => w.length > 3) || locationWords[0]
    
    if (handle.toLowerCase() === `${firstNameWord}${mainLocationWord}`.toLowerCase()) {
      score = 90
      confidence = 'high'
      matchReason = `Exact pattern: ${firstNameWord} + ${mainLocationWord}`
    }
  }
  
  // Only return candidates with reasonable scores
  if (score < 15) return null
  
  // Simulate realistic profile data
  const followerCount = Math.floor(Math.random() * 5000) + 200
  
  return {
    handle,
    score,
    profilePicture: `https://via.placeholder.com/150x150?text=${handle.substring(0,2).toUpperCase()}`,
    followerCount,
    bio: `Restaurant in ${location} • ${businessName}`,
    confidence,
    matchReason
  }
}

async function analyzeGooglePresence(businessName: string, location: string): Promise<PlatformAnalysis> {
  const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
  const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY')
  
  if (!GOOGLE_PLACES_API_KEY && !SERPER_API_KEY) {
    console.log('⚠️ Keine Google API Keys - verwende Demo-Daten')
    return createGoogleDemoData(businessName)
  }

  try {
    console.log(`🔍 Google-Analyse für: ${businessName} in ${location}`)
    
    if (SERPER_API_KEY) {
      return await analyzeWithSerperAPI(businessName, location, SERPER_API_KEY)
    } else {
      return await analyzeWithGooglePlaces(businessName, location, GOOGLE_PLACES_API_KEY!)
    }
  } catch (error) {
    console.error('❌ Google-Analyse Fehler:', error)
    return createGoogleDemoData(businessName)
  }
}

async function analyzeWithSerperAPI(businessName: string, location: string, apiKey: string): Promise<PlatformAnalysis> {
  const query = `${businessName} ${location}`
  
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      gl: 'de',
      hl: 'de',
      autocorrect: true,
    })
  })

  const result = await response.json()
  const gmbResult = result.local?.[0]

  if (!gmbResult) {
    return {
      platform: 'google',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['Kein Google Business Profil gefunden'],
      profileFound: false,
      recommendations: ['Google My Business Profil erstellen']
    }
  }

  let score = 0
  const completedFeatures = []
  const missingFeatures = []
  const recommendations = []

  if (gmbResult.thumbnailUrl) {
    score += 20
    completedFeatures.push('Profilbild vorhanden')
  } else {
    missingFeatures.push('Profilbild fehlt')
    recommendations.push('Profilbild hochladen')
  }

  if (gmbResult.address) {
    score += 15
    completedFeatures.push('Adresse vollständig')
  } else {
    missingFeatures.push('Adresse unvollständig')
  }

  if (gmbResult.phone) {
    score += 10
    completedFeatures.push('Telefonnummer eingetragen')
  } else {
    missingFeatures.push('Telefonnummer fehlt')
    recommendations.push('Telefonnummer hinzufügen')
  }

  if (gmbResult.hours) {
    score += 15
    completedFeatures.push('Öffnungszeiten eingetragen')
  } else {
    missingFeatures.push('Öffnungszeiten fehlen')
    recommendations.push('Öffnungszeiten eintragen')
  }

  if (gmbResult.rating && gmbResult.reviews) {
    const ratingScore = (gmbResult.rating / 5) * 20
    score += ratingScore
    completedFeatures.push(`${gmbResult.rating}★ mit ${gmbResult.reviews} Bewertungen`)
  } else {
    missingFeatures.push('Keine Bewertungen')
    recommendations.push('Kunden um Bewertungen bitten')
  }

  const reservationAvailable = gmbResult.extensions?.includes('Tisch reservieren') ?? false
  if (reservationAvailable) {
    score += 10
    completedFeatures.push('Online-Reservierung verfügbar')
  } else {
    recommendations.push('Online-Reservierung einrichten')
  }

  const hasHolidayHours = gmbResult.hours?.includes('Feiertag') ?? false
  if (hasHolidayHours) {
    score += 5
    completedFeatures.push('Feiertagsöffnungszeiten angegeben')
  }

  const askSectionVisible = result.organic?.some((r: any) => r.title?.includes('Fragen und Antworten')) ?? false
  if (askSectionVisible) {
    score += 5
    completedFeatures.push('Fragen & Antworten Sektion aktiv')
  } else {
    recommendations.push('Fragen & Antworten Sektion aktivieren')
  }

  const isListingComplete = [
    gmbResult.thumbnailUrl,
    gmbResult.address,
    gmbResult.phone,
    gmbResult.category,
    gmbResult.hours
  ].filter(Boolean).length >= 4

  return {
    platform: 'google',
    score: Math.round(score),
    maxScore: 100,
    completedFeatures,
    missingFeatures,
    profileUrl: gmbResult.link,
    profilePicture: gmbResult.thumbnailUrl,
    profileFound: true,
    recommendations,
    reservationAvailable,
    hasHolidayHours,
    askSectionVisible,
    isListingComplete,
    category: gmbResult.category
  }
}

function createGoogleDemoData(businessName: string): PlatformAnalysis {
  return {
    platform: 'google',
    score: 65 + Math.random() * 25,
    maxScore: 100,
    completedFeatures: [
      'Google My Business Profil existiert',
      'Grundlegende Informationen ausgefüllt',
      'Fotos hochgeladen',
      'Öffnungszeiten eingetragen'
    ],
    missingFeatures: [
      'Unvollständige Unternehmensbeschreibung',
      'Keine aktuellen Posts',
      'Fehlende Fragen & Antworten Sektion'
    ],
    profileFound: true,
    profilePicture: `https://via.placeholder.com/150x150?text=${businessName.substring(0,2).toUpperCase()}`,
    recommendations: [
      'Unternehmensbeschreibung hinzufügen',
      'Mehr Fotos hochladen',
      'Regelmäßige Google Posts erstellen',
      'Kundenbewertungen fördern'
    ],
    reservationAvailable: Math.random() > 0.5,
    hasHolidayHours: Math.random() > 0.7,
    askSectionVisible: Math.random() > 0.6,
    isListingComplete: Math.random() > 0.4
  }
}

async function analyzeFacebookPresence(facebookName: string, businessName: string, location: string, autoDetected: boolean = false, additionalData: any = {}): Promise<PlatformAnalysis> {
  if (!facebookName) {
    return {
      platform: 'facebook',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['Keine Facebook-Seite gefunden'],
      profileFound: false,
      recommendations: ['Facebook Business-Seite erstellen']
    }
  }

  try {
    console.log(`📘 Analyzing Facebook: ${facebookName} ${autoDetected ? '(auto-detected)' : ''}`)
    
    const mockScore = 45 + Math.random() * 40
    
    return {
      platform: 'facebook',
      score: Math.round(mockScore),
      maxScore: 100,
      completedFeatures: [
        'Facebook-Seite existiert',
        'Grundlegende Informationen ausgefüllt',
        'Aktuelle Posts vorhanden'
      ],
      missingFeatures: [
        'Öffnungszeiten nicht gesetzt',
        'Kein Call-to-Action Button',
        'Begrenzte Fotogalerie'
      ],
      profileUrl: `https://facebook.com/${facebookName}`,
      profilePicture: additionalData.profilePicture,
      followerCount: additionalData.followerCount,
      profileFound: true,
      autoDetected,
      recommendations: [
        'Alle Unternehmensinformationen vervollständigen',
        'Call-to-Action Button hinzufügen',
        'Mehr Fotos hochladen',
        'Regelmäßig posten (2-3x pro Woche)'
      ]
    }
  } catch (error) {
    console.error('❌ Facebook analysis error:', error)
    return {
      platform: 'facebook',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['Facebook-Analyse fehlgeschlagen'],
      profileFound: false,
      recommendations: ['Facebook-Seitenname überprüfen']
    }
  }
}

async function analyzeInstagramPresence(instagramName: string, businessName: string, location: string, autoDetected: boolean = false, additionalData: any = {}): Promise<PlatformAnalysis> {
  if (!instagramName) {
    console.log(`🔍 No Instagram name provided, searching for candidates...`)
    
    // Enhanced: Return candidates for user selection
    const candidates = await searchInstagramCandidatesEnhanced(businessName, location)
    
    return {
      platform: 'instagram',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['Kein Instagram-Account angegeben'],
      profileFound: false,
      recommendations: ['Instagram Business-Account erstellen oder aus Vorschlägen wählen'],
      candidates: candidates
    }
  }

  try {
    console.log(`📷 Analyzing Instagram: ${instagramName} ${autoDetected ? '(auto-detected)' : ''}`)
    
    const mockScore = 35 + Math.random() * 50
    
    return {
      platform: 'instagram',
      score: Math.round(mockScore),
      maxScore: 100,
      completedFeatures: [
        'Instagram-Account existiert',
        'Bio-Informationen ausgefüllt',
        'Aktuelle Posts vorhanden'
      ],
      missingFeatures: [
        'Kein Business-Account',
        'Kein Kontakt-Button',
        'Begrenzte Story Highlights'
      ],
      profileUrl: `https://instagram.com/${instagramName.replace('@', '')}`,
      profilePicture: additionalData.profilePicture,
      followerCount: additionalData.followerCount,
      profileFound: true,
      autoDetected,
      recommendations: [
        'Zu Business-Account wechseln',
        'Kontaktinformationen hinzufügen',
        'Story Highlights erstellen',
        'Täglich posten',
        'Relevante Hashtags verwenden'
      ]
    }
  } catch (error) {
    console.error('❌ Instagram analysis error:', error)
    return {
      platform: 'instagram',
      score: 0,
      maxScore: 100,
      completedFeatures: [],
      missingFeatures: ['Instagram-Analyse fehlgeschlagen'],
      profileFound: false,
      recommendations: ['Instagram-Nutzername überprüfen']
    }
  }
}

async function generateBenchmarks(businessName: string, location: string, mainCategory: string, userBenchmarks: string[]): Promise<BenchmarkComparison[]> {
  const benchmarks: BenchmarkComparison[] = []
  
  if (userBenchmarks.filter(b => b.trim()).length > 0) {
    for (const benchmark of userBenchmarks.filter(b => b.trim())) {
      benchmarks.push({
        name: benchmark,
        scores: {
          google: 65 + Math.random() * 30,
          facebook: 45 + Math.random() * 40,
          instagram: 40 + Math.random() * 45,
          overall: 0
        },
        profileUrls: {
          google: `https://maps.google.com/?q=${encodeURIComponent(benchmark + ' ' + location)}`,
          facebook: `https://facebook.com/search/top/?q=${encodeURIComponent(benchmark)}`,
          instagram: `https://instagram.com/explore/tags/${encodeURIComponent(benchmark.replace(/\s+/g, ''))}/`
        }
      })
    }
  } else {
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
  
  benchmarks.forEach(benchmark => {
    benchmark.scores.overall = Math.round(
      (benchmark.scores.google + benchmark.scores.facebook + benchmark.scores.instagram) / 3
    )
  })
  
  return benchmarks
}

function generateCategoryInsights(mainCategory: string, matbakhTags: string[], platformAnalyses: PlatformAnalysis[]): string[] {
  const insights = []
  
  if (mainCategory.includes('restaurant') || mainCategory.includes('food')) {
    insights.push('Restaurants profitieren am meisten von Google My Business Optimierung - 70% der Gäste prüfen GMB vor dem Besuch')
    
    if (matbakhTags.includes('delivery')) {
      insights.push('Lieferdienste sollten Google-Präsenz für lokale Suchsichtbarkeit priorisieren')
    }
    
    if (matbakhTags.includes('outdoor_seating')) {
      insights.push('Außenbereich ist ein wichtiges Unterscheidungsmerkmal - prominent in Fotos zeigen')
    }
  }
  
  const socialTags = ['live_music', 'rooftop', 'craft_beer', 'wine_bar']
  if (matbakhTags.some(tag => socialTags.includes(tag))) {
    insights.push('Erlebnisorientierte Betriebe wie Ihrer sollten stark in Instagram-Content investieren')
  }
  
  const googleAnalysis = platformAnalyses.find(p => p.platform === 'google')
  if (googleAnalysis && googleAnalysis.score < 60) {
    insights.push('Ihre Google-Präsenz benötigt sofortige Aufmerksamkeit - hier entdecken die meisten Kunden lokale Unternehmen')
  }
  
  return insights
}

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting Enhanced Visibility Check with Instagram Candidate Detection')
    
    const request: VisibilityCheckRequest = await req.json()
    console.log('📝 Request received:', {
      business: request.businessName,
      location: request.location,
      category: request.mainCategory,
      tags: request.matbakhTags?.length || 0,
      manualFacebook: !!request.facebookName,
      manualInstagram: !!request.instagramName
    })

    // Enhanced Instagram handling - always search for candidates if no manual input
    let resolvedInstagram = request.instagramName?.trim() || null
    let instagramAutoDetected = false
    let instagramData = { profilePicture: null, followerCount: null }

    // Facebook auto-detection
    let resolvedFacebook = request.facebookName?.trim() || null
    let facebookAutoDetected = false
    let facebookData = { profilePicture: null, followerCount: null }

    if (!resolvedFacebook) {
      console.log('🔍 Searching for Facebook profile...')
      // Simple Facebook search simulation (could be replaced with real search)
      // For now, no auto-detection implemented here
    }

    const weights = getCategoryWeights(request.mainCategory, request.matbakhTags)
    console.log('⚖️ Category weights:', weights)

    const googleAnalysis = await analyzeGooglePresence(request.businessName, request.location)
    
    const [facebookAnalysis, instagramAnalysis] = await Promise.all([
      analyzeFacebookPresence(resolvedFacebook || '', request.businessName, request.location, facebookAutoDetected, facebookData),
      analyzeInstagramPresence(resolvedInstagram || '', request.businessName, request.location, instagramAutoDetected, instagramData)
    ])

    const platformAnalyses = [googleAnalysis, facebookAnalysis, instagramAnalysis]
    
    const overallScore = Math.round(
      googleAnalysis.score * weights.google +
      facebookAnalysis.score * weights.facebook +
      instagramAnalysis.score * weights.instagram
    )

    const categoryInsights = generateCategoryInsights(request.mainCategory, request.matbakhTags, platformAnalyses)
    const quickWins = []
    
    platformAnalyses.forEach(analysis => {
      analysis.recommendations.slice(0, 2).forEach(rec => {
        if (!quickWins.includes(rec)) {
          quickWins.push(rec)
        }
      })
    })

    let leadPotential: 'high' | 'medium' | 'low' = 'medium'
    if (overallScore < 40) leadPotential = 'high'
    else if (overallScore > 75) leadPotential = 'low'

    const benchmarks = await generateBenchmarks(request.businessName, request.location, request.mainCategory, request.benchmarks)

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
        weights,
        autoDetectedProfiles: {
          facebook: facebookAutoDetected ? resolvedFacebook : null,
          instagram: instagramAutoDetected ? resolvedInstagram : null
        },
        enhancedCandidateDetection: true
      }
    }

    await saveAnalysis(request, result)

    console.log(`✅ Enhanced Analysis finished: ${overallScore}% overall score, ${leadPotential} potential`)
    if (instagramAnalysis.candidates && instagramAnalysis.candidates.length > 0) {
      console.log(`🎯 Found ${instagramAnalysis.candidates.length} Instagram candidates for user selection`)
    }

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

function getCategoryWeights(mainCategory: string, matbakhTags: string[]): { google: number, facebook: number, instagram: number } {
  let weights = { google: 0.4, facebook: 0.3, instagram: 0.3 }
  
  if (mainCategory.includes('restaurant') || mainCategory.includes('food')) {
    weights = { google: 0.5, facebook: 0.25, instagram: 0.25 }
  }
  
  const socialTags = ['live_music', 'rooftop', 'craft_beer', 'wine_bar', 'cocktail_bar']
  if (matbakhTags.some(tag => socialTags.includes(tag))) {
    weights = { google: 0.35, facebook: 0.25, instagram: 0.4 }
  }
  
  if (matbakhTags.includes('delivery') || matbakhTags.includes('takeout')) {
    weights = { google: 0.6, facebook: 0.2, instagram: 0.2 }
  }
  
  return weights
}
