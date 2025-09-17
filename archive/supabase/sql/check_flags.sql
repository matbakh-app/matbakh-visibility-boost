-- Flags-Snapshot (schaltet Guard aus, Canary bleibt aus, Invisible Default an)
SELECT flag_name, enabled, value, description FROM public.feature_flags
WHERE flag_name IN ('onboarding_guard_live','vc_doi_live','vc_ident_live','vc_bedrock_live','vc_bedrock_rollout_percent','ui_invisible_default')
ORDER BY flag_name;