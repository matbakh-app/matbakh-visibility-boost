-- RBAC & Profile Bootstrap (idempotent)
-- Creates profiles + private_profile tables, RLS policies, triggers, and backfills

BEGIN;

-- 1.1 profiles + private_profile anlegen
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
SELECT 'profiles' as table_name, role, count(*) FROM public.profiles GROUP BY role ORDER BY role;