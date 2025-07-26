import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { usePrimaryGmbCategories, useGmbCategorySearch } from '@/hooks/useGmbCategories';
import type { GmbCategory } from '@/hooks/useGmbCategories';

interface CategorySelectorProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  maxSelections?: number;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategories,
  onCategoryChange,
  maxSelections = 3
}) => {
  const { t, i18n } = useTranslation();
  const { data: primaryCategories, isLoading: isPrimaryLoading } = usePrimaryGmbCategories();

  const getCategoryName = (category: GmbCategory) => {
    return i18n.language === 'de' ? category.name_de : category.name_en;
  };

  const handleCategorySelect = (categoryId: string) => {
    if (!selectedCategories.includes(categoryId) && selectedCategories.length < maxSelections) {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const removeCategorySelection = (categoryId: string) => {
    onCategoryChange(selectedCategories.filter(id => id !== categoryId));
  };

  if (isPrimaryLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
      </div>
    );
  }

  const availableCategories = primaryCategories?.filter(
    category => !selectedCategories.includes(category.category_id)
  ) || [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('onboarding.selectCategories')}
        </label>
        
        <Select onValueChange={handleCategorySelect} disabled={selectedCategories.length >= maxSelections}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={
              selectedCategories.length >= maxSelections 
                ? t('onboarding.maxCategoriesSelected', 'Maximum erreicht') 
                : t('onboarding.selectCategories')
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
          {t('onboarding.categoriesSelected', { 
            count: selectedCategories.length, 
            max: maxSelections
          })}
        </p>
        
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(categoryId => {
              const category = primaryCategories?.find(c => c.category_id === categoryId);
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