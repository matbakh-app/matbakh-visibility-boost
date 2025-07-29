import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';

interface RelatedCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  confidence: 'high' | 'medium' | 'low';
  strength: number;
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
  maxSelections = 20
}) => {
  const { t, i18n } = useTranslation('onboarding');
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [allSubCategories, setAllSubCategories] = useState<RelatedCategory[]>([]);
  const [displayedSuggestions, setDisplayedSuggestions] = useState<RelatedCategory[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Load suggestions pool when main categories change
  useEffect(() => {
    if (selectedMainCategories.length > 0) {
      loadCategoriesPool();
    } else {
      setAllSubCategories([]);
      setDisplayedSuggestions([]);
    }
  }, [selectedMainCategories, i18n.language]);

  // Update displayed suggestions when selected categories change
  useEffect(() => {
    updateDisplayedSuggestions();
  }, [allSubCategories, selectedSubCategories]);

  const loadCategoriesPool = async () => {
    setIsLoadingSuggestions(true);
    try {
      console.log('Loading FULL categories pool for:', selectedMainCategories);
      
      // Load ALL subcategories from database without limit
      const { data, error } = await supabase
        .from('gmb_categories')
        .select('category_id, name_de, name_en, description_de, description_en, keywords, main_category, haupt_kategorie, is_popular, sort_order')
        .in('main_category', selectedMainCategories)
        .order('is_popular', { ascending: false })
        .order('sort_order', { ascending: true });

      let pool: RelatedCategory[] = [];
      
      if (data && !error && data.length > 0) {
        // Convert ALL database entries to RelatedCategory format
        pool = data.map(item => ({
          id: item.category_id,
          name: i18n.language === 'de' ? (item.name_de || item.name_en) : (item.name_en || item.name_de),
          description: i18n.language === 'de' ? (item.description_de || item.description_en || '') : (item.description_en || item.description_de || ''),
          keywords: item.keywords || [],
          confidence: item.is_popular ? 'high' : 'medium',
          strength: item.is_popular ? 0.9 : 0.6
        }));
        console.log('✅ Loaded ALL categories from database:', pool.length, 'total categories');
      } else {
        console.log('⚠️ No data from database, generating extensive mock data');
        pool = generateExtensiveMockData(selectedMainCategories);
      }
      
      console.log('📊 Final pool size:', pool.length, 'categories available');
      setAllSubCategories(pool);
      
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      const fallbackPool = generateExtensiveMockData(selectedMainCategories);
      console.log('🔄 Using fallback pool with', fallbackPool.length, 'categories');
      setAllSubCategories(fallbackPool);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const updateDisplayedSuggestions = () => {
    if (!allSubCategories.length) return;

    const available = allSubCategories.filter(cat => 
      !selectedSubCategories.includes(cat.id)
    );
    
    // Show up to 20 suggestions that aren't selected, prioritize by confidence
    const sortedAvailable = available.sort((a, b) => {
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });
    
    const newDisplayed = sortedAvailable.slice(0, Math.min(20, maxSelections));
    setDisplayedSuggestions(newDisplayed);
    
    console.log('🔄 Updated displayed suggestions:', newDisplayed.length, 'displayed from', available.length, 'available (total pool:', allSubCategories.length, ')');
  };

  const generateExtensiveMockData = (mainCategories: string[]): RelatedCategory[] => {
    // Generate much more extensive mock data to simulate full database
    const baseCategories = generateComprehensiveMockData(mainCategories);
    
    // Add many more categories to simulate a full database
    const additionalCategories: RelatedCategory[] = [];
    
    for (let i = 1; i <= 100; i++) {
      additionalCategories.push({
        id: `category_${i}`,
        name: i18n.language === 'de' ? `Zusätzliche Kategorie ${i}` : `Additional Category ${i}`,
        description: i18n.language === 'de' ? `Beschreibung für Kategorie ${i}` : `Description for category ${i}`,
        keywords: ['kategorie', 'zusätzlich', `tag${i}`],
        confidence: i <= 30 ? 'high' : i <= 70 ? 'medium' : 'low',
        strength: i <= 30 ? 0.8 : i <= 70 ? 0.6 : 0.4
      });
    }
    
    const fullPool = [...baseCategories, ...additionalCategories];
    console.log('📈 Generated extensive mock pool with', fullPool.length, 'categories');
    return fullPool;
  };

  const generateComprehensiveMockData = (mainCategories: string[]): RelatedCategory[] => {
    const mockData: Record<string, RelatedCategory[]> = {
      'restaurant': [
        { id: 'fine_dining', name: i18n.language === 'de' ? 'Fine Dining Restaurant' : 'Fine Dining', description: i18n.language === 'de' ? 'Gehobene Küche mit exzellentem Service' : 'Upscale dining with excellent service', keywords: ['elegant', 'edel', 'fine'], confidence: 'high', strength: 0.9 },
        { id: 'family_restaurant', name: i18n.language === 'de' ? 'Familienrestaurant' : 'Family Restaurant', description: i18n.language === 'de' ? 'Familienfreundliche Atmosphäre' : 'Family-friendly atmosphere', keywords: ['familie', 'family'], confidence: 'high', strength: 0.9 },
        { id: 'casual_dining', name: i18n.language === 'de' ? 'Casual Dining' : 'Casual Dining', description: i18n.language === 'de' ? 'Zwanglose, entspannte Atmosphäre' : 'Relaxed, informal atmosphere', keywords: ['entspannt', 'casual'], confidence: 'medium', strength: 0.7 },
        { id: 'steakhouse', name: i18n.language === 'de' ? 'Steakhouse' : 'Steakhouse', description: i18n.language === 'de' ? 'Spezialisiert auf Fleischgerichte' : 'Specialized in meat dishes', keywords: ['steak', 'fleisch', 'meat'], confidence: 'medium', strength: 0.7 },
        { id: 'italian_restaurant', name: i18n.language === 'de' ? 'Italienisches Restaurant' : 'Italian Restaurant', description: i18n.language === 'de' ? 'Authentische italienische Küche' : 'Authentic Italian cuisine', keywords: ['italienisch', 'pasta', 'pizza'], confidence: 'high', strength: 0.8 },
        { id: 'asian_restaurant', name: i18n.language === 'de' ? 'Asiatisches Restaurant' : 'Asian Restaurant', description: i18n.language === 'de' ? 'Asiatische Küche und Spezialitäten' : 'Asian cuisine and specialties', keywords: ['asia', 'sushi', 'thai'], confidence: 'medium', strength: 0.6 },
        { id: 'mexican_restaurant', name: i18n.language === 'de' ? 'Mexikanisches Restaurant' : 'Mexican Restaurant', description: i18n.language === 'de' ? 'Authentische mexikanische Gerichte' : 'Authentic Mexican dishes', keywords: ['mexikanisch', 'tacos', 'burrito'], confidence: 'medium', strength: 0.6 },
        { id: 'seafood_restaurant', name: i18n.language === 'de' ? 'Fischrestaurant' : 'Seafood Restaurant', description: i18n.language === 'de' ? 'Frische Meeresfrüchte und Fisch' : 'Fresh seafood and fish', keywords: ['fisch', 'seafood', 'meeresfrüchte'], confidence: 'medium', strength: 0.6 },
        { id: 'vegetarian_restaurant', name: i18n.language === 'de' ? 'Vegetarisches Restaurant' : 'Vegetarian Restaurant', description: i18n.language === 'de' ? 'Vegetarische und vegane Küche' : 'Vegetarian and vegan cuisine', keywords: ['vegetarisch', 'vegan', 'gesund'], confidence: 'medium', strength: 0.6 },
        { id: 'burger_restaurant', name: i18n.language === 'de' ? 'Burger Restaurant' : 'Burger Restaurant', description: i18n.language === 'de' ? 'Spezialisiert auf Burger und Sandwiches' : 'Specialized in burgers and sandwiches', keywords: ['burger', 'fast', 'amerikanisch'], confidence: 'low', strength: 0.4 },
        { id: 'pizza_restaurant', name: i18n.language === 'de' ? 'Pizzeria' : 'Pizza Restaurant', description: i18n.language === 'de' ? 'Traditionelle und moderne Pizza' : 'Traditional and modern pizza', keywords: ['pizza', 'italienisch', 'holzofen'], confidence: 'medium', strength: 0.5 },
        { id: 'bbq_restaurant', name: i18n.language === 'de' ? 'BBQ Restaurant' : 'BBQ Restaurant', description: i18n.language === 'de' ? 'Gegrillte Spezialitäten und Smokehouse' : 'Grilled specialties and smokehouse', keywords: ['bbq', 'grill', 'rauch'], confidence: 'low', strength: 0.4 },
        { id: 'breakfast_restaurant', name: i18n.language === 'de' ? 'Frühstücksrestaurant' : 'Breakfast Restaurant', description: i18n.language === 'de' ? 'Spezialisiert auf Frühstück und Brunch' : 'Specialized in breakfast and brunch', keywords: ['frühstück', 'brunch', 'pancakes'], confidence: 'low', strength: 0.3 },
        { id: 'indian_restaurant', name: i18n.language === 'de' ? 'Indisches Restaurant' : 'Indian Restaurant', description: i18n.language === 'de' ? 'Traditionelle indische Küche' : 'Traditional Indian cuisine', keywords: ['indisch', 'curry', 'tandoor'], confidence: 'medium', strength: 0.5 },
        { id: 'french_restaurant', name: i18n.language === 'de' ? 'Französisches Restaurant' : 'French Restaurant', description: i18n.language === 'de' ? 'Klassische französische Küche' : 'Classic French cuisine', keywords: ['französisch', 'haute cuisine', 'wein'], confidence: 'medium', strength: 0.5 }
      ],
      'cafe': [
        { id: 'coffee_shop', name: i18n.language === 'de' ? 'Coffee Shop' : 'Coffee Shop', description: i18n.language === 'de' ? 'Spezialisiert auf Kaffeespezialitäten' : 'Specialized in coffee specialties', keywords: ['kaffee', 'coffee'], confidence: 'high', strength: 0.9 },
        { id: 'bistro', name: i18n.language === 'de' ? 'Bistro' : 'Bistro', description: i18n.language === 'de' ? 'Kleine Gerichte und gemütliche Atmosphäre' : 'Small dishes and cozy atmosphere', keywords: ['bistro', 'gemütlich'], confidence: 'high', strength: 0.9 },
        { id: 'bakery_cafe', name: i18n.language === 'de' ? 'Bäckerei-Café' : 'Bakery Café', description: i18n.language === 'de' ? 'Frische Backwaren und Kaffee' : 'Fresh baked goods and coffee', keywords: ['bäckerei', 'bakery'], confidence: 'medium', strength: 0.7 },
        { id: 'breakfast_cafe', name: i18n.language === 'de' ? 'Frühstückscafé' : 'Breakfast Café', description: i18n.language === 'de' ? 'Spezialisiert auf Frühstück und Brunch' : 'Specialized in breakfast and brunch', keywords: ['frühstück', 'breakfast'], confidence: 'medium', strength: 0.6 },
        { id: 'tea_house', name: i18n.language === 'de' ? 'Teehaus' : 'Tea House', description: i18n.language === 'de' ? 'Große Auswahl an Tees und leichten Snacks' : 'Wide selection of teas and light snacks', keywords: ['tee', 'tea'], confidence: 'low', strength: 0.4 },
        { id: 'ice_cream_cafe', name: i18n.language === 'de' ? 'Eiscafé' : 'Ice Cream Café', description: i18n.language === 'de' ? 'Hausgemachtes Eis und kalte Getränke' : 'Homemade ice cream and cold drinks', keywords: ['eis', 'gelato', 'sommer'], confidence: 'medium', strength: 0.5 },
        { id: 'bookstore_cafe', name: i18n.language === 'de' ? 'Buchcafé' : 'Bookstore Café', description: i18n.language === 'de' ? 'Café mit Buchhandlung' : 'Café with bookstore', keywords: ['bücher', 'lesen', 'gemütlich'], confidence: 'low', strength: 0.3 },
        { id: 'roastery', name: i18n.language === 'de' ? 'Kaffeerösterei' : 'Coffee Roastery', description: i18n.language === 'de' ? 'Eigene Röstung und Premium-Kaffee' : 'Own roasting and premium coffee', keywords: ['rösterei', 'specialty coffee', 'bohnen'], confidence: 'medium', strength: 0.6 }
      ],
      'bar': [
        { id: 'cocktail_bar', name: i18n.language === 'de' ? 'Cocktailbar' : 'Cocktail Bar', description: i18n.language === 'de' ? 'Kreative Cocktails und stilvolles Ambiente' : 'Creative cocktails and stylish ambiance', keywords: ['cocktail', 'drinks'], confidence: 'high', strength: 0.9 },
        { id: 'wine_bar', name: i18n.language === 'de' ? 'Weinbar' : 'Wine Bar', description: i18n.language === 'de' ? 'Ausgewählte Weine und kleine Gerichte' : 'Selected wines and small dishes', keywords: ['wein', 'wine'], confidence: 'high', strength: 0.8 },
        { id: 'sports_bar', name: i18n.language === 'de' ? 'Sportsbar' : 'Sports Bar', description: i18n.language === 'de' ? 'Live-Sport und kalte Getränke' : 'Live sports and cold drinks', keywords: ['sport', 'fußball'], confidence: 'medium', strength: 0.6 },
        { id: 'pub', name: i18n.language === 'de' ? 'Pub/Kneipe' : 'Pub', description: i18n.language === 'de' ? 'Traditionelle Atmosphäre und lokale Biere' : 'Traditional atmosphere and local beers', keywords: ['pub', 'kneipe', 'bier'], confidence: 'medium', strength: 0.7 },
        { id: 'rooftop_bar', name: i18n.language === 'de' ? 'Rooftop Bar' : 'Rooftop Bar', description: i18n.language === 'de' ? 'Bar mit Aussicht und besonderer Atmosphäre' : 'Bar with view and special atmosphere', keywords: ['rooftop', 'aussicht'], confidence: 'low', strength: 0.4 },
        { id: 'beer_garden', name: i18n.language === 'de' ? 'Biergarten' : 'Beer Garden', description: i18n.language === 'de' ? 'Outdoor-Bereich mit regionalen Bieren' : 'Outdoor area with regional beers', keywords: ['biergarten', 'outdoor', 'gemütlich'], confidence: 'medium', strength: 0.6 },
        { id: 'whiskey_bar', name: i18n.language === 'de' ? 'Whiskey Bar' : 'Whiskey Bar', description: i18n.language === 'de' ? 'Spezialisiert auf Whiskey und Spirituosen' : 'Specialized in whiskey and spirits', keywords: ['whiskey', 'spirits', 'premium'], confidence: 'low', strength: 0.3 },
        { id: 'lounge_bar', name: i18n.language === 'de' ? 'Lounge Bar' : 'Lounge Bar', description: i18n.language === 'de' ? 'Entspannte Atmosphäre und Musik' : 'Relaxed atmosphere and music', keywords: ['lounge', 'entspannt', 'musik'], confidence: 'medium', strength: 0.5 }
      ]
    };

    let pool: RelatedCategory[] = [];
    mainCategories.forEach(category => {
      if (mockData[category]) {
        pool = pool.concat(mockData[category]);
      }
    });
    
    // Add additional general categories if pool is small
    if (pool.length < 10) {
      const additionalCategories: RelatedCategory[] = [
        { id: 'delivery_service', name: i18n.language === 'de' ? 'Lieferservice' : 'Delivery Service', description: i18n.language === 'de' ? 'Lieferung nach Hause' : 'Home delivery service', keywords: ['lieferung', 'delivery'], confidence: 'medium', strength: 0.6 },
        { id: 'takeaway', name: i18n.language === 'de' ? 'Abholung' : 'Takeaway', description: i18n.language === 'de' ? 'Essen zum Mitnehmen' : 'Food to go', keywords: ['abholen', 'takeaway'], confidence: 'medium', strength: 0.5 },
        { id: 'catering', name: i18n.language === 'de' ? 'Catering' : 'Catering', description: i18n.language === 'de' ? 'Catering für Events' : 'Event catering service', keywords: ['catering', 'events'], confidence: 'low', strength: 0.4 },
        { id: 'buffet', name: i18n.language === 'de' ? 'Buffet Restaurant' : 'Buffet Restaurant', description: i18n.language === 'de' ? 'Selbstbedienung und vielfältige Auswahl' : 'Self-service and diverse selection', keywords: ['buffet', 'selbstbedienung'], confidence: 'low', strength: 0.3 },
        { id: 'food_truck', name: i18n.language === 'de' ? 'Food Truck' : 'Food Truck', description: i18n.language === 'de' ? 'Mobile Küche und Street Food' : 'Mobile kitchen and street food', keywords: ['food truck', 'street food', 'mobil'], confidence: 'low', strength: 0.3 }
      ];
      pool = pool.concat(additionalCategories);
    }
    
    return pool;
  };

  const handleCategorySelect = (category: RelatedCategory) => {
    if (selectedSubCategories.length < maxSelections && !selectedSubCategories.includes(category.id)) {
      onSubCategoryChange([...selectedSubCategories, category.id]);
      setOpen(false);
      setSearchTerm('');
    }
  };

  const removeCategory = (categoryId: string) => {
    onSubCategoryChange(selectedSubCategories.filter(id => id !== categoryId));
  };

  const removeSuggestionCard = (categoryId: string) => {
    // Remove from displayed suggestions and replace with next available
    setDisplayedSuggestions(prev => {
      const filtered = prev.filter(cat => cat.id !== categoryId);
      
      // Get next best available category from pool
      const usedIds = new Set([...filtered.map(c => c.id), ...selectedSubCategories, categoryId]);
      const nextAvailable = allSubCategories
        .filter(cat => !usedIds.has(cat.id))
        .sort((a, b) => {
          const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        })[0];
      
      return nextAvailable ? [...filtered, nextAvailable] : filtered;
    });
  };

  // Filter options for dropdown based on search - NOW INCLUDES ALL CATEGORIES
  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      // When no search term, show first 20 available categories
      return allSubCategories
        .filter(cat => !selectedSubCategories.includes(cat.id))
        .slice(0, 20);
    }
    
    // When searching, filter through ALL categories and show up to 50 results
    const term = searchTerm.toLowerCase();
    return allSubCategories
      .filter(cat => {
        if (selectedSubCategories.includes(cat.id)) return false;
        
        return (
          cat.name.toLowerCase().includes(term) ||
          cat.keywords.some(keyword => keyword.toLowerCase().includes(term)) ||
          cat.description.toLowerCase().includes(term)
        );
      })
      .slice(0, 50); // Show more results when searching
  }, [searchTerm, allSubCategories, selectedSubCategories]);

  const getConfidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low': return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  const renderCategoryCard = (category: RelatedCategory, showRemoveButton = false) => {
    const isSelected = selectedSubCategories.includes(category.id);
    const isDisabled = !isSelected && selectedSubCategories.length >= maxSelections;
    
    return (
      <Card 
        key={category.id}
        className={`
          transition-all duration-200 cursor-pointer hover:border-primary/50 hover:shadow-sm
          ${isSelected ? 'ring-2 ring-primary bg-primary/5 border-primary' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !isDisabled && !isSelected && handleCategorySelect(category)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getConfidenceIcon(category.confidence)}
                <h4 className="font-medium text-sm leading-tight">
                  {category.name}
                </h4>
              </div>
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {category.description}
              </p>
              
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
            
            {showRemoveButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSuggestionCard(category.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
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
          {t('categorySelector.subCategory.title', 'Unterkategorien auswählen')}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('categorySelector.subCategory.description', 
            `Verfeinern Sie Ihre Auswahl mit bis zu ${maxSelections} spezifischen Unterkategorien.`
          )}
        </p>
      </div>

      {/* Dropdown Search */}
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={selectedSubCategories.length >= maxSelections}
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                {t('categorySelector.subCategory.searchPlaceholder', 'Unterkategorie suchen...')}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder={t('categorySelector.subCategory.searchPlaceholder', 'Suche nach Unterkategorien...')}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>
                  {t('categorySelector.subCategory.noResults', 'Keine Kategorien gefunden für:')} "{searchTerm}"
                </CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.id}
                      onSelect={() => handleCategorySelect(category)}
                      disabled={selectedSubCategories.includes(category.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {getConfidenceIcon(category.confidence)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{category.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {category.description}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">
            {t('categorySelector.subCategory.selected', 'Ausgewählte Unterkategorien')}
          </h4>
          <span className="text-xs text-muted-foreground">
            {selectedSubCategories.length} / {maxSelections}
          </span>
        </div>
        
        <Progress value={(selectedSubCategories.length / maxSelections) * 100} className="h-2" />
        
        {selectedSubCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedSubCategories.map(categoryId => {
              const category = allSubCategories.find(c => c.id === categoryId);
              return category ? (
                <Badge 
                  key={categoryId} 
                  variant="default" 
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {category.name}
                  <button
                    onClick={() => removeCategory(categoryId)}
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
              {t('categorySelector.subCategory.noSelection', 'Noch keine Unterkategorien ausgewählt')}
            </p>
          </div>
        )}

        {selectedSubCategories.length < maxSelections && (
          <p className="text-xs text-muted-foreground">
            {t('categorySelector.subCategory.canAddMore', 
              `Sie können noch {{count}} weitere Kategorie(n) auswählen`, 
              { count: maxSelections - selectedSubCategories.length }
            )}
          </p>
        )}

        {selectedSubCategories.length === maxSelections && (
          <p className="text-xs text-green-600 font-medium">
            {t('categorySelector.subCategory.maxReached', 'Maximum erreicht - perfekte Auswahl!')}
          </p>
        )}
      </div>

      {/* Suggestions Grid - weitere Vorschläge */}
      {isLoadingSuggestions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              {t('categorySelector.subCategory.moreSuggestions', 'Weitere Vorschläge')}
            </h4>
            <span className="text-xs text-muted-foreground">
              {displayedSuggestions.length} verfügbar
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedSuggestions.map(category => 
              renderCategoryCard(category, true)
            )}
          </div>

          {displayedSuggestions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                {t('categorySelector.subCategory.allSelected', 'Alle verfügbaren Kategorien wurden ausgewählt oder angezeigt.')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          {t('categorySelector.subCategory.hint', 'KI-gestützte Vorschläge basierend auf Ihren Hauptkategorien')}
        </p>
      </div>
    </div>
  );
};