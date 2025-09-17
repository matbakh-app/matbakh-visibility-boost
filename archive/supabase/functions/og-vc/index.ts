import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OGRequest {
  token?: string;
  business_name?: string;
  score?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    // Default values for fallback
    let businessName = 'Ihr Restaurant';
    let score = 0;
    
    // TODO: In production, validate token and fetch actual data
    // For now, we'll use fallback values or extract from token if available
    if (token) {
      // Simple token parsing - in production this would be a proper lookup
      try {
        // Token might contain encoded business info
        const decoded = atob(token);
        const data = JSON.parse(decoded);
        businessName = data.business_name || businessName;
        score = data.score || score;
      } catch {
        // Use fallback values if token parsing fails
      }
    }
    
    // Generate OG meta tags
    const ogTitle = `Wie sichtbar ist ${businessName}?`;
    const ogDescription = 'Ergebnis in 1 Minute: Sichtbarkeit, Chancen, nächste Schritte.';
    const ogImage = `${url.origin}/og/vc/${token || 'fallback'}.png`;
    
    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${req.url}">
  <meta property="og:title" content="${ogTitle}">
  <meta property="og:description" content="${ogDescription}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="matbakh.app">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${req.url}">
  <meta name="twitter:title" content="${ogTitle}">
  <meta name="twitter:description" content="${ogDescription}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- LinkedIn -->
  <meta property="linkedin:card" content="summary_large_image">
  
  <!-- Standard meta tags -->
  <meta name="description" content="${ogDescription}">
  <title>${ogTitle}</title>
  
  <!-- Redirect to main app after a short delay for human visitors -->
  <script>
    setTimeout(() => {
      if (window.location !== window.parent.location) {
        // We're in an iframe, don't redirect
        return;
      }
      window.location.href = '${url.origin}/vc/result?t=${token || ''}';
    }, 2000);
  </script>
</head>
<body style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div>
    <h1 style="font-size: 2rem; margin-bottom: 1rem;">${ogTitle}</h1>
    <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">${ogDescription}</p>
    <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px; backdrop-filter: blur(10px);">
      <p style="margin: 0; font-size: 0.9rem;">Wird weitergeleitet zu matbakh.app...</p>
    </div>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600', // Cache for 10 minutes
      },
    });

  } catch (error) {
    console.error('OG-VC Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
})