#!/usr/bin/env tsx

/**
 * Generate Dependency Graph CLI Script
 * 
 * Usage:
 *   npx tsx scripts/generate-dependency-graph.ts
 *   npx tsx scripts/generate-dependency-graph.ts --output custom-graph.json
 *   npx tsx scripts/generate-dependency-graph.ts --viz --output viz-graph.json
 */

import { generateDependencyGraph, generateVisualizationGraph } from '../src/lib/architecture-scanner/dependency-graph';
import { exportComponentMapWithMetadata } from '../src/lib/architecture-scanner/component-map';
import path from 'path';

interface CliOptions {
  output?: string;
  viz?: boolean;
  componentMap?: boolean;
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
      case '--viz':
      case '-v':
        options.viz = true;
        break;
      case '--component-map':
      case '-c':
        options.componentMap = true;
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
🔍 Dependency Graph Generator

Usage:
  npx tsx scripts/generate-dependency-graph.ts [options]

Options:
  -o, --output <file>     Output file path (default: dependency-graph.json)
  -v, --viz              Generate visualization-ready format
  -c, --component-map    Also generate component map
  -h, --help             Show this help message

Examples:
  # Generate standard dependency graph
  npx tsx scripts/generate-dependency-graph.ts

  # Generate with custom output file
  npx tsx scripts/generate-dependency-graph.ts -o my-graph.json

  # Generate visualization format
  npx tsx scripts/generate-dependency-graph.ts --viz -o viz-graph.json

  # Generate both dependency graph and component map
  npx tsx scripts/generate-dependency-graph.ts --component-map
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  console.log('🚀 Starting dependency analysis...');
  console.log('📁 Analyzing src/ directory...');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (options.viz) {
      // Generate visualization format
      const outputFile = options.output || `dependency-graph-viz-${timestamp}.json`;
      await generateVisualizationGraph(outputFile);
      
    } else {
      // Generate standard dependency graph
      const outputFile = options.output || `dependency-graph-${timestamp}.json`;
      const graph = await generateDependencyGraph(outputFile);
      
      // Print summary
      console.log('\n📊 Dependency Graph Summary:');
      console.log(`   Nodes: ${graph.nodes.length}`);
      console.log(`   Edges: ${graph.edges.length}`);
      console.log(`   Circular Dependencies: ${graph.metadata.circularDependencies.length}`);
      console.log(`   Orphaned Nodes: ${graph.metadata.orphanedNodes.length}`);
      console.log(`   Critical Paths: ${graph.metadata.criticalPaths.length}`);
      
      // Show risk distribution
      const riskCounts = graph.nodes.reduce((acc, node) => {
        acc[node.risk] = (acc[node.risk] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('\n🎯 Risk Distribution:');
      Object.entries(riskCounts).forEach(([risk, count]) => {
        const emoji = risk === 'critical' ? '🔴' : risk === 'high' ? '🟠' : risk === 'medium' ? '🟡' : '🟢';
        console.log(`   ${emoji} ${risk}: ${count}`);
      });
      
      // Show circular dependencies if any
      if (graph.metadata.circularDependencies.length > 0) {
        console.log('\n⚠️  Circular Dependencies Found:');
        graph.metadata.circularDependencies.slice(0, 5).forEach((cycle, i) => {
          console.log(`   ${i + 1}. ${cycle.join(' → ')}`);
        });
        if (graph.metadata.circularDependencies.length > 5) {
          console.log(`   ... and ${graph.metadata.circularDependencies.length - 5} more`);
        }
      }
    }

    // Generate component map if requested
    if (options.componentMap) {
      const componentMapFile = `component-map-${timestamp}.json`;
      await exportComponentMapWithMetadata(componentMapFile);
    }

    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error generating dependency graph:', error);
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