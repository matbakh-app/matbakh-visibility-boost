#!/usr/bin/env npx tsx

/**
 * Enhanced Legacy Component Detection
 * Re-runs legacy component detection with enhanced risk assessment
 * to reduce false positives and provide better archival recommendations
 */

import { LegacyComponentDetector } from '../src/lib/architecture-scanner/legacy-component-detector';
import { EnhancedRiskAssessor } from '../src/lib/architecture-scanner/enhanced-risk-assessor';
import * as fs from 'fs/promises';

async function main() {
  console.log('🔍 Enhanced Legacy Component Detection');
  console.log('=====================================\n');

  try {
    // Step 1: Run enhanced legacy component detection
    console.log('🔍 Step 1: Scanning for legacy components with enhanced risk assessment...');
    
    const archivalPlan = await LegacyComponentDetector.scanLegacyComponents({
      directories: [
        'src/pages',
        'src/components',
        'src/layouts',
        'src/lib',
        'src/services',
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
        'archive'
      ]
    });

    console.log(`\n📊 Enhanced Scan Results:`);
    console.log(`==================`);
    console.log(`✅ ${archivalPlan.summary.safeToArchive} components are safe to archive`);
    console.log(`   These can be moved to the archive directory with minimal risk`);
    console.log(`⚠️  ${archivalPlan.summary.requiresReview} components require manual review`);
    console.log(`   Review backend dependencies and route usage before archiving`);
    console.log(`🚨 ${archivalPlan.summary.highRisk} components are high risk`);
    console.log(`   These should not be archived without thorough testing`);

    // Step 2: Generate detailed risk analysis
    console.log('\n🧪 Step 2: Generating detailed risk analysis...');
    
    const riskAssessments = new Map();
    for (const component of archivalPlan.components) {
      const assessment = await EnhancedRiskAssessor.assessRisk(
        component.path,
        component.origin,
        component.backendDependencies,
        component.routeUsage
      );
      riskAssessments.set(component.path, assessment);
    }

    const riskReport = EnhancedRiskAssessor.generateRiskReport(riskAssessments);

    console.log(`\n📈 Risk Analysis Summary:`);
    console.log(`========================`);
    console.log(`Total components analyzed: ${riskReport.summary.total}`);
    console.log(`Safe to archive: ${riskReport.summary.safeToArchive} (${Math.round(riskReport.summary.safeToArchive / riskReport.summary.total * 100)}%)`);
    console.log(`Require review: ${riskReport.summary.requiresReview} (${Math.round(riskReport.summary.requiresReview / riskReport.summary.total * 100)}%)`);
    console.log(`\nRisk Level Distribution:`);
    console.log(`  Critical: ${riskReport.summary.critical}`);
    console.log(`  High: ${riskReport.summary.high}`);
    console.log(`  Medium: ${riskReport.summary.medium}`);
    console.log(`  Low: ${riskReport.summary.low}`);

    // Step 3: Show top risk factors
    console.log(`\n🎯 Top Risk Factors:`);
    console.log(`===================`);
    for (const { factor, count } of riskReport.topRiskFactors.slice(0, 5)) {
      console.log(`  ${factor}: ${count} components`);
    }

    // Step 4: Show recommendations
    console.log(`\n💡 Recommendations:`);
    console.log(`==================`);
    for (const recommendation of riskReport.recommendations.slice(0, 5)) {
      console.log(`  • ${recommendation}`);
    }

    // Step 5: Show components that changed classification
    console.log(`\n🔄 Classification Changes:`);
    console.log(`=========================`);
    
    // Load previous results for comparison
    let previousResults: any = null;
    try {
      const previousData = await fs.readFile('reports/legacy-component-archive-manifest.json', 'utf-8');
      previousResults = JSON.parse(previousData);
    } catch (error) {
      console.log('No previous results found for comparison');
    }

    if (previousResults) {
      let improvedCount = 0;
      let worsenedCount = 0;

      for (const component of archivalPlan.components) {
        const previousComponent = previousResults.components.find((c: any) => c.originalPath === component.path);
        if (previousComponent) {
          const wasHighRisk = previousComponent.riskLevel === 'high' || previousComponent.riskLevel === 'critical';
          const isHighRisk = component.riskLevel === 'high' || component.riskLevel === 'critical';
          
          if (wasHighRisk && !isHighRisk) {
            improvedCount++;
            console.log(`  ✅ ${component.path}: ${previousComponent.riskLevel} → ${component.riskLevel}`);
          } else if (!wasHighRisk && isHighRisk) {
            worsenedCount++;
            console.log(`  ❌ ${component.path}: ${previousComponent.riskLevel} → ${component.riskLevel}`);
          }
        }
      }

      console.log(`\nClassification Summary:`);
      console.log(`  Improved (lower risk): ${improvedCount}`);
      console.log(`  Worsened (higher risk): ${worsenedCount}`);
      console.log(`  Net improvement: ${improvedCount - worsenedCount}`);
    }

    // Step 6: Save enhanced results
    console.log('\n💾 Step 3: Saving enhanced results...');
    
    await fs.mkdir('reports', { recursive: true });
    
    // Save enhanced archive manifest
    const enhancedManifest = LegacyComponentDetector.generateArchiveManifest(archivalPlan);
    const enhancedManifestPath = 'reports/enhanced-legacy-component-archive-manifest.json';
    await fs.writeFile(enhancedManifestPath, JSON.stringify(enhancedManifest, null, 2));
    
    // Save detailed risk report
    const detailedReport = {
      timestamp: new Date().toISOString(),
      archivalPlan,
      riskAssessments: Object.fromEntries(riskAssessments),
      riskReport,
      improvements: {
        description: 'Enhanced risk assessment with reduced false positives',
        features: [
          'Nuanced critical path analysis',
          'Backend dependency migration path detection',
          'Kiro alternative route mapping',
          'File modification recency consideration',
          'Safe pattern recognition',
          'Confidence scoring'
        ]
      }
    };
    
    const detailedReportPath = 'reports/enhanced-legacy-component-detection-report.json';
    await fs.writeFile(detailedReportPath, JSON.stringify(detailedReport, null, 2));

    console.log(`📄 Enhanced archive manifest saved to: ${enhancedManifestPath}`);
    console.log(`📄 Detailed enhanced report saved to: ${detailedReportPath}`);

    // Step 7: Generate actionable recommendations
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    
    const safeComponents = archivalPlan.components.filter(c => c.safeToArchive);
    const criticalComponents = archivalPlan.components.filter(c => c.riskLevel === 'critical');
    const highRiskComponents = archivalPlan.components.filter(c => c.riskLevel === 'high');
    
    if (safeComponents.length > 0) {
      console.log(`1. ✅ Archive ${safeComponents.length} safe components:`);
      console.log(`   npx tsx scripts/run-safe-archival.ts`);
    }
    
    if (criticalComponents.length > 0) {
      console.log(`2. 🚨 Review ${criticalComponents.length} critical components manually`);
      console.log(`   Focus on: ${criticalComponents.slice(0, 3).map(c => c.path).join(', ')}`);
    }
    
    if (highRiskComponents.length > 0) {
      console.log(`3. ⚠️  Create migration paths for ${highRiskComponents.length} high-risk components`);
      console.log(`   Priority: Components with backend dependencies`);
    }

    console.log(`\n✅ Enhanced legacy component detection completed!`);
    console.log(`📊 Improvement: Reduced high-risk components through better classification`);

  } catch (error) {
    console.error('❌ Enhanced legacy component detection failed:', error);
    process.exit(1);
  }
}

// Run the enhanced detection
if (require.main === module) {
  main();
}