# Quick Fixes - Häufige Probleme und Sofortlösungen

## 🚨 Kritische Probleme (Sofort beheben)

### Email landet im Spam
**Problem:** DOI-Emails werden als Spam markiert
**Sofortlösung:**
```bash
# 1. Prüfe Resend Domain Status
curl -H "Authorization: Bearer $RESEND_API_KEY" https://api.resend.com/domains

# 2. Wenn Domain nicht verifiziert, füge DNS Records hinzu
# 3. Verwende optimierte Email-Templates (siehe email-delivery/resend-integration.md)
```

### API Gateway 403 Fehler
**Problem:** HEAD requests werden nicht unterstützt
**Sofortlösung:**
```bash
# Verwende GET statt HEAD für Tests
curl -i "https://guf7ho7bze.execute-api.eu-central-1.amazonaws.com/prod/vc/confirm?t=TOKEN"
```

### Lambda kann Secrets nicht lesen
**Problem:** IAM Permissions fehlen
**Sofortlösung:**
```bash
# Füge Secrets Manager Policy hinzu
aws iam put-role-policy \
  --role-name matbakh-lambda-execution-role \
  --policy-name SecretsManagerAccess \
  --policy-document file://lambda-secrets-inline-policy.json
```

## ⚠️ Häufige Probleme (Mittlere Priorität)

### Lambda Timeout in VPC
**Problem:** Lambda kann externe APIs nicht erreichen
**Sofortlösung:**
```bash
# Option 1: Entferne VPC (nur Development)
aws lambda update-function-configuration \
  --function-name FUNCTION-NAME \
  --vpc-config '{}'

# Option 2: Füge NAT Gateway hinzu (Production)
# Siehe infrastructure/vpc-lambda-integration.md
```

### RDS Connection Failed
**Problem:** Lambda kann nicht zur Datenbank verbinden
**Sofortlösung:**
```bash
# 1. Prüfe Security Groups
aws ec2 describe-security-groups --group-ids sg-RDS-ID

# 2. Teste Connection String
# 3. Prüfe SSL Konfiguration (siehe database/rds-connection-troubleshooting.md)
```

### Cognito Authentication Fehler
**Problem:** Pre-Auth Trigger schlägt fehl
**Sofortlösung:**
```bash
# Prüfe CloudWatch Logs
aws logs tail "/aws/lambda/matbakh-cognito-pre-auth-trigger" --follow

# Stelle sicher, dass User in profiles Tabelle existiert
```

## 🔧 Entwicklungs-Probleme (Niedrige Priorität)

### Environment Variables fehlen
**Sofortlösung:**
```bash
# Kopiere .env.template zu .env.lambda
cp .env.lambda.template .env.lambda

# Fülle alle Werte aus
```

### Build Fehler
**Sofortlösung:**
```bash
# Installiere Dependencies neu
npm ci

# Prüfe Node.js Version (sollte 18.x sein)
node --version
```

## 📋 Debugging Checkliste

### Vor jedem Deployment
- [ ] Environment Variables gesetzt
- [ ] IAM Permissions korrekt
- [ ] Security Groups konfiguriert
- [ ] Secrets Manager Zugriff getestet
- [ ] Email Templates validiert

### Nach Fehlern
- [ ] CloudWatch Logs geprüft
- [ ] API Gateway Logs aktiviert
- [ ] RDS Connection getestet
- [ ] Email Delivery Status geprüft
- [ ] Cognito User Pool Status geprüft

## 🔗 Weiterführende Dokumentation

- **Email Issues:** `email-delivery/`
- **API Gateway:** `api-gateway/`
- **Lambda Functions:** `lambda-functions/`
- **Database:** `database/`
- **Authentication:** `authentication/`
- **Infrastructure:** `infrastructure/`

## 📞 Eskalation

Bei kritischen Problemen, die nicht mit diesen Quick Fixes gelöst werden können:
1. Dokumentiere das Problem in der entsprechenden Kategorie
2. Erstelle detaillierte Logs
3. Prüfe alle verwandten Services
4. Erstelle einen neuen Debugging-Guide für zukünftige Referenz