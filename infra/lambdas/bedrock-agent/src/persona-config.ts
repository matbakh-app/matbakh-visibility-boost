/**
 * Configurable Persona Detection & Switching Parameters
 * Centralized configuration for weights, thresholds, and behavior
 */

export const DETECTION_WEIGHTS = {
  heuristic: 0.4,
  behavioral: 0.4,
  hybrid: 0.2,
  fallback: 0.1
} as const;

export const SWITCHING_CONFIG = {
  minConfidence: 0.7,
  minDelta: 0.15,
  dwellMs: 2 * 60 * 1000, // 2 minutes minimum between switches
  emaAlpha: 0.35, // Exponential moving average alpha for blending
  hysteresisMargin: 0.1 // Additional margin to prevent flapping
} as const;

export const VALIDATION_LIMITS = {
  maxTechnicalTerms: 50,
  maxOverwhelmedSignals: 50,
  maxQuickActions: 20,
  maxDetailedViews: 20,
  maxSessionDuration: 7200, // 2 hours max
  minSessionForReliability: 60 // 1 minute minimum
} as const;

export const PERSONA_BUDGETS = {
  'Der Zeitknappe': {
    maxTokens: 600,
    maxSections: 3,
    priorityOrder: ['quick_wins', 'summary', 'next_steps']
  },
  'Der Überforderte': {
    maxTokens: 1000,
    maxSections: 4,
    priorityOrder: ['summary', 'quick_wins', 'next_steps', 'swot']
  },
  'Der Skeptiker': {
    maxTokens: 1500,
    maxSections: 6,
    priorityOrder: ['summary', 'swot', 'porters', 'quick_wins', 'bsc', 'next_steps']
  },
  'Der Profi': {
    maxTokens: 2000,
    maxSections: 8,
    priorityOrder: ['summary', 'swot', 'porters', 'bsc', 'quick_wins', 'next_steps']
  }
} as const;

export const FIELD_SANITIZATION = {
  business_name: {
    maxLength: 120,
    allowedChars: /^[a-zA-ZäöüÄÖÜß0-9\s\-&.,'()]+$/,
    stripControlChars: true
  },
  brand_voice: {
    maxLength: 40,
    allowedChars: /^[a-zA-ZäöüÄÖÜß\s\-]+$/,
    stripControlChars: true
  },
  business_category: {
    maxLength: 80,
    allowedChars: /^[a-zA-ZäöüÄÖÜß0-9\s\-&.,'()]+$/,
    stripControlChars: true
  },
  business_location: {
    maxLength: 100,
    allowedChars: /^[a-zA-ZäöüÄÖÜß0-9\s\-,.()]+$/,
    stripControlChars: true
  },
  target_audience: {
    maxLength: 200,
    allowedChars: /^[a-zA-ZäöüÄÖÜß0-9\s\-,.()]+$/,
    stripControlChars: true
  }
} as const;

export const LOCALE_CONFIG = {
  defaultLocale: 'de-DE',
  supportedLocales: ['de-DE', 'en-US'],
  numberFormat: {
    'de-DE': {
      decimal: ',',
      thousands: '.',
      currency: '€'
    },
    'en-US': {
      decimal: '.',
      thousands: ',',
      currency: '$'
    }
  }
} as const;

/**
 * Sanitize template variable based on field configuration
 */
export function sanitizeTemplateVariable(
  fieldName: string, 
  value: any
): string {
  if (value === null || value === undefined) {
    return '';
  }

  let stringValue = String(value);
  const config = FIELD_SANITIZATION[fieldName as keyof typeof FIELD_SANITIZATION];
  
  if (!config) {
    // Default sanitization for unknown fields
    stringValue = stringValue.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control chars
    return stringValue.slice(0, 200); // Default max length
  }

  // Strip control characters if configured
  if (config.stripControlChars) {
    stringValue = stringValue.replace(/[\x00-\x1F\x7F]/g, '');
  }

  // Apply character whitelist
  if (config.allowedChars && !config.allowedChars.test(stringValue)) {
    // Keep only allowed characters
    stringValue = stringValue.replace(new RegExp(`[^${config.allowedChars.source.slice(2, -2)}]`, 'g'), '');
  }

  // Apply length limit
  if (config.maxLength) {
    stringValue = stringValue.slice(0, config.maxLength);
  }

  return stringValue.trim();
}

/**
 * Format number according to locale
 */
export function formatNumber(
  value: number, 
  locale: string = LOCALE_CONFIG.defaultLocale,
  type: 'decimal' | 'currency' = 'decimal'
): string {
  const config = LOCALE_CONFIG.numberFormat[locale as keyof typeof LOCALE_CONFIG.numberFormat];
  if (!config) {
    return value.toString();
  }

  if (type === 'currency') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: locale === 'de-DE' ? 'EUR' : 'USD'
    }).format(value);
  }

  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Get persona-specific token budget
 */
export function getPersonaBudget(persona: keyof typeof PERSONA_BUDGETS) {
  return PERSONA_BUDGETS[persona] || PERSONA_BUDGETS['Der Überforderte'];
}

/**
 * Clamp numeric values to prevent outliers
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Feature flags for persona system
 */
export const FEATURE_FLAGS = {
  enablePersonaBlending: true,
  enableHysteresis: true,
  enableStrictValidation: true,
  enableTokenBudgets: true,
  enableFieldSanitization: true,
  enableRepairMode: true
} as const;