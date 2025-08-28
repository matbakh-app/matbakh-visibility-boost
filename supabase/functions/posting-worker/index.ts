import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const onRequestPost = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check feature flag
    if (Deno.env.get('FEATURE_VC_POSTING') !== 'true') {
      return new Response(
        JSON.stringify({ disabled: true, message: 'Posting hooks are disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get pending content items
    const { data: pendingItems, error: fetchError } = await supabase
      .from('content_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('Fetch pending items error:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processed = 0
    let errors = 0

    for (const item of pendingItems || []) {
      try {
        console.log(`[POSTING] Processing ${item.channel} content for business ${item.business_id}`)
        
        // TODO: Call actual channel APIs (GMB, Facebook, Instagram)
        // For now, just simulate posting
        const success = await simulatePosting(item.channel, item.payload)
        
        if (success) {
          // Mark as posted
          await supabase
            .from('content_queue')
            .update({ 
              status: 'posted', 
              posted_at: new Date().toISOString() 
            })
            .eq('id', item.id)
          
          processed++
          console.log(`[POSTING] Successfully posted ${item.id} to ${item.channel}`)
        } else {
          throw new Error('Posting simulation failed')
        }
        
      } catch (error: any) {
        // Mark as failed
        await supabase
          .from('content_queue')
          .update({ 
            status: 'failed', 
            error: error.message 
          })
          .eq('id', item.id)
        
        errors++
        console.error(`[POSTING] Failed to post ${item.id}:`, error.message)
      }
    }

    return new Response(
      JSON.stringify({ 
        processed, 
        errors,
        total: pendingItems?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Posting worker error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function simulatePosting(channel: string, payload: any): Promise<boolean> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate 90% success rate
  const success = Math.random() > 0.1
  
  console.log(`[POSTING] Simulated ${channel} posting:`, {
    success,
    payload: {
      type: payload.type,
      text: payload.text?.substring(0, 50) + '...',
      media_count: payload.media?.length || 0
    }
  })
  
  return success
}