
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const url = new URL(req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // GET request - Meta webhook verification
    if (req.method === 'GET') {
      console.log('Meta webhook verification request received')
      
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      
      console.log('Verification params:', { mode, token: token ? '[REDACTED]' : null, challenge })
      
      const META_VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN')
      
      if (!META_VERIFY_TOKEN) {
        console.error('META_VERIFY_TOKEN not configured')
        return new Response('Server configuration error', { status: 500 })
      }
      
      // Verify the token and mode
      if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
        console.log('Meta webhook verification successful')
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      } else {
        console.error('Meta webhook verification failed', { mode, tokenMatch: token === META_VERIFY_TOKEN })
        return new Response('Verification failed', { status: 403 })
      }
    }
    
    // POST request - Webhook events
    if (req.method === 'POST') {
      console.log('Meta webhook event received')
      
      const body = await req.text()
      console.log('Webhook payload:', body)
      
      try {
        const data = JSON.parse(body)
        
        // Process webhook events
        if (data.object === 'page') {
          for (const entry of data.entry || []) {
            const pageId = entry.id
            console.log('Processing page event for:', pageId)
            
            // Handle different types of events
            if (entry.changes) {
              for (const change of entry.changes) {
                console.log('Page change detected:', change.field, change.value)
                
                // Here you can process different change types:
                // - feed (new posts)
                // - ratings (new reviews)
                // - conversations (messages)
                // etc.
                
                // For now, just log the changes
                // Later you can implement specific handlers
              }
            }
          }
        }
        
        // Always return 200 OK to acknowledge receipt
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        })
        
      } catch (parseError) {
        console.error('Failed to parse webhook payload:', parseError)
        return new Response('Invalid JSON payload', { status: 400 })
      }
    }
    
    // Method not allowed
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders
    })
  }
})
