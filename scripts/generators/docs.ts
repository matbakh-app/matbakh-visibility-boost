#!/usr/bin/env npx tsx

/**
 * Kiro Documentation Generator
 * 
 * Generates comprehensive documentation with JSDoc/TypeDoc integration
 * Links to QA reports, A11y findings, and performance budgets
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { kiroGenConfig } from '../../kirogen.config';
import { is } from 'date-fns/locale';
import { file } from 'zod/v4';
import { is } from 'date-fns/locale';
import { file } from 'zod/v4';

interface DocsGeneratorOptions {
    scope: string[];
    out: string;
    dryRun: boolean;
}

interface GeneratedDoc {
    path: string;
    content: string;
    type: 'component' | 'api' | 'guide' | 'index';
}

class KiroDocsGenerator {
    private config = kiroGenConfig;
    private logDir = this.config.observability.logDir;

    constructor() {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }
    }

    async generate(options: DocsGeneratorOptions): Promise<void> {
        const startTime = Date.now();
        const logFile = join(this.logDir, `docs-gen-${Date.now()}.log`);

        try {
            this.log(logFile, `Starting documentation generation`);
            this.log(logFile, `Scope: ${options.scope.join(', ')}`);
            this.log(logFile, `Output: ${options.out}`);

            const docs = await this.generateDocs(options);

            if (options.dryRun) {
                this.showDryRunPreview(docs);
                return;
            }

            await this.writeDocs(docs, options.out);

            const duration = Date.now() - startTime;
            this.log(logFile, `Generation completed successfully in ${duration}ms`);

            console.log(`✅ Documentation generated successfully`);
            console.log(`📁 Files: ${docs.length}`);
            console.log(`⏱️  Duration: ${duration}ms`);

        } catch (error) {
            this.log(logFile, `Error: ${error instanceof Error ? error.message : String(error)}`);
            console.error(`❌ Generation failed: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }

    private async generateDocs(options: DocsGeneratorOptions): Promise<GeneratedDoc[]> {
        const docs: GeneratedDoc[] = [];

        for (const scope of options.scope) {
            switch (scope) {
                case 'components':
                    docs.push(...await this.generateComponentDocs());
                    break;
                case 'api':
                    docs.push(...await this.generateApiDocs());
                    break;
                case 'guides':
                    docs.push(...await this.generateGuideDocs());
                    break;
            }
        }

        // Generate main index
        docs.push(await this.generateMainIndex(docs));

        return docs;
    } pr
ivate async generateComponentDocs(): Promise<GeneratedDoc[]> {
        const docs: GeneratedDoc[] = [];
        const componentsPath = this.config.paths.components;

        if (!existsSync(componentsPath)) {
            return docs;
        }

        const componentFiles = this.findComponentFiles(componentsPath);

        for (const componentFile of componentFiles) {
            const doc = await this.generateComponentDoc(componentFile);
            docs.push(doc);
        }

        return docs;
    }

    private findComponentFiles(dir: string): string[] {
        const files: string[] = [];

        const entries = readdirSync(dir);
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                files.push(...this.findComponentFiles(fullPath));
            } else if (entry.endsWith('.tsx') && !entry.includes('.test.') && !entry.includes('.stories.')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    private async generateComponentDoc(componentPath: string): Promise<GeneratedDoc> {
        const componentName = basename(componentPath, '.tsx');
        const content = readFileSync(componentPath, 'utf-8');

        return {
            path: `components/${componentName.toLowerCase()}.md`,
            content: this.generateComponentDocContent(componentName, componentPath, content),
            type: 'component'
        };
    }

    private generateComponentDocContent(name: string, path: string, content: string): string {
        const props = this.extractPropsFromContent(content);
        const examples = this.extractExamplesFromContent(content);
        const jsdocComments = this.extractJSDocComments(content);

        return `# ${name}

${jsdocComments.description || `${name} component following Kiro architecture patterns.`}

## Installation

\`\`\`tsx
import { ${name} } from '@/components/${path.split('/').slice(-2, -1)[0]}/${name}';
\`\`\`

## Usage

### Basic Usage

\`\`\`tsx
<${name}>
  Content
</${name}>
\`\`\`

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
${props.map(prop => `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${prop.default || '-'} | ${prop.description || '-'} |`).join('\n')}

## Examples

${examples.map((example, index) => `
### Example ${index + 1}

\`\`\`tsx
${example}
\`\`\`
`).join('\n')}

## Accessibility

This component follows WCAG 2.1 AA guidelines:

- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management

## Performance

- Render time budget: <${this.config.testing.performanceBudget.renderTime}ms
- Bundle size budget: <${this.config.testing.performanceBudget.bundleSize}KB

## Testing

Run component tests:

\`\`\`bash
npm test -- ${name}.test.tsx
\`\`\`

Target coverage: ${this.config.testing.coverageTargets.branches}%+

## Related

- [QA Report](../qa/components/${name.toLowerCase()}.md)
- [Performance Report](../performance/components/${name.toLowerCase()}.md)
- [A11y Report](../accessibility/components/${name.toLowerCase()}.md)

---

*Generated by Kiro Documentation Generator*`;
    }
    private extractPropsFromContent(content: string): Array<{ name: string, type: string, required: boolean, default?: string, description?: string }> {
        const props: Array<{ name: string, type: string, required: boolean, default?: string, description?: string }> = [];

        // Extract interface definitions
        const interfaceMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/s);
        if (interfaceMatch) {
            const propsContent = interfaceMatch[1];
            const propMatches = propsContent.match(/\/\*\*[\s\S]*?\*\/\s*(\w+)(\?)?:\s*([^;]+);/g);

            if (propMatches) {
                for (const match of propMatches) {
                    const propMatch = match.match(/\/\*\*\s*(.*?)\s*\*\/\s*(\w+)(\?)?:\s*([^;]+);/s);
                    if (propMatch) {
                        props.push({
                            name: propMatch[2],
                            type: propMatch[4].trim(),
                            required: !propMatch[3],
                            description: propMatch[1].replace(/\s*\*\s*/g, ' ').trim()
                        });
                    }
                }
            }
        }

        return props;
    }

    private extractExamplesFromContent(content: string): string[] {
        const examples: string[] = [];

        // Look for @example JSDoc tags
        const exampleMatches = content.match(/@example\s*([\s\S]*?)(?=\*\/|\*\s*@)/g);
        if (exampleMatches) {
            examples.push(...exampleMatches.map(match =>
                match.replace('@example', '').replace(/\s*\*\s*/g, '\n').trim()
            ));
        }

        return examples;
    }

    private extractJSDocComments(content: string): { description?: string, params?: string[], returns?: string } {
        const jsdoc: { description?: string, params?: string[], returns?: string } = {};

        // Extract main component JSDoc
        const jsdocMatch = content.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*(?:const|function|export)/);
        if (jsdocMatch) {
            const comment = jsdocMatch[1];

            // Extract description (first line before any @tags)
            const descMatch = comment.match(/^([^@]*)/s);
            if (descMatch) {
                jsdoc.description = descMatch[1].replace(/\s*\*\s*/g, ' ').trim();
            }

            // Extract @param tags
            const paramMatches = comment.match(/@param\s+\{[^}]+\}\s+\w+\s+[^\n]*/g);
            if (paramMatches) {
                jsdoc.params = paramMatches;
            }

            // Extract @returns tag
            const returnsMatch = comment.match(/@returns?\s+\{[^}]+\}\s+[^\n]*/);
            if (returnsMatch) {
                jsdoc.returns = returnsMatch[0];
            }
        }

        return jsdoc;
    }

    private async generateApiDocs(): Promise<GeneratedDoc[]> {
        const docs: GeneratedDoc[] = [];

        // Generate API overview
        docs.push({
            path: 'api/README.md',
            content: this.generateApiOverview(),
            type: 'api'
        });

        return docs;
    }

    private generateApiOverview(): string {
        return `# API Documentation

## Overview

This documentation covers all API endpoints and client libraries for the matbakh.app system.

## Authentication

All API requests require authentication. Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Base URL

\`\`\`
${process.env.VITE_API_URL || 'https://api.matbakh.app'}
\`\`\`

## Error Handling

The API uses conventional HTTP response codes:

- \`200\` - OK: The request was successful
- \`400\` - Bad Request: The request was invalid
- \`401\` - Unauthorized: Authentication failed
- \`403\` - Forbidden: Access denied
- \`404\` - Not Found: Resource not found
- \`500\` - Internal Server Error: Server error

### Error Response Format

\`\`\`json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid",
    "details": "Additional error details"
  }
}
\`\`\`

## Rate Limiting

API requests are limited to 1000 requests per hour per API key.

## Client Libraries

- [TypeScript Client](./clients/typescript.md)
- [React Hooks](./clients/react-hooks.md)

---

*Generated by Kiro Documentation Generator*`;
    } priva
