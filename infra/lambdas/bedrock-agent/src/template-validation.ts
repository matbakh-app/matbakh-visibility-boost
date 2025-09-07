/**
 * Template Validation System
 * Ensures security constraints are maintained across all prompt templates
 */

import { 
  PromptTemplate, 
  TemplateVersion, 
  TemplateVariables,
  templateRegistry 
} from './prompt-templates';
import { 
  PromptContract, 
  SecurityGuards, 
  validatePromptContract,
  auditPromptSecurity 
} from './prompt-security';

// Validation result interfaces
export interface TemplateValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  securityScore: number;
  recommendations: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  location?: string;
  recommendation?: string;
}

// Security validation rules
export interface SecurityValidationRules {
  maxPromptLength: number;
  requiredSecuritySections: string[];
  forbiddenPatterns: RegExp[];
  requiredDisclaimers: string[];
  allowedDomains: string[];
  mandatoryRestrictions: string[];
}

/**
 * Template Security Validator
 * Validates templates against security policies and constraints
 */
export class TemplateSecurityValidator {
  private rules: SecurityValidationRules;

  constructor(customRules?: Partial<SecurityValidationRules>) {
    this.rules = {
      maxPromptLength: 100000,
      requiredSecuritySections: [
        'SICHERHEITSKONTEXT',
        'ERLAUBTE AKTIONEN',
        'VERBOTENE AKTIONEN',
        'RECHTLICHER HINWEIS'
      ],
      forbiddenPatterns: [
        /ignore\s+previous\s+instructions/i,
        /forget\s+everything/i,
        /system\s*:\s*/i,
        /\[INST\]/i,
        /\<\|system\|\>/i,
        /execute\s+code/i,
        /run\s+command/i,
        /delete\s+file/i,
        /access\s+database/i
      ],
      requiredDisclaimers: [
        'unverbindlich',
        'nur zur Information',
        'keine Garantie'
      ],
      allowedDomains: [
        'google.com',
        'googleapis.com',
        'instagram.com',
        'facebook.com',
        'tripadvisor.com',
        'yelp.com'
      ],
      mandatoryRestrictions: [
        'noPersonalData',
        'noDirectApiCalls',
        'noDataStorage',
        'noExternalUploads'
      ],
      ...customRules
    };
  }

  /**
   * Validate a complete template
   */
  validateTemplate(template: PromptTemplate): TemplateValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let securityScore = 100;

