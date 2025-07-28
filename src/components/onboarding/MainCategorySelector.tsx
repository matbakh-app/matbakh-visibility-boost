import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

// Fixed main categories according to new blueprint
const MAIN_CATEGORIES = [
  { id: 'food-drink', de: 'Essen & Trinken', en: 'Food & Drink' },
  { id: 'entertainment-culture', de: 'Unterhaltung & Kultur', en: 'Entertainment & Culture' },
  { id: 'retail-shopping', de: 'Einzelhandel & Shopping', en: 'Retail & Shopping' },
  { id: 'health-wellness', de: 'Gesundheit & Wellness', en: 'Health & Wellness' },
  { id: 'automotive', de: 'Automotive & Transport', en: 'Automotive & Transport' },
  { id: 'beauty-personal-care', de: 'Beauty & Körperpflege', en: 'Beauty & Personal Care' },
  { id: 'sports-fitness', de: 'Sport & Fitness', en: 'Sports & Fitness' },
  { id: 'home-garden', de: 'Haus & Garten', en: 'Home & Garden' },
  { id: 'professional-services', de: 'Professionelle Dienstleistungen', en: 'Professional Services' },
  { id: 'education-training', de: 'Bildung & Ausbildung', en: 'Education & Training' },
  { id: 'technology-electronics', de: 'Technologie & Elektronik', en: 'Technology & Electronics' },
  { id: 'travel-tourism', de: 'Reisen & Tourismus', en: 'Travel & Tourism' },
  { id: 'finance-insurance', de: 'Finanzen & Versicherung', en: 'Finance & Insurance' },
  { id: 'real-estate', de: 'Immobilien', en: 'Real Estate' },
  { id: 'pets-animals', de: 'Haustiere & Tiere', en: 'Pets & Animals' },
  { id: 'events-venues', de: 'Events & Veranstaltungsorte', en: 'Events & Venues' },
  { id: 'government-public', de: 'Öffentliche Einrichtungen', en: 'Government & Public' },
  { id: 'religious-spiritual', de: 'Religion & Spiritualität', en: 'Religious & Spiritual' },
  { id: 'other-services', de: 'Weitere Dienstleistungen', en: 'Other Services' }
];

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
  
  const getCategoryName = (category: typeof MAIN_CATEGORIES[0]) => {
    return i18n.language === 'de' ? category.de : category.en;
  };

  const getCategoryDescription = (categoryId: string) => {
    // Add descriptions for better UX
    const descriptions: Record<string, { de: string; en: string }> = {
      'food-drink': {
        de: 'Restaurants, Cafés, Bars, Bäckereien, Lieferdienste',
        en: 'Restaurants, Cafés, Bars, Bakeries, Delivery Services'
      },
      'entertainment-culture': {
        de: 'Kinos, Theater, Museen, Konzerthallen, Veranstaltungen',
        en: 'Cinemas, Theaters, Museums, Concert Halls, Events'
      },
      'retail-shopping': {
        de: 'Geschäfte, Boutiquen, Märkte, Online-Shops',
        en: 'Stores, Boutiques, Markets, Online Shops'
      }
      // Add more as needed
    };
    
    const desc = descriptions[categoryId];
    return desc ? (i18n.language === 'de' ? desc.de : desc.en) : '';
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      // Remove category
      onCategoryChange(selectedCategories.filter(id => id !== categoryId));
    } else if (selectedCategories.length < maxSelections) {
      // Add category
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const removeCategorySelection = (categoryId: string) => {
    onCategoryChange(selectedCategories.filter(id => id !== categoryId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t('categorySelector.mainCategory.title', 'Hauptkategorien wählen')}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('categorySelector.mainCategory.description', 
            `Wählen Sie bis zu ${maxSelections} Hauptkategorien für Ihr Unternehmen aus.`
          )}
        </p>
      </div>

      {/* Checkbox Grid for Main Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {MAIN_CATEGORIES.map(category => {
          const isSelected = selectedCategories.includes(category.id);
          const isDisabled = !isSelected && selectedCategories.length >= maxSelections;
          
          return (
            <Card 
              key={category.id} 
              className={`
                cursor-pointer transition-all duration-200 
                ${isSelected 
                  ? 'ring-2 ring-primary bg-primary/5 border-primary' 
                  : 'hover:border-primary/50 hover:shadow-sm'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !isDisabled && handleCategoryToggle(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={isSelected}
                    disabled={isDisabled}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">
                      {getCategoryName(category)}
                    </h4>
                    {getCategoryDescription(category.id) && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {getCategoryDescription(category.id)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              {t('categorySelector.mainCategory.selected', 'Ausgewählte Kategorien')}
            </h4>
            <span className="text-xs text-muted-foreground">
              {selectedCategories.length} / {maxSelections}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(categoryId => {
              const category = MAIN_CATEGORIES.find(c => c.id === categoryId);
              return category ? (
                <Badge 
                  key={categoryId} 
                  variant="secondary" 
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {getCategoryName(category)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCategorySelection(categoryId);
                    }}
                    className="hover:bg-background/20 rounded-full p-0.5 transition-colors"
                    type="button"
                    aria-label={t('categorySelector.remove', 'Entfernen')}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">
          {selectedCategories.length === 0 && (
            t('categorySelector.mainCategory.hint', 'Wählen Sie Ihre Hauptkategorien aus')
          )}
          {selectedCategories.length > 0 && selectedCategories.length < maxSelections && (
            t('categorySelector.mainCategory.canAddMore', 
              `Sie können noch ${maxSelections - selectedCategories.length} weitere Kategorie(n) auswählen`
            )
          )}
          {selectedCategories.length === maxSelections && (
            t('categorySelector.mainCategory.maxReached', 'Maximum erreicht')
          )}
        </div>
      </div>
    </div>
  );
};