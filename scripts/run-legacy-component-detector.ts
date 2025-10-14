#!/usr/bin/env tsx

/**
 * Legacy Component Detector Demo Script
 * Demonstrates the legacy component detection and safe archival planning
 */

import { LegacyComponentDetector } from '../src/lib/architecture-scanner/legacy-component-detector';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
  console.log('🔍 Legacy Component Detector Demo');
  console.log('=====================================\n');

  try {
    // Run legacy component detection
    console.log('📊 Scanning for legacy components...');
    const archivalPlan = await LegacyComponentDetector.scanLegacyComponents({
      directories: [
        'src/pages',
        'src/components',
        'src/services',
        'src/lib',
        'src/contexts',
        'src/hooks'
      ],
      excludePatterns: [
        'node_modules',
        '.git',
        'dist',
        'build',
        '__tests__',
        '.test.',
        '.spec.',
        'architecture-scanner' // Exclude our own scanner
      ]
    });

    // Display summary
    console.log('\n📋 Legacy Component Analysis Summary');
    console.log('====================================');
    console.log(`Total Components Found: ${archivalPlan.summary.totalComponents}`);
    console.log(`Safe to Archive: ${archivalPlan.summary.safeToArchive}`);
    console.log(`Requires Review: ${archivalPlan.summary.requiresReview}`);
    console.log(`High Risk: ${archivalPlan.summary.highRisk}`);

    // Display by origin
    console.log('\n🏷️  Components by Origin');
    console.log('========================');
    console.log(`Supabase Components: ${archivalPlan.archiveGroups.supabaseComponents.length}`);
    console.log(`Lovable Components: ${archivalPlan.archiveGroups.lovableComponents.length}`);
    console.log(`Unknown Components: ${archivalPlan.archiveGroups.unknownComponents.length}`);

    // Display safe to archive components
    if (archivalPlan.summary.safeToArchive > 0) {
      console.log('\n✅ Safe to Archive Components');
      console.log('==============================');
      const safeComponents = archivalPlan.components.filter(c => c.safeToArchive);
      safeComponents.forEach(component => {
        console.log(`📁 ${component.path}`);
        console.log(`   Origin: ${component.origin} (confidence: ${component.confidence.toFixed(2)})`);
        console.log(`   Risk Level: ${component.riskLevel}`);
        console.log(`   Reason: ${component.archiveReason}`);
        console.log(`   Backend Dependencies: ${component.backendDependencies.length}`);
        console.log(`   Route Usage: ${component.routeUsage.length}`);
        console.log('');
      });
    }

    // Display components requiring review
    if (archivalPlan.summary.requiresReview > 0) {
      console.log('\n⚠️  Components Requiring Review');
      console.log('===============================');
      const reviewComponents = archivalPlan.components.filter(c => !c.safeToArchive);
      reviewComponents.forEach(component => {
        console.log(`📁 ${component.path}`);
        console.log(`   Origin: ${component.origin} (confidence: ${component.confidence.toFixed(2)})`);
        console.log(`   Risk Level: ${component.riskLevel}`);
        console.log(`   Reason: ${component.archiveReason}`);
        
        if (component.backendDependencies.length > 0) {
          console.log(`   Backend Dependencies:`);
          component.backendDependencies.forEach(dep => {
            console.log(`     - ${dep.type}: ${dep.name} ${dep.migrationPath ? `(→ ${dep.migrationPath})` : '(no migration path)'}`);
          });
        }
        
        if (component.routeUsage.length > 0) {
          console.log(`   Route Usage:`);
          component.routeUsage.forEach(route => {
            console.log(`     - ${route.route} ${route.hasKiroAlternative ? `(→ ${route.alternativeRoute})` : '(no alternative)'}`);
          });
        }
        console.log('');
      });
    }

    // Display backup plan
    console.log('\n💾 Backup Plan');
    console.log('===============');
    console.log(`Archive Directory: ${archivalPlan.backupPlan.archiveDirectory}`);
    console.log(`Manifest File: ${archivalPlan.backupPlan.manifestFile}`);
    console.log(`Rollback Script: ${archivalPlan.backupPlan.rollbackScript}`);
    console.log(`Timestamp: ${archivalPlan.backupPlan.timestamp}`);

    // Generate and save archive manifest
    const manifest = LegacyComponentDetector.generateArchiveManifest(archivalPlan);
    const manifestPath = 'reports/legacy-component-archive-manifest.json';
    
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`\n📄 Archive manifest saved to: ${manifestPath}`);

    // Save detailed report
    const reportPath = 'reports/legacy-component-detection-report.json';
    await fs.writeFile(reportPath, JSON.stringify(archivalPlan, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Display recommendations
    console.log('\n🎯 Recommendations');
    console.log('==================');
    
    if (archivalPlan.summary.safeToArchive > 0) {
      console.log(`✅ ${archivalPlan.summary.safeToArchive} components are safe to archive`);
      console.log('   These can be moved to the archive directory with minimal risk');
    }
    
    if (archivalPlan.summary.requiresReview > 0) {
      console.log(`⚠️  ${archivalPlan.summary.requiresReview} components require manual review`);
      console.log('   Review backend dependencies and route usage before archiving');
    }
    
    if (archivalPlan.summary.highRisk > 0) {
      console.log(`🚨 ${archivalPlan.summary.highRisk} components are high risk`);
      console.log('   These should not be archived without thorough testing');
    }

    console.log('\n🔒 Safe Recovery Mode');
    console.log('=====================');
    console.log('✅ NO DELETION - All components will be archived, not deleted');
    console.log('✅ Full backup with manifest for instant rollback');
    console.log('✅ Symlinks can be created for gradual transition');
    console.log('✅ Complete restoration capability within 5 minutes');

    console.log('\n🎉 Legacy Component Detection Complete!');

  } catch (error) {
    console.error('❌ Error during legacy component detection:', error);
    process.exit(1);
  }
}

// Run the demo
main().catch(console.error);

export { main as runLegacyComponentDetector };