import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageName, accessToken, businessName } = await req.json()

    if (!pageName || !accessToken) {
      console.error('❌ Missing required parameters:', { pageName: !!pageName, accessToken: !!accessToken });
      return new Response(
        JSON.stringify({ 
          error: 'Missing pageName or accessToken',
          found: false,
          searched: pageName || 'unknown'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔍 Facebook Page Insight: Analyzing page "${pageName}" (Business: "${businessName || 'N/A'}")`);
    console.log(`🔑 Access Token provided: ${accessToken ? 'Yes (length: ' + accessToken.length + ')' : 'No'}`);

    // Try multiple approaches to find the page
    const searchQueries = [
      pageName,
      pageName.replace(/&/g, 'and'),
      pageName.replace(/[^a-zA-Z0-9\s]/g, ''),
      businessName || pageName
    ].filter(Boolean);

    let lastError = null;
    let foundData = null;

    for (const query of searchQueries) {
      try {
        console.log(`📊 Trying query: "${query}"`);
        
        // First try direct page lookup
        const directUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(query)}?fields=name,fan_count,category,link,about,description,location,verification_status,messenger_enabled,website&access_token=${accessToken}`;
        
        const res = await fetch(directUrl);
        console.log(`📡 Facebook API Response Status: ${res.status} for query: "${query}"`);
        
        if (res.ok) {
          const data = await res.json();
          console.log('✅ Facebook Page found:', { name: data.name, id: data.id, fan_count: data.fan_count });
          foundData = data;
          break;
        } else {
          const errorData = await res.json();
          console.log(`⚠️ Query "${query}" failed:`, { status: res.status, error: errorData });
          lastError = errorData;
        }
      } catch (queryError) {
        console.error(`💥 Error with query "${query}":`, queryError);
        lastError = { message: queryError.message };
      }
    }

    if (foundData) {
      return new Response(
        JSON.stringify({ 
          data: foundData,
          found: true,
          searched: pageName
        }), 
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If no direct match, try search API (if available)
    try {
      console.log(`🔎 Fallback: Trying Facebook Search API for: "${pageName}"`);
      const searchUrl = `https://graph.facebook.com/v19.0/pages/search?q=${encodeURIComponent(pageName)}&type=page&fields=name,fan_count,category,link&access_token=${accessToken}`;
      
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        console.log('📋 Search API results:', searchData);
        
        if (searchData.data && searchData.data.length > 0) {
          const bestMatch = searchData.data[0];
          console.log('✅ Found via search:', bestMatch.name);
          return new Response(
            JSON.stringify({ 
              data: bestMatch,
              found: true,
              searched: pageName,
              method: 'search'
            }), 
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      } else {
        const searchError = await searchRes.json();
        console.log('⚠️ Search API unavailable:', searchError);
      }
    } catch (searchError) {
      console.log('⚠️ Search fallback failed:', searchError);
    }

    // No page found - return structured response
    console.log('❌ No Facebook page found for:', pageName);
    return new Response(
      JSON.stringify({ 
        found: false,
        searched: pageName,
        error: lastError || { message: 'Page not found or not accessible' },
        suggestions: [
          'Verify the page name is correct',
          'Check if the page is public',
          'Ensure the access token has proper permissions (pages_show_list)',
          'Try using the exact Facebook page slug from the URL'
        ]
      }), 
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('💥 Facebook Page Insight Critical Error:', err);
    return new Response(
      JSON.stringify({ 
        error: err.message,
        found: false,
        searched: 'unknown'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})