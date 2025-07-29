import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useSubCategoriesWithCrossTags, type RelatedCategory } from '@/hooks/useSubCategoriesWithCrossTags';
import { useMainCategoryMapping, slugToDisplay } from '@/hooks/useMainCategoryMapping';

// RelatedCategory interface is now imported from the hook

interface SubCategorySelectorProps {
  selectedMainCategories: string[];     // slugs
  selectedSubCategories: string[];   // ids
  onSubCategoryChange: (ids: string[]) => void;
  maxSelectionsPerMainCategory?: number;
}

export const SubCategorySelector: React.FC<SubCategorySelectorProps> = ({
  selectedMainCategories,
  selectedSubCategories,
  onSubCategoryChange,
  maxSelectionsPerMainCategory = 7
}) => {
  const { t, i18n } = useTranslation('onboarding');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestionsByMainCategory, setSuggestionsByMainCategory] = useState<Record<string, RelatedCategory[]>>({});
  
  // Map slugs to canonical names for the hook
  const { slugsToIds, getCanonicalNameBySlug } = useMainCategoryMapping();
  const selectedMainCategoryNames = slugsToIds(selectedMainCategories);
  
  // Use the new hook for cross-tags support
  const { 
    allSubCategories, 
    loading, 
    error, 
    filterCategories, 
    logSearch 
  } = useSubCategoriesWithCrossTags(selectedMainCategoryNames, i18n.language as 'de' | 'en');

  // Update suggestions when data changes or main categories change
  useEffect(() => {
    if (allSubCategories.length > 0 && selectedMainCategories.length > 0) {
      console.log('Triggering updateSuggestions, categories:', allSubCategories.length, 'main cats:', selectedMainCategories);
      updateSuggestions();
    }
  }, [allSubCategories, selectedMainCategories]); // Removed selectedSubCategories to prevent infinite loop

  const shuffleArray = (array: RelatedCategory[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const updateSuggestions = () => {
    console.log('🔍 updateSuggestions called');
    console.log('🔍 Selected main categories:', selectedMainCategories);
    console.log('🔍 All subcategories count:', allSubCategories.length);
    console.log('🔍 Sample subcategory:', allSubCategories[0]);
    
    const newSuggestions: Record<string, RelatedCategory[]> = {};
    
    selectedMainCategories.forEach(mainCategorySlug => {
      console.log(`🔍 Processing main category slug: "${mainCategorySlug}"`);
      
      const displayName = getCanonicalNameBySlug(mainCategorySlug);
      console.log(`🔍 Converted slug "${mainCategorySlug}" to display name "${displayName}"`);
      
      // Get all available subcategories for this main category
      const available = allSubCategories.filter(c => {
        if (selectedSubCategories.includes(c.id)) {
          return false;
        }
        
        // Check if this subcategory belongs to the main category
        const belongsToMain = c.haupt_kategorie_name === displayName;
        // For cross-tags, check if any of the crossTagIds match our display name
        const hasMainInCrossTags = c.crossTagIds && c.crossTagIds.includes(displayName);
        
        return belongsToMain || hasMainInCrossTags;
      });
      
      console.log(`🔍 Found ${available.length} available subcategories for "${displayName}"`);
      
      // Show only 3 suggestions per main category (instead of 7)
      const shuffled = shuffleArray(available);
      newSuggestions[mainCategorySlug] = shuffled.slice(0, 3);
      
      console.log(`🔍 Added ${newSuggestions[mainCategorySlug].length} suggestions for "${mainCategorySlug}"`);
    });
    
    console.log('🔍 Final suggestions object:', newSuggestions);
    setSuggestionsByMainCategory(newSuggestions);
  };

  const reshuffleSuggestions = () => {
    updateSuggestions();
  };

  // Check how many categories are selected per main category
  const getSelectedCountForMainCategory = (mainCategorySlug: string) => {
    const displayName = getCanonicalNameBySlug(mainCategorySlug);
    
    return selectedSubCategories.filter(id => {
      const cat = allSubCategories.find(c => c.id === id);
      if (!cat) return false;
      return cat.haupt_kategorie_name === displayName || 
             (cat.crossTagIds && cat.crossTagIds.includes(displayName));
    }).length;
  };

  // Handle category selection with logging and card replacement
  const selectCategory = async (cat: RelatedCategory, fromMainCategory: string) => {
    const currentCountForMain = getSelectedCountForMainCategory(fromMainCategory);
    
    if (currentCountForMain < maxSelectionsPerMainCategory) {
      onSubCategoryChange([...selectedSubCategories, cat.id]);
      
      // Log the selection for analytics
      const allFiltered = filterCategories(searchTerm, selectedSubCategories);
      await logSearch(searchTerm, allFiltered.map(c => c.id), cat.id);
      
      // Clear search term after selection for better UX
      setSearchTerm('');
      
      // After selection, replace the card with a new one (nachrutschen)
      setTimeout(() => {
        replaceSelectedCard(fromMainCategory, cat.id);
      }, 100);
    }
  };

  // Replace a selected card with a new one from the pool
  const replaceSelectedCard = (mainCategorySlug: string, selectedCardId: string) => {
    const displayName = getCanonicalNameBySlug(mainCategorySlug);
    
    // Find all available categories for this main category (exclude currently selected ones)
    const currentlySelected = [...selectedSubCategories, selectedCardId];
    const available = allSubCategories.filter(c => {
      if (currentlySelected.includes(c.id)) return false;
      
      const belongsToMain = c.haupt_kategorie_name === displayName;
      const hasMainInCrossTags = c.crossTagIds && c.crossTagIds.includes(displayName);
      
      return belongsToMain || hasMainInCrossTags;
    });
    
    // Get current suggestions and remove the selected card
    const currentSuggestions = suggestionsByMainCategory[mainCategorySlug] || [];
    const remainingSuggestions = currentSuggestions.filter(c => c.id !== selectedCardId);
    
    // If we have available cards to replace with and we're below 3 cards
    if (available.length > 0 && remainingSuggestions.length < 3) {
      // Filter out cards already in suggestions
      const newCards = available.filter(c => 
        !currentSuggestions.some(existing => existing.id === c.id)
      );
      
      if (newCards.length > 0) {
        // Add one new random card
        const shuffled = shuffleArray(newCards);
        const newCard = shuffled[0];
        
        setSuggestionsByMainCategory(prev => ({
          ...prev,
          [mainCategorySlug]: [...remainingSuggestions, newCard]
        }));
      } else {
        // No new cards available, just update with remaining suggestions
        setSuggestionsByMainCategory(prev => ({
          ...prev,
          [mainCategorySlug]: remainingSuggestions
        }));
      }
    } else {
      // Just remove the selected card from suggestions
      setSuggestionsByMainCategory(prev => ({
        ...prev,
        [mainCategorySlug]: remainingSuggestions
      }));
    }
  };

  const removeBadge = (id: string) => {
    onSubCategoryChange(selectedSubCategories.filter(x => x !== id));
  };

  // Filtered options for the dropdown - only show results if search term is provided
  const filteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    
    // CRITICAL: Only show dropdown results if user has typed at least 1 character
    if (!term) return [];
    
    // Use the hook's filter function which includes cross-tags search
    return filterCategories(term, selectedSubCategories);
  }, [searchTerm, filterCategories, selectedSubCategories]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {t('categorySelector.subCategory.title', 'Unterkategorien auswählen')}
      </h3>
      <p className="text-sm text-gray-600">
        {t('categorySelector.subCategory.description', 'Verfeinern Sie Ihre Auswahl mit bis zu 7 Unterkategorien pro Hauptkategorie.')}
      </p>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={!selectedMainCategories.length || loading}
            className="w-full justify-between"
          >
            {t('categorySelector.subCategory.searchPlaceholder', 'Unterkategorie suchen...')}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-md p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={t('categorySelector.subCategory.searchPlaceholder', 'Unterkategorie suchen...')}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-60">
              <CommandEmpty>
                {!searchTerm ? (
                  t('categorySelector.subCategory.typeToSearch', 'Geben Sie mindestens 1 Zeichen ein...')
                ) : loading ? (
                  t('categorySelector.subCategory.loading', 'Lade Kategorien...')
                ) : (
                  t('categorySelector.subCategory.noResults', 'Keine Kategorien gefunden')
                )}
              </CommandEmpty>
              {searchTerm && (
                <CommandGroup>
                  {filteredOptions.map(cat => (
                    <CommandItem
                      key={cat.id}
                      value={cat.name}
                      onSelect={() => selectCategory(cat, cat.haupt_kategorie_name || '')}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">{cat.name}</div>
                        {cat.description && (
                          <div className="text-sm text-gray-500 mt-1">{cat.description}</div>
                        )}
                        {cat.crossTagIds && cat.crossTagIds.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            Cross-Tags: {cat.crossTagIds.length} verbunden
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      <div className="flex flex-wrap gap-2">
        {selectedSubCategories.map(id => {
          const cat = allSubCategories.find(c => c.id === id);
          return (
            cat && (
              <span
                key={id}
                className="inline-flex items-center gap-x-0.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              >
                {cat.name}
                <button
                  type="button"
                  className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-blue-600/20"
                  onClick={() => removeBadge(id)}
                >
                  <span className="sr-only">Remove</span>
                  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 stroke-blue-700/50 group-hover:stroke-blue-700/75">
                    <path d="m4 4 6 6m0-6-6 6" />
                  </svg>
                </button>
              </span>
            )
          );
        })}
      </div>

      {/* Suggestion cards grouped by main category */}
      {selectedMainCategories.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              {t('categorySelector.subCategory.suggestions', 'Empfehlungen')}
            </h4>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                reshuffleSuggestions();
              }}
              className="text-sm"
            >
              🎲 {t('categorySelector.subCategory.reshuffle', 'Neu mischen')}
            </Button>
          </div>

          {selectedMainCategories.map(mainCategory => {
            const suggestions = suggestionsByMainCategory[mainCategory] || [];
            const selectedCount = getSelectedCountForMainCategory(mainCategory);
            const maxReached = selectedCount >= maxSelectionsPerMainCategory;

            return (
              <div key={mainCategory} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-gray-700">
                    {mainCategory} ({selectedCount}/{maxSelectionsPerMainCategory})
                  </h5>
                  {maxReached && (
                    <span className="text-xs text-amber-600">Maximum erreicht</span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestions.map(cat => (
                    <div 
                      key={cat.id} 
                      className={`border rounded-lg p-3 transition-all ${
                        maxReached 
                          ? 'opacity-50 cursor-not-allowed border-gray-200' 
                          : 'hover:border-blue-300 hover:shadow-sm cursor-pointer'
                      }`}
                      onClick={() => !maxReached && selectCategory(cat, mainCategory)}
                    >
                      <h6 className="font-medium text-gray-900 text-sm">{cat.name}</h6>
                      {cat.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{cat.description}</p>
                      )}
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                        cat.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        cat.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cat.confidence === 'high' ? 'Empfohlen' : 
                         cat.confidence === 'medium' ? 'Relevant' : 'Optional'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {!loading && !allSubCategories.length && (
            <div className="text-center text-sm text-gray-500 py-8">
              {t('categorySelector.subCategory.selectMainFirst', 'Wählen Sie zuerst Hauptkategorien aus')}
            </div>
          )}
        </div>
      )}

      {/* Progress indicator with minimum requirement */}
      <div className="text-sm text-gray-500">
        {selectedSubCategories.length} {t('categorySelector.subCategory.selected', 'ausgewählt')}
        {selectedMainCategories.length > 0 && (
          <span className="ml-2">
            (max. {selectedMainCategories.length * maxSelectionsPerMainCategory} möglich)
          </span>
        )}
        {selectedSubCategories.length < 5 && (
          <span className="text-amber-600 ml-2">(Mindestens 5 empfohlen)</span>
        )}
      </div>
    </div>
  );
};