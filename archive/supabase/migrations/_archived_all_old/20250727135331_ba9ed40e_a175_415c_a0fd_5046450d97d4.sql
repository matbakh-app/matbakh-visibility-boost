-- 3.1.1: Sicht in der DB anlegen, die Lead‑Meta & AI‑Ergebnisse kombiniert
CREATE OR REPLACE VIEW public.visibility_full_results AS
SELECT
  vcl.id                  AS lead_id,
  vcl.business_name,
  vcl.email,
  vcl.status,
  vcl.report_url,
  vcr.overall_score,
  vcr.platform_analyses,
  vcr.category_insights,
  vcr.quick_wins,
  vcr.swot_analysis,
  vcr.benchmark_insights,
  vcr.analysis_results,
  vcr.created_at          AS analysis_date
FROM public.visibility_check_leads AS vcl
JOIN public.visibility_check_results AS vcr
  ON vcl.id = vcr.lead_id;

-- 3.2.1: RLS auf die View aktivieren
ALTER TABLE public.visibility_full_results ENABLE ROW LEVEL SECURITY;

-- 3.2.2: Nur Lead‑Eigentümer (per user_id oder Email‑Token) dürfen ihre Daten sehen
CREATE POLICY "Leads only see their own full results"
  ON public.visibility_full_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.visibility_check_leads l
      WHERE l.id     = visibility_full_results.lead_id
        AND (
             l.user_id = auth.uid()
          OR l.email   = auth.jwt() ->> 'email'
        )
    )
  );