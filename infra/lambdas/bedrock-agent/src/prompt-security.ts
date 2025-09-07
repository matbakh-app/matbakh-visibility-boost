/**
 * Prompt Security System for Bedrock AI Core
 * Implements prompt-level security guards and access control
 */

export interface SecurityGuards {
  allowWebRequests: boolean;
  allowedDomains: string[];
  forbiddenActions: string[];
  requiredDisclaimer: string;
  maxPromptLength: number;
  sensitiveDataPatterns: RegExp[];
}

export interface PromptContract {
  permissions: {
    webAccess: boolean;
    dataAccess: 'none' | 'public' | 'user_consent';
    outputFormat: 'text' | 'json' | 'structured';
  };
  restrictions: {
    noPersonalData: boolean;
    noDirectApiCalls: boolean;
    noDataStorage: boolean;
    noExternalUploads: boolean;
  };
  context: {
    userPersona?: string;
    requestType: string;
    dataScope: string;
  };
}

// Default security configuration
const DEFAULT_SECURITY_GUARDS: SecurityGuards = {
  allowWebRequests: true,
  allowedDomains: [
    'google.com',
    'googleapis.com',
    'instagram.com',
    'facebook.com',
    'tripadvisor.com',
    'yelp.com',
    'trends.google.com'
  ],
  forbiddenActions: [
    'speichern',
    'save',
    'store',
    'upload',
    'download',
    'delete',
    'modify',
    'update',
    'insert',
    'create table',
    'drop table',
    'alter table',
    'grant',
    'revoke'
  ],
  requiredDisclaimer: 'Alle Empfehlungen sind unverbindlich und dienen nur zur Information.',
  maxPromptLength: 100000,
  sensitiveDataPatterns: [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN-like patterns
    /\bpassword\s*[:=]\s*\S+/i, // Password patterns
    /\bapi[_-]?key\s*[:=]\s*\S+/i, // API key patterns
    /\btoken\s*[:=]\s*\S+/i, // Token patterns
  ]
};

/**
 * Build secure prompt with embedded security guards
 */
export function buildSecurePrompt(
  userPrompt: string,
  contract: PromptContract,
  customGuards?: Partial<SecurityGuards>
): { securePrompt: string; warnings: string[] } {
  const guards = { ...DEFAULT_SECURITY_GUARDS, ...customGuards };
  const warnings: string[] = [];

  // Validate prompt length
  if (userPrompt.length > guards.maxPromptLength) {
    throw new Error(`Prompt exceeds maximum length of ${guards.maxPromptLength} characters`);
  }

  // Check for sensitive data patterns
  for (const pattern of guards.sensitiveDataPatterns) {
    if (pattern.test(userPrompt)) {
      warnings.push('Potentially sensitive data detected in prompt');
      break;
    }
  }

  // Check for forbidden actions
  const lowerPrompt = userPrompt.toLowerCase();
  for (const action of guards.forbiddenActions) {
    if (lowerPrompt.includes(action.toLowerCase())) {
      warnings.push(`Potentially forbidden action detected: ${action}`);
    }
  }

  // Build the secure prompt with embedded guards
  const securePrompt = `
🔐 SICHERHEITSKONTEXT (NICHT ENTFERNBAR):
Du arbeitest im Kontext der Matbakh.app, einer nutzerzentrierten Plattform für Gastronomie, Events und digitale Sichtbarkeit. Du bist ein KI-Assistent, der personalisiert, empathisch und zielführend unterstützt.

📋 ERLAUBTE AKTIONEN:
${contract.permissions.webAccess ? '✅ Webanfragen zu öffentlichen Datenquellen (über Lambda-Proxy)' : '❌ Keine Webanfragen'}
${contract.permissions.dataAccess !== 'none' ? '✅ Zugriff auf freigegebene Daten' : '❌ Kein Datenzugriff'}
✅ Nutzerfreundliche Hinweise und weiterführende Tipps ergänzen
✅ Ausgabeformate flexibel gestalten (${contract.permissions.outputFormat})
✅ Kontext interpretieren und passende Empfehlungen geben

🚫 VERBOTENE AKTIONEN (NICHT ÜBERSCHREIBBAR):
❌ Sensible oder personenbezogene Daten speichern oder weiterleiten
❌ Nicht-freigegebene APIs direkt aufrufen
❌ Datenbanken ohne explizite Freigabe verändern
❌ Rückschlüsse auf Personenidentitäten ziehen
❌ Externe Uploads oder Downloads durchführen
❌ Daten außerhalb des Lambda-Kontexts persistieren

🌐 WEB-ZUGRIFF REGELN:
${guards.allowWebRequests ? `✅ Erlaubte Domains: ${guards.allowedDomains.join(', ')}` : '❌ Kein Web-Zugriff erlaubt'}
⚠️ Alle Webanfragen MÜSSEN über die Lambda-Proxy-Funktion erfolgen
⚠️ Keine direkten HTTP-Requests an externe APIs

📊 DATENKONTEXT:
- Request Type: ${contract.context.requestType}
- Data Scope: ${contract.context.dataScope}
${contract.context.userPersona ? `- User Persona: ${contract.context.userPersona}` : ''}

⚖️ RECHTLICHER HINWEIS:
${guards.requiredDisclaimer}

🎯 NUTZERANFRAGE:
${userPrompt}

📝 ANTWORTFORMAT:
Strukturierte, hilfreiche Antwort im Format: ${contract.permissions.outputFormat}
Immer höflich, empathisch und lösungsorientiert.
Bei Unsicherheiten: Nachfragen statt Annahmen treffen.
`;

  return { securePrompt, warnings };
}

