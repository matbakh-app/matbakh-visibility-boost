import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useGmbCategories } from '@/hooks/useGmbCategories';
import type { GmbCategory } from '@/hooks/useGmbCategories';

interface MainCategorySelectorProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  maxSelections?: number;
}

export const MainCategorySelector: React.FC<MainCategorySelectorProps> = ({
  selectedCategories,
  onCategoryChange,
  maxSelections = 3
}) => {
  const { t, i18n } = useTranslation('onboarding');
  const { data: gmbCategories, isLoading } = useGmbCategories();

  // Debug logging
  React.useEffect(() => {
    if (gmbCategories) {
      console.log('🔍 Loaded GMB categories:', gmbCategories.length);
      console.log('🔍 Sample categories:', gmbCategories.slice(0, 3));
    }
  }, [gmbCategories]);

  const mainCategoryOptions = React.useMemo(() => {
    if (!gmbCategories) return [];
    
    // 1. Extract all values based on language
    const values = gmbCategories.map(cat =>
      i18n.language === 'de'
        ? cat.haupt_kategorie
        : cat.main_category
    ).filter(Boolean); // Remove empty values

    // 2. Remove duplicates using Set
    const unique = Array.from(new Set(values));

    // 3. Sort alphabetically
    unique.sort((a, b) => a.localeCompare(b, i18n.language));

    // 4. Create category objects with unique IDs (complete GmbCategory structure)
    const uniqueCategories = unique.map((name, index) => ({
      id: `main_${index}`,
      category_id: `main_${index}`,
      name_de: name,
      name_en: name,
      haupt_kategorie: i18n.language === 'de' ? name : null,
      main_category: i18n.language === 'en' ? name : null,
      parent_category_id: null,
      parent_id: null,
      category_path: null,
      country_availability: null,
      description_de: null,
      description_en: null,
      keywords: null,
      synonyms: null,
      is_popular: false,
      is_primary: true,
      sort_order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as GmbCategory));
    
    console.log('🔍 Unique main categories for', i18n.language, ':', uniqueCategories.length, uniqueCategories.slice(0, 3));
    return uniqueCategories;
  }, [gmbCategories, i18n.language]);

  const getCategoryName = (category: GmbCategory) => {
    if (i18n.language === 'de') {
      return category.haupt_kategorie || category.name_de;
    } else {
      return category.main_category || category.name_en;
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    if (!selectedCategories.includes(categoryId) && selectedCategories.length < maxSelections) {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const removeCategorySelection = (categoryId: string) => {
    onCategoryChange(selectedCategories.filter(id => id !== categoryId));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
      </div>
    );
  }

  const availableCategories = mainCategoryOptions?.filter(
    category => !selectedCategories.includes(category.category_id)
  ) || [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('categorySelector.mainCategory.label', { maxSelections })}
        </label>
        
        <Select onValueChange={handleCategorySelect} disabled={selectedCategories.length >= maxSelections}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              selectedCategories.length >= maxSelections 
                ? t('categorySelector.mainCategory.maxReached', { maxSelections })
                : t('categorySelector.mainCategory.placeholder')
            } />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map(category => (
              <SelectItem key={category.category_id} value={category.category_id}>
                {getCategoryName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          {t('categorySelector.mainCategory.selectedCount', { count: selectedCategories.length, max: maxSelections })}
        </p>
        
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(categoryId => {
              const category = mainCategoryOptions?.find(c => c.category_id === categoryId);
              return category ? (
                <Badge key={categoryId} variant="default" className="flex items-center gap-1">
                  {getCategoryName(category)}
                  <button
                    onClick={() => removeCategorySelection(categoryId)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};