/**
 * Strict Output Contracts for Bedrock AI Core
 * Enforces JSON-only responses with validation and repair mechanisms
 */

export const VC_ANALYSIS_SCHEMA = {
  type: "object",
  required: ["summary", "swot", "porters", "bsc", "quick_wins", "next_steps", "disclaimer"],
  properties: {
    summary: { 
      type: "string", 
      maxLength: 800,
      description: "Executive summary of the visibility analysis"
    },
    swot: {
      type: "object",
      required: ["strengths", "weaknesses", "opportunities", "threats"],
      properties: {
        strengths: { 
          type: "array", 
          items: { type: "string", maxLength: 200 }, 
          maxItems: 8,
          description: "Current business strengths"
        },
        weaknesses: { 
          type: "array", 
          items: { type: "string", maxLength: 200 }, 
          maxItems: 8,
          description: "Areas needing improvement"
        },
        opportunities: { 
          type: "array", 
          items: { type: "string", maxLength: 200 }, 
          maxItems: 8,
          description: "Market opportunities"
        },
        threats: { 
          type: "array", 
          items: { type: "string", maxLength: 200 }, 
          maxItems: 8,
          description: "Potential risks and threats"
        }
      }
    },
    porters: {
      type: "object",
      required: ["competitive_rivalry", "supplier_power", "buyer_power", "threat_substitutes", "barriers_entry"],
      properties: {
        competitive_rivalry: {
          type: "object",
          required: ["score", "description"],
          properties: {
            score: { type: "number", minimum: 1, maximum: 5 },
            description: { type: "string", maxLength: 300 }
          }
        },
        supplier_power: {
          type: "object",
          required: ["score", "description"],
          properties: {
            score: { type: "number", minimum: 1, maximum: 5 },
            description: { type: "string", maxLength: 300 }
          }
        },
        buyer_power: {
          type: "object",
          required: ["score", "description"],
          properties: {
            score: { type: "number", minimum: 1, maximum: 5 },
            description: { type: "string", maxLength: 300 }
          }
        },
        threat_substitutes: {
          type: "object",
          required: ["score", "description"],
          properties: {
            score: { type: "number", minimum: 1, maximum: 5 },
            description: { type: "string", maxLength: 300 }
          }
        },
        barriers_entry: {
          type: "object",
          required: ["score", "description"],
          properties: {
            score: { type: "number", minimum: 1, maximum: 5 },
            description: { type: "string", maxLength: 300 }
          }
        }
      }
    },
    bsc: {
      type: "object",
      required: ["financial", "customer", "internal", "learning"],
      properties: {
        financial: {
          type: "object",
          required: ["score", "metrics"],
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            metrics: { 
              type: "array", 
              items: { type: "string", maxLength: 150 }, 
              maxItems: 4 
            }
          }
        },
        customer: {
          type: "object",
          required: ["score", "metrics"],
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            metrics: { 
              type: "array", 
              items: { type: "string", maxLength: 150 }, 
              maxItems: 4 
            }
          }
        },
        internal: {
          type: "object",
          required: ["score", "metrics"],
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            metrics: { 
              type: "array", 
              items: { type: "string", maxLength: 150 }, 
              maxItems: 4 
            }
          }
        },
        learning: {
          type: "object",
          required: ["score", "metrics"],
          properties: {
            score: { type: "number", minimum: 0, maximum: 100 },
            metrics: { 
              type: "array", 
              items: { type: "string", maxLength: 150 }, 
              maxItems: 4 
            }
          }
        }
      }
    },
    quick_wins: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        required: ["action", "time_hours", "roi_month_eur", "confidence"],
        properties: {
          action: { 
            type: "string", 
            maxLength: 200,
            description: "Specific action to take"
          },
          time_hours: { 
            type: "number", 
            minimum: 0, 
            maximum: 40,
            description: "Time investment in hours"
          },
          roi_month_eur: { 
            type: "number", 
            minimum: 0, 
            maximum: 10000,
            description: "Expected monthly ROI in EUR"
          },
          confidence: { 
            type: "number", 
            minimum: 0, 
            maximum: 1,
            description: "Confidence level (0-1)"
          }
        }
      }
    },
    next_steps: { 
      type: "array", 
      items: { type: "string", maxLength: 150 }, 
      maxItems: 6,
      description: "Recommended next actions"
    },
    disclaimer: { 
      type: "string", 
      maxLength: 300,
      description: "Legal disclaimer about recommendations"
    }
  }
} as const;

