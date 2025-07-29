import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RelatedCategory {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  confidence: 'high' | 'medium' | 'low';
  strength?: number;
}

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
  maxSelections = 5
}) => {
  const { t, i18n } = useTranslation('onboarding');
  const [searchTerm, setSearchTerm] = useState('');
  const [allSubCategories, setAllSubCategories] = useState<RelatedCategory[]>([]);
  const [suggestions, setSuggestions] = useState<RelatedCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // Map main category slugs to exact DB values in 'haupt_kategorie'
  const slugToDisplay: Record<string,string> = {
    'food-drink': 'Essen & Trinken',
    'travel-tourism': 'Gastgewerbe und Tourismus', 
    'events-venues': 'Kunst, Unterhaltung & Freizeit',
    'education-training': 'Bildung & Ausbildung',
    'health-medical': 'Gesundheit & Medizinische Dienstleistungen',
    'retail-consumer': 'Einzelhandel & Verbraucherdienstleistungen',
    'automotive-transport': 'Automobil & Transport',
    'arts-entertainment': 'Kunst, Unterhaltung & Freizeit',
    'finance-insurance': 'Finanzdienstleistungen',
    'manufacturing-industrial': 'Fertigung & Industrie',
    'agriculture-natural': 'Land- und Forstwirtschaft, natürliche Ressourcen',
    'religious-places': 'Religiöse Stätten',
    'professional-services': 'Professionelle Dienstleistungen',
    'real-estate': 'Immobilien & Bauwesen',
    'government-public': 'Behörden & Öffentliche Dienste',
    'aviation': 'Luftfahrt',
    'sports': 'Sport',
    'other': 'Sonstige',
    'fashion-lifestyle': 'Mode & Lifestyle',
    // Fallback mappings for MainCategorySelector display names
    'beauty-bodycare': 'Mode & Lifestyle',
    'retail-shopping': 'Einzelhandel & Verbraucherdienstleistungen', 
    'entertainment-culture': 'Kunst, Unterhaltung & Freizeit',
    'health-wellness': 'Gesundheit & Medizinische Dienstleistungen',
    'home-garden': 'Immobilien & Bauwesen',
    'sports-fitness': 'Sport',
    'other-services': 'Sonstige',
    'technology-electronics': 'Sonstige',
    'religion-spirituality': 'Religiöse Stätten'
  };

  useEffect(() => {
    if (!selectedMainCategories.length) {
      setAllSubCategories([]);
      setSuggestions([]);
      return;
    }
    loadSubCategories();
  }, [selectedMainCategories, i18n.language]);

  const loadSubCategories = async () => {
    setLoading(true);
    const displayNames = selectedMainCategories
      .map(slug => slugToDisplay[slug])
      .filter(Boolean);
      
    console.log('Loading subcategories for:', displayNames);
    
    try {
      const { data, error } = await supabase
        .from('gmb_categories')
        .select('id, name_de, name_en, description_de, description_en, keywords, is_popular, sort_order')
        .in('haupt_kategorie', displayNames)
        .order('is_popular', { ascending: false })
        .order('sort_order', { ascending: true });
        
      if (error) throw error;
      
      const pool = data.map(item => ({
        id: item.id,
        name: i18n.language === 'de' ? item.name_de : item.name_en,
        description: i18n.language === 'de' ? item.description_de : item.description_en,
        keywords: item.keywords || [],
        confidence: (item.is_popular ? 'high' : 'medium') as 'high' | 'medium' | 'low',
        strength: item.sort_order || 0
      }));
      
      console.log('✅ Loaded', pool.length, 'subcategories from DB');
      setAllSubCategories(pool);
      setSuggestions(pool.slice(0, maxSelections));
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setAllSubCategories([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Update suggestions on selection change or search
  useEffect(() => {
    filterSuggestions();
  }, [allSubCategories, selectedSubCategories, searchTerm]);

  const filterSuggestions = () => {
    const term = searchTerm.toLowerCase();
    const available = allSubCategories.filter(c => !selectedSubCategories.includes(c.id));
    const filtered = term
      ? available.filter(c =>
          c.name.toLowerCase().includes(term) || 
          c.keywords.some(k => k.toLowerCase().includes(term)) ||
          (c.description && c.description.toLowerCase().includes(term))
        )
      : available;
    setSuggestions(filtered.slice(0, maxSelections));
  };

  const selectCategory = (cat: RelatedCategory) => {
    if (selectedSubCategories.length < maxSelections) {
      onSubCategoryChange([...selectedSubCategories, cat.id]);
    }
  };

  const removeBadge = (id: string) => {
    onSubCategoryChange(selectedSubCategories.filter(x => x !== id));
  };

  const filteredOptions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return suggestions.slice(0, 50);
    
    return allSubCategories
      .filter(c => !selectedSubCategories.includes(c.id))
      .filter(c =>
        c.name.toLowerCase().includes(term) || 
        c.keywords.some(k => k.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
      )
      .slice(0, 50);
  }, [searchTerm, allSubCategories, selectedSubCategories, suggestions]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {t('categorySelector.subCategory.title', 'Unterkategorien auswählen')}
      </h3>
      <p className="text-sm text-gray-600">
        {t('categorySelector.subCategory.description', 'Verfeinern Sie Ihre Auswahl mit bis zu 5 spezifischen Unterkategorien.')}
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
                {loading 
                  ? t('categorySelector.subCategory.loading', 'Lade Kategorien...')
                  : t('categorySelector.subCategory.noResults', 'Keine Kategorien gefunden')
                }
              </CommandEmpty>
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
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
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