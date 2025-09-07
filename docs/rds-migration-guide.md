# RDS Migration Guide - Complete Solutions

## 🔍 Problem Analysis

**Current Situation:**
- RDS Instance: `matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com`
- Status: Available ✅
- Public Accessible: `false` (Secure Configuration)
- Your IP: IPv6 `2a09:bac3:2967:2c8::47:321`
- Allowed IP: IPv4 `62.216.202.209/32`

**Root Cause:** RDS is correctly configured as private, but direct connection from your local machine is blocked.

## 🎯 Solution Options

### Option 1: Bastion Host (Recommended for Security)

**Pros:**
- ✅ Maintains RDS security (private)
- ✅ Secure SSH-based access
- ✅ Can be used for ongoing maintenance
- ✅ Full control over access

**Cons:**
- ⏱️ Takes 5-10 minutes to set up
- 💰 Small EC2 cost (t3.micro ~$0.01/hour)

**Implementation:**
```bash
chmod +x create-bastion-host.sh
./create-bastion-host.sh
```

### Option 2: Temporary Public Access (Fastest)

**Pros:**
- ⚡ Immediate access
- 🚀 Direct connection possible
- 🔧 Simple setup

**Cons:**
- ⚠️ Security risk (temporary internet exposure)
- 🔒 Must remember to disable after migration
- 📍 IP address dependency

**Implementation:**
```bash
chmod +x enable-temporary-public-access.sh
./enable-temporary-public-access.sh
```

### Option 3: Systems Manager Session Manager (Most Secure)

**Pros:**
- 🔐 No SSH keys required
- 🛡️ AWS IAM-based access control
- 📝 Full session logging
- 🌐 Works from anywhere

**Cons:**
- 🔧 Requires IAM role setup
- 📚 More complex initial configuration

## 🚀 Quick Start (Recommended Path)

### Step 1: Choose Your Connection Method

**For Quick Migration (Low Security Requirements):**
```bash
./enable-temporary-public-access.sh
```

**For Production/Secure Environment:**
```bash
./create-bastion-host.sh
```

### Step 2: Run Schema Migration

```bash
export RDS_PASSWORD="Matbakhapp#1971x"
chmod +x migrate-schema-to-rds.sh
./migrate-schema-to-rds.sh
```

### Step 3: Validate Migration

The migration script will automatically:
- ✅ Test connection
- ✅ Create database if needed
- ✅ Run schema migration
- ✅ Apply RBAC (if available)
- ✅ Validate core tables
- ✅ Generate summary report

## 📋 Migration Checklist

### Pre-Migration
- [ ] Choose connection method (bastion vs public access)
- [ ] Set RDS_PASSWORD environment variable
- [ ] Verify schema files exist
- [ ] Backup existing data (if any)

### During Migration
- [ ] Run connection setup script
- [ ] Test basic connectivity
- [ ] Run schema migration script
- [ ] Monitor migration logs

### Post-Migration
- [ ] Validate all core tables exist
- [ ] Test basic queries
- [ ] Update application configuration
- [ ] Disable temporary public access (if used)
- [ ] Clean up bastion host (if used)

## 🔧 Troubleshooting

### Connection Issues
```bash
# Run comprehensive diagnosis
./diagnose-rds-connectivity.sh

# Test specific connection
PGPASSWORD="your-password" psql -h matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com -U postgres -d postgres
```

### Migration Errors
- Check migration logs in generated files
- Verify PostgreSQL version compatibility
- Ensure sufficient RDS storage space
- Check for conflicting table names

### Security Group Issues
- Verify your IP is in allowed CIDR blocks
- Check port 5432 is open
- Confirm security group is attached to RDS

## 📊 Expected Results

After successful migration:
- **Database:** `matbakh` created on RDS
- **Tables:** ~61 tables from schema file
- **Connection String:** `postgresql://postgres:PASSWORD@matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com:5432/matbakh`
- **Logs:** Migration and validation logs generated
- **Report:** Detailed migration summary

## 🔒 Security Best Practices

### If Using Temporary Public Access:
1. ⏰ Set a timer to disable within 24 hours
2. 🔐 Use strong passwords
3. 📍 Restrict to your specific IP only
4. 🚫 Never use in production without approval

### If Using Bastion Host:
1. 🔑 Use strong SSH key pairs
2. 🔒 Restrict SSH access to your IP
3. 🗑️ Terminate bastion after migration
4. 📝 Log all access for audit

### General:
1. 🔄 Rotate RDS passwords regularly
2. 📊 Monitor RDS access logs
3. 🛡️ Use IAM database authentication when possible
4. 🔍 Regular security audits

## 🚀 Next Steps After Migration

1. **Update Application Configuration**
   - Update `.env` files with RDS connection string
   - Test Lambda function connectivity
   - Update Supabase Edge Functions to use RDS

2. **Data Migration** (if needed)
   - Export data from Supabase
   - Import data to RDS
   - Validate data integrity

3. **Application Testing**
   - Test all database operations
   - Verify authentication flows
   - Check business logic functions

4. **Monitoring Setup**
   - Configure RDS monitoring
   - Set up CloudWatch alarms
   - Enable performance insights

## 📞 Support

If you encounter issues:
1. Check the generated log files
2. Run the diagnosis script
3. Review AWS CloudWatch logs
4. Verify network connectivity

**Files Created:**
- `create-bastion-host.sh` - Bastion host setup
- `enable-temporary-public-access.sh` - Public access setup
- `migrate-schema-to-rds.sh` - Complete migration script
- `diagnose-rds-connectivity.sh` - Network diagnosis
- Migration logs and reports (generated during migration)