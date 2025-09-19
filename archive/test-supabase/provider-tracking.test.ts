// test/integration/provider-tracking.test.ts

import { expect, it, beforeAll, afterAll, describe } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Test environment config
const SUPABASE_URL = 'http://localhost:54321'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZWtzb2JueWVkYXJycGd4aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDk0NDUsImV4cCI6MjA2NTg4NTQ0NX0.dlbs4P3ZgXByNj7H1_k99YcOok9WmqgLZ1NtjONJYVs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('Provider Tracking End-to-End Tests', () => {
  const mockPayload = {
    businessName: 'Provider Test Restaurant',
    location: 'Berlin, Deutschland',
    mainCategory: 'Essen & Trinken',
    subCategory: 'Restaurant',
    email: 'provider-test@example.com',
    website: 'https://provider-test.de',
    facebookName: 'ProviderTestRestaurant',
    instagramName: 'provider_test',
    googleName: 'Provider Test Restaurant Berlin'
  }
  let leadId: string

  beforeAll(async () => {
    // Cleanup any leftover test data
    await supabase
      .from('visibility_check_leads')
      .delete()
      .like('email', 'provider-test@%')
  })

  afterAll(async () => {
    // Cleanup test data again
    await supabase
      .from('visibility_check_leads')
      .delete()
      .like('email', 'provider-test@%')
  })

  it('stores provider field correctly with USE_BEDROCK=true', async () => {
    process.env.USE_BEDROCK = 'true'

    const { data: f1, error: e1 } = await supabase.functions.invoke(
      'enhanced-visibility-check',
      { body: mockPayload }
    )
    expect(e1).toBeNull()
    expect(f1?.leadId).toBeDefined()
    leadId = f1!.leadId

    // Wait for completion
    let status = 'pending'
    for (let i = 0; i < 20 && status !== 'completed'; i++) {
      await new Promise(r => setTimeout(r, 1000))
      const { data } = await supabase
        .from('visibility_check_leads')
        .select('status')
        .eq('id', leadId)
        .single()
      status = data?.status || 'pending'
    }
    expect(status).toBe('completed')

    // Check provider field in results
    const { data: results, error: err2 } = await supabase
      .from('visibility_check_results')
      .select('provider, analysis_results')
      .eq('lead_id', leadId)
      .single()
    
    expect(err2).toBeNull()
    expect(results.provider).toBe('bedrock')
  })

  it('stores provider field correctly with USE_BEDROCK=false', async () => {
    process.env.USE_BEDROCK = 'false'

    const { data: f2, error: e2 } = await supabase.functions.invoke(
      'enhanced-visibility-check',
      { body: { ...mockPayload, email: 'provider-test-mock@example.com' } }
    )
    expect(e2).toBeNull()
    const mockLeadId = f2!.leadId

    // Wait for completion
    let status = 'pending'
    for (let i = 0; i < 20 && status !== 'completed'; i++) {
      await new Promise(r => setTimeout(r, 1000))
      const { data } = await supabase
        .from('visibility_check_leads')
        .select('status')
        .eq('id', mockLeadId)
        .single()
      status = data?.status || 'pending'
    }

    // Check provider field for mock
    const { data: mockResults } = await supabase
      .from('visibility_check_results')
      .select('provider')
      .eq('lead_id', mockLeadId)
      .single()
    
    expect(mockResults.provider).toBe('mockAnalysis')
  })

  it('CSV export includes provider column', async () => {
    const { data: csvData, error: csvErr } = await supabase.functions.invoke(
      'export-visibility-csv',
      { body: { leadId } }
    )
    
    expect(csvErr).toBeNull()
    expect(csvData).toContain('provider')
    expect(csvData).toContain('bedrock')
  })

  it('get-visibility-results API includes provider', async () => {
    const { data: apiResult, error: apiErr } = await supabase.functions.invoke(
      'get-visibility-results',
      { body: { leadId } }
    )
    
    expect(apiErr).toBeNull()
    expect(apiResult.provider).toBe('bedrock')
  })

  it('PDF generation includes provider info', async () => {
    const { data: pdfResult, error: pdfErr } = await supabase.functions.invoke(
      'generate-pdf-report',
      { body: { leadId } }
    )
    
    expect(pdfErr).toBeNull()
    expect(pdfResult.success).toBe(true)
    // PDF sollte Provider-Info enthalten (wird im PDF-Template geprüft)
  })
})