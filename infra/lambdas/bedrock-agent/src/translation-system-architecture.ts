/**
 * Translation System Architecture
 * 
 * Multi-language content translation system for restaurant marketing.
 * Supports context-aware translations with cultural adaptation and quality assessment.
 * Designed for German/English primary support with extensibility for additional languages.
 */

import { AIRequest, AIResponse, AIContext } from './ai-agent-orchestrator';
import { BaseAIProvider, ProviderRouter } from './multi-provider-architecture';

// Translation types and structures
export type TranslationType = 
  | 'content_translation'
  | 'menu_translation'
  | 'marketing_translation'
  | 'legal_translation'
  | 'ui_translation'
  | 'seo_translation';

export type LanguageCode = 'de' | 'en' | 'fr' | 'es' | 'it' | 'nl' | 'pl' | 'tr';

export type TranslationQuality = 'machine' | 'enhanced' | 'professional' | 'native';

export type CulturalContext = 
  | 'formal'
  | 'casual'
  | 'business'
  | 'marketing'
  | 'legal'
  | 'technical'
  | 'social_media';

// Translation request structure
export interface TranslationRequest {
  sourceText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  translationType: TranslationType;
  context: TranslationContext;
  options?: TranslationOptions;
}

export interface TranslationContext {
  businessName: string;
  businessType: string;
  industry: 'restaurant' | 'hospitality' | 'food_service';
  region?: string;
  culturalContext: CulturalContext;
  targetAudience?: string;
  brandVoice?: string;
  existingTranslations?: TranslationMemoryEntry[];
}

export interface TranslationOptions {
  preserveFormatting?: boolean;
  preserveNumbers?: boolean;
  preserveNames?: boolean;
  adaptCurrency?: boolean;
  adaptDates?: boolean;
  adaptAddresses?: boolean;
  includeAlternatives?: boolean;
  qualityLevel?: TranslationQuality;
  culturalAdaptation?: boolean;
  seoOptimization?: boolean;
}

export interface TranslationMemoryEntry {
  sourceText: string;
  targetText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  context: string;
  quality: number;
  lastUsed: string;
  usageCount: number;
}

// Translation response structure
export interface TranslationResponse {
  translatedText: string;
  alternatives?: string[];
  confidence: number;
  quality: TranslationQuality;
  metadata: TranslationMetadata;
  suggestions?: TranslationSuggestion[];
  culturalNotes?: CulturalNote[];
}

export interface TranslationMetadata {
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  translationType: TranslationType;
  processingTime: number;
  providersUsed: string[];
  memoryMatches?: MemoryMatch[];
  qualityScore: number;
  culturalAdaptations?: string[];
}

export interface TranslationSuggestion {
  type: 'improvement' | 'alternative' | 'cultural' | 'seo';
  description: string;
  originalText: string;
  suggestedText: string;
  reasoning: string;
  confidence: number;
}

export interface CulturalNote {
  category: 'etiquette' | 'customs' | 'preferences' | 'taboos' | 'business_culture';
  note: string;
  importance: 'low' | 'medium' | 'high';
  region?: string;
}

export interface MemoryMatch {
  sourceText: string;
  targetText: string;
  similarity: number;
  context: string;
  lastUsed: string;
}

