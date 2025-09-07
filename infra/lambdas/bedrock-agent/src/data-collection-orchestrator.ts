/**
 * Data Collection Orchestrator for Bedrock AI Core
 * 
 * Main orchestrator that coordinates data collection framework,
 * dynamic completion system, and Claude questioning engine.
 * 
 * Requirements: 2.4, 2.5, 5.5, 8.1, 9.3
 */

import { RestaurantData, UserContext, DataCollectionFramework, DataQualityScore } from './data-collection-framework';
import { 
  DynamicCompletionSystem, 
  CompletionSession, 
  CompletionQuestion,
  QuestionGenerationContext 
} from './dynamic-completion-system';
import { ClaudeQuestioningEngine, ClaudeQuestionRequest } from './claude-questioning-engine';

export interface DataCollectionRequest {
  user_context: UserContext;
  initial_data?: RestaurantData;
  analysis_goals: string[];
  session_id?: string;
  max_questions_per_batch?: number;
  time_constraint_minutes?: number;
  use_claude_intelligence?: boolean;
}

export interface DataCollectionResponse {
  session: CompletionSession;
  next_questions: CompletionQuestion[];
  progress_indicators: {
    overall_progress: number;
    category_progress: { [category: string]: number };
    next_milestone: string;
    estimated_completion_time: number;
    completion_benefits: string[];
  };
  data_quality_score: DataQualityScore;
  recommendations: {
    priority_actions: string[];
    quick_wins: string[];
    advanced_features: string[];
  };
}

export interface AnswerSubmissionRequest {
  session_id: string;
  question_id: string;
  field_name: string;
  answer: any;
  skip_reason?: string;
}

export interface AnswerSubmissionResponse {
  updated_session: CompletionSession;
  validation_result: {
    is_valid: boolean;
    errors: string[];
    warnings: string[];
  };
  follow_up_questions: CompletionQuestion[];
  completion_status: {
    is_complete: boolean;
    can_start_analysis: boolean;
    missing_critical_fields: string[];
  };
}

export class DataCollectionOrchestrator {
  private claudeEngine: ClaudeQuestioningEngine;
  private activeSessions: Map<string, CompletionSession> = new Map();

  constructor() {
    this.claudeEngine = new ClaudeQuestioningEngine();
  }

