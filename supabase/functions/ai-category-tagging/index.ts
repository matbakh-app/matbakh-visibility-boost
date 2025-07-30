import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BedrockRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
}

interface BedrockResponse {
  content: Array<{
    text: string;
  }>;
}

interface CategoryToTag {
  id: string;
  name_de: string;
  name_en: string;
  description_de?: string;
  keywords: string[];
  haupt_kategorie: string;
}

interface TagSuggestion {
  category_id: string;
  target_main_category: string;
  confidence_score: number;
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Starting AI Category Tagging Job');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const awsAccessKeyId = Deno.env.get('AWS_BEDROCK_ACCESS_KEY_ID');
  const awsSecretAccessKey = Deno.env.get('AWS_BEDROCK_SECRET_ACCESS_KEY');
  const awsRegion = Deno.env.get('AWS_BEDROCK_REGION');
  const modelId = Deno.env.get('AWS_BEDROCK_MODEL_ID');

  if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !modelId) {
    console.error('❌ Missing AWS Bedrock credentials');
    return new Response('Missing AWS credentials', { 
      status: 500, 
      headers: corsHeaders 
    });
  }

  let jobId: string | null = null;
  
  try {
    // 1. Create new tagging job
    const { data: jobData, error: jobError } = await supabase
      .from('auto_tagging_jobs')
      .insert({
        status: 'running',
        total_categories_processed: 0,
        total_tags_created: 0
      })
      .select('id')
      .single();

    if (jobError) throw jobError;
    jobId = jobData.id;
    console.log('📋 Created job:', jobId);

    // 2. Load categories that need tagging
    const { data: categories, error: categoriesError } = await supabase
      .from('gmb_categories')
      .select(`
        id,
        name_de,
        name_en,
        description_de,
        keywords,
        haupt_kategorie
      `)
      .limit(50); // Process in batches

    if (categoriesError) throw categoriesError;
    console.log(`📊 Loaded ${categories.length} categories for tagging`);

    // 3. Filter categories that need cross-tags (exclude already well-tagged ones)
    const categoriesToTag: CategoryToTag[] = categories.filter(cat => 
      cat.haupt_kategorie && 
      cat.name_de && 
      cat.name_de.length > 2
    );

    console.log(`🎯 Processing ${categoriesToTag.length} categories`);

    // 4. Process categories in smaller batches
    const batchSize = 10;
    let totalProcessed = 0;
    let totalTagsCreated = 0;

    for (let i = 0; i < categoriesToTag.length; i += batchSize) {
      const batch = categoriesToTag.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(categoriesToTag.length/batchSize)}`);

      try {
        const tagSuggestions = await processWithBedrock(
          batch, 
          awsAccessKeyId, 
          awsSecretAccessKey, 
          awsRegion, 
          modelId
        );

        // 5. Save valid tag suggestions to database
        for (const suggestion of tagSuggestions) {
          if (suggestion.confidence_score >= 0.7) { // Only high-confidence suggestions
            const { error: tagError } = await supabase
              .from('category_cross_tags')
              .insert({
                category_id: suggestion.category_id,
                target_main_category: suggestion.target_main_category,
                confidence_score: suggestion.confidence_score,
                source: 'ai'
              });

            if (!tagError) {
              totalTagsCreated++;
              
              // Log the tagging event
              await supabase
                .from('category_tag_events')
                .insert({
                  category_cross_tag_id: null, // Will be updated after we get the ID
                  change_type: 'create',
                  new_confidence: suggestion.confidence_score,
                  new_source: 'ai',
                  comment: `AI suggested: ${suggestion.reasoning}`
                });
            } else {
              console.warn('⚠️ Failed to insert tag:', tagError);
            }
          }
        }

        totalProcessed += batch.length;

        // Update job progress
        await supabase
          .from('auto_tagging_jobs')
          .update({
            total_categories_processed: totalProcessed,
            total_tags_created: totalTagsCreated
          })
          .eq('id', jobId);

      } catch (batchError) {
        console.error('❌ Batch processing error:', batchError);
        // Continue with next batch
      }

      // Add small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 6. Complete the job
    await supabase
      .from('auto_tagging_jobs')
      .update({
        status: 'completed',
        run_finished_at: new Date().toISOString(),
        total_categories_processed: totalProcessed,
        total_tags_created: totalTagsCreated
      })
      .eq('id', jobId);

    console.log(`✅ Job completed: ${totalProcessed} processed, ${totalTagsCreated} tags created`);

    return new Response(JSON.stringify({
      success: true,
      job_id: jobId,
      categories_processed: totalProcessed,
      tags_created: totalTagsCreated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Job failed:', error);
    
    // Mark job as failed
    if (jobId) {
      await supabase
        .from('auto_tagging_jobs')
        .update({
          status: 'failed',
          run_finished_at: new Date().toISOString(),
          error_message: error.message
        })
        .eq('id', jobId);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      job_id: jobId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processWithBedrock(
  categories: CategoryToTag[],
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  modelId: string
): Promise<TagSuggestion[]> {
  
  // Create specialized prompt for German gastronomy categories
  const prompt = createGastronomyPrompt(categories);
  
  const requestBody: BedrockRequest = {
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 2000,
    temperature: 0.3
  };

  // AWS Signature V4 signing (simplified)
  const bedrockUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${modelId}/invoke`;
  
  const response = await fetch(bedrockUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': await createAwsSignature(
        requestBody, 
        accessKeyId, 
        secretAccessKey, 
        region
      )
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Bedrock API error:', errorText);
    throw new Error(`Bedrock API error: ${response.status}`);
  }

  const bedrockResponse: BedrockResponse = await response.json();
  const aiResponse = bedrockResponse.content[0]?.text || '';
  
  console.log('🤖 AI Response:', aiResponse);
  
  // Parse AI response to extract tag suggestions
  return parseTagSuggestions(aiResponse, categories);
}

