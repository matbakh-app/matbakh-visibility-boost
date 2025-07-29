import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Search } from 'lucide-react';

interface RelatedCategory {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  relationshipType?: string;
  strength?: number;
  confidence: 'high' | 'medium' | 'low';
}

interface SubCategorySelectorProps {
  selectedMainCategories: string[];
  selectedSubCategories: string[];
  onSubCategoryChange: (categories: string[]) => void;
  maxSelections?: number;
}

export const SubCategorySelector: React.FC<SubCategorySelectorProps> = ({
  selectedMainCategories,
  selectedSubCategories,
  onSubCategoryChange,
  maxSelections = 5
}) => {
  const { t, i18n } = useTranslation('onboarding');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<RelatedCategory[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<RelatedCategory[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Load AI-powered suggestions based on main categories
  useEffect(() => {
    if (selectedMainCategories.length > 0) {
      loadRelatedCategories();
    } else {
      setAiSuggestions([]);
      setAllSubCategories([]);
    }
  }, [selectedMainCategories, i18n.language]);

  const loadRelatedCategories = async () => {
    setIsLoadingSuggestions(true);
    try {
      console.log('Loading related categories for:', selectedMainCategories);
      
      // Generate mock suggestions based on main categories
      const mockSuggestions = generateMockSuggestions(selectedMainCategories);
      
      console.log('Loaded suggestions:', mockSuggestions);
      setAiSuggestions(mockSuggestions);
      setAllSubCategories(mockSuggestions);
      
    } catch (error) {
      console.error('Failed to load related categories:', error);
      // Fallback to basic mock data
      const fallbackSuggestions = generateMockSuggestions(selectedMainCategories);
      setAiSuggestions(fallbackSuggestions);
      setAllSubCategories(fallbackSuggestions);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const generateMockSuggestions = (mainCategories: string[]): RelatedCategory[] => {
    const mockData: Record<string, RelatedCategory[]> = {
      'restaurant': [
        { id: 'fine_dining', name: i18n.language === 'de' ? 'Fine Dining Restaurant' : 'Fine Dining', description: i18n.language === 'de' ? 'Gehobene Küche mit exzellentem Service' : 'Upscale dining with excellent service', keywords: ['elegant', 'edel', 'fine'], confidence: 'high' },
        { id: 'family_restaurant', name: i18n.language === 'de' ? 'Familienrestaurant' : 'Family Restaurant', description: i18n.language === 'de' ? 'Familienfreundliche Atmosphäre' : 'Family-friendly atmosphere', keywords: ['familie', 'family'], confidence: 'high' },
        { id: 'casual_dining', name: i18n.language === 'de' ? 'Casual Dining' : 'Casual Dining', description: i18n.language === 'de' ? 'Zwanglose, entspannte Atmosphäre' : 'Relaxed, informal atmosphere', keywords: ['entspannt', 'casual'], confidence: 'medium' },
        { id: 'steakhouse', name: i18n.language === 'de' ? 'Steakhouse' : 'Steakhouse', description: i18n.language === 'de' ? 'Spezialisiert auf Fleischgerichte' : 'Specialized in meat dishes', keywords: ['steak', 'fleisch', 'meat'], confidence: 'medium' },
        { id: 'italian_restaurant', name: i18n.language === 'de' ? 'Italienisches Restaurant' : 'Italian Restaurant', description: i18n.language === 'de' ? 'Authentische italienische Küche' : 'Authentic Italian cuisine', keywords: ['italienisch', 'pasta', 'pizza'], confidence: 'high' }
      ],
      'cafe': [
        { id: 'coffee_shop', name: i18n.language === 'de' ? 'Coffee Shop' : 'Coffee Shop', description: i18n.language === 'de' ? 'Spezialisiert auf Kaffeespezialitäten' : 'Specialized in coffee specialties', keywords: ['kaffee', 'coffee'], confidence: 'high' },
        { id: 'bistro', name: i18n.language === 'de' ? 'Bistro' : 'Bistro', description: i18n.language === 'de' ? 'Kleine Gerichte und gemütliche Atmosphäre' : 'Small dishes and cozy atmosphere', keywords: ['bistro', 'gemütlich'], confidence: 'high' },
        { id: 'bakery_cafe', name: i18n.language === 'de' ? 'Bäckerei-Café' : 'Bakery Café', description: i18n.language === 'de' ? 'Frische Backwaren und Kaffee' : 'Fresh baked goods and coffee', keywords: ['bäckerei', 'bakery'], confidence: 'medium' },
        { id: 'breakfast_cafe', name: i18n.language === 'de' ? 'Frühstückscafé' : 'Breakfast Café', description: i18n.language === 'de' ? 'Spezialisiert auf Frühstück und Brunch' : 'Specialized in breakfast and brunch', keywords: ['frühstück', 'breakfast'], confidence: 'medium' },
        { id: 'tea_house', name: i18n.language === 'de' ? 'Teehaus' : 'Tea House', description: i18n.language === 'de' ? 'Große Auswahl an Tees und leichten Snacks' : 'Wide selection of teas and light snacks', keywords: ['tee', 'tea'], confidence: 'low' }
      ],
      'bar': [
        { id: 'cocktail_bar', name: i18n.language === 'de' ? 'Cocktailbar' : 'Cocktail Bar', description: i18n.language === 'de' ? 'Kreative Cocktails und stilvolles Ambiente' : 'Creative cocktails and stylish ambiance', keywords: ['cocktail', 'drinks'], confidence: 'high' },
        { id: 'wine_bar', name: i18n.language === 'de' ? 'Weinbar' : 'Wine Bar', description: i18n.language === 'de' ? 'Ausgewählte Weine und kleine Gerichte' : 'Selected wines and small dishes', keywords: ['wein', 'wine'], confidence: 'high' },
        { id: 'sports_bar', name: i18n.language === 'de' ? 'Sportsbar' : 'Sports Bar', description: i18n.language === 'de' ? 'Live-Sport und kalte Getränke' : 'Live sports and cold drinks', keywords: ['sport', 'fußball'], confidence: 'medium' },
        { id: 'pub', name: i18n.language === 'de' ? 'Pub/Kneipe' : 'Pub', description: i18n.language === 'de' ? 'Traditionelle Atmosphäre und lokale Biere' : 'Traditional atmosphere and local beers', keywords: ['pub', 'kneipe', 'bier'], confidence: 'medium' },
        { id: 'rooftop_bar', name: i18n.language === 'de' ? 'Rooftop Bar' : 'Rooftop Bar', description: i18n.language === 'de' ? 'Bar mit Aussicht und besonderer Atmosphäre' : 'Bar with view and special atmosphere', keywords: ['rooftop', 'aussicht'], confidence: 'low' }
      ],
      'hotel': [
        { id: 'hotel_restaurant', name: i18n.language === 'de' ? 'Hotelrestaurant' : 'Hotel Restaurant', description: i18n.language === 'de' ? 'Restaurant in einem Hotel' : 'Restaurant within a hotel', keywords: ['hotel', 'gäste'], confidence: 'high' },
        { id: 'hotel_bar', name: i18n.language === 'de' ? 'Hotelbar' : 'Hotel Bar', description: i18n.language === 'de' ? 'Bar in einem Hotel' : 'Bar within a hotel', keywords: ['hotel', 'lobby'], confidence: 'medium' }
      ]
    };

    let suggestions: RelatedCategory[] = [];
    mainCategories.forEach(category => {
      if (mockData[category]) {
        suggestions = suggestions.concat(mockData[category]);
      }
    });
    
    // Add some additional suggestions if we don't have many
    if (suggestions.length < 3) {
      const additionalSuggestions: RelatedCategory[] = [
        { id: 'delivery_service', name: i18n.language === 'de' ? 'Lieferservice' : 'Delivery Service', description: i18n.language === 'de' ? 'Lieferung nach Hause' : 'Home delivery service', keywords: ['lieferung', 'delivery'], confidence: 'medium' },
        { id: 'takeaway', name: i18n.language === 'de' ? 'Abholung' : 'Takeaway', description: i18n.language === 'de' ? 'Essen zum Mitnehmen' : 'Food to go', keywords: ['abholen', 'takeaway'], confidence: 'medium' },
        { id: 'catering', name: i18n.language === 'de' ? 'Catering' : 'Catering', description: i18n.language === 'de' ? 'Catering für Events' : 'Event catering service', keywords: ['catering', 'events'], confidence: 'low' }
      ];
      suggestions = suggestions.concat(additionalSuggestions);
    }
    
    return suggestions;
  };

  const getConfidenceLevel = (strength: number): 'high' | 'medium' | 'low' => {
    if (strength >= 0.8) return 'high';
    if (strength >= 0.5) return 'medium';
    return 'low';
  };

  const handleSubCategoryToggle = (categoryId: string) => {
    console.log('Toggling subcategory:', categoryId);
    if (selectedSubCategories.includes(categoryId)) {
      // Remove category
      onSubCategoryChange(selectedSubCategories.filter(id => id !== categoryId));
    } else if (selectedSubCategories.length < maxSelections) {
      // Add category
      onSubCategoryChange([...selectedSubCategories, categoryId]);
    }
  };

  const removeSubCategorySelection = (categoryId: string) => {
    onSubCategoryChange(selectedSubCategories.filter(id => id !== categoryId));
  };

  // Filter suggestions based on search term
  const filteredSuggestions = aiSuggestions.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group suggestions by confidence level
  const highConfidenceSuggestions = filteredSuggestions.filter(cat => cat.confidence === 'high');
  const mediumConfidenceSuggestions = filteredSuggestions.filter(cat => cat.confidence === 'medium');
  const lowConfidenceSuggestions = filteredSuggestions.filter(cat => cat.confidence === 'low');

  const renderCategoryCard = (category: RelatedCategory, showConfidence = false) => {
    const isSelected = selectedSubCategories.includes(category.id);
    const isDisabled = !isSelected && selectedSubCategories.length >= maxSelections;
    
    return (
      <label
        key={category.id}
        htmlFor={`sub-category-${category.id}`}
        className={`
          block cursor-pointer transition-all duration-200 
          ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="checkbox"
          id={`sub-category-${category.id}`}
          checked={isSelected}
          disabled={isDisabled}
          onChange={() => handleSubCategoryToggle(category.id)}
          className="sr-only"
        />
        <Card 
          className={`
            transition-all duration-200 hover:border-primary/50 hover:shadow-sm
            ${isSelected 
              ? 'ring-2 ring-primary bg-primary/5 border-primary' 
              : ''
            }
            ${isDisabled ? 'opacity-50' : ''}
          `}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm leading-tight">
                    {category.name}
                  </h4>
                  {showConfidence && (
                    <Badge 
                      variant={category.confidence === 'high' ? 'default' : 'secondary'}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {category.confidence === 'high' ? '🎯' : category.confidence === 'medium' ? '⭐' : '💡'}
                    </Badge>
                  )}
                </div>
                
                {category.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {category.description}
                  </p>
                )}
                
                {category.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {category.keywords.slice(0, 3).map(keyword => (
                      <span key={keyword} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {isSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0 pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSubCategorySelection(category.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </label>
    );
  };

  if (selectedMainCategories.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">
          {t('categorySelector.subCategory.selectMainFirst', 
            'Wählen Sie zuerst Hauptkategorien aus, um Unterkategorien-Vorschläge zu erhalten.'
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t('categorySelector.subCategory.title', 'Unterkategorien verfeinern')}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('categorySelector.subCategory.description', 
            `Wählen Sie bis zu ${maxSelections} spezifische Unterkategorien für Ihr Unternehmen.`
          )}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t('categorySelector.subCategory.searchPlaceholder', 'Suche Unterkategorien...')}
          value={searchTerm}
          onChange={(e) => {
            console.log('Search term changed:', e.target.value);
            setSearchTerm(e.target.value);
          }}
          className="pl-10"
          disabled={selectedMainCategories.length === 0}
        />
      </div>

      {/* Selected Categories - Always Show */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">
            {t('categorySelector.subCategory.selected', 'Ausgewählte Unterkategorien')}
          </h4>
          <span className="text-xs text-muted-foreground">
            {selectedSubCategories.length} / {maxSelections}
          </span>
        </div>
        
        {selectedSubCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedSubCategories.map(categoryId => {
              const category = allSubCategories.find(c => c.id === categoryId);
              return category ? (
                <Badge 
                  key={categoryId} 
                  variant="secondary" 
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {category.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSubCategorySelection(categoryId);
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
        ) : (
          <div className="text-center py-4 border-2 border-dashed border-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {t('categorySelector.subCategory.selectMainFirst', 'Wählen Sie zuerst Hauptkategorien aus, um Vorschläge zu erhalten.')}
            </p>
          </div>
        )}
      </div>

      {/* AI Suggestions */}
      {isLoadingSuggestions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* High Confidence Suggestions */}
          {highConfidenceSuggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-sm">
                  {t('categorySelector.subCategory.highConfidence', 'Empfohlene Kategorien')}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {highConfidenceSuggestions.filter(cat => !selectedSubCategories.includes(cat.id)).slice(0, 4).map(cat => 
                  renderCategoryCard(cat, true)
                )}
              </div>
            </div>
          )}

          {/* Medium & Low Confidence Suggestions */}
          {(mediumConfidenceSuggestions.length > 0 || lowConfidenceSuggestions.length > 0) && (
            <div>
              <h4 className="font-medium text-sm mb-3">
                {t('categorySelector.subCategory.moreSuggestions', 'Weitere Vorschläge')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...mediumConfidenceSuggestions, ...lowConfidenceSuggestions]
                  .filter(cat => !selectedSubCategories.includes(cat.id))
                  .slice(0, 9)
                  .map(cat => renderCategoryCard(cat, true))
                }
              </div>
            </div>
          )}

          {filteredSuggestions.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                {t('categorySelector.subCategory.noResults', 'Keine Kategorien gefunden für:')} "{searchTerm}"
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">
          {selectedSubCategories.length === 0 && (
            t('categorySelector.subCategory.hint', 'KI-gestützte Vorschläge basierend auf Ihren Hauptkategorien')
          )}
          {selectedSubCategories.length > 0 && selectedSubCategories.length < maxSelections && (
            t('categorySelector.subCategory.canAddMore', 
              `Sie können noch ${maxSelections - selectedSubCategories.length} weitere Kategorie(n) auswählen`
            )
          )}
          {selectedSubCategories.length === maxSelections && (
            t('categorySelector.subCategory.maxReached', 'Maximum erreicht - perfekte Auswahl!')
          )}
        </div>
      </div>
    </div>
  );
};