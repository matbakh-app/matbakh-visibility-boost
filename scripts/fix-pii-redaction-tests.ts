#!/usr/bin/env tsx
/**
 * PII Redaction Test Fixes
 *
 * Updates PII redaction tests to validate proper masking instead of complete removal
 */
import { promises as fs } from "fs";
import path from "path";

interface PIITestFix {
  filePath: string;
  testName: string;
  oldAssertion: string;
  newAssertion: string;
  description: string;
}

class PIIRedactionTestFixer {
  private fixes: PIITestFix[] = [];

  constructor() {
    this.initializeFixes();
  }

  private initializeFixes(): void {
    this.fixes = [
      {
        filePath:
          "src/lib/ai-orchestrator/__tests__/direct-bedrock-pii-detection.test.ts",
        testName: "should detect and redact email addresses",
        oldAssertion: 'expect(redactionResult.redactedText).not.toContain("@")',
        newAssertion: `
        // Fixed: Test for proper redaction, not absence of @
        const rawEmailPattern = /(?<!redacted-)[\w.+-]+@[\w.-]+\.\w{2,}/i;
        expect(redactionResult.redactedText).not.toMatch(rawEmailPattern);
        expect(redactionResult.redactedText).toMatch(/redacted-[a-f0-9]{8}@example\.com/i);`,
        description:
          "Fix email redaction validation to check for proper masking",
      },
      {
        filePath:
          "src/lib/ai-orchestrator/__tests__/direct-bedrock-pii-detection.test.ts",
        testName: "should detect and redact phone numbers",
        oldAssertion:
          "expect(redactionResult.redactedText).not.toMatch(/\\+49/)",
        newAssertion: `
        // Fixed: Phone number redaction validation
        const rawPhoneDE = /\\+49[\\s-]?(?:\\d[\\s-]?){8,}/;
        expect(redactionResult.redactedText).not.toMatch(rawPhoneDE);
        expect(redactionResult.redactedText).toMatch(/\\+49-XXX-[a-f0-9]{8}/);`,
        description:
          "Fix phone number redaction to validate proper masking format",
      },
      {
        filePath:
          "src/lib/ai-orchestrator/__tests__/direct-bedrock-pii-detection.test.ts",
        testName: "should detect and redact credit card numbers",
        oldAssertion:
          "expect(redactionResult.redactedText).not.toMatch(/\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}/)",
        newAssertion: `
        // Fixed: Credit card redaction validation
        const rawCreditCard = /\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}/;
        expect(redactionResult.redactedText).not.toMatch(rawCreditCard);
        expect(redactionResult.redactedText).toMatch(/XXXX-XXXX-XXXX-[a-f0-9]{4}/);`,
        description: "Fix credit card redaction to validate proper masking",
      },
      {
        filePath:
          "src/lib/ai-orchestrator/__tests__/pii-toxicity-detector.test.ts",
        testName: "should redact PII in text content",
        oldAssertion:
          'expect(result.redactedText).not.toContain("john.doe@example.com")',
        newAssertion: `
        // Fixed: Validate redaction mapping and proper masking
        expect(result.redactedText).not.toContain("john.doe@example.com");
        expect(result.redactedText).toMatch(/redacted-[a-f0-9]{8}@example\\.com/);
        expect(result.redactionMap).toBeDefined();
        expect(Object.keys(result.redactionMap)).toHaveLength(1);`,
        description: "Fix PII detector tests to validate redaction mapping",
      },
    ];
  }

  async applyFixes(): Promise<void> {
    console.log("🔧 Applying PII Redaction Test Fixes...");

    for (const fix of this.fixes) {
      await this.applyFix(fix);
    }

    console.log("✅ All PII redaction test fixes applied successfully");
  }

  private async applyFix(fix: PIITestFix): Promise<void> {
    console.log(`📝 Fixing: ${fix.testName}`);
    console.log(`   File: ${fix.filePath}`);
    console.log(`   Description: ${fix.description}`);

    try {
      // Check if file exists
      const fullPath = path.join(process.cwd(), fix.filePath);
      await fs.access(fullPath);

      // Read file content
      let content = await fs.readFile(fullPath, "utf-8");

      // Apply fix if old assertion exists
      if (content.includes(fix.oldAssertion)) {
        content = content.replace(fix.oldAssertion, fix.newAssertion);
        await fs.writeFile(fullPath, content);
        console.log(`   ✅ Applied fix to ${fix.filePath}`);
      } else {
        console.log(
          `   ⚠️ Old assertion not found in ${fix.filePath} - may already be fixed`
        );
      }
    } catch (error) {
      console.log(
        `   ❌ Error applying fix to ${fix.filePath}: ${error.message}`
      );
    }
  }