function createDiversifiedCategoryPrompt(
  categories: CategoryToTag[], 
  userContext?: { businessName?: string; businessDescription?: string; lastSuggestions?: string[] }
): string {
  const mainCategories = [
    'Essen & Trinken',
    'Kunst, Unterhaltung & Freizeit', 
    'Einzelhandel & Verbraucherdienstleistungen',
    'Gesundheit & Medizinische Dienstleistungen',
    'Automobil & Transport',
    'Mode & Lifestyle',
    'Sport',
    'Immobilien & Bauwesen',
    'Professionelle Dienstleistungen',
    'Bildung & Ausbildung',
    'Sonstige',
    'Gastgewerbe und Tourismus',
    'Finanzdienstleistungen',
    'Behörden & Öffentliche Dienste',
    'Religiöse Stätten'
  ];

  // Diversifikations-Logik: Shuffle categories und priorisiere weniger häufige
  const shuffledCategories = [...categories]
    .sort(() => Math.random() - 0.5) // Randomize order
    .filter(cat => {
      // Filter out recently suggested categories if provided
      if (userContext?.lastSuggestions?.length) {
        return !userContext.lastSuggestions.includes(cat.name_de);
      }
      return true;
    })
    .slice(0, Math.min(categories.length, 15)); // Limit to 15 for diversity

  const categoriesText = shuffledCategories.map(cat => 
    `ID: ${cat.id}
Name: ${cat.name_de}
Aktuelle Hauptkategorie: ${cat.haupt_kategorie}
Beschreibung: ${cat.description_de || 'Keine'}
Keywords: ${cat.keywords?.join(', ') || 'Keine'}`
  ).join('\n\n');

  const contextualHint = userContext?.businessDescription 
    ? `\nKONTEXT: Das Unternehmen "${userContext.businessName || 'Unbekannt'}" beschreibt sich als: "${userContext.businessDescription}"`
    : '';

  const diversityHint = userContext?.lastSuggestions?.length 
    ? `\nDIVERSITÄT: Vermeide diese kürzlich vorgeschlagenen Kategorien: ${userContext.lastSuggestions.join(', ')}`
    : '\nDIVERSITÄT: Priorisiere kreative, weniger offensichtliche aber relevante Kategorievorschläge.';

  return `Du bist ein Experte für deutsche Gastronomie und Google My Business Kategorisierung mit Fokus auf DIVERSITÄT und KREATIVITÄT.

AUFGABE: Analysiere die folgenden Kategorien und wähle VIELFÄLTIGE, interessante Vorschläge aus allen 4000+ verfügbaren Unterkategorien. Vermeide monotone Wiederholungen!
${contextualHint}
${diversityHint}

VERFÜGBARE HAUPTKATEGORIEN:
${mainCategories.map(cat => `- ${cat}`).join('\n')}

KATEGORIEN ZU ANALYSIEREN:
${categoriesText}

REGELN FÜR DIVERSITÄT:
1. Wähle aus der GESAMTEN Breite der verfügbaren Kategorien (nicht nur die Top 20!)
2. Mische bekannte UND nischige Kategorien intelligent
3. Berücksichtige Regionalität und kulturelle Besonderheiten
4. Confidence-Score: 0.8-1.0 = sehr relevant, 0.6-0.8 = interessante Alternative, <0.6 = nicht vorschlagen  
5. Pro Hauptkategorie max. 3-5 vielfältige Vorschläge
6. Denke außerhalb der Box: "Kaffeerösterei" statt nur "Café", "Kochschule" statt nur "Restaurant"

ANTWORT-FORMAT (JSON) - IMMER 8-12 DIVERSE VORSCHLÄGE:
[
  {
    "category_id": "uuid",
    "target_main_category": "Essen & Trinken", 
    "confidence_score": 0.85,
    "reasoning": "Spezielle Nische mit hohem Potenzial",
    "rarity_score": 0.7
  }
]

Antworte NUR mit dem JSON-Array, ohne weitere Erklärungen.`;
}

function parseTagSuggestions(aiResponse: string, categories: CategoryToTag[]): TagSuggestion[] {
  try {
    // Extract JSON from AI response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found in AI response');
      return [];
    }

    const suggestions: TagSuggestion[] = JSON.parse(jsonMatch[0]);
    
    // Validate suggestions
    return suggestions.filter(suggestion => {
      const categoryExists = categories.some(cat => cat.id === suggestion.category_id);
      const validConfidence = suggestion.confidence_score >= 0.7 && suggestion.confidence_score <= 1.0;
      const hasTargetCategory = suggestion.target_main_category && suggestion.target_main_category.length > 0;
      
      return categoryExists && validConfidence && hasTargetCategory;
    });

  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    return [];
  }
}

async function createAwsSignature(
  body: BedrockRequest,
  accessKeyId: string,
  secretAccessKey: string,
  region: string
): Promise<string> {
  // Simplified AWS signature - in production use proper AWS SDK
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const datetime = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
  
  // For MVP, return basic auth (replace with proper AWS v4 signing in production)
  const credentials = btoa(`${accessKeyId}:${secretAccessKey}`);
  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${date}/${region}/bedrock/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=dummy`;
}