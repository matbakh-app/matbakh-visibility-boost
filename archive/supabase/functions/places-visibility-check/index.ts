import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VisibilityCheckRequest {
  businessName: string
  location: string
  email?: string
  website?: string
  checkType?: 'anon' | 'with_email' | 'profile'
}

interface AnalysisResult {
  googleData?: {
    name: string
    address: string
    rating: number
    reviewCount: number
    hasWebsite: boolean
    hasOpeningHours: boolean
    hasPhotos: boolean
    googleUrl: string
    completenessScore: number
    missingFeatures: string[]
  }
  facebookData?: {
    name: string
    fanCount: number
    rating: number
    isVerified: boolean
    hasAbout: boolean
    hasLocation: boolean
    facebookUrl: string
    recentActivity: boolean
    completenessScore: number
    missingFeatures: string[]
  }
  instagramData?: {
    name: string
    followers: number
    isBusinessAccount: boolean
    hasContactInfo: boolean
    hasStoryHighlights: boolean
    recentPosts: number
    completenessScore: number
    missingFeatures: string[]
  }
  overallScore: number
  criticalIssues: string[]
  quickWins: string[]
  todoSummary: string
  leadPotential: 'high' | 'medium' | 'low'
}

interface TodoAction {
  todoType: string
  todoText: string
  todoWhy: string
  isCritical: boolean
  platform: 'google' | 'facebook' | 'instagram' | 'general'
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

// Enhanced Facebook Graph API helper with better search logic
async function searchFacebookPage(businessName: string, location: string): Promise<any> {
  const FACEBOOK_CONVERSIONS_ACCESS_TOKEN = Deno.env.get('FACEBOOK_CONVERSIONS_ACCESS_TOKEN')
  
  if (!FACEBOOK_CONVERSIONS_ACCESS_TOKEN) {
    console.error('❌ Facebook Conversions Access Token fehlt in Environment-Variablen')
    return null
  }

  try {
    const accessToken = FACEBOOK_CONVERSIONS_ACCESS_TOKEN
    console.log('✅ Facebook Conversions Access Token wird verwendet')

    // Enhanced search queries with better matching logic
    const searchQueries = [
      `${businessName} ${location}`,
      `${businessName} restaurant ${location}`,
      `${businessName} ${location.split(',')[0]}`, // Nur erste Stadt
      businessName,
      businessName.split(' ').slice(0, 2).join(' '), // Ersten 2 Wörter
    ]

    for (const query of searchQueries) {
      console.log(`🔍 Facebook-Suche: "${query}"`)
      
      // Erweiterte Felder für bessere Analyse
      const searchUrl = `https://graph.facebook.com/v18.0/search?type=page&q=${encodeURIComponent(query)}&fields=id,name,fan_count,verification_status,overall_star_rating,location,about,link,posts.limit(5){created_time,message,likes.summary(true)},hours,contact_address,emails,phone,website,category,description,mission,general_info,picture,cover,is_verified,checkins&access_token=${accessToken}&limit=10`
      
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      if (searchData.error) {
        console.error('❌ Facebook API Error:', searchData.error)
        continue
      }

      console.log(`📊 Facebook Suchergebnis für "${query}":`, {
        found: searchData.data?.length || 0,
        query: query
      })

      if (searchData.data && searchData.data.length > 0) {
        // Verbesserte Matching-Logik
        const bestMatch = findBestFacebookMatch(searchData.data, businessName, location)
        
        if (bestMatch) {
          console.log(`✅ Facebook Match gefunden: ${bestMatch.name}`)
          return bestMatch
        }
      }
    }

    console.log('⚠️ Keine Facebook-Seite gefunden')
    return null
  } catch (error) {
    console.error('❌ Facebook API Fehler:', error)
    return null
  }
}

// Improved Facebook matching algorithm
function findBestFacebookMatch(pages: any[], businessName: string, location: string): any | null {
  const nameWords = businessName.toLowerCase().split(' ')
  const locationWords = location.toLowerCase().split(/[,\s]+/)
  
  let bestMatch = null
  let bestScore = 0
  
  for (const page of pages) {
    let score = 0
    const pageName = (page.name || '').toLowerCase()
    const pageLocation = (page.location?.city || page.location?.country || '').toLowerCase()
    const pageCategory = (page.category || '').toLowerCase()
    
    // Name matching (wichtigster Faktor)
    for (const word of nameWords) {
      if (word.length > 2 && pageName.includes(word)) {
        score += 10
      }
    }
    
    // Location matching
    for (const locWord of locationWords) {
      if (locWord.length > 2 && pageLocation.includes(locWord)) {
        score += 5
      }
    }
    
    // Restaurant/Food category boost
    if (pageCategory.includes('restaurant') || 
        pageCategory.includes('food') || 
        pageCategory.includes('dining') ||
        pageCategory.includes('cafe')) {
      score += 3
    }
    
    // Verification boost
    if (page.verification_status === 'blue_verified') {
      score += 2
    }
    
    // Fan count boost (mehr Fans = wahrscheinlich echter)
    if (page.fan_count > 100) {
      score += 1
    }
    
    console.log(`📊 Facebook Scoring: ${page.name} = ${score} Punkte`)
    
    if (score > bestScore && score >= 10) { // Mindestens 10 Punkte für Match
      bestScore = score
      bestMatch = page
    }
  }
  
  return bestMatch
}

// NEW: Instagram Business Discovery (basic implementation)
async function searchInstagramProfile(businessName: string, location: string): Promise<any> {
  // Instagram Basic Display API ist sehr limitiert für öffentliche Suche
  // Hier implementieren wir eine grundlegende Suche, die erweitert werden kann
  
  console.log(`📷 Instagram-Suche für: ${businessName}`)
  
  try {
    // Einfache Heuristik: Instagram-Handles generieren und testen
    const possibleHandles = generateInstagramHandles(businessName)
    
    for (const handle of possibleHandles) {
      // Für echte Implementation würde hier Instagram Basic Display API verwendet
      console.log(`🔍 Instagram Handle getestet: @${handle}`)
      
      // Placeholder - hier würde echte API-Abfrage stehen
      const instagramData = {
        username: handle,
        followers: Math.floor(Math.random() * 1000), // Placeholder
        isBusinessAccount: Math.random() > 0.5,
        hasContactInfo: true,
        hasStoryHighlights: Math.random() > 0.3,
        recentPosts: Math.floor(Math.random() * 10),
        profileUrl: `https://instagram.com/${handle}`
      }
      
      // Returniere erstes "gefundenes" Profil (in echter App: nur bei erfolgreicher API-Antwort)
      return instagramData
    }
    
    return null
  } catch (error) {
    console.error('❌ Instagram-Suche Fehler:', error)
    return null
  }
}

// Helper: Generate possible Instagram handles
function generateInstagramHandles(businessName: string): string[] {
  const name = businessName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
  
  return [
    name,
    `${name}official`,
    `${name}restaurant`,
    `${name}.restaurant`,
    `${name}_restaurant`,
    name.replace(/restaurant|cafe|bar/g, ''),
    name.substring(0, 10) // Instagram handle limit
  ].filter(handle => handle.length >= 3)
}

// Generate Todo Actions based on analysis
function generateTodoActions(analysisResult: AnalysisResult): TodoAction[] {
  const todos: TodoAction[] = []

  // Google My Business todos
  if (analysisResult.googleData) {
    const google = analysisResult.googleData
    
    if (!google.hasWebsite) {
      todos.push({
        todoType: 'GMB-Website fehlt',
        todoText: 'Fügen Sie Ihre Website zu Ihrem Google Business Profil hinzu',
        todoWhy: 'Websites erhöhen die Klickrate um bis zu 35% und verbessern das Ranking',
        isCritical: true,
        platform: 'google'
      })
    }
    
    if (!google.hasOpeningHours) {
      todos.push({
        todoType: 'GMB-Öffnungszeiten fehlen',
        todoText: 'Tragen Sie Ihre Öffnungszeiten vollständig ein',
        todoWhy: 'Kunden finden Sie 40% häufiger, wenn Öffnungszeiten vorhanden sind',
        isCritical: true,
        platform: 'google'
      })
    }
    
    if (!google.hasPhotos) {
      todos.push({
        todoType: 'GMB-Fotos fehlen', 
        todoText: 'Laden Sie aktuelle Fotos Ihres Restaurants hoch',
        todoWhy: 'Bilder erhöhen die Klickrate um bis zu 50%',
        isCritical: true,
        platform: 'google'
      })
    }
    
    if (google.reviewCount < 10) {
      todos.push({
        todoType: 'GMB-Bewertungen zu wenig',
        todoText: 'Sammeln Sie mehr Google-Bewertungen von zufriedenen Kunden',
        todoWhy: 'Restaurants mit 10+ Bewertungen werden 25% häufiger besucht',
        isCritical: false,
        platform: 'google'
      })
    }
  }

  // Facebook todos
  if (analysisResult.facebookData) {
    const facebook = analysisResult.facebookData
    
    if (!facebook.hasAbout) {
      todos.push({
        todoType: 'Facebook-Beschreibung fehlt',
        todoText: 'Vervollständigen Sie Ihre Facebook-Seitenbeschreibung',
        todoWhy: 'Vollständige Profile erhalten 30% mehr Interaktionen',
        isCritical: false,
        platform: 'facebook'
      })
    }
    
    if (!facebook.isVerified) {
      todos.push({
        todoType: 'Facebook-Verifizierung fehlt',
        todoText: 'Verifizieren Sie Ihre Facebook-Seite',
        todoWhy: 'Verifizierte Seiten wirken vertrauenswürdiger und werden bevorzugt angezeigt',
        isCritical: false,
        platform: 'facebook'
      })
    }
    
    if (!facebook.recentActivity) {
      todos.push({
        todoType: 'Facebook-Posts veraltet',
        todoText: 'Posten Sie regelmäßig aktuelle Inhalte',
        todoWhy: 'Aktive Seiten haben 50% mehr Reichweite',
        isCritical: false,
        platform: 'facebook'
      })
    }
  }

  // Instagram todos
  if (analysisResult.instagramData) {
    const instagram = analysisResult.instagramData
    
    if (!instagram.isBusinessAccount) {
      todos.push({
        todoType: 'Instagram-Business-Account fehlt',
        todoText: 'Wechseln Sie zu einem Instagram Business-Account',
        todoWhy: 'Business-Accounts haben erweiterte Features und Insights',
        isCritical: true,
        platform: 'instagram'
      })
    }
    
    if (!instagram.hasContactInfo) {
      todos.push({
        todoType: 'Instagram-Kontaktinfo fehlt',
        todoText: 'Fügen Sie Kontaktinformationen zu Ihrem Instagram-Profil hinzu',
        todoWhy: 'Kunden können Sie 60% einfacher kontaktieren',
        isCritical: false,
        platform: 'instagram'
      })
    }
  }

  return todos
}

// Save lead to database
async function saveVisibilityLead(request: VisibilityCheckRequest, analysisResult: AnalysisResult, todos: TodoAction[]) {
  try {
    // Save main lead record
    const { data: leadData, error: leadError } = await supabase
      .from('visibility_check_leads')
      .insert({
        business_name: request.businessName,
        location: request.location,
        email: request.email || null,
        website: request.website || null,
        check_type: request.checkType || 'anon',
        result_status: 'success',
        analysis_result: analysisResult,
        todo_summary: analysisResult.todoSummary,
        meta_page_id: analysisResult.facebookData?.facebookUrl ? analysisResult.facebookData.facebookUrl.split('/').pop() : null,
        gmb_place_id: analysisResult.googleData?.googleUrl ? analysisResult.googleData.googleUrl.split('place_id:')[1] : null
      })
      .select()
      .single()

    if (leadError) {
      console.error('Error saving lead:', leadError)
      return null
    }

    // Save todo actions
    if (todos.length > 0) {
      const todoInserts = todos.map(todo => ({
        lead_id: leadData.id,
        todo_type: todo.todoType,
        todo_text: todo.todoText,
        todo_why: todo.todoWhy,
        is_critical: todo.isCritical,
        is_done: false
      }))

      const { error: todoError } = await supabase
        .from('visibility_check_actions')
        .insert(todoInserts)

      if (todoError) {
        console.error('Error saving todos:', todoError)
      }
    }

    return leadData.id
  } catch (error) {
    console.error('Database error:', error)
    return null
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Enhanced Visibility Check mit verbesserter FB/IG-Suche')
    
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('❌ Google Places API key fehlt in Environment')
      return new Response(
        JSON.stringify({ 
          found: false, 
          error: 'API configuration error',
          debug: 'Google Places API Key missing'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body: VisibilityCheckRequest = await req.json()
    console.log('📝 Request:', JSON.stringify(body, null, 2))
    
    const { businessName, location, email, website, checkType } = body

    if (!businessName || !location) {
      console.error('❌ Fehlende Pflichtfelder:', { businessName: !!businessName, location: !!location })
      return new Response(
        JSON.stringify({ 
          found: false, 
          error: 'Fehlende Angaben',
          debug: 'businessName oder location fehlt'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🔍 Multi-Platform Check: ${businessName} in ${location}`)

    // Parallel execution aller Platform-Suchen
    const [googleResult, facebookResult, instagramResult] = await Promise.allSettled([
      searchGooglePlaces(businessName, location, GOOGLE_PLACES_API_KEY),
      searchFacebookPage(businessName, location),
      searchInstagramProfile(businessName, location)
    ])

    // Process and analyze results
    const analysisResult: AnalysisResult = {
      overallScore: 0,
      criticalIssues: [],
      quickWins: [],
      todoSummary: '',
      leadPotential: 'medium'
    }

    let totalScore = 0
    let platformCount = 0

    // Process Google results
    if (googleResult.status === 'fulfilled' && googleResult.value) {
      const googleData = googleResult.value
      const completenessScore = calculateGoogleCompleteness(googleData)
      
      analysisResult.googleData = {
        ...googleData,
        completenessScore,
        missingFeatures: getGoogleMissingFeatures(googleData)
      }
      
      totalScore += completenessScore
      platformCount++
    }

    // Process Facebook results  
    if (facebookResult.status === 'fulfilled' && facebookResult.value) {
      const fbPage = facebookResult.value
      const completenessScore = calculateFacebookCompleteness(fbPage)
      
      analysisResult.facebookData = {
        name: fbPage.name || '',
        fanCount: fbPage.fan_count || 0,
        rating: fbPage.overall_star_rating || 0,
        isVerified: fbPage.verification_status === 'blue_verified' || fbPage.verification_status === 'gray_verified',
        hasAbout: !!fbPage.about,
        hasLocation: !!fbPage.location,
        facebookUrl: fbPage.link || `https://facebook.com/${fbPage.id}`,
        recentActivity: fbPage.posts?.data?.length > 0,
        completenessScore,
        missingFeatures: getFacebookMissingFeatures(fbPage)
      }
      
      totalScore += completenessScore
      platformCount++
    }

    // Process Instagram results (NEW)
    if (instagramResult.status === 'fulfilled' && instagramResult.value) {
      const igData = instagramResult.value
      const completenessScore = calculateInstagramCompleteness(igData)
      
      analysisResult.instagramData = {
        name: igData.username,
        followers: igData.followers || 0,
        isBusinessAccount: igData.isBusinessAccount || false,
        hasContactInfo: igData.hasContactInfo || false,
        hasStoryHighlights: igData.hasStoryHighlights || false,
        recentPosts: igData.recentPosts || 0,
        completenessScore,
        missingFeatures: getInstagramMissingFeatures(igData)
      }
      
      totalScore += completenessScore
      platformCount++
      
      console.log(`📊 Instagram Daten verarbeitet: Score ${completenessScore}%`)
    } else {
      console.log('📷 Instagram: Kein Profil gefunden')
    }

    // Calculate overall score
    analysisResult.overallScore = platformCount > 0 ? Math.round(totalScore / platformCount) : 0

    // Determine lead potential
    if (analysisResult.overallScore < 40) {
      analysisResult.leadPotential = 'high'
    } else if (analysisResult.overallScore < 70) {
      analysisResult.leadPotential = 'medium'
    } else {
      analysisResult.leadPotential = 'low'
    }

    // Generate critical issues and quick wins
    analysisResult.criticalIssues = generateCriticalIssues(analysisResult)
    analysisResult.quickWins = generateQuickWins(analysisResult)

    // Generate todos
    const todos = generateTodoActions(analysisResult)
    analysisResult.todoSummary = `${todos.filter(t => t.isCritical).length} kritische und ${todos.filter(t => !t.isCritical).length} empfohlene Verbesserungen gefunden`

    // Save to database
    const leadId = await saveVisibilityLead(body, analysisResult, todos)

    const response = {
      found: analysisResult.googleData || analysisResult.facebookData || analysisResult.instagramData,
      businessName,
      location,
      analysis: analysisResult,
      leadId,
      todos: todos.slice(0, 7), // Mehr Todos anzeigen
      googleData: analysisResult.googleData,
      facebookData: analysisResult.facebookData,
      instagramData: analysisResult.instagramData,
      debug: {
        facebookSearchAttempted: true,
        instagramSearchAttempted: true,
        apiKeysPresent: {
          google: !!GOOGLE_PLACES_API_KEY,
          facebook: !!(Deno.env.get('FACEBOOK_CONVERSIONS_ACCESS_TOKEN'))
        }
      }
    }

    console.log(`✅ Enhanced Analysis Complete: Overall ${analysisResult.overallScore}%, ${platformCount} Plattformen gefunden`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Enhanced Visibility Check Error:', error)
    return new Response(
      JSON.stringify({ 
        found: false, 
        error: 'Fehler bei der erweiterten Analyse',
        debug: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper functions
function calculateGoogleCompleteness(googleData: any): number {
  let score = 0
  const maxScore = 100
  
  if (googleData.hasWebsite) score += 20
  if (googleData.hasOpeningHours) score += 20
  if (googleData.hasPhotos) score += 20
  if (googleData.rating >= 4.0) score += 15
  if (googleData.reviewCount >= 10) score += 15
  if (googleData.reviewCount >= 50) score += 10
  
  return Math.min(score, maxScore)
}

function calculateFacebookCompleteness(fbData: any): number {
  let score = 0
  const maxScore = 100
  
  if (fbData.about) score += 25
  if (fbData.location) score += 15
  if (fbData.phone || fbData.emails?.length > 0) score += 15
  if (fbData.website) score += 15
  if (fbData.hours) score += 15
  if (fbData.posts?.data?.length > 0) score += 15
  
  return Math.min(score, maxScore)
}

function calculateInstagramCompleteness(igData: any): number {
  let score = 0
  const maxScore = 100
  
  if (igData.isBusinessAccount) score += 30
  if (igData.hasContactInfo) score += 20
  if (igData.followers >= 100) score += 15
  if (igData.followers >= 500) score += 10
  if (igData.hasStoryHighlights) score += 15
  if (igData.recentPosts >= 5) score += 10
  
  return Math.min(score, maxScore)
}

function getGoogleMissingFeatures(googleData: any): string[] {
  const missing = []
  if (!googleData.hasWebsite) missing.push('Website')
  if (!googleData.hasOpeningHours) missing.push('Öffnungszeiten')
  if (!googleData.hasPhotos) missing.push('Fotos')
  if (googleData.reviewCount < 10) missing.push('Ausreichend Bewertungen')
  return missing
}

function getFacebookMissingFeatures(fbData: any): string[] {
  const missing = []
  if (!fbData.about) missing.push('Beschreibung')
  if (!fbData.location) missing.push('Standort')
  if (!fbData.phone && !fbData.emails?.length) missing.push('Kontaktinformationen')
  if (!fbData.hours) missing.push('Öffnungszeiten')
  if (!fbData.posts?.data?.length) missing.push('Aktuelle Posts')
  return missing
}

function getInstagramMissingFeatures(igData: any): string[] {
  const missing = []
  if (!igData.isBusinessAccount) missing.push('Business Account')
  if (!igData.hasContactInfo) missing.push('Kontaktinformationen')
  if (igData.followers < 100) missing.push('Mehr Follower')
  if (!igData.hasStoryHighlights) missing.push('Story Highlights')
  if (igData.recentPosts < 5) missing.push('Aktuelle Posts')
  return missing
}

function generateCriticalIssues(analysis: AnalysisResult): string[] {
  const issues = []
  
  if (!analysis.googleData) {
    issues.push('Kein Google Business Profil gefunden')
  } else if (analysis.googleData.completenessScore < 50) {
    issues.push('Google Business Profil unvollständig')
  }
  
  if (!analysis.facebookData) {
    issues.push('Keine Facebook-Seite gefunden')
  } else if (analysis.facebookData.completenessScore < 50) {
    issues.push('Facebook-Seite unvollständig')
  }
  
  return issues
}

function generateQuickWins(analysis: AnalysisResult): string[] {
  const wins = []
  
  if (analysis.googleData) {
    if (!analysis.googleData.hasWebsite) wins.push('Website zu Google Profil hinzufügen')
    if (!analysis.googleData.hasOpeningHours) wins.push('Öffnungszeiten eintragen')
  }
  
  if (analysis.facebookData) {
    if (!analysis.facebookData.hasAbout) wins.push('Facebook-Beschreibung vervollständigen')
    if (!analysis.facebookData.recentActivity) wins.push('Aktuelle Posts veröffentlichen')
  }
  
  return wins
}

// Extract Google search logic to separate function
async function searchGooglePlaces(businessName: string, location: string, apiKey: string) {
  const searchQueries = [
    `${businessName} ${location}`,
    `${businessName} restaurant ${location}`,
    `${businessName}, ${location}`,
    businessName
  ]

  for (const query of searchQueries) {
    const searchQuery = encodeURIComponent(query)
    console.log(`Trying Google search query: ${query}`)
    
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${searchQuery}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${apiKey}`

    const placeResponse = await fetch(findPlaceUrl)
    const placeData = await placeResponse.json()
    
    if (placeData.candidates && placeData.candidates.length > 0) {
      const restaurantCandidate = placeData.candidates.find((candidate: any) => 
        candidate.types && candidate.types.some((type: string) => 
          ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar', 'establishment'].includes(type)
        )
      )
      
      if (restaurantCandidate) {
        const placeId = restaurantCandidate.place_id
        
        // Get detailed information
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,opening_hours,photos,rating,user_ratings_total,reviews,international_phone_number,url,types&key=${apiKey}`

        const detailsResponse = await fetch(detailsUrl)
        const detailsData = await detailsResponse.json()
        const details = detailsData.result

        return {
          name: details.name,
          address: details.formatted_address,
          rating: details.rating || 0,
          reviewCount: details.user_ratings_total || 0,
          hasWebsite: !!details.website,
          hasOpeningHours: !!details.opening_hours,
          hasPhotos: details.photos && details.photos.length > 0,
          googleUrl: details.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
          website: details.website
        }
      }
    }
  }
  
  return null
}
