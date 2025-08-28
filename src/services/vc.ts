/**
 * Visibility Check Service - AWS Provider
 * Handles API calls to AWS Lambda for visibility check operations
 */

interface VCStartRequest {
  email: string;
  name?: string;
  marketing?: boolean;
  locale?: 'de' | 'en';
}

interface VCStartResponse {
  ok: boolean;
  token?: string;
  error?: string;
}

class VCServiceError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'VCServiceError';
  }
}

/**
 * Validates environment configuration for VC service
 */
function validateEnvironment(): { apiBase: string; provider: string } {
  const provider = import.meta.env.VITE_VC_API_PROVIDER || 'aws';
  const apiBase = import.meta.env.VITE_PUBLIC_API_BASE || 'https://uheksobnyedarrpgxhju.functions.supabase.co/v1';

  // TEMPORARY: Use hardcoded values if env vars are missing
  const finalApiBase = apiBase || 'https://uheksobnyedarrpgxhju.functions.supabase.co/v1';
  const finalProvider = provider || 'aws';

  console.log('VC Service Environment:', { 
    provider: finalProvider, 
    apiBase: finalApiBase,
    envProvider: import.meta.env.VITE_VC_API_PROVIDER,
    envApiBase: import.meta.env.VITE_PUBLIC_API_BASE
  });

  if (finalProvider !== 'aws') {
    throw new VCServiceError(
      `Invalid VC API provider: ${finalProvider}. Expected 'aws'`,
      0,
      'INVALID_PROVIDER'
    );
  }

  if (!finalApiBase) {
    throw new VCServiceError(
      'Missing VITE_PUBLIC_API_BASE environment variable',
      0,
      'MISSING_API_BASE'
    );
  }

  return { apiBase: finalApiBase, provider: finalProvider };
}

/**
 * Starts a visibility check by sending email for DOI confirmation
 */
export async function startVisibilityCheck(
  email: string,
  name?: string,
  marketing: boolean = false,
  locale: 'de' | 'en' = 'de'
): Promise<VCStartResponse> {
  const { apiBase } = validateEnvironment();
  
  const url = `${apiBase}/vc/start`;
  const payload: VCStartRequest = {
    email: email.trim(),
    name: name?.trim(),
    marketing,
    locale
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
          throw new VCServiceError('Invalid email address', response.status, 'INVALID_EMAIL');
        case 429:
          throw new VCServiceError('Too many requests. Please try again later.', response.status, 'RATE_LIMIT');
        case 500:
          throw new VCServiceError('Server error. Please try again later.', response.status, 'SERVER_ERROR');
        default:
          throw new VCServiceError(`Request failed with status ${response.status}`, response.status, 'HTTP_ERROR');
      }
    }

    const data: VCStartResponse = await response.json();
    
    if (!data.ok) {
      throw new VCServiceError(
        data.error || 'Unknown server error',
        response.status,
        'API_ERROR'
      );
    }

    return data;
  } catch (error) {
    if (error instanceof VCServiceError) {
      throw error;
    }

    // Network or parsing errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new VCServiceError(
        'Network error. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new VCServiceError(
      'An unexpected error occurred. Please try again.',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Get environment info for debugging (dev mode only)
 */
export function getVCEnvironmentInfo() {
  if (import.meta.env.PROD) {
    return null;
  }

  return {
    provider: import.meta.env.VITE_VC_API_PROVIDER,
    apiBase: import.meta.env.VITE_PUBLIC_API_BASE,
    env: import.meta.env.MODE
  };
}