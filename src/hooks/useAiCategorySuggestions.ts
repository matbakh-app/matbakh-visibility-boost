
import { useState } from 'react';
import { GmbCategory } from './useOnboardingQuestions';

export const useAiCategorySuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GmbCategory[]>([]);

  const getSuggestions = async (
    businessDescription: string,
    businessName: string,
    categories: GmbCategory[]
  ) => {
    if (!businessDescription.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Simple AI-like categorization logic
      const description = businessDescription.toLowerCase();
      const name = businessName.toLowerCase();
      const combinedText = `${description} ${name}`;

      const scoredCategories = categories.map(category => {
        let score = 0;
        const categoryName = category.name_de.toLowerCase();
        const categoryWords = categoryName.split(' ');

        // Keyword matching for restaurants
        if (combinedText.includes('restaurant') || combinedText.includes('essen') || 
            combinedText.includes('food') || combinedText.includes('küche')) {
          if (categoryName.includes('restaurant')) score += 10;
        }

        // Keyword matching for cafes
        if (combinedText.includes('café') || combinedText.includes('cafe') || 
            combinedText.includes('kaffee') || combinedText.includes('coffee')) {
          if (categoryName.includes('café')) score += 10;
        }

        // Keyword matching for bakeries
        if (combinedText.includes('bäckerei') || combinedText.includes('bakery') || 
            combinedText.includes('brot') || combinedText.includes('bread')) {
          if (categoryName.includes('bäckerei')) score += 10;
        }

        // Keyword matching for bars
        if (combinedText.includes('bar') || combinedText.includes('cocktail') || 
            combinedText.includes('drink') || combinedText.includes('getränk')) {
          if (categoryName.includes('bar')) score += 10;
        }

        // Keyword matching for beauty/salon
        if (combinedText.includes('friseur') || combinedText.includes('salon') || 
            combinedText.includes('beauty') || combinedText.includes('haare')) {
          if (categoryName.includes('salon')) score += 10;
        }

        // Keyword matching for IT/Software
        if (combinedText.includes('software') || combinedText.includes('app') || 
            combinedText.includes('web') || combinedText.includes('digital') ||
            combinedText.includes('it') || combinedText.includes('tech')) {
          if (categoryName.includes('software') || categoryName.includes('web')) score += 10;
        }

        // Keyword matching for medical
        if (combinedText.includes('arzt') || combinedText.includes('doctor') || 
            combinedText.includes('medical') || combinedText.includes('gesundheit')) {
          if (categoryName.includes('arzt') || categoryName.includes('zahnarzt')) score += 10;
        }

        // Bonus for exact word matches
        categoryWords.forEach(word => {
          if (combinedText.includes(word) && word.length > 3) {
            score += 5;
          }
        });

        // Bonus for popular categories
        if (category.is_popular) score += 2;

        return { ...category, score };
      });

      // Sort by score and take top 3
      const topSuggestions = scoredCategories
        .filter(cat => cat.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setSuggestions(topSuggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, getSuggestions };
};