  /**
   * Start a new data collection session
   */
  async startDataCollection(request: DataCollectionRequest): Promise<DataCollectionResponse> {
    // Initialize or retrieve session
    let session: CompletionSession;
    
    if (request.session_id && this.activeSessions.has(request.session_id)) {
      session = this.activeSessions.get(request.session_id)!;
    } else {
      const initialData = request.initial_data || {};
      session = DynamicCompletionSystem.createCompletionSession(
        request.user_context,
        initialData
      );
      this.activeSessions.set(session.session_id, session);
    }

    // Generate next questions
    const nextQuestions = await this.generateNextQuestions(session, request);
    
    // Calculate progress indicators
    const progressIndicators = DynamicCompletionSystem.generateProgressIndicators(session);
    
    // Calculate data quality score
    const dataQualityScore = DataCollectionFramework.calculateDataQuality(session.current_data);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(session, dataQualityScore);

    return {
      session,
      next_questions: nextQuestions,
      progress_indicators: progressIndicators,
      data_quality_score: dataQualityScore,
      recommendations
    };
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(request: AnswerSubmissionRequest): Promise<AnswerSubmissionResponse> {
    const session = this.activeSessions.get(request.session_id);
    if (!session) {
      throw new Error('Session not found');
    }

    // Validate the answer
    const validationResult = this.validateAnswer(request.field_name, request.answer);
    
    if (validationResult.is_valid) {
      // Update session with the answer
      const updatedSession = DynamicCompletionSystem.updateCompletionSession(
        session,
        request.question_id,
        request.answer,
        request.field_name
      );
      
      this.activeSessions.set(request.session_id, updatedSession);
      
      // Generate follow-up questions based on the new answer
      const followUpQuestions = await this.generateFollowUpQuestions(
        updatedSession,
        request.field_name,
        request.answer
      );
      
      // Check completion status
      const completionStatus = this.checkCompletionStatus(updatedSession);
      
      return {
        updated_session: updatedSession,
        validation_result: validationResult,
        follow_up_questions: followUpQuestions,
        completion_status: completionStatus
      };
    } else {
      return {
        updated_session: session,
        validation_result: validationResult,
        follow_up_questions: [],
        completion_status: this.checkCompletionStatus(session)
      };
    }
  }

  /**
   * Skip a question with optional reason
   */
  async skipQuestion(sessionId: string, questionId: string, reason?: string): Promise<CompletionSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const updatedSession: CompletionSession = {
      ...session,
      questions_skipped: [...session.questions_skipped, questionId],
      last_activity_time: new Date().toISOString()
    };

    this.activeSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  /**
   * Get current session status
   */
  getSessionStatus(sessionId: string): CompletionSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Generate intelligent questions for missing data
   */
  async generateIntelligentQuestions(
    sessionId: string,
    maxQuestions: number = 3
  ): Promise<CompletionQuestion[]> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const missingFields = DataCollectionFramework.getPrioritizedMissingFields(
      session.current_data,
      session.user_context
    );

    const claudeRequest: ClaudeQuestionRequest = {
      existing_data: session.current_data,
      user_context: session.user_context,
      missing_fields: missingFields.slice(0, maxQuestions).map(f => f.field_name),
      analysis_goal: 'visibility_check',
      max_questions: maxQuestions,
      time_constraint_minutes: this.estimateRemainingTime(session)
    };

    try {
      const claudeResponse = await this.claudeEngine.generateIntelligentQuestions(claudeRequest);
      return claudeResponse.questions;
    } catch (error) {
      console.error('Error generating intelligent questions:', error);
      // Fallback to rule-based questions
      return this.generateFallbackQuestions(session, maxQuestions);
    }
  }

