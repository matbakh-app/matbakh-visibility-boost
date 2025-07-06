
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT = 100; // operations per execution
const MAX_RETRIES = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Google job worker...');

    // Fetch pending jobs
    const { data: jobs, error: fetchError } = await supabase
      .from('google_job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('run_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(RATE_LIMIT);

    if (fetchError) {
      console.error('Error fetching jobs:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${jobs?.length || 0} pending jobs`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    for (const job of jobs || []) {
      processed++;
      
      // Mark job as in progress
      const { error: updateError } = await supabase
        .from('google_job_queue')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (updateError) {
        console.error(`Failed to update job ${job.id} status:`, updateError);
        continue;
      }

      try {
        // Process the job based on job_type
        let jobResult;
        
        switch (job.job_type) {
          case 'create_business_profile':
            jobResult = await createBusinessProfile(job.payload, supabase);
            break;
          case 'update_business_profile':
            jobResult = await updateBusinessProfile(job.payload, supabase);
            break;
          case 'publish_post':
            jobResult = await publishPost(job.payload, supabase);
            break;
          default:
            throw new Error(`Unknown job type: ${job.job_type}`);
        }

        // Mark job as completed
        await supabase
          .from('google_job_queue')
          .update({ 
            status: 'done',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        succeeded++;
        console.log(`Successfully completed job ${job.id} (${job.job_type})`);

      } catch (error) {
        failed++;
        const retryCount = job.retry_count + 1;
        const shouldRetry = retryCount <= MAX_RETRIES;
        
        console.error(`Job ${job.id} failed (attempt ${retryCount}):`, error);

        if (shouldRetry) {
          // Exponential backoff: 5^retry seconds
          const delaySeconds = Math.pow(5, retryCount);
          const nextRunAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
          
          await supabase
            .from('google_job_queue')
            .update({
              status: 'pending',
              retry_count: retryCount,
              run_at: nextRunAt,
              error_message: error.message,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
            
          console.log(`Job ${job.id} scheduled for retry in ${delaySeconds} seconds`);
        } else {
          // Mark as permanently failed
          await supabase
            .from('google_job_queue')
            .update({
              status: 'error',
              retry_count: retryCount,
              error_message: error.message,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
            
          console.log(`Job ${job.id} permanently failed after ${MAX_RETRIES} retries`);
        }
      }
    }

    const result = {
      success: true,
      message: `Processed ${processed} jobs: ${succeeded} succeeded, ${failed} failed`,
      processed,
      succeeded,
      failed,
    };

    console.log(result.message);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Google job worker error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to get valid OAuth token
async function getValidToken(userId: string, supabase: any) {
  const { data: token, error } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !token) {
    throw new Error('No valid OAuth token found for user');
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(token.expires_at);
  
  if (now >= expiresAt) {
    // Token expired, attempt refresh
    if (!token.refresh_token) {
      throw new Error('Token expired and no refresh token available');
    }
    
    // Trigger token refresh
    await refreshToken(token.refresh_token, token.user_id, supabase);
    
    // Fetch refreshed token
    const { data: refreshedToken, error: refreshError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (refreshError || !refreshedToken) {
      throw new Error('Failed to refresh token');
    }
    
    return refreshedToken.access_token;
  }

  return token.access_token;
}

// Helper function to refresh token
async function refreshToken(refreshToken: string, userId: string, supabase: any) {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const refreshData = await response.json();

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${refreshData.error_description || refreshData.error}`);
  }

  // Update token in database
  const expiresAt = new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString();
  
  const { error: updateError } = await supabase
    .from('google_oauth_tokens')
    .update({
      access_token: refreshData.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    throw updateError;
  }

  console.log(`Successfully refreshed token for user ${userId}`);
}

// Helper function to get Google account ID
async function getGoogleAccountId(accessToken: string) {
  const response = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get account ID: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.accounts?.length) {
    throw new Error('No Google My Business accounts found');
  }

  // Return the first account ID (or implement logic to select specific account)
  return data.accounts[0].name; // Format: accounts/{accountId}
}

// Job processing functions with real Google API calls
async function createBusinessProfile(payload: any, supabase: any) {
  console.log('Creating business profile:', payload);
  
  const { partner_id, businessData } = payload;
  
  // Get partner's OAuth token
  const accessToken = await getValidToken(partner_id, supabase);
  
  // Get Google account ID
  const accountId = await getGoogleAccountId(accessToken);
  
  // Prepare location data for Google API
  const locationData = {
    locationName: businessData.business_name,
    primaryPhone: businessData.phone,
    websiteUri: businessData.website,
    address: {
      regionCode: 'DE', // Default to Germany
      postalCode: businessData.postal_code || '',
      administrativeArea: businessData.state || '',
      locality: businessData.city || '',
      addressLines: [businessData.address],
    },
    primaryCategory: {
      displayName: businessData.category || 'Restaurant',
      categoryId: businessData.category_id || 'gcid:restaurant',
    },
  };

  // Add opening hours if provided
  if (businessData.opening_hours) {
    locationData.regularHours = {
      periods: businessData.opening_hours,
    };
  }

  // Create location via Google API
  const response = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API error: ${error.error?.message || 'Failed to create location'}`);
  }

  const locationResult = await response.json();
  console.log('Location created successfully:', locationResult.name);

  // Update business profile with Google location ID
  const { error: updateError } = await supabase
    .from('business_profiles')
    .update({
      google_place_id: locationResult.name,
      google_connected: true,
      last_updated: new Date().toISOString(),
    })
    .eq('partner_id', partner_id);

  if (updateError) {
    console.error('Failed to update business profile:', updateError);
  }

  // Log successful operation
  await supabase.from('oauth_event_logs').insert({
    user_id: partner_id,
    provider: 'google',
    event_type: 'location_created',
    success: true,
    context: { location_id: locationResult.name },
  });

  return { 
    success: true, 
    message: 'Business profile created successfully',
    location_id: locationResult.name,
  };
}

async function updateBusinessProfile(payload: any, supabase: any) {
  console.log('Updating business profile:', payload);
  
  const { partner_id, location_id, updates } = payload;
  
  // Get partner's OAuth token
  const accessToken = await getValidToken(partner_id, supabase);
  
  // Prepare update data
  const updateData = {};
  const updateMask = [];

  // Handle different types of updates
  if (updates.opening_hours) {
    updateData.regularHours = {
      periods: updates.opening_hours,
    };
    updateMask.push('regularHours');
  }

  if (updates.phone) {
    updateData.primaryPhone = updates.phone;
    updateMask.push('primaryPhone');
  }

  if (updates.website) {
    updateData.websiteUri = updates.website;
    updateMask.push('websiteUri');
  }

  if (updates.business_name) {
    updateData.locationName = updates.business_name;
    updateMask.push('locationName');
  }

  if (updateMask.length === 0) {
    throw new Error('No valid updates provided');
  }

  // Update location via Google API
  const response = await fetch(`https://mybusinessbusinessinformation.googleapis.com/v1/${location_id}?updateMask=${updateMask.join(',')}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API error: ${error.error?.message || 'Failed to update location'}`);
  }

  const result = await response.json();
  console.log('Location updated successfully:', result.name);

  // Update local business profile
  const { error: updateError } = await supabase
    .from('business_profiles')
    .update({
      last_updated: new Date().toISOString(),
      ...updates, // Update local fields as well
    })
    .eq('partner_id', partner_id);

  if (updateError) {
    console.error('Failed to update local business profile:', updateError);
  }

  // Log successful operation
  await supabase.from('oauth_event_logs').insert({
    user_id: partner_id,
    provider: 'google',
    event_type: 'location_updated',
    success: true,
    context: { location_id, updates: updateMask },
  });

  return { 
    success: true, 
    message: 'Business profile updated successfully',
    updated_fields: updateMask,
  };
}

async function publishPost(payload: any, supabase: any) {
  console.log('Publishing post:', payload);
  
  const { partner_id, location_id, postData } = payload;
  
  // Get partner's OAuth token
  const accessToken = await getValidToken(partner_id, supabase);
  
  // Get account ID from location ID
  const accountId = location_id.split('/locations/')[0]; // Extract account from location path
  
  // Prepare post data for Google API
  const postPayload = {
    languageCode: postData.language || 'de',
    summary: postData.summary,
    callToAction: postData.call_to_action || null,
  };

  // Add media if provided
  if (postData.media && postData.media.length > 0) {
    postPayload.media = postData.media.map(media => ({
      mediaFormat: 'PHOTO',
      sourceUrl: media.url,
    }));
  }

  // Add event data if it's an event post
  if (postData.event) {
    postPayload.event = {
      title: postData.event.title,
      schedule: {
        startDate: postData.event.start_date,
        startTime: postData.event.start_time,
        endDate: postData.event.end_date,
        endTime: postData.event.end_time,
      },
    };
  }

  // Publish post via Google API
  const response = await fetch(`https://mybusiness.googleapis.com/v4/${accountId}/${location_id}/localPosts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postPayload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google API error: ${error.error?.message || 'Failed to publish post'}`);
  }

  const result = await response.json();
  console.log('Post published successfully:', result.name);

  // Log successful operation
  await supabase.from('oauth_event_logs').insert({
    user_id: partner_id,
    provider: 'google',
    event_type: 'post_published',
    success: true,
    context: { 
      location_id, 
      post_id: result.name,
      summary: postData.summary,
    },
  });

  return { 
    success: true, 
    message: 'Post published successfully',
    post_id: result.name,
  };
}
