import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactRequest {
  name: string;
  email: string;
  company_name?: string;
  phone?: string;
  message: string;
}

// Rate limiting using Supabase table
const checkRateLimit = async (supabase: any, email: string, ip: string) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('security_events')
    .select('id')
    .eq('event_type', 'contact_form_submission')
    .or(`details->>email.eq.${email},details->>ip.eq.${ip}`)
    .gte('created_at', fiveMinutesAgo);

  if (error) {
    console.error('Rate limit check error:', error);
    return false; // Allow on error
  }

  return data.length < 3; // Max 3 submissions per 5 minutes
};

// Log security event
const logSecurityEvent = async (
  supabase: any, 
  eventType: string, 
  details: any, 
  severity: string = 'info'
) => {
  try {
    await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        details,
        severity,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Input validation
const validateInput = (data: ContactRequest): string[] => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (data.name.length > 100) {
    errors.push('Name too long');
  } else if (!/^[a-zA-ZÀ-ÿ\s\-'\.]+$/.test(data.name)) {
    errors.push('Name contains invalid characters');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required');
  } else if (data.email.length > 254) {
    errors.push('Email too long');
  }
  
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters');
  } else if (data.message.length > 2000) {
    errors.push('Message too long');
  }
  
  if (data.phone && !/^[\+]?[0-9\s\-\(\)]{8,20}$/.test(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (data.company_name && data.company_name.length > 200) {
    errors.push('Company name too long');
  }
  
  return errors;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const contactData: ContactRequest = await req.json();
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';

    // Input validation
    const validationErrors = validateInput(contactData);
    if (validationErrors.length > 0) {
      await logSecurityEvent(supabase, 'contact_form_validation_failed', {
        errors: validationErrors,
        email: contactData.email,
        ip: clientIP
      }, 'medium');

      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationErrors }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Rate limiting check
    const rateLimitOk = await checkRateLimit(supabase, contactData.email, clientIP);
    if (!rateLimitOk) {
      await logSecurityEvent(supabase, 'contact_form_rate_limited', {
        email: contactData.email,
        ip: clientIP
      }, 'high');

      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Store consultation request
    const { error: dbError } = await supabase
      .from('consultation_requests')
      .insert({
        contact_person: contactData.name,
        email: contactData.email,
        company_name: contactData.company_name || null,
        phone: contactData.phone || null,
        message: contactData.message,
        status: 'new'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      await logSecurityEvent(supabase, 'contact_form_db_error', {
        error: dbError.message,
        email: contactData.email
      }, 'high');

      return new Response(
        JSON.stringify({ error: 'Failed to save request' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Log successful submission
    await logSecurityEvent(supabase, 'contact_form_submission', {
      email: contactData.email,
      ip: clientIP,
      hasCompany: !!contactData.company_name,
      hasPhone: !!contactData.phone
    }, 'info');

    console.log('Contact form submitted successfully:', {
      email: contactData.email,
      company: contactData.company_name || 'none'
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Contact request submitted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in enhanced-contact-email function:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);