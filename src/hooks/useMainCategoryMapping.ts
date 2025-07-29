import { useMainCategoryMappingNew } from './useMainCategoryMappingNew';
export const slugToDisplay: Record<string, string> = {
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

export interface MainCategory {
  id: string;
  slug: string;
  name_de: string;
  name_en: string;
  description_de?: string;
  description_en?: string;
  sort_order: number;
  is_active: boolean;
}

/**
 * Hook for mapping categories - supports both legacy slug-based and new UUID-based approaches
 * TODO: Remove legacy functions after main_categories table migration is complete
 */
export const useMainCategoryMapping = () => {
  /**
   * Convert array of slugs to display names (legacy fallback)
   */
  const slugsToIds = (slugs: string[]): string[] => {
    return slugs
      .map(slug => slugToDisplay[slug])
      .filter(Boolean);
  };

  /**
   * Get canonical name by slug (legacy fallback)
   */
  const getCanonicalNameBySlug = (slug: string): string => {
    return slugToDisplay[slug] || slug;
  };

  // Use the new hook for UUID-based operations
  const { uuidBySlug: getUuidBySlug, uuidsBySlugs: getUuidsBySlugs, nameById: getNameById } = useMainCategoryMappingNew();

  const uuidBySlug = (slug: string): string => {
    return getUuidBySlug(slug);
  };

  const uuidsBySlugs = (slugs: string[]): string[] => {
    return getUuidsBySlugs(slugs);
  };

  const nameById = (id: string, lang: "de" | "en" = "de"): string => {
    return getNameById(id, lang);
  };

  return {
    slugsToIds,
    getCanonicalNameBySlug,
    uuidBySlug,
    uuidsBySlugs,
    nameById,
    loading: false
  };
};