// Language-specific rules and cultural adaptations
const LANGUAGE_RULES: Record<LanguageCode, {
  formalityLevels: string[];
  culturalPreferences: string[];
  businessEtiquette: string[];
  commonPhrases: Record<string, string>;
  currencyFormat: string;
  dateFormat: string;
  addressFormat: string;
}> = {
  de: {
    formalityLevels: ['Sie', 'Du'],
    culturalPreferences: ['punctuality', 'directness', 'quality_focus'],
    businessEtiquette: ['formal_greetings', 'titles_important', 'structured_communication'],
    commonPhrases: {
      'welcome': 'Willkommen',
      'thank_you': 'Vielen Dank',
      'please': 'Bitte',
      'reservation': 'Reservierung',
      'menu': 'Speisekarte'
    },
    currencyFormat: '€ #,##0.00',
    dateFormat: 'DD.MM.YYYY',
    addressFormat: 'Street Number, PLZ City'
  },
  en: {
    formalityLevels: ['formal', 'casual'],
    culturalPreferences: ['friendliness', 'efficiency', 'personalization'],
    businessEtiquette: ['casual_professional', 'first_names_common', 'direct_communication'],
    commonPhrases: {
      'welcome': 'Welcome',
      'thank_you': 'Thank you',
      'please': 'Please',
      'reservation': 'Reservation',
      'menu': 'Menu'
    },
    currencyFormat: '$#,##0.00',
    dateFormat: 'MM/DD/YYYY',
    addressFormat: 'Number Street, City, State ZIP'
  },
  fr: {
    formalityLevels: ['vous', 'tu'],
    culturalPreferences: ['elegance', 'culinary_appreciation', 'formality'],
    businessEtiquette: ['formal_greetings', 'respect_for_hierarchy', 'meal_importance'],
    commonPhrases: {
      'welcome': 'Bienvenue',
      'thank_you': 'Merci',
      'please': 'S\'il vous plaît',
      'reservation': 'Réservation',
      'menu': 'Menu'
    },
    currencyFormat: '#,##0.00 €',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'Number Street, ZIP City'
  },
  es: {
    formalityLevels: ['usted', 'tú'],
    culturalPreferences: ['warmth', 'family_focus', 'social_dining'],
    businessEtiquette: ['personal_relationships', 'flexible_time', 'warm_greetings'],
    commonPhrases: {
      'welcome': 'Bienvenido',
      'thank_you': 'Gracias',
      'please': 'Por favor',
      'reservation': 'Reserva',
      'menu': 'Menú'
    },
    currencyFormat: '#,##0.00 €',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'Street Number, ZIP City'
  },
  it: {
    formalityLevels: ['lei', 'tu'],
    culturalPreferences: ['passion', 'quality', 'tradition'],
    businessEtiquette: ['relationship_building', 'meal_significance', 'expressive_communication'],
    commonPhrases: {
      'welcome': 'Benvenuto',
      'thank_you': 'Grazie',
      'please': 'Per favore',
      'reservation': 'Prenotazione',
      'menu': 'Menu'
    },
    currencyFormat: '€ #,##0.00',
    dateFormat: 'DD/MM/YYYY',
    addressFormat: 'Street Number, ZIP City'
  },
  nl: {
    formalityLevels: ['u', 'je'],
    culturalPreferences: ['directness', 'efficiency', 'informality'],
    businessEtiquette: ['casual_professional', 'punctuality', 'straightforward_communication'],
    commonPhrases: {
      'welcome': 'Welkom',
      'thank_you': 'Dank je',
      'please': 'Alsjeblieft',
      'reservation': 'Reservering',
      'menu': 'Menu'
    },
    currencyFormat: '€ #,##0.00',
    dateFormat: 'DD-MM-YYYY',
    addressFormat: 'Street Number, ZIP City'
  },
  pl: {
    formalityLevels: ['Pan/Pani', 'ty'],
    culturalPreferences: ['hospitality', 'tradition', 'formality'],
    businessEtiquette: ['formal_address', 'respect_for_age', 'traditional_values'],
    commonPhrases: {
      'welcome': 'Witamy',
      'thank_you': 'Dziękuję',
      'please': 'Proszę',
      'reservation': 'Rezerwacja',
      'menu': 'Menu'
    },
    currencyFormat: '#,##0.00 zł',
    dateFormat: 'DD.MM.YYYY',
    addressFormat: 'Street Number, ZIP City'
  },
  tr: {
    formalityLevels: ['siz', 'sen'],
    culturalPreferences: ['hospitality', 'respect', 'family_values'],
    businessEtiquette: ['formal_respect', 'hierarchy_awareness', 'personal_connections'],
    commonPhrases: {
      'welcome': 'Hoş geldiniz',
      'thank_you': 'Teşekkür ederim',
      'please': 'Lütfen',
      'reservation': 'Rezervasyon',
      'menu': 'Menü'
    },
    currencyFormat: '#,##0.00 ₺',
    dateFormat: 'DD.MM.YYYY',
    addressFormat: 'Street Number, ZIP City'
  }
};

