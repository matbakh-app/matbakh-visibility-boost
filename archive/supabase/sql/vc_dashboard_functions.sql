-- ================================================================
-- Visibility Check Dashboard Functions
-- Statistics and Analytics for Admin Dashboard
-- ================================================================

-- ================================================================
-- 1. Dashboard Statistics Function
-- ================================================================

CREATE OR REPLACE FUNCTION get_vc_dashboard_stats()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    total_leads integer;
    confirmed_leads integer;
    completed_analyses integer;
    conversion_rate decimal;
    avg_analysis_score decimal;
    leads_by_status jsonb;
    leads_by_date jsonb;
    top_categories jsonb;
BEGIN
    -- Get basic counts
    SELECT COUNT(*) INTO total_leads 
    FROM public.visibility_check_leads 
    WHERE deleted_at IS NULL;
    
    SELECT COUNT(*) INTO confirmed_leads 
    FROM public.visibility_check_leads 
    WHERE confirmed = true AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO completed_analyses 
    FROM public.visibility_check_leads 
    WHERE analysis_status = 'completed' AND deleted_at IS NULL;
    
    -- Calculate conversion rate (leads that became customers)
    SELECT COALESCE(
        (COUNT(*) FILTER (WHERE vf.converted_to_customer = true) * 100.0 / NULLIF(COUNT(*), 0)), 
        0
    ) INTO conversion_rate
    FROM public.visibility_check_leads vl
    LEFT JOIN public.visibility_check_followups vf ON vl.id = vf.lead_id
    WHERE vl.deleted_at IS NULL;
    
    -- Calculate average analysis score
    SELECT COALESCE(AVG(summary_score), 0) INTO avg_analysis_score
    FROM public.visibility_check_results vr
    JOIN public.visibility_check_leads vl ON vr.lead_id = vl.id
    WHERE vl.deleted_at IS NULL;
    
    -- Get leads by status
    SELECT jsonb_agg(
        jsonb_build_object(
            'status', analysis_status,
            'count', count
        )
    ) INTO leads_by_status
    FROM (
        SELECT 
            analysis_status,
            COUNT(*) as count
        FROM public.visibility_check_leads 
        WHERE deleted_at IS NULL
        GROUP BY analysis_status
        ORDER BY count DESC
    ) status_counts;
    
    -- Get leads by date (last 30 days)
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', date_trunc('day', created_at)::date,
            'count', count
        ) ORDER BY date_trunc('day', created_at)::date
    ) INTO leads_by_date
    FROM (
        SELECT 
            created_at,
            COUNT(*) as count
        FROM public.visibility_check_leads 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            AND deleted_at IS NULL
        GROUP BY date_trunc('day', created_at)
    ) date_counts;
    
    -- Get top business categories
    SELECT jsonb_agg(
        jsonb_build_object(
            'category', main_category,
            'count', count
        )
    ) INTO top_categories
    FROM (
        SELECT 
            vcd.main_category,
            COUNT(*) as count
        FROM public.visibility_check_context_data vcd
        JOIN public.visibility_check_leads vl ON vcd.lead_id = vl.id
        WHERE vl.deleted_at IS NULL
            AND vcd.main_category IS NOT NULL
        GROUP BY vcd.main_category
        ORDER BY count DESC
        LIMIT 10
    ) category_counts;
    
    -- Build final result
    result := jsonb_build_object(
        'total_leads', total_leads,
        'confirmed_leads', confirmed_leads,
        'completed_analyses', completed_analyses,
        'conversion_rate', conversion_rate,
        'avg_analysis_score', ROUND(avg_analysis_score, 1),
        'leads_by_status', COALESCE(leads_by_status, '[]'::jsonb),
        'leads_by_date', COALESCE(leads_by_date, '[]'::jsonb),
        'top_categories', COALESCE(top_categories, '[]'::jsonb)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 2. Lead Search Function
-- ================================================================

CREATE OR REPLACE FUNCTION search_vc_leads(
    search_term text DEFAULT NULL,
    status_filter text DEFAULT NULL,
    date_from timestamptz DEFAULT NULL,
    date_to timestamptz DEFAULT NULL,
    page_size integer DEFAULT 50,
    page_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    email text,
    analysis_status text,
    confirmed boolean,
    language text,
    created_at timestamptz,
    business_name text,
    city text,
    main_category text,
    summary_score integer,
    lead_score integer,
    followup_status text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vl.id,
        vl.email,
        vl.analysis_status,
        vl.confirmed,
        vl.language,
        vl.created_at,
        vcd.business_name,
        vcd.city,
        vcd.main_category,
        vr.summary_score,
        vf.lead_score,
        vf.status as followup_status
    FROM public.visibility_check_leads vl
    LEFT JOIN public.visibility_check_context_data vcd ON vl.id = vcd.lead_id
    LEFT JOIN public.visibility_check_results vr ON vl.id = vr.lead_id
    LEFT JOIN public.visibility_check_followups vf ON vl.id = vf.lead_id
    WHERE vl.deleted_at IS NULL
        AND (search_term IS NULL OR 
             vl.email ILIKE '%' || search_term || '%' OR 
             vcd.business_name ILIKE '%' || search_term || '%')
        AND (status_filter IS NULL OR vl.analysis_status = status_filter)
        AND (date_from IS NULL OR vl.created_at >= date_from)
        AND (date_to IS NULL OR vl.created_at <= date_to)
    ORDER BY vl.created_at DESC
    LIMIT page_size
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 3. Lead Detail Function
-- ================================================================

CREATE OR REPLACE FUNCTION get_vc_lead_detail(lead_id uuid)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'lead_info', to_jsonb(vl.*),
        'context_data', to_jsonb(vcd.*),
        'analysis_results', to_jsonb(vr.*),
        'followup_data', to_jsonb(vf.*),
        'ai_logs', (
            SELECT jsonb_agg(to_jsonb(al.*))
            FROM public.ai_action_logs al
            WHERE al.lead_id = vl.id
            ORDER BY al.created_at DESC
            LIMIT 10
        ),
        'consent_history', (
            SELECT jsonb_agg(to_jsonb(uc.*))
            FROM public.user_consent_tracking uc
            WHERE uc.lead_id = vl.id
            ORDER BY uc.timestamp_utc DESC
        )
    ) INTO result
    FROM public.visibility_check_leads vl
    LEFT JOIN public.visibility_check_context_data vcd ON vl.id = vcd.lead_id
    LEFT JOIN public.visibility_check_results vr ON vl.id = vr.lead_id
    LEFT JOIN public.visibility_check_followups vf ON vl.id = vf.lead_id
    WHERE vl.id = lead_id AND vl.deleted_at IS NULL;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 4. Export Data Function
-- ================================================================

CREATE OR REPLACE FUNCTION export_vc_leads_csv(
    status_filter text DEFAULT NULL,
    date_from timestamptz DEFAULT NULL,
    date_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
    email text,
    business_name text,
    city text,
    category text,
    status text,
    confirmed boolean,
    analysis_score integer,
    data_completeness integer,
    persona_type text,
    lead_score integer,
    followup_status text,
    created_at timestamptz,
    confirmed_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vl.email,
        vcd.business_name,
        vcd.city,
        vcd.main_category as category,
        vl.analysis_status as status,
        vl.confirmed,
        vr.summary_score as analysis_score,
        vcd.data_completeness_score as data_completeness,
        vcd.persona_type,
        vf.lead_score,
        vf.status as followup_status,
        vl.created_at,
        vl.confirmed_at
    FROM public.visibility_check_leads vl
    LEFT JOIN public.visibility_check_context_data vcd ON vl.id = vcd.lead_id
    LEFT JOIN public.visibility_check_results vr ON vl.id = vr.lead_id
    LEFT JOIN public.visibility_check_followups vf ON vl.id = vf.lead_id
    WHERE vl.deleted_at IS NULL
        AND (status_filter IS NULL OR vl.analysis_status = status_filter)
        AND (date_from IS NULL OR vl.created_at >= date_from)
        AND (date_to IS NULL OR vl.created_at <= date_to)
    ORDER BY vl.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 5. Analytics Functions
-- ================================================================

-- Conversion funnel analysis
CREATE OR REPLACE FUNCTION get_vc_conversion_funnel()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'email_collected', (
            SELECT COUNT(*) FROM public.visibility_check_leads 
            WHERE deleted_at IS NULL
        ),
        'email_confirmed', (
            SELECT COUNT(*) FROM public.visibility_check_leads 
            WHERE confirmed = true AND deleted_at IS NULL
        ),
        'data_submitted', (
            SELECT COUNT(*) FROM public.visibility_check_leads vl
            JOIN public.visibility_check_context_data vcd ON vl.id = vcd.lead_id
            WHERE vl.deleted_at IS NULL
        ),
        'analysis_completed', (
            SELECT COUNT(*) FROM public.visibility_check_leads 
            WHERE analysis_status = 'completed' AND deleted_at IS NULL
        ),
        'leads_qualified', (
            SELECT COUNT(*) FROM public.visibility_check_followups 
            WHERE status IN ('interested', 'qualified')
        ),
        'leads_converted', (
            SELECT COUNT(*) FROM public.visibility_check_followups 
            WHERE converted_to_customer = true
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance metrics by time period
CREATE OR REPLACE FUNCTION get_vc_performance_metrics(
    period_days integer DEFAULT 30
)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
    start_date timestamptz;
BEGIN
    start_date := CURRENT_DATE - (period_days || ' days')::interval;
    
    SELECT jsonb_build_object(
        'period_days', period_days,
        'total_leads', (
            SELECT COUNT(*) FROM public.visibility_check_leads 
            WHERE created_at >= start_date AND deleted_at IS NULL
        ),
        'avg_confirmation_time_hours', (
            SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 3600), 0)
            FROM public.visibility_check_leads 
            WHERE confirmed = true 
                AND created_at >= start_date 
                AND deleted_at IS NULL
        ),
        'avg_analysis_time_hours', (
            SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (vr.created_at - vl.confirmed_at)) / 3600), 0)
            FROM public.visibility_check_leads vl
            JOIN public.visibility_check_results vr ON vl.id = vr.lead_id
            WHERE vl.created_at >= start_date 
                AND vl.deleted_at IS NULL
        ),
        'avg_data_completeness', (
            SELECT COALESCE(AVG(data_completeness_score), 0)
            FROM public.visibility_check_context_data vcd
            JOIN public.visibility_check_leads vl ON vcd.lead_id = vl.id
            WHERE vl.created_at >= start_date 
                AND vl.deleted_at IS NULL
        ),
        'top_performing_categories', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'category', main_category,
                    'avg_score', avg_score,
                    'count', count
                )
            )
            FROM (
                SELECT 
                    vcd.main_category,
                    AVG(vr.summary_score) as avg_score,
                    COUNT(*) as count
                FROM public.visibility_check_context_data vcd
                JOIN public.visibility_check_leads vl ON vcd.lead_id = vl.id
                JOIN public.visibility_check_results vr ON vl.id = vr.lead_id
                WHERE vl.created_at >= start_date 
                    AND vl.deleted_at IS NULL
                    AND vcd.main_category IS NOT NULL
                GROUP BY vcd.main_category
                HAVING COUNT(*) >= 3
                ORDER BY avg_score DESC
                LIMIT 5
            ) top_cats
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 6. Data Quality Monitoring
-- ================================================================

