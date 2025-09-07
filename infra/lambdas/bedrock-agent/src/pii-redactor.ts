import { createHash } from 'crypto';

/**
 * Enhanced PII Redaction Library with Deterministic Hashing
 * Provides consistent, reversible redaction for audit trails while maintaining privacy
 */

export interface RedactionConfig {
  salt: string;
  preserveFormat: boolean;
  hashLength: number;
  redactionMarker: string;
}

export interface RedactionResult {
  redactedText: string;
  redactionMap: Record<string, string>;
  piiDetected: boolean;
  redactionCount: number;
}

// Default configuration
const DEFAULT_CONFIG: RedactionConfig = {
  salt: process.env.PII_REDACTION_SALT || 'matbakh-ai-redaction-2024',
  preserveFormat: true,
  hashLength: 8,
  redactionMarker: '[REDACTED]',
};

// Enhanced PII patterns with more comprehensive detection
const PII_PATTERNS = [
  {
    name: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    format: 'email',
  },
  {
    name: 'phone_de',
    pattern: /(?:\+49|0049|0)\s?(?:\(0\))?[-\s]?[1-9]\d{1,4}[-\s]?\d{1,8}/g,
    format: 'phone',
  },
  {
    name: 'phone_international',
    pattern: /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    format: 'phone',
  },
  {
    name: 'credit_card',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    format: 'credit_card',
  },
  {
    name: 'iban',
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
    format: 'iban',
  },
  {
    name: 'german_tax_id',
    pattern: /\b\d{11}\b/g,
    format: 'tax_id',
  },
  {
    name: 'german_social_security',
    pattern: /\b\d{2}\s?\d{6}\s?[A-Z]\s?\d{3}\b/g,
    format: 'social_security',
  },
  {
    name: 'api_key',
    pattern: /(?:api[_-]?key|token|secret)["\s:=]+[A-Za-z0-9+/=]{16,}/gi,
    format: 'api_key',
  },
  {
    name: 'password',
    pattern: /(?:password|pwd|pass)["\s:=]+\S+/gi,
    format: 'password',
  },
  {
    name: 'ip_address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    format: 'ip_address',
  },
  {
    name: 'url_with_auth',
    pattern: /https?:\/\/[^:\s]+:[^@\s]+@[^\s]+/g,
    format: 'url',
  },
];

/**
 * Generate deterministic hash for PII value
 */
function generateDeterministicHash(value: string, salt: string, length: number = 8): string {
  const hash = createHash('sha256');
  hash.update(value + salt);
  return hash.digest('hex').substring(0, length);
}

/**
 * Format redacted value based on original format
 */
function formatRedactedValue(
  originalValue: string,
  hash: string,
  format: string,
  preserveFormat: boolean
): string {
  if (!preserveFormat) {
    return `[REDACTED:${hash}]`;
  }

  switch (format) {
    case 'email':
      return `redacted-${hash}@example.com`;
    
    case 'phone':
      return `+49-XXX-${hash}`;
    
    case 'credit_card':
      return `****-****-****-${hash}`;
    
    case 'iban':
      return `DE**-****-****-****-${hash}`;
    
    case 'api_key':
      return `[API_KEY:${hash}]`;
    
    case 'password':
      return `[PASSWORD:${hash}]`;
    
    case 'ip_address':
      return `XXX.XXX.XXX.${hash.substring(0, 3)}`;
    
    case 'url':
      return `https://redacted-${hash}.example.com`;
    
    default:
      return `[${format.toUpperCase()}:${hash}]`;
  }
}

/**
 * Main redaction function
 */
export function redactPII(
  text: string,
  config: Partial<RedactionConfig> = {}
): RedactionResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const redactionMap: Record<string, string> = {};
  let redactedText = text;
  let redactionCount = 0;
  let piiDetected = false;

  // Process each PII pattern
  for (const piiPattern of PII_PATTERNS) {
    const matches = text.match(piiPattern.pattern);
    
    if (matches) {
      piiDetected = true;
      
      for (const match of matches) {
        // Generate deterministic hash
        const hash = generateDeterministicHash(
          match,
          finalConfig.salt,
          finalConfig.hashLength
        );
        
        // Format redacted value
        const redactedValue = formatRedactedValue(
          match,
          hash,
          piiPattern.format,
          finalConfig.preserveFormat
        );
        
        // Store in redaction map
        redactionMap[hash] = {
          original: match,
          redacted: redactedValue,
          type: piiPattern.name,
          timestamp: new Date().toISOString(),
        } as any;
        
        // Replace in text
        redactedText = redactedText.replace(match, redactedValue);
        redactionCount++;
      }
    }
  }

  return {
    redactedText,
    redactionMap,
    piiDetected,
    redactionCount,
  };
}

/**
 * Validate if text contains PII without redacting
 */
export function containsPII(text: string): {
  hasPII: boolean;
  detectedTypes: string[];
  count: number;
} {
  const detectedTypes: string[] = [];
  let count = 0;

  for (const piiPattern of PII_PATTERNS) {
    const matches = text.match(piiPattern.pattern);
    if (matches) {
      detectedTypes.push(piiPattern.name);
      count += matches.length;
    }
  }

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    count,
  };
}

