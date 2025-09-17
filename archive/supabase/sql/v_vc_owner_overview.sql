create or replace view v_vc_owner_overview as
select 
  r.business_id,
  (r.result->'score'->>'total')::int as total_score,
  jsonb_extract_path_text(r.result, 'trend', 'days30')::int as trend_30d,
  coalesce((r.result->'actions_top3')::jsonb, '[]'::jsonb) as actions_top3,
  coalesce((r.result->'history')::jsonb, '[]'::jsonb) as history,
  r.created_at
from vc_results r
join (
  select business_id, max(created_at) as max_ct
  from vc_results
  group by business_id
) last on last.business_id = r.business_id and last.max_ct = r.created_at;