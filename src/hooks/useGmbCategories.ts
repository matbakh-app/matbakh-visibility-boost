
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GmbCategory {
  id: string;
  category_id: string;
  name_en: string;
  name_de: string;
  is_popular: boolean;
  is_primary: boolean;
  sort_order: number;
  parent_category_id: string | null;
  parent_id: string | null;
  category_path: string | null;
  country_availability: string[] | null;
  description_de: string | null;
  description_en: string | null;
  keywords: string[] | null;
  synonyms: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useGmbCategories = () => {
  return useQuery({
    queryKey: ['gmb-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gmb_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching GMB categories:', error);
        throw error;
      }

      return data as GmbCategory[];
    },
  });
};

export const usePrimaryGmbCategories = () => {
  return useQuery({
    queryKey: ['gmb-categories-primary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gmb_categories')
        .select('*')
        .eq('is_primary', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching primary GMB categories:', error);
        throw error;
      }

      return data as GmbCategory[];
    },
  });
};

export const usePopularGmbCategories = () => {
  return useQuery({
    queryKey: ['gmb-categories-popular'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gmb_categories')
        .select('*')
        .eq('is_popular', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching popular GMB categories:', error);
        throw error;
      }

      return data as GmbCategory[];
    },
  });
};

export const useGmbCategoriesByParent = (parentId: string | null) => {
  return useQuery({
    queryKey: ['gmb-categories-by-parent', parentId],
    queryFn: async () => {
      const query = supabase
        .from('gmb_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (parentId) {
        query.eq('parent_id', parentId);
      } else {
        query.is('parent_id', null);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching GMB categories by parent:', error);
        throw error;
      }

      return data as GmbCategory[];
    },
  });
};

export const useGmbCategorySearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['gmb-categories-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('gmb_categories')
        .select('*')
        .or(`name_en.ilike.%${searchTerm}%,name_de.ilike.%${searchTerm}%,description_de.ilike.%${searchTerm}%,description_en.ilike.%${searchTerm}%`)
        .order('sort_order', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error searching GMB categories:', error);
        throw error;
      }

      return data as GmbCategory[];
    },
    enabled: searchTerm.length >= 2,
  });
};
