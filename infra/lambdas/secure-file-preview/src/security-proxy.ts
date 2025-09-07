/**
 * Security Proxy for File Preview System
 * Implements WAF protection and security controls
 */

import { SecurityContext, SecurityValidationResult, SecurityViolation, RateLimitConfig, WAFRule } from './types';

export class SecurityProxy {
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private wafRules: WAFRule[] = [];
  private blockedIPs: Set<string> = new Set();
  private suspiciousPatterns: RegExp[] = [];

  constructor() {
    this.initializeWAFRules();
    this.initializeSuspiciousPatterns();
  }

  /**
   * Initialize WAF rules for file preview protection
   */
  private initializeWAFRules(): void {
    this.wafRules = [
      {
        id: 'rate-limit-global',
        name: 'Global Rate Limit',
        enabled: true,
        priority: 1,
        condition: {
          type: 'request_rate',
          operator: 'greater_than',
          value: 100, // 100 requests per minute
        },
        action: 'block',
      },
      {
        id: 'rate-limit-user',
        name: 'Per-User Rate Limit',
        enabled: true,
        priority: 2,
        condition: {
          type: 'request_rate',
          operator: 'greater_than',
          value: 20, // 20 requests per minute per user
        },
        action: 'block',
      },
      {
        id: 'file-size-limit',
        name: 'File Size Limit',
        enabled: true,
        priority: 3,
        condition: {
          type: 'file_size',
          operator: 'greater_than',
          value: 50 * 1024 * 1024, // 50MB limit
        },
        action: 'block',
      },
      {
        id: 'suspicious-user-agent',
        name: 'Block Suspicious User Agents',
        enabled: true,
        priority: 4,
        condition: {
          type: 'user_agent',
          operator: 'matches',
          value: '(bot|crawler|spider|scraper)',
        },
        action: 'challenge',
      },
      {
        id: 'allowed-file-types',
        name: 'Allowed File Types Only',
        enabled: true,
        priority: 5,
        condition: {
          type: 'file_type',
          operator: 'matches',
          value: '^(image|application/pdf|text)/',
        },
        action: 'allow',
      },
    ];
  }

  /**
   * Initialize patterns for detecting suspicious content
   */
  private initializeSuspiciousPatterns(): void {
    this.suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /eval\s*\(/i,
      /document\.write/i,
      /window\.location/i,
    ];
  }

  /**
   * Validate security context and apply WAF rules
   */
  async validateSecurity(
    context: SecurityContext,
    fileSize: number,
    contentType: string,
    filename: string
  ): Promise<SecurityValidationResult> {
    const violations: SecurityViolation[] = [];
    let riskScore = 0;

    try {
      // Check rate limits
      const rateLimitViolation = this.checkRateLimit(context);
      if (rateLimitViolation) {
        violations.push(rateLimitViolation);
        riskScore += 30;
      }

      // Check IP blocklist
      if (this.blockedIPs.has(context.ipAddress)) {
        violations.push({
          type: 'unauthorized_access',
          severity: 'critical',
          description: `IP address ${context.ipAddress} is blocked`,
          recommendation: 'Access denied from blocked IP address',
        });
        riskScore += 100;
      }

      // Validate file size
      const fileSizeViolation = this.validateFileSize(fileSize);
      if (fileSizeViolation) {
        violations.push(fileSizeViolation);
        riskScore += 20;
      }

      // Validate content type
      const contentTypeViolation = this.validateContentType(contentType);
      if (contentTypeViolation) {
        violations.push(contentTypeViolation);
        riskScore += 40;
      }

      // Validate filename
      const filenameViolation = this.validateFilename(filename);
      if (filenameViolation) {
        violations.push(filenameViolation);
        riskScore += 15;
      }

      // Check user agent
      const userAgentViolation = this.validateUserAgent(context.userAgent);
      if (userAgentViolation) {
        violations.push(userAgentViolation);
        riskScore += 25;
      }

      // Apply WAF rules
      const wafViolations = this.applyWAFRules(context, fileSize, contentType);
      violations.push(...wafViolations);
      riskScore += wafViolations.length * 10;

      const allowPreview = riskScore < 50 && !violations.some(v => v.severity === 'critical');

      return {
        isValid: violations.length === 0,
        violations,
        riskScore: Math.min(riskScore, 100),
        allowPreview,
      };

    } catch (error) {
      console.error('Security validation error:', error);
      
      return {
        isValid: false,
        violations: [{
          type: 'unauthorized_access',
          severity: 'critical',
          description: 'Security validation failed',
          recommendation: 'Access denied due to security validation error',
        }],
        riskScore: 100,
        allowPreview: false,
      };
    }
  }

