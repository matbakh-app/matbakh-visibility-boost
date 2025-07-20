import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VisibilityCheckRequest {
  businessName: string
  location: string
  email: string
  website?: string
}

interface FacebookPageData {
  id?: string
  name?: string
  fan_count?: number
  verification_status?: string
  overall_star_rating?: number
  location?: any
  about?: string
  link?: string
  posts?: any
  engagement?: any
}

interface VisibilityCheckResponse {
  found: boolean
  businessName: string
  location: string
  analysis: {
    issues: string[]
    opportunities: string[]
    completenessScore: number
    overallScore: number
  }
  googleData?: {
    name: string
    address: string
    rating: number
    reviewCount: number
    hasWebsite: boolean
    hasOpeningHours: boolean
    hasPhotos: boolean
    googleUrl: string
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
  }
  error?: string
}

// Facebook Graph API helper
async function searchFacebookPage(businessName: string, location: string): Promise<FacebookPageData | null> {
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

    // Search for pages
    const searchQueries = [
      `${businessName} ${location}`,
      `${businessName} restaurant ${location}`,
      businessName
    ]

    for (const query of searchQueries) {
      console.log(`Searching Facebook for: ${query}`)
      
      const searchUrl = `https://graph.facebook.com/v18.0/search?type=page&q=${encodeURIComponent(query)}&fields=id,name,fan_count,verification_status,overall_star_rating,location,about,link,posts.limit(1){created_time},engagement&access_token=${accessToken}`
      
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      console.log(`Facebook search result for "${query}":`, JSON.stringify(searchData, null, 2))

      if (searchData.data && searchData.data.length > 0) {
        // Find the best match based on name similarity and location
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Places visibility check started with Meta integration')
    
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
    
    const { businessName, location, email, website } = body

    if (!businessName || !location || !email) {
      console.error('Missing required fields:', { businessName: !!businessName, location: !!location, email: !!email })
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

    console.log(`Checking visibility for: ${businessName} in ${location}`)

    // Parallel execution of Google and Facebook searches
    const [googleResult, facebookResult] = await Promise.allSettled([
      searchGooglePlaces(businessName, location, GOOGLE_PLACES_API_KEY),
      searchFacebookPage(businessName, location)
    ])

    // Process Google results
    let googleData = null
    let googleFound = false
    if (googleResult.status === 'fulfilled' && googleResult.value) {
      googleData = googleResult.value
      googleFound = true
    }

    // Process Facebook results
    let facebookData = null
    let facebookFound = false
    if (facebookResult.status === 'fulfilled' && facebookResult.value) {
      const fbPage = facebookResult.value
      facebookData = {
        name: fbPage.name || '',
        fanCount: fbPage.fan_count || 0,
        rating: fbPage.overall_star_rating || 0,
        isVerified: fbPage.verification_status === 'blue_verified' || fbPage.verification_status === 'gray_verified',
        hasAbout: !!fbPage.about,
        hasLocation: !!fbPage.location,
        facebookUrl: fbPage.link || `https://facebook.com/${fbPage.id}`,
        recentActivity: fbPage.posts?.data?.length > 0
      }
      facebookFound = true
    }

    // Combined analysis
    const issues: string[] = []
    const opportunities: string[] = []
    let completenessScore = 0
    const maxScore = 12 // Increased for both platforms

    // Google analysis (existing logic)
    if (googleFound && googleData) {
      if (googleData.website) {
        completenessScore++
      } else {
        issues.push('Keine Website im Google Profil hinterlegt')
        opportunities.push('Website hinzufügen für +25% mehr Klicks')
      }

      if (googleData.hasOpeningHours) {
        completenessScore++
      } else {
        issues.push('Öffnungszeiten fehlen im Google Profil')
        opportunities.push('Öffnungszeiten hinzufügen = bessere Auffindbarkeit')
      }

      if (googleData.hasPhotos) {
        completenessScore++
      } else {
        issues.push('Keine Fotos im Google Profil')
        opportunities.push('Fotos hinzufügen = +50% mehr Interesse')
      }

      if (googleData.reviewCount > 10) {
        completenessScore++
      } else if (googleData.reviewCount > 0) {
        issues.push(`Nur ${googleData.reviewCount} Google-Bewertungen`)
        opportunities.push('Mehr Google-Bewertungen sammeln')
      } else {
        issues.push('Keine Google-Bewertungen vorhanden')
      }

      if (googleData.rating >= 4.5) {
        completenessScore++
      } else if (googleData.rating > 0) {
        issues.push(`Google-Bewertung von ${googleData.rating} verbesserungswürdig`)
      }
    } else {
      issues.push('Kein Google Business Profil gefunden')
      opportunities.push('Google Business Profil erstellen = +200% Sichtbarkeit')
    }

    // Facebook analysis
    if (facebookFound && facebookData) {
      if (facebookData.fanCount > 50) completenessScore++
      else {
        issues.push(`Nur ${facebookData.fanCount} Facebook-Fans`)
        opportunities.push('Facebook-Community aufbauen = mehr Reichweite')
      }

      if (facebookData.isVerified) completenessScore++
      else {
        opportunities.push('Facebook-Verifizierung beantragen = mehr Vertrauen')
      }

      if (facebookData.hasAbout) completenessScore++
      else {
        issues.push('Facebook-Beschreibung fehlt')
        opportunities.push('Vollständiges Facebook-Profil = bessere Auffindbarkeit')
      }

      if (facebookData.hasLocation) completenessScore++
      else {
        issues.push('Facebook-Standort nicht hinterlegt')
      }

      if (facebookData.rating >= 4.0) completenessScore++
      else if (facebookData.rating > 0) {
        issues.push(`Facebook-Bewertung von ${facebookData.rating} ausbaufähig`)
      }

      if (facebookData.recentActivity) completenessScore++
      else {
        issues.push('Keine aktuellen Facebook-Posts')
        opportunities.push('Regelmäßige Posts = +40% mehr Engagement')
      }
    } else {
      issues.push('Keine Facebook-Seite gefunden')
      opportunities.push('Facebook Business-Seite erstellen = zusätzliche Reichweite')
    }

    // Calculate overall score
    const completenessPercentage = (completenessScore / maxScore) * 100
    let overallScore = completenessPercentage

    // Boost for having both platforms
    if (googleFound && facebookFound) {
      overallScore += 15
      opportunities.push('Multi-Platform-Präsenz bereits aktiv!')
    }

    overallScore = Math.min(overallScore, 100)

    const response: VisibilityCheckResponse = {
      found: googleFound || facebookFound,
      businessName,
      location,
      analysis: {
        issues,
        opportunities,
        completenessScore: Math.round(completenessPercentage),
        overallScore: Math.round(overallScore)
      },
      googleData: googleData || undefined,
      facebookData: facebookData || undefined
    }

    console.log(`Analysis complete for ${businessName}: ${Math.round(overallScore)}% overall score`)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in places-visibility-check:', error)
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
