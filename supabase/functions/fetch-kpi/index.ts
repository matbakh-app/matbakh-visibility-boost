
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();
    
    console.log(`🔄 Fetching KPI data for: ${name}`);
    
    // Mock KPI data for development - replace with real Google API calls
    const mockKpiData: Record<string, any> = {
      impressions: { value: 1234, trend: '+15%' },
      ctr: { value: '4.2%', trend: '-0.3%' },
      profileViews: { value: 567, trend: '+8%' },
      calls: { value: 23, trend: '+12%' },
      websiteClicks: { value: 89, trend: '+5%' },
      directionsRequests: { value: 45, trend: '+18%' },
      photoViews: { value: 890, trend: '+22%' },
      postViews: { value: 156, trend: '+9%' },
      sessions: { value: 2340, trend: '+7%' },
      bounceRate: { value: '58%', trend: '-3%' },
      avgSessionDuration: { value: '2:34', trend: '+12%' },
      pageViews: { value: 4567, trend: '+6%' },
      conversions: { value: 34, trend: '+25%' },
      conversionRate: { value: '1.45%', trend: '+18%' },
      newUsers: { value: 1890, trend: '+14%' },
      returningUsers: { value: 450, trend: '+3%' }
    };
    
    const kpiData = mockKpiData[name] || { value: 'N/A', trend: '0%' };
    
    return new Response(JSON.stringify(kpiData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch KPI data' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
