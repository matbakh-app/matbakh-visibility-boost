import { ComprehendClient, DetectPiiEntitiesCommand, DetectEntitiesCommand } from '@aws-sdk/client-comprehend';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { RekognitionClient, DetectTextCommand } from '@aws-sdk/client-rekognition';
import { PIIDetection, PIIType, ContentAnalysisResult, EntityDetection } from './types';

/**
 * PII Detection Engine using AWS AI services
 */
export class PIIDetector {
  private comprehendClient: ComprehendClient;
  private textractClient: TextractClient;
  private rekognitionClient: RekognitionClient;

  constructor() {
    this.comprehendClient = new ComprehendClient({ region: 'eu-central-1' });
    this.textractClient = new TextractClient({ region: 'eu-central-1' });
    this.rekognitionClient = new RekognitionClient({ region: 'eu-central-1' });
  }

  /**
   * Detect PII in file content
   */
  async detectPII(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<{
    piiDetected: PIIDetection[];
    contentAnalysis: ContentAnalysisResult;
    textContent: string;
  }> {
    let textContent = '';
    let piiDetected: PIIDetection[] = [];
    let contentAnalysis: ContentAnalysisResult = {};

    try {
      // Extract text based on file type
      if (mimeType.startsWith('image/')) {
        textContent = await this.extractTextFromImage(fileBuffer);
      } else if (mimeType === 'application/pdf') {
        textContent = await this.extractTextFromPDF(fileBuffer);
      } else if (mimeType.startsWith('text/')) {
        textContent = fileBuffer.toString('utf-8');
      }

      // If we have text content, analyze it
      if (textContent && textContent.trim().length > 0) {
        // Detect PII using AWS Comprehend
        const comprehendPII = await this.detectPIIWithComprehend(textContent);
        piiDetected.push(...comprehendPII);

        // Add pattern-based PII detection for additional coverage
        const patternPII = this.detectPIIWithPatterns(textContent);
        piiDetected.push(...patternPII);

        // Perform content analysis
        contentAnalysis = await this.analyzeContent(textContent);
      }

      // Remove duplicates and merge similar detections
      piiDetected = this.deduplicatePIIDetections(piiDetected);

      return {
        piiDetected,
        contentAnalysis: {
          ...contentAnalysis,
          textContent: textContent.substring(0, 1000) // Limit stored text
        },
        textContent
      };
    } catch (error) {
      console.error('Error detecting PII:', error);
      return {
        piiDetected: [],
        contentAnalysis: {},
        textContent: ''
      };
    }
  }

  /**
   * Extract text from image using Amazon Rekognition
   */
  private async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    try {
      const command = new DetectTextCommand({
        Image: {
          Bytes: imageBuffer
        }
      });

      const response = await this.rekognitionClient.send(command);
      
      if (!response.TextDetections) {
        return '';
      }

      // Combine all detected text
      return response.TextDetections
        .filter(detection => detection.Type === 'LINE')
        .map(detection => detection.DetectedText || '')
        .join('\n');
    } catch (error) {
      console.warn('Failed to extract text from image:', error);
      return '';
    }
  }

  /**
   * Extract text from PDF using Amazon Textract
   */
  private async extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const command = new DetectDocumentTextCommand({
        Document: {
          Bytes: pdfBuffer
        }
      });

      const response = await this.textractClient.send(command);
      
      if (!response.Blocks) {
        return '';
      }

