import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Mark onboarding as completed
    const { data: updatedProgress, error: updateError } = await supabaseClient
      .from('onboarding_progress')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        current_step: 'done'
      })
      .eq('owner_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error completing onboarding:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to complete onboarding' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Trigger initial visibility check if restaurant data exists
    const { data: restaurant } = await supabaseClient
      .from('restaurant_profiles')
      .select('name, city')
      .eq('owner_id', user.id)
      .single()

    let vcTriggered = false
    if (restaurant?.name && restaurant?.city) {
      try {
        // Trigger VC analysis in background
        const vcResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/vc-start`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business_name: restaurant.name,
            location: restaurant.city,
            source: 'onboarding_complete'
          })
        })
        
        if (vcResponse.ok) {
          vcTriggered = true
        }
      } catch (error) {
        console.error('Error triggering VC:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updatedProgress,
        vc_triggered: vcTriggered,
        message: 'Onboarding completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})