import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ================================================================
// Visibility Check Data Management API
// Complete End-to-End Flow Handler
// ================================================================

interface EmailCollectionRequest {
  email: string
  language?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer_url?: string
}

interface BusinessDataRequest {
  token: string
  business_name: string
  business_description?: string
  location: {
    street_address?: string
    city: string
    state_province?: string
    postal_code?: string
    country?: string
  }
  categories: {
    main_category: string
    sub_categories?: string[]
  }
  online_presence: {
    website_url?: string
    instagram_url?: string
    facebook_url?: string
    gmb_url?: string
    tripadvisor_url?: string
    yelp_url?: string
  }
  benchmark_urls?: string[]
  user_goal?: string
  priority_areas?: string[]
}

interface TokenValidationRequest {
  token: string
}

interface AdminDashboardRequest {
  filters?: {
    status?: string
    date_from?: string
    date_to?: string
    lead_score_min?: number
  }
  page?: number
  limit?: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()
    
    switch (path) {
      case 'collect-email':
        return await handleEmailCollection(req, supabase)
      case 'confirm-email':
        return await handleEmailConfirmation(req, supabase)
      case 'submit-business-data':
        return await handleBusinessDataSubmission(req, supabase)
      case 'trigger-analysis':
        return await handleAnalysisTrigger(req, supabase)
      case 'get-results':
        return await handleResultsRetrieval(req, supabase)
      case 'admin-dashboard':
        return await handleAdminDashboard(req, supabase)
      case 'anonymize-lead':
        return await handleLeadAnonymization(req, supabase)
      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('VC Data Management Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ================================================================
// 1. Email Collection & Double Opt-In
// ================================================================

async function handleEmailCollection(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { email, language = 'de', utm_source, utm_medium, utm_campaign, referrer_url }: EmailCollectionRequest = await req.json()

  if (!email || !isValidEmail(email)) {
    return new Response(
      JSON.stringify({ error: 'Valid email address required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Generate secure confirmation token
  const confirmToken = crypto.randomUUID()
  const confirmTokenHash = await hashToken(confirmToken)
  const confirmExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Get client IP and user agent
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
  const userAgent = req.headers.get('user-agent')

  try {
    // Insert lead record
    const { data: lead, error: leadError } = await supabase
      .from('visibility_check_leads')
      .insert({
        email,
        confirm_token_hash: confirmTokenHash,
        confirm_expires_at: confirmExpiresAt.toISOString(),
        language,
        ip_address: clientIP,
        user_agent: userAgent,
        referrer_url,
        utm_source,
        utm_medium,
        utm_campaign,
        analysis_status: 'pending_opt_in'
      })
      .select()
      .single()

    if (leadError) {
      if (leadError.code === '23505') { // Unique constraint violation
        return new Response(
          JSON.stringify({ error: 'Email already registered for analysis' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw leadError
    }

    // Record consent
    await supabase
      .from('user_consent_tracking')
      .insert({
        lead_id: lead.id,
        email,
        consent_type: 'email_collection',
        consent_given: true,
        consent_method: 'form_submission',
        legal_basis: 'consent',
        ip_address: clientIP,
        user_agent: userAgent
      })

    // Send confirmation email (integrate with existing email system)
    const confirmUrl = `${Deno.env.get('FRONTEND_URL')}/vc/confirm?token=${confirmToken}`
    await sendConfirmationEmail(email, confirmUrl, language)

    return new Response(
      JSON.stringify({
        success: true,
        message: language === 'de' 
          ? 'Bestätigungs-E-Mail wurde gesendet. Bitte prüfen Sie Ihr Postfach.'
          : 'Confirmation email sent. Please check your inbox.',
        lead_id: lead.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email collection error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process email collection' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 2. Email Confirmation Handler
// ================================================================

async function handleEmailConfirmation(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { token }: TokenValidationRequest = await req.json()

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Confirmation token required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const tokenHash = await hashToken(token)

    // Find and validate token
    const { data: lead, error: leadError } = await supabase
      .from('visibility_check_leads')
      .select('*')
      .eq('confirm_token_hash', tokenHash)
      .eq('confirmed', false)
      .gt('confirm_expires_at', new Date().toISOString())
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired confirmation token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Confirm the lead
    const { error: updateError } = await supabase
      .from('visibility_check_leads')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        analysis_status: 'confirmed'
      })
      .eq('id', lead.id)

    if (updateError) throw updateError

    // Record confirmation consent
    await supabase
      .from('user_consent_tracking')
      .insert({
        lead_id: lead.id,
        email: lead.email,
        consent_type: 'data_analysis',
        consent_given: true,
        consent_method: 'double_opt_in',
        legal_basis: 'consent'
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email confirmed successfully',
        lead_id: lead.id,
        next_step: 'business_data_collection'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email confirmation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to confirm email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 3. Business Data Collection
// ================================================================

async function handleBusinessDataSubmission(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const businessData: BusinessDataRequest = await req.json()

  if (!businessData.token || !businessData.business_name) {
    return new Response(
      JSON.stringify({ error: 'Token and business name required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const tokenHash = await hashToken(businessData.token)

    // Validate lead and token
    const { data: lead, error: leadError } = await supabase
      .from('visibility_check_leads')
      .select('*')
      .eq('confirm_token_hash', tokenHash)
      .eq('confirmed', true)
      .single()

    if (leadError || !lead) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or lead not confirmed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate data completeness score
    const completenessScore = calculateDataCompleteness(businessData)
    const missingFields = identifyMissingFields(businessData)

    // Store business context data
    const { error: contextError } = await supabase
      .from('visibility_check_context_data')
      .upsert({
        lead_id: lead.id,
        business_name: businessData.business_name,
        business_description: businessData.business_description,
        street_address: businessData.location.street_address,
        city: businessData.location.city,
        state_province: businessData.location.state_province,
        postal_code: businessData.location.postal_code,
        country: businessData.location.country || 'DE',
        main_category: businessData.categories.main_category,
        sub_categories: businessData.categories.sub_categories,
        website_url: businessData.online_presence.website_url,
        instagram_url: businessData.online_presence.instagram_url,
        facebook_url: businessData.online_presence.facebook_url,
        gmb_url: businessData.online_presence.gmb_url,
        tripadvisor_url: businessData.online_presence.tripadvisor_url,
        yelp_url: businessData.online_presence.yelp_url,
        benchmark_urls: businessData.benchmark_urls,
        user_goal: businessData.user_goal,
        priority_areas: businessData.priority_areas,
        data_completeness_score: completenessScore,
        missing_fields: missingFields
      })

    if (contextError) throw contextError

    // Update lead status
    await supabase
      .from('visibility_check_leads')
      .update({ analysis_status: 'data_collection' })
      .eq('id', lead.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Business data saved successfully',
        completeness_score: completenessScore,
        missing_fields: missingFields,
        ready_for_analysis: completenessScore >= 60
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Business data submission error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to save business data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 4. AI Analysis Trigger
// ================================================================

async function handleAnalysisTrigger(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { token }: TokenValidationRequest = await req.json()

  try {
    const tokenHash = await hashToken(token)

    // Get lead and context data
    const { data: leadData, error: leadError } = await supabase
      .from('visibility_check_leads')
      .select(`
        *,
        visibility_check_context_data (*)
      `)
      .eq('confirm_token_hash', tokenHash)
      .eq('confirmed', true)
      .single()

    if (leadError || !leadData) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or lead not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to AI analysis
    await supabase
      .from('visibility_check_leads')
      .update({ analysis_status: 'ai_analysis' })
      .eq('id', leadData.id)

    // Trigger Bedrock AI analysis (integrate with existing Bedrock system)
    const analysisResult = await triggerBedrockAnalysis(leadData, supabase)

    if (analysisResult.success) {
      // Update status to completed
      await supabase
        .from('visibility_check_leads')
        .update({ analysis_status: 'completed' })
        .eq('id', leadData.id)

      // Create follow-up record for admin
      await supabase
        .from('visibility_check_followups')
        .insert({
          lead_id: leadData.id,
          status: 'new',
          lead_score: analysisResult.lead_score || 50
        })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Analysis completed successfully',
          result_id: analysisResult.result_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Update status to failed
      await supabase
        .from('visibility_check_leads')
        .update({ analysis_status: 'failed' })
        .eq('id', leadData.id)

      return new Response(
        JSON.stringify({ error: 'Analysis failed', details: analysisResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Analysis trigger error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to trigger analysis' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 5. Results Retrieval
// ================================================================

async function handleResultsRetrieval(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Token required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const tokenHash = await hashToken(token)

    // Get complete analysis results
    const { data: results, error: resultsError } = await supabase
      .from('visibility_check_leads')
      .select(`
        *,
        visibility_check_context_data (*),
        visibility_check_results (*)
      `)
      .eq('confirm_token_hash', tokenHash)
      .eq('analysis_status', 'completed')
      .single()

    if (resultsError || !results) {
      return new Response(
        JSON.stringify({ error: 'Results not found or analysis not completed' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format results for frontend consumption
    const formattedResults = {
      lead_info: {
        email: results.email,
        language: results.language,
        created_at: results.created_at
      },
      business_info: results.visibility_check_context_data[0],
      analysis_results: results.visibility_check_results[0],
      summary: {
        overall_score: results.visibility_check_results[0]?.summary_score,
        platform_scores: results.visibility_check_results[0]?.platform_scores,
        top_recommendations: results.visibility_check_results[0]?.quick_wins?.slice(0, 3)
      }
    }

    return new Response(
      JSON.stringify(formattedResults),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Results retrieval error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve results' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 6. Admin Dashboard
// ================================================================

async function handleAdminDashboard(req: Request, supabase: any) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  // Verify admin access (implement proper auth check)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const status = url.searchParams.get('status')
  const dateFrom = url.searchParams.get('date_from')
  const dateTo = url.searchParams.get('date_to')

  try {
    let query = supabase
      .from('visibility_check_leads')
      .select(`
        *,
        visibility_check_context_data (*),
        visibility_check_results (*),
        visibility_check_followups (*)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('analysis_status', status)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: leads, error: leadsError } = await query

    if (leadsError) throw leadsError

    // Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_vc_dashboard_stats')

    return new Response(
      JSON.stringify({
        leads,
        pagination: {
          page,
          limit,
          total: stats?.total_leads || 0
        },
        statistics: stats || {}
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to load dashboard data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 7. GDPR Anonymization
// ================================================================

async function handleLeadAnonymization(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { email } = await req.json()

  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email address required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Call the anonymization function
    const { data, error } = await supabase
      .rpc('anonymize_visibility_check_lead', { lead_email: email })

    if (error) throw error

    if (data) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Lead data anonymized successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Anonymization error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to anonymize lead data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// Utility Functions
// ================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function calculateDataCompleteness(data: BusinessDataRequest): number {
  const fields = [
    data.business_name,
    data.business_description,
    data.location.city,
    data.categories.main_category,
    data.online_presence.website_url,
    data.online_presence.instagram_url,
    data.online_presence.facebook_url,
    data.online_presence.gmb_url
  ]
  
  const filledFields = fields.filter(field => field && field.trim().length > 0).length
  return Math.round((filledFields / fields.length) * 100)
}

function identifyMissingFields(data: BusinessDataRequest): string[] {
  const missing: string[] = []
  
  if (!data.business_description) missing.push('business_description')
  if (!data.location.street_address) missing.push('street_address')
  if (!data.location.postal_code) missing.push('postal_code')
  if (!data.online_presence.website_url) missing.push('website_url')
  if (!data.online_presence.instagram_url) missing.push('instagram_url')
  if (!data.online_presence.gmb_url) missing.push('gmb_url')
  if (!data.benchmark_urls || data.benchmark_urls.length === 0) missing.push('benchmark_urls')
  
  return missing
}

async function sendConfirmationEmail(email: string, confirmUrl: string, language: string) {
  // Integrate with existing email system (Resend)
  const subject = language === 'de' 
    ? 'Bestätigen Sie Ihre E-Mail für die Sichtbarkeitsanalyse'
    : 'Confirm your email for visibility analysis'
    
  const body = language === 'de'
    ? `Klicken Sie hier, um Ihre E-Mail zu bestätigen: ${confirmUrl}`
    : `Click here to confirm your email: ${confirmUrl}`
    
  // Implementation would integrate with existing email service
  console.log(`Sending confirmation email to ${email}: ${confirmUrl}`)
}

async function triggerBedrockAnalysis(leadData: any, supabase: any) {
  try {
    // Log the AI action
    const { data: logEntry, error: logError } = await supabase
      .from('ai_action_logs')
      .insert({
        lead_id: leadData.id,
        request_type: 'visibility_check',
        provider: 'claude-3.5-sonnet',
        prompt_template_id: 'vc_comprehensive_analysis_v1'
      })
      .select()
      .single()

    if (logError) throw logError

    // Simulate AI analysis (integrate with actual Bedrock system)
    const mockAnalysisResult = {
      summary_score: 75,
      platform_scores: {
        google: 80,
        social: 70,
        website: 75
      },
      strengths: ['Strong Google presence', 'Active social media'],
      weaknesses: ['Limited website optimization', 'Missing reviews'],
      opportunities: ['Local SEO improvement', 'Content marketing'],
      threats: ['Strong local competition'],
      quick_wins: [
        {
          action: 'Optimize Google My Business profile',
          impact: 'high',
          effort: 'low',
          timeline: '1 week'
        }
      ]
    }

    // Store results
    const { data: result, error: resultError } = await supabase
      .from('visibility_check_results')
      .insert({
        lead_id: leadData.id,
        ...mockAnalysisResult,
        analysis_json: mockAnalysisResult,
        analysis_confidence: 0.85,
        data_quality_score: leadData.visibility_check_context_data[0]?.data_completeness_score || 70
      })
      .select()
      .single()

    if (resultError) throw resultError

    // Update AI log with success
    await supabase
      .from('ai_action_logs')
      .update({
        structured_response: mockAnalysisResult,
        token_usage_input: 1500,
        token_usage_output: 800,
        response_time_ms: 3500,
        cost_estimate_cents: 12,
        confidence_score: 0.85
      })
      .eq('id', logEntry.id)

    return {
      success: true,
      result_id: result.id,
      lead_score: 75
    }

  } catch (error) {
    console.error('Bedrock analysis error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}