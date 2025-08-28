Plan
- Schritt 1: DB & RBAC bootstrap (profiles + private_profile, Trigger, RLS, Backfill, dich zum super_admin).
- Schritt 2: Feature-Flags prüfen (onboarding_guard_live=false, vc_* wie besprochen).
- Schritt 3: Supabase Edge Functions deployen + CORS (vc-start, vc-verify, vc-result, vc-runner-stub, dev-mail-sink, og-vc, partner-credits).
- Schritt 4: UI-Patches (idempotent):
  - VCQuick: kein Auto-Redirect bei eingeloggten Nutzer:innen; Confirm-Button → /vc/quick.
  - VCResult: Query-Param `t` lesen, Ergebnis per Edge-Fn holen; Fehlerzustände anzeigen statt "Fehlerseite".
  - _Kiro: i18n-Umschalter (de/en) + Guard-Bypass; Diagnose bleibt erreichbar.
  - Routing: OwnerOverview unter /dashboard einhängen; Admin-Routen sichtbar, aber RBAC-geschützt.
- Schritt 5: Owner-Dashboard Inhalte aktivieren (KPI/Charts + CSV + PDF-Export via Function).
- Schritt 6: Build + Deploy (S3 sync, index.html no-store, CloudFront Invalidation).
- Schritt 7: Smoke-Tests (/_kiro, /vc/quick, /vc/result?t=demo, /vc/result/dashboard, /dashboard, /admin/leads) & Report.

----------------------------------------------------------------
Schritt 1 — RBAC & Profile Bootstrap (SQL; idempotent)
----------------------------------------------------------------
-- 1.1 profiles + private_profile anlegen
BEGIN;
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','super_admin')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.private_profile (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  address jsonb,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1.2 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_profile ENABLE ROW LEVEL SECURITY;

-- Self-read & admin-read
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
CREATE POLICY "profiles self read" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
CREATE POLICY "profiles admin read" ON public.profiles
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('admin','super_admin'))
);

-- Limit updates: User darf eigenes profile bearbeiten, aber NICHT role
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
CREATE POLICY "profiles self update" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND role = OLD.role);

-- private_profile Policies: self full, admin read
DROP POLICY IF EXISTS "private self read" ON public.private_profile;
CREATE POLICY "private self read" ON public.private_profile
FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "private self update" ON public.private_profile;
CREATE POLICY "private self update" ON public.private_profile
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "private admin read" ON public.private_profile;
CREATE POLICY "private admin read" ON public.private_profile
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.id = auth.uid() AND p2.role IN ('admin','super_admin'))
);

