
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { usePrimaryGmbCategories, useGmbCategorySearch, useGmbCategoriesByParent } from '@/hooks/useGmbCategories';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const { data: primaryCategories, isLoading: isPrimaryLoading } = usePrimaryGmbCategories();
  const { data: searchResults, isLoading: isSearchLoading } = useGmbCategorySearch(searchTerm);

  const getCategoryName = (category: GmbCategory) => {
    return i18n.language === 'de' ? category.name_de : category.name_en;
  };

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else if (selectedCategories.length < maxSelections) {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const CategoryCard: React.FC<{ category: GmbCategory; isSubcategory?: boolean }> = ({ 
    category, 
    isSubcategory = false 
  }) => {
    const isSelected = selectedCategories.includes(category.category_id);
    const isExpanded = expandedCategories.includes(category.category_id);

    return (
      <Card 
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
        } ${isSubcategory ? 'ml-4 mt-2' : ''}`}
        onClick={() => toggleCategory(category.category_id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium">{getCategoryName(category)}</h3>
              {(category.description_de || category.description_en) && (
                <p className="text-sm text-gray-600 mt-1">{category.description_de || category.description_en}</p>
              )}
              {category.keywords && category.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {category.keywords.slice(0, 3).map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {!isSubcategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.category_id);
                }}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const SubcategoryList: React.FC<{ parentId: string }> = ({ parentId }) => {
    const { data: subcategories } = useGmbCategoriesByParent(parentId);

    if (!subcategories || subcategories.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        {subcategories.map(subcategory => (
          <CategoryCard 
            key={subcategory.category_id} 
            category={subcategory} 
            isSubcategory={true}
          />
        ))}
      </div>
    );
  };

  if (isPrimaryLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {t('onboarding.selectCategories')}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="h-4 w-4 mr-2" />
          {t('common.search')}
        </Button>
      </div>

      {showSearch && (
        <Card>
          <CardHeader>
            <CardTitle>{t('onboarding.searchCategories')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder={t('onboarding.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            {isSearchLoading && (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
              </div>
            )}
            
            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(category => (
                  <CategoryCard key={category.category_id} category={category} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {t('onboarding.categoriesSelected', { 
            count: selectedCategories.length, 
            max: maxSelections 
          })}
        </p>
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCategories.map(categoryId => {
              const category = primaryCategories?.find(c => c.category_id === categoryId);
              return category ? (
                <Badge key={categoryId} variant="default" className="cursor-pointer">
                  {getCategoryName(category)}
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className="ml-2 hover:bg-blue-700 rounded-full p-1"
                  >
                    ×
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-lg">{t('onboarding.mainCategories')}</h3>
        {primaryCategories?.map(category => (
          <div key={category.category_id}>
            <CategoryCard category={category} />
            {expandedCategories.includes(category.category_id) && (
              <SubcategoryList parentId={category.category_id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
