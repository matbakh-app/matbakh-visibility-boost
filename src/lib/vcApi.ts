const API_BASE = import.meta.env.VITE_PUBLIC_API_BASE;
const VC_API_PROVIDER = import.meta.env.VITE_VC_API_PROVIDER || 'aws';

export interface VcStartPayload {
  email: string;
  name?: string;
  consent_privacy: true;
  consent_marketing?: boolean;
  locale?: 'de' | 'en';
}

export interface VcStartResponse {
  ok: boolean;
  token?: string;
}

export async function startVc(payload: VcStartPayload): Promise<VcStartResponse> {
  if (!API_BASE) {
    throw new Error('VITE_PUBLIC_API_BASE environment variable is not set');
  }

  // Log configuration for debugging
  console.log('VC API Configuration:', { 
    provider: VC_API_PROVIDER, 
    apiBase: API_BASE,
    endpoint: `${API_BASE}/vc/start`
  });

  try {
    const response = await fetch(`${API_BASE}/vc/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`VC API Error: HTTP ${response.status}`, await response.text().catch(() => 'No response body'));
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json() as VcStartResponse;
  } catch (error) {
    console.error('VC API Error:', error);
    throw error;
  }
}