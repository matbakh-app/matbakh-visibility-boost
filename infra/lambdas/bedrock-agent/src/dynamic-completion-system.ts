/**
 * Dynamic Completion System for Bedrock AI Core
 * 
 * Implements Claude-powered intelligent questioning system for missing data,
 * context-aware follow-up questions, progressive disclosure, and completion tracking.
 * 
 * Requirements: 2.5, 5.5, 8.1
 */

import { RestaurantData, UserContext, DataCollectionPriority, DataCollectionFramework } from './data-collection-framework';

export interface CompletionQuestion {
  id: string;
  field_name: string;
  question_text: string;
  question_type: 'text' | 'select' | 'multiselect' | 'url' | 'boolean' | 'number';
  options?: string[];
  placeholder?: string;
  validation_rules?: {
    required?: boolean;
    min_length?: number;
    max_length?: number;
    pattern?: string;
  };
  context_explanation?: string;
  impact_description?: string;
  persona_specific_guidance?: {
    [persona: string]: string;
  };
  priority_score: number;
  estimated_time_minutes: number;
}

export interface CompletionSession {
  session_id: string;
  user_context: UserContext;
  current_data: RestaurantData;
  questions_asked: string[];
  questions_answered: string[];
  questions_skipped: string[];
  completion_progress: number; // 0-100
  session_start_time: string;
  last_activity_time: string;
  total_questions_available: number;
  critical_questions_remaining: number;
}

export interface QuestionGenerationContext {
  existing_data: RestaurantData;
  user_context: UserContext;
  analysis_goals: string[];
  time_constraints?: number; // minutes available
  previous_responses?: { [field: string]: any };
}

export class DynamicCompletionSystem {
  private static readonly QUESTION_TEMPLATES = {
    business_name: {
      'Solo-Sarah': "Wie heißt Ihr Restaurant? Dies ist wichtig für alle weiteren Analysen.",
      'Bewahrer-Ben': "Bitte geben Sie den offiziellen Namen Ihres Restaurants ein, wie er auch bei Google My Business steht.",
      'Wachstums-Walter': "Welcher Markenname soll in der Analyse verwendet werden? (Falls Sie mehrere Standorte haben, bitte den Hauptnamen)",
      'Ketten-Katrin': "Wie lautet der Markenname für diese Analyse? Bei Ketten bitte den übergeordneten Brand-Namen angeben."
    },
    main_category: {
      'Solo-Sarah': "Was für ein Restaurant führen Sie? (z.B. Italienisch, Café, Bistro)",
      'Bewahrer-Ben': "Zu welcher Kategorie gehört Ihr Restaurant? Wählen Sie die Hauptkategorie, die am besten passt.",
      'Wachstums-Walter': "Welche Hauptkategorie beschreibt Ihr Geschäftsmodell am besten? Dies beeinflusst die Benchmark-Analyse.",
      'Ketten-Katrin': "Welche Hauptkategorie soll für die strategische Positionierung verwendet werden?"
    },
    target_audience: {
      'Solo-Sarah': "Wer sind Ihre Hauptgäste? (z.B. Familien, Geschäftsleute, Touristen)",
      'Bewahrer-Ben': "Beschreiben Sie Ihre typischen Gäste. Das hilft bei der Analyse Ihrer Sichtbarkeit.",
      'Wachstums-Walter': "Definieren Sie Ihre Zielgruppen für die strategische Analyse. Mehrere Gruppen möglich.",
      'Ketten-Katrin': "Welche Zielgruppensegmente sollen in der Marktanalyse berücksichtigt werden?"
    }
  };

