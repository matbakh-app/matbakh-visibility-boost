import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // 1) Load Bedrock secrets from environment
    const accessKeyId = Deno.env.get('AWS_BEDROCK_ACCESS_KEY_ID')
    const secretAccessKey = Deno.env.get('AWS_BEDROCK_SECRET_ACCESS_KEY')
    const region = Deno.env.get('AWS_BEDROCK_REGION') || 'eu-central-1'
    const modelId = Deno.env.get('AWS_BEDROCK_MODEL_ID') || 'anthropic.claude-3-5-sonnet-20241022-v2:0'

    if (!accessKeyId || !secretAccessKey) {
      console.error('Missing Bedrock credentials')
      return new Response(
        JSON.stringify({ error: 'Bedrock credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2) Parse request payload
    const { prompt, maxTokens = 512, systemPrompt = 'You are a helpful assistant.' } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 3) Prepare Bedrock API request
    const bedrockEndpoint = `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`
    
    // Create the request body for Claude models
    const requestBody = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      system: systemPrompt
    })

    // 4) Create AWS signature and headers
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
    const dateStamp = timestamp.substr(0, 8)
    
    // For demo purposes, we'll use a simplified approach
    // In production, you'd implement proper AWS4 signature
    const headers = {
      'Content-Type': 'application/json',
      'X-Amz-Target': 'DynamoDB_20120810.Query',
      'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${dateStamp}/${region}/bedrock/aws4_request, SignedHeaders=host;x-amz-date, Signature=placeholder`,
      'X-Amz-Date': timestamp
    }

    console.log(`Calling Bedrock model: ${modelId} in region: ${region}`)
    console.log(`Prompt length: ${prompt.length} characters`)

    // 5) Make request to Bedrock (simplified for demo)
    // Note: This is a simplified implementation
    // In production, you'd need proper AWS4 signing
    
    // For now, return a mock response to test the structure
    const mockResponse = {
      content: [
        {
          type: "text",
          text: `Mock response from Bedrock for prompt: "${prompt.substring(0, 50)}..."`
        }
      ],
      usage: {
        input_tokens: prompt.length / 4, // rough estimate
        output_tokens: 50
      }
    }

    console.log('Bedrock integration successful (mock mode)')

    return new Response(
      JSON.stringify({
        success: true,
        response: mockResponse,
        model: modelId,
        region: region
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in bedrock-integration function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})