# Database Schema Documentation

This directory contains the complete database schema documentation for matbakh.app, organized by functional areas.

## 📁 Directory Structure

```
docs/database/
├── README.md                    # This overview
├── core/                        # Core system schemas
│   ├── authentication.md       # User auth & RBAC
│   ├── profiles.md             # User profiles & private data
│   └── system-config.md        # Feature flags & configuration
├── business/                    # Business management schemas
│   ├── restaurants.md          # Restaurant/business profiles
│   ├── onboarding.md           # User onboarding system
│   └── partners.md             # Partner & credit system
├── visibility-check/            # VC system schemas
│   ├── leads.md                # VC leads & DOI system
│   ├── analysis.md             # Business analysis & results
│   └── tokens.md               # Access tokens & security
├── content/                     # Content management schemas
│   ├── social-media.md         # Social media posting
│   └── assets.md               # Brand assets & media
├── analytics/                   # Analytics & tracking schemas
│   ├── events.md               # Event tracking
│   └── metrics.md              # Performance metrics
└── migrations/                  # Migration documentation
    ├── current-state.md        # Current schema state
    ├── migration-log.md        # Migration history
    └── troubleshooting.md      # Common migration issues
```

## 🎯 Quick Navigation

### Current Production Schema
- **[Current State](migrations/current-state.md)** - Complete current schema overview
- **[Migration Log](migrations/migration-log.md)** - Recent migration history

### Core Systems
- **[Authentication & RBAC](core/authentication.md)** - User roles and permissions
- **[User Profiles](core/profiles.md)** - Profile management and privacy

### Business Features
- **[Visibility Check System](visibility-check/leads.md)** - Core VC functionality
- **[Restaurant Management](business/restaurants.md)** - Business profile system
- **[Partner System](business/partners.md)** - Partner credits and management

### Development
- **[Migration Troubleshooting](migrations/troubleshooting.md)** - Common issues and fixes

## 🔄 Schema Evolution

The database schema has evolved through several major phases:

1. **Phase 1**: Basic VC system with email leads
2. **Phase 2**: User authentication and RBAC implementation
3. **Phase 3**: Business profile management and onboarding
4. **Phase 4**: Partner system and credit management
5. **Phase 5**: S3 integration and file management
6. **Current**: DSGVO compliance and schema consolidation

## 📊 Current Statistics

- **Total Tables**: ~25 core tables
- **RLS Enabled**: All user-facing tables
- **Indexes**: Performance-optimized for VC workflows
- **Functions**: 15+ stored procedures for business logic
- **Triggers**: Automated profile creation and updates

## 🛠 Maintenance

### Schema Updates
All schema changes must go through the migration system:
1. Create migration file in `supabase/migrations/`
2. Test locally with `supabase db reset`
3. Deploy with `supabase db push`
4. Update documentation in this directory

### Documentation Standards
- Each schema file should include table definitions, relationships, and business logic
- Include RLS policies and security considerations
- Document any performance considerations or indexes
- Provide example queries for common use cases

## 🔗 Related Documentation

- [API Documentation](../api/) - REST API endpoints
- [Frontend Integration](../frontend/) - Client-side usage
- [Security Review](../SECURITY-REVIEW.md) - Security audit results
- [Migration Roadmap](../migration-roadmap-updated.md) - Future migration plans