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
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Places visibility check started')
    
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

    // 1. Try multiple search strategies for better results
    const searchQueries = [
      `${businessName} ${location}`,  // Original query
      `${businessName} restaurant ${location}`, // With "restaurant" added
      `${businessName}, ${location}`, // With comma separator
      businessName // Just the business name
    ]

    let placeData = null
    let searchQuery = ''

    // Try each search query until we find results
    for (const query of searchQueries) {
      searchQuery = encodeURIComponent(query)
      console.log(`Trying search query: ${query}`)
      
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${searchQuery}&inputtype=textquery&fields=place_id,name,formatted_address,geometry,types&key=${GOOGLE_PLACES_API_KEY}`

      const placeResponse = await fetch(findPlaceUrl)
      const tempPlaceData = await placeResponse.json()
      
      console.log(`Search result for "${query}":`, JSON.stringify(tempPlaceData, null, 2))

      if (tempPlaceData.candidates && tempPlaceData.candidates.length > 0) {
        // Filter for restaurants/food establishments
        const restaurantCandidate = tempPlaceData.candidates.find((candidate: any) => 
          candidate.types && candidate.types.some((type: string) => 
            ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar', 'establishment'].includes(type)
          )
        )
        
        if (restaurantCandidate) {
          placeData = { candidates: [restaurantCandidate] }
          console.log(`Found restaurant match with query: ${query}`)
          break
        } else if (tempPlaceData.candidates.length > 0) {
          // Fallback to first result if no restaurant type found
          placeData = tempPlaceData
          console.log(`Using first result from query: ${query}`)
          break
        }
      }
    }

    if (!placeData || !placeData.candidates || placeData.candidates.length === 0) {
      return new Response(
        JSON.stringify({
          found: false,
          businessName,
          location,
          analysis: {
            issues: [
              'Kein Google Business Profil gefunden',
              'Restaurant ist nicht in Google Maps sichtbar',
              'Potentielle Kunden können Sie nicht finden'
            ],
            opportunities: [
              'Google Business Profil erstellen = +200% Sichtbarkeit',
              'Sofortige Auffindbarkeit in Google und Maps',
              'Kostenlose Präsenz für lokale Suchanfragen'
            ],
            completenessScore: 0,
            overallScore: 10
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const place = placeData.candidates[0]
    const placeId = place.place_id

    // 2. Get detailed information
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,opening_hours,photos,rating,user_ratings_total,reviews,international_phone_number,url,types&key=${GOOGLE_PLACES_API_KEY}`

    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()
    const details = detailsData.result

    // 3. Analyze the data
    const issues: string[] = []
    const opportunities: string[] = []
    let completenessScore = 0
    const maxScore = 8

    // Check website
    if (details.website) {
      completenessScore++
    } else {
      issues.push('Keine Website im Google Profil hinterlegt')
      opportunities.push('Website hinzufügen für +25% mehr Klicks')
    }

    // Check opening hours
    if (details.opening_hours) {
      completenessScore++
    } else {
      issues.push('Öffnungszeiten fehlen')
      opportunities.push('Öffnungszeiten hinzufügen = bessere Auffindbarkeit')
    }

    // Check photos
    if (details.photos && details.photos.length > 0) {
      completenessScore++
      if (details.photos.length < 5) {
        opportunities.push('Mehr Fotos = +30% Interesse von Gästen')
      }
    } else {
      issues.push('Keine Fotos vorhanden')
      opportunities.push('Fotos hinzufügen = +50% mehr Interesse')
    }

    // Check reviews
    const reviewCount = details.user_ratings_total || 0
    if (reviewCount > 10) {
      completenessScore++
    } else if (reviewCount > 0) {
      issues.push(`Nur ${reviewCount} Bewertungen - zu wenig für Vertrauen`)
      opportunities.push('Mehr Bewertungen sammeln = höhere Glaubwürdigkeit')
    } else {
      issues.push('Keine Bewertungen vorhanden')
      opportunities.push('Erste Bewertungen = sofort mehr Vertrauen')
    }

    // Check rating
    const rating = details.rating || 0
    if (rating >= 4.5) {
      completenessScore++
    } else if (rating >= 4.0) {
      opportunities.push('Bewertung auf 4.5+ steigern für Top-Rankings')
    } else if (rating > 0) {
      issues.push(`Bewertung von ${rating} ist verbesserungswürdig`)
      opportunities.push('Bewertung verbessern = bessere Sichtbarkeit')
    }

    // Check phone number
    if (details.international_phone_number) {
      completenessScore++
    } else {
      issues.push('Telefonnummer fehlt')
      opportunities.push('Telefonnummer = direkte Buchungen möglich')
    }

    // Check business type
    const isRestaurant = details.types && details.types.some((type: string) => 
      ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'].includes(type)
    )
    if (isRestaurant) {
      completenessScore++
    }

    // Check recent activity (reviews)
    if (details.reviews && details.reviews.length > 0) {
      const recentReview = details.reviews[0]
      const reviewAge = Date.now() - (recentReview.time * 1000)
      const daysSinceReview = reviewAge / (1000 * 60 * 60 * 24)
      
      if (daysSinceReview < 30) {
        completenessScore++
      } else {
        opportunities.push('Aktuelle Bewertungen sammeln = bessere Rankings')
      }
    }

    // Calculate overall score
    const completenessPercentage = (completenessScore / maxScore) * 100
    let overallScore = completenessPercentage

    // Boost score based on rating and review count
    if (rating >= 4.0 && reviewCount >= 10) {
      overallScore += 10
    }

    // Cap at 100
    overallScore = Math.min(overallScore, 100)

    // Add generic opportunities if profile is decent
    if (completenessScore >= 5) {
      opportunities.push('Profil ist gut - regelmäßige Pflege für Top-Ergebnisse')
    }

    const response: VisibilityCheckResponse = {
      found: true,
      businessName,
      location,
      analysis: {
        issues,
        opportunities,
        completenessScore: Math.round(completenessPercentage),
        overallScore: Math.round(overallScore)
      },
      googleData: {
        name: details.name,
        address: details.formatted_address,
        rating: rating,
        reviewCount: reviewCount,
        hasWebsite: !!details.website,
        hasOpeningHours: !!details.opening_hours,
        hasPhotos: details.photos && details.photos.length > 0,
        googleUrl: details.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`
      }
    }

    console.log(`Analysis complete for ${businessName}: ${overallScore}% overall score`)

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