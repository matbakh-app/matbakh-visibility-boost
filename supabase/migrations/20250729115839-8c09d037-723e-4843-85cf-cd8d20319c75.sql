-- 1) Create category_cross_tags table
CREATE TABLE public.category_cross_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.gmb_categories(id) ON DELETE CASCADE,
  target_main_category TEXT NOT NULL,
  confidence_score NUMERIC DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source TEXT NOT NULL CHECK (source IN ('manual', 'ai', 'suggested')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_cct_category_id ON public.category_cross_tags(category_id);
CREATE INDEX idx_cct_target_main_category ON public.category_cross_tags(target_main_category);
CREATE INDEX idx_cct_source ON public.category_cross_tags(source);

-- 2) Create category_search_logs table
CREATE TABLE public.category_search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  search_term TEXT NOT NULL,
  selected_main_categories TEXT[] NOT NULL,
  search_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  result_category_ids UUID[] NULL,
  selected_category_id UUID NULL REFERENCES public.gmb_categories(id)
);
CREATE INDEX idx_search_logs_user_timestamp ON public.category_search_logs(user_id, search_timestamp DESC);
CREATE INDEX idx_search_logs_timestamp ON public.category_search_logs(search_timestamp DESC);

-- 3) Create auto_tagging_jobs table
CREATE TABLE public.auto_tagging_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_finished_at TIMESTAMPTZ,
  total_categories_processed INT DEFAULT 0,
  total_tags_created INT DEFAULT 0,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  error_message TEXT
);

-- 4) Create category_tag_events table
CREATE TABLE public.category_tag_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_cross_tag_id UUID REFERENCES public.category_cross_tags(id) ON DELETE CASCADE,
  changed_by UUID NULL,
  change_type TEXT CHECK (change_type IN ('create','update','delete','review_approve','review_reject')),
  old_confidence NUMERIC,
  new_confidence NUMERIC,
  old_source TEXT,
  new_source TEXT,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  comment TEXT
);
CREATE INDEX idx_cte_category_cross_tag_id ON public.category_tag_events(category_cross_tag_id);
CREATE INDEX idx_cte_timestamp ON public.category_tag_events(event_timestamp DESC);

-- 5) Enable RLS on new tables
ALTER TABLE public.category_cross_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_tagging_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_tag_events ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies: category_cross_tags
CREATE POLICY "Anyone can read cross tags" ON public.category_cross_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage cross tags" ON public.category_cross_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can manage cross tags" ON public.category_cross_tags FOR ALL USING (auth.role() = 'service_role');

-- 7) RLS Policies: category_search_logs
CREATE POLICY "Users can create search logs" ON public.category_search_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own search logs" ON public.category_search_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all search logs" ON public.category_search_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8) RLS Policies: auto_tagging_jobs
CREATE POLICY "Admins can view tagging jobs" ON public.auto_tagging_jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can manage tagging jobs" ON public.auto_tagging_jobs FOR ALL USING (auth.role() = 'service_role');

-- 9) RLS Policies: category_tag_events
CREATE POLICY "Admins can view tag events" ON public.category_tag_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can manage tag events" ON public.category_tag_events FOR ALL USING (auth.role() = 'service_role');

-- 10) Initial manual cross-tags for Biergarten and other hotspots
INSERT INTO public.category_cross_tags (category_id, target_main_category, confidence_score, source)
SELECT id, 'Essen & Trinken', 1.0, 'manual'
FROM public.gmb_categories
WHERE name_de ILIKE '%biergarten%'
  AND haupt_kategorie != 'Essen & Trinken';

INSERT INTO public.category_cross_tags (category_id, target_main_category, confidence_score, source)
SELECT id, 'Essen & Trinken', 1.0, 'manual'
FROM public.gmb_categories
WHERE name_de ILIKE ANY (ARRAY['%café%', '%restaurant%', '%weingut%'])
  AND haupt_kategorie != 'Essen & Trinken';

-- 11) Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_category_cross_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_category_cross_tags_updated_at
  BEFORE UPDATE ON public.category_cross_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_cross_tags_updated_at();