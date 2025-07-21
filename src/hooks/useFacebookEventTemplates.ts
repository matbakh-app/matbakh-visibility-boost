
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FacebookEventTemplate, FacebookEventType, EventValidationResult } from '@/types/facebook-events';

export const useFacebookEventTemplates = () => {
  const [templates, setTemplates] = useState<FacebookEventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facebook_event_templates')
        .select('*')
        .eq('is_active', true)
        .order('event_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error loading Facebook event templates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const getTemplate = (eventType: FacebookEventType): FacebookEventTemplate | null => {
    return templates.find(t => t.event_name === eventType) || null;
  };

  const validateEventPayload = (
    eventType: FacebookEventType, 
    payload: Record<string, any>
  ): EventValidationResult => {
    const template = getTemplate(eventType);
    if (!template) {
      return {
        isValid: false,
        missingFields: [],
        invalidFields: [],
        warnings: [`Template for event type '${eventType}' not found`]
      };
    }

    const missingFields: string[] = [];
    const invalidFields: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    template.required_fields.forEach(field => {
      if (!(field in payload) || payload[field] === null || payload[field] === undefined) {
        missingFields.push(field);
      }
    });

    // Validate specific field types
    if (payload.event_time && typeof payload.event_time !== 'number') {
      invalidFields.push('event_time must be a Unix timestamp (number)');
    }

    if (payload.user_data && typeof payload.user_data !== 'object') {
      invalidFields.push('user_data must be an object');
    }

    if (payload.custom_data && typeof payload.custom_data !== 'object') {
      invalidFields.push('custom_data must be an object');
    }

    // Warn about missing optional but recommended fields
    if (eventType === 'Purchase' && !payload.custom_data?.currency) {
      warnings.push('Currency is recommended for Purchase events');
    }

    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields,
      warnings
    };
  };

  return {
    templates,
    loading,
    error,
    getTemplate,
    validateEventPayload,
    refetch: loadTemplates
  };
};
