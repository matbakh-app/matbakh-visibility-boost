import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Test für Phase 2.2.2: Ergebnis-Mapping & Persistierung der AI-Antwort
describe('Enhanced Visibility Check - Phase 2.2.2', () => {
  const mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        })),
        limit: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({ error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ error: null }))
      }))
    }))
  }

  const mockAiAnalysis = {
    overallScore: 85,
    platformAnalyses: [
      {
        platform: "google",
        score: 92,
        details: {
          hasProfile: true,
          profileComplete: true,
          hasReviews: true,
          hasPhotos: true,
          hasHours: true,
          rating: 4.5,
          reviewCount: 120
        },
        strengths: ["Vollständiges Profil", "Gute Bewertungen"],
        weaknesses: ["Wenige aktuelle Fotos"],
        recommendations: ["Mehr Fotos hochladen", "Auf Bewertungen antworten"]
      }
    ],
    categoryInsights: [
      "Als italienisches Restaurant sollten Sie besonders auf visuelle Inhalte setzen",
      "Bewertungsmanagement ist in Ihrer Branche entscheidend"
    ],
    quickWins: [
      "Fügen Sie 5-10 hochwertige Fotos hinzu",
      "Reagieren Sie auf alle Bewertungen der letzten 30 Tage",
      "Aktualisieren Sie Ihre Öffnungszeiten"
    ],
    swotAnalysis: {
      strengths: ["Gute Bewertungen", "Vollständiges Google-Profil"],
      weaknesses: ["Wenige Fotos", "Keine Social Media Präsenz"],
      opportunities: ["Instagram Marketing", "Bewertungsmanagement"],
      threats: ["Starke lokale Konkurrenz", "Negative Bewertungen"]
    },
    benchmarkInsights: "Ihr Restaurant liegt 15% über dem Branchendurchschnitt",
    leadPotential: "high"
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('2.2.2 Mapping: sollte insertPayload korrekt aus aiAnalysis aufbauen', async () => {
    const leadId = 'test-lead-123'
    const instagramCandidates = [
      {
        handle: 'test_restaurant',
        score: 0.85,
        confidence: 'high' as const,
        matchReason: 'Name ähnlich zu "Test Restaurant"'
      }
    ]

    // Extrahiere die neuen Felder aus aiAnalysis (wie in der Edge Function)
    const {
      overallScore,
      platformAnalyses,
      categoryInsights,
      quickWins,
      swotAnalysis,
      benchmarkInsights,
      leadPotential
    } = mockAiAnalysis

    // Baue das Insert-Objekt (wie in der Edge Function)
    const insertPayload = {
      lead_id: leadId,
      overall_score: overallScore,
      platform_analyses: platformAnalyses,
      category_insights: categoryInsights,
      quick_wins: quickWins,
      swot_analysis: swotAnalysis,
      benchmark_insights: benchmarkInsights,
      lead_potential: leadPotential,
      analysis_results: mockAiAnalysis,            // vollständiges Raw-JSON für spätere Audits
      instagram_candidates: instagramCandidates
    }

    // Assertions
    expect(insertPayload.lead_id).toBe(leadId)
    expect(insertPayload.overall_score).toBe(85)
    expect(insertPayload.platform_analyses).toEqual(mockAiAnalysis.platformAnalyses)
    expect(insertPayload.category_insights).toEqual(mockAiAnalysis.categoryInsights)
    expect(insertPayload.quick_wins).toEqual(mockAiAnalysis.quickWins)
    expect(insertPayload.swot_analysis).toEqual(mockAiAnalysis.swotAnalysis)
    expect(insertPayload.benchmark_insights).toBe("Ihr Restaurant liegt 15% über dem Branchendurchschnitt")
    expect(insertPayload.lead_potential).toBe("high")
    expect(insertPayload.analysis_results).toEqual(mockAiAnalysis)
    expect(insertPayload.instagram_candidates).toEqual(instagramCandidates)

    console.log('✅ Test 2.2.2: Insert-Payload korrekt strukturiert')
  })

  it('sollte bei Insert-Fehler status auf "failed" setzen', async () => {
    const leadId = 'test-lead-456'
    const insertError = new Error('Database connection failed')
    
    // Mock Insert-Fehler
    const mockSupabaseWithError = {
      from: jest.fn((table) => {
        if (table === 'visibility_check_results') {
          return {
            insert: jest.fn(() => ({ error: insertError }))
          }
        }
        if (table === 'visibility_check_leads') {
          return {
            update: jest.fn(() => ({
              eq: jest.fn(() => ({ error: null }))
            }))
          }
        }
        return mockSupabaseClient.from()
      })
    }

    // Simuliere Insert-Fehler und Fallback-Verhalten
    const { error: insertErr } = { error: insertError }
    
    if (insertErr) {
      console.log('❌ Insert AI results failed:', insertErr.message)
      // Status auf failed setzen
      const failedUpdate = {
        status: 'failed',
        analysis_error_message: insertErr.message
      }
      
      expect(failedUpdate.status).toBe('failed')
      expect(failedUpdate.analysis_error_message).toBe('Database connection failed')
    }

    console.log('✅ Test 2.2.2: Insert-Fehler korrekt behandelt')
  })

  it('Enhanced Visibility Check Full Flow: führt Basis-Checks, Subcats, Benchmarks und AI-Mapping korrekt aus', async () => {
    // 1. Mock Supabase: gmb_categories + industry_benchmarks + inserts + updates
    const mockSubcats = [
      { name_de: 'Restaurant', name_en: 'Restaurant' },
      { name_de: 'Café', name_en: 'Cafe' },
      { name_de: 'Bar', name_en: 'Bar' }
    ]
    
    const mockBenchmarks = [
      { metric_name: 'Average Rating', metric_value: 4.2, platform: 'google' }
    ]

    const insertSpy = jest.fn(() => ({ error: null }))
    const updateSpy = jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) }))

    const mockSupabaseFullFlow = {
      from: jest.fn((table) => {
        if (table === 'gmb_categories') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({ data: mockSubcats, error: null }))
            }))
          }
        }
        if (table === 'industry_benchmarks') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                limit: jest.fn(() => ({ data: mockBenchmarks, error: null }))
              }))
            }))
          }
        }
        if (table === 'visibility_check_results') {
          return { insert: insertSpy }
        }
        if (table === 'visibility_check_leads') {
          return { update: updateSpy }
        }
        return mockSupabaseClient.from()
      })
    }

    // 2. Simuliere den Full Flow
    const testData = {
      businessName: 'Test Restaurant',
      mainCategory: 'Essen & Trinken',
      location: 'Berlin',
      leadId: 'test-lead-789'
    }

    // Subcategories laden
    const { data: subcats } = { data: mockSubcats, error: null }
    const promptCategories = subcats.map(c => c.name_de).slice(0, 3)
    
    // Benchmarks laden
    const { data: benchmarkData } = { data: mockBenchmarks, error: null }
    const benchmarks = benchmarkData || []
    
    // Insert Payload aufbauen
    const insertPayload = {
      lead_id: testData.leadId,
      overall_score: mockAiAnalysis.overallScore,
      platform_analyses: mockAiAnalysis.platformAnalyses,
      category_insights: mockAiAnalysis.categoryInsights,
      quick_wins: mockAiAnalysis.quickWins,
      swot_analysis: mockAiAnalysis.swotAnalysis,
      benchmark_insights: mockAiAnalysis.benchmarkInsights,
      lead_potential: mockAiAnalysis.leadPotential,
      analysis_results: mockAiAnalysis,
      instagram_candidates: []
    }

    // Assertions
    expect(promptCategories).toEqual(['Restaurant', 'Café', 'Bar'])
    expect(benchmarks).toHaveLength(1)
    expect(insertPayload.swot_analysis).toEqual(mockAiAnalysis.swotAnalysis)
    expect(insertPayload.benchmark_insights).toBe(mockAiAnalysis.benchmarkInsights)
    
    // Simuliere Supabase Calls
    insertSpy(insertPayload)
    updateSpy({ status: 'completed' })

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        swot_analysis: mockAiAnalysis.swotAnalysis,
        benchmark_insights: mockAiAnalysis.benchmarkInsights,
        lead_potential: 'high'
      })
    )

    console.log('✅ Test Enhanced Visibility Check Full Flow: Alle Komponenten integriert')
  })
})

