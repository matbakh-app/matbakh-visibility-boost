// test/integration/full-visibility-pipeline.test.ts

import { expect, it, beforeAll, afterAll, describe } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Test environment config
const SUPABASE_URL = 'http://localhost:54321'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZWtzb2JueWVkYXJycGd4aGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDk0NDUsImV4cCI6MjA2NTg4NTQ0NX0.dlbs4P3ZgXByNj7H1_k99YcOok9WmqgLZ1NtjONJYVs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('Full Visibility Check Pipeline + Fallback Integration', () => {
  const payload = {
    businessName: 'Integration Test Bistro',
    location: 'Berlin, Deutschland',
    mainCategory: 'Essen & Trinken',
    subCategory: 'Bistro',
    email: 'lovable-test@bistro.de',
    website: 'https://integration-test-bistro.de',
    facebookName: 'IntegrationTestBistro',
    instagramName: 'integration_bistro',
    googleName: 'Integration Test Bistro Berlin'
  }
  let leadId: string

  beforeAll(async () => {
    // Cleanup any leftover test data
    await supabase
      .from('visibility_check_leads')
      .delete()
      .like('email', 'lovable-test@%')
  })

  afterAll(async () => {
    // Cleanup test data again
    await supabase
      .from('visibility_check_leads')
      .delete()
      .like('email', 'lovable-test@%')
  })

  it('runs enhanced-visibility-check with USE_BEDROCK=true and validates full results', async () => {
    process.env.USE_BEDROCK = 'true'

    const { data: f1, error: e1 } = await supabase.functions.invoke(
      'enhanced-visibility-check',
      { body: payload }
    )
    expect(e1).toBeNull()
    expect(f1?.leadId).toBeDefined()
    leadId = f1!.leadId

    // wait for completion
    let status = 'pending'
    for (let i = 0; i < 30 && status !== 'completed'; i++) {
      await new Promise(r => setTimeout(r, 1000))
      const { data } = await supabase
        .from('visibility_check_leads')
        .select('status')
        .eq('id', leadId)
        .single()
      status = data?.status || 'pending'
    }
    expect(status).toBe('completed')

    const { data: results, error: err2 } = await supabase
      .from('visibility_check_results')
      .select('*')
      .eq('lead_id', leadId)
      .single()
    expect(err2).toBeNull()
    expect(results.overall_score).toBeGreaterThanOrEqual(0)
    expect(results.swot_analysis).toHaveProperty('strengths')
  })

  it('falls back to mockAnalysis when Bedrock fails', async () => {
    process.env.USE_BEDROCK = 'true'
    // Simulate Bedrock failure by pointing to invalid endpoint
    process.env.BEDROCK_ENDPOINT = 'http://localhost:12345/invalid'

    const { data: f2, error: e2 } = await supabase.functions.invoke(
      'enhanced-visibility-check',
      { body: payload }
    )
    expect(e2).toBeNull()
    expect(f2?.leadId).toBeDefined()
    const fallbackLead = f2!.leadId

    // Verify mock fallback data present
    const { data: res2 } = await supabase
      .from('visibility_check_results')
      .select('provider')
      .eq('lead_id', fallbackLead)
      .single()
    expect(res2.provider).toBe('mockAnalysis')
  })

  it('generates PDF report and ensures link in storage', async () => {
    // reuse leadId from first test
    const { data: pdf, error: pdfErr } = await supabase.functions.invoke(
      'generate-pdf-report',
      { body: { leadId } }
    )
    expect(pdfErr).toBeNull()
    expect(pdf.success).toBe(true)
    expect(pdf.url).toMatch(/^https?:\/\/.*\.pdf$/)
  })

  it('retrieves results via API and checks consistency', async () => {
    const { data: apiResult, error: apiErr } = await supabase.functions.invoke(
      'get-visibility-results',
      { body: { leadId } }
    )
    expect(apiErr).toBeNull()
    expect(apiResult.lead.id).toBe(leadId)
    expect(apiResult.results.visibility_score).toBeDefined()
  })

  it('cleans up and confirms no leftover test leads', async () => {
    await supabase
      .from('visibility_check_leads')
      .delete()
      .like('email', 'lovable-test@%')

    const { data: remaining } = await supabase
      .from('visibility_check_leads')
      .select('id')
      .like('email', 'lovable-test@%')
    expect(remaining.length).toBe(0)
  })
})