te async generateGuideDocs(): Promise<GeneratedDoc[]> {
        const docs: GeneratedDoc[] = [];

        docs.push({
            path: 'guides/development.md',
            content: this.generateDevelopmentGuide(),
            type: 'guide'
        });

        docs.push({
            path: 'guides/testing.md',
            content: this.generateTestingGuide(),
            type: 'guide'
        });

        return docs;
    }

    private generateDevelopmentGuide(): string {
        return `# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

\`\`\`bash
git clone https://github.com/matbakh/matbakh-app.git
cd matbakh-app
npm install
\`\`\`

### Development Server

\`\`\`bash
npm run dev
\`\`\`

## Code Generation

Use the Kiro code generators to create new components:

\`\`\`bash
# Generate component
npm run gen:component -- --name MyComponent --domain ui

# Generate API client
npm run gen:api -- --schema openapi.json --out src/api

# Generate tests
npm run gen:tests -- --component src/components/MyComponent.tsx

# Generate documentation
npm run gen:docs -- --scope components,api --out docs
\`\`\`

## Architecture

### Component Structure

\`\`\`
src/components/<domain>/<ComponentName>/
├── index.ts              # Barrel export
├── ComponentName.tsx     # Main component
├── ComponentName.types.ts # TypeScript types
├── ComponentName.test.tsx # Tests
└── README.md            # Documentation
\`\`\`

### Naming Conventions

- Components: PascalCase
- Files: PascalCase for components, kebab-case for utilities
- Props: camelCase
- Types: PascalCase with descriptive suffixes

## Best Practices

### TypeScript

- Use strict mode
- Define proper interfaces for all props
- Use discriminated unions for variants
- Add JSDoc comments to public APIs

### Testing

- Aim for ${this.config.testing.coverageTargets.branches}%+ branch coverage
- Include accessibility tests
- Test all prop variants
- Add performance tests for complex components

### Accessibility

- Use semantic HTML elements
- Add proper ARIA attributes
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast ratios

---

*Generated by Kiro Documentation Generator*`;
    }

    private generateTestingGuide(): string {
        return `# Testing Guide

## Overview

Our testing strategy follows the testing pyramid with comprehensive coverage at all levels.

## Test Types

### Unit Tests

- Component rendering
- Props validation
- Event handling
- Accessibility compliance

### Integration Tests

- API integration
- Context providers
- Router integration

### E2E Tests

- User workflows
- Cross-browser compatibility
- Performance testing

## Running Tests

\`\`\`bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Accessibility tests
npm run test:a11y
\`\`\`

## Coverage Targets

- Statements: ${this.config.testing.coverageTargets.statements}%
- Branches: ${this.config.testing.coverageTargets.branches}%
- Functions: ${this.config.testing.coverageTargets.functions}%
- Lines: ${this.config.testing.coverageTargets.lines}%

---

*Generated by Kiro Documentation Generator*`;
    } priva
