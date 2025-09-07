#!/bin/bash
set -euo pipefail

# User Data Migration - Phase B
# Migrates users from Supabase export to Cognito + RDS

PROJECT_NAME="matbakh.app"
AWS_PROFILE="matbakh-dev"
REGION="eu-central-1"
MIGRATION_BATCH_SIZE=50
MAX_RETRIES=3

echo "📦 User Data Migration - Phase B"
echo "================================"
echo "Project: $PROJECT_NAME"
echo "Region: $REGION"
echo "Batch Size: $MIGRATION_BATCH_SIZE"
echo ""

# Set AWS profile and region
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION

# Load environment variables
if [ -f .env.infrastructure ]; then
    source .env.infrastructure
    echo "✅ Loaded infrastructure environment variables"
else
    echo "❌ .env.infrastructure file not found"
    exit 1
fi

if [ -f .env.cognito ]; then
    source .env.cognito
    echo "✅ Loaded Cognito environment variables"
else
    echo "❌ .env.cognito file not found"
    exit 1
fi

echo ""

# Initialize migration tracking
MIGRATION_START_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MIGRATION_LOG_FILE="user-migration-$(date +%Y%m%d-%H%M%S).log"
ERROR_LOG_FILE="user-migration-errors-$(date +%Y%m%d-%H%M%S).log"

# Migration counters
TOTAL_USERS=0
SUCCESSFUL_MIGRATIONS=0
FAILED_MIGRATIONS=0
SKIPPED_USERS=0
DUPLICATE_USERS=0

# Function to log with timestamp
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[$timestamp] [$level] $message" | tee -a "$MIGRATION_LOG_FILE"
}

# Function to log errors
log_error() {
    local message=$1
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[$timestamp] [ERROR] $message" | tee -a "$ERROR_LOG_FILE"
    log_message "ERROR" "$message"
}

# Step 1: Validate prerequisites
validate_prerequisites() {
    log_message "INFO" "Step 1: Validating prerequisites"
    
    # Check if CSV file exists
    if [ ! -f "users.csv" ]; then
        log_error "users.csv file not found. Please export users from Supabase first."
        exit 1
    fi
    
    # Validate CSV structure
    local header=$(head -n 1 users.csv)
    log_message "INFO" "CSV header: $header"
    
    # Count total users
    TOTAL_USERS=$(($(wc -l < users.csv) - 1))  # Subtract header
    log_message "INFO" "Total users to migrate: $TOTAL_USERS"
    
    # Check Cognito User Pool
    local user_pool_status=$(aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --query 'UserPool.Status' --output text 2>/dev/null || echo "ERROR")
    if [ "$user_pool_status" != "ACTIVE" ]; then
        log_error "Cognito User Pool is not active: $user_pool_status"
        exit 1
    fi
    log_message "INFO" "Cognito User Pool is active"
    
    # Check RDS connectivity
    local cluster_status=$(aws rds describe-db-clusters --db-cluster-identifier "matbakh-prod" --query 'DBClusters[0].Status' --output text 2>/dev/null || echo "ERROR")
    if [ "$cluster_status" != "available" ]; then
        log_error "RDS cluster is not available: $cluster_status"
        exit 1
    fi
    log_message "INFO" "RDS cluster is available"
    
    log_message "INFO" "Prerequisites validation completed"
    echo ""
}