  /**
   * Export collected data for analysis
   */
  exportCollectedData(sessionId: string): {
    restaurant_data: RestaurantData;
    data_quality_score: DataQualityScore;
    collection_metadata: {
      session_duration_minutes: number;
      questions_answered: number;
      questions_skipped: number;
      completion_percentage: number;
    };
  } {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const dataQualityScore = DataCollectionFramework.calculateDataQuality(session.current_data);
    const sessionDuration = this.calculateSessionDuration(session);

    return {
      restaurant_data: session.current_data,
      data_quality_score: dataQualityScore,
      collection_metadata: {
        session_duration_minutes: sessionDuration,
        questions_answered: session.questions_answered.length,
        questions_skipped: session.questions_skipped.length,
        completion_percentage: session.completion_progress
      }
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    this.activeSessions.forEach((session, sessionId) => {
      const lastActivity = new Date(session.last_activity_time);
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
      
      // Expire sessions after 24 hours of inactivity
      if (hoursSinceActivity > 24) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  // Private helper methods
  private async generateNextQuestions(
    session: CompletionSession,
    request: DataCollectionRequest
  ): Promise<CompletionQuestion[]> {
    const maxQuestions = request.max_questions_per_batch || 3;
    
    if (request.use_claude_intelligence !== false) {
      try {
        return await this.generateIntelligentQuestions(session.session_id, maxQuestions);
      } catch (error) {
        console.error('Falling back to rule-based questions:', error);
      }
    }
    
    return this.generateFallbackQuestions(session, maxQuestions);
  }

  private generateFallbackQuestions(session: CompletionSession, maxQuestions: number): CompletionQuestion[] {
    const context: QuestionGenerationContext = {
      existing_data: session.current_data,
      user_context: session.user_context,
      analysis_goals: ['visibility_check']
    };

    return DynamicCompletionSystem.generateContextAwareQuestions(context, maxQuestions);
  }

  private async generateFollowUpQuestions(
    session: CompletionSession,
    fieldName: string,
    answer: any
  ): Promise<CompletionQuestion[]> {
    try {
      const previousAnswers = { [fieldName]: answer };
      return await this.claudeEngine.generateFollowUpQuestions(
        previousAnswers,
        session.user_context,
        'visibility_check'
      );
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  private validateAnswer(fieldName: string, answer: any): {
    is_valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation rules
    if (answer === null || answer === undefined || answer === '') {
      errors.push('Answer cannot be empty');
      return { is_valid: false, errors, warnings };
    }

    // Field-specific validation
    switch (fieldName) {
      case 'business_name':
        if (typeof answer !== 'string' || answer.length < 2) {
          errors.push('Business name must be at least 2 characters long');
        }
        if (answer.length > 100) {
          errors.push('Business name cannot exceed 100 characters');
        }
        break;

      case 'website_url':
      case 'google_my_business_url':
      case 'facebook_url':
      case 'instagram_url':
        try {
          new URL(answer);
        } catch {
          errors.push('Please provide a valid URL');
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(answer)) {
          errors.push('Please provide a valid email address');
        }
        break;

      case 'phone':
        const phoneRegex = /^[+]?[0-9\s\-\(\)]+$/;
        if (!phoneRegex.test(answer)) {
          errors.push('Please provide a valid phone number');
        }
        break;
    }

    // Check for potential PII
    if (typeof answer === 'string' && this.containsPotentialPII(answer)) {
      warnings.push('This field may contain personal information');
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private checkCompletionStatus(session: CompletionSession): {
    is_complete: boolean;
    can_start_analysis: boolean;
    missing_critical_fields: string[];
  } {
    const dataQuality = DataCollectionFramework.calculateDataQuality(session.current_data);
    const criticalFields = ['business_name', 'main_category', 'address.city'];
    const missingCritical = criticalFields.filter(field => 
      !this.getNestedValue(session.current_data, field)
    );

    return {
      is_complete: session.completion_progress >= 80,
      can_start_analysis: missingCritical.length === 0 && session.completion_progress >= 40,
      missing_critical_fields: missingCritical
    };
  }

  private generateRecommendations(
    session: CompletionSession,
    dataQuality: DataQualityScore
  ): {
    priority_actions: string[];
    quick_wins: string[];
    advanced_features: string[];
  } {
    const recommendations = {
      priority_actions: [] as string[],
      quick_wins: [] as string[],
      advanced_features: [] as string[]
    };

    // Priority actions based on missing critical data
    if (dataQuality.missing_critical_fields.length > 0) {
      recommendations.priority_actions.push(
        `Vervollständigen Sie die Grunddaten: ${dataQuality.missing_critical_fields.join(', ')}`
      );
    }

    // Quick wins based on persona
    const persona = session.user_context.persona_type;
    if (persona === 'Solo-Sarah') {
      recommendations.quick_wins.push('Google My Business Profil optimieren');
      recommendations.quick_wins.push('Öffnungszeiten aktualisieren');
    } else if (persona === 'Wachstums-Walter') {
      recommendations.quick_wins.push('Wettbewerbsanalyse durchführen');
      recommendations.quick_wins.push('Zielgruppen definieren');
    }

    // Advanced features based on completion level
    if (session.completion_progress > 60) {
      recommendations.advanced_features.push('KI-gestützte Content-Generierung');
      recommendations.advanced_features.push('Automatische Sichtbarkeits-Überwachung');
    }

    return recommendations;
  }

  private estimateRemainingTime(session: CompletionSession): number {
    const startTime = new Date(session.session_start_time);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    
    // Assume 20 minutes total session time
    return Math.max(0, 20 - elapsedMinutes);
  }

  private calculateSessionDuration(session: CompletionSession): number {
    const startTime = new Date(session.session_start_time);
    const lastActivity = new Date(session.last_activity_time);
    return (lastActivity.getTime() - startTime.getTime()) / (1000 * 60);
  }

  private containsPotentialPII(text: string): boolean {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email pattern
    ];
    
    return piiPatterns.some(pattern => pattern.test(text));
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}