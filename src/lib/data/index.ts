/**
 * Data Adapter Layer - Kiro Migration Helper
 * 
 * Provides a clean abstraction over data access, allowing gradual migration
 * from Supabase to AWS/Lambda endpoints without breaking existing code.
 */

type HttpOpts = { 
  method?: string; 
  body?: any; 
  headers?: Record<string, string>;
};

async function http<T>(url: string, opts: HttpOpts = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: { 
      'Content-Type': 'application/json', 
      ...(opts.headers || {}) 
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  
  if (!res.ok) {
    throw new Error(`API ${res.status} ${url}: ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}

// Stub function for endpoints not yet migrated
function notImplemented(feature: string): never {
  if (process.env.NODE_ENV === 'test') {
    // In tests, return mock data instead of throwing
    return {} as never;
  }
  throw new Error(`${feature} endpoint not yet migrated to AWS. Add to migration backlog.`);
}

export const dataApi = {
  // KPI & Analytics
  kpis: {
    summary(restaurantId: string) {
      return http<{ score: number; trends: any[] }>(`/api/kpi/summary?rid=${encodeURIComponent(restaurantId)}`);
    },
    history(restaurantId: string, period: string = '30d') {
      return http<{ data: any[] }>(`/api/kpi/history?rid=${encodeURIComponent(restaurantId)}&period=${period}`);
    },
    // Stub for not-yet-migrated endpoints
    diversified() { return notImplemented('KPI diversified analysis'); },
    enhanced() { return notImplemented('Enhanced KPI analysis'); }
  },

  // Authentication & Profile
  auth: {
    profile() { 
      return http<{ id: string; email: string; role: string }>('/api/auth/profile'); 
    },
    updateProfile(data: any) {
      return http('/api/auth/profile', { method: 'PUT', body: data });
    }
  },

  // Business Data
  business: {
    contact(restaurantId: string) {
      return http<{ name: string; address: any; phone: string }>(`/api/business/contact?rid=${encodeURIComponent(restaurantId)}`);
    },
    categories(restaurantId: string) {
      return http<{ categories: string[] }>(`/api/business/categories?rid=${encodeURIComponent(restaurantId)}`);
    },
    // Stubs for complex migrations
    smartCategories() { return notImplemented('Smart category selection'); },
    diversifiedCategories() { return notImplemented('Diversified category selection'); }
  },

  // Visibility Check & VC System
  vc: {
    start(data: any) {
      return http<{ id: string; status: string }>('/api/vc/start', { method: 'POST', body: data });
    },
    result(vcId: string) {
      return http<{ score: number; analysis: any }>(`/api/vc/result/${encodeURIComponent(vcId)}`);
    },
    enhanced(restaurantId: string) {
      return notImplemented('Enhanced visibility check');
    }
  },

  // Google & External Integrations
  google: {
    connection(restaurantId: string) {
      return http<{ connected: boolean; profile: any }>(`/api/google/connection?rid=${encodeURIComponent(restaurantId)}`);
    },
    // Stub - complex OAuth flow
    connect() { return notImplemented('Google OAuth connection'); }
  },

  // Facebook & Social
  facebook: {
    conversions(restaurantId: string) {
      return notImplemented('Facebook conversions tracking');
    }
  },

  // AI & Recommendations
  ai: {
    recommendations(restaurantId: string, type: string = 'general') {
      return http<{ recommendations: any[] }>(`/api/ai/recommendations?rid=${encodeURIComponent(restaurantId)}&type=${type}`);
    },
    bedrock: {
      categories(prompt: string) {
        return notImplemented('Bedrock category suggestions');
      }
    }
  },

  // Feature Access & Permissions
  features: {
    access(userId: string, feature: string) {
      return http<{ hasAccess: boolean; plan: string }>(`/api/features/access?uid=${encodeURIComponent(userId)}&feature=${feature}`);
    }
  },

  // Partner & Multi-tenant
  partner: {
    profile(partnerId: string) {
      return http<{ id: string; name: string; tier: string }>(`/api/partner/profile/${encodeURIComponent(partnerId)}`);
    }
  },

  // Realtime & Events (complex migration)
  realtime: {
    connection() { 
      return notImplemented('Realtime connection - consider WebSocket/SSE alternative'); 
    }
  }
};

// Helper for gradual migration
export function createMigrationStub(feature: string, fallbackFn?: () => any) {
  return () => {
    console.warn(`🚧 Migration needed: ${feature}`);
    if (fallbackFn) return fallbackFn();
    return notImplemented(feature);
  };
}

// Type helpers for better DX
export type DataApi = typeof dataApi;
export type KpiSummary = Awaited<ReturnType<typeof dataApi.kpis.summary>>;
export type AuthProfile = Awaited<ReturnType<typeof dataApi.auth.profile>>;
export type VcResult = Awaited<ReturnType<typeof dataApi.vc.result>>;

export default dataApi;