export const PERSONA_DETECTION_SCHEMA = {
  type: "object",
  required: ["primary_persona", "confidence_score", "reasoning", "communication_recommendations"],
  properties: {
    primary_persona: {
      type: "string",
      enum: ["Der Skeptiker", "Der Überforderte", "Der Profi", "Der Zeitknappe"],
      description: "Detected primary user persona"
    },
    confidence_score: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "Confidence in persona detection"
    },
    secondary_traits: {
      type: "array",
      items: { type: "string", maxLength: 50 },
      maxItems: 3,
      description: "Additional persona characteristics"
    },
    reasoning: {
      type: "string",
      maxLength: 400,
      description: "Explanation for persona classification"
    },
    communication_recommendations: {
      type: "object",
      required: ["tone", "detail_level", "focus_areas"],
      properties: {
        tone: {
          type: "string",
          enum: ["sachlich", "empathisch", "technisch", "direkt"],
          description: "Recommended communication tone"
        },
        detail_level: {
          type: "string",
          enum: ["hoch", "mittel", "niedrig"],
          description: "Recommended level of detail"
        },
        focus_areas: {
          type: "array",
          items: { type: "string", maxLength: 50 },
          maxItems: 3,
          description: "Key areas to focus on"
        }
      }
    },
    adaptive_suggestions: {
      type: "array",
      items: { type: "string", maxLength: 100 },
      maxItems: 2,
      description: "Specific adaptation suggestions"
    }
  }
} as const;

export const CONTENT_GENERATION_SCHEMA = {
  type: "object",
  required: ["main_content", "hashtags", "call_to_action", "posting_time", "image_suggestions"],
  properties: {
    main_content: {
      type: "string",
      maxLength: 2000,
      description: "Main content text"
    },
    hashtags: {
      type: "array",
      items: { type: "string", pattern: "^#[a-zA-ZäöüÄÖÜß0-9_]+$", maxLength: 30 },
      maxItems: 10,
      description: "Relevant hashtags"
    },
    call_to_action: {
      type: "string",
      maxLength: 100,
      description: "Clear call to action"
    },
    posting_time: {
      type: "string",
      enum: ["morning", "afternoon", "evening", "weekend"],
      description: "Recommended posting time"
    },
    image_suggestions: {
      type: "array",
      items: { type: "string", maxLength: 150 },
      maxItems: 3,
      description: "Image/video content suggestions"
    }
  }
} as const;

/**
 * JSON Schema Validator with AJV
 */
import Ajv from 'ajv';

const ajv = new Ajv({ 
  allErrors: true, 
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true
});

export const validateVCAnalysis = ajv.compile(VC_ANALYSIS_SCHEMA);
export const validatePersonaDetection = ajv.compile(PERSONA_DETECTION_SCHEMA);
export const validateContentGeneration = ajv.compile(CONTENT_GENERATION_SCHEMA);

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate JSON output against schema
 */
export function validateJson<T>(
  rawOutput: string, 
  validator: (data: any) => boolean,
  schemaName: string
): ValidationResult<T> {
  try {
    // Try to parse JSON
    const parsed = JSON.parse(rawOutput);
    
    // Validate against schema
    const valid = validator(parsed);
    
    if (valid) {
      return { valid: true, data: parsed as T };
    } else {
      const errors = (validator as any).errors?.map((err: any) => 
        `${err.instancePath || 'root'}: ${err.message}`
      ) || ['Unknown validation error'];
      
      return { valid: false, errors };
    }
  } catch (parseError) {
    return { 
      valid: false, 
      errors: [`JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`]
    };
  }
}

