# Lambda Functions Status Report

## 🎯 Übersicht
Status der Cognito-Integration Lambda-Funktionen nach Trigger-Reparatur.

## 📦 Lambda-Funktionen

### 1. cognito-post-confirmation
**Status**: ✅ Konfiguriert und berechtigt  
**ARN**: `arn:aws:lambda:eu-central-1:055062860590:function:cognito-post-confirmation`  
**Rolle**: `MatbakhLambdaExecutionRole`

**Funktionalität**:
- Empfängt Cognito Post-Confirmation Events
- Validiert Event-Struktur robust
- Ruft `matbakh-fix-tables` Lambda auf
- Erstellt Benutzerprofil in RDS

**Code-Features**:
```typescript
// Robuste Event-Validierung
if (!event || !event.request || !event.request.userAttributes) {
    console.error('Invalid event structure:', event);
    return event;
}

// Strukturierte Payload für fix-tables
const payload = {
    action: 'create_user_profile',
    userAttributes: {
        sub: userAttributes.sub,
        email: userAttributes.email,
        given_name: userAttributes.given_name || null,
        family_name: userAttributes.family_name || null,
        user_role: userAttributes['custom:user_role'] || 'owner',
        locale: userAttributes['custom:locale'] || 'de'
    }
};
```

**Berechtigungen**:
- ✅ Cognito darf Lambda aufrufen (`AllowExecutionFromCognito`)
- ✅ Lambda darf `matbakh-fix-tables` aufrufen (`MatbakhLambdaInvokePolicy`)

### 2. matbakh-fix-tables
**Status**: ✅ Updated und deployed  
**ARN**: `arn:aws:lambda:eu-central-1:055062860590:function:matbakh-fix-tables`

**Funktionalität**:
- Empfängt `create_user_profile` Action
- Erstellt Eintrag in `user_profiles` Tabelle
- Unterstützt verschiedene Datenquellen

**Erweiterte Features** (bereit für Implementierung):
```typescript
// user_profiles.created_from Tracking
created_from: 'cognito' | 'supabase' | 'migration'

// Onboarding Step Integration
onboarding_step: 'registration_complete'
```

## 🔧 Cognito Integration

### User Pool Konfiguration
**User Pool ID**: `eu-central-1_farFjTHKf`  
**Trigger**: Post-Confirmation → `cognito-post-confirmation`

### IAM Berechtigungen
**Rolle**: `MatbakhLambdaExecutionRole`  
**Policies**:
- `AWSLambdaBasicExecutionRole` (AWS Managed)
- `AWSLambdaVPCAccessExecutionRole` (AWS Managed)  
- `MatbakhSecretsManagerAccess` (Custom)
- `MatbakhLambdaRDSVPCAccess` (Custom)
- `MatbakhLambdaInvokePolicy` (Custom) ← **NEU HINZUGEFÜGT**

## 🚀 Deployment-Bereit

### Für neue Lambda-Deployments:
```bash
# Build & Deploy post-confirmation
cd infra/lambdas/cognito
zip -r ../../../cognito-post-confirmation.zip .
aws lambda update-function-code \
  --function-name cognito-post-confirmation \
  --zip-file fileb://cognito-post-confirmation.zip \
  --region eu-central-1 \
  --profile matbakh-dev
```

### Environment Variables (bereit):
- `MATBAKH_DB_HOST`: RDS Endpoint
- `MATBAKH_DB_USER`: Database User  
- `MATBAKH_DB_NAME`: Database Name
- `MATBAKH_DB_PASSWORD`: Via Secrets Manager

## 📊 Nächste Erweiterungen

### user_profiles Erweiterungen:
```sql
-- Tracking der Registrierungsquelle
ALTER TABLE user_profiles ADD COLUMN created_from TEXT DEFAULT 'cognito';

-- Onboarding Status
ALTER TABLE user_profiles ADD COLUMN onboarding_step TEXT DEFAULT 'registration_complete';
```

### Lambda Erweiterungen:
- Retry-Mechanismus für fehlgeschlagene Profile-Erstellung
- Detailed Logging für Debugging
- Integration mit onboarding_steps Tabelle

## ✅ Status: BEREIT FÜR TESTS
Alle Komponenten konfiguriert, Berechtigungen gesetzt, Code robust implementiert.