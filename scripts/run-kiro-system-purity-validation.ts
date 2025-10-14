#!/usr/bin/env npx tsx

/**
 * Kiro System Purity Validation Script
 * 
 * Validates that the entire system contains only Kiro-generated components
 * and generates a comprehensive purity certification report.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { KiroSystemPurityValidator } from '../src/lib/architecture-scanner/kiro-system-purity-validator';

interface ValidationOptions {
  outputDir?: string;
  generateReport?: boolean;
  verbose?: boolean;
  dryRun?: boolean;
}



function printSummary(result: any, verbose: boolean) {
  console.log('📋 KIRO SYSTEM PURITY VALIDATION RESULTS');
  console.log('=' .repeat(50));
  console.log(`Overall Score: ${result.score}/100`);
  console.log(`System Status: ${result.isPure ? '✅ PURE' : '❌ IMPURE'}`);
  console.log(`Timestamp: ${result.timestamp}`);
  
  if (result.certification) {
    console.log(`Certification: ✅ ${result.certification.certificationLevel.toUpperCase()}`);
    console.log(`Valid Until: ${result.certification.validUntil}`);
  } else {
    console.log('Certification: ❌ NOT CERTIFIED');
  }

  console.log('\n📊 COMPONENT BREAKDOWN');
  console.log('-'.repeat(30));
  
  const validations = result.validations;
  
  console.log(`APIs: ${validations.apis.kiroAPIs}/${validations.apis.totalAPIs} Kiro (${validations.apis.purityScore}%)`);
  console.log(`Test Frameworks: ${validations.testFrameworks.isKiroConfigured ? '✅' : '❌'} (${validations.testFrameworks.purityScore}%)`);
  console.log(`Auth Components: ${validations.authComponents.kiroComponents}/${validations.authComponents.totalComponents} Kiro (${validations.authComponents.purityScore}%)`);
  console.log(`Dashboard Components: ${validations.dashboardComponents.kiroComponents}/${validations.dashboardComponents.totalComponents} Kiro (${validations.dashboardComponents.purityScore}%)`);
  console.log(`Upload Components: ${validations.uploadComponents.kiroComponents}/${validations.uploadComponents.totalComponents} Kiro (${validations.uploadComponents.purityScore}%)`);
  console.log(`VC Components: ${validations.vcComponents.kiroComponents}/${validations.vcComponents.totalComponents} Kiro (${validations.vcComponents.purityScore}%)`);

  if (result.violations.length > 0) {
    console.log(`\n⚠️ VIOLATIONS (${result.violations.length})`);
    console.log('-'.repeat(20));
    
    const criticalViolations = result.violations.filter((v: any) => v.severity === 'critical');
    const highViolations = result.violations.filter((v: any) => v.severity === 'high');
    const mediumViolations = result.violations.filter((v: any) => v.severity === 'medium');
    const lowViolations = result.violations.filter((v: any) => v.severity === 'low');
    
    if (criticalViolations.length > 0) {
      console.log(`🚨 Critical: ${criticalViolations.length}`);
    }
    if (highViolations.length > 0) {
      console.log(`⚠️ High: ${highViolations.length}`);
    }
    if (mediumViolations.length > 0) {
      console.log(`🟡 Medium: ${mediumViolations.length}`);
    }
    if (lowViolations.length > 0) {
      console.log(`🔵 Low: ${lowViolations.length}`);
    }

    if (verbose) {
      console.log('\n📝 DETAILED VIOLATIONS');
      console.log('-'.repeat(25));
      result.violations.forEach((violation: any, index: number) => {
        console.log(`${index + 1}. ${violation.severity.toUpperCase()}: ${violation.file}`);
        console.log(`   Type: ${violation.type}`);
        console.log(`   Description: ${violation.description}`);
        console.log(`   Recommendation: ${violation.recommendation}`);
        console.log('');
      });
    }
  } else {
    console.log('\n🎉 NO VIOLATIONS FOUND!');
  }

  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(18));
    result.recommendations.forEach((rec: string, index: number) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

async function generateReports(validator: KiroSystemPurityValidator, result: any, outputDir: string) {
  console.log(`\n📄 Generating reports in ${outputDir}/...`);
  
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Generate detailed report
  const report = await validator.generatePurityReport(result);
  const reportPath = path.join(outputDir, `kiro-system-purity-report-${timestamp}.md`);
  await fs.writeFile(reportPath, report, 'utf-8');
  console.log(`✅ Detailed report: ${reportPath}`);
  
  // Generate JSON data
  const jsonPath = path.join(outputDir, `kiro-system-purity-data-${timestamp}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`✅ JSON data: ${jsonPath}`);
  
  // Generate CSV summary for violations
  if (result.violations.length > 0) {
    const csvContent = generateViolationsCSV(result.violations);
    const csvPath = path.join(outputDir, `kiro-system-purity-violations-${timestamp}.csv`);
    await fs.writeFile(csvPath, csvContent, 'utf-8');
    console.log(`✅ Violations CSV: ${csvPath}`);
  }
  
  // Generate certification document if certified
  if (result.certification) {
    const certContent = generateCertificationDocument(result);
    const certPath = path.join(outputDir, `kiro-system-purity-certificate-${timestamp}.md`);
    await fs.writeFile(certPath, certContent, 'utf-8');
    console.log(`✅ Certification: ${certPath}`);
  }
}

function generateViolationsCSV(violations: any[]): string {
  const headers = ['Type', 'Severity', 'File', 'Description', 'Recommendation'];
  const rows = violations.map(v => [
    v.type,
    v.severity,
    v.file,
    `"${v.description.replace(/"/g, '""')}"`,
    `"${v.recommendation.replace(/"/g, '""')}"`
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateCertificationDocument(result: any): string {
  const cert = result.certification;
  
  return `# Kiro System Purity Certificate

## Certificate Details
- **Certification Level**: ${cert.certificationLevel.toUpperCase()}
- **Overall Score**: ${result.score}/100
- **Issued**: ${cert.issuedAt}
- **Valid Until**: ${cert.validUntil}
- **Certificate ID**: KIRO-${cert.issuedAt.replace(/[^\d]/g, '').slice(0, 12)}

## Certification Criteria
- ✅ API Purity: ${cert.criteria.apiPurity ? 'PASSED' : 'FAILED'}
- ✅ Test Purity: ${cert.criteria.testPurity ? 'PASSED' : 'FAILED'}
- ✅ Component Purity: ${cert.criteria.componentPurity ? 'PASSED' : 'FAILED'}
- ✅ Configuration Purity: ${cert.criteria.configurationPurity ? 'PASSED' : 'FAILED'}

## System Summary
This certificate confirms that the matbakh.app system has achieved **${cert.certificationLevel.toUpperCase()}** level Kiro purity certification with a score of **${result.score}/100**.

The system has been validated to contain only Kiro-generated components and configurations, ensuring:
- Clean architecture free from legacy dependencies
- Consistent development patterns and standards
- Maintainable and scalable codebase
- Full compliance with Kiro development guidelines

---

*This certificate is automatically generated by the Kiro System Purity Validator*
*Certificate verification can be performed by re-running the validation process*
`;
}

function printHelp() {
  console.log(`
Kiro System Purity Validation Script

USAGE:
  npx tsx scripts/run-kiro-system-purity-validation.ts [OPTIONS]

OPTIONS:
  --output-dir <dir>    Directory for generated reports (default: reports)
  --no-report          Skip generating detailed reports
  --verbose            Show detailed violation information
  --dry-run            Run validation without generating files
  --help               Show this help message

EXAMPLES:
  # Basic validation with reports
  npx tsx scripts/run-kiro-system-purity-validation.ts

  # Verbose validation with custom output directory
  npx tsx scripts/run-kiro-system-purity-validation.ts --verbose --output-dir ./purity-reports

  # Dry run without generating files
  npx tsx scripts/run-kiro-system-purity-validation.ts --dry-run --verbose

EXIT CODES:
  0  System is pure (score >= 95, no critical violations)
  1  System is impure or validation failed
`);
}

// --- am Dateiende ---
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const dryRun = args.includes('--dry-run');
  const timeoutArg = args.find(a => a.startsWith('--timeout='));
  const timeoutMs = timeoutArg ? Number(timeoutArg.split('=')[1]) : Number(process.env.PURITY_TIMEOUT ?? 45000);

  // optional: patterns via CLI
  const patternsArg = args.find(a => a.startsWith('--patterns='));
  const patterns = patternsArg ? patternsArg.split('=')[1].split(',') : undefined;

  // Spinner optional; unbedingt stoppen!
  const useSpinner = !args.includes('--no-spinner') && process.stdout.isTTY;
  let spinner: any = null;
  
  if (useSpinner) {
    // Simple spinner implementation
    const frames = ['⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    let interval: NodeJS.Timeout | null = null;
    
    spinner = {
      start(message: string) {
        process.stdout.write(`${message} ${frames[0]}`);
        interval = setInterval(() => {
          process.stdout.write(`\r${message} ${frames[i++ % frames.length]}`);
        }, 100);
      },
      succeed(message: string) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        process.stdout.write(`\r${message} ✅\n`);
      },
      fail(message: string) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        process.stdout.write(`\r${message} ❌\n`);
      },
      stop() {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        process.stdout.write('\r');
      }
    };
    
    spinner.start('Running Kiro Purity Validation…');
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new Error(`cli timed out after ${timeoutMs}ms`)), timeoutMs);

  try {
    const { KiroSystemPurityValidator } = await import('../src/lib/architecture-scanner/kiro-system-purity-validator');
    const validator = new KiroSystemPurityValidator();

    const report = await validator.scan({
      verbose,
      timeoutMs,
      patterns,
      signal: ac.signal,
    });

    if (spinner) spinner.succeed('Validation completed');
    
    // Print summary
    printSummary(report, verbose);

    if (!dryRun) {
      await generateReports(validator, report, 'reports');
    }

    return report.isPure ? 0 : 1;
  } catch (err) {
    if (spinner) spinner.fail('Validation failed');
    console.error(err instanceof Error ? err.stack || err.message : err);
    return 1;
  } finally {
    clearTimeout(timer);
    if (spinner) spinner.stop();
  }
}

// ESM-gerechter Entrypoint (tsx unterstützt import.meta.main)
const metaAny = import.meta as unknown as { main?: boolean };
if (metaAny.main) {
  main().then(
    (code) => process.exit(code),
    (err) => { console.error(err); process.exit(1); }
  );
}

// optional: Export für Tests
export default main;

export { main as runKiroSystemPurityValidation };