/**
 * Generate repair prompt for invalid JSON
 */
export function buildRepairPrompt(
  originalPrompt: string,
  invalidOutput: string,
  schemaName: string,
  errors: string[]
): string {
  return `
🔧 JSON REPAIR MODE - CRITICAL

Your previous output was invalid. You MUST fix it immediately.

ORIGINAL PROMPT:
${originalPrompt}

INVALID OUTPUT:
${invalidOutput}

VALIDATION ERRORS:
${errors.join('\n')}

REPAIR INSTRUCTIONS:
1. Output ONLY valid JSON matching the ${schemaName} schema
2. Fix all validation errors listed above
3. NO explanations, NO markdown, NO additional text
4. Start with { and end with }
5. Ensure all required fields are present
6. Respect all maxLength, maxItems, and enum constraints

REPAIRED JSON:`;
}

/**
 * Extract JSON from mixed content (fallback)
 */
export function extractJsonFromMixedContent(content: string): string | null {
  // Try to find JSON block in markdown
  const jsonBlockMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  
  // Try to find JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return null;
}

/**
 * Safe JSON validation with repair attempt
 */
export async function safeValidateJson<T>(
  rawOutput: string,
  validator: (data: any) => boolean,
  schemaName: string,
  originalPrompt?: string,
  repairFunction?: (repairPrompt: string) => Promise<string>
): Promise<ValidationResult<T>> {
  // First attempt: direct validation
  let result = validateJson<T>(rawOutput, validator, schemaName);
  
  if (result.valid) {
    return result;
  }
  
  // Second attempt: extract JSON from mixed content
  const extractedJson = extractJsonFromMixedContent(rawOutput);
  if (extractedJson) {
    result = validateJson<T>(extractedJson, validator, schemaName);
    if (result.valid) {
      return result;
    }
  }
  
  // Third attempt: repair mode (if repair function provided)
  if (originalPrompt && repairFunction && result.errors) {
    try {
      const repairPrompt = buildRepairPrompt(originalPrompt, rawOutput, schemaName, result.errors);
      const repairedOutput = await repairFunction(repairPrompt);
      
      result = validateJson<T>(repairedOutput, validator, schemaName);
      if (result.valid) {
        return result;
      }
    } catch (repairError) {
      console.error('Repair attempt failed:', repairError);
    }
  }
  
  // All attempts failed
  return result;
}

/**
 * Schema type exports for TypeScript
 */
export type VCAnalysisOutput = {
  summary: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  porters: {
    competitive_rivalry: { score: number; description: string };
    supplier_power: { score: number; description: string };
    buyer_power: { score: number; description: string };
    threat_substitutes: { score: number; description: string };
    barriers_entry: { score: number; description: string };
  };
  bsc: {
    financial: { score: number; metrics: string[] };
    customer: { score: number; metrics: string[] };
    internal: { score: number; metrics: string[] };
    learning: { score: number; metrics: string[] };
  };
  quick_wins: Array<{
    action: string;
    time_hours: number;
    roi_month_eur: number;
    confidence: number;
  }>;
  next_steps: string[];
  disclaimer: string;
};

export type PersonaDetectionOutput = {
  primary_persona: "Der Skeptiker" | "Der Überforderte" | "Der Profi" | "Der Zeitknappe";
  confidence_score: number;
  secondary_traits?: string[];
  reasoning: string;
  communication_recommendations: {
    tone: "sachlich" | "empathisch" | "technisch" | "direkt";
    detail_level: "hoch" | "mittel" | "niedrig";
    focus_areas: string[];
  };
  adaptive_suggestions?: string[];
};

export type ContentGenerationOutput = {
  main_content: string;
  hashtags: string[];
  call_to_action: string;
  posting_time: "morning" | "afternoon" | "evening" | "weekend";
  image_suggestions: string[];
};