  async validateFixes(): Promise<void> {
    console.log("🧪 Validating PII redaction test fixes...");

    // Run PII-related tests to validate fixes
    const { spawn } = await import("child_process");

    return new Promise((resolve, reject) => {
      const testProcess = spawn(
        "jest",
        [
          "--testNamePattern=PII|redaction|privacy",
          "--verbose",
          "--passWithNoTests",
        ],
        {
          stdio: "inherit",
          cwd: process.cwd(),
        }
      );

      testProcess.on("close", (code) => {
        if (code === 0) {
          console.log("✅ PII redaction tests are now passing");
          resolve();
        } else {
          console.log(
            "❌ PII redaction tests still failing - manual review needed"
          );
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      testProcess.on("error", (error) => {
        reject(error);
      });
    });
  }

  async generatePIITestGuide(): Promise<void> {
    const guidePath = path.join(
      process.cwd(),
      "docs",
      "testing",
      "pii-redaction-test-guide.md"
    );
    await fs.mkdir(path.dirname(guidePath), { recursive: true });

    const guide = `# PII Redaction Test Guide

## Overview

This guide explains how to properly test PII redaction functionality to ensure GDPR compliance.

## Key Principles

### ❌ Wrong Approach
\`\`\`typescript
// Don't test for complete absence of characters
expect(redactedText).not.toContain("@");
expect(redactedText).not.toMatch(/\\d/);
\`\`\`

### ✅ Correct Approach
\`\`\`typescript
// Test for proper redaction patterns
const rawEmailPattern = /(?<!redacted-)[\\w.+-]+@[\\w.-]+\\.\\w{2,}/i;
expect(redactedText).not.toMatch(rawEmailPattern);
expect(redactedText).toMatch(/redacted-[a-f0-9]{8}@example\\.com/i);
\`\`\`

## Redaction Patterns

### Email Addresses
- **Raw:** \`john.doe@example.com\`
- **Redacted:** \`redacted-a1b2c3d4@example.com\`
- **Test Pattern:** \`/redacted-[a-f0-9]{8}@[\\w.-]+/i\`

### Phone Numbers (German)
- **Raw:** \`+49 123 456 7890\`
- **Redacted:** \`+49-XXX-a1b2c3d4\`
- **Test Pattern:** \`/\\+49-XXX-[a-f0-9]{8}/\`

### Credit Card Numbers
- **Raw:** \`4111 1111 1111 1111\`
- **Redacted:** \`XXXX-XXXX-XXXX-a1b2\`
- **Test Pattern:** \`/XXXX-XXXX-XXXX-[a-f0-9]{4}/\`

### Social Security Numbers
- **Raw:** \`123-45-6789\`
- **Redacted:** \`XXX-XX-a1b2\`
- **Test Pattern:** \`/XXX-XX-[a-f0-9]{4}/\`

## Test Structure

\`\`\`typescript
describe('PII Redaction', () => {
  it('should properly redact email addresses', async () => {
    const input = "Contact john.doe@example.com for details";
    const result = await piiDetector.redactPii(input);
    
    // Validate raw PII is removed
    const rawEmailPattern = /(?<!redacted-)[\\w.+-]+@[\\w.-]+\\.\\w{2,}/i;
    expect(result.redactedText).not.toMatch(rawEmailPattern);
    
    // Validate proper redaction format
    expect(result.redactedText).toMatch(/redacted-[a-f0-9]{8}@example\\.com/i);
    
    // Validate redaction mapping exists
    expect(result.redactionMap).toBeDefined();
    expect(Object.keys(result.redactionMap)).toHaveLength(1);
    
    // Validate structure preservation
    expect(result.redactedText).toContain("Contact");
    expect(result.redactedText).toContain("for details");
  });
});
\`\`\`

## GDPR Compliance Requirements

1. **Redaction, not Removal:** PII should be masked, not completely removed
2. **Structure Preservation:** Text structure should remain readable
3. **Reversibility:** Redaction should be reversible with proper authorization
4. **Audit Trail:** All redaction operations should be logged
5. **Confidence Scoring:** Redaction confidence should be tracked

## Common Mistakes

### 1. Testing for Absence
❌ \`expect(text).not.toContain("@")\` - Too broad, breaks legitimate content

### 2. Incomplete Validation
❌ Only testing that PII is gone, not that redaction format is correct

### 3. Missing Edge Cases
❌ Not testing multiple PII instances, mixed PII types, or boundary conditions

### 4. No Restoration Testing
❌ Not validating that redacted PII can be restored when authorized

## Best Practices

1. **Test Both Directions:** Redaction and restoration
2. **Validate Patterns:** Ensure redacted format follows specification
3. **Check Mapping:** Verify redaction mapping is complete and accurate
4. **Test Edge Cases:** Multiple instances, mixed types, boundary conditions
5. **Performance Testing:** Ensure redaction doesn't significantly impact performance
6. **Audit Logging:** Verify all redaction operations are properly logged

## Debugging Failed Tests

If PII redaction tests fail:

1. **Check Patterns:** Ensure test patterns match actual redaction format
2. **Validate Input:** Confirm test input contains expected PII
3. **Review Logs:** Check redaction service logs for errors
4. **Test Isolation:** Run individual tests to isolate issues
5. **Manual Verification:** Manually test redaction with sample data

---
*Generated by PII Redaction Test Fixer*
`;

    await fs.writeFile(guidePath, guide);
    console.log(`📚 PII redaction test guide created: ${guidePath}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "apply";

  const fixer = new PIIRedactionTestFixer();

  try {
    switch (command) {
      case "apply":
        await fixer.applyFixes();
        break;
      case "validate":
        await fixer.validateFixes();
        break;
      case "guide":
        await fixer.generatePIITestGuide();
        break;
      case "all":
        await fixer.applyFixes();
        await fixer.generatePIITestGuide();
        await fixer.validateFixes();
        break;
      default:
        console.log(`
PII Redaction Test Fixer
Usage: tsx fix-pii-redaction-tests.ts [command]

Commands:
  apply     Apply PII redaction test fixes (default)
  validate  Run tests to validate fixes
  guide     Generate PII redaction test guide
  all       Apply fixes, generate guide, and validate

Examples:
  tsx fix-pii-redaction-tests.ts apply
  tsx fix-pii-redaction-tests.ts all
        `);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { PIIRedactionTestFixer, PIITestFix };
