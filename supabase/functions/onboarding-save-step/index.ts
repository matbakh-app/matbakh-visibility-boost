import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaveStepRequest {
  step: 'welcome' | 'restaurant' | 'brand' | 'menu' | 'channels' | 'quickwins' | 'baseline'
  data: any
  next?: string
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

    const body: SaveStepRequest = await req.json()
    const { step, data, next } = body

    // Get current progress
    const { data: currentProgress, error: fetchError } = await supabaseClient
      .from('onboarding_progress')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching progress:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch progress' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update steps data
    const currentSteps = currentProgress?.steps || {}
    const updatedSteps = {
      ...currentSteps,
      [step]: {
        ...data,
        completed_at: new Date().toISOString()
      }
    }

    // Determine next step
    const nextStep = next || getNextStep(step)

    // Update progress
    const { data: updatedProgress, error: updateError } = await supabaseClient
      .from('onboarding_progress')
      .upsert({
        owner_id: user.id,
        current_step: nextStep,
        steps: updatedSteps,
        completed: false
      }, {
        onConflict: 'owner_id'
      })
      .select()
      .single()

    if (updateError) {
      console.error('Error updating progress:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update progress' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Save step-specific data to appropriate tables
    await saveStepData(supabaseClient, user.id, step, data)

    return new Response(
      JSON.stringify({ 
        success: true, 
        current_step: nextStep,
        data: updatedProgress
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

function getNextStep(currentStep: string): string {
  const stepOrder = ['welcome', 'restaurant', 'brand', 'menu', 'channels', 'quickwins', 'baseline', 'done']
  const currentIndex = stepOrder.indexOf(currentStep)
  return stepOrder[currentIndex + 1] || 'done'
}

async function saveStepData(supabaseClient: any, userId: string, step: string, data: any) {
  try {
    switch (step) {
      case 'restaurant':
        if (data.name || data.street || data.city) {
          await supabaseClient
            .from('restaurant_profiles')
            .upsert({
              owner_id: userId,
              name: data.name,
              street: data.street,
              city: data.city,
              zip: data.zip,
              country: data.country || 'DE',
              phone: data.phone,
              email: data.email,
              opening_hours: data.opening_hours
            }, {
              onConflict: 'owner_id'
            })
        }
        break

      case 'brand':
        if (data.logo_url || data.colors || data.tone) {
          await supabaseClient
            .from('brand_assets')
            .upsert({
              owner_id: userId,
              logo_url: data.logo_url,
              colors: data.colors,
              tone: data.tone
            }, {
              onConflict: 'owner_id'
            })
        }
        break

      case 'menu':
        if (data.sources && Array.isArray(data.sources)) {
          // Delete existing menu sources
          await supabaseClient
            .from('menu_sources')
            .delete()
            .eq('owner_id', userId)

          // Insert new sources
          for (const source of data.sources) {
            await supabaseClient
              .from('menu_sources')
              .insert({
                owner_id: userId,
                kind: source.kind,
                url: source.url,
                meta: source.meta
              })
          }
        }
        break

      case 'channels':
        if (data.channels && Array.isArray(data.channels)) {
          for (const channel of data.channels) {
            await supabaseClient
              .from('connected_channels')
              .upsert({
                owner_id: userId,
                channel: channel.type,
                external_id: channel.external_id,
                meta: channel.meta
              }, {
                onConflict: 'owner_id,channel'
              })
          }
        }
        break
    }
  } catch (error) {
    console.error(`Error saving ${step} data:`, error)
  }
}