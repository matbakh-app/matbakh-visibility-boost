/**
 * Static Analysis Engine
 * Pattern-matching and rule-based threat detection
 */
import { ThreatIssue, ThreatPattern, ThreatType, ThreatLevel } from './types';

export class StaticAnalysisEngine {
  private patterns: ThreatPattern[];
  private compiledPatterns: Map<string, RegExp> = new Map();

  constructor(patterns: ThreatPattern[]) {
    this.patterns = patterns;
    this.compilePatterns();
  }

  /**
   * Analyze text for static threats
   */
  async analyze(prompt: string, output?: string): Promise<ThreatIssue[]> {
    const threats: ThreatIssue[] = [];

    // Analyze prompt
    const promptThreats = this.analyzeText(prompt, 'prompt');
    threats.push(...promptThreats);

    // Analyze output if provided
    if (output) {
      const outputThreats = this.analyzeText(output, 'output');
      threats.push(...outputThreats);
    }

    return threats;
  }

  /**
   * Update patterns and recompile
   */
  async updatePatterns(patterns: ThreatPattern[]): Promise<void> {
    this.patterns = patterns;
    this.compilePatterns();
  }

  /**
   * Analyze text against all patterns
   */
  private analyzeText(text: string, context: 'prompt' | 'output'): ThreatIssue[] {
    const threats: ThreatIssue[] = [];

    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue;

      const patternThreats = this.checkPattern(text, pattern, context);
      threats.push(...patternThreats);
    }