  /**
   * Check rate limits for the request
   */
  private checkRateLimit(context: SecurityContext): SecurityViolation | null {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 20; // Max 20 requests per minute per user

    const key = `${context.userId}:${context.ipAddress}`;
    const current = this.rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize counter
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null;
    }

    if (current.count >= maxRequests) {
      return {
        type: 'rate_limit_exceeded',
        severity: 'high',
        description: `Rate limit exceeded: ${current.count}/${maxRequests} requests in window`,
        recommendation: 'Reduce request frequency or implement exponential backoff',
      };
    }

    // Increment counter
    current.count++;
    this.rateLimitStore.set(key, current);
    return null;
  }

  /**
   * Validate file size against limits
   */
  private validateFileSize(fileSize: number): SecurityViolation | null {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (fileSize > maxSize) {
      return {
        type: 'file_size_exceeded',
        severity: 'medium',
        description: `File size ${fileSize} bytes exceeds maximum allowed size of ${maxSize} bytes`,
        recommendation: 'Use a smaller file or compress the content',
      };
    }

    return null;
  }

  /**
   * Validate content type against allowed types
   */
  private validateContentType(contentType: string): SecurityViolation | null {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
    ];

    if (!allowedTypes.includes(contentType.toLowerCase())) {
      return {
        type: 'suspicious_file_type',
        severity: 'high',
        description: `Content type ${contentType} is not allowed for preview`,
        recommendation: 'Only images, PDFs, and text files are allowed for preview',
      };
    }

    return null;
  }

  /**
   * Validate filename for suspicious patterns
   */
  private validateFilename(filename: string): SecurityViolation | null {
    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return {
        type: 'invalid_file_structure',
        severity: 'high',
        description: 'Filename contains path traversal characters',
        recommendation: 'Use only simple filenames without path separators',
      };
    }

    // Check for suspicious extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (suspiciousExtensions.includes(extension)) {
      return {
        type: 'suspicious_file_type',
        severity: 'critical',
        description: `File extension ${extension} is not allowed`,
        recommendation: 'Only image, PDF, and text files are allowed',
      };
    }

    return null;
  }

  /**
   * Validate user agent for suspicious patterns
   */
  private validateUserAgent(userAgent: string): SecurityViolation | null {
    if (!userAgent || userAgent.length < 10) {
      return {
        type: 'unauthorized_access',
        severity: 'medium',
        description: 'Missing or suspicious user agent',
        recommendation: 'Use a standard web browser',
      };
    }

    // Check for bot patterns
    const botPatterns = /(bot|crawler|spider|scraper|wget|curl)/i;
    if (botPatterns.test(userAgent)) {
      return {
        type: 'unauthorized_access',
        severity: 'medium',
        description: 'Automated access detected',
        recommendation: 'Manual access required for file previews',
      };
    }

    return null;
  }

  /**
   * Apply WAF rules to the request
   */
  private applyWAFRules(
    context: SecurityContext,
    fileSize: number,
    contentType: string
  ): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const rule of this.wafRules) {
      if (!rule.enabled) continue;

      const violation = this.evaluateWAFRule(rule, context, fileSize, contentType);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Evaluate a single WAF rule
   */
  private evaluateWAFRule(
    rule: WAFRule,
    context: SecurityContext,
    fileSize: number,
    contentType: string
  ): SecurityViolation | null {
    const { condition, action } = rule;

    let matches = false;

    switch (condition.type) {
      case 'file_size':
        matches = this.evaluateNumericCondition(fileSize, condition.operator, condition.value as number);
        break;
      case 'file_type':
        matches = this.evaluateStringCondition(contentType, condition.operator, condition.value as string);
        break;
      case 'user_agent':
        matches = this.evaluateStringCondition(context.userAgent, condition.operator, condition.value as string);
        break;
      case 'ip_range':
        matches = this.evaluateIPCondition(context.ipAddress, condition.operator, condition.value as string);
        break;
      default:
        return null;
    }

    if (matches && action === 'block') {
      return {
        type: 'unauthorized_access',
        severity: 'high',
        description: `WAF rule violation: ${rule.name}`,
        recommendation: `Request blocked by security rule: ${rule.name}`,
      };
    }

    return null;
  }

  /**
   * Evaluate numeric conditions
   */
  private evaluateNumericCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * Evaluate string conditions
   */
  private evaluateStringCondition(value: string, operator: string, pattern: string): boolean {
    switch (operator) {
      case 'equals':
        return value === pattern;
      case 'contains':
        return value.includes(pattern);
      case 'matches':
        return new RegExp(pattern, 'i').test(value);
      default:
        return false;
    }
  }

  /**
   * Evaluate IP conditions (simplified)
   */
  private evaluateIPCondition(ip: string, operator: string, pattern: string): boolean {
    // Simplified IP matching - in production, use proper CIDR matching
    switch (operator) {
      case 'equals':
        return ip === pattern;
      case 'contains':
        return ip.includes(pattern);
      case 'matches':
        return new RegExp(pattern).test(ip);
      default:
        return false;
    }
  }

  /**
   * Scan content for malicious patterns
   */
  async scanContent(content: string | Buffer): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = [];
    const contentStr = content.toString('utf8');

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(contentStr)) {
        violations.push({
          type: 'embedded_script_detected',
          severity: 'critical',
          description: `Suspicious content pattern detected: ${pattern.source}`,
          recommendation: 'File contains potentially malicious content and cannot be previewed',
        });
      }
    }

    // Check for excessive script tags or suspicious HTML
    const scriptMatches = contentStr.match(/<script[^>]*>/gi);
    if (scriptMatches && scriptMatches.length > 5) {
      violations.push({
        type: 'embedded_script_detected',
        severity: 'high',
        description: `Excessive script tags detected: ${scriptMatches.length}`,
        recommendation: 'File contains too many script elements for safe preview',
      });
    }

    return violations;
  }

  /**
   * Add IP to blocklist
   */
  blockIP(ipAddress: string): void {
    this.blockedIPs.add(ipAddress);
    console.log(`IP address ${ipAddress} added to blocklist`);
  }

  /**
   * Remove IP from blocklist
   */
  unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress);
    console.log(`IP address ${ipAddress} removed from blocklist`);
  }

  /**
   * Get current rate limit status for a user
   */
  getRateLimitStatus(userId: string, ipAddress: string): {
    remaining: number;
    resetTime: number;
    blocked: boolean;
  } {
    const key = `${userId}:${ipAddress}`;
    const current = this.rateLimitStore.get(key);
    const maxRequests = 20;

    if (!current || Date.now() > current.resetTime) {
      return {
        remaining: maxRequests,
        resetTime: Date.now() + 60000,
        blocked: false,
      };
    }

    return {
      remaining: Math.max(0, maxRequests - current.count),
      resetTime: current.resetTime,
      blocked: current.count >= maxRequests,
    };
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (now > value.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }
}