/**
 * Validate prompt contract against security policies
 */
export function validatePromptContract(contract: PromptContract): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate request type
  const validRequestTypes = ['vc_analysis', 'content_generation', 'persona_detection', 'text_rewrite'];
  if (!validRequestTypes.includes(contract.context.requestType)) {
    errors.push(`Invalid request type: ${contract.context.requestType}`);
  }

  // Validate data scope
  const validDataScopes = ['public', 'user_consent', 'business_public', 'none'];
  if (!validDataScopes.includes(contract.context.dataScope)) {
    errors.push(`Invalid data scope: ${contract.context.dataScope}`);
  }

  // Validate permissions consistency
  if (contract.permissions.webAccess && contract.restrictions.noDirectApiCalls === false) {
    errors.push('Web access is allowed but direct API calls are not restricted - security conflict');
  }

  if (contract.permissions.dataAccess !== 'none' && contract.restrictions.noPersonalData === false) {
    errors.push('Data access is allowed but personal data restriction is not enforced');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create prompt contract for different request types
 */
export function createPromptContract(
  requestType: string,
  userPersona?: string,
  customPermissions?: Partial<PromptContract['permissions']>
): PromptContract {
  const baseContract: PromptContract = {
    permissions: {
      webAccess: false,
      dataAccess: 'none',
      outputFormat: 'text',
    },
    restrictions: {
      noPersonalData: true,
      noDirectApiCalls: true,
      noDataStorage: true,
      noExternalUploads: true,
    },
    context: {
      requestType,
      dataScope: 'none',
      userPersona,
    },
  };

  // Customize based on request type
  switch (requestType) {
    case 'vc_analysis':
      baseContract.permissions.webAccess = true;
      baseContract.permissions.dataAccess = 'public';
      baseContract.permissions.outputFormat = 'structured';
      baseContract.context.dataScope = 'business_public';
      break;

    case 'content_generation':
      baseContract.permissions.webAccess = true;
      baseContract.permissions.dataAccess = 'user_consent';
      baseContract.permissions.outputFormat = 'text';
      baseContract.context.dataScope = 'user_consent';
      break;

    case 'persona_detection':
      baseContract.permissions.webAccess = false;
      baseContract.permissions.dataAccess = 'user_consent';
      baseContract.permissions.outputFormat = 'json';
      baseContract.context.dataScope = 'user_consent';
      break;

    case 'text_rewrite':
      baseContract.permissions.webAccess = false;
      baseContract.permissions.dataAccess = 'none';
      baseContract.permissions.outputFormat = 'text';
      baseContract.context.dataScope = 'none';
      break;
  }

  // Apply custom permissions
  if (customPermissions) {
    baseContract.permissions = { ...baseContract.permissions, ...customPermissions };
  }

  return baseContract;
}

/**
 * Soft ruleset system for flexible prompt control
 */
export interface SoftRules {
  preferences: string[];
  guidelines: string[];
  fallbacks: string[];
}

export function applySoftRules(basePrompt: string, rules: SoftRules): string {
  const softRulesSection = `
🎯 PRÄFERENZEN (Empfohlenes Verhalten):
${rules.preferences.map(pref => `• ${pref}`).join('\n')}

📋 RICHTLINIEN (Bewährte Praktiken):
${rules.guidelines.map(guide => `• ${guide}`).join('\n')}

🔄 FALLBACK-STRATEGIEN (Bei Unsicherheit):
${rules.fallbacks.map(fallback => `• ${fallback}`).join('\n')}

`;

  return basePrompt + softRulesSection;
}

/**
 * Default soft rules for different personas
 */
export const PERSONA_SOFT_RULES: Record<string, SoftRules> = {
  'Der Skeptiker': {
    preferences: [
      'Immer konkrete Zahlen und Belege liefern',
      'Quellen und Methodik transparent machen',
      'Vergleichsdaten aus der Branche einbeziehen'
    ],
    guidelines: [
      'Vorsichtige Formulierungen verwenden ("könnte", "möglicherweise")',
      'Risiken und Limitationen erwähnen',
      'Alternative Interpretationen anbieten'
    ],
    fallbacks: [
      'Bei fehlenden Daten: "Für eine genauere Analyse benötigen wir zusätzliche Informationen"',
      'Bei Unsicherheit: Mehrere Szenarien durchspielen',
      'Immer Disclaimer über Unverbindlichkeit der Empfehlungen'
    ]
  },
  'Der Überforderte': {
    preferences: [
      'Einfache, verständliche Sprache verwenden',
      'Schritt-für-Schritt Anleitungen geben',
      'Komplexe Konzepte in kleine Teile aufteilen'
    ],
    guidelines: [
      'Fachbegriffe vermeiden oder erklären',
      'Visuelle Metaphern und Beispiele nutzen',
      'Ermutigende und unterstützende Tonalität'
    ],
    fallbacks: [
      'Bei komplexen Themen: "Lass uns das Schritt für Schritt angehen"',
      'Bei Überforderung: Prioritäten setzen und das Wichtigste zuerst',
      'Immer Unterstützung anbieten: "Du schaffst das!"'
    ]
  },
  'Der Profi': {
    preferences: [
      'Detaillierte technische Informationen bereitstellen',
      'Erweiterte Analysemethoden anwenden',
      'Branchenspezifische KPIs und Benchmarks nutzen'
    ],
    guidelines: [
      'Fachterminologie korrekt verwenden',
      'Tiefere Zusammenhänge erklären',
      'Strategische Implikationen aufzeigen'
    ],
    fallbacks: [
      'Bei fehlenden Details: Zusätzliche Datenquellen vorschlagen',
      'Bei Komplexität: Verschiedene Analyseebenen anbieten',
      'Export-Optionen und weiterführende Tools erwähnen'
    ]
  },
  'Der Zeitknappe': {
    preferences: [
      'Sofort umsetzbare Empfehlungen priorisieren',
      'Kurze, prägnante Antworten geben',
      'Quick Wins und Effizienzgewinne betonen'
    ],
    guidelines: [
      'Bullet Points statt lange Texte',
      'Zeitaufwand für jede Empfehlung angeben',
      'ROI-Schätzungen in den Vordergrund stellen'
    ],
    fallbacks: [
      'Bei komplexen Analysen: Top 3 Prioritäten hervorheben',
      'Bei Zeitdruck: "15-Minuten-Lösung" anbieten',
      'Automatisierungsmöglichkeiten aufzeigen'
    ]
  }
};

/**
 * Security audit function for prompt validation
 */
export function auditPromptSecurity(
  originalPrompt: string,
  securePrompt: string,
  contract: PromptContract
): {
  passed: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check if security guards are present
  if (!securePrompt.includes('SICHERHEITSKONTEXT')) {
    issues.push('Security context missing from prompt');
  }

  if (!securePrompt.includes('VERBOTENE AKTIONEN')) {
    issues.push('Forbidden actions section missing');
  }

  // Check for potential prompt injection attempts
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /forget\s+everything/i,
    /system\s*:\s*/i,
    /\[INST\]/i,
    /\<\|system\|\>/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(originalPrompt)) {
      issues.push('Potential prompt injection detected');
      break;
    }
  }

  // Check contract validation
  const contractValidation = validatePromptContract(contract);
  if (!contractValidation.valid) {
    issues.push(...contractValidation.errors);
  }

  // Recommendations based on request type
  if (contract.context.requestType === 'vc_analysis' && !contract.permissions.webAccess) {
    recommendations.push('Consider enabling web access for comprehensive visibility analysis');
  }

  if (contract.permissions.dataAccess !== 'none' && !securePrompt.includes('DSGVO')) {
    recommendations.push('Add GDPR compliance reminder for data processing');
  }

  return {
    passed: issues.length === 0,
    issues,
    recommendations,
  };
}