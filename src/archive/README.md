# Legacy Archive - CONSOLIDATED

**This directory has been consolidated into a unified archival system.**

## New Location

All archived components have been moved to the consolidated archive system.
Please use the Safe Archival System CLI for all archive operations:

```bash
# List archived components
npx tsx scripts/run-safe-archival.ts restore <consolidated-archive-dir>

# Review on-hold components  
npx tsx scripts/run-safe-archival.ts review-onhold <consolidated-archive-dir>
```

## Migration

- **Manual Archive**: Moved to `<consolidated-archive-dir>/manual-archive/`
- **Legacy Analysis**: Processed into safe archive and on-hold components
- **Metadata**: Complete migration metadata available in consolidated system

For more information, see:
- `docs/safe-archival-system-documentation.md`
- `docs/archival-systems-consolidation-analysis.md`
