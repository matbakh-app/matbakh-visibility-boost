/**
 * Claude-Powered Questioning Engine for Bedrock AI Core
 * 
 * Integrates with AWS Bedrock Claude to generate intelligent, context-aware
 * questions for data completion based on existing information and user persona.
 * 
 * Requirements: 2.5, 5.5, 8.1
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { RestaurantData, UserContext } from './data-collection-framework';
import { CompletionQuestion, QuestionGenerationContext } from './dynamic-completion-system';

export interface ClaudeQuestionRequest {
  existing_data: RestaurantData;
  user_context: UserContext;
  missing_fields: string[];
  analysis_goal: string;
  max_questions: number;
  time_constraint_minutes?: number;
}

export interface ClaudeQuestionResponse {
  questions: CompletionQuestion[];
  reasoning: string;
  persona_adaptation: string;
  estimated_completion_benefit: string;
}

export class ClaudeQuestioningEngine {
  private bedrockClient: BedrockRuntimeClient;
  private readonly modelId = 'anthropic.claude-3-5-sonnet-20240620-v1:0';

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  /**
   * Generate intelligent questions using Claude based on context
   */
  async generateIntelligentQuestions(request: ClaudeQuestionRequest): Promise<ClaudeQuestionResponse> {
    const prompt = this.buildQuestionGenerationPrompt(request);
    
    try {
      const response = await this.invokeClaudeModel(prompt);
      return this.parseClaudeResponse(response);
    } catch (error) {
      console.error('Error generating questions with Claude:', error);
      // Fallback to rule-based questions
      return this.generateFallbackQuestions(request);
    }
  }

  /**
   * Generate follow-up questions based on user's previous answers
   */
  async generateFollowUpQuestions(
    previousAnswers: { [field: string]: any },
    userContext: UserContext,
    analysisGoal: string
  ): Promise<CompletionQuestion[]> {
    const prompt = this.buildFollowUpPrompt(previousAnswers, userContext, analysisGoal);
    
    try {
      const response = await this.invokeClaudeModel(prompt);
      const parsed = this.parseClaudeResponse(response);
      return parsed.questions;
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      return [];
    }
  }

  /**
   * Adapt question language and complexity based on persona
   */
  async adaptQuestionForPersona(
    baseQuestion: CompletionQuestion,
    userContext: UserContext
  ): Promise<CompletionQuestion> {
    const prompt = this.buildPersonaAdaptationPrompt(baseQuestion, userContext);
    
    try {
      const response = await this.invokeClaudeModel(prompt);
      const adaptedText = this.extractAdaptedQuestion(response);
      
      return {
        ...baseQuestion,
        question_text: adaptedText,
        persona_specific_guidance: {
          ...baseQuestion.persona_specific_guidance,
          [userContext.persona_type || 'Solo-Sarah']: this.extractPersonaGuidance(response)
        }
      };
    } catch (error) {
      console.error('Error adapting question for persona:', error);
      return baseQuestion;
    }
  }

  /**
   * Generate contextual explanations for why data is needed
   */
  async generateDataImportanceExplanation(
    fieldName: string,
    userContext: UserContext,
    analysisGoal: string
  ): Promise<string> {
    const prompt = this.buildImportanceExplanationPrompt(fieldName, userContext, analysisGoal);
    
    try {
      const response = await this.invokeClaudeModel(prompt);
      return this.extractExplanation(response);
    } catch (error) {
      console.error('Error generating importance explanation:', error);
      return this.getFallbackExplanation(fieldName);
    }
  }

  // Private methods
  private buildQuestionGenerationPrompt(request: ClaudeQuestionRequest): string {
    const persona = request.user_context.persona_type || 'Solo-Sarah';
    const language = request.user_context.language_preference || 'de';
    
    return `
[🧩 KI-Regeln für Claude / Bedrock]

Du arbeitest im Kontext der Matbakh.app, einer nutzerzentrierten Plattform für Gastronomie, Events und digitale Sichtbarkeit. Du bist ein KI-Assistent, der personalisiert, empathisch und zielführend unterstützt.

**Du darfst:**
- Intelligente Fragen zur Datenerfassung generieren
- Fragen an die Persona und den Kontext anpassen
- Erklärungen für die Wichtigkeit von Daten geben
- Ausgabeformate flexibel gestalten (JSON)

**Du darfst NICHT:**
- Sensible Daten speichern oder weiterleiten
- Nicht-freigegebene APIs aufrufen
- Rückschlüsse auf Personenidentitäten ziehen

**Aufgabe:** Generiere intelligente Fragen zur Vervollständigung der Restaurant-Daten.

**Kontext:**
- Persona: ${persona}
- Sprache: ${language}
- Analyseziel: ${request.analysis_goal}
- Zeitlimit: ${request.time_constraint_minutes || 'unbegrenzt'} Minuten
- Maximale Fragen: ${request.max_questions}

**Vorhandene Daten:**
${JSON.stringify(request.existing_data, null, 2)}

**Fehlende Felder:**
${request.missing_fields.join(', ')}

**Persona-Eigenschaften:**
${this.getPersonaCharacteristics(persona)}

**Anweisungen:**
1. Generiere ${request.max_questions} präzise Fragen für die wichtigsten fehlenden Daten
2. Passe Sprache und Komplexität an die Persona an
3. Erkläre kurz, warum jede Information wichtig ist
4. Berücksichtige das Zeitlimit bei der Fragenauswahl
5. Verwende das JSON-Format für die Antwort

**Antwortformat (JSON):**
{
  "questions": [
    {
      "id": "unique_id",
      "field_name": "field_name",
      "question_text": "Persona-angepasste Frage",
      "question_type": "text|select|multiselect|url|boolean",
      "options": ["option1", "option2"] // nur bei select/multiselect,
      "placeholder": "Beispieltext",
      "context_explanation": "Warum diese Info wichtig ist",
      "impact_description": "Wie es die Analyse verbessert",
      "priority_score": 85,
      "estimated_time_minutes": 2
    }
  ],
  "reasoning": "Begründung für die Fragenauswahl",
  "persona_adaptation": "Wie die Fragen an die Persona angepasst wurden",
  "estimated_completion_benefit": "Nutzen der Vervollständigung"
}
`;
  }

  private buildFollowUpPrompt(
    previousAnswers: { [field: string]: any },
    userContext: UserContext,
    analysisGoal: string
  ): string {
    const persona = userContext.persona_type || 'Solo-Sarah';
    
    return `
[🧩 KI-Regeln für Claude / Bedrock]

Du arbeitest im Kontext der Matbakh.app. Generiere intelligente Nachfragen basierend auf bereits gegebenen Antworten.

**Vorherige Antworten:**
${JSON.stringify(previousAnswers, null, 2)}

**Persona:** ${persona}
**Analyseziel:** ${analysisGoal}

**Aufgabe:** 
Basierend auf den vorherigen Antworten, generiere 1-3 logische Nachfragen, die:
1. Auf den bereits gegebenen Informationen aufbauen
2. Zur Persona passen
3. Die Analyse verbessern würden

Verwende das gleiche JSON-Format wie zuvor.
`;
  }

  private buildPersonaAdaptationPrompt(
    baseQuestion: CompletionQuestion,
    userContext: UserContext
  ): string {
    const persona = userContext.persona_type || 'Solo-Sarah';
    
    return `
[🧩 KI-Regeln für Claude / Bedrock]

**Aufgabe:** Passe diese Frage an die Persona "${persona}" an.

**Ursprüngliche Frage:**
${baseQuestion.question_text}

**Persona-Eigenschaften:**
${this.getPersonaCharacteristics(persona)}

**Anweisungen:**
1. Passe Sprache, Ton und Komplexität an die Persona an
2. Füge persona-spezifische Hinweise hinzu
3. Behalte die Kernfrage bei, aber verbessere die Formulierung

**Antwortformat:**
{
  "adapted_question": "Angepasste Frage",
  "persona_guidance": "Spezifische Hinweise für diese Persona",
  "adaptation_reasoning": "Warum diese Anpassung gewählt wurde"
}
`;
  }

  private buildImportanceExplanationPrompt(
    fieldName: string,
    userContext: UserContext,
    analysisGoal: string
  ): string {
    const persona = userContext.persona_type || 'Solo-Sarah';
    
    return `
[🧩 KI-Regeln für Claude / Bedrock]

**Aufgabe:** Erkläre persona-gerecht, warum das Feld "${fieldName}" für die Analyse wichtig ist.

**Persona:** ${persona}
**Analyseziel:** ${analysisGoal}

**Persona-Eigenschaften:**
${this.getPersonaCharacteristics(persona)}

**Anweisungen:**
1. Erkläre in 1-2 Sätzen, warum diese Information wichtig ist
2. Verwende Sprache und Beispiele, die zur Persona passen
3. Betone den konkreten Nutzen für das Analyseziel
4. Sei motivierend, aber nicht aufdringlich

Antworte nur mit der Erklärung, ohne zusätzliche Formatierung.
`;
  }

  private async invokeClaudeModel(prompt: string): Promise<string> {
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body: JSON.stringify(payload),
      contentType: 'application/json'
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.content[0].text;
  }

  private parseClaudeResponse(response: string): ClaudeQuestionResponse {
    try {
      // Extract JSON from Claude's response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        questions: parsed.questions.map((q: any) => ({
          ...q,
          id: q.id || `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        })),
        reasoning: parsed.reasoning || '',
        persona_adaptation: parsed.persona_adaptation || '',
        estimated_completion_benefit: parsed.estimated_completion_benefit || ''
      };
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      throw new Error('Failed to parse Claude response');
    }
  }

  private extractAdaptedQuestion(response: string): string {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.adapted_question || response;
      }
    } catch (error) {
      console.error('Error extracting adapted question:', error);
    }
    return response;
  }

  private extractPersonaGuidance(response: string): string {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.persona_guidance || '';
      }
    } catch (error) {
      console.error('Error extracting persona guidance:', error);
    }
    return '';
  }

  private extractExplanation(response: string): string {
    // Claude should return just the explanation text
    return response.trim();
  }

  private getPersonaCharacteristics(persona: string): string {
    const characteristics = {
      'Solo-Sarah': `
        - Einzelunternehmerin, oft überfordert
        - Braucht einfache, verständliche Sprache
        - Schätzt praktische, sofort umsetzbare Tipps
        - Wenig Zeit, möchte schnelle Erfolge sehen
        - Unsicher bei technischen Begriffen
      `,
      'Bewahrer-Ben': `
        - Traditionsbewusst, vorsichtig bei Veränderungen
        - Möchte detaillierte Erklärungen und Begründungen
        - Schätzt bewährte Methoden und Sicherheit
        - Braucht Vertrauen und Beweise für Empfehlungen
        - Bevorzugt schrittweise Veränderungen
      `,
      'Wachstums-Walter': `
        - Ambitioniert, wachstumsorientiert
        - Interessiert an strategischen Analysen
        - Möchte Zahlen, Daten und ROI-Berechnungen
        - Plant langfristig und systematisch
        - Offen für neue Technologien und Methoden
      `,
      'Ketten-Katrin': `
        - Führt mehrere Standorte oder eine Kette
        - Braucht skalierbare Lösungen
        - Interessiert an Markenpositionierung
        - Möchte einheitliche Standards
        - Denkt in größeren Dimensionen
      `
    };
    
    return characteristics[persona] || characteristics['Solo-Sarah'];
  }

  private generateFallbackQuestions(request: ClaudeQuestionRequest): ClaudeQuestionResponse {
    const fallbackQuestions: CompletionQuestion[] = request.missing_fields.slice(0, request.max_questions).map((field, index) => ({
      id: `fallback_${field}_${Date.now()}_${index}`,
      field_name: field,
      question_text: this.getFallbackQuestionText(field, request.user_context.persona_type),
      question_type: this.getFieldType(field),
      priority_score: 70,
      estimated_time_minutes: 2,
      context_explanation: this.getFallbackExplanation(field)
    }));

    return {
      questions: fallbackQuestions,
      reasoning: 'Fallback questions generated due to Claude API unavailability',
      persona_adaptation: 'Basic persona adaptation applied',
      estimated_completion_benefit: 'Improved analysis accuracy'
    };
  }

  private getFallbackQuestionText(field: string, persona?: string): string {
    const questions: { [key: string]: string } = {
      'business_name': 'Wie heißt Ihr Restaurant?',
      'main_category': 'Zu welcher Kategorie gehört Ihr Restaurant?',
      'website_url': 'Haben Sie eine Website für Ihr Restaurant?',
      'google_my_business_url': 'Haben Sie einen Google My Business Eintrag?',
      'target_audience': 'Wer sind Ihre Hauptgäste?'
    };
    
    return questions[field] || `Bitte geben Sie Informationen zu ${field} an.`;
  }

  private getFieldType(field: string): CompletionQuestion['question_type'] {
    const typeMap: { [key: string]: CompletionQuestion['question_type'] } = {
      'business_name': 'text',
      'main_category': 'select',
      'website_url': 'url',
      'google_my_business_url': 'url',
      'target_audience': 'multiselect'
    };
    
    return typeMap[field] || 'text';
  }

  private getFallbackExplanation(field: string): string {
    const explanations: { [key: string]: string } = {
      'business_name': 'Der Name wird für alle Analysen verwendet.',
      'main_category': 'Bestimmt die Vergleichsgruppe für Benchmarks.',
      'website_url': 'Wichtig für die Online-Präsenz-Analyse.',
      'google_my_business_url': 'Zentral für die Sichtbarkeitsanalyse.',
      'target_audience': 'Hilft bei zielgerichteten Empfehlungen.'
    };
    
    return explanations[field] || 'Diese Information verbessert die Analyse.';
  }
}