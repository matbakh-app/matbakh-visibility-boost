
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GmbCategory } from '@/hooks/useOnboardingQuestions';
import { Sparkles, Check } from 'lucide-react';

interface AiSuggestionCardProps {
  category: GmbCategory;
  language: 'de' | 'en';
  selected: boolean;
  onSelect: () => void;
}

export const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({
  category,
  language,
  selected,
  onSelect
}) => {
  const categoryName = language === 'en' ? category.name_en : category.name_de;

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
      selected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              selected ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              {selected ? (
                <Check className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{categoryName}</h4>
              <p className="text-sm text-gray-500">
                {language === 'de' ? 'KI-Vorschlag basierend auf Ihrer Beschreibung' : 'AI suggestion based on your description'}
              </p>
            </div>
          </div>
          <Button
            variant={selected ? 'default' : 'outline'}
            size="sm"
            onClick={onSelect}
            className="ml-4"
          >
            {selected ? 
              (language === 'de' ? 'Ausgewählt' : 'Selected') : 
              (language === 'de' ? 'Auswählen' : 'Select')
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
