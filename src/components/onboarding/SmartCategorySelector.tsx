import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Sparkles, ChevronRight, Info, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSmartCategorySelection } from '@/hooks/useSmartCategorySelection';
import { usePrimaryGmbCategories } from '@/hooks/useGmbCategories';
import type { GmbCategory } from '@/hooks/useOnboardingQuestions';

interface SmartCategorySelectorProps {
  businessDescription: string;
  businessName: string;
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  maxSelections?: number;
  defaultMode?: 'ai-first' | 'guided';
}

export const SmartCategorySelector: React.FC<SmartCategorySelectorProps> = ({
  businessDescription,
  businessName,
  selectedCategories,
  onCategoryChange,
  maxSelections = 3,
  defaultMode = 'guided'
}) => {
  const { t, i18n } = useTranslation('onboarding');
  const [mode, setMode] = useState<'ai-first' | 'guided'>(defaultMode);
  const [showAiTips, setShowAiTips] = useState(true);
  
  const { data: primaryCategories, isLoading: isPrimaryLoading } = usePrimaryGmbCategories();
  
  const {
    loading,
    error,
    aiSuggestions,
    getMainCategorySuggestions,
    getGuidedSuggestions
  } = useSmartCategorySelection({
    mode,
    businessDescription,
    businessName,
    availableCategories: primaryCategories || [],
    language: i18n.language as 'de' | 'en'
  });

  const getCategoryName = (category: GmbCategory) => {
    return i18n.language === 'de' ? category.name_de : category.name_en;
  };

  const findCategoryById = (id: string) => {
    return primaryCategories?.find(cat => cat.category_id === id);
  };

  const handleCategorySelect = (categoryId: string) => {
    if (!selectedCategories.includes(categoryId) && selectedCategories.length < maxSelections) {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  };

  const removeCategorySelection = (categoryId: string) => {
    onCategoryChange(selectedCategories.filter(id => id !== categoryId));
  };

  const availableCategories = primaryCategories?.filter(
    category => !selectedCategories.includes(category.category_id)
  ) || [];

  // KI-gestützte Vorschläge für den guided Mode
  const [guidedSuggestions, setGuidedSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    if (mode === 'guided' && businessDescription) {
      const suggestions = getGuidedSuggestions(businessDescription);
      setGuidedSuggestions(suggestions);
    }
  }, [mode, businessDescription, getGuidedSuggestions]);

  if (isPrimaryLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {t('categorySelector.title', 'Kategorien auswählen')}
          </h3>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAiTips(!showAiTips)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('categorySelector.helpTooltip', 'KI-Tipps ein-/ausblenden')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Tabs value={mode} onValueChange={(value) => setMode(value as 'ai-first' | 'guided')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-first" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('categorySelector.mode.aiFist', 'KI-Vorschläge')}
            </TabsTrigger>
            <TabsTrigger value="guided" className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {t('categorySelector.mode.guided', 'Schritt für Schritt')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-first" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  {t('categorySelector.aiMode.title', 'KI-empfohlene Kategorien')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {businessDescription ? (
                  <>
                    <Button 
                      onClick={getMainCategorySuggestions}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        t('categorySelector.aiMode.loading', 'KI analysiert...')
                      ) : (
                        t('categorySelector.aiMode.analyze', 'Kategorien von KI vorschlagen lassen')
                      )}
                    </Button>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {aiSuggestions.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          {t('categorySelector.aiMode.suggestionsLabel', 'Die KI empfiehlt basierend auf Ihrer Beschreibung:')}
                        </p>
                        
                        <div className="space-y-2">
                          {aiSuggestions.map((suggestion) => {
                            const category = findCategoryById(suggestion.categoryId);
                            const isSelected = selectedCategories.includes(suggestion.categoryId);
                            const canSelect = !isSelected && selectedCategories.length < maxSelections;
                            
                            return category ? (
                              <Card 
                                key={suggestion.categoryId}
                                className={`cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                                    : canSelect 
                                    ? 'hover:bg-gray-50' 
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                                onClick={() => canSelect && handleCategorySelect(suggestion.categoryId)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{getCategoryName(category)}</h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {suggestion.reason}
                                      </p>
                                      <div className="flex items-center mt-2">
                                        <Badge 
                                          variant={suggestion.confidence > 0.8 ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {suggestion.confidence > 0.8 ? 
                                            t('categorySelector.confidence.high', 'Hoch empfohlen') :
                                            t('categorySelector.confidence.medium', 'Relevant')
                                          }
                                        </Badge>
                                      </div>
                                    </div>
                                    {isSelected ? (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeCategorySelection(suggestion.categoryId);
                                        }}
                                      >
                                        {t('categorySelector.remove', 'Entfernen')}
                                      </Button>
                                    ) : (
                                      canSelect && (
                                        <Button variant="outline" size="sm">
                                          {t('categorySelector.select', 'Auswählen')}
                                        </Button>
                                      )
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      {t('categorySelector.aiMode.needDescription', 'Geben Sie zuerst eine Geschäftsbeschreibung ein, um KI-Vorschläge zu erhalten.')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guided" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('categorySelector.guidedMode.title', 'Manuelle Kategorie-Auswahl')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAiTips && guidedSuggestions.length > 0 && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-800">
                      <div className="flex items-center justify-between">
                        <span>
                          <strong>{t('categorySelector.guidedMode.aiTip', '💡 KI-Tipp:')}</strong> {t('categorySelector.guidedMode.suggestedCategories', 'Diese Kategorien könnten relevant sein:')}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowAiTips(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {guidedSuggestions.slice(0, 3).map(categoryId => {
                          const category = findCategoryById(categoryId);
                          return category ? (
                            <Badge 
                              key={categoryId}
                              variant="outline" 
                              className="cursor-pointer hover:bg-blue-100"
                              onClick={() => handleCategorySelect(categoryId)}
                            >
                              {getCategoryName(category)}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('categorySelector.selectLabel', 'Kategorie auswählen')}
                  </label>
                  
                  <Select 
                    onValueChange={handleCategorySelect} 
                    disabled={selectedCategories.length >= maxSelections}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        selectedCategories.length >= maxSelections 
                          ? t('categorySelector.maxReached', 'Maximum erreicht') 
                          : t('categorySelector.selectPlaceholder', 'Kategorie wählen...')
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map(category => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{getCategoryName(category)}</span>
                            {guidedSuggestions.includes(category.category_id) && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {t('categorySelector.aiSuggested', 'KI-Tipp')}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Selected categories display */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
{`${selectedCategories.length} von ${maxSelections} ausgewählt`}
          </p>
          
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(categoryId => {
                const category = findCategoryById(categoryId);
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

        {/* Switch mode hint */}
        <div className="text-center">
          <Button 
            variant="link" 
            size="sm"
            onClick={() => setMode(mode === 'ai-first' ? 'guided' : 'ai-first')}
            className="text-gray-500"
          >
            {mode === 'ai-first' 
              ? t('categorySelector.switchToGuided', 'Lieber manuell auswählen?')
              : t('categorySelector.switchToAi', 'KI-Vorschläge ausprobieren?')
            }
          </Button>
        </div>
      </div>
    </div>
  );
};