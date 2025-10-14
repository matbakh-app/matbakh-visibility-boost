import { useState, useCallback } from 'react';
// MIGRATED: Supabase removed - use AWS services
import { GmbCategory } from '@/hooks/useOnboardingQuestions';

interface DiversifiedSuggestion {
  categoryId: string;
  confidence: number;
  reason: string;
  rarity_score?: number;
}

interface SessionMemory {
  lastSuggestions: string[];
  requestCount: number;
}

const STORAGE_KEY = 'category_selection_memory';

export const useDiversifiedCategorySelection = () => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<DiversifiedSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load/save session memory for avoiding repetitions
  const getSessionMemory = (): SessionMemory => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { lastSuggestions: [], requestCount: 0 };
    } catch {
      return { lastSuggestions: [], requestCount: 0 };
    }
  };

  const updateSessionMemory = (newSuggestions: string[]) => {
    const memory = getSessionMemory();
    const updated = {
      lastSuggestions: [...memory.lastSuggestions, ...newSuggestions].slice(-20), // Keep last 20
      requestCount: memory.requestCount + 1
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const getDiversifiedSuggestions = useCallback(async (
    businessDescription: string,
    businessName: string,
    availableCategories: GmbCategory[],
    language: 'de' | 'en' = 'de'
  ) => {
    if (!businessDescription.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const memory = getSessionMemory();
      
      // Create diversified sampling from available categories
      const shuffledCategories = [...availableCategories]
        .sort(() => Math.random() - 0.5) // Randomize
        .filter(cat => {
          // Exclude recently suggested categories
          return !memory.lastSuggestions.includes(cat.name_de);
        });

      // Take different sample sizes based on request count for variety
      const sampleSizes = [15, 20, 12, 18, 16];
      const sampleSize = sampleSizes[memory.requestCount % sampleSizes.length];
      const sampleCategories = shuffledCategories.slice(0, sampleSize);

      // Enhanced diversification logic
      const diversifiedSample = diversifySelection(sampleCategories, memory);

      const { data, error } = await supabase.functions.invoke('ai-category-tagging', {
        body: {
          businessDescription,
          businessName,
          availableCategories: diversifiedSample.map(cat => ({
            id: cat.category_id,
            name_de: cat.name_de,
            name_en: cat.name_en,
            // Note: GmbCategory doesn't have description_de or keywords
          })),
          userContext: {
            businessName,
            businessDescription,
            lastSuggestions: memory.lastSuggestions.slice(-10), // Last 10 to avoid
            requestCount: memory.requestCount
          },
          diversityMode: true,
          language
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      const newSuggestions = data?.suggestions || [];
      
      // Update memory with new suggestions
      const suggestionNames = newSuggestions.map((s: DiversifiedSuggestion) => {
        const cat = availableCategories.find(c => c.category_id === s.categoryId);
        return cat?.name_de || '';
      }).filter(Boolean);
      
      updateSessionMemory(suggestionNames);
      setSuggestions(newSuggestions);

    } catch (err) {
      console.error('Error getting diversified suggestions:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Abrufen der Vorschläge');
      
      // Fallback: local diversified selection
      const fallbackSuggestions = createFallbackSuggestions(availableCategories, businessDescription);
      setSuggestions(fallbackSuggestions);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get fresh suggestions with different sampling
  const getMoreSuggestions = useCallback(async (
    businessDescription: string,
    businessName: string, 
    availableCategories: GmbCategory[],
    language: 'de' | 'en' = 'de'
  ) => {
    // Force new sampling by increasing request count
    const memory = getSessionMemory();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...memory,
      requestCount: memory.requestCount + 1
    }));
    
    await getDiversifiedSuggestions(businessDescription, businessName, availableCategories, language);
  }, [getDiversifiedSuggestions]);

  return {
    suggestions,
    loading,
    error,
    getDiversifiedSuggestions,
    getMoreSuggestions
  };
};

// Helper function to create diverse category selection  
function diversifySelection(categories: GmbCategory[], memory: SessionMemory): GmbCategory[] {
  // Group categories by popularity and type
  const popular = categories.filter(c => c.is_popular);
  const niche = categories.filter(c => !c.is_popular);
  
  // Mix strategy based on request count for variety
  const strategies = [
    () => [...niche.slice(0, 8), ...popular.slice(0, 4)], // Niche-heavy
    () => [...popular.slice(0, 6), ...niche.slice(0, 6)], // Balanced  
    () => [...categories.slice(0, 12)], // Random selection
    () => [...niche.slice(0, 10), ...popular.slice(0, 2)], // Ultra-niche
  ];
  
  const strategyIndex = memory.requestCount % strategies.length;
  return strategies[strategyIndex]();
}

// Fallback suggestions when AI fails
function createFallbackSuggestions(categories: GmbCategory[], description: string): DiversifiedSuggestion[] {
  const keywords = description.toLowerCase();
  
  // Smart keyword matching with diversity
  const scored = categories.map(cat => {
    let score = 0;
    const name = cat.name_de.toLowerCase();
    // Note: GmbCategory doesn't have description_de property
    
    // Keyword matching
    if (keywords.includes('restaurant') && name.includes('restaurant')) score += 8;
    if (keywords.includes('café') && name.includes('café')) score += 8;
    if (keywords.includes('bar') && name.includes('bar')) score += 8;
    if (keywords.includes('laden') && name.includes('laden')) score += 6;
    // Additional scoring based on name patterns
    if (keywords.includes('service') && name.includes('service')) score += 5;
    
    // Bonus for less popular categories to increase diversity
    if (!cat.is_popular) score += 3;
    
    // Random diversity factor
    score += Math.random() * 4;
    
    return { category: cat, score };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(item => ({
      categoryId: item.category.category_id,
      confidence: Math.min(0.9, 0.5 + (item.score / 20)),
      reason: `Relevant für ${description}`,
      rarity_score: item.category.is_popular ? 0.3 : 0.8
    }));
}