// Restaurant-specific translation templates
const RESTAURANT_TRANSLATION_TEMPLATES = {
  menu_items: {
    de: {
      appetizers: 'Vorspeisen',
      main_courses: 'Hauptgerichte',
      desserts: 'Nachspeisen',
      beverages: 'Getränke',
      daily_specials: 'Tagesgerichte',
      seasonal: 'Saisonale Spezialitäten'
    },
    en: {
      appetizers: 'Appetizers',
      main_courses: 'Main Courses',
      desserts: 'Desserts',
      beverages: 'Beverages',
      daily_specials: 'Daily Specials',
      seasonal: 'Seasonal Specialties'
    }
  },
  service_terms: {
    de: {
      reservation_required: 'Reservierung erforderlich',
      walk_ins_welcome: 'Auch ohne Reservierung willkommen',
      private_dining: 'Private Veranstaltungen',
      takeaway: 'Zum Mitnehmen',
      delivery: 'Lieferservice'
    },
    en: {
      reservation_required: 'Reservation Required',
      walk_ins_welcome: 'Walk-ins Welcome',
      private_dining: 'Private Dining',
      takeaway: 'Takeaway',
      delivery: 'Delivery'
    }
  }
};

// Translation system architecture
export class TranslationSystemArchitecture {
  private router: ProviderRouter;
  private translationMemory: Map<string, TranslationMemoryEntry[]> = new Map();
  private qualityCache: Map<string, number> = new Map();

  constructor(router: ProviderRouter) {
    this.router = router;
    this.initializeTranslationMemory();
  }

  private initializeTranslationMemory(): void {
    // Load common restaurant translations into memory
    for (const [category, translations] of Object.entries(RESTAURANT_TRANSLATION_TEMPLATES)) {
      for (const [sourceKey, sourceValue] of Object.entries(translations.de)) {
        const targetValue = (translations.en as any)[sourceKey];
        if (targetValue) {
          this.addToMemory({
            sourceText: sourceValue,
            targetText: targetValue,
            sourceLanguage: 'de',
            targetLanguage: 'en',
            context: category,
            quality: 1.0,
            lastUsed: new Date().toISOString(),
            usageCount: 0
          });
        }
      }
    }
  }

  async translateContent(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    
    // Step 1: Check translation memory for exact or fuzzy matches
    const memoryMatches = this.findMemoryMatches(request);
    
    // Step 2: If high-confidence match found, use it
    if (memoryMatches.length > 0 && memoryMatches[0].similarity > 0.95) {
      return this.createMemoryResponse(memoryMatches[0], request, startTime);
    }
    
    // Step 3: Prepare AI translation request
    const aiRequest = this.buildTranslationAIRequest(request, memoryMatches);
    
    // Step 4: Execute translation with selected provider
    const aiResponse = await this.executeTranslation(aiRequest);
    
    // Step 5: Post-process translation
    const processedTranslation = this.postProcessTranslation(aiResponse, request);
    
    // Step 6: Apply cultural adaptations
    const culturallyAdapted = await this.applyCulturalAdaptations(processedTranslation, request);
    
    // Step 7: Generate alternatives if requested
    const alternatives = request.options?.includeAlternatives ? 
      await this.generateAlternatives(request, culturallyAdapted) : [];
    
    // Step 8: Assess quality
    const qualityScore = await this.assessTranslationQuality(culturallyAdapted, request);
    
    // Step 9: Generate suggestions and cultural notes
    const suggestions = this.generateTranslationSuggestions(culturallyAdapted, request);
    const culturalNotes = this.generateCulturalNotes(request);
    
    // Step 10: Add to translation memory
    this.addToMemory({
      sourceText: request.sourceText,
      targetText: culturallyAdapted,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      context: request.translationType,
      quality: qualityScore,
      lastUsed: new Date().toISOString(),
      usageCount: 1
    });
    
    // Step 11: Create response
    const response: TranslationResponse = {
      translatedText: culturallyAdapted,
      alternatives,
      confidence: qualityScore,
      quality: this.determineQualityLevel(qualityScore),
      metadata: {
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        translationType: request.translationType,
        processingTime: Date.now() - startTime,
        providersUsed: ['claude-3.5-sonnet'], // Will expand with more providers
        memoryMatches,
        qualityScore,
        culturalAdaptations: this.getCulturalAdaptations(request)
      },
      suggestions,
      culturalNotes
    };
    
    return response;
  }

