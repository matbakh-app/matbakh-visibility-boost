import { z } from 'zod';

// KPI validation schema with security constraints
export const kpiSchema = z.object({
  annual_revenue: z.number()
    .min(0, 'Annual revenue must be positive')
    .max(50000000, 'Annual revenue cannot exceed 50 million')
    .nullable()
    .optional(),
  seating_capacity: z.number()
    .int('Seating capacity must be a whole number')
    .min(1, 'Seating capacity must be at least 1')
    .max(1000, 'Seating capacity cannot exceed 1000')
    .nullable()
    .optional(),
  food_cost_ratio: z.number()
    .min(0, 'Food cost ratio must be positive')
    .max(100, 'Food cost ratio cannot exceed 100%')
    .nullable()
    .optional(),
  labor_cost_ratio: z.number()
    .min(0, 'Labor cost ratio must be positive')
    .max(100, 'Labor cost ratio cannot exceed 100%')
    .nullable()
    .optional(),
  employee_count: z.number()
    .int('Employee count must be a whole number')
    .min(0, 'Employee count must be positive')
    .max(1000, 'Employee count cannot exceed 1000')
    .nullable()
    .optional(),
  opening_hours: z.number()
    .min(1, 'Opening hours must be at least 1 hour')
    .max(24, 'Opening hours cannot exceed 24 hours')
    .nullable()
    .optional(),
  additional_kpis: z.record(z.string(), z.union([z.string(), z.number()]))
    .refine((data) => {
      // Validate KPI keys are safe identifiers
      return Object.keys(data).every(key => 
        /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key) && key.length <= 50
      );
    }, 'Invalid KPI key format')
    .optional()
});

// Contact form validation with rate limiting considerations
export const contactFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/, 'Name contains invalid characters'),
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email cannot exceed 254 characters'),
  company_name: z.string()
    .max(200, 'Company name cannot exceed 200 characters')
    .optional(),
  phone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]{8,20}$/, 'Invalid phone number format')
    .optional(),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot exceed 2000 characters'),
  service_interest: z.array(z.string()).optional()
});

// Business partner validation
export const businessPartnerSchema = z.object({
  company_name: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name cannot exceed 200 characters'),
  contact_email: z.string()
    .email('Invalid email address')
    .max(254, 'Email cannot exceed 254 characters')
    .optional(),
  contact_phone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]{8,20}$/, 'Invalid phone number format')
    .optional(),
  address: z.string()
    .max(500, 'Address cannot exceed 500 characters')
    .optional(),
  website: z.string()
    .url('Invalid website URL')
    .max(255, 'Website URL cannot exceed 255 characters')
    .optional()
    .or(z.literal(''))
});

// URL redirect validation for security
export const validateRedirectUrl = (url: string): boolean => {
  // Only allow internal redirects
  return /^\/[a-zA-Z0-9/_\-?=&]*$/.test(url);
};

// Currency input validation
export const validateCurrencyInput = (value: string): boolean => {
  // Remove formatting and validate numeric value
  const numericValue = value.replace(/[^\d]/g, '');
  const num = parseInt(numericValue) || 0;
  return num >= 0 && num <= 50000000;
};

// Rate limiting helper for client-side throttling
export const createRateLimiter = (maxRequests: number, timeWindowMs: number) => {
  const requests: number[] = [];
  
  return (): boolean => {
    const now = Date.now();
    
    // Remove old requests outside the time window
    while (requests.length > 0 && requests[0] <= now - timeWindowMs) {
      requests.shift();
    }
    
    // Check if we're under the limit
    if (requests.length < maxRequests) {
      requests.push(now);
      return true;
    }
    
    return false;
  };
};

// Sanitize user input for display
export const sanitizeDisplayText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .trim()
    .slice(0, 1000); // Limit length
};