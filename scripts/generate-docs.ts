#!/usr/bin/env npx tsx

/**
 * Documentation Generation CLI Script
 * 
 * Usage:
 * npx tsx scripts/generate-docs.ts
 * npx tsx scripts/generate-docs.ts --components-only
 * npx tsx scripts/generate-docs.ts --api-only
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import { CodeGenerationOrchestrator } from '../src/lib/code-generation/orchestrator';
import { CodeAnalysis, CodeGenerationConfig } from '../src/lib/code-generation/types';

// Default configuration
const defaultConfig: CodeGenerationConfig = {
    outputDir: 'docs',
    templates: {
        component: 'component',
        test: 'test',
        story: 'story',
        documentation: 'comprehensive-docs'
    },
    conventions: {
        naming: 'kebab-case',
        fileExtension: '.md',
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
    const options = parseArgs(args);

    console.log('🔍 Analyzing codebase for documentation generation...');

    try {
        // Analyze the codebase
        const analysis = await analyzeCodebase();

        console.log(`📊 Analysis complete:`);
        console.log(`   Components: ${analysis.files.length}`);
        console.log(`   Dependencies: ${Object.keys(analysis.dependencies).length}`);
        console.log(`   Patterns: ${analysis.patterns.length}`);
        console.log(`   Total Lines: ${analysis.metrics.totalLines}`);

        const orchestrator = new CodeGenerationOrchestrator(defaultConfig);

        if (options['components-only']) {
            await generateComponentDocs(orchestrator, analysis);
        } else if (options['api-only']) {
            await generateApiDocs(orchestrator, analysis);
        } else {
            // Generate all documentation
            const result = await orchestrator.generateDocumentation(analysis);

            if (result.success) {
                // Write generated documentation files
                for (const file of result.files) {
                    const fullPath = file.path;
                    mkdirSync(dirname(fullPath), { recursive: true });
                    writeFileSync(fullPath, file.content);
                    console.log(`✅ Generated: ${fullPath}`);
                }

                console.log(`\n🎉 Successfully generated ${result.files.length} documentation files`);
                console.log(`📊 Metrics:`, result.metrics);

                if (result.warnings?.length) {
                    console.log(`\n⚠️  Warnings:`);
                    result.warnings.forEach(warning => console.log(`   ${warning}`));
                }

                // Generate documentation index
                await generateDocumentationIndex(result.files);

            } else {
                console.error(`\n❌ Documentation generation failed:`);
                result.errors?.forEach(error => console.error(`   ${error}`));
                process.exit(1);
            }
        }

    } catch (error) {
        console.error(`\n💥 Unexpected error:`, error);
        process.exit(1);
    }
}

async function analyzeCodebase(): Promise<CodeAnalysis> {
    const srcPath = 'src';
    const files = await findAllFiles(srcPath);

    const componentFiles = files.filter(file =>
        (file.endsWith('.tsx') || file.endsWith('.ts')) &&
        !file.includes('.test.') &&
        !file.includes('.stories.') &&
        !file.includes('.d.ts')
    );

    const analysisFiles = [];
    const dependencies: Record<string, string[]> = {};
    let totalLines = 0;
    let totalComplexity = 0;

    for (const file of componentFiles) {
        try {
            const content = readFileSync(file, 'utf-8');
            const lines = content.split('\n').length;
            totalLines += lines;

            const componentName = basename(file, extname(file));
            const fileDeps = extractDependencies(content);
            dependencies[file] = fileDeps;

            const complexity = calculateComplexity(content);
            totalComplexity += complexity;

            analysisFiles.push({
                name: componentName,
                path: file,
                type: determineFileType(file),
                props: extractProps(content),
                dependencies: fileDeps,
                exports: extractExports(content),
                complexity
            });

        } catch (error) {
            console.warn(`Warning: Could not analyze ${file}:`, error);
        }
    }

    // Detect patterns
    const patterns = detectPatterns(analysisFiles);

    return {
        files: analysisFiles,
        dependencies,
        patterns,
        metrics: {
            totalFiles: analysisFiles.length,
            totalLines,
            complexity: totalComplexity,
            testCoverage: 85 // This would be calculated from actual test coverage
        }
    };
}

async function findAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
        const entries = readdirSync(dir);

        for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                // Skip certain directories
                if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry)) {
                    const subFiles = await findAllFiles(fullPath);
                    files.push(...subFiles);
                }
            } else if (stat.isFile()) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.warn(`Warning: Could not read directory ${dir}:`, error);
    }

    return files;
}

function determineFileType(filePath: string): string {
    if (filePath.includes('/components/ui/')) return 'ui';
    if (filePath.includes('/components/')) return 'component';
    if (filePath.includes('/pages/')) return 'page';
    if (filePath.includes('/hooks/')) return 'hook';
    if (filePath.includes('/services/')) return 'service';
    if (filePath.includes('/utils/')) return 'utility';
    if (filePath.includes('/lib/')) return 'library';
    return 'module';
}

function extractProps(content: string): Array<{ name: string, type: string, required: boolean, description?: string }> {
    const props: Array<{ name: string, type: string, required: boolean, description?: string }> = [];

    // Extract interface definitions
    const interfaceRegex = /interface\s+(\w+Props)\s*{([^}]+)}/g;
    let match;

    while ((match = interfaceRegex.exec(content)) !== null) {
        const propsContent = match[2];
        const propRegex = /(\w+)(\?)?:\s*([^;]+);/g;
        let propMatch;

        while ((propMatch = propRegex.exec(propsContent)) !== null) {
            props.push({
                name: propMatch[1],
                type: propMatch[3].trim(),
                required: !propMatch[2],
                description: extractPropDescription(content, propMatch[1])
            });
        }
    }

    return props;
}

function extractPropDescription(content: string, propName: string): string {
    // Look for JSDoc comments above the prop
    const propRegex = new RegExp(`\\*\\s*@param\\s+${propName}\\s+(.+)`, 'i');
    const match = content.match(propRegex);
    return match ? match[1].trim() : `${propName} prop`;
}

function extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        dependencies.push(match[1]);
    }

    return dependencies;
}

function extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function\s+|const\s+|class\s+|interface\s+|type\s+)?(\w+)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
    }

    return exports;
}

function calculateComplexity(content: string): number {
    let complexity = 1;

    const patterns = [
        /if\s*\(/g,
        /else\s+if\s*\(/g,
        /while\s*\(/g,
        /for\s*\(/g,
        /switch\s*\(/g,
        /case\s+/g,
        /catch\s*\(/g,
        /\?\s*:/g,
        /&&/g,
        /\|\|/g
    ];

    for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
            complexity += matches.length;
        }
    }

    return complexity;
}

function detectPatterns(files: any[]): string[] {
    const patterns: string[] = [];

    // Detect common patterns
    const hasReactComponents = files.some(f => f.dependencies.includes('react'));
    if (hasReactComponents) patterns.push('React Components');

    const hasHooks = files.some(f => f.name.startsWith('use'));
    if (hasHooks) patterns.push('Custom Hooks');

    const hasContextProviders = files.some(f => f.name.includes('Provider'));
    if (hasContextProviders) patterns.push('Context Providers');

    const hasServices = files.some(f => f.type === 'service');
    if (hasServices) patterns.push('Service Layer');

    const hasUtilities = files.some(f => f.type === 'utility');
    if (hasUtilities) patterns.push('Utility Functions');

    return patterns;
}

async function generateComponentDocs(orchestrator: any, analysis: CodeAnalysis) {
    console.log('📝 Generating component documentation only...');

    const componentFiles = analysis.files.filter(f =>
        f.type === 'component' || f.type === 'ui'
    );

    for (const component of componentFiles) {
        // Generate individual component documentation
        console.log(`Documenting: ${component.name}`);
        // Implementation would go here
    }
}

async function generateApiDocs(orchestrator: any, analysis: CodeAnalysis) {
    console.log('🔌 Generating API documentation only...');

    const serviceFiles = analysis.files.filter(f => f.type === 'service');

    for (const service of serviceFiles) {
        // Generate API documentation
        console.log(`Documenting API: ${service.name}`);
        // Implementation would go here
    }
}

async function generateDocumentationIndex(files: any[]) {
    const indexContent = `# Documentation Index

This documentation was automatically generated from the codebase.

## Components

${files
            .filter(f => f.path.includes('/components/'))
            .map(f => `- [${basename(f.path, '.md')}](${f.path})`)
            .join('\n')}

## API Reference

${files
            .filter(f => f.path.includes('/api/'))
            .map(f => `- [${basename(f.path, '.md')}](${f.path})`)
            .join('\n')}

## Architecture

${files
            .filter(f => f.path.includes('/architecture/'))
            .map(f => `- [${basename(f.path, '.md')}](${f.path})`)
            .join('\n')}

## Development

- [Development Guide](./development.md)
- [Contributing Guidelines](./contributing.md)
- [Deployment Guide](./deployment.md)

---

*Generated on ${new Date().toISOString()}*
`;

    mkdirSync('docs', { recursive: true });
    writeFileSync('docs/README.md', indexContent);
    console.log('✅ Generated: docs/README.md');
}

function parseArgs(args: string[]): Record<string, boolean> {
    const options: Record<string, boolean> = {};

    for (const arg of args) {
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            options[key] = true;
        }
    }

    return options;
}

if (require.main === module) {
    main().catch(console.error);
}