import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubCategoryWithCrossTags {
  id: string;
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  keywords: string[];
  is_popular: boolean;
  sort_order: number;
  haupt_kategorie: string;
  crossTags: string[]; // Target main categories from cross_tags table
}

export interface RelatedCategory {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  confidence: 'high' | 'medium' | 'low';
  strength?: number;
  crossTags?: string[];
}

/**
 * Hook to load subcategories with cross-tags support
 * Handles the "Essen & Trinken" vs "Essen und Trinken" slug issue
 */
export const useSubCategoriesWithCrossTags = (
  selectedMainCategories: string[],
  language: 'de' | 'en' = 'de'
) => {
  const [allSubCategories, setAllSubCategories] = useState<RelatedCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map main category slugs to exact DB values in 'haupt_kategorie'
  // CRITICAL: Handle the "Essen & Trinken" vs "Essen und Trinken" issue
  const slugToDisplay: Record<string, string> = {
    'food-drink': 'Essen & Trinken',
    'entertainment-culture': 'Kunst, Unterhaltung & Freizeit',
    'retail-shopping': 'Einzelhandel & Verbraucherdienstleistungen',
    'health-wellness': 'Gesundheit & Medizinische Dienstleistungen',
    'automotive': 'Automobil & Transport',
    'beauty-personal-care': 'Mode & Lifestyle',
    'sports-fitness': 'Sport',
    'home-garden': 'Immobilien & Bauwesen',
    'professional-services': 'Professionelle Dienstleistungen',
    'education-training': 'Bildung & Ausbildung',
    'technology-electronics': 'Sonstige',
    'travel-tourism': 'Gastgewerbe und Tourismus',
    'finance-insurance': 'Finanzdienstleistungen',
    'real-estate': 'Immobilien & Bauwesen',
    'pets-animals': 'Sonstige',
    'events-venues': 'Kunst, Unterhaltung & Freizeit',
    'government-public': 'Behörden & Öffentliche Dienste',
    'religious-spiritual': 'Religiöse Stätten',
    'other-services': 'Sonstige'
  };

  const loadSubCategories = async () => {
    if (!selectedMainCategories.length) {
      setAllSubCategories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert slugs to display names for DB query
      const displayNames = selectedMainCategories
        .map(slug => slugToDisplay[slug])
        .filter(Boolean);

      console.log('🔍 Loading subcategories for main categories:', displayNames);

      // Build OR conditions for PostgREST - use individual eq conditions instead of in()
      const orConditions: string[] = [];
      
      // Add haupt_kategorie conditions
      displayNames.forEach(name => {
        orConditions.push(`haupt_kategorie.eq.${encodeURIComponent(name)}`);
      });
      
      // Add cross-tags conditions
      displayNames.forEach(name => {
        orConditions.push(`category_cross_tags.target_main_category.eq.${encodeURIComponent(name)}`);
      });

      // Query with LEFT JOIN to get cross-tags
      const { data, error } = await supabase
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
          haupt_kategorie,
          category_cross_tags!left(target_main_category)
        `)
        .or(orConditions.join(','))
        .order('is_popular', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Error loading subcategories:', error);
        throw error;
      }

      // Process and map the data
      const processedCategories: RelatedCategory[] = (data || []).map(item => {
        // Extract cross-tags from the joined data
        const crossTags = Array.isArray(item.category_cross_tags) 
          ? item.category_cross_tags.map((tag: any) => tag.target_main_category)
          : [];

        return {
          id: item.id,
          name: language === 'de' ? item.name_de : item.name_en,
          description: language === 'de' ? item.description_de : item.description_en,
          keywords: item.keywords || [],
          confidence: (item.is_popular ? 'high' : 'medium') as 'high' | 'medium' | 'low',
          strength: item.sort_order || 0,
          crossTags
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
  }, [selectedMainCategories, language]);

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
      (c.crossTags && c.crossTags.some(tag => tag.toLowerCase().includes(term)))
    );
  };

  /**
   * Log user search for analytics
   */
  const logSearch = async (searchTerm: string, resultCategoryIds: string[], selectedCategoryId?: string) => {
    try {
      await supabase
        .from('category_search_logs')
        .insert({
          search_term: searchTerm,
          selected_main_categories: selectedMainCategories.map(slug => slugToDisplay[slug]).filter(Boolean),
          result_category_ids: resultCategoryIds,
          selected_category_id: selectedCategoryId || null
        });
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