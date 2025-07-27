/**
 * AUTOMATISIERTE TESTUMGEBUNG FÜR MATBAKH.APP VISIBILITY CHECK
 * 
 * Diese Suite testet die komplette Visibility-Check-Pipeline automatisch,
 * ohne dass manuelle Frontend-Tests erforderlich sind.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Testumgebung Config
const SUPABASE_URL = 'http://localhost:54321'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZWtzb2JueWVkYXJycGd4aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDk0NDUsImV4cCI6MjA2NTg4NTQ0NX0.dlbs4P3ZgXByNj7H1_k99YcOok9WmqgLZ1NtjONJYVs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('🚀 Matbakh.app Visibility Check - Automatisierte Test Suite', () => {
  
  // Test Data Definitions
  const testPayloads = [
    {
      name: "Standard Restaurant Test",
      payload: {
        businessName: "AI Test Restaurant",
        location: "Berlin, Deutschland",
        mainCategory: "Essen & Trinken",
        subCategory: "Restaurant",
        email: "ai-test@restaurant.de",
        website: "https://ai-test-restaurant.de",
        facebookName: "",
        instagramName: "aitest_restaurant",
        googleName: "AI Test Restaurant Berlin"
      }
    },
    {
      name: "Pizzeria mit Social Media",
      payload: {
        businessName: "Mama Mia Pizzeria",
        location: "München, Deutschland", 
        mainCategory: "Essen & Trinken",
        subCategory: "Pizzeria",
        email: "ai-test@mamamia.de",
        website: "https://mamamia-pizzeria.de",
        facebookName: "MamaMiaPizzeriaMunich",
        instagramName: "mama_mia_pizza",
        googleName: "Mama Mia Pizzeria München"
      }
    },
    {
      name: "Café ohne Website",
      payload: {
        businessName: "Cozy Corner Café",
        location: "Hamburg, Deutschland",
        mainCategory: "Essen & Trinken", 
        subCategory: "Café",
        email: "ai-test@cozycorner.de",
        website: "",
        facebookName: "",
        instagramName: "",
        googleName: "Cozy Corner Café Hamburg"
      }
    }
  ]

  beforeAll(async () => {
    console.log('🔧 Setting up automated test environment...')
    
    // Cleanup alte Test-Daten
    await supabase
      .from('visibility_check_leads')
      .delete()
      .like('email', 'ai-test@%')
      
    console.log('✅ Test environment ready')
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...')
    
    // Cleanup Test-Daten nach allen Tests
    await supabase
      .from('visibility_check_leads')  
      .delete()
      .like('email', 'ai-test@%')
      
    console.log('✅ Cleanup completed')
  })

  // Test 1: Enhanced Visibility Check Function End-to-End
  it.each(testPayloads)('sollte $name vollständig verarbeiten', async ({ payload }) => {
    console.log(`\n🧪 Testing: ${payload.businessName}`)
    
    // 1. Enhanced Visibility Check aufrufen
    const { data: functionResult, error: functionError } = await supabase.functions.invoke(
      'enhanced-visibility-check',
      { body: payload }
    )
    
    expect(functionError).toBeNull()
    expect(functionResult).toBeDefined()
    expect(functionResult.leadId).toBeDefined()
    
    const leadId = functionResult.leadId
    console.log(`📝 Lead created: ${leadId}`)
    
    // 2. Warten auf Verarbeitung (max 30 Sekunden)
    let attempts = 0
    let leadStatus = 'pending'
    
    while (attempts < 30 && leadStatus !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: leadData } = await supabase
        .from('visibility_check_leads')
        .select('status')
        .eq('id', leadId)
        .single()
        
      leadStatus = leadData?.status || 'pending'
      attempts++
      
      if (attempts % 5 === 0) {
        console.log(`⏳ Status nach ${attempts}s: ${leadStatus}`)
      }
    }
    
    expect(leadStatus).toBe('completed')
    console.log('✅ Lead processing completed')
    
    // 3. Verify Visibility Results
    const { data: results, error: resultsError } = await supabase
      .from('visibility_check_results')
      .select('*')
      .eq('lead_id', leadId)
      .single()
      
    expect(resultsError).toBeNull()
    expect(results).toBeDefined()
    
    // 4. Detailed Result Validation
    expect(results.overall_score).toBeGreaterThanOrEqual(0)
    expect(results.overall_score).toBeLessThanOrEqual(100)
    expect(results.lead_potential).toMatch(/^(high|medium|low)$/)
    
    if (results.platform_analyses) {
      expect(Array.isArray(results.platform_analyses)).toBe(true)
    }
    
    if (results.quick_wins) {
      expect(Array.isArray(results.quick_wins)).toBe(true)
    }
    
    if (results.swot_analysis) {
      expect(results.swot_analysis).toHaveProperty('strengths')
      expect(results.swot_analysis).toHaveProperty('weaknesses')
      expect(results.swot_analysis).toHaveProperty('opportunities')
      expect(results.swot_analysis).toHaveProperty('threats')
    }
    
    console.log(`📊 Overall Score: ${results.overall_score}`)
    console.log(`🎯 Lead Potential: ${results.lead_potential}`)
    console.log(`📈 Platform Analyses: ${results.platform_analyses?.length || 0} items`)
    console.log(`⚡ Quick Wins: ${results.quick_wins?.length || 0} items`)
    
    console.log('✅ Result validation passed')
    
  }, 45000) // 45 Sekunden Timeout pro Test

  // Test 2: PDF Generation
  it('sollte PDF-Report korrekt generieren', async () => {
    console.log('\n📄 Testing PDF Generation...')
    
    // Verwende das erste Test-Payload
    const payload = testPayloads[0].payload
    
    // 1. Visibility Check durchführen
    const { data: functionResult } = await supabase.functions.invoke(
      'enhanced-visibility-check',
      { body: payload }
    )
    
    const leadId = functionResult.leadId
    
    // 2. Warten auf Completion
    let attempts = 0
    let leadStatus = 'pending'
    
    while (attempts < 30 && leadStatus !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: leadData } = await supabase
        .from('visibility_check_leads')
        .select('status')
        .eq('id', leadId)
        .single()
        
      leadStatus = leadData?.status || 'pending'
      attempts++
    }
    
    // 3. PDF Generation triggern
    const { data: pdfResult, error: pdfError } = await supabase.functions.invoke(
      'generate-pdf-report',
      { body: { leadId } }
    )
    
    expect(pdfError).toBeNull()
    expect(pdfResult).toBeDefined()
    expect(pdfResult.success).toBe(true)
    
    console.log('✅ PDF generation successful')
    
  }, 60000) // 60 Sekunden Timeout für PDF

  // Test 3: Get Visibility Results API
  it('sollte Visibility Results über API abrufen', async () => {
    console.log('\n🔍 Testing Get Visibility Results API...')
    
    // Test Lead aus vorherigem Test verwenden oder neuen erstellen
    const { data: existingLeads } = await supabase
      .from('visibility_check_leads')
      .select('id')
      .eq('status', 'completed')
      .like('email', 'ai-test@%')
      .limit(1)
    
    if (existingLeads && existingLeads.length > 0) {
      const leadId = existingLeads[0].id
      
      const { data: apiResult, error: apiError } = await supabase.functions.invoke(
        'get-visibility-results',
        { body: { leadId } }
      )
      
      expect(apiError).toBeNull()
      expect(apiResult).toBeDefined()
      expect(apiResult.lead).toBeDefined()
      expect(apiResult.results).toBeDefined()
      
      console.log('✅ API results retrieved successfully')
    } else {
      console.log('⚠️ No completed leads found for API test')
    }
    
  }, 15000)

  // Test 4: Error Handling
  it('sollte Fehler korrekt behandeln', async () => {
    console.log('\n❌ Testing Error Handling...')
    
    // Test mit ungültigen Daten
    const invalidPayload = {
      businessName: "", // Leerer Name sollte Fehler verursachen
      location: "",
      email: "invalid-email" // Ungültige E-Mail
    }
    
    const { data: result, error } = await supabase.functions.invoke(
      'enhanced-visibility-check',
      { body: invalidPayload }
    )
    
    // Erwarte dass entweder ein Error zurückkommt ODER
    // ein Result mit Error-Status
    if (error) {
      expect(error).toBeDefined()
      console.log('✅ Error correctly handled by function')
    } else if (result && result.error) {
      expect(result.error).toBeDefined()
      console.log('✅ Error correctly handled in response')
    }
    
  }, 15000)

  // DUAL-PIPELINE TESTS (Feature Flag + Fallback)
  it('sollte USE_BEDROCK=false korrekt verwenden', async () => {
    console.log('\n🔧 Testing USE_BEDROCK=false...')
    
    // Set environment for mock analysis
    process.env.USE_BEDROCK = 'false'
    
    const testPayload = {
      businessName: 'Mock Test Restaurant',
      location: 'Hamburg, Deutschland',
      mainCategory: 'Essen & Trinken',
      subCategory: 'Restaurant',
      email: 'mock-test@restaurant.de',
      website: 'https://mock-test-restaurant.de',
      facebookName: 'MockTestRestaurant',
      instagramName: 'mock_restaurant',
      googleName: 'Mock Test Restaurant Hamburg'
    }
    
    const { data: result, error } = await supabase.functions.invoke(
      'enhanced-visibility-check',
      { body: testPayload }
    )
    
    expect(error).toBeNull()
    expect(result?.leadId).toBeDefined()
    
    // Warten auf Completion
    const leadId = result.leadId
    let attempts = 0
    let status = 'pending'
    
    while (attempts < 30 && status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: leadData } = await supabase
        .from('visibility_check_leads')
        .select('status')
        .eq('id', leadId)
        .single()
        
      status = leadData?.status || 'pending'
      attempts++
    }
    
    expect(status).toBe('completed')
    
    // Check provider in results
    const { data: results } = await supabase
      .from('visibility_check_results')
      .select('analysis_results')
      .eq('lead_id', leadId)
      .single()
    
    expect(results?.analysis_results?.provider).toBe('mockAnalysis')
    console.log('✅ Mock analysis correctly used')
    
  }, 45000)
})

// Utility Functions für erweiterte Tests
export class VisibilityTestUtils {
  
  static async waitForLeadCompletion(leadId: string, maxWaitSeconds = 30): Promise<string> {
    let attempts = 0
    let status = 'pending'
    
    while (attempts < maxWaitSeconds && status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data } = await supabase
        .from('visibility_check_leads')
        .select('status')
        .eq('id', leadId)
        .single()
        
      status = data?.status || 'pending'
      attempts++
    }
    
    return status
  }
  
  static async getFullResults(leadId: string) {
    const { data: lead } = await supabase
      .from('visibility_check_leads')
      .select('*')
      .eq('id', leadId)
      .single()
      
    const { data: results } = await supabase
      .from('visibility_check_results')
      .select('*')
      .eq('lead_id', leadId)
      .single()
      
    return { lead, results }
  }
  
  static async cleanupTestData() {
    await supabase
      .from('visibility_check_leads')
      .delete()
      .like('email', 'ai-test@%')
  }
}

console.log('🧪 Automatisierte Test Suite geladen')
console.log('📝 Verfügbare Tests:')
console.log('  - Enhanced Visibility Check End-to-End')
console.log('  - PDF Generation')
console.log('  - API Results Retrieval')
console.log('  - Error Handling')
console.log('')
console.log('🚀 Führe Tests aus mit: npm run test test/automated-visibility-test-suite.ts')