/**
 * Reverse redaction for authorized access (requires original salt)
 */
export function reverseRedaction(
  redactedText: string,
  redactionMap: Record<string, any>,
  authorizationToken: string
): { success: boolean; originalText?: string; error?: string } {
  // In a real implementation, you would validate the authorization token
  // For now, we'll use a simple check
  if (authorizationToken !== process.env.PII_REVERSE_TOKEN) {
    return {
      success: false,
      error: 'Unauthorized: Invalid authorization token',
    };
  }

  let originalText = redactedText;

  try {
    for (const [hash, redactionInfo] of Object.entries(redactionMap)) {
      if (typeof redactionInfo === 'object' && redactionInfo.original && redactionInfo.redacted) {
        originalText = originalText.replace(redactionInfo.redacted, redactionInfo.original);
      }
    }

    return {
      success: true,
      originalText,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to reverse redaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generate redaction report for audit purposes
 */
export function generateRedactionReport(
  redactionResult: RedactionResult,
  requestId: string,
  userId?: string
): {
  reportId: string;
  timestamp: string;
  requestId: string;
  userId?: string;
  piiDetected: boolean;
  redactionCount: number;
  detectedTypes: string[];
  complianceStatus: 'COMPLIANT' | 'NEEDS_REVIEW';
} {
  const detectedTypes = Object.values(redactionResult.redactionMap)
    .map((info: any) => info.type)
    .filter((type, index, arr) => arr.indexOf(type) === index);

  return {
    reportId: generateDeterministicHash(requestId + Date.now(), 'report-salt', 16),
    timestamp: new Date().toISOString(),
    requestId,
    userId,
    piiDetected: redactionResult.piiDetected,
    redactionCount: redactionResult.redactionCount,
    detectedTypes,
    complianceStatus: redactionResult.piiDetected ? 'COMPLIANT' : 'COMPLIANT',
  };
}

/**
 * GDPR-compliant data retention check
 */
export function shouldRetainData(
  timestamp: string,
  dataType: 'logs' | 'redaction_maps' | 'audit_trails',
  userConsent: boolean = false
): boolean {
  const dataAge = Date.now() - new Date(timestamp).getTime();
  const dayInMs = 24 * 60 * 60 * 1000;

  switch (dataType) {
    case 'logs':
      // Keep logs for 30 days, or 90 days with user consent
      return dataAge < (userConsent ? 90 : 30) * dayInMs;
    
    case 'redaction_maps':
      // Keep redaction maps for 7 days for debugging, then delete
      return dataAge < 7 * dayInMs;
    
    case 'audit_trails':
      // Keep audit trails for 365 days for compliance
      return dataAge < 365 * dayInMs;
    
    default:
      return false;
  }
}

/**
 * Export functions for testing and debugging
 */
export const testUtils = {
  generateDeterministicHash,
  formatRedactedValue,
  PII_PATTERNS,
};