    // Validate template structure
    const structureValidation = this.validateTemplateStructure(template);
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);
    securityScore -= structureValidation.errors.length * 10;

    // Validate current version
    const currentVersion = template.versions[template.currentVersion];
    if (currentVersion) {
      const versionValidation = this.validateTemplateVersion(currentVersion, template.defaultContract);
      errors.push(...versionValidation.errors);
      warnings.push(...versionValidation.warnings);
      securityScore -= versionValidation.errors.length * 5;
    }

    // Validate contract
    const contractValidation = validatePromptContract(template.defaultContract);
    if (!contractValidation.valid) {
      errors.push(...contractValidation.errors.map(error => ({
        code: 'CONTRACT_VALIDATION_FAILED',
        message: error,
        severity: 'high' as const,
        location: 'defaultContract'
      })));
      securityScore -= 15;
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(template, errors, warnings);

    return {
      valid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors,
      warnings,
      securityScore: Math.max(0, securityScore),
      recommendations
    };
  }

  /**
   * Validate template structure
   */
  private validateTemplateStructure(template: PromptTemplate): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!template.id || template.id.trim() === '') {
      errors.push({
        code: 'MISSING_TEMPLATE_ID',
        message: 'Template ID is required',
        severity: 'critical'
      });
    }

    if (!template.name || template.name.trim() === '') {
      errors.push({
        code: 'MISSING_TEMPLATE_NAME',
        message: 'Template name is required',
        severity: 'high'
      });
    }

    if (!template.currentVersion || !template.versions[template.currentVersion]) {
      errors.push({
        code: 'INVALID_CURRENT_VERSION',
        message: 'Current version does not exist in versions map',
        severity: 'critical'
      });
    }

    // Check required variables
    if (!template.requiredVariables || template.requiredVariables.length === 0) {
      warnings.push({
        code: 'NO_REQUIRED_VARIABLES',
        message: 'Template has no required variables - consider if this is intentional',
        recommendation: 'Define required variables for better validation'
      });
    }

    // Check for deprecated versions
    const deprecatedVersions = Object.values(template.versions).filter(v => v.deprecated);
    if (deprecatedVersions.length > 0) {
      warnings.push({
        code: 'DEPRECATED_VERSIONS_EXIST',
        message: `Template has ${deprecatedVersions.length} deprecated version(s)`,
        recommendation: 'Consider removing old deprecated versions'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate a specific template version
   */
  private validateTemplateVersion(
    version: TemplateVersion, 
    contract: PromptContract
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check template content length
    if (version.template.length > this.rules.maxPromptLength) {
      errors.push({
        code: 'TEMPLATE_TOO_LONG',
        message: `Template exceeds maximum length of ${this.rules.maxPromptLength} characters`,
        severity: 'high',
        location: `version ${version.version}`
      });
    }

    // Check for required security sections
    for (const section of this.rules.requiredSecuritySections) {
      if (!version.template.includes(section)) {
        errors.push({
          code: 'MISSING_SECURITY_SECTION',
          message: `Required security section '${section}' not found in template`,
          severity: 'critical',
          location: `version ${version.version}`,
          suggestion: `Add ${section} section to template`
        });
      }
    }

    // Check for forbidden patterns
    for (const pattern of this.rules.forbiddenPatterns) {
      if (pattern.test(version.template)) {
        errors.push({
          code: 'FORBIDDEN_PATTERN_DETECTED',
          message: `Forbidden pattern detected: ${pattern.source}`,
          severity: 'critical',
          location: `version ${version.version}`,
          suggestion: 'Remove or modify the forbidden pattern'
        });
      }
    }

    // Check for required disclaimers
    const hasDisclaimer = this.rules.requiredDisclaimers.some(disclaimer => 
      version.template.toLowerCase().includes(disclaimer.toLowerCase())
    );
    if (!hasDisclaimer) {
      errors.push({
        code: 'MISSING_DISCLAIMER',
        message: 'Template missing required legal disclaimer',
        severity: 'high',
        location: `version ${version.version}`,
        suggestion: 'Add legal disclaimer with terms like "unverbindlich" or "nur zur Information"'
      });
    }

    // Check web access restrictions
    if (contract.permissions.webAccess) {
      const hasWebAccessRules = version.template.includes('WEB-ZUGRIFF REGELN');
      if (!hasWebAccessRules) {
        errors.push({
          code: 'MISSING_WEB_ACCESS_RULES',
          message: 'Template allows web access but lacks web access rules section',
          severity: 'high',
          location: `version ${version.version}`,
          suggestion: 'Add WEB-ZUGRIFF REGELN section with allowed domains'
        });
      }

      // Check if allowed domains are specified
      const hasAllowedDomains = this.rules.allowedDomains.some(domain =>
        version.template.includes(domain)
      );
      if (!hasAllowedDomains) {
        warnings.push({
          code: 'NO_DOMAIN_RESTRICTIONS',
          message: 'Template allows web access but does not specify allowed domains',
          location: `version ${version.version}`,
          recommendation: 'Specify allowed domains for web requests'
        });
      }
    }

    // Check mandatory restrictions
    for (const restriction of this.rules.mandatoryRestrictions) {
      if (!contract.restrictions[restriction as keyof typeof contract.restrictions]) {
        errors.push({
          code: 'MISSING_MANDATORY_RESTRICTION',
          message: `Mandatory restriction '${restriction}' is not enforced`,
          severity: 'high',
          location: 'contract.restrictions',
          suggestion: `Set ${restriction} to true in contract restrictions`
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    template: PromptTemplate,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): string[] {
    const recommendations: string[] = [];

    // Security recommendations
    if (errors.some(e => e.code === 'MISSING_SECURITY_SECTION')) {
      recommendations.push('Implement all required security sections to ensure prompt safety');
    }

    if (warnings.some(w => w.code === 'NO_DOMAIN_RESTRICTIONS')) {
      recommendations.push('Define specific allowed domains for web access to improve security');
    }

    // Performance recommendations
    if (template.versions[template.currentVersion]?.template.length > 50000) {
      recommendations.push('Consider breaking down large templates into smaller, more focused ones');
    }

    // Maintenance recommendations
    const versionCount = Object.keys(template.versions).length;
    if (versionCount > 10) {
      recommendations.push('Consider archiving old template versions to reduce complexity');
    }

    // Usability recommendations
    if (template.requiredVariables.length > 10) {
      recommendations.push('High number of required variables may impact usability - consider making some optional');
    }

    if (!template.optionalVariables || template.optionalVariables.length === 0) {
      recommendations.push('Consider adding optional variables for enhanced flexibility');
    }

    return recommendations;
  }
}

/**
 * Template Variable Validator
 * Validates template variables and their usage
 */
export class TemplateVariableValidator {
  /**
   * Validate variables against template requirements
   */
  validateVariables(
    templateId: string,
    variables: TemplateVariables
  ): TemplateValidationResult {
    const template = templateRegistry.getTemplate(templateId);
    if (!template) {
      return {
        valid: false,
        errors: [{
          code: 'TEMPLATE_NOT_FOUND',
          message: `Template ${templateId} not found`,
          severity: 'critical'
        }],
        warnings: [],
        securityScore: 0,
        recommendations: []
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let securityScore = 100;

    // Check required variables
    const missingRequired = template.requiredVariables.filter(
      key => !(key in variables) || variables[key as keyof TemplateVariables] === undefined
    );

    if (missingRequired.length > 0) {
      errors.push({
        code: 'MISSING_REQUIRED_VARIABLES',
        message: `Missing required variables: ${missingRequired.join(', ')}`,
        severity: 'critical',
        suggestion: 'Provide all required variables before template generation'
      });
      securityScore -= missingRequired.length * 20;
    }

    // Check for extra variables
    const allAllowed = [...template.requiredVariables, ...template.optionalVariables];
    const extraVariables = Object.keys(variables).filter(key => !allAllowed.includes(key));

    if (extraVariables.length > 0) {
      warnings.push({
        code: 'EXTRA_VARIABLES_PROVIDED',
        message: `Extra variables provided: ${extraVariables.join(', ')}`,
        recommendation: 'Remove unused variables or add them to template definition'
      });
    }

    // Validate variable content
    const contentValidation = this.validateVariableContent(variables);
    errors.push(...contentValidation.errors);
    warnings.push(...contentValidation.warnings);
    securityScore -= contentValidation.errors.length * 5;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      securityScore: Math.max(0, securityScore),
      recommendations: this.generateVariableRecommendations(variables, errors, warnings)
    };
  }

  /**
   * Validate content of individual variables
   */
  private validateVariableContent(variables: TemplateVariables): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check for potentially sensitive data
    const sensitivePatterns = [
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, name: 'email' },
      { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, name: 'phone' },
      { pattern: /\bpassword\s*[:=]\s*\S+/i, name: 'password' },
      { pattern: /\bapi[_-]?key\s*[:=]\s*\S+/i, name: 'api_key' }
    ];

    Object.entries(variables).forEach(([key, value]) => {
      if (typeof value === 'string') {
        for (const { pattern, name } of sensitivePatterns) {
          if (pattern.test(value)) {
            errors.push({
              code: 'SENSITIVE_DATA_IN_VARIABLE',
              message: `Potentially sensitive data (${name}) detected in variable '${key}'`,
              severity: 'high',
              location: key,
              suggestion: 'Remove or redact sensitive information'
            });
          }
        }

        // Check for excessively long content
        if (value.length > 10000) {
          warnings.push({
            code: 'VARIABLE_CONTENT_TOO_LONG',
            message: `Variable '${key}' content is very long (${value.length} characters)`,
            location: key,
            recommendation: 'Consider breaking down large content into smaller parts'
          });
        }
      }
    });

    // Validate specific variable types
    if (variables.user_language && !['de', 'en'].includes(variables.user_language)) {
      warnings.push({
        code: 'UNSUPPORTED_LANGUAGE',
        message: `Language '${variables.user_language}' may not be fully supported`,
        location: 'user_language',
        recommendation: 'Use supported languages: de, en'
      });
    }

    if (variables.data_quality_score && (variables.data_quality_score < 0 || variables.data_quality_score > 100)) {
      errors.push({
        code: 'INVALID_QUALITY_SCORE',
        message: 'Data quality score must be between 0 and 100',
        severity: 'medium',
        location: 'data_quality_score'
      });
    }

    return { errors, warnings };
  }

  /**
   * Generate recommendations for variable usage
   */
  private generateVariableRecommendations(
    variables: TemplateVariables,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): string[] {
    const recommendations: string[] = [];

    if (errors.some(e => e.code === 'SENSITIVE_DATA_IN_VARIABLE')) {
      recommendations.push('Implement PII detection and redaction before template processing');
    }

    if (!variables.user_persona) {
      recommendations.push('Consider adding user_persona for more personalized responses');
    }

    if (!variables.user_language) {
      recommendations.push('Specify user_language for localized content generation');
    }

    if (variables.business_profile && typeof variables.business_profile === 'object') {
      const profile = variables.business_profile as any;
      if (!profile.category) {
        recommendations.push('Add business category to business_profile for better analysis');
      }
      if (!profile.location) {
        recommendations.push('Add location to business_profile for local optimization');
      }
    }

    return recommendations;
  }
}

/**
 * Template Rollback System
 * Manages template version rollbacks with safety checks
 */
export class TemplateRollbackManager {
  private validator: TemplateSecurityValidator;

  constructor() {
    this.validator = new TemplateSecurityValidator();
  }

  /**
   * Safely rollback template to previous version
   */
  rollbackTemplate(
    templateId: string,
    targetVersion: string,
    reason: string
  ): {
    success: boolean;
    message: string;
    validationResult?: TemplateValidationResult;
  } {
    const template = templateRegistry.getTemplate(templateId);
    if (!template) {
      return {
        success: false,
        message: `Template ${templateId} not found`
      };
    }

    if (!template.versions[targetVersion]) {
      return {
        success: false,
        message: `Target version ${targetVersion} not found`
      };
    }

    // Validate target version before rollback
    const targetVersionData = template.versions[targetVersion];
    const validationResult = this.validator.validateTemplateVersion(
      targetVersionData,
      template.defaultContract
    );

    if (validationResult.errors.some(e => e.severity === 'critical')) {
      return {
        success: false,
        message: 'Target version has critical security issues - rollback blocked',
        validationResult: {
          valid: false,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          securityScore: 0,
          recommendations: ['Fix critical security issues before rollback']
        }
      };
    }

    // Perform rollback
    try {
      templateRegistry.rollbackVersion(templateId, targetVersion);
      
      // Log rollback
      console.log(`Template ${templateId} rolled back to version ${targetVersion}`, {
        reason,
        timestamp: new Date().toISOString(),
        previousVersion: template.currentVersion
      });

      return {
        success: true,
        message: `Successfully rolled back to version ${targetVersion}`,
        validationResult: {
          valid: true,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          securityScore: 100 - validationResult.errors.length * 5,
          recommendations: []
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get rollback candidates for a template
   */
  getRollbackCandidates(templateId: string): {
    version: string;
    description: string;
    createdAt: string;
    securityScore: number;
    recommended: boolean;
  }[] {
    const template = templateRegistry.getTemplate(templateId);
    if (!template) return [];

    const candidates = Object.entries(template.versions)
      .filter(([version]) => version !== template.currentVersion)
      .map(([version, versionData]) => {
        const validationResult = this.validator.validateTemplateVersion(
          versionData,
          template.defaultContract
        );
        
        return {
          version,
          description: versionData.description,
          createdAt: versionData.createdAt,
          securityScore: 100 - validationResult.errors.length * 10,
          recommended: validationResult.errors.length === 0
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return candidates;
  }
}

// Export validation system
export {
  TemplateSecurityValidator,
  TemplateVariableValidator,
  TemplateRollbackManager
};