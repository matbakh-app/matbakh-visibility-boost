/**
 * Cognito Authentication Service
 * Handles AWS Cognito authentication with migration support
 */

import * as AmplifyAuth from 'aws-amplify/auth';

interface CognitoUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  attributes?: Record<string, any>;
}

interface AuthStartRequest {
  email: string;
  name?: string;
}

interface AuthStartResponse {
  ok: boolean;
  error?: string;
}

class CognitoAuthError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'CognitoAuthError';
  }
}

import { Amplify } from 'aws-amplify';

/**
 * Initialize AWS Amplify configuration
 */
export function initializeCognito() {
  const awsConfig = {
    Auth: {
      Cognito: {
        region: 'eu-central-1',
        userPoolId: 'eu-central-1_farFjTHKf',
        userPoolClientId: '7q7d5dccq6rfecqnqkadklbr4q',
        loginWith: {
          oauth: {
            domain: 'matbakh-auth.auth.eu-central-1.amazoncognito.com',
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [window.location.origin + '/auth/callback'],
            redirectSignOut: [window.location.origin + '/auth/logout'],
            responseType: 'code'
          }
        }
      }
    }
  };

  Amplify.configure(awsConfig);
  console.log('✅ Cognito initialized');
}

/**
 * Sign in with email and password (for migration)
 */
export async function signInWithPassword(email: string, password: string): Promise<CognitoUser> {
  try {
    const { isSignedIn, nextStep } = await AmplifyAuth.signIn({ username: email, password });
    
    if (isSignedIn) {
      const user = await AmplifyAuth.getCurrentUser();
      const session = await AmplifyAuth.fetchAuthSession();
      const attributes = session.tokens?.idToken?.payload || {};
      
      return {
        id: attributes.sub as string,
        email: attributes.email as string,
        name: attributes.name as string || attributes.given_name as string,
        role: attributes['custom:role'] as string,
        attributes
      };
    }
    
    throw new CognitoAuthError('Sign in incomplete', 400, 'SIGN_IN_INCOMPLETE');
  } catch (error: any) {
    console.error('Cognito sign in error:', error);
    
    if (error.name === 'UserNotConfirmedException') {
      throw new CognitoAuthError('Please confirm your email address', 400, 'USER_NOT_CONFIRMED');
    } else if (error.name === 'NotAuthorizedException') {
      throw new CognitoAuthError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    } else if (error.name === 'UserNotFoundException') {
      throw new CognitoAuthError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    throw new CognitoAuthError('Sign in failed', 500, 'SIGN_IN_ERROR');
  }
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string, attributes?: Record<string, string>) {
  try {
    const result = await AmplifyAuth.signUp({
      username: email,
      password,
      attributes: {
        email,
        ...attributes
      }
    });
    
    return result;
  } catch (error: any) {
    console.error('Cognito sign up error:', error);
    
    if (error.code === 'UsernameExistsException') {
      throw new CognitoAuthError('User already exists', 409, 'USER_EXISTS');
    } else if (error.code === 'InvalidPasswordException') {
      throw new CognitoAuthError('Password does not meet requirements', 400, 'INVALID_PASSWORD');
    }
    
    throw new CognitoAuthError('Sign up failed', 500, 'SIGN_UP_ERROR');
  }
}

/**
 * Confirm sign up with verification code
 */
export async function confirmSignUp(email: string, code: string) {
  try {
    const result = await AmplifyAuth.confirmSignUp({ username: email, confirmationCode: code });
    return result;
  } catch (error: any) {
    console.error('Cognito confirm sign up error:', error);
    
    if (error.code === 'CodeMismatchException') {
      throw new CognitoAuthError('Invalid verification code', 400, 'INVALID_CODE');
    } else if (error.code === 'ExpiredCodeException') {
      throw new CognitoAuthError('Verification code expired', 400, 'EXPIRED_CODE');
    }
    
    throw new CognitoAuthError('Confirmation failed', 500, 'CONFIRM_ERROR');
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<CognitoUser | null> {
  try {
    const user = await AmplifyAuth.getCurrentUser();
    const session = await AmplifyAuth.fetchAuthSession();
    const attributes = session.tokens?.idToken?.payload || {};
    
    return {
      id: attributes.sub as string,
      email: attributes.email as string,
      name: (attributes.name as string) || (attributes.given_name as string),
      role: attributes['custom:role'] as string,
      attributes
    };
  } catch (error) {
    console.log('No authenticated user');
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await AmplifyAuth.getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<void> {
  try {
    await AmplifyAuth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw new CognitoAuthError('Sign out failed', 500, 'SIGN_OUT_ERROR');
  }
}

/**
 * Forgot password - send reset code
 */
export async function forgotPassword(email: string) {
  try {
    const result = await AmplifyAuth.resetPassword({ username: email });
    return result;
  } catch (error: any) {
    console.error('Forgot password error:', error);
    
    if (error.code === 'UserNotFoundException') {
      throw new CognitoAuthError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    throw new CognitoAuthError('Password reset failed', 500, 'FORGOT_PASSWORD_ERROR');
  }
}

/**
 * Reset password with code
 */
export async function forgotPasswordSubmit(email: string, code: string, newPassword: string) {
  try {
    const result = await AmplifyAuth.confirmResetPassword({ 
      username: email, 
      confirmationCode: code, 
      newPassword 
    });
    return result;
  } catch (error: any) {
    console.error('Forgot password submit error:', error);
    
    if (error.code === 'CodeMismatchException') {
      throw new CognitoAuthError('Invalid reset code', 400, 'INVALID_CODE');
    } else if (error.code === 'ExpiredCodeException') {
      throw new CognitoAuthError('Reset code expired', 400, 'EXPIRED_CODE');
    }
    
    throw new CognitoAuthError('Password reset failed', 500, 'RESET_PASSWORD_ERROR');
  }
}

/**
 * Federated sign in (Google OAuth)
 */
export async function federatedSignIn(provider: 'Google') {
  try {
    await AmplifyAuth.signInWithRedirect({ provider: { custom: provider } });
  } catch (error) {
    console.error('Federated sign in error:', error);
    throw new CognitoAuthError('Social login failed', 500, 'FEDERATED_SIGN_IN_ERROR');
  }
}

/**
 * Legacy compatibility: Start passwordless auth (fallback to current system)
 */
export async function startAuth(email: string, name?: string): Promise<AuthStartResponse> {
  // For now, fallback to existing auth system during migration
  const { startAuth: legacyStartAuth } = await import('./auth');
  return legacyStartAuth(email, name);
}

/**
 * Handle auth callback (supports both JWT and Cognito)
 */
export function handleAuthCallback(): { token: string | null; error: string | null } {
  // Check for Cognito callback first
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (code) {
    // This is a Cognito OAuth callback
    console.log('✅ Cognito OAuth callback detected');
    return { token: code, error: null };
  }
  
  // Fallback to JWT handling
  const { handleAuthCallback: legacyHandleCallback } = require('./auth');
  return legacyHandleCallback();
}

/**
 * Migration helper: Check if user exists in Cognito
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    // This is a simplified check - in production you'd use Admin APIs
    await AmplifyAuth.resetPassword({ username: email });
    return true;
  } catch (error: any) {
    if (error.code === 'UserNotFoundException') {
      return false;
    }
    // If other error, assume user exists to be safe
    return true;
  }
}

export { CognitoAuthError };
export type { CognitoUser };