/**
 * Environment Variables Check
 * 
 * Validates that all required Vite environment variables are present
 */

export const checkEnvVariables = () => {
  console.log('🔧 Checking environment variables...');
  
  const requiredViteVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY', 
    'VITE_SUPABASE_FUNCTIONS_URL',
    'VITE_FRONTEND_BASE_URL',
  ];

  const optionalViteVars = [
    'VITE_SUPABASE_PROJECT_ID',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ];

  let allGood = true;

  // Check required variables
  console.log('📋 Required Variables:');
  for (const varName of requiredViteVars) {
    const value = import.meta.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.error(`❌ ${varName}: MISSING`);
      allGood = false;
    }
  }

  // Check optional variables
  console.log('\n📝 Optional Variables:');
  for (const varName of optionalViteVars) {
    const value = import.meta.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`ℹ️  ${varName}: Not set (optional)`);
    }
  }

  // Check for common issues
  console.log('\n🔍 Environment Checks:');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
    console.warn('⚠️  VITE_SUPABASE_URL does not look like a Supabase URL');
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey && !anonKey.startsWith('eyJ')) {
    console.warn('⚠️  VITE_SUPABASE_ANON_KEY does not look like a JWT token');
  }

  const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;
  if (functionsUrl && !functionsUrl.includes('functions.supabase.co')) {
    console.warn('⚠️  VITE_SUPABASE_FUNCTIONS_URL does not look like a Supabase functions URL');
  }

  if (allGood) {
    console.log('\n🎉 All required environment variables are present!');
  } else {
    console.error('\n💥 Some required environment variables are missing');
    console.error('Make sure your .env file contains all VITE_ prefixed variables');
  }

  return allGood;
};

// Browser console helper
if (typeof window !== 'undefined') {
  // @ts-ignore - for browser console use
  window.checkEnv = checkEnvVariables;
  console.log('🔧 Environment checker available: window.checkEnv()');
}