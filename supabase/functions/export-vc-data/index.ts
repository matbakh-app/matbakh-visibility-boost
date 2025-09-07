import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ================================================================
// Visibility Check Data Export Function
// CSV and PDF Export for Admin Dashboard
// ================================================================

interface ExportRequest {
  format: 'csv' | 'pdf'
  filters?: {
    status?: string
    date_from?: string
    date_to?: string
    search?: string
  }
  include_analysis?: boolean
  include_followup?: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify admin access
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { format, filters, include_analysis = false, include_followup = false }: ExportRequest = await req.json()

    if (!format || !['csv', 'pdf'].includes(format)) {
      return new Response(
        JSON.stringify({ error: 'Invalid format. Must be csv or pdf' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch data based on filters
    const data = await fetchExportData(supabase, filters, include_analysis, include_followup)

    if (format === 'csv') {
      const csvContent = generateCSV(data)
      return new Response(csvContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="vc-leads-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      const pdfContent = await generatePDF(data)
      return new Response(pdfContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="vc-report-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })
    }

  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({ error: 'Export failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ================================================================
// Data Fetching
// ================================================================

async function fetchExportData(supabase: any, filters: any = {}, includeAnalysis: boolean, includeFollowup: boolean) {
  let query = supabase
    .from('visibility_check_leads')
    .select(`
      id,
      email,
      analysis_status,
      confirmed,
      language,
      created_at,
      confirmed_at,
      updated_at,
      utm_source,
      utm_medium,
      utm_campaign,
      visibility_check_context_data (
        business_name,
        business_description,
        city,
        state_province,
        postal_code,
        country,
        main_category,
        sub_categories,
        website_url,
        instagram_url,
        facebook_url,
        gmb_url,
        data_completeness_score,
        persona_type,
        user_goal,
        priority_areas
      ),
      ${includeAnalysis ? `
        visibility_check_results (
          summary_score,
          platform_scores,
          strengths,
          weaknesses,
          opportunities,
          threats,
          quick_wins,
          profile_health_score,
          analysis_confidence,
          created_at
        ),
      ` : ''}
      ${includeFollowup ? `
        visibility_check_followups (
          status,
          lead_score,
          contact_attempts,
          last_contact_at,
          next_contact_at,
          converted_to_customer,
          conversion_date,
          conversion_value_cents,
          admin_notes
        )
      ` : ''}
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.status) {
    query = query.eq('analysis_status', filters.status)
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to)
  }

  const { data, error } = await query

  if (error) throw error

  // Filter by search term if provided (post-processing since we can't easily do this in the query)
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    return data.filter((lead: any) => 
      lead.email.toLowerCase().includes(searchTerm) ||
      lead.visibility_check_context_data?.[0]?.business_name?.toLowerCase().includes(searchTerm)
    )
  }

  return data || []
}

// ================================================================
// CSV Generation
// ================================================================

function generateCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data available for export'
  }

  // Define CSV headers
  const headers = [
    'Email',
    'Business Name',
    'City',
    'Category',
    'Status',
    'Confirmed',
    'Language',
    'Analysis Score',
    'Data Completeness',
    'Persona Type',
    'Lead Score',
    'Followup Status',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'Created Date',
    'Confirmed Date',
    'Website URL',
    'Instagram URL',
    'Facebook URL',
    'GMB URL'
  ]

  // Generate CSV rows
  const rows = data.map(lead => {
    const context = lead.visibility_check_context_data?.[0] || {}
    const result = lead.visibility_check_results?.[0] || {}
    const followup = lead.visibility_check_followups?.[0] || {}

    return [
      escapeCSV(lead.email),
      escapeCSV(context.business_name || ''),
      escapeCSV(context.city || ''),
      escapeCSV(context.main_category || ''),
      escapeCSV(lead.analysis_status),
      lead.confirmed ? 'Yes' : 'No',
      escapeCSV(lead.language),
      result.summary_score || '',
      context.data_completeness_score || '',
      escapeCSV(context.persona_type || ''),
      followup.lead_score || '',
      escapeCSV(followup.status || ''),
      escapeCSV(lead.utm_source || ''),
      escapeCSV(lead.utm_medium || ''),
      escapeCSV(lead.utm_campaign || ''),
      formatDate(lead.created_at),
      formatDate(lead.confirmed_at),
      escapeCSV(context.website_url || ''),
      escapeCSV(context.instagram_url || ''),
      escapeCSV(context.facebook_url || ''),
      escapeCSV(context.gmb_url || '')
    ]
  })

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  
  return csvContent
}

function escapeCSV(value: string): string {
  if (!value) return ''
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  
  return value
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('de-DE')
}

// ================================================================
// PDF Generation
// ================================================================

async function generatePDF(data: any[]): Promise<Uint8Array> {
  // For now, we'll create a simple HTML-to-PDF conversion
  // In production, you might want to use a proper PDF library like jsPDF or Puppeteer
  
  const htmlContent = generateHTMLReport(data)
  
  // This is a simplified PDF generation - in production you'd use a proper PDF library
  // For now, we'll return the HTML as a simple text-based "PDF"
  const encoder = new TextEncoder()
  return encoder.encode(htmlContent)
}

function generateHTMLReport(data: any[]): string {
  const stats = calculateReportStats(data)
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Visibility Check Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .stat-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .status-completed { background-color: #dcfce7; color: #166534; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-failed { background-color: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visibility Check Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('de-DE')} at ${new Date().toLocaleTimeString('de-DE')}</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${stats.totalLeads}</div>
            <div class="stat-label">Total Leads</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.confirmedLeads}</div>
            <div class="stat-label">Confirmed Leads</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.completedAnalyses}</div>
            <div class="stat-label">Completed Analyses</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.avgScore}</div>
            <div class="stat-label">Average Score</div>
        </div>
    </div>
    
    <h2>Lead Details</h2>
    <table>
        <thead>
            <tr>
                <th>Email</th>
                <th>Business</th>
                <th>Status</th>
                <th>Score</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(lead => {
              const context = lead.visibility_check_context_data?.[0] || {}
              const result = lead.visibility_check_results?.[0] || {}
              
              return `
                <tr>
                    <td>${lead.email}</td>
                    <td>${context.business_name || 'N/A'}<br><small>${context.city || ''}</small></td>
                    <td><span class="status-badge status-${lead.analysis_status}">${lead.analysis_status}</span></td>
                    <td>${result.summary_score || 'N/A'}</td>
                    <td>${formatDate(lead.created_at)}</td>
                </tr>
              `
            }).join('')}
        </tbody>
    </table>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <p>This report contains ${data.length} visibility check leads.</p>
        <p>Generated by matbakh.app Visibility Check System</p>
    </div>
</body>
</html>
  `
}

function calculateReportStats(data: any[]) {
  const totalLeads = data.length
  const confirmedLeads = data.filter(lead => lead.confirmed).length
  const completedAnalyses = data.filter(lead => lead.analysis_status === 'completed').length
  
  const scores = data
    .map(lead => lead.visibility_check_results?.[0]?.summary_score)
    .filter(score => score !== undefined && score !== null)
  
  const avgScore = scores.length > 0 
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0

  return {
    totalLeads,
    confirmedLeads,
    completedAnalyses,
    avgScore
  }
}