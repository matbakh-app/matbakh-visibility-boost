import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ================================================================
// GDPR Compliance and Automated Cleanup System
// Handles data retention, anonymization, and cleanup
// ================================================================

interface CleanupRequest {
  action: 'cleanup_expired' | 'anonymize_lead' | 'delete_lead' | 'export_user_data'
  email?: string
  lead_id?: string
  dry_run?: boolean
}

interface CleanupResult {
  success: boolean
  action: string
  affected_records: number
  details: string[]
  errors?: string[]
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
    const action = url.pathname.split('/').pop()

    switch (action) {
      case 'cleanup-expired':
        return await handleExpiredDataCleanup(req, supabase)
      case 'anonymize-lead':
        return await handleLeadAnonymization(req, supabase)
      case 'delete-lead':
        return await handleLeadDeletion(req, supabase)
      case 'export-user-data':
        return await handleUserDataExport(req, supabase)
      case 'schedule-cleanup':
        return await handleScheduledCleanup(req, supabase)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('GDPR cleanup error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ================================================================
// 1. Expired Data Cleanup (Automated)
// ================================================================

async function handleExpiredDataCleanup(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { dry_run = false }: CleanupRequest = await req.json()

  try {
    const result: CleanupResult = {
      success: true,
      action: 'cleanup_expired',
      affected_records: 0,
      details: []
    }

    // 1. Clean up unconfirmed leads older than 30 days
    const unconfirmedQuery = supabase
      .from('visibility_check_leads')
      .select('id, email, created_at')
      .eq('confirmed', false)
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .is('deleted_at', null)

    const { data: unconfirmedLeads, error: unconfirmedError } = await unconfirmedQuery

    if (unconfirmedError) throw unconfirmedError

    if (unconfirmedLeads && unconfirmedLeads.length > 0) {
      result.details.push(`Found ${unconfirmedLeads.length} unconfirmed leads older than 30 days`)
      
      if (!dry_run) {
        const { error: deleteUnconfirmedError } = await supabase
          .from('visibility_check_leads')
          .update({
            deleted_at: new Date().toISOString(),
            email: unconfirmedLeads.map((lead: any) => `deleted_${lead.id}@privacy.local`)
          })
          .in('id', unconfirmedLeads.map((lead: any) => lead.id))

        if (deleteUnconfirmedError) throw deleteUnconfirmedError
        
        result.affected_records += unconfirmedLeads.length
        result.details.push(`Deleted ${unconfirmedLeads.length} unconfirmed leads`)
      }
    }

    // 2. Clean up standard retention leads older than 180 days
    const expiredQuery = supabase
      .from('visibility_check_leads')
      .select('id, email, created_at')
      .eq('retention_policy', 'standard')
      .lt('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .is('deleted_at', null)

    const { data: expiredLeads, error: expiredError } = await expiredQuery

    if (expiredError) throw expiredError

    if (expiredLeads && expiredLeads.length > 0) {
      result.details.push(`Found ${expiredLeads.length} leads with standard retention older than 180 days`)
      
      if (!dry_run) {
        // Anonymize instead of hard delete for audit trail
        for (const lead of expiredLeads) {
          await anonymizeLeadData(supabase, lead.id, 'automatic_retention_cleanup')
        }
        
        result.affected_records += expiredLeads.length
        result.details.push(`Anonymized ${expiredLeads.length} expired leads`)
      }
    }

    // 3. Clean up expired confirmation tokens
    const expiredTokensQuery = supabase
      .from('visibility_check_leads')
      .select('id')
      .eq('confirmed', false)
      .lt('confirm_expires_at', new Date().toISOString())
      .not('confirm_token_hash', 'like', 'expired_%')

    const { data: expiredTokens, error: expiredTokensError } = await expiredTokensQuery

    if (expiredTokensError) throw expiredTokensError

    if (expiredTokens && expiredTokens.length > 0) {
      result.details.push(`Found ${expiredTokens.length} expired confirmation tokens`)
      
      if (!dry_run) {
        const { error: updateTokensError } = await supabase
          .from('visibility_check_leads')
          .update({
            confirm_token_hash: `expired_${Date.now()}`
          })
          .in('id', expiredTokens.map((lead: any) => lead.id))

        if (updateTokensError) throw updateTokensError
        
        result.details.push(`Cleaned up ${expiredTokens.length} expired tokens`)
      }
    }

    // 4. Clean up old AI logs (keep for 1 year)
    const oldLogsQuery = supabase
      .from('ai_action_logs')
      .select('id')
      .lt('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .eq('contains_pii', false) // Only delete logs without PII

    const { data: oldLogs, error: oldLogsError } = await oldLogsQuery

    if (oldLogsError) throw oldLogsError

    if (oldLogs && oldLogs.length > 0) {
      result.details.push(`Found ${oldLogs.length} old AI logs (>1 year)`)
      
      if (!dry_run) {
        const { error: deleteLogsError } = await supabase
          .from('ai_action_logs')
          .delete()
          .in('id', oldLogs.map((log: any) => log.id))

        if (deleteLogsError) throw deleteLogsError
        
        result.details.push(`Deleted ${oldLogs.length} old AI logs`)
      }
    }

    if (dry_run) {
      result.details.push('DRY RUN: No actual changes were made')
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        action: 'cleanup_expired',
        affected_records: 0,
        details: [],
        errors: [error.message]
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 2. Lead Anonymization (GDPR Right to be Forgotten)
// ================================================================

async function handleLeadAnonymization(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { email, lead_id }: CleanupRequest = await req.json()

  if (!email && !lead_id) {
    return new Response(
      JSON.stringify({ error: 'Email or lead_id required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    let leadToAnonymize

    if (lead_id) {
      const { data, error } = await supabase
        .from('visibility_check_leads')
        .select('*')
        .eq('id', lead_id)
        .is('deleted_at', null)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      leadToAnonymize = data
    } else {
      const { data, error } = await supabase
        .from('visibility_check_leads')
        .select('*')
        .eq('email', email)
        .is('deleted_at', null)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Lead not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      leadToAnonymize = data
    }

    // Perform anonymization
    const anonymizationResult = await anonymizeLeadData(supabase, leadToAnonymize.id, 'user_request')

    return new Response(
      JSON.stringify({
        success: true,
        action: 'anonymize_lead',
        affected_records: 1,
        details: [`Lead ${leadToAnonymize.email} anonymized successfully`],
        anonymization_id: anonymizationResult.anonymization_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Anonymization error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        action: 'anonymize_lead',
        affected_records: 0,
        details: [],
        errors: [error.message]
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 3. User Data Export (GDPR Right to Data Portability)
// ================================================================

async function handleUserDataExport(req: Request, supabase: any) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { email }: CleanupRequest = await req.json()

  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get all data for the user
    const { data: leads, error: leadsError } = await supabase
      .from('visibility_check_leads')
      .select(`
        *,
        visibility_check_context_data (*),
        visibility_check_results (*),
        visibility_check_followups (*),
        user_consent_tracking (*)
      `)
      .eq('email', email)
      .is('deleted_at', null)

    if (leadsError) throw leadsError

    if (!leads || leads.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No data found for this email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get AI action logs (anonymized)
    const { data: aiLogs, error: aiLogsError } = await supabase
      .from('ai_action_logs')
      .select('request_type, created_at, token_usage_input, token_usage_output, confidence_score')
      .in('lead_id', leads.map((lead: any) => lead.id))

    if (aiLogsError) throw aiLogsError

    // Compile user data export
    const exportData = {
      export_date: new Date().toISOString(),
      email: email,
      leads: leads.map((lead: any) => ({
        id: lead.id,
        email: lead.email,
        confirmed: lead.confirmed,
        analysis_status: lead.analysis_status,
        language: lead.language,
        created_at: lead.created_at,
        confirmed_at: lead.confirmed_at,
        utm_data: {
          source: lead.utm_source,
          medium: lead.utm_medium,
          campaign: lead.utm_campaign
        },
        business_data: lead.visibility_check_context_data?.[0] || null,
        analysis_results: lead.visibility_check_results?.[0] || null,
        followup_data: lead.visibility_check_followups?.[0] || null,
        consent_history: lead.user_consent_tracking || []
      })),
      ai_interactions: aiLogs || [],
      data_processing_summary: {
        total_leads: leads.length,
        confirmed_leads: leads.filter((lead: any) => lead.confirmed).length,
        completed_analyses: leads.filter((lead: any) => lead.analysis_status === 'completed').length,
        ai_interactions_count: aiLogs?.length || 0
      }
    }

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="user-data-export-${email}-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    )

  } catch (error) {
    console.error('Data export error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to export user data', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// 4. Scheduled Cleanup (Cron Job Handler)
// ================================================================

async function handleScheduledCleanup(req: Request, supabase: any) {
  // This would be called by a cron job or scheduled task
  console.log('Running scheduled GDPR cleanup...')

  try {
    // Run automated cleanup
    const cleanupResult = await handleExpiredDataCleanup(
      new Request(req.url, { method: 'POST', body: JSON.stringify({ dry_run: false }) }),
      supabase
    )

    // Log the results
    const result = await cleanupResult.json()
    console.log('Scheduled cleanup completed:', result)

    // Send notification to admins if significant cleanup occurred
    if (result.affected_records > 0) {
      await sendCleanupNotification(supabase, result)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Scheduled cleanup completed', result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Scheduled cleanup error:', error)
    return new Response(
      JSON.stringify({ error: 'Scheduled cleanup failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// ================================================================
// Utility Functions
// ================================================================

async function anonymizeLeadData(supabase: any, leadId: string, reason: string) {
  const anonymizationId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Get original lead data for audit
  const { data: originalLead, error: getError } = await supabase
    .from('visibility_check_leads')
    .select('email')
    .eq('id', leadId)
    .single()

  if (getError) throw getError

  // 1. Anonymize lead record
  const { error: leadError } = await supabase
    .from('visibility_check_leads')
    .update({
      email: `${anonymizationId}@anonymized.local`,
      ip_address: null,
      user_agent: 'anonymized',
      referrer_url: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      deleted_at: new Date().toISOString()
    })
    .eq('id', leadId)

  if (leadError) throw leadError

  // 2. Anonymize context data
  const { error: contextError } = await supabase
    .from('visibility_check_context_data')
    .update({
      business_name: 'Anonymized Business',
      business_description: null,
      street_address: null,
      website_url: null,
      instagram_url: null,
      facebook_url: null,
      gmb_url: null,
      tripadvisor_url: null,
      yelp_url: null
    })
    .eq('lead_id', leadId)

  if (contextError) throw contextError

  // 3. Mark AI logs as anonymized
  const { error: aiLogsError } = await supabase
    .from('ai_action_logs')
    .update({
      ip_address: null,
      user_agent: 'anonymized',
      prompt_variables: { anonymized: true, reason: reason }
    })
    .eq('lead_id', leadId)

  if (aiLogsError) throw aiLogsError

  // 4. Update consent tracking
  const { error: consentError } = await supabase
    .from('user_consent_tracking')
    .update({
      email: `${anonymizationId}@anonymized.local`,
      ip_address: null,
      user_agent: 'anonymized'
    })
    .eq('lead_id', leadId)

  if (consentError) throw consentError

  // 5. Log the anonymization action
  const { error: logError } = await supabase
    .from('ai_action_logs')
    .insert({
      lead_id: leadId,
      request_type: 'data_anonymization',
      provider: 'system',
      structured_response: {
        action: 'anonymize_lead',
        reason: reason,
        original_email: originalLead.email,
        anonymization_id: anonymizationId,
        timestamp: new Date().toISOString()
      }
    })

  if (logError) throw logError

  return { anonymization_id }
}

async function sendCleanupNotification(supabase: any, cleanupResult: any) {
  // This would integrate with your notification system
  console.log('Cleanup notification:', {
    affected_records: cleanupResult.affected_records,
    details: cleanupResult.details,
    timestamp: new Date().toISOString()
  })

  // You could send an email, Slack message, or other notification here
}