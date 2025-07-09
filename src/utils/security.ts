// Security utilities for client-side protection

// LocalStorage with expiration
export const secureStorage = {
  setItem: (key: string, value: any, expirationHours: number = 24) => {
    const item = {
      value,
      created_at: Date.now(),
      expires_at: Date.now() + (expirationHours * 60 * 60 * 1000)
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check if expired
      if (Date.now() > parsed.expires_at) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      localStorage.removeItem(key);
      return null;
    }
  },

  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },

  clearExpired: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        secureStorage.getItem(key); // This will auto-remove expired items
      });
    } catch (error) {
      console.warn('Failed to clear expired localStorage items:', error);
    }
  }
};

// CSRF token generation and validation
export const csrf = {
  generateToken: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  storeToken: (token: string) => {
    secureStorage.setItem('csrf_token', token, 1); // 1 hour expiration
  },

  getToken: (): string | null => {
    return secureStorage.getItem('csrf_token');
  },

  validateToken: (token: string): boolean => {
    const storedToken = csrf.getToken();
    return storedToken === token && token.length === 64;
  }
};

// Input sanitization
export const sanitize = {
  // Remove potentially dangerous characters for SQL injection prevention
  sqlSafe: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  },

  // HTML escape for XSS prevention
  htmlEscape: (input: string): string => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },

  // URL validation
  isValidUrl: (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }
};

// Security headers helper
export const securityHeaders = {
  // Content Security Policy
  csp: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://uheksobnyedarrpgxhju.supabase.co wss://uheksobnyedarrpgxhju.supabase.co;",

  // Apply security headers (for server-side implementation)
  getHeaders: () => ({
    'Content-Security-Policy': securityHeaders.csp,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block'
  })
};

// Rate limiting for client-side requests
export class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();

  canMakeRequest(identifier: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

// Initialize rate limiter instance
export const rateLimiter = new ClientRateLimiter();

// Security event logging
export const logSecurityEvent = async (eventType: string, details: any = {}) => {
  try {
    // In a real implementation, this would send to a logging service
    console.warn(`Security Event [${eventType}]:`, details);
    
    // Could implement sending to Supabase edge function for server-side logging
    // await supabase.functions.invoke('log-security-event', {
    //   body: { eventType, details, timestamp: Date.now() }
    // });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};