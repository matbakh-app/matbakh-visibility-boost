import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  };
}

// Raw database response type
interface RawQuestionData {
  id: string;
  step: number;
  type: string;
  slug: string;
  required: boolean;
  order_index: number;
  translations: any;
  options: any;
  created_at: string;
  updated_at: string;
}

export const useOnboardingQuestions = (step?: number) => {
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        
        // Use direct fetch to bypass TypeScript typing issues
        const baseQuery = step !== undefined 
          ? `SELECT * FROM onboarding_questions WHERE step = ${step} ORDER BY step ASC, order_index ASC`
          : `SELECT * FROM onboarding_questions ORDER BY step ASC, order_index ASC`;

        const { data, error } = await (supabase as any)
          .from('onboarding_questions')
          .select('*')
          .order('step', { ascending: true })
          .order('order_index', { ascending: true });

        if (error) {
          console.error('Error fetching onboarding questions:', error);
          setError(error.message);
          return;
        }

        // Transform and filter raw data to our interface
        const allQuestions: OnboardingQuestion[] = ((data || []) as any[])
          .map((q: any) => ({
            id: q.id,
            step: q.step,
            type: q.type,
            slug: q.slug,
            required: q.required,
            order_index: q.order_index,
            translations: q.translations || {},
            options: q.options || undefined
          }));

        // Filter by step if specified
        const filteredQuestions = step !== undefined 
          ? allQuestions.filter(q => q.step === step)
          : allQuestions;

        setQuestions(filteredQuestions);
      } catch (err) {
        console.error('Error in fetchQuestions:', err);
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [step]);

  return { questions, loading, error };
};

// Helper function for translation fallback logic
export const getTranslation = (
  translations: OnboardingQuestion['translations'],
  language: 'de' | 'en',
  field: 'label' | 'description' | 'placeholder'
): string => {
  // Try requested language first
  const requestedLangText = translations[language]?.[field];
  if (requestedLangText) {
    return requestedLangText;
  }

  // Fallback to German
  const fallbackText = translations.de?.[field];
  if (fallbackText) {
    return fallbackText;
  }

  // Last resort fallback
  return field === 'label' ? 'Question' : '';
};

// Helper function for options fallback logic
export const getOptions = (
  options: OnboardingQuestion['options'],
  language: 'de' | 'en'
): Array<{ value: string; label: string }> => {
  // Try requested language first
  const requestedLangOptions = options?.[language];
  if (requestedLangOptions && requestedLangOptions.length > 0) {
    return requestedLangOptions;
  }

  // Fallback to German
  const fallbackOptions = options?.de;
  if (fallbackOptions && fallbackOptions.length > 0) {
    return fallbackOptions;
  }

  // Return empty array if no options
  return [];
};