
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE = 100; // ops per minute

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Starting Google job worker...");

    const { data: jobs, error } = await supabase
      .from("google_job_queue")
      .select("*")
      .eq("status", "pending")
      .lte("run_at", new Date().toISOString())
      .limit(RATE);

    if (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }

    console.log(`Processing ${jobs?.length || 0} jobs`);

    for (const job of jobs || []) {
      const startTime = Date.now();
      
      // Mark job as in progress
      await supabase
        .from("google_job_queue")
        .update({ status: "in_progress" })
        .eq("id", job.id);

      try {
        // Process different job types
        switch (job.job_type) {
          case "create_location":
            await processCreateLocation(job);
            break;
          case "update_location":
            await processUpdateLocation(job);
            break;
          case "upload_photos":
            await processUploadPhotos(job);
            break;
          default:
            throw new Error(`Unknown job type: ${job.job_type}`);
        }

        // Mark job as completed
        await supabase
          .from("google_job_queue")
          .update({ 
            status: "done",
            error_message: null,
          })
          .eq("id", job.id);

        console.log(`Job ${job.id} completed in ${Date.now() - startTime}ms`);
      } catch (err) {
        const retry = job.retry_count + 1;
        const next = new Date(Date.now() + Math.pow(5, retry) * 1000); // expo backoff

        await supabase
          .from("google_job_queue")
          .update({
            status: retry > 5 ? "error" : "pending",
            retry_count: retry,
            run_at: next.toISOString(),
            error_message: String(err),
          })
          .eq("id", job.id);

        console.error(`Job ${job.id} failed (attempt ${retry}):`, err);
      }
    }

    return new Response("Jobs processed", {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Job worker error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processCreateLocation(job: any) {
  console.log(`Processing create location job for partner ${job.partner_id}`);
  // TODO: Implement Google Business Information API call
  // This is a placeholder for the actual Google API integration
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
}

async function processUpdateLocation(job: any) {
  console.log(`Processing update location job for partner ${job.partner_id}`);
  // TODO: Implement Google Business Information API call
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
}

async function processUploadPhotos(job: any) {
  console.log(`Processing upload photos job for partner ${job.partner_id}`);
  // TODO: Implement Google Business Information API call
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
}