  private findMemoryMatches(request: TranslationRequest): MemoryMatch[] {
    const memoryKey = `${request.sourceLanguage}-${request.targetLanguage}`;
    const entries = this.translationMemory.get(memoryKey) || [];
    
    const matches: MemoryMatch[] = [];
    
    for (const entry of entries) {
      const similarity = this.calculateSimilarity(request.sourceText, entry.sourceText);
      
      if (similarity > 0.7) { // Only include high-similarity matches
        matches.push({
          sourceText: entry.sourceText,
          targetText: entry.targetText,
          similarity,
          context: entry.context,
          lastUsed: entry.lastUsed
        });
      }
    }
    
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = text1.length > text2.length ? text1 : text2;
    const shorter = text1.length > text2.length ? text2 : text1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private createMemoryResponse(match: MemoryMatch, request: TranslationRequest, startTime: number): TranslationResponse {
    return {
      translatedText: match.targetText,
      confidence: match.similarity,
      quality: 'enhanced',
      metadata: {
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        translationType: request.translationType,
        processingTime: Date.now() - startTime,
        providersUsed: ['translation_memory'],
        memoryMatches: [match],
        qualityScore: match.similarity
      },
      suggestions: [],
      culturalNotes: this.generateCulturalNotes(request)
    };
  }

  private buildTranslationAIRequest(request: TranslationRequest, memoryMatches: MemoryMatch[]): AIRequest {
    const templateVariables = {
      sourceText: request.sourceText,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      translationType: request.translationType,
      context: request.context,
      options: request.options,
      memoryMatches: memoryMatches.slice(0, 3), // Top 3 matches for context
      languageRules: {
        source: LANGUAGE_RULES[request.sourceLanguage],
        target: LANGUAGE_RULES[request.targetLanguage]
      },
      restaurantTerms: RESTAURANT_TRANSLATION_TEMPLATES
    };

    return {
      id: `translation-${Date.now()}`,
      type: 'translation',
      payload: templateVariables,
      context: {
        language: request.targetLanguage,
        businessContext: {
          businessId: request.context.businessName.toLowerCase().replace(/\s+/g, '-'),
          industry: request.context.industry,
          location: request.context.region
        }
      },
      preferences: {
        enableFallback: true,
        maxLatency: 10000,
        qualityThreshold: 0.8
      }
    };
  }

  private async executeTranslation(aiRequest: AIRequest): Promise<AIResponse> {
    const availableProviders = ['claude-3.5-sonnet']; // Will expand with Gemini
    const provider = await this.router.selectProvider(aiRequest, availableProviders);
    return await provider.execute(aiRequest);
  }

  private postProcessTranslation(aiResponse: AIResponse, request: TranslationRequest): string {
    let translation = aiResponse.content.toString();
    
    // Apply post-processing based on options
    if (request.options?.preserveNumbers) {
      translation = this.preserveNumbers(translation, request.sourceText);
    }
    
    if (request.options?.preserveNames) {
      translation = this.preserveProperNames(translation, request.sourceText);
    }
    
    if (request.options?.adaptCurrency) {
      translation = this.adaptCurrency(translation, request.targetLanguage);
    }
    
    if (request.options?.adaptDates) {
      translation = this.adaptDateFormats(translation, request.targetLanguage);
    }
    
    return translation.trim();
  }

  private async applyCulturalAdaptations(translation: string, request: TranslationRequest): Promise<string> {
    if (!request.options?.culturalAdaptation) {
      return translation;
    }
    
    const targetRules = LANGUAGE_RULES[request.targetLanguage];
    let adapted = translation;
    
    // Apply formality level adjustments
    if (request.context.culturalContext === 'formal' && targetRules.formalityLevels.includes('Sie')) {
      // Ensure formal address in German
      adapted = adapted.replace(/\bdu\b/gi, 'Sie');
    }
    
    // Apply business etiquette adaptations
    if (request.context.culturalContext === 'business') {
      for (const etiquette of targetRules.businessEtiquette) {
        adapted = this.applyBusinessEtiquette(adapted, etiquette, request.targetLanguage);
      }
    }
    
    return adapted;
  }

  private async generateAlternatives(request: TranslationRequest, primaryTranslation: string): Promise<string[]> {
    const alternatives: string[] = [];
    
    try {
      // Generate alternative with different tone
      const altRequest = { ...request };
      altRequest.context = { 
        ...request.context, 
        culturalContext: request.context.culturalContext === 'formal' ? 'casual' : 'formal'
      };
      
      const altAIRequest = this.buildTranslationAIRequest(altRequest, []);
      const altResponse = await this.executeTranslation(altAIRequest);
      const altTranslation = this.postProcessTranslation(altResponse, altRequest);
      
      if (altTranslation !== primaryTranslation) {
        alternatives.push(altTranslation);
      }
    } catch (error) {
      console.warn('Failed to generate translation alternative:', error);
    }
    
    return alternatives;
  }

  private async assessTranslationQuality(translation: string, request: TranslationRequest): Promise<number> {
    let score = 0.5; // Base score
    
    // Length appropriateness (translation shouldn't be too different in length)
    const lengthRatio = translation.length / request.sourceText.length;
    if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
      score += 0.2;
    }
    
    // Language-specific quality checks
    const targetRules = LANGUAGE_RULES[request.targetLanguage];
    
    // Check for common phrases usage
    let commonPhrasesUsed = 0;
    for (const phrase of Object.values(targetRules.commonPhrases)) {
      if (translation.toLowerCase().includes(phrase.toLowerCase())) {
        commonPhrasesUsed++;
      }
    }
    
    if (commonPhrasesUsed > 0) {
      score += Math.min(0.2, commonPhrasesUsed * 0.05);
    }
    
    // Check for proper formality level
    if (request.context.culturalContext === 'formal') {
      const formalIndicators = targetRules.formalityLevels.filter(level => 
        translation.includes(level)
      );
      if (formalIndicators.length > 0) {
        score += 0.1;
      }
    }
    
    return Math.min(1.0, score);
  }

