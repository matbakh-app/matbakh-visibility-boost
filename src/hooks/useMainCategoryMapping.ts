// Slug to display name mapping for backward compatibility
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

/**
 * Temporary hook for mapping until canonical categories system is migrated
 * This provides a fallback to the string-based approach for backward compatibility
 */
export const useMainCategoryMapping = () => {
  /**
   * Convert array of slugs to display names (fallback for now)
   */
  const slugsToIds = (slugs: string[]): string[] => {
    // For now, return the display names as IDs
    return slugs
      .map(slug => slugToDisplay[slug])
      .filter(Boolean);
  };

  /**
   * Get canonical name by slug
   */
  const getCanonicalNameBySlug = (slug: string): string => {
    return slugToDisplay[slug] || slug;
  };

  return {
    slugsToIds,
    getCanonicalNameBySlug
  };
};