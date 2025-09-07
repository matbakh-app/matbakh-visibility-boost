const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Pool } = require('pg');

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
            max: 1,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        console.log('Database pool initialized');
    }
    
    return pool;
}

async function createUserProfile(userAttributes) {
    console.log('Creating user profile for:', userAttributes);
    
    try {
        const dbPool = await initializePool();
        const client = await dbPool.connect();
        
        try {
            const result = await client.query(`
                SELECT public.create_user_profile_from_cognito($1, $2, $3, $4, $5, $6) as user_id
            `, [
                userAttributes.sub,
                userAttributes.email,
                userAttributes.given_name,
                userAttributes.family_name,
                userAttributes.user_role || 'owner',
                userAttributes.locale || 'de'
            ]);
            
            console.log('✅ User profile created:', {
                email: userAttributes.email,
                userId: result.rows[0].user_id
            });
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'User profile created successfully',
                    data: {
                        userId: result.rows[0].user_id,
                        email: userAttributes.email,
                        timestamp: new Date().toISOString()
                    }
                })
            };
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error creating user profile:', error);
        
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
}

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Check if this is a user profile creation request
    if (event.action === 'create_user_profile') {
        return await createUserProfile(event.userAttributes);
    }
    
    try {
        const dbPool = await initializePool();
        const client = await dbPool.connect();
        
        try {
            console.log('Fixing profiles table structure...');
            
            // Drop existing constraints
            await client.query('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check');
            await client.query('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_language_check');
            
            // Add missing columns
            await client.query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cognito_user_id text');
            await client.query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT \'de\'');
            await client.query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text');
            await client.query('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text');
            
            // Create unique index for cognito_user_id
            await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cognito_user_id ON public.profiles(cognito_user_id) WHERE cognito_user_id IS NOT NULL');
            
            console.log('✅ Profiles table structure fixed');
            
            // Now create the function
            const createFunctionSQL = `
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
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
            `;
            
            await client.query(createFunctionSQL);
            console.log('✅ Function created');
            
            // Test the function
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
            
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Profiles table fixed and function created successfully',
                    data: {
                        profilesCount: profilesCount.rows[0].count,
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