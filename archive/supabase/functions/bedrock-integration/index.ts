import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { BedrockRuntimeClient, InvokeModelCommand } from "https://esm.sh/@aws-sdk/client-bedrock-runtime@3.490.0"

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
    const { prompt, maxTokens = 4096, systemPrompt = 'You are a helpful assistant.' } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 3) Initialize Bedrock Runtime Client
    const bedrockClient = new BedrockRuntimeClient({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    })

    // 4) Prepare request body for Claude models
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

    console.log(`Calling Bedrock model: ${modelId} in region: ${region}`)
    console.log(`Prompt length: ${prompt.length} characters`)
    console.log(`Request body: ${requestBody.substring(0, 200)}...`)

    // 5) Create and send InvokeModel command
    const command = new InvokeModelCommand({
      modelId: modelId,
      body: new TextEncoder().encode(requestBody),
      contentType: "application/json",
      accept: "application/json",
    })

    const response = await bedrockClient.send(command)
    
    // 6) Parse response
    const responseBody = new TextDecoder().decode(response.body)
    const parsedResponse = JSON.parse(responseBody)

    console.log('Bedrock response received successfully')
    console.log(`Output tokens: ${parsedResponse.usage?.output_tokens || 'unknown'}`)

    return new Response(
      JSON.stringify({
        success: true,
        response: parsedResponse,
        model: modelId,
        region: region,
        metadata: {
          input_tokens: parsedResponse.usage?.input_tokens,
          output_tokens: parsedResponse.usage?.output_tokens,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in bedrock-integration function:', error)
    
    // Enhanced error logging
    if (error.name === 'ValidationException') {
      console.error('Validation error - check model ID and request format')
    } else if (error.name === 'AccessDeniedException') {
      console.error('Access denied - check AWS credentials and permissions')
    } else if (error.name === 'ThrottlingException') {
      console.error('Request throttled - consider implementing retry logic')
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Bedrock request failed',
        details: error.message,
        type: error.name || 'Unknown'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})