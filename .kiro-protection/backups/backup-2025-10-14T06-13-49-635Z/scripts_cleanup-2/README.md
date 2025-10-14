# Cleanup 2 Infrastructure

Automated detection engine and rollback management for legacy service cleanup.

## Features

- **Multi-service detection**: Supabase, Vercel, Twilio, Resend, Lovable pattern detection
- **Risk assessment**: Confidence scoring and categorization
- **Bedrock integration**: JSON reports for AI orchestration
- **Git-based rollback**: Phase-based rollback points with S3 backup capability
- **Automated triggers**: Build failure, test failure, coverage drop detection

## Quick Start

```bash
# Initialize cleanup infrastructure
npx tsx scripts/cleanup-2/index.ts init

# Run full legacy scan
npx tsx scripts/cleanup-2/index.ts scan

# Create phase checkpoint
npx tsx scripts/cleanup-2/index.ts checkpoint phase1 "Phase 1 complete"
```

## Individual Tools

### Legacy Scanner

```bash
# Run scanner only
npx tsx scripts/cleanup-2/legacy-scanner.ts

# Results in: reports/detection.json
```

### Rollback Manager

```bash
# List rollback points
npx tsx scripts/cleanup-2/rollback-manager.ts list

# Create rollback point
npx tsx scripts/cleanup-2/rollback-manager.ts create phase1 "Description"

# Execute rollback
npx tsx scripts/cleanup-2/rollback-manager.ts rollback [pointId]

# Check triggers
npx tsx scripts/cleanup-2/rollback-manager.ts check

# Cleanup old points
npx tsx scripts/cleanup-2/rollback-manager.ts cleanup
```

## Output Files

- `reports/detection.json` - Bedrock-compatible scan results
- `reports/cleanup-summary.md` - Human-readable summary
- `reports/rollback-points.json` - Rollback point registry
- `reports/rollback-events.log` - Rollback execution log
- `backups/` - Artifact backups per phase

## Requirements Fulfilled

- **1.1**: Automated detection engine with configurable patterns ✅
- **2.1**: Risk assessment and categorization ✅
- **2.2**: Machine-readable reports with confidence scoring ✅
- **6.5**: Git tagging strategy with phase-based rollback points ✅
- **9.1**: Automated rollback triggers and S3 backup capability ✅

## Integration

The infrastructure exports JSON reports compatible with Bedrock AI orchestration and provides rollback safety for all cleanup phases.
