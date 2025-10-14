#!/usr/bin/env npx tsx

/**
 * Component Generation CLI Script
 * 
 * Usage:
 * npx tsx scripts/generate-component.ts MyComponent --type=ui --props="title:string,onClick:function"
 */

import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { CodeGenerationOrchestrator } from '../src/lib/code-generation/orchestrator';
import { CodeGenerationConfig, ComponentSpec } from '../src/lib/code-generation/types';

// Default configuration
const defaultConfig: CodeGenerationConfig = {
    outputDir: 'src',
    templates: {
        component: 'ui-component',
        test: 'unit-test',
        story: 'default-story',
        documentation: 'component-docs'
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
Usage: npx tsx scripts/generate-component.ts <ComponentName> [options]

Options:
  --type=<type>           Component type (ui, feature, page, layout) [default: ui]
  --props=<props>         Props definition (name:type,name:type)
  --no-tests             Skip test generation
  --no-stories           Skip Storybook stories
  --no-docs              Skip documentation
  --no-i18n              Skip i18n support
  --no-accessibility     Skip accessibility features

Examples:
  npx tsx scripts/generate-component.ts Button --type=ui --props="variant:string,size:string"
  npx tsx scripts/generate-component.ts UserProfile --type=feature --props="user:User,onUpdate:function"
  npx tsx scripts/generate-component.ts HomePage --type=page --no-stories
`);
        process.exit(1);
    }

    const componentName = args[0];
    const options = parseArgs(args.slice(1));

    // Parse props
    const props: Record<string, string> = {};
    if (options.props) {
        options.props.split(',').forEach(prop => {
            const [name, type] = prop.split(':');
            if (name && type) {
                props[name.trim()] = type.trim();
            }
        });
    }

    // Create component spec
    const spec: ComponentSpec = {
        name: componentName,
        type: options.type || 'ui',
        props,
        styling: 'tailwind',
        storybook: !options['no-stories'],
        tests: !options['no-tests'],
        documentation: !options['no-docs'],
        i18n: !options['no-i18n'],
        accessibility: !options['no-accessibility']
    };

    console.log(`Generating ${spec.type} component: ${componentName}`);
    console.log(`Props:`, props);
    console.log(`Features:`, {
        tests: spec.tests,
        stories: spec.storybook,
        docs: spec.documentation,
        i18n: spec.i18n,
        accessibility: spec.accessibility
    });

    try {
        const orchestrator = new CodeGenerationOrchestrator(defaultConfig);
        const result = await orchestrator.generateComponent(spec);

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

        } else {
            console.error(`\n❌ Generation failed:`);
            result.errors?.forEach(error => console.error(`   ${error}`));
            process.exit(1);
        }

    } catch (error) {
        console.error(`\n💥 Unexpected error:`, error);
        process.exit(1);
    }
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