
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
      
      console.log('Comparing tokens:', { received: token, expected: META_VERIFY_TOKEN })
      
      // Verify the token and mode
      if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
        console.log('Meta webhook verification successful')
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      } else {
        console.error('Meta webhook verification failed', { 
          mode, 
          tokenMatch: token === META_VERIFY_TOKEN,
          receivedToken: token,
          expectedToken: META_VERIFY_TOKEN 
        })
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
                
                // Handle specific event types:
                switch (change.field) {
                  case 'feed':
                    console.log('New post or comment detected')
                    // Handle feed changes (posts, comments, reactions)
                    break
                  case 'ratings':
                    console.log('New rating/review detected')
                    // Handle rating changes
                    break
                  case 'conversations':
                    console.log('New message detected')
                    // Handle conversation changes
                    break
                  case 'mention':
                    console.log('New mention detected')
                    // Handle mentions
                    break
                  case 'leadgen':
                    console.log('New lead ad detected')
                    // Handle lead generation
                    break
                  default:
                    console.log('Unhandled change type:', change.field)
                }
              }
            }
            
            // Handle Instagram events
            if (entry.messaging) {
              console.log('Instagram messaging event detected')
              // Handle Instagram messages, comments, mentions
            }
          }
        }
        
        // Handle Instagram Business Account events
        if (data.object === 'instagram') {
          for (const entry of data.entry || []) {
            console.log('Processing Instagram event for:', entry.id)
            
            if (entry.changes) {
              for (const change of entry.changes) {
                console.log('Instagram change detected:', change.field, change.value)
                
                switch (change.field) {
                  case 'comments':
                    console.log('New Instagram comment detected')
                    break
                  case 'mentions':
                    console.log('New Instagram mention detected')
                    break
                  case 'story_insights':
                    console.log('New Instagram story insights detected')
                    break
                  case 'messages':
                    console.log('New Instagram message detected')
                    break
                  case 'insights':
                    console.log('New Instagram insights detected')
                    break
                  default:
                    console.log('Unhandled Instagram change type:', change.field)
                }
              }
            }
          }
        }
        
        // Handle Ad Account events
        if (data.object === 'adaccount') {
          for (const entry of data.entry || []) {
            console.log('Processing Ad Account event for:', entry.id)
            
            if (entry.changes) {
              for (const change of entry.changes) {
                console.log('Ad Account change detected:', change.field, change.value)
                
                switch (change.field) {
                  case 'ad_account':
                    console.log('Ad account status change detected')
                    break
                  case 'ads':
                    console.log('Ad change detected')
                    break
                  case 'campaigns':
                    console.log('Campaign change detected')
                    break
                  default:
                    console.log('Unhandled Ad Account change type:', change.field)
                }
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
