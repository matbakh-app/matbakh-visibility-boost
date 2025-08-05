import { useEffect, useState } from 'react';
import { getBedrockSuggestions, CategorySuggestion } from '@/services/bedrock';
import { VCData } from '@/services/UserJourneyManager';

/**
 * Hook to fetch category suggestions from Bedrock based on user journey data.
 * @param data - VCData from UserJourneyManager containing business info
 */
export function useBedrockCategorySuggestions(
  data: VCData | null
): { suggestions: CategorySuggestion[]; loading: boolean; error: Error | null } {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!data) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Call Bedrock service with VCData
        const response = await getBedrockSuggestions({
          description: data.businessName, // Using businessName as description for now
          address: {
            postalCode: data.postalCode,
            city: data.location,
          },
          website: data.website,
          mainCategories: data.mainCategory ? [data.mainCategory] : [],
          language: 'de', // Default to German for now
        });
        // Expecting response: Array<{ value, label, score }>
        setSuggestions(response);
      } catch (err) {
        console.error('Bedrock category suggestions error', err);
        setError(err as Error);
        // Fallback to empty array on error
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [data]);

  return { suggestions, loading, error };
}