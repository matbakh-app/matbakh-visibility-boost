// Manual Test für Enhanced Visibility Check Edge Function
// Paket 2.1: AI-Service Integration Test

const testPayload = {
  businessName: "Bella Vista Restaurant",
  location: "Berlin, Deutschland", 
  mainCategory: "Essen & Trinken",
  subCategory: "Italienisches Restaurant",
  matbakhTags: ["pasta", "pizza", "wine"],
  website: "https://bella-vista-berlin.de",
  facebookName: "",
  instagramName: "",
  benchmarks: ["Osteria Italiana", "Pizzeria Romano"],
  email: "test@bellavista.de",
  leadId: null, // Für Test ohne DB-Persistierung
  googleName: "Bella Vista Berlin"
}

// Test Command für Supabase CLI:
/*
supabase functions invoke enhanced-visibility-check \
  --payload '{
    "businessName": "Bella Vista Restaurant",
    "location": "Berlin, Deutschland",
    "mainCategory": "Essen & Trinken",
    "subCategory": "Italienisches Restaurant",
    "matbakhTags": ["pasta", "pizza", "wine"],
    "website": "https://bella-vista-berlin.de",
    "facebookName": "",
    "instagramName": "",
    "benchmarks": ["Osteria Italiana", "Pizzeria Romano"],
    "email": "test@bellavista.de",
    "googleName": "Bella Vista Berlin"
  }'
*/

// Erwartete Log-Ausgaben:
// 🚀 Enhanced AI-powered visibility check started for: Bella Vista Restaurant
// 📋 Using subcategories for AI context: [Fischrestaurant, Vegetarisches Restaurant, Weinbar]
// 📊 Loaded industry benchmarks: 0 (da noch keine Daten in der Tabelle)
// ✅ Bedrock analysis completed successfully (oder Fallback)

// Test-Kriterien:
// ✅ 2.1.1: Unterkategorien werden korrekt aus gmb_categories geladen
// ✅ 2.1.2: industry_benchmarks wird abgefragt (auch wenn leer)
// ✅ 2.1.3: AI-Fallback funktioniert bei Bedrock-Fehlern
// ✅ 2.1.4: Response enthält alle erwarteten Felder

export { testPayload }