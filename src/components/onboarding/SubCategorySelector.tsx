import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useSubCategoriesWithCrossTags, type RelatedCategory } from '@/hooks/useSubCategoriesWithCrossTags';

// RelatedCategory interface is now imported from the hook

interface SubCategorySelectorProps {
  selectedMainCategories: string[];     // slugs
  selectedSubCategories: string[];   // ids
  onSubCategoryChange: (ids: string[]) => void;
  maxSelections?: number;
}

export const SubCategorySelector: React.FC<SubCategorySelectorProps> = ({
  selectedMainCategories,
  selectedSubCategories,
  onSubCategoryChange,
  maxSelections = 20
}) => {
  const { t, i18n } = useTranslation('onboarding');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<RelatedCategory[]>([]);
  
  // Use the new hook for cross-tags support
  const { 
    allSubCategories, 
    loading, 
    error, 
    filterCategories, 
    logSearch 
  } = useSubCategoriesWithCrossTags(selectedMainCategories, i18n.language as 'de' | 'en');

  // Update suggestions when data changes
  useEffect(() => {
    updateSuggestions();
  }, [allSubCategories, selectedSubCategories, searchTerm]);

  const updateSuggestions = () => {
    // For suggestion cards: show first 7 available categories, no search term required
    const available = allSubCategories.filter(c => !selectedSubCategories.includes(c.id));
    setSuggestions(available.slice(0, 7));
  };

  // Handle category selection with logging
  const selectCategory = async (cat: RelatedCategory) => {
    if (selectedSubCategories.length < maxSelections) {
      onSubCategoryChange([...selectedSubCategories, cat.id]);
      
      // Log the selection for analytics
      const allFiltered = filterCategories(searchTerm, selectedSubCategories);
      await logSearch(searchTerm, allFiltered.map(c => c.id), cat.id);
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
        {t('categorySelector.subCategory.description', 'Verfeinern Sie Ihre Auswahl mit bis zu 20 spezifischen Unterkategorien.')}
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
                      onSelect={() => selectCategory(cat)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">{cat.name}</div>
                        {cat.description && (
                          <div className="text-sm text-gray-500 mt-1">{cat.description}</div>
                        )}
                        {cat.crossTags && cat.crossTags.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            Cross-Tags: {cat.crossTags.join(', ')}
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

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map(cat => (
          <div 
            key={cat.id} 
            className="border rounded-lg p-4 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
            onClick={() => selectCategory(cat)}
          >
            <h4 className="font-medium text-gray-900">{cat.name}</h4>
            {cat.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{cat.description}</p>
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
        {!loading && !allSubCategories.length && (
          <div className="col-span-full text-center text-sm text-gray-500 py-8">
            {t('categorySelector.subCategory.selectMainFirst', 'Wählen Sie zuerst Hauptkategorien aus')}
          </div>
        )}
        {!loading && allSubCategories.length && !suggestions.length && selectedSubCategories.length < maxSelections && (
          <div className="col-span-full text-center text-sm text-gray-500 py-8">
            {t('categorySelector.subCategory.searchHint', 'Nutzen Sie die Suche, um weitere Kategorien zu finden')}
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="text-sm text-gray-500">
        {selectedSubCategories.length} / {maxSelections} {t('categorySelector.subCategory.selected', 'ausgewählt')}
      </div>
    </div>
  );
};