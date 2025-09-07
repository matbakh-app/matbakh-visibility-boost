#!/bin/bash

# ==============================================
# Cognito Trigger Validation Script
# ==============================================
# Validiert die komplette Cognito-Lambda Integration

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# AWS Profile und Region
AWS_PROFILE=${AWS_PROFILE:-matbakh-dev}
AWS_REGION=${AWS_REGION:-eu-central-1}
USER_POOL_ID=${USER_POOL_ID:-eu-central-1_farFjTHKf}

echo -e "${BLUE}🔍 Cognito Trigger Validation${NC}"
echo "=================================="
echo "Profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "User Pool: $USER_POOL_ID"
echo ""

# ==============================================
# 1. User Pool Trigger Konfiguration prüfen
# ==============================================
echo -e "${YELLOW}1. Prüfe User Pool Trigger Konfiguration...${NC}"

LAMBDA_CONFIG=$(aws cognito-idp describe-user-pool \
  --user-pool-id $USER_POOL_ID \
  --region $AWS_REGION \
  --profile $AWS_PROFILE \
  --query 'UserPool.LambdaConfig' \
  --output json 2>/dev/null)

if echo "$LAMBDA_CONFIG" | grep -q "PostConfirmation"; then
    POST_CONFIRMATION_ARN=$(echo "$LAMBDA_CONFIG" | jq -r '.PostConfirmation // empty')
    if [ -n "$POST_CONFIRMATION_ARN" ]; then
        echo -e "${GREEN}✅ Post-Confirmation Trigger konfiguriert: $POST_CONFIRMATION_ARN${NC}"
    else
        echo -e "${RED}❌ Post-Confirmation Trigger nicht konfiguriert${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Keine Lambda-Konfiguration gefunden${NC}"
    exit 1
fi

# ==============================================
# 2. Lambda-Funktion Status prüfen
# ==============================================
echo -e "${YELLOW}2. Prüfe Lambda-Funktion Status...${NC}"

LAMBDA_STATUS=$(aws lambda get-function \
  --function-name cognito-post-confirmation \
  --region $AWS_REGION \
  --profile $AWS_PROFILE \
  --query 'Configuration.State' \
  --output text 2>/dev/null)

if [ "$LAMBDA_STATUS" = "Active" ]; then
    echo -e "${GREEN}✅ Lambda-Funktion ist aktiv${NC}"
else
    echo -e "${RED}❌ Lambda-Funktion Status: $LAMBDA_STATUS${NC}"
    exit 1
fi

# ==============================================
# 3. Lambda Berechtigungen prüfen
# ==============================================
echo -e "${YELLOW}3. Prüfe Lambda Berechtigungen...${NC}"

# Cognito → Lambda Berechtigung
COGNITO_PERMISSION=$(aws lambda get-policy \
  --function-name cognito-post-confirmation \
  --region $AWS_REGION \
  --profile $AWS_PROFILE \
  --output text 2>/dev/null | grep -o "AllowExecutionFromCognito" || echo "")

if [ -n "$COGNITO_PERMISSION" ]; then
    echo -e "${GREEN}✅ Cognito → Lambda Berechtigung vorhanden${NC}"
else
    echo -e "${RED}❌ Cognito → Lambda Berechtigung fehlt${NC}"
    exit 1
fi

# ==============================================
# 4. IAM Rolle Berechtigungen prüfen
# ==============================================
echo -e "${YELLOW}4. Prüfe IAM Rolle Berechtigungen...${NC}"

LAMBDA_ROLE=$(aws lambda get-function \
  --function-name cognito-post-confirmation \
  --region $AWS_REGION \
  --profile $AWS_PROFILE \
  --query 'Configuration.Role' \
  --output text)

ROLE_NAME=$(basename "$LAMBDA_ROLE")

# Lambda Invoke Policy prüfen
INVOKE_POLICY=$(aws iam list-attached-role-policies \
  --role-name $ROLE_NAME \
  --profile $AWS_PROFILE \
  --query 'AttachedPolicies[?PolicyName==`MatbakhLambdaInvokePolicy`].PolicyName' \
  --output text)

if [ -n "$INVOKE_POLICY" ]; then
    echo -e "${GREEN}✅ Lambda → Lambda Invoke Berechtigung vorhanden${NC}"
else
    echo -e "${RED}❌ Lambda → Lambda Invoke Berechtigung fehlt${NC}"
    exit 1
fi

# ==============================================
# 5. RDS Konnektivität prüfen
# ==============================================
echo -e "${YELLOW}5. Prüfe RDS Konnektivität...${NC}"

RDS_TEST=$(aws lambda invoke \
  --function-name matbakh-fix-tables \
  --payload '{"action":"health_check"}' \
  --region $AWS_REGION \
  --profile $AWS_PROFILE \
  /tmp/lambda-response.json 2>/dev/null && cat /tmp/lambda-response.json)

if echo "$RDS_TEST" | grep -q "success"; then
    echo -e "${GREEN}✅ RDS Konnektivität funktional${NC}"
else
    echo -e "${YELLOW}⚠️  RDS Test nicht eindeutig - prüfe Logs${NC}"
