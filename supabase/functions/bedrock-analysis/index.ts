import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { AwsClient } from "npm:aws4fetch@1.0.20";

type AnalysisRequest = {
  businessDescription?: string;
  address?: Record<string, string>;
  website?: string;
  mainCategories?: string[];
  language?: "de" | "en";
  userId?: string | null;
  leadId?: string;
  includeCompetitiveAnalysis?: boolean;
};

const REGION = Deno.env.get("AWS_BEDROCK_REGION") || "eu-central-1";
const MODEL_ID = Deno.env.get("AWS_BEDROCK_MODEL_ID") || "anthropic.claude-3-5-sonnet-20240620-v1:0";

const aws = new AwsClient({
  accessKeyId: Deno.env.get("AWS_BEDROCK_ACCESS_KEY_ID")!,
  secretAccessKey: Deno.env.get("AWS_BEDROCK_SECRET_ACCESS_KEY")!,
  region: REGION,
  service: "bedrock"
});

const ANALYSIS_PROMPT = `Du bist ein Digital Marketing Experte für lokale Unternehmen.
Analysiere das Geschäft und erstelle eine strukturierte Sichtbarkeitsanalyse.

Antworte nur in JSON Format mit folgender Struktur:
{
  "overallScore": 0-100,
  "categoryScores": {
    "gmb": 0-100,
    "website": 0-100,
    "social": 0-100,
    "seo": 0-100
  },
  "strengths": ["Stärke 1", "Stärke 2"],
  "weaknesses": ["Schwäche 1", "Schwäche 2"],
  "recommendations": [
    {
      "title": "Empfehlung",
      "description": "Detailbeschreibung",
      "priority": "high|medium|low",
      "effort": "low|medium|high",
      "impact": "low|medium|high"
    }
  ],
  "competitorInsights": [
    {
      "competitor": "Name",
      "advantage": "Was sie besser machen",
      "opportunity": "Was du besser machen kannst"
    }
  ],
  "nextActions": ["Aktion 1", "Aktion 2"],
  "riskFactors": ["Risiko 1", "Risiko 2"]
}

Berücksichtige:
- Google My Business Optimierung
- Website-Performance
- Social Media Präsenz
- Lokale SEO
- Wettbewerbsanalyse
- Branchenspezifische Faktoren`;

async function callBedrockAnalysis(input: AnalysisRequest) {
  console.log('🧠 Calling Bedrock Analysis for:', { 
    hasDescription: !!input.businessDescription,
    mainCategories: input.mainCategories,
    language: input.language 
  });

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    system: [{ type: "text", text: ANALYSIS_PROMPT }],
    max_tokens: 2000,
    temperature: 0.3,
    messages: [{
      role: "user",
      content: [{
        type: "text",
        text: JSON.stringify({
          language: input.language ?? "de",
          mainCategories: input.mainCategories ?? [],
          businessDescription: input.businessDescription ?? "",
          website: input.website ?? "",
          address: input.address ?? {},
          includeCompetitiveAnalysis: input.includeCompetitiveAnalysis ?? true
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
      console.error('❌ Bedrock Analysis API error:', res.status, err);
      throw new Error(`Bedrock error ${res.status}: ${err}`);
    }

    const json = await res.json();
    console.log('✅ Bedrock Analysis response received');
    
    const text = json.content?.[0]?.text || json.output_text || "";
    const usage = json.usage ?? {};

    let parsed;
    try { 
      parsed = JSON.parse(text); 
      console.log('✅ Bedrock Analysis JSON parsed successfully');
    } catch (parseError) { 
      console.error('❌ Analysis JSON parse error:', parseError);
      parsed = getFallbackAnalysis(); 
    }

    return { parsed, usage };
  } catch (error) {
    console.error('❌ Bedrock Analysis call failed:', error);
    throw error;
  }
}

function getFallbackAnalysis() {
  return {
    overallScore: 45,
    categoryScores: {
      gmb: 40,
      website: 50,
      social: 30,
      seo: 60
    },
    strengths: ["Grundlegende Online-Präsenz vorhanden"],
    weaknesses: ["Begrenzte Sichtbarkeit", "Fehlende Social Media Strategie"],
    recommendations: [
      {
        title: "Google My Business optimieren",
        description: "Vervollständigen Sie Ihr GMB-Profil mit aktuellen Informationen",
        priority: "high",
        effort: "low",
        impact: "high"
      }
    ],
    competitorInsights: [],
    nextActions: ["GMB-Profil vervollständigen", "Website-SEO verbessern"],
    riskFactors: ["Niedrige Online-Sichtbarkeit", "Verpasste Kundenakquisition"]
  };
}

async function saveAnalysisToDatabase(leadId: string, analysis: any, usage: any) {
  if (!leadId) return;

  try {
    // Save to visibility_check_leads or competitive_analysis table
    const url = new URL(Deno.env.get("SUPABASE_URL")! + "/rest/v1/competitive_analysis");
    await fetch(url.toString(), {
      method: "POST",
      headers: {
        "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lead_id: leadId,
        platform: "bedrock",
        competitor_name: "AI Analysis",
        our_score: analysis.overallScore,
        gap_analysis: {
          categoryScores: analysis.categoryScores,
          recommendations: analysis.recommendations,
          usage: usage
        }
      })
    });
  } catch (error) {
    console.warn('⚠️ Failed to save analysis to database:', error);
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log('🚀 Bedrock Analysis request started:', requestId);

  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors() });
    }

    const payload = (await req.json().catch(() => ({}))) as AnalysisRequest;
    console.log('📝 Analysis payload:', { 
      hasDescription: !!payload.businessDescription,
      mainCategories: payload.mainCategories,
      language: payload.language,
      leadId: payload.leadId 
    });

    let result, usage, fallbackUsed = false;
    
    try {
      const out = await callBedrockAnalysis(payload);
      result = out.parsed; 
      usage = out.usage;
      console.log('✅ Bedrock analysis successful');
    } catch (error) {
      console.log('🔄 Bedrock failed, using fallback analysis:', error.message);
      fallbackUsed = true;
      result = getFallbackAnalysis();
      usage = {};
    }

    // Save analysis to database if leadId provided
    if (payload.leadId && result) {
      await saveAnalysisToDatabase(payload.leadId, result, usage);
    }

    const response = {
      analysis: result,
      usage: {
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
        usd: 0 // TODO: Calculate actual cost
      },
      fallbackUsed,
      requestId,
      generatedAt: new Date().toISOString()
    };

    console.log('✅ Bedrock Analysis completed:', requestId, { 
      overallScore: result.overallScore,
      recommendationsCount: result.recommendations?.length || 0,
      fallbackUsed 
    });

    return json(response);
  } catch (error) {
    console.error('❌ Bedrock Analysis error:', requestId, error);
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