    return threats;
  }

  /**
   * Check text against a specific pattern
   */
  private checkPattern(text: string, pattern: ThreatPattern, context: 'prompt' | 'output'): ThreatIssue[] {
    const threats: ThreatIssue[] = [];

    for (const rule of pattern.patterns) {
      // Skip if rule doesn't apply to this context
      if (rule.context && rule.context !== 'both' && rule.context !== context) {
        continue;
      }

      const matches = this.executeRule(text, rule);
      
      for (const match of matches) {
        threats.push({
          type: pattern.type,
          severity: pattern.severity,
          confidence: this.calculateConfidence(rule, match),
          description: `${pattern.name}: ${pattern.description}`,
          evidence: [
            `Pattern: ${rule.pattern}`,
            `Match: "${match.text}"`,
            `Position: ${match.start}-${match.end}`,
          ],
          location: {
            start: match.start,
            end: match.end,
            context: this.getContext(text, match.start, match.end),
          },
          mitigation: this.getMitigation(pattern.type),
          owaspCategory: this.getOwaspCategory(pattern.type),
        });
      }
    }

    return threats;
  }

  /**
   * Execute a pattern rule against text
   */
  private executeRule(text: string, rule: any): Array<{ text: string; start: number; end: number }> {
    const matches: Array<{ text: string; start: number; end: number }> = [];

    switch (rule.type) {
      case 'regex':
        const regexMatches = this.executeRegexRule(text, rule);
        matches.push(...regexMatches);
        break;

      case 'keyword':
        const keywordMatches = this.executeKeywordRule(text, rule);
        matches.push(...keywordMatches);
        break;

      case 'semantic':
        const semanticMatches = this.executeSemanticRule(text, rule);
        matches.push(...semanticMatches);
        break;

      case 'statistical':
        const statisticalMatches = this.executeStatisticalRule(text, rule);
        matches.push(...statisticalMatches);
        break;
    }

    return matches;
  }

  /**
   * Execute regex-based rule
   */
  private executeRegexRule(text: string, rule: any): Array<{ text: string; start: number; end: number }> {
    const matches: Array<{ text: string; start: number; end: number }> = [];
    
    try {
      const flags = rule.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(rule.pattern, flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length,
        });

        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    } catch (error) {
      console.error(`Invalid regex pattern: ${rule.pattern}`, error);
    }

    return matches;
  }

  /**
   * Execute keyword-based rule
   */
  private executeKeywordRule(text: string, rule: any): Array<{ text: string; start: number; end: number }> {
    const matches: Array<{ text: string; start: number; end: number }> = [];
    const searchText = rule.caseSensitive ? text : text.toLowerCase();
    const keyword = rule.caseSensitive ? rule.pattern : rule.pattern.toLowerCase();

    let startIndex = 0;
    let index;

    while ((index = searchText.indexOf(keyword, startIndex)) !== -1) {
      // Check word boundaries if required
      if (rule.wholeWord) {
        const beforeChar = index > 0 ? text[index - 1] : ' ';
        const afterChar = index + keyword.length < text.length ? text[index + keyword.length] : ' ';
        
        if (!/\W/.test(beforeChar) || !/\W/.test(afterChar)) {
          startIndex = index + 1;
          continue;
        }
      }

      matches.push({
        text: text.substring(index, index + keyword.length),
        start: index,
        end: index + keyword.length,
      });

      startIndex = index + keyword.length;
    }

    return matches;
  }

  /**
   * Execute semantic-based rule (simplified implementation)
   */
  private executeSemanticRule(text: string, rule: any): Array<{ text: string; start: number; end: number }> {
    const matches: Array<{ text: string; start: number; end: number }> = [];

    // This is a simplified semantic analysis
    // In a production system, you would use more sophisticated NLP techniques
    const semanticPatterns = this.getSemanticPatterns(rule.pattern);
    
    for (const pattern of semanticPatterns) {
      const regexMatches = this.executeRegexRule(text, { 
        pattern, 
        caseSensitive: false 
      });
      matches.push(...regexMatches);
    }

    return matches;
  }

  /**
   * Execute statistical-based rule
   */
  private executeStatisticalRule(text: string, rule: any): Array<{ text: string; start: number; end: number }> {
    const matches: Array<{ text: string; start: number; end: number }> = [];

    // Statistical analysis based on rule type
    switch (rule.pattern) {
      case 'excessive_length':
        if (text.length > (rule.threshold || 10000)) {
          matches.push({
            text: text.substring(0, 100) + '...',
            start: 0,
            end: text.length,
          });
        }
        break;

      case 'repetitive_patterns':
        const repetitiveMatches = this.detectRepetitivePatterns(text, rule.threshold || 0.7);
        matches.push(...repetitiveMatches);
        break;

      case 'entropy_anomaly':
        const entropyScore = this.calculateEntropy(text);
        if (entropyScore < (rule.threshold || 2.0)) {
          matches.push({
            text: `Low entropy: ${entropyScore.toFixed(2)}`,
            start: 0,
            end: text.length,
          });
        }
        break;
    }

    return matches;
  }

  /**
   * Compile regex patterns for performance
   */
  private compilePatterns(): void {
    this.compiledPatterns.clear();

    for (const pattern of this.patterns) {
      for (const rule of pattern.patterns) {
        if (rule.type === 'regex') {
          try {
            const flags = rule.caseSensitive ? 'g' : 'gi';
            const regex = new RegExp(rule.pattern, flags);
            this.compiledPatterns.set(`${pattern.id}_${rule.pattern}`, regex);
          } catch (error) {
            console.error(`Failed to compile regex pattern: ${rule.pattern}`, error);
          }
        }
      }
    }
  }

  /**
   * Calculate confidence score for a match
   */
  private calculateConfidence(rule: any, match: any): number {
    let confidence = rule.weight || 0.5;

    // Adjust confidence based on match characteristics
    if (match.text.length > 50) {
      confidence += 0.1; // Longer matches are more significant
    }

    if (rule.type === 'regex' && match.text.length === rule.pattern.length) {
      confidence += 0.2; // Exact matches are more confident
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get context around a match
   */
  private getContext(text: string, start: number, end: number, contextLength: number = 50): string {
    const contextStart = Math.max(0, start - contextLength);
    const contextEnd = Math.min(text.length, end + contextLength);
    
    let context = text.substring(contextStart, contextEnd);
    
    if (contextStart > 0) context = '...' + context;
    if (contextEnd < text.length) context = context + '...';
    
    return context;
  }

  /**
   * Get mitigation advice for threat type
   */
  private getMitigation(threatType: ThreatType): string {
    const mitigations: Record<ThreatType, string> = {
      prompt_injection: 'Sanitize input and use parameterized prompts',
      prompt_leak: 'Implement output filtering and prompt protection',
      jailbreak_attempt: 'Update content policies and detection patterns',
      hallucination_risk: 'Implement fact-checking and validation',
      pii_exposure: 'Use PII detection and redaction',
      malicious_content: 'Block content and review user permissions',
      anomalous_behavior: 'Monitor user activity and implement rate limiting',
      token_abuse: 'Implement token limits and usage monitoring',
      rate_limit_violation: 'Enforce rate limiting and user quotas',
      unauthorized_access: 'Review access controls and authentication',
      data_exfiltration: 'Implement data loss prevention measures',
      model_manipulation: 'Validate model inputs and outputs',
    };

    return mitigations[threatType] || 'Review and monitor activity';
  }

  /**
   * Get OWASP category for threat type
   */
  private getOwaspCategory(threatType: ThreatType): string {
    const categories: Record<ThreatType, string> = {
      prompt_injection: 'A03:2021 – Injection',
      prompt_leak: 'A01:2021 – Broken Access Control',
      jailbreak_attempt: 'A04:2021 – Insecure Design',
      hallucination_risk: 'A04:2021 – Insecure Design',
      pii_exposure: 'A02:2021 – Cryptographic Failures',
      malicious_content: 'A03:2021 – Injection',
      anomalous_behavior: 'A06:2021 – Vulnerable Components',
      token_abuse: 'A07:2021 – Identification and Authentication Failures',
      rate_limit_violation: 'A07:2021 – Identification and Authentication Failures',
      unauthorized_access: 'A01:2021 – Broken Access Control',
      data_exfiltration: 'A02:2021 – Cryptographic Failures',
      model_manipulation: 'A08:2021 – Software and Data Integrity Failures',
    };

    return categories[threatType] || 'A10:2021 – Server-Side Request Forgery';
  }

  /**
   * Get semantic patterns for a concept
   */
  private getSemanticPatterns(concept: string): string[] {
    const patterns: Record<string, string[]> = {
      'ignore_instructions': [
        'ignore.*previous.*instructions?',
        'forget.*above',
        'disregard.*system.*prompt',
        'override.*instructions?',
      ],
      'system_prompt_leak': [
        'show.*system.*prompt',
        'reveal.*instructions?',
        'what.*are.*your.*instructions?',
        'print.*system.*message',
      ],
      'jailbreak': [
        'pretend.*you.*are',
        'act.*as.*if',
        'roleplay.*as',
        'simulate.*being',
        'DAN.*mode',
        'developer.*mode',
      ],
      'prompt_injection': [
        '###.*END.*PROMPT',
        '---.*NEW.*INSTRUCTION',
        'SYSTEM:.*USER:',
        '\\[INST\\].*\\[/INST\\]',
      ],
    };

    return patterns[concept] || [concept];
  }

  /**
   * Detect repetitive patterns in text
   */
  private detectRepetitivePatterns(text: string, threshold: number): Array<{ text: string; start: number; end: number }> {
    const matches: Array<{ text: string; start: number; end: number }> = [];
    const words = text.split(/\s+/);
    const wordCounts = new Map<string, number>();

    // Count word frequencies
    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 2) {
        wordCounts.set(cleanWord, (wordCounts.get(cleanWord) || 0) + 1);
      }
    }

    // Find repetitive words
    const totalWords = words.length;
    for (const [word, count] of wordCounts) {
      const frequency = count / totalWords;
      if (frequency > threshold && count > 3) {
        matches.push({
          text: `Repetitive word: "${word}" (${count} times)`,
          start: 0,
          end: text.length,
        });
      }
    }

    return matches;
  }

  /**
   * Calculate text entropy
   */
  private calculateEntropy(text: string): number {
    const charCounts = new Map<string, number>();
    
    for (const char of text) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }

    let entropy = 0;
    const textLength = text.length;

    for (const count of charCounts.values()) {
      const probability = count / textLength;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }
}