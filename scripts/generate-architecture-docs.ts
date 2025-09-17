#!/usr/bin/env tsx

/**
 * Architecture Documentation Generator CLI
 * 
 * Usage:
 *   npx tsx scripts/generate-architecture-docs.ts
 *   npx tsx scripts/generate-architecture-docs.ts --output reports --format markdown
 *   npx tsx scripts/generate-architecture-docs.ts --full --variants
 */

import { ArchitectureScanner } from '../src/lib/architecture-scanner/architecture-scanner';
import { generateDependencyGraph } from '../src/lib/architecture-scanner/dependency-graph';
import { ComponentClassificationSystem } from '../src/lib/architecture-scanner/component-map';
import { generateArchitectureDocumentation } from '../src/lib/architecture-scanner/documentation-generator';

interface CliOptions {
  output?: string;
  format?: 'markdown' | 'html' | 'both';
  full?: boolean;
  variants?: boolean;
  help?: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i] as 'markdown' | 'html' | 'both';
        break;
      case '--full':
        options.full = true;
        break;
      case '--variants':
        options.variants = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
📚 Architecture Documentation Generator

Usage:
  npx tsx scripts/generate-architecture-docs.ts [options]

Options:
  -o, --output <dir>     Output directory (default: reports)
  -f, --format <format>  Output format: markdown, html, both (default: markdown)
  --full                 Generate full analysis with component classification
  --variants             Generate multiple diagram variants
  -h, --help             Show this help message

Examples:
  # Generate basic documentation
  npx tsx scripts/generate-architecture-docs.ts

  # Generate full documentation with all features
  npx tsx scripts/generate-architecture-docs.ts --full --variants -o docs

  # Generate both markdown and HTML formats
  npx tsx scripts/generate-architecture-docs.ts --format both
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  console.log('📚 Starting architecture documentation generation...');
  console.log('🔍 Analyzing system architecture...');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = options.output || 'reports';

    // Generate enhanced architecture report
    console.log('📊 Generating architecture analysis...');
    const architectureMap = await ArchitectureScanner.generateEnhancedReport({
      includeTests: true,
      includeNodeModules: false
    });

    let dependencyGraph;
    let componentMap;

    if (options.full) {
      console.log('🕸️ Generating dependency graph...');
      dependencyGraph = await generateDependencyGraph();

      console.log('🧩 Generating component classification...');
      const classifier = new ComponentClassificationSystem();
      
      // Convert architecture components to format expected by classifier
      const components = Object.entries(architectureMap.components).map(([path, component]) => ({
        path,
        content: '', // Would need to be loaded if needed for full analysis
        ...component
      }));
      
      componentMap = await classifier.generateComponentMap(components);
    }

    // Generate documentation
    console.log('📝 Generating documentation...');
    await generateArchitectureDocumentation(
      architectureMap,
      dependencyGraph,
      componentMap,
      {
        outputDir,
        format: options.format || 'markdown',
        includeVisuals: true,
        includeDetailedAnalysis: options.full || false,
        generateVariants: options.variants || false
      }
    );

    // Display summary
    console.log('\n✅ Documentation generation complete!');
    console.log(`📁 Output directory: ${outputDir}/`);
    
    console.log('\n📊 Generated Files:');
    console.log(`   📄 architecture-overview.md - Main documentation`);
    console.log(`   📊 architecture-report.json - Raw analysis data`);
    
    if (dependencyGraph) {
      console.log(`   🕸️ dependency-graph.json - Dependency analysis`);
      
      if (options.variants) {
        console.log(`   📈 architecture-graph-full.mmd - Complete diagram`);
        console.log(`   📈 architecture-graph-critical.mmd - Critical components`);
        console.log(`   📈 architecture-graph-legacy.mmd - Legacy components`);
      } else {
        console.log(`   📈 architecture-graph.mmd - Mermaid diagram`);
      }
    }
    
    if (componentMap) {
      console.log(`   🧩 component-map.json - Component classification`);
      console.log(`   📋 component-details.md - Detailed component analysis`);
      console.log(`   ⚠️ risk-analysis.md - Risk assessment report`);
    }

    // Display key metrics
    console.log('\n📈 Key Metrics:');
    console.log(`   Total Components: ${architectureMap.totalComponents}`);
    console.log(`   Kiro Components: ${architectureMap.componentsByOrigin.kiro}`);
    console.log(`   Legacy Components: ${architectureMap.componentsByOrigin.supabase + architectureMap.componentsByOrigin.lovable}`);
    console.log(`   Cleanup Candidates: ${architectureMap.cleanupPriority.length}`);
    console.log(`   Test Coverage: ${architectureMap.testCoverage.coveragePercentage}%`);

    if (dependencyGraph) {
      console.log(`   Dependency Nodes: ${dependencyGraph.metadata.totalNodes}`);
      console.log(`   Dependency Edges: ${dependencyGraph.metadata.totalEdges}`);
      console.log(`   Circular Dependencies: ${dependencyGraph.metadata.circularDependencies.length}`);
    }

    // Show next steps
    console.log('\n🎯 Next Steps:');
    console.log('   1. Review architecture-overview.md for executive summary');
    console.log('   2. Examine Mermaid diagrams for visual architecture understanding');
    console.log('   3. Check risk-analysis.md for cleanup priorities');
    console.log('   4. Use component-map.json for detailed component information');

    if (options.variants) {
      console.log('\n📈 Diagram Variants Generated:');
      console.log('   • Full: Complete architecture overview (up to 100 nodes)');
      console.log('   • Critical: High-risk components and critical paths (up to 30 nodes)');
      console.log('   • Legacy: Legacy components requiring attention (up to 50 nodes)');
    }

  } catch (error) {
    console.error('❌ Documentation generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}