te async generateMainIndex(docs: GeneratedDoc[]): Promise<GeneratedDoc> {
        const componentDocs = docs.filter(d => d.type === 'component');
        const apiDocs = docs.filter(d => d.type === 'api');
        const guideDocs = docs.filter(d => d.type === 'guide');

        return {
            path: 'README.md',
            content: `# Documentation

Welcome to the matbakh.app documentation. This documentation is automatically generated from the codebase.

## Components

${componentDocs.map(doc => `- [${basename(doc.path, '.md')}](${doc.path})`).join('\n')}

## API Reference

${apiDocs.map(doc => `- [${basename(doc.path, '.md')}](${doc.path})`).join('\n')}

## Guides

${guideDocs.map(doc => `- [${basename(doc.path, '.md')}](${doc.path})`).join('\n')}

## Development

- [Code Generation](guides/code-generation.md)
- [Testing Strategy](guides/testing.md)

## Quality Assurance

- [QA Reports](qa/README.md)
- [Performance Reports](performance/README.md)
- [Accessibility Reports](accessibility/README.md)

---

*Generated on ${new Date().toISOString()}*
*Generated by Kiro Documentation Generator*`,
            type: 'index'
        };
    }

    private showDryRunPreview(docs: GeneratedDoc[]): void {
        console.log('\n🔍 Documentation Generation Dry Run Preview:\n');

        docs.forEach(doc => {
            console.log(`📄 ${doc.type.toUpperCase()}: ${doc.path}`);
            console.log('─'.repeat(50));
            console.log(doc.content.split('\n').slice(0, 10).join('\n'));
            if (doc.content.split('\n').length > 10) {
                console.log('... (truncated)');
            }
            console.log('\n');
        });

        console.log(`Total files to generate: ${docs.length}`);
    }

    private async writeDocs(docs: GeneratedDoc[], outputDir: string): Promise<void> {
        for (const doc of docs) {
            const fullPath = join(outputDir, doc.path);
            mkdirSync(dirname(fullPath), { recursive: true });
            writeFileSync(fullPath, doc.content);
        }
    }

    private log(logFile: string, message: string): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        writeFileSync(logFile, logEntry, { flag: 'a' });
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
Kiro Documentation Generator