  private generateTranslationSuggestions(translation: string, request: TranslationRequest): TranslationSuggestion[] {
    const suggestions: TranslationSuggestion[] = [];
    const targetRules = LANGUAGE_RULES[request.targetLanguage];
    
    // Cultural context suggestions
    if (request.context.culturalContext === 'business' && request.targetLanguage === 'de') {
      if (!translation.includes('Sie') && translation.includes('du')) {
        suggestions.push({
          type: 'cultural',
          description: 'Consider using formal address (Sie) for business context',
          originalText: translation,
          suggestedText: translation.replace(/\bdu\b/gi, 'Sie'),
          reasoning: 'German business communication typically uses formal address',
          confidence: 0.8
        });
      }
    }
    
    // SEO optimization suggestions
    if (request.options?.seoOptimization && request.translationType === 'seo_translation') {
      suggestions.push({
        type: 'seo',
        description: 'Consider including location-specific keywords',
        originalText: translation,
        suggestedText: translation,
        reasoning: 'Local SEO benefits from location-specific terms',
        confidence: 0.7
      });
    }
    
    return suggestions;
  }

  private generateCulturalNotes(request: TranslationRequest): CulturalNote[] {
    const notes: CulturalNote[] = [];
    const targetRules = LANGUAGE_RULES[request.targetLanguage];
    
    // Add relevant cultural notes based on target language and context
    if (request.targetLanguage === 'de' && request.context.culturalContext === 'business') {
      notes.push({
        category: 'business_culture',
        note: 'German business culture values punctuality and formal communication',
        importance: 'high',
        region: 'Germany, Austria, Switzerland'
      });
    }
    
    if (request.targetLanguage === 'fr' && request.translationType === 'menu_translation') {
      notes.push({
        category: 'customs',
        note: 'French diners appreciate detailed food descriptions and wine pairings',
        importance: 'medium',
        region: 'France'
      });
    }
    
    return notes;
  }