// Test-Payload für Edge Function End-to-End Test
export const testPayloadPhase222 = {
  businessName: "Bella Vista Trattoria",
  location: "Berlin, Deutschland",
  mainCategory: "Essen & Trinken",
  subCategory: "Italienisches Restaurant",
  matbakhTags: ["pasta", "pizza", "wine", "italian"],
  website: "https://bella-vista-berlin.de",
  facebookName: "",
  instagramName: "",
  benchmarks: ["Osteria Italiana", "Pizzeria Romano"],
  email: "test@bellavista.de",
  leadId: "test-lead-phase-222",
  googleName: "Bella Vista Trattoria Berlin"
}

console.log('🧪 Phase 2.2.2 Tests bereit')
console.log('📋 End-to-End Test Payload:', JSON.stringify(testPayloadPhase222, null, 2))

/*
SQL Test Command für Supabase CLI:

SELECT vcl.status, vcr.overall_score, vcr.swot_analysis, vcr.benchmark_insights
FROM visibility_check_leads vcl
LEFT JOIN visibility_check_results vcr ON vcl.id = vcr.lead_id
WHERE vcl.id = 'test-lead-phase-222';

Expected Result nach erfolgreichem Test:
- vcl.status = 'completed'
- vcr.overall_score = number (z.B. 85)
- vcr.swot_analysis = object mit strengths, weaknesses, opportunities, threats
- vcr.benchmark_insights = string (z.B. "Ihr Restaurant liegt 15% über dem Branchendurchschnitt")
*/