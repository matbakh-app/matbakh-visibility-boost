const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Pool } = require('pg');
const fs = require('fs');

const secretsManager = new SecretsManagerClient({ region: process.env.AWS_REGION });

let pool;

async function getDbConfig() {
    try {
        const command = new GetSecretValueCommand({
            SecretId: process.env.DB_SECRET_NAME
        });
        
        const secret = await secretsManager.send(command);
        
        return JSON.parse(secret.SecretString);
    } catch (error) {
        console.error('Error retrieving database secret:', error);
        throw error;
    }
}

async function initializePool() {
    if (!pool) {
        const dbConfig = await getDbConfig();
        
        pool = new Pool({
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.dbname,
            user: dbConfig.username,
            password: dbConfig.password,
            ssl: {
                rejectUnauthorized: false
            },
            max: 1, // Lambda connection limit
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        console.log('Database pool initialized');
    }
    
    return pool;
}

const createTablesSQL = `
-- Create User Profile Tables for Cognito Integration
-- Phase A3.2 - Database Schema Fix
-- Date: 2025-08-30

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (compatible with existing structure)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'owner',
    display_name text,
    avatar_url text,
    cognito_user_id text UNIQUE,
    language text DEFAULT 'de' CHECK (language IN ('de', 'en')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add missing columns to existing profiles table
DO $$ 
BEGIN
    -- Add cognito_user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'cognito_user_id') THEN
        ALTER TABLE public.profiles ADD COLUMN cognito_user_id text UNIQUE;
    END IF;
    
    -- Add language column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'language') THEN
        ALTER TABLE public.profiles ADD COLUMN language text DEFAULT 'de';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;
    
    -- Add display_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'display_name') THEN
        ALTER TABLE public.profiles ADD COLUMN display_name text;
    END IF;
END $$;

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
`;

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        const dbPool = await initializePool();
        const client = await dbPool.connect();
        
        try {
            console.log('Creating user profile tables...');
            
            // Execute the SQL to create tables and functions
            await client.query(createTablesSQL);
            
            console.log('✅ Tables created successfully');
            
            // Test the function by creating a test profile
            const testResult = await client.query(`
                SELECT public.create_user_profile_from_cognito(
                    'test-cognito-id-' || extract(epoch from now())::text,
                    'test-' || extract(epoch from now())::text || '@example.com',
                    'Test',
                    'User',
                    'owner',
                    'de'
                ) as user_id
            `);
            
            console.log('✅ Test profile created:', testResult.rows[0]);
            
            // Get current profiles count
            const profilesCount = await client.query('SELECT count(*) as count FROM public.profiles');
            const privateProfilesCount = await client.query('SELECT count(*) as count FROM public.private_profiles');
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'User profile tables created successfully',
                    data: {
                        profilesCount: profilesCount.rows[0].count,
                        privateProfilesCount: privateProfilesCount.rows[0].count,
                        testUserId: testResult.rows[0].user_id,
                        timestamp: new Date().toISOString()
                    }
                })
            };
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Database error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};