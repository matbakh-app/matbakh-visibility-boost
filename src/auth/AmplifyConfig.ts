/**
 * AWS Amplify Configuration for matbakh.app
 * Phase A3.2 - Cognito Auth Integration
 * 
 * This file configures AWS Amplify with Cognito User Pool settings
 * based on environment variables from .env.cognito
 */

import { Amplify } from 'aws-amplify';

// Environment variables validation
const requiredEnvVars = {
  VITE_AWS_REGION: import.meta.env.VITE_AWS_REGION,
  VITE_COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  VITE_COGNITO_USER_POOL_WEB_CLIENT_ID: import.meta.env.VITE_COGNITO_USER_POOL_WEB_CLIENT_ID,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development'
};

// Validate required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
    'Please check your .env file and ensure all Cognito configuration is set.'
  );
}

// Amplify configuration object
const amplifyConfig = {
  Auth: {
    // Cognito User Pool configuration
    region: requiredEnvVars.VITE_AWS_REGION,
    userPoolId: requiredEnvVars.VITE_COGNITO_USER_POOL_ID,
    userPoolWebClientId: requiredEnvVars.VITE_COGNITO_USER_POOL_WEB_CLIENT_ID,
    
    // Authentication flow configuration
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH',
    
    // Cookie storage configuration (environment-specific)
    cookieStorage: {
      domain: requiredEnvVars.VITE_ENVIRONMENT === 'production' ? '.matbakh.app' : 'localhost',
      path: '/',
      expires: 30, // 30 days
      secure: requiredEnvVars.VITE_ENVIRONMENT === 'production',
      sameSite: 'strict' as const
    },
    
    // Password policy (matches Cognito User Pool settings)
    passwordPolicy: {
      minimumLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false
    }
  },
  
  API: {
    endpoints: [
      {
        name: 'matbakhAPI',
        endpoint: requiredEnvVars.VITE_API_BASE_URL,
        region: requiredEnvVars.VITE_AWS_REGION,
        custom_header: async () => {
          try {
            const { Auth } = await import('aws-amplify');
            const session = await Auth.currentSession();
            return {
              Authorization: `Bearer ${session.getAccessToken().getJwtToken()}`
            };
          } catch (error) {
            console.warn('Failed to get auth token for API request:', error);
            return {};
          }
        }
      }
    ]
  }
};

/**
 * Initialize Amplify configuration
 * This should be called once at app startup
 */
export const configureAmplify = (): void => {
  try {
    Amplify.configure(amplifyConfig);
    
    if (requiredEnvVars.VITE_ENVIRONMENT === 'development') {
      console.log('🔐 Amplify configured for development environment');
      console.log('📋 Configuration:', {
        region: amplifyConfig.Auth.region,
        userPoolId: amplifyConfig.Auth.userPoolId,
        apiEndpoint: amplifyConfig.API.endpoints[0].endpoint
      });
    }
  } catch (error) {
    console.error('❌ Failed to configure Amplify:', error);
    throw new Error('Amplify configuration failed. Please check your environment variables.');
  }
};

/**
 * Get current Amplify configuration
 * Useful for debugging and testing
 */
export const getAmplifyConfig = () => {
  return {
    ...amplifyConfig,
    // Don't expose sensitive data in logs
    Auth: {
      ...amplifyConfig.Auth,
      userPoolWebClientId: amplifyConfig.Auth.userPoolWebClientId.substring(0, 8) + '...'
    }
  };
};

/**
 * Environment-specific configuration helpers
 */
export const isProduction = () => requiredEnvVars.VITE_ENVIRONMENT === 'production';
export const isDevelopment = () => requiredEnvVars.VITE_ENVIRONMENT === 'development';
export const getEnvironment = () => requiredEnvVars.VITE_ENVIRONMENT;

/**
 * API configuration helpers
 */
export const getAPIConfig = () => ({
  baseURL: requiredEnvVars.VITE_API_BASE_URL,
  region: requiredEnvVars.VITE_AWS_REGION,
  timeout: isProduction() ? 10000 : 30000, // 10s prod, 30s dev
  retries: isProduction() ? 3 : 1
});

// Export configuration for external use
export { amplifyConfig };
export default amplifyConfig;