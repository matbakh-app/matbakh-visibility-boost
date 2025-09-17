import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface CleanupStats {
  expiredCodes: number
  fullyUsedCodes: number
  inactiveCodes: number
  totalCleaned: number
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stats: CleanupStats = {
      expiredCodes: 0,
      fullyUsedCodes: 0,
      inactiveCodes: 0,
      totalCleaned: 0
    }

    console.log('Starting cleanup of expired redeem codes...')

    // 1. Clean up expired codes (with 7-day grace period)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { data: expiredCodes, error: expiredError } = await supabase
      .from('redeem_codes')
      .delete()
      .lt('expires_at', sevenDaysAgo.toISOString())
      .select('id')

    if (expiredError) {
      console.error('Error cleaning expired codes:', expiredError)
    } else {
      stats.expiredCodes = expiredCodes?.length || 0
      console.log(`Cleaned ${stats.expiredCodes} expired codes`)
    }

    // 2. Clean up fully used codes (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const { data: fullyUsedCodes, error: fullyUsedError } = await supabase
      .from('redeem_codes')
      .delete()
      .eq('uses', 'max_uses')
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id')

    if (fullyUsedError) {
      console.error('Error cleaning fully used codes:', fullyUsedError)
    } else {
      stats.fullyUsedCodes = fullyUsedCodes?.length || 0
      console.log(`Cleaned ${stats.fullyUsedCodes} fully used codes`)
    }

    // 3. Clean up inactive codes (older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const { data: inactiveCodes, error: inactiveError } = await supabase
      .from('redeem_codes')
      .delete()
      .eq('is_active', false)
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id')

    if (inactiveError) {
      console.error('Error cleaning inactive codes:', inactiveError)
    } else {
      stats.inactiveCodes = inactiveCodes?.length || 0
      console.log(`Cleaned ${stats.inactiveCodes} inactive codes`)
    }

    stats.totalCleaned = stats.expiredCodes + stats.fullyUsedCodes + stats.inactiveCodes

    // 4. Log cleanup statistics for monitoring
    console.log('Cleanup completed:', {
      timestamp: new Date().toISOString(),
      stats
    })

    // 5. Optional: Send alert if unusual cleanup volume
    if (stats.totalCleaned > 1000) {
      console.warn(`⚠️ High cleanup volume: ${stats.totalCleaned} codes cleaned`)
      // Here you could send a Slack/email alert
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cleanup completed successfully',
        stats,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Cleanup error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Cleanup failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})