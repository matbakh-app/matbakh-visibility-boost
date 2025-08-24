export interface CategorySuggestion {
  value: string;
  label: string;
  score: number;
}

export interface BedrockCategoryRequest {
  description?: string;
  address?: {
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
  };
  website?: string;
  mainCategories?: string[];
  language?: 'de' | 'en';
}

/**
 * Mock data for testing Bedrock category suggestions
 */
const MOCK_SUGGESTIONS: CategorySuggestion[] = [
  { value: 'italienisches_restaurant', label: 'Italienisches Restaurant', score: 0.95 },
  { value: 'pizzeria', label: 'Pizzeria', score: 0.92 },
  { value: 'trattoria', label: 'Trattoria', score: 0.88 },
  { value: 'restaurant', label: 'Restaurant', score: 0.85 },
  { value: 'lieferservice', label: 'Lieferservice', score: 0.82 },
  { value: 'catering_service', label: 'Catering Service', score: 0.78 },
  { value: 'bar', label: 'Bar', score: 0.75 },
  { value: 'weinbar', label: 'Weinbar', score: 0.72 },
  { value: 'bistro', label: 'Bistro', score: 0.68 },
  { value: 'cafe', label: 'Café', score: 0.65 },
  { value: 'fastfood_restaurant', label: 'Fastfood Restaurant', score: 0.62 },
  { value: 'mediterrane_kueche', label: 'Mediterrane Küche', score: 0.58 },
  { value: 'familienrestaurant', label: 'Familienrestaurant', score: 0.55 },
  { value: 'feinkost', label: 'Feinkost', score: 0.52 },
  { value: 'weinhandlung', label: 'Weinhandlung', score: 0.48 },
  { value: 'eventlocation', label: 'Eventlocation', score: 0.45 },
  { value: 'terrasse', label: 'Terrasse', score: 0.42 },
  { value: 'biergarten', label: 'Biergarten', score: 0.38 },
  { value: 'take_away', label: 'Take Away', score: 0.35 },
  { value: 'brunch', label: 'Brunch', score: 0.32 }
];

/**
 * Call Bedrock for category suggestions based on business data
 * Currently returns mock data - will be replaced with actual Bedrock integration
 */
export async function getBedrockSuggestions(
  request: BedrockCategoryRequest
): Promise<CategorySuggestion[]> {
  console.log('🧠 Bedrock Category Request:', request);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock logic: filter suggestions based on input
  let filteredSuggestions = [...MOCK_SUGGESTIONS];
  
  // Simple mock filtering based on description keywords
  if (request.description) {
    const desc = request.description.toLowerCase();
    if (desc.includes('pizza')) {
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.value.includes('pizza') || s.value.includes('italienisch')
      );
    } else if (desc.includes('bar') || desc.includes('cocktail')) {
      filteredSuggestions = filteredSuggestions.filter(s => 
        s.value.includes('bar') || s.value.includes('bistro')
      );
    }
  }
  
  // Return top 20 suggestions
  const result = filteredSuggestions.slice(0, 20);
  
  console.log('🧠 Bedrock Suggestions:', result.length, 'categories');
  return result;
}

/**
 * Future: Call actual Bedrock Edge Function
 * This will replace the mock function above
 */
export async function getBedrockSuggestionsLive(
  request: BedrockCategoryRequest
): Promise<CategorySuggestion[]> {
  try {
    const response = await fetch('/api/bedrock/category-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessDescription: request.description,
        address: request.address,
        website: request.website,
        mainCategory: request.mainCategories?.[0], // Take first main category
        language: request.language || 'de'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Bedrock API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Bedrock API call failed:', error);
    throw error;
  }
}