#!/usr/bin/env npx tsx

/**
 * Test Generation CLI Script
 * 
 * Usage:
 * npx tsx scripts/generate-tests.ts src/components/ui/Button.tsx
 * npx tsx scripts/generate-tests.ts src/components --recursive
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { CodeGenerationOrchestrator } from '../src/lib/code-generation/orchestrator';
import { CodeGenerationConfig, ComponentAnalysis } from '../src/lib/code-generation/types';

// Default configuration
const defaultConfig: CodeGenerationConfig = {
    outputDir: 'src',
    templates: {
        component: 'component',
        test: 'comprehensive-test',
        story: 'story',
        documentation: 'docs'
    },
    conventions: {
        naming: 'PascalCase',
        fileExtension: '.tsx',
        testSuffix: '.test'
    },
    features: {
        typescript: true,
        storybook: true,
        testing: true,
        documentation: true,
        i18n: true,
        accessibility: true
    }
};

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Usage: npx tsx scripts/generate-tests.ts <path> [options]

Arguments:
  <path>                 Path to component file or directory

Options:
  --recursive            Process directories recursively
  --type=<type>          Test type (unit, integration, e2e) [default: unit]
  --coverage             Include coverage requirements
  --accessibility        Include accessibility tests
  --performance          Include performance tests

Examples:
  npx tsx scripts/generate-tests.ts src/components/ui/Button.tsx
  npx tsx scripts/generate-tests.ts src/components --recursive
  npx tsx scripts/generate-tests.ts src/pages/HomePage.tsx --type=integration
`);
        process.exit(1);
    }

    const targetPath = args[0];
    const options = parseArgs(args.slice(1));

    console.log(`Analyzing components for test generation: ${targetPath}`);

    try {
        const componentFiles = await findComponentFiles(targetPath, options.recursive as boolean);

        if (componentFiles.length === 0) {
            console.log('No component files found.');
            process.exit(0);
        }

        console.log(`Found ${componentFiles.length} component(s) to analyze`);

        const orchestrator = new CodeGenerationOrchestrator(defaultConfig);
        let totalGenerated = 0;

        for (const filePath of componentFiles) {
            console.log(`\nAnalyzing: ${filePath}`);

            const analysis = await analyzeComponent(filePath);
            const result = await orchestrator.generateTests(analysis);

            if (result.success) {
                // Write generated test files
                for (const file of result.files) {
                    const fullPath = file.path;
                    mkdirSync(dirname(fullPath), { recursive: true });
                    writeFileSync(fullPath, file.content);
                    console.log(`✅ Generated: ${fullPath}`);
                    totalGenerated++;
                }

                if (result.warnings?.length) {
                    console.log(`⚠️  Warnings:`);
                    result.warnings.forEach(warning => console.log(`   ${warning}`));
                }

            } else {
                console.error(`❌ Test generation failed for ${filePath}:`);
                result.errors?.forEach(error => console.error(`   ${error}`));
            }
        }

        console.log(`\n🎉 Successfully generated ${totalGenerated} test files`);

    } catch (error) {
        console.error(`\n💥 Unexpected error:`, error);
        process.exit(1);
    }
}

async function findComponentFiles(path: string, recursive: boolean): Promise<string[]> {
    const files: string[] = [];

    try {
        const stat = statSync(path);

        if (stat.isFile()) {
            if (isComponentFile(path)) {
                files.push(path);
            }
        } else if (stat.isDirectory()) {
            const entries = readdirSync(path);

            for (const entry of entries) {
                const fullPath = join(path, entry);
                const entryStat = statSync(fullPath);

                if (entryStat.isFile() && isComponentFile(fullPath)) {
                    files.push(fullPath);
                } else if (entryStat.isDirectory() && recursive) {
                    const subFiles = await findComponentFiles(fullPath, recursive);
                    files.push(...subFiles);
                }
            }
        }
    } catch (error) {
        console.error(`Error reading path ${path}:`, error);
    }

    return files;
}

function isComponentFile(filePath: string): boolean {
    const ext = extname(filePath);
    const name = basename(filePath, ext);

    // Check if it's a React component file
    if (!['.tsx', '.jsx'].includes(ext)) {
        return false;
    }

    // Skip test files, story files, and other non-component files
    if (name.includes('.test') || name.includes('.spec') || name.includes('.stories')) {
        return false;
    }

    // Component files typically start with uppercase
    return /^[A-Z]/.test(name);
}

async function analyzeComponent(filePath: string): Promise<ComponentAnalysis> {
    const content = readFileSync(filePath, 'utf-8');
    const componentName = basename(filePath, extname(filePath));

    // Simple analysis - in a real implementation, this would use AST parsing
    const analysis: ComponentAnalysis = {
        name: componentName,
        path: filePath,
        type: determineComponentType(filePath),
        props: extractProps(content),
        dependencies: extractDependencies(content),
        exports: extractExports(content),
        complexity: calculateComplexity(content)
    };

    return analysis;
}

function determineComponentType(filePath: string): string {
    if (filePath.includes('/ui/')) return 'ui';
    if (filePath.includes('/pages/')) return 'page';
    if (filePath.includes('/layout/')) return 'layout';
    return 'feature';
}

function extractProps(content: string): Array<{ name: string, type: string, required: boolean, description?: string }> {
    const props: Array<{ name: string, type: string, required: boolean, description?: string }> = [];

    // Simple regex to find interface definitions
    const interfaceMatch = content.match(/interface\s+\w+Props\s*{([^}]+)}/);
    if (interfaceMatch) {
        const propsContent = interfaceMatch[1];
        const propMatches = propsContent.match(/(\w+)(\?)?:\s*([^;]+);/g);

        if (propMatches) {
            for (const match of propMatches) {
                const propMatch = match.match(/(\w+)(\?)?:\s*([^;]+);/);
                if (propMatch) {
                    props.push({
                        name: propMatch[1],
                        type: propMatch[3].trim(),
                        required: !propMatch[2],
                        description: `${propMatch[1]} prop`
                    });
                }
            }
        }
    }

    return props;
}

function extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);

    if (importMatches) {
        for (const match of importMatches) {
            const depMatch = match.match(/from\s+['"]([^'"]+)['"]/);
            if (depMatch) {
                dependencies.push(depMatch[1]);
            }
        }
    }

    return dependencies;
}

function extractExports(content: string): string[] {
    const exports: string[] = [];

    // Find export statements
    const exportMatches = content.match(/export\s+(?:default\s+)?(?:function\s+|const\s+|class\s+)?(\w+)/g);
    if (exportMatches) {
        for (const match of exportMatches) {
            const exportMatch = match.match(/export\s+(?:default\s+)?(?:function\s+|const\s+|class\s+)?(\w+)/);
            if (exportMatch) {
                exports.push(exportMatch[1]);
            }
        }
    }

    return exports;
}

function calculateComplexity(content: string): number {
    // Simple complexity calculation based on cyclomatic complexity
    let complexity = 1; // Base complexity

    // Count decision points
    const decisionPoints = [
        /if\s*\(/g,
        /else\s+if\s*\(/g,
        /while\s*\(/g,
        /for\s*\(/g,
        /switch\s*\(/g,
        /case\s+/g,
        /catch\s*\(/g,
        /\?\s*:/g, // Ternary operator
        /&&/g,
        /\|\|/g
    ];

    for (const pattern of decisionPoints) {
        const matches = content.match(pattern);
        if (matches) {
            complexity += matches.length;
        }
    }

    return complexity;
}

function parseArgs(args: string[]): Record<string, string | boolean> {
    const options: Record<string, string | boolean> = {};

    for (const arg of args) {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            options[key] = value || true;
        }
    }

    return options;
}

if (require.main === module) {
    main().catch(console.error);
}