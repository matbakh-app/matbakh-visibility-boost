
import { useState, useEffect } from 'react';
// MIGRATED: Supabase removed - use AWS services
import { FacebookEventTemplate, FacebookEventType, EventValidationResult } from '@/types/facebook-events';

export const useFacebookEventTemplates = () => {
  const [templates, setTemplates] = useState<FacebookEventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // TODO [TypeSafety]: Replace `as any` with generated Supabase types after next type generation
      // Command: npx supabase gen types typescript --project-id uheksobnyedarrpgxhju --schema public > src/integrations/supabase/types.ts
      const { data, error } = await supabase
        .from('facebook_event_templates' as any)
        .select('*')
        .eq('is_active', true as any)
        .order('event_name');

      if (error) throw error;
      
      // TODO [TypeSafety]: Remove explicit any casting after type generation
      const safeData: any[] = data || [];
      
      const transformedTemplates: FacebookEventTemplate[] = safeData.map((item: any) => ({
        id: item.id,
        event_name: item.event_name,
        template_payload: item.template_payload,
        required_fields: item.required_fields || [],
        optional_fields: item.optional_fields || [],
        description: item.description,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setTemplates(transformedTemplates);
    } catch (err) {
      console.error('Error loading Facebook event templates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set default templates if database query fails
      setTemplates(getDefaultTemplates());
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

// Default templates as fallback
const getDefaultTemplates = (): FacebookEventTemplate[] => [
  {
    id: 'default-1',
    event_name: 'ViewContent',
    template_payload: { event_name: 'ViewContent', action_source: 'website' },
    required_fields: ['event_time', 'event_source_url', 'user_data'],
    optional_fields: ['content_ids', 'content_type', 'content_name'],
    description: 'Ein Besuch einer wichtigen Seite wie Produktseite oder Landing Page',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default-2',
    event_name: 'Lead',
    template_payload: { event_name: 'Lead', action_source: 'website' },
    required_fields: ['event_time', 'event_source_url', 'user_data'],
    optional_fields: ['content_name', 'value'],
    description: 'Übermittlung von Kontaktinformationen für späteren Kontakt',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default-3',
    event_name: 'Contact',
    template_payload: { event_name: 'Contact', action_source: 'website' },
    required_fields: ['event_time', 'event_source_url', 'user_data'],
    optional_fields: ['content_name'],
    description: 'Kontakt zwischen Kunde und Unternehmen',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