  /**
   * Generate intelligent follow-up questions based on existing data and context
   */
  static async generateContextAwareQuestions(
    context: QuestionGenerationContext,
    maxQuestions: number = 5
  ): Promise<CompletionQuestion[]> {
    const missingFields = DataCollectionFramework.getPrioritizedMissingFields(
      context.existing_data,
      context.user_context
    );

    const questions: CompletionQuestion[] = [];
    let questionCount = 0;

    for (const field of missingFields) {
      if (questionCount >= maxQuestions) break;

      const question = this.generateQuestionForField(field, context);
      if (question) {
        questions.push(question);
        questionCount++;
      }
    }

    // Add context-aware follow-up questions based on existing data
    const followUpQuestions = this.generateFollowUpQuestions(context);
    questions.push(...followUpQuestions.slice(0, maxQuestions - questionCount));

    return questions.sort((a, b) => b.priority_score - a.priority_score);
  }

  /**
   * Create a completion session for progressive data gathering
   */
  static createCompletionSession(
    userContext: UserContext,
    initialData: RestaurantData
  ): CompletionSession {
    const sessionId = `completion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const totalQuestions = this.calculateTotalQuestionsNeeded(initialData, userContext);
    const criticalRemaining = this.countCriticalMissingFields(initialData);

    return {
      session_id: sessionId,
      user_context: userContext,
      current_data: initialData,
      questions_asked: [],
      questions_answered: [],
      questions_skipped: [],
      completion_progress: this.calculateCompletionProgress(initialData),
      session_start_time: new Date().toISOString(),
      last_activity_time: new Date().toISOString(),
      total_questions_available: totalQuestions,
      critical_questions_remaining: criticalRemaining
    };
  }

  /**
   * Update completion session with new answer
   */
  static updateCompletionSession(
    session: CompletionSession,
    questionId: string,
    answer: any,
    fieldName: string
  ): CompletionSession {
    const updatedData = { ...session.current_data };
    this.setNestedValue(updatedData, fieldName, answer);

    const updatedSession: CompletionSession = {
      ...session,
      current_data: updatedData,
      questions_answered: [...session.questions_answered, questionId],
      completion_progress: this.calculateCompletionProgress(updatedData),
      last_activity_time: new Date().toISOString(),
      critical_questions_remaining: this.countCriticalMissingFields(updatedData)
    };

    return updatedSession;
  }

  /**
   * Get next best question based on current session state
   */
  static async getNextQuestion(session: CompletionSession): Promise<CompletionQuestion | null> {
    const context: QuestionGenerationContext = {
      existing_data: session.current_data,
      user_context: session.user_context,
      analysis_goals: ['visibility_check'], // Default goal
      time_constraints: this.estimateRemainingTime(session)
    };

    const availableQuestions = await this.generateContextAwareQuestions(context, 1);
    const unaskedQuestions = availableQuestions.filter(q => 
      !session.questions_asked.includes(q.id) && 
      !session.questions_answered.includes(q.id)
    );

    return unaskedQuestions.length > 0 ? unaskedQuestions[0] : null;
  }

  /**
   * Generate progress indicators for UI
   */
  static generateProgressIndicators(session: CompletionSession): {
    overall_progress: number;
    category_progress: { [category: string]: number };
    next_milestone: string;
    estimated_completion_time: number;
    completion_benefits: string[];
  } {
    const qualityScore = DataCollectionFramework.calculateDataQuality(session.current_data);
    
    return {
      overall_progress: session.completion_progress,
      category_progress: {
        'Grunddaten': qualityScore.category_scores.basic_info,
        'Kontaktdaten': qualityScore.category_scores.contact_details,
        'Online-Präsenz': qualityScore.category_scores.online_presence,
        'Geschäftsdetails': qualityScore.category_scores.business_details,
        'Marketing': qualityScore.category_scores.marketing_data
      },
      next_milestone: this.getNextMilestone(session.completion_progress),
      estimated_completion_time: this.estimateCompletionTime(session),
      completion_benefits: this.getCompletionBenefits(session.completion_progress)
    };
  }

  /**
   * Implement progressive disclosure based on user comfort level
   */
  static shouldShowAdvancedQuestions(
    userContext: UserContext,
    currentProgress: number
  ): boolean {
    // Progressive disclosure rules
    if (userContext.experience_level === 'beginner' && currentProgress < 60) {
      return false;
    }
    
    if (userContext.persona_type === 'Solo-Sarah' && currentProgress < 40) {
      return false;
    }
    
    if (userContext.time_availability === 'limited' && currentProgress < 80) {
      return false;
    }

    return true;
  }

  // Private helper methods
  private static generateQuestionForField(
    field: DataCollectionPriority,
    context: QuestionGenerationContext
  ): CompletionQuestion | null {
    const persona = context.user_context.persona_type || 'Solo-Sarah';
    const templates = this.QUESTION_TEMPLATES[field.field_name as keyof typeof this.QUESTION_TEMPLATES];
    
    if (!templates) return null;

    const questionText = templates[persona] || templates['Solo-Sarah'];
    
    return {
      id: `q_${field.field_name}_${Date.now()}`,
      field_name: field.field_name,
      question_text: questionText,
      question_type: this.getQuestionType(field.field_name),
      options: this.getQuestionOptions(field.field_name),
      placeholder: this.getPlaceholder(field.field_name, persona),
      validation_rules: this.getValidationRules(field.field_name),
      context_explanation: this.getContextExplanation(field.field_name),
      impact_description: this.getImpactDescription(field.field_name),
      persona_specific_guidance: this.getPersonaGuidance(field.field_name),
      priority_score: field.impact_on_analysis,
      estimated_time_minutes: this.estimateQuestionTime(field.field_name)
    };
  }

  private static generateFollowUpQuestions(context: QuestionGenerationContext): CompletionQuestion[] {
    const followUps: CompletionQuestion[] = [];
    
    // If they have a website, ask about social media
    if (context.existing_data.website_url && !context.existing_data.instagram_url) {
      followUps.push({
        id: `followup_instagram_${Date.now()}`,
        field_name: 'instagram_url',
        question_text: 'Da Sie eine Website haben, nutzen Sie auch Instagram für Ihr Restaurant?',
        question_type: 'url',
        placeholder: 'https://instagram.com/ihr-restaurant',
        priority_score: 70,
        estimated_time_minutes: 1
      });
    }

    // If they specified cuisine, ask about specialties
    if (context.existing_data.cuisine_types?.length && !context.existing_data.specialties?.length) {
      followUps.push({
        id: `followup_specialties_${Date.now()}`,
        field_name: 'specialties',
        question_text: 'Was sind Ihre besonderen Spezialitäten oder Signature-Gerichte?',
        question_type: 'multiselect',
        priority_score: 60,
        estimated_time_minutes: 2
      });
    }

    return followUps;
  }

  private static getQuestionType(fieldName: string): CompletionQuestion['question_type'] {
    const typeMap: { [key: string]: CompletionQuestion['question_type'] } = {
      'business_name': 'text',
      'main_category': 'select',
      'website_url': 'url',
      'google_my_business_url': 'url',
      'target_audience': 'multiselect',
      'cuisine_types': 'multiselect',
      'price_range': 'select'
    };
    
    return typeMap[fieldName] || 'text';
  }

  private static getQuestionOptions(fieldName: string): string[] | undefined {
    const optionsMap: { [key: string]: string[] } = {
      'main_category': [
        'Restaurant', 'Café', 'Bistro', 'Bar', 'Pizzeria', 
        'Imbiss', 'Bäckerei', 'Konditorei', 'Hotel-Restaurant'
      ],
      'price_range': ['budget', 'mid-range', 'upscale', 'fine-dining'],
      'cuisine_types': [
        'Deutsch', 'Italienisch', 'Französisch', 'Griechisch', 'Türkisch',
        'Asiatisch', 'Indisch', 'Mexikanisch', 'Vegetarisch', 'Vegan'
      ]
    };
    
    return optionsMap[fieldName];
  }

  private static getPlaceholder(fieldName: string, persona: string): string {
    const placeholders: { [key: string]: string } = {
      'business_name': 'z.B. Zur Alten Post',
      'website_url': 'https://ihr-restaurant.de',
      'phone': '+49 123 456789'
    };
    
    return placeholders[fieldName] || '';
  }

  private static getValidationRules(fieldName: string): CompletionQuestion['validation_rules'] {
    const rules: { [key: string]: CompletionQuestion['validation_rules'] } = {
      'business_name': { required: true, min_length: 2, max_length: 100 },
      'website_url': { pattern: '^https?://.+' },
      'phone': { pattern: '^[+]?[0-9\\s\\-\\(\\)]+$' }
    };
    
    return rules[fieldName];
  }

  private static getContextExplanation(fieldName: string): string {
    const explanations: { [key: string]: string } = {
      'business_name': 'Der Name wird für alle Analysen und Vergleiche verwendet.',
      'main_category': 'Die Kategorie bestimmt, mit welchen anderen Restaurants Sie verglichen werden.',
      'target_audience': 'Ihre Zielgruppe hilft bei der Bewertung Ihrer Marketing-Strategie.'
    };
    
    return explanations[fieldName] || '';
  }

  private static getImpactDescription(fieldName: string): string {
    const impacts: { [key: string]: string } = {
      'business_name': 'Ermöglicht personalisierte Analyse und Empfehlungen',
      'google_my_business_url': 'Verbessert Sichtbarkeitsanalyse um 40%',
      'target_audience': 'Präzisere Marketing-Empfehlungen'
    };
    
    return impacts[fieldName] || '';
  }

  private static getPersonaGuidance(fieldName: string): { [persona: string]: string } {
    return {
      'Solo-Sarah': 'Einfach ausfüllen - wir helfen Ihnen dabei!',
      'Bewahrer-Ben': 'Diese Information ist wichtig für eine gründliche Analyse.',
      'Wachstums-Walter': 'Strategisch wichtig für Ihre Wachstumsziele.',
      'Ketten-Katrin': 'Relevant für die Markenpositionierung.'
    };
  }

  private static estimateQuestionTime(fieldName: string): number {
    const timeMap: { [key: string]: number } = {
      'business_name': 1,
      'main_category': 1,
      'target_audience': 3,
      'specialties': 2,
      'local_competitors': 5
    };
    
    return timeMap[fieldName] || 2;
  }

  private static calculateCompletionProgress(data: RestaurantData): number {
    const qualityScore = DataCollectionFramework.calculateDataQuality(data);
    return qualityScore.overall_score;
  }

  private static calculateTotalQuestionsNeeded(data: RestaurantData, context: UserContext): number {
    const missingFields = DataCollectionFramework.getPrioritizedMissingFields(data, context);
    return missingFields.length;
  }

  private static countCriticalMissingFields(data: RestaurantData): number {
    const critical = ['business_name', 'main_category', 'address.city'];
    return critical.filter(field => !this.getNestedValue(data, field)).length;
  }

  private static estimateRemainingTime(session: CompletionSession): number {
    const startTime = new Date(session.session_start_time);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    
    // Assume 15 minutes total session time
    return Math.max(0, 15 - elapsedMinutes);
  }

  private static getNextMilestone(progress: number): string {
    if (progress < 25) return 'Grunddaten vervollständigen';
    if (progress < 50) return 'Online-Präsenz erfassen';
    if (progress < 75) return 'Geschäftsdetails hinzufügen';
    if (progress < 90) return 'Marketing-Informationen ergänzen';
    return 'Analyse starten';
  }

  private static estimateCompletionTime(session: CompletionSession): number {
    const remainingQuestions = session.total_questions_available - session.questions_answered.length;
    return remainingQuestions * 2; // 2 minutes per question average
  }

  private static getCompletionBenefits(progress: number): string[] {
    const benefits = [
      'Präzisere Sichtbarkeitsanalyse',
      'Personalisierte Empfehlungen',
      'Bessere Wettbewerbsvergleiche',
      'Zielgerichtete Marketing-Tipps',
      'ROI-Schätzungen für Maßnahmen'
    ];
    
    const benefitCount = Math.floor((progress / 100) * benefits.length);
    return benefits.slice(0, Math.max(1, benefitCount));
  }

  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}