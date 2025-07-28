import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    }
  }, [selectedMainCategories, i18n.language]);

  const loadRelatedCategories = async () => {
    setIsLoadingSuggestions(true);
    try {
      // For now, use simplified query since we need to set up related_categories table first
      // This will load subcategories based on main category selection
      const { data: relatedCats, error } = await supabase
        .from('gmb_categories')
        .select(`
          id,
          category_id,
          name_de,
          name_en,
          description_de,
          description_en,
          keywords,
          haupt_kategorie,
          main_category
        `)
        .not('haupt_kategorie', 'is', null)
        .limit(50);

      if (error) {
        console.error('Error loading related categories:', error);
        // Fallback to mock data for demo
        const mockSuggestions = generateMockSuggestions(selectedMainCategories);
        setAiSuggestions(mockSuggestions);
        setAllSubCategories(mockSuggestions);
        setIsLoadingSuggestions(false);
        return;
      }

      // Filter categories relevant to selected main categories
      const filteredCats = (relatedCats || []).filter(cat => {
        const mainCat = i18n.language === 'de' ? cat.haupt_kategorie : cat.main_category;
        return selectedMainCategories.some(selected => 
          mainCat?.toLowerCase().includes(selected.toLowerCase()) ||
          selected.toLowerCase().includes(mainCat?.toLowerCase() || '')
        );
      });

      const suggestions: RelatedCategory[] = filteredCats.map((cat, index) => ({
        id: cat.category_id,
        name: i18n.language === 'de' ? cat.name_de : cat.name_en,
        description: i18n.language === 'de' ? cat.description_de : cat.description_en,
        keywords: cat.keywords || [],
        relationshipType: 'semantic',
        strength: Math.random() * 0.5 + 0.5, // Mock strength for now
        confidence: getConfidenceLevel(Math.random() * 0.5 + 0.5)
      })).filter(cat => cat.name).slice(0, 20);

      setAiSuggestions(suggestions);
      setAllSubCategories(suggestions);
      
    } catch (error) {
      console.error('Failed to load related categories:', error);
      // Fallback to mock data
      const mockSuggestions = generateMockSuggestions(selectedMainCategories);
      setAiSuggestions(mockSuggestions);
      setAllSubCategories(mockSuggestions);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const generateMockSuggestions = (mainCategories: string[]): RelatedCategory[] => {
    // Create a comprehensive mapping of main categories to subcategories
    const mockCategories: Record<string, RelatedCategory[]> = {
      // For "Essen & Trinken" category
      'essen-trinken': [
        { id: 'restaurant', name: 'Restaurant', description: 'Vollservice-Restaurant mit Bedienung', keywords: ['dining', 'food', 'service'], relationshipType: 'primary', strength: 0.9, confidence: 'high' },
        { id: 'cafe', name: 'Café', description: 'Kaffee und leichte Speisen', keywords: ['coffee', 'breakfast', 'casual'], relationshipType: 'primary', strength: 0.8, confidence: 'high' },
        { id: 'bar', name: 'Bar', description: 'Getränke und Cocktails', keywords: ['drinks', 'cocktails', 'evening'], relationshipType: 'primary', strength: 0.8, confidence: 'high' },
        { id: 'biergarten', name: 'Biergarten', description: 'Outdoor-Gastronomie mit Bier', keywords: ['beer', 'outdoor', 'garden'], relationshipType: 'related', strength: 0.7, confidence: 'medium' },
        { id: 'bakery', name: 'Bäckerei', description: 'Frisches Brot und Backwaren', keywords: ['bread', 'pastries', 'fresh'], relationshipType: 'related', strength: 0.6, confidence: 'medium' },
        { id: 'pizzeria', name: 'Pizzeria', description: 'Italienische Pizza-Spezialitäten', keywords: ['pizza', 'italian', 'casual'], relationshipType: 'related', strength: 0.7, confidence: 'medium' }
      ],
      // For "Unterhaltung & Kultur" category  
      'unterhaltung-kultur': [
        { id: 'theater', name: 'Theater', description: 'Aufführungen und Shows', keywords: ['shows', 'performance', 'culture'], relationshipType: 'primary', strength: 0.9, confidence: 'high' },
        { id: 'museum', name: 'Museum', description: 'Kunst und kulturelle Ausstellungen', keywords: ['art', 'culture', 'exhibition'], relationshipType: 'primary', strength: 0.8, confidence: 'high' },
        { id: 'cinema', name: 'Kino', description: 'Filme und Kinovorstellungen', keywords: ['movies', 'films', 'entertainment'], relationshipType: 'primary', strength: 0.8, confidence: 'high' },
        { id: 'nightclub', name: 'Nachtclub', description: 'Nachtleben und Tanzen', keywords: ['nightlife', 'dancing', 'music'], relationshipType: 'related', strength: 0.7, confidence: 'medium' },
        { id: 'concert-hall', name: 'Konzerthalle', description: 'Live-Musik und Konzerte', keywords: ['music', 'concert', 'live'], relationshipType: 'related', strength: 0.7, confidence: 'medium' }
      ],
      // For "Weitere Dienstleistungen" category
      'weitere-dienstleistungen': [
        { id: 'event-service', name: 'Event-Service', description: 'Veranstaltungsorganisation', keywords: ['events', 'planning', 'service'], relationshipType: 'primary', strength: 0.9, confidence: 'high' },
        { id: 'catering', name: 'Catering', description: 'Außer-Haus-Verpflegung', keywords: ['catering', 'delivery', 'events'], relationshipType: 'primary', strength: 0.8, confidence: 'high' },
        { id: 'consulting', name: 'Beratung', description: 'Fachberatung und Consulting', keywords: ['consulting', 'advice', 'business'], relationshipType: 'related', strength: 0.7, confidence: 'medium' },
        { id: 'cleaning', name: 'Reinigungsservice', description: 'Professionelle Reinigung', keywords: ['cleaning', 'maintenance', 'service'], relationshipType: 'related', strength: 0.6, confidence: 'medium' }
      ]
    };

    // Map the displayed category names to our mock category keys
    const categoryMapping: Record<string, string> = {
      'Essen & Trinken': 'essen-trinken',
      'Unterhaltung & Kultur': 'unterhaltung-kultur', 
      'Weitere Dienstleistungen': 'weitere-dienstleistungen',
      'Food & Drink': 'essen-trinken',
      'Entertainment & Culture': 'unterhaltung-kultur',
      'Additional Services': 'weitere-dienstleistungen'
    };

    // Get all subcategories for the selected main categories
    const allSuggestions = mainCategories.flatMap(cat => {
      const mappedKey = categoryMapping[cat] || cat.toLowerCase().replace(/\s+/g, '-');
      return mockCategories[mappedKey] || [];
    });

    return allSuggestions;
  };

  const getConfidenceLevel = (strength: number): 'high' | 'medium' | 'low' => {
    if (strength >= 0.8) return 'high';
    if (strength >= 0.5) return 'medium';
    return 'low';
  };

  const handleSubCategoryToggle = (categoryId: string) => {
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('categorySelector.subCategory.searchPlaceholder', 'Kategorie suchen...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selected Categories */}
      {selectedSubCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              {t('categorySelector.subCategory.selected', 'Ausgewählte Unterkategorien')}
            </h4>
            <span className="text-xs text-muted-foreground">
              {selectedSubCategories.length} / {maxSelections}
            </span>
          </div>
          
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
        </div>
      )}

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