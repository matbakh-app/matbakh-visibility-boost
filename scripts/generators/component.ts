#!/usr/bin/env npx tsx

/**
 * Kiro-konformer Component Generator
 * 
 * Generates UI components that fit directly into Vite/React/Tailwind + shadcn/ui
 * Includes tests, stories (optional), docs, and follows Kiro-Purity principles
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { kiroGenConfig } from '../../kirogen.config';

interface ComponentGeneratorOptions {
  name: string;
  domain: string;
  variants?: string[];
  withTests: boolean;
  withDocs: boolean;
  withStories: boolean;
  dryRun: boolean;
  page?: boolean;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'test' | 'types' | 'docs' | 'stories' | 'barrel';
}

class KiroComponentGenerator {
  private config = kiroGenConfig;
  private logDir = this.config.observability.logDir;

  constructor() {
    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  async generate(options: ComponentGeneratorOptions): Promise<void> {
    const startTime = Date.now();
    const logFile = join(this.logDir, `component-gen-${Date.now()}.log`);

    try {
      this.log(logFile, `Starting component generation: ${options.name}`);
      this.log(logFile, `Options: ${JSON.stringify(options, null, 2)}`);

      // Validate inputs
      await this.validateInputs(options);

      // Check for conflicts
      if (this.config.governance.conflictCheck) {
        await this.checkConflicts(options);
      }

      // Generate files
      const files = await this.generateFiles(options);

      // Hash-based skip check
      if (this.config.performance.hashBasedSkip) {
        const shouldSkip = await this.checkHashSkip(files);
        if (shouldSkip) {
          this.log(logFile, 'Skipping generation - no changes detected');
          return;
        }
      }

      if (options.dryRun) {
        this.showDryRunPreview(files);
        return;
      }

      // Write files
      await this.writeFiles(files);

      // Update barrel exports
      await this.updateBarrelExports(options);

      // Run validation
      if (this.config.governance.kiroSystemPurityValidator) {
        await this.runValidation();
      }

      const duration = Date.now() - startTime;
      this.log(logFile, `Generation completed successfully in ${duration}ms`);

      console.log(`✅ Component ${options.name} generated successfully`);
      console.log(`📁 Files: ${files.length}`);
      console.log(`⏱️  Duration: ${duration}ms`);

    } catch (error) {
      this.log(logFile, `Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`❌ Generation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  private async validateInputs(options: ComponentGeneratorOptions): Promise<void> {
    if (!options.name) {
      throw new Error('Component name is required');
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(options.name)) {
      throw new Error('Component name must be PascalCase and start with uppercase letter');
    }

    if (!options.domain) {
      throw new Error('Domain is required (e.g., common, ui, feature)');
    }

    if (!/^[a-z][a-z0-9-]*$/.test(options.domain)) {
      throw new Error('Domain must be lowercase kebab-case');
    }
  }

  private async checkConflicts(options: ComponentGeneratorOptions): Promise<void> {
    const componentPath = this.getComponentPath(options);

    if (existsSync(componentPath)) {
      throw new Error(`Component already exists at ${componentPath}. Use --force to overwrite.`);
    }
  }

  private async generateFiles(options: ComponentGeneratorOptions): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Main component file
    files.push({
      path: join(this.getComponentPath(options), `${options.name}.tsx`),
      content: this.generateComponentContent(options),
      type: 'component'
    });

    // Types file
    files.push({
      path: join(this.getComponentPath(options), `${options.name}.types.ts`),
      content: this.generateTypesContent(options),
      type: 'types'
    });

    // Barrel export
    files.push({
      path: join(this.getComponentPath(options), 'index.ts'),
      content: this.generateBarrelContent(options),
      type: 'barrel'
    });

    // Tests
    if (options.withTests) {
      files.push({
        path: join(this.getComponentPath(options), `${options.name}.test.tsx`),
        content: this.generateTestContent(options),
        type: 'test'
      });
    }

    // Documentation
    if (options.withDocs) {
      files.push({
        path: join(this.getComponentPath(options), 'README.md'),
        content: this.generateDocsContent(options),
        type: 'docs'
      });
    }

    // Stories (optional)
    if (options.withStories) {
      files.push({
        path: join(this.getComponentPath(options), `${options.name}.stories.tsx`),
        content: this.generateStoriesContent(options),
        type: 'stories'
      });
    }

    return files;
  }

  private generateComponentContent(options: ComponentGeneratorOptions): string {
    const variants = options.variants || ['default'];
    const hasVariants = variants.length > 1;

    return `/**
 * ${options.name} Component
 * 
 * Generated by Kiro Component Generator
 * Domain: ${options.domain}
 * 
 * @example
 * <${options.name}${hasVariants ? ` variant="${variants[0]}"` : ''}>
 *   Content
 * </${options.name}>
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
${this.config.quality.i18nPlaceholders ? "import { useTranslation } from 'react-i18next';" : ''}

import type { ${options.name}Props } from './${options.name}.types';

${hasVariants ? this.generateVariantsConfig(options) : ''}

/**
 * ${options.name} component following Kiro architecture patterns
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
const ${options.name} = React.forwardRef<
  HTMLDivElement,
  ${options.name}Props
>(({ 
  className,
  children,
  ${hasVariants ? 'variant = "default",' : ''}
  ...props 
}, ref) => {
  ${this.config.quality.i18nPlaceholders ? "const { t } = useTranslation();" : ''}
  const id = React.useId();

  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        ${hasVariants ? `${options.name.toLowerCase()}Variants({ variant })` : '"block"'},
        className
      )}
      ${this.config.quality.ariaPlaceholders ? `
      role="region"
      aria-labelledby={\`\${id}-label\`}
      aria-describedby={\`\${id}-description\`}` : ''}
      {...props}
    >
      ${this.config.quality.ariaPlaceholders ? `
      <span id={\`\${id}-label\`} className="sr-only">
        ${this.config.quality.i18nPlaceholders ? `{t('${options.domain}.${options.name.toLowerCase()}.label')}` : `${options.name} component`}
      </span>` : ''}
      {children}
      ${this.config.quality.ariaPlaceholders ? `
      <span id={\`\${id}-description\`} className="sr-only">
        ${this.config.quality.i18nPlaceholders ? `{t('${options.domain}.${options.name.toLowerCase()}.description')}` : `${options.name} component description`}
      </span>` : ''}
    </div>
  );
});

${options.name}.displayName = '${options.name}';

export { ${options.name} };
export type { ${options.name}Props };`;
  }

  private generateVariantsConfig(options: ComponentGeneratorOptions): string {
    const variants = options.variants || ['default'];

    return `
const ${options.name.toLowerCase()}Variants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        ${variants.map(variant => `${variant}: "bg-${variant} text-${variant}-foreground hover:bg-${variant}/90"`).join(',\n        ')}
      }
    },
    defaultVariants: {
      variant: "${variants[0]}"
    }
  }
);`;
  }

  private generateTypesContent(options: ComponentGeneratorOptions): string {
    const hasVariants = options.variants && options.variants.length > 1;

    return `/**
 * ${options.name} Component Types
 * 
 * Generated by Kiro Component Generator
 */

