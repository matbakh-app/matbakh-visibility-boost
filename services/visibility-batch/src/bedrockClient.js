import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "eu-central-1" 
});

// Verwende Claude 3.5 Sonnet (aktuellstes verfügbares Modell)
const MODEL_ID = process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0";

export async function callBedrockVisibilityAnalysis(input) {
  console.log(`🤖 Calling Bedrock Model: ${MODEL_ID}`);
  
  const prompt = `
Du bist ein Experte für Restaurant-Online-Marketing und analysierst die digitale Sichtbarkeit.

Analysiere basierend auf diesen Daten:
${JSON.stringify(input, null, 2)}

Erstelle eine detaillierte Analyse und gib das Ergebnis als validen JSON zurück:

{
  "overallScore": [Gesamtscore 0-100],
  "platformAnalyses": [
    {
      "platform": "google|facebook|instagram", 
      "score": [0-100],
      "status": "claimed|unclaimed|needs_improvement",
      "insights": ["Insight 1", "Insight 2"],
      "recommendations": ["Empfehlung 1", "Empfehlung 2"]
    }
  ],
  "benchmarks": [
    {
      "competitor": "Name",
      "ourScore": [0-100],
      "competitorScore": [0-100],
      "gap": [Differenz]
    }
  ],
  "quickWins": [
    "Schnelle Verbesserung 1",
    "Schnelle Verbesserung 2",
    "Schnelle Verbesserung 3"
  ],
  "categoryInsights": [
    "Branche-spezifische Erkenntnis 1",
    "Branche-spezifische Erkenntnis 2"
  ],
  "swotAnalysis": {
    "strengths": ["Stärke 1", "Stärke 2"],
    "weaknesses": ["Schwäche 1", "Schwäche 2"], 
    "opportunities": ["Chance 1", "Chance 2"],
    "threats": ["Risiko 1", "Risiko 2"]
  }
}

Analysiere realistisch und detailliert. Fokus auf umsetzbare Empfehlungen für Gastronomen.`;

  try {
    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: "user", 
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json", 
      body: JSON.stringify(requestBody)
    });

    console.log("📤 Sending request to Bedrock...");
    const response = await client.send(command);
    
    const responseBody = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(responseBody);
    
    console.log("📥 Raw Bedrock Response:", parsedResponse);
    
    // Extract content from Claude response
    const content = parsedResponse.content?.[0]?.text || parsedResponse.completion;
    
    if (!content) {
      throw new Error("No content in Bedrock response");
    }

    // Extract JSON from response (remove any surrounding text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in Bedrock response");
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    
    console.log("✅ Parsed Analysis Result:", analysisResult);
    return analysisResult;

  } catch (error) {
    console.error("❌ Bedrock Error:", error);
    
    // Fallback: Return structured mock data if Bedrock fails
    return {
      overallScore: 65,
      platformAnalyses: [
        {
          platform: "google",
          score: 70,
          status: "needs_improvement", 
          insights: ["Google My Business Profil vorhanden"],
          recommendations: ["Öffnungszeiten aktualisieren", "Mehr Fotos hinzufügen"]
        }
      ],
      benchmarks: [
        {
          competitor: "Wettbewerber 1",
          ourScore: 65,
          competitorScore: 80,
          gap: -15
        }
      ],
      quickWins: [
        "Google My Business Fotos hinzufügen",
        "Öffnungszeiten vervollständigen",
        "Kundenbewertungen beantworten"
      ],
      categoryInsights: [
        "Restaurants in dieser Kategorie haben durchschnittlich 4.2 Sterne",
        "87% der Konkurrenten nutzen Instagram aktiv"
      ],
      swotAnalysis: {
        strengths: ["Zentrale Lage", "Gute Bewertungen"],
        weaknesses: ["Wenig Online-Präsenz", "Fehlende Social Media"],
        opportunities: ["Instagram Marketing", "Google Ads"],
        threats: ["Starke Konkurrenz", "Sinkende Sichtbarkeit"]
      },
      _fallback: true,
      _error: error.message
    };
  }
}