-- 1.3 Trigger: bei neuer auth.users-Zeile automatisch profiles/private_profile erzeugen
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.private_profile (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 1.4 Backfill: alle auth.users → profiles/private_profile
INSERT INTO public.profiles (id, role)
SELECT u.id, 'user'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.private_profile (id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.private_profile pp ON pp.id = u.id
WHERE pp.id IS NULL;

-- 1.5 Dich zum super_admin machen (Passe die E-Mails ggf. an)
UPDATE public.profiles
SET role = 'super_admin', updated_at = now()
WHERE id IN (SELECT id FROM auth.users WHERE email IN ('info@matbakh.app','matbakhapp2025@gmail.com'));

COMMIT;

-- 1.6 Check
SELECT 'profiles', role, count(*) FROM public.profiles GROUP BY role ORDER BY role;

----------------------------------------------------------------
Schritt 2 — Flags prüfen
----------------------------------------------------------------
-- Flags-Snapshot (schaltet Guard aus, Canary bleibt aus, Invisible Default an)
SELECT key, value FROM public.feature_flags
WHERE key IN ('onboarding_guard_live','vc_doi_live','vc_ident_live','vc_bedrock_live','vc_bedrock_rollout_percent','ui_invisible_default')
ORDER BY key;

----------------------------------------------------------------
Schritt 3 — Edge Functions deploy + CORS
----------------------------------------------------------------
# CLI: im Projektroot
supabase functions deploy vc-start
supabase functions deploy vc-verify
supabase functions deploy vc-result
supabase functions deploy vc-runner-stub
supabase functions deploy dev-mail-sink
supabase functions deploy og-vc
supabase functions deploy partner-credits

# Funktions-Env prüfen, CORS erlauben:
# Allowed origins ergänzen: https://matbakh.app, http://localhost:5173

----------------------------------------------------------------
Schritt 4 — UI-Patches (idempotent)
----------------------------------------------------------------
# 4.1 VCQuick
- Entferne/neutralisiere Auto-Redirects für eingeloggte User (z. B. `if (user) navigate('/dashboard')`).
- Success/Confirm-Screen: "Back to home" → Linkziel `/vc/quick`.

# 4.2 VCResult
- Beim Mount: QueryParam `t` lesen (`new URLSearchParams(location.search).get('t')`).
- Wenn `t` vorhanden: Edge-Fn `vc-result` GET mit Token aufrufen, Ergebnis rendern.
- Error-State UX: "Ungültiges/abgelaufenes Token" statt generische Fehlerseite.
- `/vc/result/dashboard`: gleiche Abfrage, zusätzlich Owner-Links/CTA.

# 4.3 _Kiro (Diagnose)
- i18n-Umschalter (de/en), Locale aus `navigator.language` vorbefüllen.
- Guard-Bypass: _Kiro nie vom Onboarding/Owner-Guard umleiten.
- Zeige Flags, Rolle, Snapshots (onboarding_complete/profile_complete, business_partners.status).

# 4.4 Routing
- `/dashboard` → OwnerOverview (bestehende Seite, inkl. Charts + CSV/PDF-Controls).
- Admin-Routen bleiben, RBAC checkt `profiles.role`.

----------------------------------------------------------------
Schritt 5 — Owner-Dashboard (CSV + PDF)
----------------------------------------------------------------
- Verlinke CSV-Export (bestehende Function `export-visibility-csv`).
- Aktiviere PDF-Export via `generate-pdf-report` (Button → call Edge-Fn, Download).
- Wenn keine Daten: Leerzustands-Cards statt leere Seite.

----------------------------------------------------------------
Schritt 6 — Build & Deploy
----------------------------------------------------------------
npm run build

aws s3 sync dist/ s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5 --delete --cache-control "public, max-age=31536000" --exclude "index.html"

aws s3 cp dist/index.html s3://matbakhvcstack-webbucket12880f5b-svct6cxfbip5/index.html \
  --cache-control "no-store, no-cache, must-revalidate" \
  --content-type "text/html" --metadata-directive REPLACE

aws cloudfront create-invalidation --distribution-id E2W4JULEW8BXSD --paths "/*"

----------------------------------------------------------------
Schritt 7 — Smoke-Tests & Report (STOP)
----------------------------------------------------------------
# Tests (mit hartem Reload / ?v=rbac1):
- /_kiro → lädt, zeigt deine Rolle: super_admin, Sprache umschaltbar.
- /vc/quick → bleibt auf der Seite, kein Jump auf /dashboard.
- DOI-Mail klicken → /vc/result?t=<token> zeigt Ergebnis (kein 404/Fehlerseite).
- /vc/result/dashboard → lädt.
- /dashboard → Charts + CSV + PDF (nicht nur eine Zeile).
- /admin/leads (angemeldet) → lädt (du bist super_admin).

# Report
docs/audits/live-readiness-2.md:
- Flags (Snapshot)
- Rollen-Zusammenfassung (profiles by role)
- Sessions-Status (aktive auth.sessions)
- Funktions-Deploy-Status
- Testergebnisse OK/FAIL je Route
- Hinweis, falls weitere Daten für Dashboard fehlen (z. B. leeres System)


<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:   
-------------------------------------------------------------------------------------> 