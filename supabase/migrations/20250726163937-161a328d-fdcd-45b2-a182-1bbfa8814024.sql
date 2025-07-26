-- Temporäre Debug-Policy für visibility_check_leads
-- Diese Policy erlaubt SELECT für alle, um das Problem zu identifizieren
-- WICHTIG: Nach dem Debug wieder entfernen!

CREATE POLICY "DEBUG_select_all_leads_temporarily"
ON public.visibility_check_leads
FOR SELECT
TO anon, authenticated
USING (true);