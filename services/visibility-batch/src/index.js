import { callBedrockVisibilityAnalysis } from "./bedrockClient.js";

console.log("🚀 Matbakh Visibility Batch Service - Demo Runner");
console.log("=" .repeat(50));

(async () => {
  // Demo-Input basierend auf typischen matbakh.app Daten
  const demoInput = {
    businessName: "Luigi's Pizzeria München",
    location: "München, Schwabing", 
    mainCategory: "Italienisches Restaurant",
    googleName: "luigis-pizzeria-schwabing",
    facebookName: "LuigisPizzaMuc",
    instagramName: "luigis_pizza_muenchen",
    instagramCandidates: [
      { handle: "luigis_pizza_muenchen", score: 85, confidence: "high" },
      { handle: "luigi_pizzeria_muc", score: 72, confidence: "medium" }
    ],
    benchmarks: [
      { name: "Ristorante Da Mario", score: 78 },
      { name: "Pizzeria Salvatore", score: 65 },
      { name: "Trattoria Nonna", score: 82 }
    ],
    additionalContext: {
      hasWebsite: true,
      claimedGoogleBusiness: true,
      avgRating: 4.3,
      reviewCount: 127
    }
  };

  console.log("📋 Demo Input Data:");
  console.log(JSON.stringify(demoInput, null, 2));
  console.log("\n🔄 Calling Bedrock Analysis...");

  try {
    const startTime = Date.now();
    const result = await callBedrockVisibilityAnalysis(demoInput);
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Analysis completed in ${duration}ms`);
    console.log("📊 Bedrock Analysis Result:");
    console.log("=" .repeat(50));
    
    // Pretty print results
    console.log(`🎯 Overall Score: ${result.overallScore}/100`);
    
    if (result.platformAnalyses?.length > 0) {
      console.log("\n📱 Platform Analyses:");
      result.platformAnalyses.forEach(platform => {
        console.log(`  • ${platform.platform}: ${platform.score}/100 (${platform.status})`);
      });
    }
    
    if (result.quickWins?.length > 0) {
      console.log("\n⚡ Quick Wins:");
      result.quickWins.forEach((win, i) => {
        console.log(`  ${i + 1}. ${win}`);
      });
    }

    if (result.swotAnalysis) {
      console.log("\n🎭 SWOT Analysis:");
      console.log(`  Strengths: ${result.swotAnalysis.strengths?.length || 0}`);
      console.log(`  Weaknesses: ${result.swotAnalysis.weaknesses?.length || 0}`);
      console.log(`  Opportunities: ${result.swotAnalysis.opportunities?.length || 0}`);
      console.log(`  Threats: ${result.swotAnalysis.threats?.length || 0}`);
    }

    if (result._fallback) {
      console.log("\n⚠️  FALLBACK MODE: Using mock data due to error");
      console.log(`Error: ${result._error}`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Demo completed successfully!");

    // Validate result structure
    console.log("\n🔍 Validating response structure...");
    const requiredFields = ['overallScore', 'platformAnalyses', 'benchmarks', 'quickWins', 'categoryInsights', 'swotAnalysis'];
    const validation = requiredFields.map(field => ({
      field,
      present: result[field] !== undefined,
      type: typeof result[field]
    }));
    
    console.table(validation);
    
    const allValid = validation.every(v => v.present);
    console.log(allValid ? "✅ All required fields present" : "❌ Missing required fields");

  } catch (error) {
    console.error("\n❌ Demo failed with error:");
    console.error(error);
    console.log("\n💡 Make sure your AWS credentials are configured:");
    console.log("  - AWS_ACCESS_KEY_ID");
    console.log("  - AWS_SECRET_ACCESS_KEY"); 
    console.log("  - AWS_REGION (eu-central-1)");
  }
})();