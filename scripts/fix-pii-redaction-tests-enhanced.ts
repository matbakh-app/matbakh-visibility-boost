#!/usr/bin/env tsx
/**
 * Enhanced PII Redaction Test Fixes
 * Fixes test assertions to validate proper masking instead of complete removal
 */
import { promises as fs } from "fs";
import path from "path";

export class PIIRedactionTestFixer {
  async fixAllPIITests(): Promise<void> {
    console.log('🔧 Fixing PII Redaction Test Logic...');
    
    const testFiles = [
      'src/lib/ai-orchestrator/__tests__/direct-bedrock-pii-detection.test.ts',
      'src/lib/compliance/__tests__/gdpr-compliance-validator.test.ts',
      'src/lib/ai-orchestrator/safety/__tests__/pii-toxicity-detector.test.ts'
    ];

    for (const testFile of testFiles) {
      await this.fixPIITestFile(testFile);
    }
  }

  private async fixPIITestFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Fix email redaction tests
      let fixedContent = content.replace(
        /expect\(.*\)\.not\.toContain\('@'\)/g,
        `// Fixed: Test for proper redaction, not absence of @
        const rawEmailPattern = /(?<!redacted-)[\w.+-]+@[\w.-]+\.[\w]{2,}/i;
        expect(redactionResult.redactedText).not.toMatch(rawEmailPattern);
        expect(redactionResult.redactedText).toMatch(/redacted-[a-f0-9]{8}@example\.com/i)`
      );

      // Fix phone number redaction tests  
      fixedContent = fixedContent.replace(
        /expect\(.*\)\.not\.toContain\('\+49'\)/g,
        `// Fixed: Phone number redaction validation
        const rawPhoneDE = /\+49[\s-]?(?:\d[\s-]?){8,}/;
        expect(redactionResult.redactedText).not.toMatch(rawPhoneDE);
        expect(redactionResult.redactedText).toMatch(/\+49-XXX-[a-f0-9]{8}/)`
      );

      // Fix credit card redaction tests
      fixedContent = fixedContent.replace(
        /expect\(.*\)\.not\.toMatch\(\/\d{4}.*\d{4}\/\)/g,
        `// Fixed: Credit card redaction validation
        const rawCCPattern = /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/;
        expect(redactionResult.redactedText).not.toMatch(rawCCPattern);
        expect(redactionResult.redactedText).toMatch(/XXXX-XXXX-XXXX-[a-f0-9]{4}/)`
      );

      await fs.writeFile(filePath, fixedContent);
      console.log(`     ✅ Fixed PII tests in ${filePath}`);
    } catch (error) {
      console.warn(`     ⚠️ Could not fix ${filePath}: ${error.message}`);
    }
  }
}

// CLI Interface
async function main() {
  const fixer = new PIIRedactionTestFixer();
  await fixer.fixAllPIITests();
  console.log('✅ PII Redaction Test Logic Fixed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
