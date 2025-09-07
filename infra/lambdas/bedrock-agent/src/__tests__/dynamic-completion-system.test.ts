/**
 * Tests for Dynamic Completion System
 */

import { DynamicCompletionSystem, QuestionGenerationContext } from '../dynamic-completion-system';
import { RestaurantData, UserContext } from '../data-collection-framework';

describe('DynamicCompletionSystem', () => {
  const sampleUserContext: UserContext = {
    user_id: 'test-user-123',
    persona_type: 'Solo-Sarah',
    language_preference: 'de',
    experience_level: 'beginner',
    primary_goals: ['improve_visibility'],
    time_availability: 'limited'
  };

  const sampleRestaurantData: RestaurantData = {
    business_name: 'Zur Alten Post',
    main_category: 'Restaurant'
  };

  describe('createCompletionSession', () => {
    it('should create a new completion session', () => {
      const session = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        sampleRestaurantData
      );

      expect(session.session_id).toBeDefined();
      expect(session.user_context).toEqual(sampleUserContext);
      expect(session.current_data).toEqual(sampleRestaurantData);
      expect(session.questions_asked).toEqual([]);
      expect(session.questions_answered).toEqual([]);
      expect(session.completion_progress).toBeGreaterThan(0);
    });

    it('should calculate initial completion progress', () => {
      const emptyData: RestaurantData = {};
      const session = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        emptyData
      );

      expect(session.completion_progress).toBeLessThan(20);
      expect(session.critical_questions_remaining).toBeGreaterThan(0);
    });
  });

  describe('updateCompletionSession', () => {
    it('should update session with new answer', () => {
      const initialSession = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        {}
      );

      const updatedSession = DynamicCompletionSystem.updateCompletionSession(
        initialSession,
        'test-question-1',
        'Test Restaurant',
        'business_name'
      );

      expect(updatedSession.current_data.business_name).toBe('Test Restaurant');
      expect(updatedSession.questions_answered).toContain('test-question-1');
      expect(updatedSession.completion_progress).toBeGreaterThan(initialSession.completion_progress);
    });

    it('should update nested field values', () => {
      const initialSession = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        {}
      );

      const updatedSession = DynamicCompletionSystem.updateCompletionSession(
        initialSession,
        'test-question-2',
        'München',
        'address.city'
      );

      expect(updatedSession.current_data.address?.city).toBe('München');
    });
  });

  describe('generateContextAwareQuestions', () => {
    it('should generate questions based on missing data', async () => {
      const context: QuestionGenerationContext = {
        existing_data: { business_name: 'Test Restaurant' },
        user_context: sampleUserContext,
        analysis_goals: ['visibility_check']
      };

      const questions = await DynamicCompletionSystem.generateContextAwareQuestions(context, 3);

      expect(questions).toHaveLength(3);
      expect(questions[0].priority_score).toBeGreaterThan(0);
      expect(questions[0].estimated_time_minutes).toBeGreaterThan(0);
    });

    it('should prioritize questions by persona relevance', async () => {
      const profiContext: QuestionGenerationContext = {
        existing_data: { business_name: 'Test Restaurant' },
        user_context: { ...sampleUserContext, persona_type: 'Wachstums-Walter' },
        analysis_goals: ['strategic_analysis']
      };

      const sarahContext: QuestionGenerationContext = {
        existing_data: { business_name: 'Test Restaurant' },
        user_context: sampleUserContext,
        analysis_goals: ['visibility_check']
      };

      const profiQuestions = await DynamicCompletionSystem.generateContextAwareQuestions(profiContext, 3);
      const sarahQuestions = await DynamicCompletionSystem.generateContextAwareQuestions(sarahContext, 3);

      // Different personas should get different question priorities
      expect(profiQuestions[0].field_name).not.toBe(sarahQuestions[0].field_name);
    });
  });

  describe('getNextQuestion', () => {
    it('should return next best question for session', async () => {
      const session = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        { business_name: 'Test Restaurant' }
      );

      const nextQuestion = await DynamicCompletionSystem.getNextQuestion(session);

      expect(nextQuestion).toBeDefined();
      expect(nextQuestion?.priority_score).toBeGreaterThan(0);
    });

    it('should not return already asked questions', async () => {
      const session = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        { business_name: 'Test Restaurant' }
      );

      // Simulate asking a question
      session.questions_asked.push('test-question-1');

      const nextQuestion = await DynamicCompletionSystem.getNextQuestion(session);

      expect(nextQuestion?.id).not.toBe('test-question-1');
    });
  });

  describe('generateProgressIndicators', () => {
    it('should generate progress indicators', () => {
      const session = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        sampleRestaurantData
      );

      const indicators = DynamicCompletionSystem.generateProgressIndicators(session);

      expect(indicators.overall_progress).toBeGreaterThanOrEqual(0);
      expect(indicators.overall_progress).toBeLessThanOrEqual(100);
      expect(indicators.category_progress).toBeDefined();
      expect(indicators.next_milestone).toBeDefined();
      expect(indicators.estimated_completion_time).toBeGreaterThan(0);
      expect(indicators.completion_benefits).toBeInstanceOf(Array);
    });

    it('should show different milestones based on progress', () => {
      const lowProgressSession = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        {}
      );

      const highProgressSession = DynamicCompletionSystem.createCompletionSession(
        sampleUserContext,
        {
          business_name: 'Test Restaurant',
          main_category: 'Restaurant',
          address: { city: 'München', country: 'Deutschland' },
          website_url: 'https://test.de',
          google_my_business_url: 'https://goo.gl/maps/test'
        }
      );

      const lowIndicators = DynamicCompletionSystem.generateProgressIndicators(lowProgressSession);
      const highIndicators = DynamicCompletionSystem.generateProgressIndicators(highProgressSession);

      expect(lowIndicators.next_milestone).not.toBe(highIndicators.next_milestone);
      expect(highIndicators.completion_benefits.length).toBeGreaterThan(lowIndicators.completion_benefits.length);
    });
  });

  describe('shouldShowAdvancedQuestions', () => {
    it('should hide advanced questions for beginners with low progress', () => {
      const beginnerContext: UserContext = {
        ...sampleUserContext,
        experience_level: 'beginner'
      };

      const shouldShow = DynamicCompletionSystem.shouldShowAdvancedQuestions(beginnerContext, 30);

      expect(shouldShow).toBe(false);
    });

    it('should show advanced questions for experienced users', () => {
      const expertContext: UserContext = {
        ...sampleUserContext,
        experience_level: 'advanced',
        persona_type: 'Wachstums-Walter'
      };

      const shouldShow = DynamicCompletionSystem.shouldShowAdvancedQuestions(expertContext, 70);

      expect(shouldShow).toBe(true);
    });

    it('should consider time availability', () => {
      const limitedTimeContext: UserContext = {
        ...sampleUserContext,
        time_availability: 'limited'
      };

      const shouldShow = DynamicCompletionSystem.shouldShowAdvancedQuestions(limitedTimeContext, 70);

      expect(shouldShow).toBe(false);
    });
  });

  describe('question templates', () => {
    it('should have persona-specific question templates', async () => {
      const context: QuestionGenerationContext = {
        existing_data: {},
        user_context: sampleUserContext,
        analysis_goals: ['visibility_check']
      };

      const questions = await DynamicCompletionSystem.generateContextAwareQuestions(context, 1);

      expect(questions[0].question_text).toBeDefined();
      expect(questions[0].question_text.length).toBeGreaterThan(10);
    });

    it('should include validation rules for appropriate fields', async () => {
      const context: QuestionGenerationContext = {
        existing_data: {},
        user_context: sampleUserContext,
        analysis_goals: ['visibility_check']
      };

      const questions = await DynamicCompletionSystem.generateContextAwareQuestions(context, 5);
      const businessNameQuestion = questions.find(q => q.field_name === 'business_name');

      if (businessNameQuestion) {
        expect(businessNameQuestion.validation_rules?.required).toBe(true);
        expect(businessNameQuestion.validation_rules?.min_length).toBeGreaterThan(0);
      }
    });
  });
});