CREATE OR REPLACE FUNCTION get_vc_data_quality_report()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'leads_with_missing_data', (
            SELECT COUNT(*) FROM public.visibility_check_leads vl
            LEFT JOIN public.visibility_check_context_data vcd ON vl.id = vcd.lead_id
            WHERE vl.confirmed = true 
                AND vl.deleted_at IS NULL
                AND vcd.id IS NULL
        ),
        'avg_data_completeness_by_status', (
            SELECT jsonb_object_agg(
                analysis_status,
                ROUND(avg_completeness, 1)
            )
            FROM (
                SELECT 
                    vl.analysis_status,
                    AVG(COALESCE(vcd.data_completeness_score, 0)) as avg_completeness
                FROM public.visibility_check_leads vl
                LEFT JOIN public.visibility_check_context_data vcd ON vl.id = vcd.lead_id
                WHERE vl.deleted_at IS NULL
                GROUP BY vl.analysis_status
            ) completeness_by_status
        ),
        'most_common_missing_fields', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'field', field,
                    'missing_count', missing_count
                )
            )
            FROM (
                SELECT 
                    unnest(missing_fields) as field,
                    COUNT(*) as missing_count
                FROM public.visibility_check_context_data vcd
                JOIN public.visibility_check_leads vl ON vcd.lead_id = vl.id
                WHERE vl.deleted_at IS NULL
                    AND missing_fields IS NOT NULL
                GROUP BY unnest(missing_fields)
                ORDER BY missing_count DESC
                LIMIT 10
            ) missing_fields_count
        ),
        'ai_analysis_quality', (
            SELECT jsonb_build_object(
                'avg_confidence', ROUND(AVG(confidence_score), 3),
                'low_confidence_count', COUNT(*) FILTER (WHERE confidence_score < 0.7),
                'high_confidence_count', COUNT(*) FILTER (WHERE confidence_score >= 0.9)
            )
            FROM public.ai_action_logs
            WHERE request_type = 'visibility_check'
                AND confidence_score IS NOT NULL
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 7. Grant Permissions
-- ================================================================

-- Grant execute permissions to authenticated users with proper roles
GRANT EXECUTE ON FUNCTION get_vc_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION search_vc_leads(text, text, timestamptz, timestamptz, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vc_lead_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION export_vc_leads_csv(text, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vc_conversion_funnel() TO authenticated;
GRANT EXECUTE ON FUNCTION get_vc_performance_metrics(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vc_data_quality_report() TO authenticated;

-- ================================================================
-- 8. Create Indexes for Performance
-- ================================================================

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_vc_leads_dashboard_stats 
    ON public.visibility_check_leads (analysis_status, confirmed, created_at) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vc_context_category_stats 
    ON public.visibility_check_context_data (main_category, data_completeness_score);

CREATE INDEX IF NOT EXISTS idx_vc_results_scoring 
    ON public.visibility_check_results (summary_score, analysis_confidence, created_at);

CREATE INDEX IF NOT EXISTS idx_vc_followups_conversion 
    ON public.visibility_check_followups (status, converted_to_customer, lead_score);

CREATE INDEX IF NOT EXISTS idx_ai_logs_analytics 
    ON public.ai_action_logs (request_type, confidence_score, created_at) 
    WHERE request_type = 'visibility_check';

-- ================================================================
-- Success Message
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ VC Dashboard Functions deployed successfully!';
    RAISE NOTICE '📊 Functions: 7 analytics functions + performance indexes';
    RAISE NOTICE '🔍 Features: Search, export, statistics, quality monitoring';
    RAISE NOTICE '⚡ Performance: Optimized indexes for dashboard queries';
    RAISE NOTICE '🔒 Security: RLS-compliant with proper permissions';
END $$;