  private addToMemory(entry: TranslationMemoryEntry): void {
    const memoryKey = `${entry.sourceLanguage}-${entry.targetLanguage}`;
    
    if (!this.translationMemory.has(memoryKey)) {
      this.translationMemory.set(memoryKey, []);
    }
    
    const entries = this.translationMemory.get(memoryKey)!;
    
    // Check if similar entry already exists
    const existingIndex = entries.findIndex(e => 
      this.calculateSimilarity(e.sourceText, entry.sourceText) > 0.95
    );
    
    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex].usageCount++;
      entries[existingIndex].lastUsed = entry.lastUsed;
      entries[existingIndex].quality = Math.max(entries[existingIndex].quality, entry.quality);
    } else {
      // Add new entry
      entries.push(entry);
      
      // Limit memory size (keep top 1000 entries per language pair)
      if (entries.length > 1000) {
        entries.sort((a, b) => b.usageCount - a.usageCount);
        entries.splice(1000);
      }
    }
  }

  private determineQualityLevel(score: number): TranslationQuality {
    if (score >= 0.9) return 'native';
    if (score >= 0.8) return 'professional';
    if (score >= 0.6) return 'enhanced';
    return 'machine';
  }

  private getCulturalAdaptations(request: TranslationRequest): string[] {
    const adaptations: string[] = [];
    
    if (request.options?.culturalAdaptation) {
      adaptations.push('formality_level_adjusted');
      adaptations.push('business_etiquette_applied');
    }
    
    if (request.options?.adaptCurrency) {
      adaptations.push('currency_localized');
    }
    
    if (request.options?.adaptDates) {
      adaptations.push('date_format_localized');
    }
    
    return adaptations;
  }

  // Helper methods for post-processing
  private preserveNumbers(translation: string, sourceText: string): string {
    const numberRegex = /\d+(?:[.,]\d+)?/g;
    const sourceNumbers = sourceText.match(numberRegex) || [];
    
    let result = translation;
    sourceNumbers.forEach(num => {
      if (!result.includes(num)) {
        // Try to find where the number should be inserted
        result = result.replace(/\d+(?:[.,]\d+)?/, num);
      }
    });
    
    return result;
  }

  private preserveProperNames(translation: string, sourceText: string): string {
    // Simple proper name detection (capitalized words)
    const nameRegex = /\b[A-Z][a-z]+\b/g;
    const sourceNames = sourceText.match(nameRegex) || [];
    
    let result = translation;
    sourceNames.forEach(name => {
      if (!result.includes(name)) {
        // This is a simplified approach - in practice, would need more sophisticated name detection
        result = result.replace(/\b[A-Z][a-z]+\b/, name);
      }
    });
    
    return result;
  }

  private adaptCurrency(translation: string, targetLanguage: LanguageCode): string {
    const targetRules = LANGUAGE_RULES[targetLanguage];
    const currencyRegex = /\$?\d+(?:[.,]\d{2})?/g;
    
    return translation.replace(currencyRegex, (match) => {
      const number = match.replace(/[$€£¥]/g, '');
      return targetRules.currencyFormat.replace('#,##0.00', number);
    });
  }

  private adaptDateFormats(translation: string, targetLanguage: LanguageCode): string {
    const targetRules = LANGUAGE_RULES[targetLanguage];
    const dateRegex = /\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/g;
    
    return translation.replace(dateRegex, (match) => {
      // This is simplified - would need proper date parsing and formatting
      return match; // Placeholder for actual date format conversion
    });
  }

  private applyBusinessEtiquette(text: string, etiquette: string, language: LanguageCode): string {
    // Apply specific business etiquette rules based on language and context
    switch (etiquette) {
      case 'formal_greetings':
        if (language === 'de') {
          text = text.replace(/hallo/gi, 'Guten Tag');
        }
        break;
      case 'titles_important':
        // Would implement title preservation/addition logic
        break;
    }
    
    return text;
  }

  // Public methods for system management
  getTranslationMemoryStats(): {
    totalEntries: number;
    languagePairs: string[];
    averageQuality: number;
  } {
    let totalEntries = 0;
    let totalQuality = 0;
    
    for (const entries of this.translationMemory.values()) {
      totalEntries += entries.length;
      totalQuality += entries.reduce((sum, entry) => sum + entry.quality, 0);
    }
    
    return {
      totalEntries,
      languagePairs: Array.from(this.translationMemory.keys()),
      averageQuality: totalEntries > 0 ? totalQuality / totalEntries : 0
    };
  }

  clearTranslationMemory(): void {
    this.translationMemory.clear();
    this.qualityCache.clear();
  }

  exportTranslationMemory(): TranslationMemoryEntry[] {
    const allEntries: TranslationMemoryEntry[] = [];
    
    for (const entries of this.translationMemory.values()) {
      allEntries.push(...entries);
    }
    
    return allEntries;
  }

  importTranslationMemory(entries: TranslationMemoryEntry[]): void {
    for (const entry of entries) {
      this.addToMemory(entry);
    }
  }
}

// Export main components
export { TranslationSystemArchitecture };