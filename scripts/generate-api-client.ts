#!/usr/bin/env npx tsx

/**
 * API Client Generation CLI Script
 * 
 * Usage:
 * npx tsx scripts/generate-api-client.ts openapi.json
 * npx tsx scripts/generate-api-client.ts https://api.example.com/openapi.json
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { fetch } from 'undici';
import { CodeGenerationOrchestrator } from '../src/lib/code-generation/orchestrator';
import { ApiSchema, CodeGenerationConfig } from '../src/lib/code-generation/types';

// Default configuration
const defaultConfig: CodeGenerationConfig = {
    outputDir: 'src/api',
    templates: {
        component: 'api-client',
        test: 'api-test',
        story: 'api-story',
        documentation: 'api-docs'
    },
    conventions: {
        naming: 'camelCase',
        fileExtension: '.ts',
        testSuffix: '.test'
    },
    features: {
        typescript: true,
        storybook: false,
        testing: true,
        documentation: true,
        i18n: false,
        accessibility: false
    }
};

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Usage: npx tsx scripts/generate-api-client.ts <openapi-spec> [options]

Arguments:
  <openapi-spec>         Path to OpenAPI spec file or URL

Options:
  --output=<dir>         Output directory [default: src/api]
  --no-tests             Skip test generation
  --no-hooks             Skip React hooks generation
  --no-docs              Skip documentation

Examples:
  npx tsx scripts/generate-api-client.ts openapi.json
  npx tsx scripts/generate-api-client.ts https://api.example.com/openapi.json
  npx tsx scripts/generate-api-client.ts spec.yaml --output=src/clients
`);
        process.exit(1);
    }

    const specPath = args[0];
    const options = parseArgs(args.slice(1));

    console.log(`Loading OpenAPI specification: ${specPath}`);

    try {
        // Load OpenAPI specification
        const schema = await loadOpenApiSpec(specPath);

        console.log(`Loaded API: ${schema.info.title} v${schema.info.version}`);
        console.log(`Description: ${schema.info.description || 'No description'}`);
        console.log(`Endpoints: ${Object.keys(schema.paths).length}`);

        // Update config based on options
        const config = { ...defaultConfig };
        if (options.output) {
            config.outputDir = options.output as string;
        }

        const orchestrator = new CodeGenerationOrchestrator(config);
        const result = await orchestrator.generateApiClient(schema);

        if (result.success) {
            // Write generated files
            for (const file of result.files) {
                const fullPath = file.path;
                mkdirSync(dirname(fullPath), { recursive: true });
                writeFileSync(fullPath, file.content);
                console.log(`✅ Generated: ${fullPath}`);
            }

            console.log(`\n🎉 Successfully generated ${result.files.length} files`);
            console.log(`📊 Metrics:`, result.metrics);

            if (result.warnings?.length) {
                console.log(`\n⚠️  Warnings:`);
                result.warnings.forEach(warning => console.log(`   ${warning}`));
            }

            // Show usage instructions
            console.log(`\n📖 Usage:`);
            console.log(`   import { ${formatClientName(schema.info.title)}Client } from '${result.files[0].path.replace('.ts', '')}';`);
            console.log(`   const client = new ${formatClientName(schema.info.title)}Client();`);

        } else {
            console.error(`\n❌ Generation failed:`);
            result.errors?.forEach(error => console.error(`   ${error}`));
            process.exit(1);
        }

    } catch (error) {
        console.error(`\n💥 Error loading OpenAPI spec:`, error);
        process.exit(1);
    }
}

async function loadOpenApiSpec(specPath: string): Promise<ApiSchema> {
    if (specPath.startsWith('http://') || specPath.startsWith('https://')) {
        // Load from URL
        const response = await fetch(specPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
        }
        return await response.json() as ApiSchema;
    } else {
        // Load from file
        const content = readFileSync(specPath, 'utf-8');

        if (specPath.endsWith('.yaml') || specPath.endsWith('.yml')) {
            // Parse YAML (simplified - in real implementation, use a YAML parser)
            throw new Error('YAML parsing not implemented. Please use JSON format.');
        } else {
            return JSON.parse(content) as ApiSchema;
        }
    }
}

function formatClientName(title: string): string {
    return title
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

function parseArgs(args: string[]): Record<string, string | boolean> {
    const options: Record<string, string | boolean> = {};

    for (const arg of args) {
        if (arg.startsWith('--no-')) {
            const key = arg.slice(5);
            options[`no-${key}`] = true;
        } else if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            options[key] = value || true;
        }
    }

    return options;
}

if (require.main === module) {
    main().catch(console.error);
}