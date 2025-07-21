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

// Facebook Graph API helper
async function searchFacebookPage(businessName: string, location: string): Promise<any> {
  const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID')
  const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET')
  
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.error('Facebook API credentials not found')
    return null
  }

  try {
    // Generate App Access Token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&grant_type=client_credentials`
    )
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      console.error('Failed to get Facebook access token:', tokenData)
      return null
    }

    const accessToken = tokenData.access_token

    // Search for pages with detailed fields
    const searchQueries = [
      `${businessName} ${location}`,
      `${businessName} restaurant ${location}`,
      businessName
    ]

    for (const query of searchQueries) {
      console.log(`Searching Facebook for: ${query}`)
      
      const searchUrl = `https://graph.facebook.com/v18.0/search?type=page&q=${encodeURIComponent(query)}&fields=id,name,fan_count,verification_status,overall_star_rating,location,about,link,posts.limit(3){created_time,message},hours,contact_address,emails,phone,website,category,description,mission,general_info&access_token=${accessToken}`
      
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      console.log(`Facebook search result for "${query}":`, JSON.stringify(searchData, null, 2))

      if (searchData.data && searchData.data.length > 0) {
        const bestMatch = searchData.data.find((page: any) => {
          const nameSimilarity = page.name.toLowerCase().includes(businessName.toLowerCase()) ||
                                businessName.toLowerCase().includes(page.name.toLowerCase())
          return nameSimilarity
        }) || searchData.data[0]

        return bestMatch
      }
    }

    return null
  } catch (error) {
    console.error('Facebook API error:', error)
    return null
  }
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
    console.log('Enhanced visibility check started with lead generation')
    
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not found in environment')
      return new Response(
        JSON.stringify({ 
          found: false, 
          error: 'API configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body: VisibilityCheckRequest = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { businessName, location, email, website, checkType } = body

    if (!businessName || !location) {
      console.error('Missing required fields:', { businessName: !!businessName, location: !!location })
      return new Response(
        JSON.stringify({ 
          found: false, 
          error: 'Fehlende Angaben' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Enhanced visibility check for: ${businessName} in ${location}`)

    // Parallel execution of all platform searches
    const [googleResult, facebookResult] = await Promise.allSettled([
      searchGooglePlaces(businessName, location, GOOGLE_PLACES_API_KEY),
      searchFacebookPage(businessName, location)
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
      found: analysisResult.googleData || analysisResult.facebookData,
      businessName,
      location,
      analysis: analysisResult,
      leadId,
      todos: todos.slice(0, 5), // Return top 5 todos for UI
      googleData: analysisResult.googleData,
      facebookData: analysisResult.facebookData,
      instagramData: analysisResult.instagramData
    }

    console.log(`Enhanced analysis complete for ${businessName}: ${analysisResult.overallScore}% overall score, ${todos.length} todos generated`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in enhanced visibility check:', error)
    return new Response(
      JSON.stringify({ 
        found: false, 
        error: 'Fehler bei der Analyse. Bitte versuchen Sie es erneut.' 
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
