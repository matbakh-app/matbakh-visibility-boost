import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CategorySuggestion = { 
  id: string; 
  name: string; 
  score: number; 
  source: string;
};

export type BedrockVCResponse = {
  suggestions: CategorySuggestion[];
  tags: string[];
  reasoning: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    usd: number;
  };
  fallbackUsed: boolean;
  requestId: string;
};

export type BedrockVCRequest = {
  businessDescription?: string;
  address?: {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  website?: string;
  mainCategories?: string[];
  language?: "de" | "en";
  userId?: string | null;
};

/**
 * Hook to fetch category suggestions from Bedrock via Edge Function
 */
export function useBedrockCategorySuggestions() {
  return useMutation({
    mutationFn: async (input: BedrockVCRequest): Promise<BedrockVCResponse> => {
      console.log('🧠 Calling Bedrock VC with input:', input);
      
      const { data, error } = await supabase.functions.invoke('enhanced-visibility-check', {
        body: input
      });

      if (error) {
        console.error('❌ Bedrock VC error:', error);
        throw new Error(error.message || 'Bedrock API call failed');
      }

      console.log('✅ Bedrock VC response:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('✅ Bedrock suggestions received:', {
        suggestionsCount: data.suggestions.length,
        fallbackUsed: data.fallbackUsed,
        hasReasoning: !!data.reasoning
      });
    },
    onError: (error) => {
      console.error('❌ Bedrock suggestions failed:', error);
    }
  });
}