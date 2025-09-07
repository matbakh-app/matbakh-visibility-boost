# RDS Schema Bootstrap

This directory contains SQL scripts and deployment tools for managing the Matbakh RDS PostgreSQL schema.

## 📁 Directory Structure

```
infra/rds-schema-bootstrap/
├── README.md                    # This file
├── core/                        # Core schema definitions
│   ├── 01-extensions.sql       # PostgreSQL extensions
│   ├── 02-users-auth.sql       # User management tables
│   ├── 03-business.sql         # Business/restaurant tables
│   ├── 04-visibility-check.sql # VC system tables
│   ├── 05-services.sql         # Service packages & bookings
│   └── 06-analytics.sql        # Analytics and reporting tables
├── migrations/                  # Schema migrations
│   ├── 001-initial-schema.sql  # Initial schema deployment
│   └── migration-template.sql  # Template for new migrations
├── data/                        # Initial data and seeds
│   ├── feature-flags.sql       # Default feature flags
│   ├── service-packages.sql    # Default service packages
│   └── gmb-categories.sql      # Google My Business categories
├── security/                    # Security and permissions
│   ├── rls-policies.sql        # Row Level Security policies
│   ├── indexes.sql             # Performance indexes
│   └── constraints.sql         # Data integrity constraints
└── deploy/                      # Deployment scripts
    ├── deploy-schema.sh        # Main deployment script
    ├── rollback-schema.sh      # Rollback script
    └── validate-schema.sh      # Validation script
```

## 🚀 Usage

### Deploy Complete Schema
```bash
cd infra/rds-schema-bootstrap
./deploy/deploy-schema.sh
```

### Deploy Specific Components
```bash
# Core tables only
psql -h $RDS_HOST -U postgres -d matbakh -f core/02-users-auth.sql

# Feature flags
psql -h $RDS_HOST -U postgres -d matbakh -f data/feature-flags.sql
```

### Validate Deployment
```bash
./deploy/validate-schema.sh
```

## 🔐 Security

All scripts use AWS Secrets Manager for database credentials. Ensure the following environment variables are set:

- `DB_SECRET_NAME`: Name of the RDS secret in Secrets Manager
- `AWS_REGION`: AWS region (default: eu-central-1)
- `AWS_PROFILE`: AWS CLI profile (default: matbakh-dev)

## 📋 Schema Overview

### Core Tables (10 tables deployed)
- `profiles` - User authentication and roles
- `private_profile` - GDPR-compliant private user data
- `business_partners` - Restaurant/business main records
- `business_profiles` - Extended business information
- `visibility_check_leads` - VC request tracking
- `visibility_check_results` - VC analysis results
- `service_packages` - Available service offerings
- `partner_bookings` - Service bookings and payments
- `gmb_categories` - Google My Business categories
- `feature_flags` - A/B testing and feature rollouts

### Planned Extensions (43 additional tables)
See `docs/database-table-inventory.md` for complete list of planned tables.

## 🔄 Migration Strategy

1. **Core Schema:** Essential tables for basic functionality
2. **Feature Extensions:** Additional tables as features are developed
3. **Data Migration:** Import existing data from Supabase backups
4. **Performance Optimization:** Indexes and query optimization

## 📊 Current Status

- **Deployed:** 10 core tables with basic functionality
- **Tested:** Lambda connectivity confirmed
- **Secured:** RLS policies and IAM integration
- **Ready:** For application integration and data migration