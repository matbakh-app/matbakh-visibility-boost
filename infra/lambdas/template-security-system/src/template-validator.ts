/**
 * Template Validator
 * Comprehensive validation system for templates including security, performance, and compliance checks
 */
import Joi from 'joi';
import { 
  TemplateContent, 
  TemplateMetadata, 
  TemplateValidationResult,
  ValidationError,
  ValidationWarning,
  SecurityIssue,
  PerformanceIssue,
  TemplateVariable,
  TemplateConstraint 
} from './types';

export class TemplateValidator {
  private securityPatterns: Map<string, RegExp> = new Map();
  private performanceThresholds: Map<string, number> = new Map();

  constructor() {
    this.initializeSecurityPatterns();
    this.initializePerformanceThresholds();
  }

  /**
   * Validate template comprehensively
   */
  async validateTemplate(
    metadata: TemplateMetadata,
    content: TemplateContent
  ): Promise<TemplateValidationResult> {
    const result: TemplateValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      securityIssues: [],
      performanceIssues: [],
    };

    try {
      // Validate metadata
      const metadataValidation = this.validateMetadata(metadata);
      result.errors.push(...metadataValidation.errors);
      result.warnings.push(...metadataValidation.warnings);

      // Validate content structure
      const contentValidation = this.validateContent(content);
      result.errors.push(...contentValidation.errors);
      result.warnings.push(...contentValidation.warnings);

      // Security validation
      const securityValidation = await this.validateSecurity(content);
      result.securityIssues.push(...securityValidation);

      // Performance validation
      const performanceValidation = this.validatePerformance(content);
      result.performanceIssues.push(...performanceValidation);

      // Variable validation
      const variableValidation = this.validateVariables(content.variables);
      result.errors.push(...variableValidation.errors);
      result.warnings.push(...variableValidation.warnings);

      // Constraint validation
      const constraintValidation = this.validateConstraints(content.constraints);
      result.errors.push(...constraintValidation.errors);
      result.warnings.push(...constraintValidation.warnings);

      // Dependency validation
      const dependencyValidation = await this.validateDependencies(content.dependencies);
      result.errors.push(...dependencyValidation.errors);
      result.warnings.push(...dependencyValidation.warnings);

      // Overall validity
      result.valid = result.errors.length === 0 && 
                    result.securityIssues.filter(issue => issue.severity === 'critical' || issue.severity === 'high').length === 0;

      console.log(`Template validation completed: ${result.valid ? 'VALID' : 'INVALID'}`);
      console.log(`Errors: ${result.errors.length}, Warnings: ${result.warnings.length}, Security Issues: ${result.securityIssues.length}`);

      return result;
    } catch (error) {
      console.error('Template validation failed:', error);
      
      result.valid = false;
      result.errors.push({
        field: 'validation',
        message: `Validation process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'VALIDATION_ERROR',
        severity: 'critical',
      });

      return result;
    }
  }

  /**
   * Validate template metadata
   */
  private validateMetadata(metadata: TemplateMetadata): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const schema = Joi.object({
      id: Joi.string().required().pattern(/^[a-zA-Z0-9_-]+$/),
      name: Joi.string().required().min(3).max(100),
      version: Joi.string().required().pattern(/^\d+\.\d+\.\d+$/),
      description: Joi.string().required().min(10).max(500),
      category: Joi.string().required().valid('prompt', 'config', 'schema', 'workflow', 'integration'),
      tags: Joi.array().items(Joi.string().max(50)).max(10),
      author: Joi.string().required().email(),
      status: Joi.string().valid('draft', 'pending_review', 'approved', 'rejected', 'deprecated', 'archived'),
      securityLevel: Joi.string().valid('public', 'internal', 'confidential', 'restricted'),
    });

    const { error } = schema.validate(metadata);
    if (error) {
      for (const detail of error.details) {
        errors.push({
          field: detail.path.join('.'),
          message: detail.message,
          code: detail.type,
          severity: 'error',
        });
      }
    }

    // Additional business logic validations
    if (metadata.securityLevel === 'restricted' && metadata.status !== 'approved') {
      warnings.push({
        field: 'securityLevel',
        message: 'Restricted templates should be approved before use',
        code: 'SECURITY_LEVEL_WARNING',
        recommendation: 'Submit for approval before deployment',
      });
    }

    if (metadata.tags.length === 0) {
      warnings.push({
        field: 'tags',
        message: 'Templates without tags are harder to discover',
        code: 'MISSING_TAGS',
        recommendation: 'Add relevant tags to improve discoverability',
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate template content
   */
  private validateContent(content: TemplateContent): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    if (!content.content || content.content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'Template content cannot be empty',
        code: 'EMPTY_CONTENT',
        severity: 'error',
      });
    }

    // Content type validation
    const validContentTypes = ['prompt', 'config', 'schema', 'code'];
    if (!validContentTypes.includes(content.contentType)) {
      errors.push({
        field: 'contentType',
        message: `Invalid content type: ${content.contentType}`,
        code: 'INVALID_CONTENT_TYPE',
        severity: 'error',
      });
    }

    // Content size validation
    const contentSize = Buffer.byteLength(content.content, 'utf8');
    const maxSize = 1024 * 1024; // 1MB
    
    if (contentSize > maxSize) {
      errors.push({
        field: 'content',
        message: `Content size (${contentSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
        code: 'CONTENT_TOO_LARGE',
        severity: 'error',
      });
    }

    // Content format validation based on type
    if (content.contentType === 'config') {
      try {
        JSON.parse(content.content);
      } catch (error) {
        errors.push({
          field: 'content',
          message: 'Config content must be valid JSON',
          code: 'INVALID_JSON',
          severity: 'error',
        });
      }
    }

    // Variable reference validation
    const variableReferences = this.extractVariableReferences(content.content);
    const definedVariables = new Set(content.variables.map(v => v.name));
    
    for (const varRef of variableReferences) {
      if (!definedVariables.has(varRef)) {
        warnings.push({
          field: 'content',
          message: `Referenced variable '${varRef}' is not defined`,
          code: 'UNDEFINED_VARIABLE',
          recommendation: `Define variable '${varRef}' or remove the reference`,
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate template security
   */
  private async validateSecurity(content: TemplateContent): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Check for potential injection vulnerabilities
    const injectionPatterns = this.securityPatterns.get('injection');
    if (injectionPatterns && injectionPatterns.test(content.content)) {
      issues.push({
        type: 'injection',
        description: 'Potential injection vulnerability detected in template content',
        severity: 'high',
        recommendation: 'Review and sanitize user inputs, use parameterized queries',
        cweId: 'CWE-89',
      });
    }

    // Check for XSS vulnerabilities
    const xssPatterns = this.securityPatterns.get('xss');
    if (xssPatterns && xssPatterns.test(content.content)) {
      issues.push({
        type: 'xss',
        description: 'Potential XSS vulnerability detected',
        severity: 'medium',
        recommendation: 'Escape user inputs and validate output encoding',
        cweId: 'CWE-79',
      });
    }

    // Check for sensitive data exposure
    const sensitivePatterns = this.securityPatterns.get('sensitive_data');
    if (sensitivePatterns && sensitivePatterns.test(content.content)) {
      issues.push({
        type: 'sensitive_data_exposure',
        description: 'Potential sensitive data exposure detected',
        severity: 'high',
        recommendation: 'Remove hardcoded credentials and use secure configuration',
        cweId: 'CWE-200',
      });
    }

    // Check for insecure deserialization
    const deserializationPatterns = this.securityPatterns.get('deserialization');
    if (deserializationPatterns && deserializationPatterns.test(content.content)) {
      issues.push({
        type: 'insecure_deserialization',
        description: 'Potential insecure deserialization detected',
        severity: 'high',
        recommendation: 'Validate and sanitize serialized data before processing',
        cweId: 'CWE-502',
      });
    }

    // Check variable security
    for (const variable of content.variables) {
      if (variable.sensitive && !variable.validation) {
        issues.push({
          type: 'broken_access_control',
          description: `Sensitive variable '${variable.name}' lacks validation`,
          severity: 'medium',
          recommendation: 'Add validation rules for sensitive variables',
          cweId: 'CWE-284',
        });
      }

      if (variable.type === 'string' && variable.defaultValue && typeof variable.defaultValue === 'string') {
        if (this.containsSensitiveData(variable.defaultValue)) {
          issues.push({
            type: 'sensitive_data_exposure',
            description: `Variable '${variable.name}' default value may contain sensitive data`,
            severity: 'medium',
            recommendation: 'Remove sensitive data from default values',
            cweId: 'CWE-200',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validate template performance
   */
  private validatePerformance(content: TemplateContent): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Check content size
    const contentSize = Buffer.byteLength(content.content, 'utf8');
    const sizeThreshold = this.performanceThresholds.get('content_size') || 100000; // 100KB
    
    if (contentSize > sizeThreshold) {
      issues.push({
        type: 'large_content',
        description: `Template content is large (${contentSize} bytes)`,
        impact: 'medium',
        recommendation: 'Consider breaking down into smaller templates or optimizing content',
      });
    }

    // Check variable count
    const variableCount = content.variables.length;
    const variableThreshold = this.performanceThresholds.get('variable_count') || 50;
    
    if (variableCount > variableThreshold) {
      issues.push({
        type: 'too_many_variables',
        description: `Template has many variables (${variableCount})`,
        impact: 'low',
        recommendation: 'Consider grouping related variables or simplifying the template',
      });
    }

    // Check dependency count
    const dependencyCount = content.dependencies.length;
    const dependencyThreshold = this.performanceThresholds.get('dependency_count') || 20;
    
    if (dependencyCount > dependencyThreshold) {
      issues.push({
        type: 'too_many_dependencies',
        description: `Template has many dependencies (${dependencyCount})`,
        impact: 'medium',
        recommendation: 'Review dependencies and remove unused ones',
      });
    }

    // Check for complex regex patterns in validation
    for (const variable of content.variables) {
      if (variable.validation) {
        for (const rule of variable.validation) {
          if (rule.type === 'regex' && typeof rule.value === 'string') {
            if (this.isComplexRegex(rule.value)) {
              issues.push({
                type: 'complex_regex',
                description: `Variable '${variable.name}' has complex regex validation`,
                impact: 'low',
                recommendation: 'Simplify regex pattern or use alternative validation',
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Validate template variables
   */
  private validateVariables(variables: TemplateVariable[]): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const variableNames = new Set<string>();

    for (const variable of variables) {
      // Check for duplicate names
      if (variableNames.has(variable.name)) {
        errors.push({
          field: `variables.${variable.name}`,
          message: `Duplicate variable name: ${variable.name}`,
          code: 'DUPLICATE_VARIABLE',
          severity: 'error',
        });
      }
      variableNames.add(variable.name);

      // Validate variable name format
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
        errors.push({
          field: `variables.${variable.name}`,
          message: `Invalid variable name format: ${variable.name}`,
          code: 'INVALID_VARIABLE_NAME',
          severity: 'error',
        });
      }

      // Validate default value type
      if (variable.defaultValue !== undefined) {
        const expectedType = variable.type;
        const actualType = Array.isArray(variable.defaultValue) ? 'array' : typeof variable.defaultValue;
        
        if (expectedType !== actualType && !(expectedType === 'object' && actualType === 'object')) {
          errors.push({
            field: `variables.${variable.name}.defaultValue`,
            message: `Default value type (${actualType}) doesn't match variable type (${expectedType})`,
            code: 'TYPE_MISMATCH',
            severity: 'error',
          });
        }
      }

      // Validate required variables have no default value or appropriate handling
      if (variable.required && variable.defaultValue !== undefined) {
        warnings.push({
          field: `variables.${variable.name}`,
          message: 'Required variable has default value',
          code: 'REQUIRED_WITH_DEFAULT',
          recommendation: 'Consider making variable optional or removing default value',
        });
      }

      // Validate sensitive variables
      if (variable.sensitive) {
        if (variable.defaultValue !== undefined) {
          warnings.push({
            field: `variables.${variable.name}`,
            message: 'Sensitive variable should not have default value',
            code: 'SENSITIVE_WITH_DEFAULT',
            recommendation: 'Remove default value for sensitive variables',
          });
        }

        if (!variable.validation || variable.validation.length === 0) {
          warnings.push({
            field: `variables.${variable.name}`,
            message: 'Sensitive variable lacks validation rules',
            code: 'SENSITIVE_WITHOUT_VALIDATION',
            recommendation: 'Add validation rules for sensitive variables',
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate template constraints
   */
  private validateConstraints(constraints: TemplateConstraint[]): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const constraint of constraints) {
      // Validate constraint rule format
      if (!constraint.rule || constraint.rule.trim().length === 0) {
        errors.push({
          field: 'constraints',
          message: 'Constraint rule cannot be empty',
          code: 'EMPTY_CONSTRAINT_RULE',
          severity: 'error',
        });
      }

      // Check for critical security constraints
      if (constraint.type === 'security' && constraint.severity === 'critical') {
        warnings.push({
          field: 'constraints',
          message: 'Template has critical security constraints',
          code: 'CRITICAL_SECURITY_CONSTRAINT',
          recommendation: 'Ensure all security requirements are met before deployment',
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate template dependencies
   */
  private async validateDependencies(dependencies: string[]): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const dependencySet = new Set<string>();

    for (const dependency of dependencies) {
      // Check for duplicates
      if (dependencySet.has(dependency)) {
        warnings.push({
          field: 'dependencies',
          message: `Duplicate dependency: ${dependency}`,
          code: 'DUPLICATE_DEPENDENCY',
          recommendation: 'Remove duplicate dependency',
        });
      }
      dependencySet.add(dependency);

      // Validate dependency format
      if (!/^[a-zA-Z0-9_-]+(@\d+\.\d+\.\d+)?$/.test(dependency)) {
        errors.push({
          field: 'dependencies',
          message: `Invalid dependency format: ${dependency}`,
          code: 'INVALID_DEPENDENCY_FORMAT',
          severity: 'error',
        });
      }

      // Check for circular dependencies (simplified check)
      if (dependency.includes('self') || dependency.includes('circular')) {
        errors.push({
          field: 'dependencies',
          message: `Potential circular dependency: ${dependency}`,
          code: 'CIRCULAR_DEPENDENCY',
          severity: 'error',
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Initialize security patterns
   */
  private initializeSecurityPatterns(): void {
    this.securityPatterns.set('injection', /(\$\{.*\}|<script|javascript:|eval\(|exec\(|system\()/i);
    this.securityPatterns.set('xss', /(<script|<iframe|<object|<embed|javascript:|vbscript:|onload=|onerror=)/i);
    this.securityPatterns.set('sensitive_data', /(password|secret|key|token|credential)[\s]*[:=][\s]*['"]\w+['"]/i);
    this.securityPatterns.set('deserialization', /(pickle\.loads|yaml\.load|eval\(|exec\(|__import__)/i);
  }

  /**
   * Initialize performance thresholds
   */
  private initializePerformanceThresholds(): void {
    this.performanceThresholds.set('content_size', 100000); // 100KB
    this.performanceThresholds.set('variable_count', 50);
    this.performanceThresholds.set('dependency_count', 20);
    this.performanceThresholds.set('regex_complexity', 100);
  }

  /**
   * Helper methods
   */
  private extractVariableReferences(content: string): string[] {
    const regex = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
    const matches: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    return [...new Set(matches)]; // Remove duplicates
  }

  private containsSensitiveData(value: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /credential/i,
      /api[_-]?key/i,
      /access[_-]?token/i,
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(value));
  }

  private isComplexRegex(pattern: string): boolean {
    // Simple heuristic for regex complexity
    const complexityIndicators = [
      /\(\?\=/,  // Positive lookahead
      /\(\?\!/,  // Negative lookahead
      /\(\?\<=/,  // Positive lookbehind
      /\(\?\<!/,  // Negative lookbehind
      /\{.*,.*\}/,  // Quantifiers with ranges
      /\|.*\|/,  // Multiple alternations
    ];
    
    return complexityIndicators.some(indicator => indicator.test(pattern)) || 
           pattern.length > 100;
  }
}