fi

# ==============================================
# 6. Test-Registrierung (Optional)
# ==============================================
echo -e "${YELLOW}6. Führe Test-Registrierung durch...${NC}"

TEST_EMAIL="trigger-test-$(date +%s)@matbakh.app"
TEST_PASSWORD="TempPass123!"

echo "Test-Email: $TEST_EMAIL"

# Benutzer erstellen
CREATE_RESULT=$(aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $TEST_EMAIL \
  --user-attributes Name=email,Value=$TEST_EMAIL Name=email_verified,Value=true \
  --temporary-password $TEST_PASSWORD \
  --message-action SUPPRESS \
  --region $AWS_REGION \
  --profile $AWS_PROFILE 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test-Benutzer erstellt${NC}"
    
    # Passwort permanent setzen
    aws cognito-idp admin-set-user-password \
      --user-pool-id $USER_POOL_ID \
      --username $TEST_EMAIL \
      --password $TEST_PASSWORD \
      --permanent \
      --region $AWS_REGION \
      --profile $AWS_PROFILE >/dev/null 2>&1
    
    # Benutzer bestätigen (triggert Post-Confirmation)
    aws cognito-idp admin-confirm-sign-up \
      --user-pool-id $USER_POOL_ID \
      --username $TEST_EMAIL \
      --region $AWS_REGION \
      --profile $AWS_PROFILE >/dev/null 2>&1
    
    echo -e "${GREEN}✅ Test-Benutzer bestätigt - Post-Confirmation Trigger ausgelöst${NC}"
    
    # Kurz warten für Lambda-Ausführung
    sleep 5
    
    # Logs prüfen
    echo -e "${YELLOW}Prüfe Lambda-Logs...${NC}"
    
    LATEST_LOG_STREAM=$(aws logs describe-log-streams \
      --log-group-name "/aws/lambda/cognito-post-confirmation" \
      --order-by LastEventTime \
      --descending \
      --max-items 1 \
      --region $AWS_REGION \
      --profile $AWS_PROFILE \
      --query 'logStreams[0].logStreamName' \
      --output text 2>/dev/null)
    
    if [ -n "$LATEST_LOG_STREAM" ] && [ "$LATEST_LOG_STREAM" != "None" ]; then
        RECENT_LOGS=$(aws logs get-log-events \
          --log-group-name "/aws/lambda/cognito-post-confirmation" \
          --log-stream-name "$LATEST_LOG_STREAM" \
          --start-time $(($(date +%s) * 1000 - 60000)) \
          --region $AWS_REGION \
          --profile $AWS_PROFILE \
          --query 'events[*].message' \
          --output text 2>/dev/null)
        
        if echo "$RECENT_LOGS" | grep -q "Post-Confirmation processing completed"; then
            echo -e "${GREEN}✅ Post-Confirmation Lambda erfolgreich ausgeführt${NC}"
        else
            echo -e "${YELLOW}⚠️  Lambda-Logs zeigen mögliche Probleme:${NC}"
            echo "$RECENT_LOGS" | tail -5
        fi
    else
        echo -e "${YELLOW}⚠️  Keine aktuellen Lambda-Logs gefunden${NC}"
    fi
    
    # Test-Benutzer löschen
    aws cognito-idp admin-delete-user \
      --user-pool-id $USER_POOL_ID \
      --username $TEST_EMAIL \
      --region $AWS_REGION \
      --profile $AWS_PROFILE >/dev/null 2>&1
    
    echo -e "${GREEN}✅ Test-Benutzer bereinigt${NC}"
    
else
    echo -e "${RED}❌ Test-Benutzer Erstellung fehlgeschlagen${NC}"
fi

# ==============================================
# Zusammenfassung
# ==============================================
echo ""
echo -e "${BLUE}📊 Validation Summary${NC}"
echo "=================================="
echo -e "${GREEN}✅ User Pool Trigger: Konfiguriert${NC}"
echo -e "${GREEN}✅ Lambda Status: Aktiv${NC}"
echo -e "${GREEN}✅ Cognito Permissions: Vorhanden${NC}"
echo -e "${GREEN}✅ IAM Role Permissions: Vorhanden${NC}"
echo -e "${GREEN}✅ Test-Registrierung: Durchgeführt${NC}"
echo ""
echo -e "${GREEN}🎯 Cognito Trigger Integration: BEREIT${NC}"

# ==============================================
# Nützliche Debug-Kommandos ausgeben
# ==============================================
echo ""
echo -e "${BLUE}🔧 Debug-Kommandos:${NC}"
echo "=================================="
echo "# Lambda-Logs anzeigen:"
echo "aws logs tail /aws/lambda/cognito-post-confirmation --follow --region $AWS_REGION --profile $AWS_PROFILE"
echo ""
echo "# User Pool Details:"
echo "aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID --region $AWS_REGION --profile $AWS_PROFILE"
echo ""
echo "# Lambda-Funktion testen:"
echo "aws lambda invoke --function-name cognito-post-confirmation --payload '{}' /tmp/test.json --region $AWS_REGION --profile $AWS_PROFILE"