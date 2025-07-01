
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

// Job processing functions with improved error handling
async function createBusinessProfile(payload: any, supabase: any) {
  console.log('Creating business profile:', payload);
  
  // Get partner's OAuth token
  const { data: token } = await supabase
    .from('google_oauth_tokens')
    .select('access_token')
    .eq('user_id', payload.partner_id)
    .single();

  if (!token) {
    throw new Error('No valid OAuth token found for partner');
  }

  // TODO: Implement Google My Business API call
  // Example structure:
  // const response = await fetch('https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${token.access_token}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(payload.businessData)
  // });

  return { success: true, message: 'Business profile creation queued' };
}

async function updateBusinessProfile(payload: any, supabase: any) {
  console.log('Updating business profile:', payload);
  
  // Similar implementation for updates
  return { success: true, message: 'Business profile update queued' };
}

async function publishPost(payload: any, supabase: any) {
  console.log('Publishing post:', payload);
  
  // Implementation for Google My Business Posts API
  return { success: true, message: 'Post publication queued' };
}
