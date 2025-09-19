/**
 * Authentication Service - AWS Lambda Provider
 * Handles passwordless authentication via magic links
 */

interface AuthStartRequest {
  email: string;
  name?: string;
}

interface AuthStartResponse {
  ok: boolean;
  error?: string;
}

class AuthServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/**
 * Validates environment configuration for Auth service
 */
function validateEnvironment(): { apiBase: string } {
  // Statt import.meta.env:
  const env = (globalThis as any).importMetaEnv ?? process.env;
  const apiBase = env.VITE_PUBLIC_API_BASE || 'https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod';

  console.log('Auth Service Environment:', { 
    apiBase,
    envApiBase: env.VITE_PUBLIC_API_BASE
  });

  if (!apiBase) {
    throw new AuthServiceError(
      'Missing VITE_PUBLIC_API_BASE environment variable',
      0,
      'MISSING_API_BASE'
    );
  }

  return { apiBase };
}

/**
 * Starts passwordless authentication by sending magic link email
 */
export async function startAuth(
  email: string,
  name?: string
): Promise<AuthStartResponse> {
  const { apiBase } = validateEnvironment();
  
  const url = `${apiBase}/auth/start`;
  const payload: AuthStartRequest = {
    email: email.trim(),
    name: name?.trim()
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Handle specific HTTP status codes
      switch (response.status) {
        case 400:
          throw new AuthServiceError('Invalid email address', response.status, 'INVALID_EMAIL');
        case 429:
          throw new AuthServiceError('Too many requests. Please try again later.', response.status, 'RATE_LIMIT');
        case 500:
          throw new AuthServiceError('Server error. Please try again later.', response.status, 'SERVER_ERROR');
        default:
          throw new AuthServiceError(`Request failed with status ${response.status}`, response.status, 'HTTP_ERROR');
      }
    }

    const data: AuthStartResponse = await response.json();
    
    if (!data.ok) {
      throw new AuthServiceError(
        data.error || 'Unknown server error',
        response.status,
        'API_ERROR'
      );
    }

    return data;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }

    // Network or parsing errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AuthServiceError(
        'Network error. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new AuthServiceError(
      'An unexpected error occurred. Please try again.',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Handle JWT from URL fragment after magic link callback
 */
export function handleAuthCallback(): { token: string | null; error: string | null } {
  try {
    // Check for JWT in URL fragment (#sid=JWT_TOKEN)
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);
    const token = params.get('sid');
    
    if (token) {
      // Store token in localStorage for now (until we have proper cookies)
      localStorage.setItem('auth_token', token);
      
      // Clear the fragment from URL
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      
      return { token, error: null };
    }
    
    // Check if token is already in localStorage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      return { token: storedToken, error: null };
    }
    
    return { token: null, error: null };
  } catch (error) {
    console.error('Auth callback handling failed:', error);
    return { token: null, error: 'Failed to process authentication' };
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;
  
  try {
    // Basic JWT validation (check if it's not expired)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp > now;
  } catch (error) {
    console.error('Token validation failed:', error);
    localStorage.removeItem('auth_token');
    return false;
  }
}

/**
 * Get current user info from JWT token
 */
export function getCurrentUser(): { email: string; id: string; name?: string } | null {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name
    };
  } catch (error) {
    console.error('Failed to parse user from token:', error);
    return null;
  }
}

/**
 * Sign out user
 */
export function signOut(): void {
  localStorage.removeItem('auth_token');
  // Redirect to home or login page
  window.location.href = '/';
}

/**
 * Get environment info for debugging (dev mode only)
 */
export function getAuthEnvironmentInfo() {
  // Statt import.meta.env:
  const env = (globalThis as any).importMetaEnv ?? process.env;
  if (env.PROD) {
    return null;
  }

  return {
    apiBase: env.VITE_PUBLIC_API_BASE,
    env: env.MODE,
    hasToken: !!localStorage.getItem('auth_token')
  };
}