      // Extract text from blocks
      return response.Blocks
        .filter(block => block.BlockType === 'LINE')
        .map(block => block.Text || '')
        .join('\n');
    } catch (error) {
      console.warn('Failed to extract text from PDF:', error);
      return '';
    }
  }

  /**
   * Detect PII using AWS Comprehend
   */
  private async detectPIIWithComprehend(text: string): Promise<PIIDetection[]> {
    try {
      const command = new DetectPiiEntitiesCommand({
        Text: text,
        LanguageCode: 'de' // German language
      });

      const response = await this.comprehendClient.send(command);
      
      if (!response.Entities) {
        return [];
      }

      return response.Entities.map(entity => ({
        type: this.mapComprehendPIIType(entity.Type || 'other'),
        value: this.maskPIIValue(text.substring(entity.BeginOffset || 0, entity.EndOffset || 0)),
        location: `offset:${entity.BeginOffset}-${entity.EndOffset}`,
        confidence: entity.Score || 0,
        context: this.getContext(text, entity.BeginOffset || 0, entity.EndOffset || 0)
      }));
    } catch (error) {
      console.warn('Failed to detect PII with Comprehend:', error);
      return [];
    }
  }

  /**
   * Detect PII using pattern matching (fallback/additional detection)
   */
  private detectPIIWithPatterns(text: string): Promise<PIIDetection[]> {
    const patterns: Array<{ type: PIIType; pattern: RegExp; description: string }> = [
      {
        type: 'email',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        description: 'Email address'
      },
      {
        type: 'phone',
        pattern: /(?:\+49|0)[1-9]\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g,
        description: 'German phone number'
      },
      {
        type: 'iban',
        pattern: /\b[A-Z]{2}\d{2}[\s\-]?(?:\d{4}[\s\-]?){4,7}\d{1,4}\b/g,
        description: 'IBAN'
      },
      {
        type: 'credit_card',
        pattern: /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g,
        description: 'Credit card number'
      },
      {
        type: 'ip_address',
        pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        description: 'IP address'
      },
      {
        type: 'date_of_birth',
        pattern: /\b(?:\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}|\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})\b/g,
        description: 'Date of birth'
      }
    ];

    const detections: PIIDetection[] = [];

    for (const { type, pattern, description } of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        detections.push({
          type,
          value: this.maskPIIValue(match[0]),
          location: `offset:${match.index}-${match.index + match[0].length}`,
          confidence: 0.8, // Pattern-based detection has lower confidence
          context: this.getContext(text, match.index, match.index + match[0].length)
        });
      }
    }

    return Promise.resolve(detections);
  }

  /**
   * Analyze content for additional insights
   */
  private async analyzeContent(text: string): Promise<ContentAnalysisResult> {
    try {
      // Detect entities for business relevance
      const entitiesCommand = new DetectEntitiesCommand({
        Text: text,
        LanguageCode: 'de'
      });

      const entitiesResponse = await this.comprehendClient.send(entitiesCommand);
      
      const entities: EntityDetection[] = (entitiesResponse.Entities || []).map(entity => ({
        type: entity.Type || 'UNKNOWN',
        text: entity.Text || '',
        confidence: entity.Score || 0,
        offset: entity.BeginOffset || 0,
        length: (entity.EndOffset || 0) - (entity.BeginOffset || 0)
      }));

      // Determine if content is business relevant
      const businessKeywords = ['restaurant', 'menu', 'food', 'kitchen', 'service', 'customer', 'order', 'receipt'];
      const businessRelevant = businessKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );

      // Check for inappropriate content (basic keyword filtering)
      const inappropriateKeywords = ['password', 'secret', 'confidential', 'private'];
      const inappropriateContent = inappropriateKeywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );

      return {
        language: 'de',
        entities,
        businessRelevant,
        inappropriateContent,
        topics: this.extractTopics(entities)
      };
    } catch (error) {
      console.warn('Failed to analyze content:', error);
      return {};
    }
  }

  /**
   * Map Comprehend PII types to our internal types
   */
  private mapComprehendPIIType(comprehendType: string): PIIType {
    const mapping: Record<string, PIIType> = {
      'EMAIL': 'email',
      'PHONE': 'phone',
      'SSN': 'ssn',
      'CREDIT_DEBIT_NUMBER': 'credit_card',
      'NAME': 'name',
      'ADDRESS': 'address',
      'DATE_TIME': 'date_of_birth',
      'PASSPORT_NUMBER': 'passport',
      'DRIVER_ID': 'drivers_license',
      'BANK_ACCOUNT_NUMBER': 'financial_account',
      'BANK_ROUTING': 'financial_account'
    };

    return mapping[comprehendType] || 'name'; // Default fallback
  }

  /**
   * Mask PII value for logging/storage
   */
  private maskPIIValue(value: string): string {
    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }
    
    const visibleChars = 2;
    const maskedLength = value.length - (visibleChars * 2);
    
    return value.substring(0, visibleChars) + 
           '*'.repeat(maskedLength) + 
           value.substring(value.length - visibleChars);
  }

  /**
   * Get context around detected PII
   */
  private getContext(text: string, start: number, end: number): string {
    const contextLength = 50;
    const contextStart = Math.max(0, start - contextLength);
    const contextEnd = Math.min(text.length, end + contextLength);
    
    return text.substring(contextStart, contextEnd).trim();
  }

  /**
   * Remove duplicate PII detections
   */
  private deduplicatePIIDetections(detections: PIIDetection[]): PIIDetection[] {
    const seen = new Set<string>();
    const unique: PIIDetection[] = [];

    for (const detection of detections) {
      const key = `${detection.type}:${detection.location}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(detection);
      }
    }

    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract topics from entities
   */
  private extractTopics(entities: EntityDetection[]): string[] {
    const topics = new Set<string>();
    
    for (const entity of entities) {
      if (entity.confidence > 0.7) {
        topics.add(entity.type.toLowerCase());
      }
    }

    return Array.from(topics);
  }
}