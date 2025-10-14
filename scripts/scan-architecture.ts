#!/usr/bin/env tsx
/**
 * Architecture Scanner CLI
 * Command-line interface for running architecture scans
 */

import { scanSystemArchitecture } from '../src/lib/architecture-scanner';
import { ArchitectureScanner } from '../src/lib/architecture-scanner/architecture-scanner';

async function main() {
  const args = process.argv.slice(2);
  const outputFile = args.includes('--output') 
    ? args[args.indexOf('--output') + 1] 
    : 'architecture-map.json';
  
  const includeRoadmap = args.includes('--roadmap');
  const verbose = args.includes('--verbose');

  if (verbose) {
    console.log('🔧 Architecture Scanner CLI');
    console.log('📊 Analyzing system architecture...');
  }

  try {
    // Use enhanced reporting if available
    const useEnhanced = args.includes('--enhanced');
    
    let architectureMap;
    
    if (useEnhanced) {
      console.log('🚀 Running enhanced architecture scan...');
      architectureMap = await ArchitectureScanner.generateEnhancedReport({
        includeTests: true,
        includeNodeModules: false
      });
      
      // Export enhanced report
      await ArchitectureScanner.exportArchitectureMap(architectureMap, outputFile);
    } else {
      architectureMap = await scanSystemArchitecture({
        outputFile,
        includeRoadmap
      });
    }

    console.log('\n✅ Architecture scan completed successfully!');
    console.log(`📁 Results saved to: ${outputFile}`);
    
    // Display summary
    console.log('\n📊 Summary:');
    console.log(`Total Components: ${architectureMap.totalComponents}`);
    console.log(`Kiro Components: ${architectureMap.componentsByOrigin.kiro}`);
    console.log(`Supabase Components: ${architectureMap.componentsByOrigin.supabase}`);
    console.log(`Lovable Components: ${architectureMap.componentsByOrigin.lovable}`);
    console.log(`Unknown Components: ${architectureMap.componentsByOrigin.unknown}`);
    console.log(`Test Coverage: ${architectureMap.testCoverage.coveragePercentage}%`);
    console.log(`Cleanup Items: ${architectureMap.cleanupPriority.length}`);

    // Enhanced reporting features
    if (useEnhanced && architectureMap.riskAnalysis) {
      console.log('\n🎯 Enhanced Analysis:');
      
      // Risk distribution
      if (architectureMap.riskAnalysis.distribution) {
        console.log('Risk Distribution:');
        Object.entries(architectureMap.riskAnalysis.distribution).forEach(([risk, count]) => {
          const emoji = risk === 'critical' ? '🔴' : risk === 'high' ? '🟠' : risk === 'medium' ? '🟡' : '🟢';
          console.log(`   ${emoji} ${risk}: ${count}`);
        });
      }
      
      // Archive candidates
      if (architectureMap.riskAnalysis.archiveCandidates?.length > 0) {
        console.log(`\n📦 Archive Candidates: ${architectureMap.riskAnalysis.archiveCandidates.length}`);
        if (verbose) {
          architectureMap.riskAnalysis.archiveCandidates.slice(0, 5).forEach((candidate, index) => {
            console.log(`${index + 1}. ${candidate.name} (${candidate.reason})`);
          });
        }
      }
      
      // Dependency graph info
      if (architectureMap.dependencyGraph?.metadata) {
        const { metadata } = architectureMap.dependencyGraph;
        console.log('\n🕸️ Dependency Graph:');
        console.log(`   Nodes: ${metadata.totalNodes || 0}`);
        console.log(`   Edges: ${metadata.totalEdges || 0}`);
        console.log(`   Circular Dependencies: ${metadata.circularDependencies?.length || 0}`);
        console.log(`   Orphaned Nodes: ${metadata.orphanedNodes?.length || 0}`);
      }
    }

    if (verbose) {
      console.log('\n🔍 Top 5 Cleanup Priorities:');
      architectureMap.cleanupPriority.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.component} (Priority: ${item.priority})`);
        console.log(`   Reason: ${item.reason}`);
        console.log(`   Effort: ${item.estimatedEffort}`);
      });
    }

  } catch (error) {
    console.error('❌ Architecture scan failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}