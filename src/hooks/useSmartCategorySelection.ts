import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GmbCategory } from '@/hooks/useOnboardingQuestions';
import { RelatedCategory } from '@/hooks/useSubCategoriesWithCrossTags';

interface AiSuggestion {
  categoryId: string;
  confidence: number;
  reason: string;
}

interface SmartSelectionOptions {
  mode: 'ai-first' | 'guided';
  businessDescription?: string;
  businessName?: string;
  availableCategories: GmbCategory[];
  selectedMainCategories?: string[];
  language?: 'de' | 'en';
}

export const useSmartCategorySelection = (options: SmartSelectionOptions) => {
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [subCategorySuggestions, setSubCategorySuggestions] = useState<RelatedCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get AI category suggestions for main categories
  const getMainCategorySuggestions = useCallback(async () => {
    if (!options.businessDescription?.trim() || options.mode !== 'ai-first') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-category-tagging', {
        body: {
          businessDescription: options.businessDescription,
          businessName: options.businessName || '',
          availableCategories: options.availableCategories.map(cat => ({
            id: cat.category_id,
            name_de: cat.name_de,
            name_en: cat.name_en,
            // Remove keywords as they don't exist in GmbCategory
          })),
          language: options.language || 'de'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setAiSuggestions(data?.suggestions || []);
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Abrufen der KI-Vorschläge');
      setAiSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [options.businessDescription, options.businessName, options.mode, options.language]);

  // Get contextual suggestions for guided mode
  const getGuidedSuggestions = useCallback((searchTerm: string) => {
    if (options.mode !== 'guided' || !searchTerm.trim()) {
      return [];
    }

    const term = searchTerm.toLowerCase();
    return options.availableCategories
      .filter(cat => {
        const nameDe = cat.name_de.toLowerCase();
        const nameEn = cat.name_en?.toLowerCase() || '';
        // GmbCategory doesn't have keywords property
        
        return nameDe.includes(term) || nameEn.includes(term);
      })
      .slice(0, 5)
      .map(cat => cat.category_id);
  }, [options.availableCategories, options.mode]);

  // Get smart subcategory suggestions based on selected main categories
  const getSubCategorySuggestions = useCallback(async () => {
    if (!options.selectedMainCategories?.length) {
      setSubCategorySuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-visibility-check', {
        body: {
          action: 'get_subcategory_suggestions',
          mainCategories: options.selectedMainCategories,
          businessDescription: options.businessDescription || '',
          language: options.language || 'de'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setSubCategorySuggestions(data?.suggestions || []);
    } catch (err) {
      console.error('Error getting subcategory suggestions:', err);
      setSubCategorySuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [options.selectedMainCategories, options.businessDescription, options.language]);

  // Auto-trigger suggestions based on mode
  useEffect(() => {
    if (options.mode === 'ai-first' && options.businessDescription) {
      getMainCategorySuggestions();
    }
  }, [options.mode, options.businessDescription, getMainCategorySuggestions]);

  useEffect(() => {
    if (options.selectedMainCategories?.length) {
      getSubCategorySuggestions();
    }
  }, [options.selectedMainCategories, getSubCategorySuggestions]);

  return {
    loading,
    error,
    aiSuggestions,
    subCategorySuggestions,
    getMainCategorySuggestions,
    getGuidedSuggestions,
    getSubCategorySuggestions
  };
};