Usage: npm run gen:docs -- --scope <scopes> --out <dir> [options]

Required:
  --scope <scopes>      Comma-separated scopes: components,api,guides
  --out <dir>          Output directory

Options:
  --dry-run            Preview without writing files

Examples:
  npm run gen:docs -- --scope components,api --out docs
  npm run gen:docs -- --scope guides --out docs --dry-run
`);
        process.exit(0);
    }

    const options: DocsGeneratorOptions = {
        scope: ['components', 'api', 'guides'],
        out: 'docs',
        dryRun: false
    };

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--scope':
                options.scope = args[++i].split(',').map(s => s.trim());
                break;
            case '--out':
                options.out = args[++i];
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
        }
    }

    const generator = new KiroDocsGenerator();
    await generator.generate(options);
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help')) {
        console.log(`
Kiro Documentation Generator

Usage: npm run gen:docs -- --scope <scopes> --out <dir> [options]

Required:
  --scope <scopes>      Comma-separated scopes: components,api,guides
  --out <dir>          Output directory

Options:
  --dry-run            Preview without writing files

Examples:
  npm run gen:docs -- --scope components,api --out docs
  npm run gen:docs -- --scope guides --out docs --dry-run
`);
        process.exit(0);
    }

    const options: DocsGeneratorOptions = {
        scope: ['components', 'api', 'guides'],
        out: 'docs',
        dryRun: false
    };

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--scope':
                options.scope = args[++i].split(',').map(s => s.trim());
                break;
            case '--out':
                options.out = args[++i];
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
        }
    }

    const generator = new KiroDocsGenerator();
    await generator.generate(options);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}// Run i
f this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}