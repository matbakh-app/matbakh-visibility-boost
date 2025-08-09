import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { AwsClient } from "https://deno.land/x/aws4fetch@v1.0.1/mod.ts";

type VCRequest = {
  businessDescription?: string;
  address?: Record<string, string>;
  website?: string;
  mainCategories?: string[];
  language?: "de" | "en";
  userId?: string | null;
};

const REGION = Deno.env.get("AWS_BEDROCK_REGION") || "eu-central-1";
const MODEL_ID = Deno.env.get("AWS_BEDROCK_MODEL_ID") || "anthropic.claude-3-5-sonnet-20240620-v1:0";

const aws = new AwsClient({
  accessKeyId: Deno.env.get("AWS_BEDROCK_ACCESS_KEY_ID")!,
  secretAccessKey: Deno.env.get("AWS_BEDROCK_SECRET_ACCESS_KEY")!,
  region: REGION,
  service: "bedrock"
});

const SYSTEM_PROMPT = `Du bist ein Klassifizierer für Geschäfts-Kategorien.
- Nutze GMB-Unterkategorien (wir mappen intern) und erzeuge max. 20 Vorschläge.
- Liefere JSON mit Feldern: suggestions[{name, score}], tags[], reasoning.
- Score 0..1, wenige, präzise Tags. Antworte nur JSON.`;

async function callBedrock(input: VCRequest) {
  console.log('🧠 Calling Bedrock with input:', { 
    hasDescription: !!input.businessDescription,
    mainCategories: input.mainCategories,
    language: input.language 
  });

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    system: [{ type: "text", text: SYSTEM_PROMPT }],
    max_tokens: 800,
    temperature: 0.2,
    messages: [{
      role: "user",
      content: [{
        type: "text",
        text: JSON.stringify({
          language: input.language ?? "de",
          mainCategories: input.mainCategories ?? [],
          businessDescription: input.businessDescription ?? "",
          website: input.website ?? "",
          address: input.address ?? {}
        })
      }]
    }]
  };

  const url = `https://bedrock-runtime.${REGION}.amazonaws.com/model/${MODEL_ID}/invoke`;
  
  try {
    const res = await aws.fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error('❌ Bedrock API error:', res.status, err);
      throw new Error(`Bedrock error ${res.status}: ${err}`);
    }

    const json = await res.json();
    console.log('✅ Bedrock response received');
    
    // Anthropics@Bedrock response format
    const text = json.content?.[0]?.text || json.output_text || "";
    const usage = json.usage ?? {};

    let parsed;
    try { 
      parsed = JSON.parse(text); 
      console.log('✅ Bedrock JSON parsed successfully');
    } catch (parseError) { 
      console.error('❌ JSON parse error:', parseError);
      parsed = { suggestions: [], tags: [], reasoning: "Parse-Fehler" }; 
    }

    return { parsed, usage };
  } catch (error) {
    console.error('❌ Bedrock call failed:', error);
    throw error;
  }
}

async function fallbackFromGMB(mainCats: string[]) {
  console.log('🔄 Using GMB fallback for categories:', mainCats);
  
  try {
    const url = new URL(Deno.env.get("SUPABASE_URL")! + "/rest/v1/gmb_categories");
    url.searchParams.set("select", "id,name_de,name_en,main_category");
    if (mainCats?.length) {
      url.searchParams.set("main_category", `in.(${mainCats.map(s => `"${s}"`).join(",")})`);
    }
    url.searchParams.set("limit", "20");
    url.searchParams.set("order", "sort_order.asc,name_de.asc");

    const res = await fetch(url.toString(), {
      headers: {
        "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`
      }
    });

    if (!res.ok) {
      console.error('❌ GMB fallback failed:', res.status);
      return [];
    }

    const rows = await res.json();
    console.log('✅ GMB fallback returned', rows.length, 'categories');
    
    return rows.map((r: any) => ({
      id: `gmb:${r.id}`,
      name: r.name_de ?? r.name_en,
      score: 0.55,
      source: "gmb"
    }));
  } catch (error) {
    console.error('❌ GMB fallback error:', error);
    return [];
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log('🚀 Enhanced VC request started:', requestId);

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    const payload = (await req.json().catch(() => ({}))) as VCRequest;
    console.log('📝 Request payload:', { 
      hasDescription: !!payload.businessDescription,
      mainCategories: payload.mainCategories,
      language: payload.language,
      userId: payload.userId 
    });

    let result, usage, fallbackUsed = false;
    
    try {
      const out = await callBedrock(payload);
      result = out.parsed; 
      usage = out.usage;
      console.log('✅ Bedrock analysis successful');
    } catch (error) {
      console.log('🔄 Bedrock failed, using GMB fallback:', error.message);
      fallbackUsed = true;
      result = {
        suggestions: await fallbackFromGMB(payload.mainCategories ?? []),
        tags: [],
        reasoning: "Bedrock nicht erreichbar – Fallback GMB"
      };
      usage = {};
    }

    // Log request for analytics (optional)
    if (payload.userId) {
      try {
        const logUrl = new URL(Deno.env.get("SUPABASE_URL")! + "/rest/v1/category_search_logs");
        await fetch(logUrl.toString(), {
          method: "POST",
          headers: {
            "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: payload.userId,
            search_term: payload.businessDescription || "",
            selected_main_categories: payload.mainCategories || [],
            result_category_ids: result.suggestions?.map((s: any) => s.id) || []
          })
        });
      } catch (logError) {
        console.warn('⚠️ Logging failed:', logError);
      }
    }

    const response = {
      suggestions: result.suggestions || [],
      tags: result.tags || [],
      reasoning: result.reasoning || "",
      usage: {
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
        usd: 0 // TODO: Calculate actual cost
      },
      fallbackUsed,
      requestId
    };

    console.log('✅ Enhanced VC completed:', requestId, { 
      suggestionsCount: response.suggestions.length,
      fallbackUsed,
      hasReasoning: !!response.reasoning 
    });

    return json(response);
  } catch (error) {
    console.error('❌ Enhanced VC error:', requestId, error);
    return json({ error: String(error), requestId }, 500);
  }
});

function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type, x-client-info, apikey",
    "access-control-allow-methods": "POST, OPTIONS"
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...cors() }
  });
}