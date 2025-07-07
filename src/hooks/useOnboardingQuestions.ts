
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface OnboardingQuestion {
  id: string;
  step: number;
  type: 'text' | 'select' | 'checkbox' | 'info';
  slug: string;
  required: boolean;
  order_index: number;
  translations: {
    de?: {
      label?: string;
      description?: string;
      placeholder?: string;
    };
    en?: {
      label?: string;
      description?: string;
      placeholder?: string;
    };
  };
  options?: {
    de?: Array<{ value: string; label: string }>;
    en?: Array<{ value: string; label: string }>;
    source?: string;
    filter?: Record<string, any>;
  };
  validation_rules?: Record<string, any>;
  conditional_logic?: Record<string, any>;
}

export interface GmbCategory {
  id: string;
  category_id: string;
  name_de: string;
  name_en: string;
  is_popular: boolean;
  sort_order: number;
  parent_category_id?: string;
}

export const useOnboardingQuestions = (step?: number) => {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [gmbCategories, setGmbCategories] = useState<GmbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch GMB categories with proper error handling
  const fetchGmbCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('gmb_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching GMB categories:', error);
        // Continue without categories if they don't exist yet
        setGmbCategories([]);
        return;
      }
      
      // Map the database response to our interface
      const mappedCategories: GmbCategory[] = (data || []).map((cat: Database['public']['Tables']['gmb_categories']['Row']) => ({
        id: cat.id,
        category_id: cat.category_id,
        name_de: cat.name_de,
        name_en: cat.name_en,
        is_popular: cat.is_popular,
        sort_order: cat.sort_order,
        parent_category_id: cat.parent_category_id || undefined
      }));
      
      setGmbCategories(mappedCategories);
    } catch (err) {
      console.error('Error fetching GMB categories:', err);
      setGmbCategories([]);
    }
  };

  // Fetch onboarding questions with proper error handling
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('onboarding_questions')
        .select('*')
        .order('step', { ascending: true })
        .order('order_index', { ascending: true });

      if (step !== undefined) {
        query = query.eq('step', step);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching onboarding questions:', error);
        setError('Failed to load questions');
        setLoading(false);
        return;
      }

      // Process questions with dynamic options
      const processedQuestions = await Promise.all(
        (data || []).map(async (q: Database['public']['Tables']['onboarding_questions']['Row']) => {
          const question: OnboardingQuestion = {
            id: q.id,
            step: q.step,
            type: q.type as 'text' | 'select' | 'checkbox' | 'info',
            slug: q.slug,
            required: q.required,
            order_index: q.order_index,
            translations: q.translations as OnboardingQuestion['translations'] || {},
            options: q.options as OnboardingQuestion['options'],
            validation_rules: q.validation_rules as Record<string, any> || {},
            conditional_logic: q.conditional_logic as Record<string, any> || {}
          };

          // Handle dynamic options from GMB categories
          if (q.options && typeof q.options === 'object' && 'source' in q.options && q.options.source === 'gmb_categories') {
            const categories = gmbCategories.filter(cat => {
              if (q.options && typeof q.options === 'object' && 'filter' in q.options && q.options.filter && typeof q.options.filter === 'object' && 'is_popular' in q.options.filter) {
                return cat.is_popular;
              }
              return true;
            });

            question.options = {
              de: categories.map(cat => ({
                value: cat.category_id,
                label: cat.name_de
              })),
              en: categories.map(cat => ({
                value: cat.category_id,
                label: cat.name_en
              }))
            };
          }

          return question;
        })
      );

      setQuestions(processedQuestions);
    } catch (err) {
      console.error('Error fetching onboarding questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGmbCategories();
  }, []);

  useEffect(() => {
    // Only fetch questions after categories are loaded or if no categories are needed
    if (gmbCategories.length > 0 || step !== 1) {
      fetchQuestions();
    }
  }, [step, gmbCategories]);

  return { questions, gmbCategories, loading, error, refetch: fetchQuestions };
};

// Helper function for translation with enhanced fallback
export const getTranslation = (
  translations: OnboardingQuestion['translations'],
  language: 'de' | 'en',
  field: 'label' | 'description' | 'placeholder'
): string => {
  const requestedText = translations[language]?.[field];
  if (requestedText) return requestedText;

  const fallbackText = translations.de?.[field];
  if (fallbackText) return fallbackText;

  return field === 'label' ? 'Question' : '';
};

// Helper function for options with enhanced fallback
export const getOptions = (
  options: OnboardingQuestion['options'],
  language: 'de' | 'en'
): Array<{ value: string; label: string }> => {
  const requestedOptions = options?.[language];
  if (requestedOptions && requestedOptions.length > 0) {
    return requestedOptions;
  }

  const fallbackOptions = options?.de;
  if (fallbackOptions && fallbackOptions.length > 0) {
    return fallbackOptions;
  }

  return [];
};