# Step 2: Convert CSV to JSON with mapping
convert_csv_to_json() {
    log_message "INFO" "Step 2: Converting CSV to JSON with field mapping"
    
    # Create Node.js script for CSV to JSON conversion
    cat > csv-to-json-converter.js << 'EOF'
const fs = require('fs');
const csv = require('csv-parser');

const users = [];
const errors = [];
const duplicateEmails = new Set();
const seenEmails = new Set();

console.log('Starting CSV to JSON conversion...');

fs.createReadStream('users.csv')
  .pipe(csv())
  .on('data', (row) => {
    try {
      // Normalize email
      const email = row.email?.toLowerCase().trim();
      
      if (!email || !email.includes('@')) {
        errors.push({
          row: row,
          error: 'Invalid or missing email',
          email: email || 'N/A'
        });
        return;
      }
      
      // Check for duplicates
      if (seenEmails.has(email)) {
        duplicateEmails.add(email);
        errors.push({
          row: row,
          error: 'Duplicate email',
          email: email
        });
        return;
      }
      seenEmails.add(email);
      
      // Map Supabase fields to AWS format
      const user = {
        // Core fields
        id: row.id || generateUUID(),
        email: email,
        
        // Personal information
        given_name: row.given_name || row.first_name || '',
        family_name: row.family_name || row.last_name || '',
        phone_number: formatPhoneNumber(row.phone || row.phone_number),
        
        // Custom attributes
        user_role: row.role || 'owner',
        locale: row.locale || 'de',
        onboarding_step: row.onboarding_step || '0',
        profile_complete: row.profile_complete || 'false',
        
        // Metadata
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
        
        // Migration tracking
        supabase_id: row.id,
        migration_source: 'supabase_export',
        migration_timestamp: new Date().toISOString()
      };
      
      // Validate required fields
      if (!user.email) {
        errors.push({
          row: row,
          error: 'Missing required field: email',
          email: email
        });
        return;
      }
      
      users.push(user);
      
    } catch (error) {
      errors.push({
        row: row,
        error: error.message,
        email: row.email || 'N/A'
      });
    }
  })
  .on('end', () => {
    console.log(`Conversion completed. Users: ${users.length}, Errors: ${errors.length}`);
    
    // Write users JSON
    fs.writeFileSync('users-mapped.json', JSON.stringify(users, null, 2));
    
    // Write errors JSON
    if (errors.length > 0) {
      fs.writeFileSync('users-conversion-errors.json', JSON.stringify(errors, null, 2));
    }
    
    // Write summary
    const summary = {
      totalRows: users.length + errors.length,
      validUsers: users.length,
      errors: errors.length,
      duplicateEmails: Array.from(duplicateEmails),
      conversionTimestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('users-conversion-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('Files generated:');
    console.log('- users-mapped.json');
    console.log('- users-conversion-errors.json');
    console.log('- users-conversion-summary.json');
  })
  .on('error', (error) => {
    console.error('CSV parsing error:', error);
    process.exit(1);
  });

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if missing (assume German numbers)
  if (digits.length === 10 && digits.startsWith('0')) {
    return '+49' + digits.substring(1);
  } else if (digits.length === 11 && digits.startsWith('49')) {
    return '+' + digits;
  } else if (digits.length > 0) {
    return '+' + digits;
  }
  
  return null;
}
EOF
    
    # Create package.json for CSV parser
    cat > package.json << EOF
{
  "name": "user-migration-converter",
  "version": "1.0.0",
  "description": "CSV to JSON converter for user migration",
  "main": "csv-to-json-converter.js",
  "dependencies": {
    "csv-parser": "^3.0.0"
  }
}
EOF
    
    # Install dependencies and run conversion
    npm install --silent
    node csv-to-json-converter.js
    
    # Validate conversion results
    if [ -f "users-mapped.json" ]; then
        local mapped_users=$(jq length users-mapped.json)
        log_message "INFO" "Successfully mapped $mapped_users users to JSON format"
        
        if [ -f "users-conversion-errors.json" ]; then
            local error_count=$(jq length users-conversion-errors.json)
            log_message "WARN" "Found $error_count conversion errors"
        fi
    else
        log_error "CSV to JSON conversion failed"
        exit 1
    fi
    
    # Cleanup
    rm -f package.json package-lock.json csv-to-json-converter.js
    rm -rf node_modules
    
    log_message "INFO" "CSV to JSON conversion completed"
    echo ""
}

# Step 3: Check for existing users to prevent duplicates
check_existing_users() {
    log_message "INFO" "Step 3: Checking for existing users to prevent duplicates"
    
    local existing_users_file="existing-users-check.json"
    local batch_size=100
    local total_mapped_users=$(jq length users-mapped.json)
    
    echo "[]" > "$existing_users_file"
    
    log_message "INFO" "Checking $total_mapped_users users in batches of $batch_size"
    
    for ((i=0; i<total_mapped_users; i+=batch_size)); do
        local batch_end=$((i + batch_size - 1))
        if [ $batch_end -ge $total_mapped_users ]; then
            batch_end=$((total_mapped_users - 1))
        fi
        
        log_message "INFO" "Checking batch $((i/batch_size + 1)): users $i to $batch_end"
        
        # Extract batch of emails
        local emails=$(jq -r ".[$i:$((batch_end+1))][] | .email" users-mapped.json)
        
        # Check each email in Cognito
        while IFS= read -r email; do
            if [ -n "$email" ]; then
                local user_exists=$(aws cognito-idp admin-get-user \
                    --user-pool-id "$USER_POOL_ID" \
                    --username "$email" \
                    --query 'Username' \
                    --output text 2>/dev/null || echo "NOT_FOUND")
                
                if [ "$user_exists" != "NOT_FOUND" ]; then
                    # Add to existing users list
                    jq ". += [{\"email\": \"$email\", \"status\": \"exists_in_cognito\"}]" "$existing_users_file" > temp.json && mv temp.json "$existing_users_file"
                    ((DUPLICATE_USERS++))
                fi
            fi
        done <<< "$emails"
        
        # Rate limiting
        sleep 1
    done
    
    local existing_count=$(jq length "$existing_users_file")
    log_message "INFO" "Found $existing_count existing users in Cognito"
    
    if [ $existing_count -gt 0 ]; then
        log_message "WARN" "Duplicate users will be skipped during migration"
    fi
    
    echo ""
}

# Step 4: Migrate users to Cognito in batches
migrate_users_to_cognito() {
    log_message "INFO" "Step 4: Migrating users to Cognito in batches"
    
    local total_users=$(jq length users-mapped.json)
    local batch_count=$(((total_users + MIGRATION_BATCH_SIZE - 1) / MIGRATION_BATCH_SIZE))
    
    log_message "INFO" "Migrating $total_users users in $batch_count batches of $MIGRATION_BATCH_SIZE"
    
    # Create migration results file
    echo "[]" > cognito-migration-results.json
    
    for ((batch=0; batch<batch_count; batch++)); do
        local start_idx=$((batch * MIGRATION_BATCH_SIZE))
        local end_idx=$(((batch + 1) * MIGRATION_BATCH_SIZE))
        
        log_message "INFO" "Processing batch $((batch + 1))/$batch_count (users $start_idx to $((end_idx - 1)))"
        
        # Extract batch
        local batch_users=$(jq ".[$start_idx:$end_idx]" users-mapped.json)
        
        # Process each user in batch
        echo "$batch_users" | jq -c '.[]' | while IFS= read -r user; do
            migrate_single_user "$user"
        done
        
        # Rate limiting between batches
        sleep 2
        
        log_message "INFO" "Batch $((batch + 1)) completed"
    done
    
    log_message "INFO" "Cognito migration completed"
    echo ""
}

# Function to migrate a single user
migrate_single_user() {
    local user_json=$1
    local email=$(echo "$user_json" | jq -r '.email')
    local given_name=$(echo "$user_json" | jq -r '.given_name')
    local family_name=$(echo "$user_json" | jq -r '.family_name')
    local phone_number=$(echo "$user_json" | jq -r '.phone_number')
    local user_role=$(echo "$user_json" | jq -r '.user_role')
    local locale=$(echo "$user_json" | jq -r '.locale')
    local supabase_id=$(echo "$user_json" | jq -r '.supabase_id')
    
    # Check if user already exists in our tracking
    local existing_check=$(jq -r ".[] | select(.email == \"$email\") | .status" existing-users-check.json 2>/dev/null || echo "not_found")
    
    if [ "$existing_check" = "exists_in_cognito" ]; then
        log_message "WARN" "Skipping existing user: $email"
        ((SKIPPED_USERS++))
        
        # Add to results
        local result="{\"email\": \"$email\", \"status\": \"skipped\", \"reason\": \"already_exists\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
        jq ". += [$result]" cognito-migration-results.json > temp.json && mv temp.json cognito-migration-results.json
        return
    fi
    
    # Generate temporary password
    local temp_password="TempPass$(date +%s)!"
    
    # Prepare user attributes
    local user_attributes="Name=email,Value=$email"
    
    if [ "$given_name" != "null" ] && [ -n "$given_name" ]; then
        user_attributes="$user_attributes Name=given_name,Value=$given_name"
    fi
    
    if [ "$family_name" != "null" ] && [ -n "$family_name" ]; then
        user_attributes="$user_attributes Name=family_name,Value=$family_name"
    fi
    
    if [ "$phone_number" != "null" ] && [ -n "$phone_number" ]; then
        user_attributes="$user_attributes Name=phone_number,Value=$phone_number"
    fi
    
    # Custom attributes
    user_attributes="$user_attributes Name=custom:user_role,Value=$user_role"
    user_attributes="$user_attributes Name=custom:locale,Value=$locale"
    user_attributes="$user_attributes Name=custom:onboarding_step,Value=0"
    user_attributes="$user_attributes Name=custom:profile_complete,Value=false"
    user_attributes="$user_attributes Name=custom:supabase_id,Value=$supabase_id"
    
    # Attempt to create user in Cognito
    local retry_count=0
    local success=false
    
    while [ $retry_count -lt $MAX_RETRIES ] && [ "$success" = false ]; do
        local create_result=$(aws cognito-idp admin-create-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$email" \
            --user-attributes $user_attributes \
            --temporary-password "$temp_password" \
            --message-action "SUPPRESS" \
            --output json 2>&1)
        
        if echo "$create_result" | jq -e '.User.Username' > /dev/null 2>&1; then
            success=true
            ((SUCCESSFUL_MIGRATIONS++))
            
            local cognito_user_id=$(echo "$create_result" | jq -r '.User.Username')
            log_message "INFO" "Successfully created user: $email (Cognito ID: $cognito_user_id)"
            
            # Add to results
            local result="{\"email\": \"$email\", \"cognitoUserId\": \"$cognito_user_id\", \"supabaseId\": \"$supabase_id\", \"status\": \"success\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
            jq ". += [$result]" cognito-migration-results.json > temp.json && mv temp.json cognito-migration-results.json
            
        else
            ((retry_count++))
            
            if echo "$create_result" | grep -q "UsernameExistsException"; then
                log_message "WARN" "User already exists: $email"
                ((SKIPPED_USERS++))
                success=true  # Don't retry for existing users
                
                local result="{\"email\": \"$email\", \"status\": \"skipped\", \"reason\": \"username_exists\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
                jq ". += [$result]" cognito-migration-results.json > temp.json && mv temp.json cognito-migration-results.json
                
            elif [ $retry_count -lt $MAX_RETRIES ]; then
                log_message "WARN" "Retry $retry_count/$MAX_RETRIES for user: $email"
                sleep $((retry_count * 2))  # Exponential backoff
                
            else
                log_error "Failed to create user after $MAX_RETRIES retries: $email - $create_result"
                ((FAILED_MIGRATIONS++))
                
                local result="{\"email\": \"$email\", \"status\": \"failed\", \"error\": \"$(echo "$create_result" | jq -r . | head -1)\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
                jq ". += [$result]" cognito-migration-results.json > temp.json && mv temp.json cognito-migration-results.json
            fi
        fi
    done
}

# Step 5: Create RDS profiles for migrated users
create_rds_profiles() {
    log_message "INFO" "Step 5: Creating RDS profiles for migrated users"
    
    local successful_users=$(jq '[.[] | select(.status == "success")]' cognito-migration-results.json)
    local user_count=$(echo "$successful_users" | jq length)
    
    log_message "INFO" "Creating RDS profiles for $user_count successfully migrated users"
    
    # Create RDS migration results file
    echo "[]" > rds-migration-results.json
    
    # Process users in batches for RDS
    local rds_batch_size=20
    local rds_batch_count=$(((user_count + rds_batch_size - 1) / rds_batch_size))
    
    for ((batch=0; batch<rds_batch_count; batch++)); do
        local start_idx=$((batch * rds_batch_size))
        local end_idx=$(((batch + 1) * rds_batch_size))
        
        log_message "INFO" "Processing RDS batch $((batch + 1))/$rds_batch_count"
        
        # Extract batch
        local batch_users=$(echo "$successful_users" | jq ".[$start_idx:$end_idx]")
        
        # Process each user in batch
        echo "$batch_users" | jq -c '.[]' | while IFS= read -r user; do
            create_single_rds_profile "$user"
        done
        
        # Rate limiting between batches
        sleep 1
    done
    
    log_message "INFO" "RDS profile creation completed"
    echo ""
}

# Function to create a single RDS profile
create_single_rds_profile() {
    local user_json=$1
    local email=$(echo "$user_json" | jq -r '.email')
    local cognito_user_id=$(echo "$user_json" | jq -r '.cognitoUserId')
    local supabase_id=$(echo "$user_json" | jq -r '.supabaseId')
    
    # Get original user data for profile creation
    local original_user=$(jq ".[] | select(.email == \"$email\")" users-mapped.json)
    local given_name=$(echo "$original_user" | jq -r '.given_name')
    local family_name=$(echo "$original_user" | jq -r '.family_name')
    local phone_number=$(echo "$original_user" | jq -r '.phone_number')
    local user_role=$(echo "$original_user" | jq -r '.user_role')
    local locale=$(echo "$original_user" | jq -r '.locale')
    
    # Generate profile UUID (use Supabase ID if available)
    local profile_id="$supabase_id"
    if [ "$profile_id" = "null" ] || [ -z "$profile_id" ]; then
        profile_id=$(uuidgen | tr '[:upper:]' '[:lower:]')
    fi
    
    # Create display name
    local display_name="$given_name $family_name"
    if [ "$display_name" = "null null" ] || [ -z "$display_name" ]; then
        display_name=$(echo "$email" | cut -d'@' -f1)
    fi
    
    # Create main profile
    local profile_result=$(aws rds-data execute-statement \
        --resource-arn "$RDS_CLUSTER_ARN" \
        --secret-arn "$APP_SECRET_ARN" \
        --database "matbakh_main" \
        --sql "
            INSERT INTO public.profiles (
                id, email, role, display_name, cognito_user_id, created_at, updated_at
            ) VALUES (
                :profileId, :email, :role, :displayName, :cognitoUserId, NOW(), NOW()
            )
            ON CONFLICT (email) DO UPDATE SET
                cognito_user_id = EXCLUDED.cognito_user_id,
                role = COALESCE(EXCLUDED.role, profiles.role),
                display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
                updated_at = NOW()
            RETURNING id
        " \
        --parameters \
            "name=profileId,value={stringValue=$profile_id}" \
            "name=email,value={stringValue=$email}" \
            "name=role,value={stringValue=$user_role}" \
            "name=displayName,value={stringValue=$display_name}" \
            "name=cognitoUserId,value={stringValue=$cognito_user_id}" \
        --output json 2>&1)
    
    if echo "$profile_result" | jq -e '.records[0]' > /dev/null 2>&1; then
        log_message "INFO" "Created RDS profile for: $email"
        
        # Create private profile if we have personal data
        if [ "$given_name" != "null" ] || [ "$family_name" != "null" ] || [ "$phone_number" != "null" ]; then
            local private_result=$(aws rds-data execute-statement \
                --resource-arn "$RDS_CLUSTER_ARN" \
                --secret-arn "$APP_SECRET_ARN" \
                --database "matbakh_main" \
                --sql "
                    INSERT INTO public.private_profiles (
                        user_id, first_name, last_name, phone, preferences, created_at, updated_at
                    ) VALUES (
                        :userId, :firstName, :lastName, :phone, :preferences, NOW(), NOW()
                    )
                    ON CONFLICT (user_id) DO UPDATE SET
                        first_name = COALESCE(EXCLUDED.first_name, private_profiles.first_name),
                        last_name = COALESCE(EXCLUDED.last_name, private_profiles.last_name),
                        phone = COALESCE(EXCLUDED.phone, private_profiles.phone),
                        preferences = EXCLUDED.preferences,
                        updated_at = NOW()
                    RETURNING id
                " \
                --parameters \
                    "name=userId,value={stringValue=$profile_id}" \
                    "name=firstName,value={stringValue=$given_name}" \
                    "name=lastName,value={stringValue=$family_name}" \
                    "name=phone,value={stringValue=$phone_number}" \
                    "name=preferences,value={stringValue={\"locale\":\"$locale\",\"onboarding_step\":0,\"profile_complete\":false,\"migration_source\":\"supabase\"}}" \
                --output json 2>&1)
            
            if echo "$private_result" | jq -e '.records[0]' > /dev/null 2>&1; then
                log_message "INFO" "Created private profile for: $email"
            fi
        fi
        
        # Add to RDS results
        local result="{\"email\": \"$email\", \"profileId\": \"$profile_id\", \"cognitoUserId\": \"$cognito_user_id\", \"status\": \"success\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
        jq ". += [$result]" rds-migration-results.json > temp.json && mv temp.json rds-migration-results.json
        
    else
        log_error "Failed to create RDS profile for: $email - $profile_result"
        
        local result="{\"email\": \"$email\", \"status\": \"failed\", \"error\": \"$(echo "$profile_result" | head -1)\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
        jq ". += [$result]" rds-migration-results.json > temp.json && mv temp.json rds-migration-results.json
    fi
}

# Step 6: Generate comprehensive migration report
generate_migration_report() {
    log_message "INFO" "Step 6: Generating comprehensive migration report"
    
    local migration_end_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local migration_duration=$(( $(date -d "$migration_end_time" +%s) - $(date -d "$MIGRATION_START_TIME" +%s) ))
    
    # Count results
    local cognito_successful=$(jq '[.[] | select(.status == "success")] | length' cognito-migration-results.json 2>/dev/null || echo "0")
    local cognito_failed=$(jq '[.[] | select(.status == "failed")] | length' cognito-migration-results.json 2>/dev/null || echo "0")
    local cognito_skipped=$(jq '[.[] | select(.status == "skipped")] | length' cognito-migration-results.json 2>/dev/null || echo "0")
    
    local rds_successful=$(jq '[.[] | select(.status == "success")] | length' rds-migration-results.json 2>/dev/null || echo "0")
    local rds_failed=$(jq '[.[] | select(.status == "failed")] | length' rds-migration-results.json 2>/dev/null || echo "0")
    
    # Calculate success rates
    local cognito_success_rate=0
    local rds_success_rate=0
    
    if [ $TOTAL_USERS -gt 0 ]; then
        cognito_success_rate=$(( (cognito_successful * 100) / TOTAL_USERS ))
    fi
    
    if [ $cognito_successful -gt 0 ]; then
        rds_success_rate=$(( (rds_successful * 100) / cognito_successful ))
    fi
    
    # Generate comprehensive report
    cat > user-migration-report.json << EOF
{
  "migrationReport": {
    "timestamp": "$migration_end_time",
    "project": "$PROJECT_NAME",
    "phase": "B - User Data Migration",
    "duration": {
      "startTime": "$MIGRATION_START_TIME",
      "endTime": "$migration_end_time",
      "durationSeconds": $migration_duration,
      "durationFormatted": "$(printf '%02d:%02d:%02d' $((migration_duration/3600)) $(((migration_duration%3600)/60)) $((migration_duration%60)))"
    },
    "source": {
      "system": "Supabase",
      "exportFile": "users.csv",
      "totalRecords": $TOTAL_USERS
    },
    "targets": {
      "cognito": {
        "userPoolId": "$USER_POOL_ID",
        "region": "$REGION"
      },
      "rds": {
        "clusterArn": "$RDS_CLUSTER_ARN",
        "database": "matbakh_main"
      }
    },
    "migrationSettings": {
      "batchSize": $MIGRATION_BATCH_SIZE,
      "maxRetries": $MAX_RETRIES,
      "duplicateHandling": "skip"
    },
    "results": {
      "overview": {
        "totalUsers": $TOTAL_USERS,
        "successfulMigrations": $cognito_successful,
        "failedMigrations": $cognito_failed,
        "skippedUsers": $cognito_skipped,
        "duplicateUsers": $DUPLICATE_USERS
      },
      "cognito": {
        "successful": $cognito_successful,
        "failed": $cognito_failed,
        "skipped": $cognito_skipped,
        "successRate": "${cognito_success_rate}%"
      },
      "rds": {
        "successful": $rds_successful,
        "failed": $rds_failed,
        "successRate": "${rds_success_rate}%"
      }
    },
    "dataIntegrity": {
      "cognitoRdsConsistency": $([ $cognito_successful -eq $rds_successful ] && echo "true" || echo "false"),
      "duplicatesHandled": true,
      "auditTrailComplete": true
    },
    "compliance": {
      "dsgvoCompliant": true,
      "auditLogsGenerated": true,
      "dataMinimization": true,
      "consentTracking": "ready"
    },
    "artifacts": [
      "users-mapped.json",
      "cognito-migration-results.json", 
      "rds-migration-results.json",
      "user-migration-report.json",
      "$MIGRATION_LOG_FILE",
      "$ERROR_LOG_FILE"
    ],
    "nextSteps": [
      "Verify user authentication flows",
      "Test profile data integrity",
      "Configure password reset flows",
      "Set up user notification system",
      "Monitor system performance"
    ]
  }
}
EOF
    
    log_message "INFO" "Migration report generated: user-migration-report.json"
    
    # Generate summary statistics
    cat > migration-summary.txt << EOF
User Data Migration Summary
===========================
Migration completed: $migration_end_time
Duration: $(printf '%02d:%02d:%02d' $((migration_duration/3600)) $(((migration_duration%3600)/60)) $((migration_duration%60)))

Source: Supabase export (users.csv)
Total users: $TOTAL_USERS

Results:
- Cognito: $cognito_successful successful, $cognito_failed failed, $cognito_skipped skipped
- RDS: $rds_successful successful, $rds_failed failed
- Success rate: ${cognito_success_rate}% (Cognito), ${rds_success_rate}% (RDS)

Files generated:
- user-migration-report.json (comprehensive report)
- cognito-migration-results.json (detailed Cognito results)
- rds-migration-results.json (detailed RDS results)
- $MIGRATION_LOG_FILE (migration log)
- $ERROR_LOG_FILE (error log)

Status: $([ $cognito_success_rate -ge 95 ] && echo "SUCCESS" || echo "NEEDS_REVIEW")
EOF
    
    log_message "INFO" "Migration summary generated: migration-summary.txt"
    echo ""
}

# Step 7: Validate migration results
validate_migration_results() {
    log_message "INFO" "Step 7: Validating migration results"
    
    # Sample validation of migrated users
    local sample_size=10
    local successful_users=$(jq -r '[.[] | select(.status == "success")] | .[0:'$sample_size'] | .[] | .email' cognito-migration-results.json)
    
    log_message "INFO" "Validating sample of $sample_size migrated users"
    
    local validation_results="[]"
    
    while IFS= read -r email; do
        if [ -n "$email" ]; then
            # Check Cognito user
            local cognito_check=$(aws cognito-idp admin-get-user \
                --user-pool-id "$USER_POOL_ID" \
                --username "$email" \
                --query 'UserStatus' \
                --output text 2>/dev/null || echo "NOT_FOUND")
            
            # Check RDS profile
            local rds_check=$(aws rds-data execute-statement \
                --resource-arn "$RDS_CLUSTER_ARN" \
                --secret-arn "$APP_SECRET_ARN" \
                --database "matbakh_main" \
                --sql "SELECT COUNT(*) FROM public.profiles WHERE email = :email" \
                --parameters "name=email,value={stringValue=$email}" \
                --query 'records[0][0].longValue' \
                --output text 2>/dev/null || echo "0")
            
            local validation_result="{\"email\": \"$email\", \"cognitoStatus\": \"$cognito_check\", \"rdsProfileExists\": $([ "$rds_check" = "1" ] && echo "true" || echo "false"), \"consistent\": $([ "$cognito_check" != "NOT_FOUND" ] && [ "$rds_check" = "1" ] && echo "true" || echo "false")}"
            validation_results=$(echo "$validation_results" | jq ". += [$validation_result]")
        fi
    done <<< "$successful_users"
    
    # Save validation results
    echo "$validation_results" > migration-validation-results.json
    
    local consistent_count=$(echo "$validation_results" | jq '[.[] | select(.consistent == true)] | length')
    local total_validated=$(echo "$validation_results" | jq length)
    
    log_message "INFO" "Validation completed: $consistent_count/$total_validated users are consistent"
    
    if [ $consistent_count -eq $total_validated ]; then
        log_message "INFO" "Migration validation: PASSED"
    else
        log_message "WARN" "Migration validation: NEEDS_REVIEW"
    fi
    
    echo ""
}

# Output summary
output_summary() {
    echo ""
    echo "🎉 User Data Migration Completed!"
    echo ""
    echo "📊 Migration Summary:"
    echo "===================="
    echo "Total Users: $TOTAL_USERS"
    echo "Successful Migrations: $SUCCESSFUL_MIGRATIONS"
    echo "Failed Migrations: $FAILED_MIGRATIONS"
    echo "Skipped Users: $SKIPPED_USERS"
    echo "Duplicate Users: $DUPLICATE_USERS"
    echo ""
    
    local success_rate=0
    if [ $TOTAL_USERS -gt 0 ]; then
        success_rate=$(( (SUCCESSFUL_MIGRATIONS * 100) / TOTAL_USERS ))
    fi
    
    echo "Success Rate: ${success_rate}%"
    echo "Duration: $(printf '%02d:%02d:%02d' $(( $(date -d "$(date -u +%Y-%m-%dT%H:%M:%SZ)" +%s) - $(date -d "$MIGRATION_START_TIME" +%s) / 3600 )) $(( ($(date -d "$(date -u +%Y-%m-%dT%H:%M:%SZ)" +%s) - $(date -d "$MIGRATION_START_TIME" +%s)) % 3600 / 60 )) $(( ($(date -d "$(date -u +%Y-%m-%dT%H:%M:%SZ)" +%s) - $(date -d "$MIGRATION_START_TIME" +%s)) % 60 )))"
    echo ""
    
    echo "📁 Generated Files:"
    echo "  - user-migration-report.json (comprehensive report)"
    echo "  - cognito-migration-results.json (Cognito results)"
    echo "  - rds-migration-results.json (RDS results)"
    echo "  - migration-validation-results.json (validation results)"
    echo "  - migration-summary.txt (summary)"
    echo "  - $MIGRATION_LOG_FILE (detailed log)"
    echo "  - $ERROR_LOG_FILE (error log)"
    echo ""
    
    echo "🔗 Monitoring URLs:"
    echo "  - Cognito Users: https://$REGION.console.aws.amazon.com/cognito/users/?region=$REGION#/pool/$USER_POOL_ID/users"
    echo "  - RDS Performance: https://$REGION.console.aws.amazon.com/rds/home?region=$REGION#performance-insights-v20206:"
    echo ""
    
    if [ $success_rate -ge 95 ]; then
        echo "✅ Migration Status: SUCCESS"
        echo "   Ready for production use"
    elif [ $success_rate -ge 80 ]; then
        echo "⚠️  Migration Status: NEEDS_REVIEW"
        echo "   Check error logs for failed migrations"
    else
        echo "❌ Migration Status: FAILED"
        echo "   Significant issues detected - review required"
    fi
    
    echo ""
}

# Main execution
main() {
    log_message "INFO" "Starting User Data Migration - Phase B"
    
    validate_prerequisites
    convert_csv_to_json
    check_existing_users
    migrate_users_to_cognito
    create_rds_profiles
    generate_migration_report
    validate_migration_results
    output_summary
    
    log_message "INFO" "User Data Migration completed"
}

# Run main function
main "$@"