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
export async function startAuth(email: string, name?: string): Promise<AuthStartResponse> {
  try {
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    let data: any = null;
    try { data = await response.json(); } catch { /* tolerate non-JSON */ }

    if (response.ok && (data?.ok !== false)) {
      return { ok: true };
    }
    if (!response.ok || data?.ok === false) {
      throw new AuthServiceError(
        (data && data.error) || 'Unknown server error',
        response.status,
        'API_ERROR'
      );
    }
    return { ok: true };
  } catch (err: any) {
    if (err instanceof AuthServiceError) throw err;
    // Tests erwarten exakt "Network error" bei echten Netzfehlern
    throw new AuthServiceError('Network error', 0, 'NETWORK_ERROR');
  }
}

/**
 * Handle JWT from URL fragment after magic link callback
 */
export function handleAuthCallback(): { token: string | null; error: string | null } {
  try {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const searchParams = new URLSearchParams(url.search);
    const token =
      hashParams.get('token') ||
      hashParams.get('access_token') ||
      hashParams.get('id_token') ||
      hashParams.get('jwt') ||
      searchParams.get('token') ||
      searchParams.get('access_token') ||
      searchParams.get('id_token') ||
      searchParams.get('jwt');

    if (!token) {
      return { token: null, error: 'No token found in URL' };
    }
    // sehr einfache JWT-Form-Validierung: xxx.yyy.zzz
    if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
      return { token: null, error: 'Invalid token format' };
    }
    
    localStorage.setItem('auth_token', token);
    return { token, error: null };
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
function decodeJwt(t: string) {
  const b64 = t.split('.')[1];
  const norm = b64.replace(/-/g, '+').replace(/_/g, '/');
  const json = typeof atob === 'function'
    ? atob(norm)
    : Buffer.from(norm, 'base64').toString('utf8');
  return JSON.parse(json);
}

export function getCurrentUser(): { email: string; id: string; name?: string } | null {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  
  try {
    const p = decodeJwt(token);
    const now = Math.floor(Date.now()/1000);
    if (p.exp && p.exp < now) return null;
    
    return {
      id: p.id ?? p.sub,
      email: p.email,
      name: p.name ?? p.username ?? p.user_name
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