#!/bin/bash

# ==============================================
# Update Lambda Roles to use Secrets Access Role
# ==============================================

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
NEW_ROLE_ARN="arn:aws:iam::055062860590:role/lambda-secrets-access-role"

echo -e "${BLUE}🔐 Lambda Roles Update Script${NC}"
echo "=================================="
echo "Profile: $AWS_PROFILE"
echo "Region: $AWS_REGION"
echo "New Role: $NEW_ROLE_ARN"
echo ""

# ==============================================
# Funktion: Lambda-Rolle aktualisieren
# ==============================================
update_lambda_role() {
    local function_name=$1
    local current_role=$2
    
    echo -e "${YELLOW}Updating $function_name...${NC}"
    
    # Aktuelle Rolle anzeigen
    echo "Current Role: $current_role"
    echo "New Role: $NEW_ROLE_ARN"
    
    # Rolle aktualisieren
    aws lambda update-function-configuration \
        --function-name "$function_name" \
        --role "$NEW_ROLE_ARN" \
        --region "$AWS_REGION" \
        --profile "$AWS_PROFILE" \
        --output table \
        --query '{FunctionName:FunctionName,Role:Role,LastModified:LastModified}'
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $function_name role updated successfully${NC}"
    else
        echo -e "${RED}❌ Failed to update $function_name role${NC}"
        return 1
    fi
    
    echo ""
}

# ==============================================
# Lambda-Funktionen identifizieren und aktualisieren
# ==============================================
echo -e "${YELLOW}Identifying Lambda functions...${NC}"

# VcStartFn aktualisieren
VCSTART_FUNCTION="MatbakhVcStack-VcStartFnC5BAD875-Lukpaun5TO53"
VCSTART_CURRENT_ROLE=$(aws lambda get-function \
    --function-name "$VCSTART_FUNCTION" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --query 'Configuration.Role' \
    --output text 2>/dev/null)

if [ -n "$VCSTART_CURRENT_ROLE" ]; then
    update_lambda_role "$VCSTART_FUNCTION" "$VCSTART_CURRENT_ROLE"
else
    echo -e "${RED}❌ VcStartFn not found${NC}"
fi

# VcConfirmFn aktualisieren
VCCONFIRM_FUNCTION="MatbakhVcStack-VcConfirmFnBC142FAD-E7kmx3KDgRRX"
VCCONFIRM_CURRENT_ROLE=$(aws lambda get-function \
    --function-name "$VCCONFIRM_FUNCTION" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --query 'Configuration.Role' \
    --output text 2>/dev/null)

if [ -n "$VCCONFIRM_CURRENT_ROLE" ]; then
    update_lambda_role "$VCCONFIRM_FUNCTION" "$VCCONFIRM_CURRENT_ROLE"
else
    echo -e "${RED}❌ VcConfirmFn not found${NC}"
fi

# ==============================================
# Weitere Lambda-Funktionen (optional)
# ==============================================
echo -e "${YELLOW}Checking other Lambda functions...${NC}"

# cognito-post-confirmation
COGNITO_FUNCTION="cognito-post-confirmation"
COGNITO_CURRENT_ROLE=$(aws lambda get-function \
    --function-name "$COGNITO_FUNCTION" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE" \
    --query 'Configuration.Role' \
    --output text 2>/dev/null)

if [ -n "$COGNITO_CURRENT_ROLE" ]; then
    echo "Found: $COGNITO_FUNCTION (Current Role: $COGNITO_CURRENT_ROLE)"
    read -p "Update cognito-post-confirmation role? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        update_lambda_role "$COGNITO_FUNCTION" "$COGNITO_CURRENT_ROLE"
    fi
else
    echo -e "${YELLOW}⚠️  cognito-post-confirmation not found or not accessible${NC}"
fi

# ==============================================
# Zusammenfassung
# ==============================================
echo ""
echo -e "${BLUE}📊 Update Summary${NC}"
echo "=================================="
echo -e "${GREEN}✅ New Role Created: lambda-secrets-access-role${NC}"
echo -e "${GREEN}✅ Permissions: Secrets Manager + CloudWatch + VPC${NC}"
echo -e "${GREEN}✅ Ready for Database Integration${NC}"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo "1. Test Lambda functions with new role"
echo "2. Implement database connectivity in Lambda code"
echo "3. Deploy updated Lambda functions"
echo ""
echo -e "${BLUE}🧪 Test Commands:${NC}"
echo "# Test VcStartFn"
echo "aws lambda invoke --function-name $VCSTART_FUNCTION --payload '{}' /tmp/test-start.json --region $AWS_REGION --profile $AWS_PROFILE"
echo ""
echo "# Test VcConfirmFn"  
echo "aws lambda invoke --function-name $VCCONFIRM_FUNCTION --payload '{}' /tmp/test-confirm.json --region $AWS_REGION --profile $AWS_PROFILE"