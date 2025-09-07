-- Create User Profile Tables for Cognito Integration
-- Phase A3.2 - Database Schema Fix
-- Date: 2025-08-30

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (compatible with existing structure)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'user', 'super_admin')),
    display_name text,
    avatar_url text,
    cognito_user_id text UNIQUE,
    language text DEFAULT 'de' CHECK (language IN ('de', 'en')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create private_profiles table for sensitive user data
CREATE TABLE IF NOT EXISTS public.private_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    phone text,
    preferences jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cognito_user_id ON public.profiles(cognito_user_id);
CREATE INDEX IF NOT EXISTS idx_private_profiles_user_id ON public.private_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (
        cognito_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR role IN ('admin', 'super_admin')
    );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (
        cognito_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    ) WITH CHECK (
        cognito_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        AND role = OLD.role -- Prevent role escalation
    );

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (
        cognito_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    );

-- RLS Policies for private_profiles table
DROP POLICY IF EXISTS "private_profiles_select_own" ON public.private_profiles;
CREATE POLICY "private_profiles_select_own" ON public.private_profiles
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.profiles 
            WHERE cognito_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = user_id AND role IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "private_profiles_update_own" ON public.private_profiles;
CREATE POLICY "private_profiles_update_own" ON public.private_profiles
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.profiles 
            WHERE cognito_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

DROP POLICY IF EXISTS "private_profiles_insert_own" ON public.private_profiles;
CREATE POLICY "private_profiles_insert_own" ON public.private_profiles
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.profiles 
            WHERE cognito_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Create function to handle user profile creation from Cognito
CREATE OR REPLACE FUNCTION public.create_user_profile_from_cognito(
    p_cognito_user_id text,
    p_email text,
    p_given_name text DEFAULT NULL,
    p_family_name text DEFAULT NULL,
    p_role text DEFAULT 'owner',
    p_locale text DEFAULT 'de'
) RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
    v_display_name text;
BEGIN
    -- Generate display name
    v_display_name := COALESCE(
        NULLIF(trim(COALESCE(p_given_name, '') || ' ' || COALESCE(p_family_name, '')), ''),
        split_part(p_email, '@', 1)
    );
    
    -- Insert or update profile
    INSERT INTO public.profiles (
        email, role, display_name, cognito_user_id, language
    ) VALUES (
        p_email, p_role, v_display_name, p_cognito_user_id, p_locale
    )
    ON CONFLICT (email) DO UPDATE SET
        cognito_user_id = EXCLUDED.cognito_user_id,
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        language = COALESCE(EXCLUDED.language, profiles.language),
        updated_at = now()
    RETURNING id INTO v_user_id;
    
    -- Insert or update private profile if we have personal data
    IF p_given_name IS NOT NULL OR p_family_name IS NOT NULL THEN
        INSERT INTO public.private_profiles (
            user_id, first_name, last_name, preferences
        ) VALUES (
            v_user_id, p_given_name, p_family_name, 
            jsonb_build_object(
                'locale', p_locale,
                'onboarding_step', 0,
                'profile_complete', false
            )
        )
        ON CONFLICT (user_id) DO UPDATE SET
            first_name = COALESCE(EXCLUDED.first_name, private_profiles.first_name),
            last_name = COALESCE(EXCLUDED.last_name, private_profiles.last_name),
            preferences = COALESCE(EXCLUDED.preferences, private_profiles.preferences),
            updated_at = now();
    END IF;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to Lambda role (if needed)
-- GRANT EXECUTE ON FUNCTION public.create_user_profile_from_cognito TO lambda_role;

-- Create a simple API endpoint function for user profile
CREATE OR REPLACE FUNCTION public.get_user_profile(p_cognito_user_id text)
RETURNS TABLE (
    id uuid,
    email text,
    role text,
    display_name text,
    language text,
    first_name text,
    last_name text,
    preferences jsonb,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.role,
        p.display_name,
        p.language,
        pp.first_name,
        pp.last_name,
        pp.preferences,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    LEFT JOIN public.private_profiles pp ON pp.user_id = p.id
    WHERE p.cognito_user_id = p_cognito_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert test data for existing user (if needed)
DO $$
BEGIN
    -- Check if we need to create a profile for existing Cognito user
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'your-email@example.com') THEN
        PERFORM public.create_user_profile_from_cognito(
            'existing-cognito-user-id',
            'your-email@example.com',
            'Test',
            'User',
            'owner',
            'de'
        );
        RAISE NOTICE 'Test user profile created';
    END IF;
END $$;

-- Show current profiles
SELECT 'Current profiles:' as info;
SELECT id, email, role, display_name, cognito_user_id, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;