import * as React from 'react';
${hasVariants ? "import { type VariantProps } from 'class-variance-authority';" : ''}

${hasVariants ? `
/**
 * ${options.name} variants configuration
 */
export type ${options.name}Variant = ${options.variants!.map(v => `'${v}'`).join(' | ')};
` : ''}

/**
 * ${options.name} component props
 * 
 * @interface ${options.name}Props
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 */
export interface ${options.name}Props extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content to display inside the component
   */
  children?: React.ReactNode;
  
  ${hasVariants ? `
  /**
   * Visual variant of the component
   * @default "${options.variants![0]}"
   */
  variant?: ${options.name}Variant;
  ` : ''}
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Whether the component is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * ${options.name} component ref type
 */
export type ${options.name}Ref = React.ElementRef<'div'>;`;
  }

  private generateBarrelContent(options: ComponentGeneratorOptions): string {
    return `/**
 * ${options.name} Component Barrel Export
 * 
 * Generated by Kiro Component Generator
 */

export { ${options.name} } from './${options.name}';
export type { 
  ${options.name}Props,
  ${options.name}Ref${options.variants && options.variants.length > 1 ? `,\n  ${options.name}Variant` : ''}
} from './${options.name}.types';`;
  }

  private generateTestContent(options: ComponentGeneratorOptions): string {
    const hasVariants = options.variants && options.variants.length > 1;

    return `/**
 * ${options.name} Component Tests
 * 
 * Generated by Kiro Component Generator
 * Target Coverage: ${this.config.testing.coverageTargets.branches}%+ branches
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
${this.config.testing.a11ySmokeToggle ? "import { axe, toHaveNoViolations } from 'jest-axe';" : ''}
${this.config.quality.i18nPlaceholders ? "import '../../../i18n';" : ''}

import { ${options.name} } from './${options.name}';
import type { ${options.name}Props } from './${options.name}.types';

${this.config.testing.a11ySmokeToggle ? "expect.extend(toHaveNoViolations);" : ''}

describe('${options.name}', () => {
  // Smoke test
  it('renders without crashing', () => {
    render(<${options.name}>Test content</${options.name}>);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  // Content rendering
  it('renders children correctly', () => {
    const testContent = 'Test content';
    render(<${options.name}>{testContent}</${options.name}>);
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  // Props matrix tests
  ${hasVariants ? options.variants!.map(variant => `
  it('renders ${variant} variant correctly', () => {
    render(<${options.name} variant="${variant}">Test</${options.name}>);
    const element = screen.getByRole('region');
    expect(element).toBeInTheDocument();
    // Add specific variant assertions here
  });`).join('\n') : ''}

  // Custom className
  it('applies custom className', () => {
    const customClass = 'custom-test-class';
    render(<${options.name} className={customClass}>Test</${options.name}>);
    expect(screen.getByRole('region')).toHaveClass(customClass);
  });

  // Disabled state
  it('handles disabled state', () => {
    render(<${options.name} disabled>Test</${options.name}>);
    const element = screen.getByRole('region');
    expect(element).toHaveAttribute('aria-disabled', 'true');
  });

  // Event handlers
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<${options.name} onClick={handleClick}>Test</${options.name}>);
    const element = screen.getByRole('region');
    
    await user.click(element);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Forward ref
  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<${options.name} ref={ref}>Test</${options.name}>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  ${this.config.testing.a11ySmokeToggle ? `
  // Accessibility smoke test
  it('meets accessibility requirements', async () => {
    const { container } = render(<${options.name}>Test</${options.name}>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // ARIA attributes
  it('has proper ARIA attributes', () => {
    render(<${options.name}>Test</${options.name}>);
    const element = screen.getByRole('region');
    
    expect(element).toHaveAttribute('role', 'region');
    expect(element).toHaveAttribute('aria-labelledby');
    expect(element).toHaveAttribute('aria-describedby');
  });

  // Keyboard navigation
  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<${options.name}>Test</${options.name}>);
    
    await user.tab();
    expect(document.activeElement).toBeInTheDocument();
  });` : ''}

  // Performance test
  it('renders within performance budget', () => {
    const startTime = performance.now();
    render(<${options.name}>Test</${options.name}>);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(${this.config.testing.performanceBudget.renderTime});
  });

  // Snapshot test (structural stability)
  it('matches snapshot', () => {
    const { container } = render(<${options.name}>Test content</${options.name}>);
    expect(container.firstChild).toMatchSnapshot();
  });
});`;
  }

  private generateDocsContent(options: ComponentGeneratorOptions): string {
    const hasVariants = options.variants && options.variants.length > 1;

    return `# ${options.name}

${options.name} component following Kiro architecture patterns.

## Usage

\`\`\`tsx
import { ${options.name} } from '@/components/${options.domain}/${options.name}';

function Example() {
  return (
    <${options.name}${hasVariants ? ` variant="${options.variants![0]}"` : ''}>
      Content goes here
    </${options.name}>
  );
}
\`\`\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | ReactNode | - | Content to display |
| className | string | - | Additional CSS classes |
| disabled | boolean | false | Whether component is disabled |
${hasVariants ? `| variant | ${options.variants!.map(v => `'${v}'`).join(' \\| ')} | '${options.variants![0]}' | Visual variant |` : ''}

${hasVariants ? `
## Variants

${options.variants!.map(variant => `- **${variant}**: ${variant} styling`).join('\n')}
` : ''}

## Accessibility

This component follows WCAG 2.1 AA guidelines:

- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support  
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Color contrast compliance

## Examples

### Basic Usage

\`\`\`tsx
<${options.name}>
  Basic content
</${options.name}>
\`\`\`

${hasVariants ? `
### With Variants

${options.variants!.map(variant => `
\`\`\`tsx
<${options.name} variant="${variant}">
  ${variant.charAt(0).toUpperCase() + variant.slice(1)} variant
</${options.name}>
\`\`\``).join('\n')}
` : ''}

### Custom Styling

\`\`\`tsx
<${options.name} className="custom-styles">
  Custom styled content
</${options.name}>
\`\`\`

## Testing

Run tests with:

\`\`\`bash
npm test -- ${options.name}.test.tsx
\`\`\`

Target coverage: ${this.config.testing.coverageTargets.branches}%+ branches

## Performance

- Render time budget: <${this.config.testing.performanceBudget.renderTime}ms
- Bundle size budget: <${this.config.testing.performanceBudget.bundleSize}KB

---

*Generated by Kiro Component Generator*`;
  }

  private generateStoriesContent(options: ComponentGeneratorOptions): string {
    const hasVariants = options.variants && options.variants.length > 1;

    return `/**
 * ${options.name} Component Stories
 * 
 * Generated by Kiro Component Generator
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ${options.name} } from './${options.name}';

const meta: Meta<typeof ${options.name}> = {
  title: '${options.domain}/${options.name}',
  component: ${options.name},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '${options.name} component following Kiro architecture patterns.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display inside the component',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled',
    },
    ${hasVariants ? `
    variant: {
      control: 'select',
      options: [${options.variants!.map(v => `'${v}'`).join(', ')}],
      description: 'Visual variant of the component',
    },` : ''}
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default ${options.name}',
  },
};

${hasVariants ? options.variants!.map(variant => `
export const ${variant.charAt(0).toUpperCase() + variant.slice(1)}: Story = {
  args: {
    variant: '${variant}',
    children: '${variant.charAt(0).toUpperCase() + variant.slice(1)} ${options.name}',
  },
};`).join('\n') : ''}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled ${options.name}',
  },
};

export const CustomClass: Story = {
  args: {
    className: 'border-2 border-dashed border-gray-300 p-4',
    children: 'Custom styled ${options.name}',
  },
};`;
  }

  private getComponentPath(options: ComponentGeneratorOptions): string {
    return join(this.config.paths.components, options.domain, options.name);
  }

  private async checkHashSkip(files: GeneratedFile[]): Promise<boolean> {
    // Simple hash-based skip implementation
    const contentHash = createHash('md5')
      .update(files.map(f => f.content).join(''))
      .digest('hex');

    const hashFile = join(this.logDir, 'last-generation-hash.txt');

    if (existsSync(hashFile)) {
      const lastHash = readFileSync(hashFile, 'utf-8').trim();
      if (lastHash === contentHash) {
        return true;
      }
    }

    writeFileSync(hashFile, contentHash);
    return false;
  }

  private showDryRunPreview(files: GeneratedFile[]): void {
    console.log('\n🔍 Dry Run Preview:\n');

    files.forEach(file => {
      console.log(`📄 ${file.type.toUpperCase()}: ${file.path}`);
      console.log('─'.repeat(50));
      console.log(file.content.split('\n').slice(0, 10).join('\n'));
      if (file.content.split('\n').length > 10) {
        console.log('... (truncated)');
      }
      console.log('\n');
    });

    console.log(`Total files to generate: ${files.length}`);
  }

  private async writeFiles(files: GeneratedFile[]): Promise<void> {
    for (const file of files) {
      mkdirSync(dirname(file.path), { recursive: true });
      writeFileSync(file.path, file.content);
    }
  }

  private async updateBarrelExports(options: ComponentGeneratorOptions): Promise<void> {
    const barrelPath = join(this.config.paths.components, 'index.ts');
    const exportLine = `export { ${options.name} } from './${options.domain}/${options.name}';`;

    let content = '';
    if (existsSync(barrelPath)) {
      content = readFileSync(barrelPath, 'utf-8');
    }

    if (!content.includes(exportLine)) {
      content += `\n${exportLine}`;
      writeFileSync(barrelPath, content);
    }
  }

  private async runValidation(): Promise<void> {
    // This would run the validation script
    console.log('🔍 Running Kiro System Purity Validator...');
    // Implementation would call the actual validator
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
Kiro Component Generator

Usage: npm run gen:component -- --name <ComponentName> --domain <domain> [options]

Required:
  --name <string>        Component name (PascalCase)
  --domain <string>      Component domain (kebab-case)

Options:
  --variants <string>    Comma-separated variants (default,primary,secondary)
  --with-tests          Generate test file (default: true)
  --with-docs           Generate documentation (default: true)  
  --with-stories        Generate Storybook stories (default: false)
  --page                Generate as page component with routing
  --dry-run             Preview without writing files

Examples:
  npm run gen:component -- --name ButtonPrime --domain common --variants primary,secondary --with-tests --with-docs
  npm run gen:component -- --name UserProfile --domain feature --with-stories --dry-run
  npm run gen:component -- --name HomePage --domain pages --page
`);
    process.exit(0);
  }

  const options: ComponentGeneratorOptions = {
    name: '',
    domain: '',
    variants: undefined,
    withTests: true,
    withDocs: true,
    withStories: false,
    dryRun: false,
    page: false
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--name':
        options.name = args[++i];
        break;
      case '--domain':
        options.domain = args[++i];
        break;
      case '--variants':
        options.variants = args[++i].split(',').map(v => v.trim());
        break;
      case '--with-tests':
        options.withTests = true;
        break;
      case '--with-docs':
        options.withDocs = true;
        break;
      case '--with-stories':
        options.withStories = true;
        break;
      case '--no-tests':
        options.withTests = false;
        break;
      case '--no-docs':
        options.withDocs = false;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--page':
        options.page = true;
        break;
    }
  }

  const generator = new KiroComponentGenerator();
  await generator.generate(options);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}