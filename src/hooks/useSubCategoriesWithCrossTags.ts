import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Row, Insert } from '@/integrations/supabase/db-helpers';

export interface SubCategoryWithCrossTags {
  id: string;
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  keywords: string[];
  is_popular: boolean;
  sort_order: number;
  haupt_kategorie_id: string; // FK to main_categories.id
  haupt_kategorie: string; // Legacy field for display
  crossTags: string[]; // Target main category IDs from cross_tags table
}

export interface RelatedCategory {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  confidence: 'high' | 'medium' | 'low';
  strength?: number;
  crossTagIds?: string[]; // UUIDs instead of strings for cross-tags
  haupt_kategorie_id: string; // FK to main_categories.id
  haupt_kategorie_name?: string; // Canonical name for display
}

/**
 * Hook to load subcategories with cross-tags support using canonical categories system
 */
export const useSubCategoriesWithCrossTags = (
  selectedMainCategoryUUIDs: string[], // Array of main_category UUIDs
  language: 'de' | 'en' = 'de'
) => {
  const [allSubCategories, setAllSubCategories] = useState<RelatedCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubCategories = async () => {
    if (!selectedMainCategoryUUIDs.length) {
      setAllSubCategories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Loading subcategories for main category UUIDs:', selectedMainCategoryUUIDs);

      // First get categories by main category ID (UUID)
      const { data: mainCategories, error: mainError } = await supabase
        .from('gmb_categories')
        .select(`
          id,
          name_de,
          name_en,
          description_de,
          description_en,
          keywords,
          is_popular,
          sort_order,
          main_category_id,
          haupt_kategorie
        `)
        .in('main_category_id', selectedMainCategoryUUIDs)
        .returns<Row<"gmb_categories">[]>();

      if (mainError) {
        console.error('❌ Error loading main categories:', mainError);
        throw mainError;
      }

      // Then get categories by cross-tags (using UUID)
      const { data: crossCategories, error: crossError } = await supabase
        .from('gmb_categories')
        .select(`
          id,
          name_de,
          name_en,
          description_de,
          description_en,
          keywords,
          is_popular,
          sort_order,
          main_category_id,
          haupt_kategorie,
          category_cross_tags!inner(target_main_category_id)
        `)
        .in('category_cross_tags.target_main_category_id', selectedMainCategoryUUIDs)
        .returns<any[]>();

      if (crossError) {
        console.error('❌ Error loading cross-tag categories:', crossError);
        throw crossError;
      }

      // Combine and deduplicate results
      const allCategories = [...(mainCategories || []), ...(crossCategories || [])];

      // Process and map the data
      const processedCategories: RelatedCategory[] = allCategories.map((item: any) => {
        // Extract cross-tags from the joined data (only available in crossResult)
        const crossTags = item.category_cross_tags 
          ? Array.isArray(item.category_cross_tags)
            ? item.category_cross_tags.map((tag: any) => tag.target_main_category_id)
            : []
          : [];

        console.log(`🔍 Processing subcategory: ${item.name_de}, haupt_kategorie: ${item.haupt_kategorie}`);
        
        return {
          id: item.id,
          name: language === 'de' ? item.name_de : item.name_en,
          description: language === 'de' ? item.description_de : item.description_en,
          keywords: item.keywords || [],
          confidence: (item.is_popular ? 'high' : 'medium') as 'high' | 'medium' | 'low',
          strength: item.sort_order || 0,
          crossTagIds: crossTags,
          haupt_kategorie_id: item.main_category_id || '', // Use the UUID from main_categories
          haupt_kategorie_name: item.haupt_kategorie
        };
      });

      // Remove duplicates (category might match both main category AND cross-tag)
      const uniqueCategories = processedCategories.filter((category, index, self) =>
        index === self.findIndex(c => c.id === category.id)
      );

      console.log('✅ Loaded', uniqueCategories.length, 'subcategories with cross-tags');
      setAllSubCategories(uniqueCategories);

    } catch (err) {
      console.error('❌ Failed to load subcategories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subcategories');
      setAllSubCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubCategories();
  }, [JSON.stringify(selectedMainCategoryUUIDs), language]); // Use JSON.stringify for array stability

  // Add debugging to check for unstable references
  useEffect(() => {
    console.log('🔍 useSubCategoriesWithCrossTags triggered with:', {
      selectedMainCategoryUUIDs,
      language,
      arrayLength: selectedMainCategoryUUIDs?.length
    });
  }, [selectedMainCategoryUUIDs, language]);

  /**
   * Filter categories by search term
   */
  const filterCategories = (searchTerm: string, excludeIds: string[] = []) => {
    const term = searchTerm.toLowerCase().trim();
    
    const available = allSubCategories.filter(c => !excludeIds.includes(c.id));
    
    if (!term) {
      return available;
    }

    return available.filter(c =>
      c.name.toLowerCase().includes(term) || 
      c.keywords.some(k => k.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term)) ||
      (c.haupt_kategorie_name && c.haupt_kategorie_name.toLowerCase().includes(term))
    );
  };

  /**
   * Log user search for analytics
   */
  const logSearch = async (searchTerm: string, resultCategoryIds: string[], selectedCategoryId?: string) => {
    try {
      const payload = {
        search_term: searchTerm,
        selected_main_categories: selectedMainCategoryUUIDs,
        result_category_ids: resultCategoryIds,
        selected_category_id: selectedCategoryId || null,
        user_id: null
      };
      await supabase
        .from('category_search_logs')
        .insert([payload]);
    } catch (error) {
      console.warn('Failed to log search:', error);
    }
  };

  return {
    allSubCategories,
    loading,
    error,
    filterCategories,
    logSearch,
    refetch: loadSubCategories
  };
};