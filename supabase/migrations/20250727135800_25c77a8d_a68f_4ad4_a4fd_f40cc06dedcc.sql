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