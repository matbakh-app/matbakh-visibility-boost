#!/usr/bin/env tsx
/**
 * React act() Warnings Fixer
 * Wraps async operations with proper act() calls
 */
import { promises as fs } from "fs";
import path from "path";
import { glob } from "glob";

export class ReactActWarningsFixer {
  async fixAllReactTests(): Promise<void> {
    console.log('🔧 Fixing React act() Warnings...');
    
    const testFiles = await glob('src/**/__tests__/**/*.test.{ts,tsx}');
    
    for (const testFile of testFiles) {
      await this.fixReactTestFile(testFile);
    }
  }

  private async fixReactTestFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Skip non-React test files
      if (!content.includes('@testing-library/react') && !content.includes('react-dom')) {
        return;
      }
      
      let fixedContent = content;
      
      // Add act import if missing
      if (!content.includes('import { act }') && content.includes('@testing-library/react')) {
        fixedContent = fixedContent.replace(
          /import.*from ['"]@testing-library\/react['"];?/,
          `import { render, screen, waitFor, act } from '@testing-library/react';`
        );
      }
      
      // Fix userEvent interactions
      fixedContent = fixedContent.replace(
        /await userEvent\.(click|type|clear|selectOptions)\([^)]+\);/g,
        `await act(async () => {
          await userEvent.$1($&.match(/\((.*)\)/)[1]);
        });`
      );
      
      // Fix state updates
      fixedContent = fixedContent.replace(
        /fireEvent\.(click|change|submit)\([^)]+\);/g,
        `act(() => {
          fireEvent.$1($&.match(/\((.*)\)/)[1]);
        });`
      );
      
      // Fix async state assertions
      fixedContent = fixedContent.replace(
        /expect\(screen\.getByText\([^)]+\)\)\.toBeInTheDocument\(\);/g,
        `await waitFor(() => {
          expect(screen.getByText($&.match(/getByText\(([^)]+)\)/)[1])).toBeInTheDocument();
        });`
      );
      
      if (fixedContent !== content) {
        await fs.writeFile(filePath, fixedContent);
        console.log(`     ✅ Fixed React act() warnings in ${filePath}`);
      }
    } catch (error) {
      console.warn(`     ⚠️ Could not fix ${filePath}: ${error.message}`);
    }
  }
}

// CLI Interface
async function main() {
  const fixer = new ReactActWarningsFixer();
  await fixer.fixAllReactTests();
  console.log('✅ React act() Warnings Fixed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
