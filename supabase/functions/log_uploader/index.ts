import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Starting log upload process...");

    // 1) Secrets auslesen - verwende die spezifischen LOG_UPLOADER Credentials
    const accessKeyId = Deno.env.get("AWS_LOG_UPLOADER_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("AWS_LOG_UPLOADER_SECRET_ACCESS_KEY");
    const region = Deno.env.get("AWS_REGION") || "eu-central-1";

    if (!accessKeyId || !secretAccessKey) {
      console.error("AWS credentials not found");
      return new Response("AWS credentials not configured", { 
        status: 500,
        headers: corsHeaders 
      });
    }

    console.log("AWS credentials loaded successfully");

    // 2) AWS SDK initialisieren
    const s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // 3) Payload parsen
    const payload = await req.json();
    const { key, body, contentType = "text/plain" } = payload;

    if (!key || !body) {
      return new Response("Missing key or body in request", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.log(`Uploading log with key: ${key}`);

    // 4) Upload-Command mit Timestamp im Key für bessere Organisation
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const fullKey = `phase1/${timestamp}/${key}`;

    const cmd = new PutObjectCommand({
      Bucket: "matbakh-app-frontend-logs",
      Key: fullKey,
      Body: typeof body === 'string' ? body : JSON.stringify(body),
      ContentType: contentType,
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'source': 'frontend-log-uploader'
      }
    });

    await s3.send(cmd);
    
    console.log(`Successfully uploaded log to S3: ${fullKey}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      key: fullKey,
      message: "Log uploaded successfully" 
    }), { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error("Upload failed:", err);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { 
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});