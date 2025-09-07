# AWS Secrets Manager Inventory

## Übersicht
Dokumentation aller in AWS Secrets Manager gespeicherten Geheimnisse für die matbakh.app.

**Stand:** 30.08.2025  
**Region:** eu-central-1  
**Account:** 055062860590

## Gespeicherte Secrets

### 1. Database Secret
- **Name:** `matbakh-db-postgres`
- **ARN:** `arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-db-postgres-9G9xNP`
- **Beschreibung:** PostgreSQL database credentials for matbakh application
- **Typ:** Database Credentials
- **Inhalt:**
  ```json
  {
    "username": "postgres",
    "password": "[REDACTED]",
    "engine": "postgres",
    "host": "matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com",
    "port": 5432,
    "dbname": "matbakh",
    "dbInstanceIdentifier": "matbakh-db"
  }
  ```

### 2. Application Configuration Secret
- **Name:** `matbakh-app-config`
- **ARN:** `arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-app-config-[SUFFIX]`
- **Beschreibung:** Application configuration secrets for matbakh
- **Typ:** Application Configuration
- **Inhalt:**
  ```json
  {
    "cognito_user_pool_id": "eu-central-1_farFjTHKf",
    "cognito_user_pool_client_id": "[CLIENT_ID]",
    "jwt_secret": "[JWT_SECRET]",
    "api_gateway_url": "https://3eqcftz6lc.execute-api.eu-central-1.amazonaws.com",
    "environment": "production"
  }
  ```

## Zugriffskontrolle

### IAM Policies
- **Policy Name:** `MatbakhSecretsManagerAccess`
- **Policy ARN:** `arn:aws:iam::055062860590:policy/MatbakhSecretsManagerAccess`
- **Berechtigte Services:**
  - Lambda Functions (matbakh-*)
  - RDS Instances
  - API Gateway (für Proxy-Integration)

### Lambda Functions mit Secrets-Zugriff
1. **cognito-post-confirmation**
   - Zugriff auf: `matbakh-db-postgres`
   - Zweck: Benutzerprofile in Datenbank erstellen

2. **matbakh-fix-tables**
   - Zugriff auf: `matbakh-db-postgres`
   - Zweck: Datenbankschema-Korrekturen

3. **matbakh-db-test**
   - Zugriff auf: `matbakh-db-postgres`
   - Zweck: Datenbankverbindung testen

## Sicherheitsrichtlinien

### Verschlüsselung
- **At-Rest:** AWS KMS Standard-Verschlüsselung
- **In-Transit:** TLS 1.2+ für alle API-Calls
- **Access Logging:** CloudTrail Integration aktiv

### Rotation
- **Database Secret:** Manuelle Rotation (kann automatisiert werden)
- **Application Config:** Manuelle Updates bei Bedarf
- **Empfehlung:** Automatische Rotation für Produktionsumgebung einrichten

### Monitoring
- **CloudWatch Alarms:** Für ungewöhnliche Zugriffsmuster
- **CloudTrail Logs:** Alle Secrets-Zugriffe werden protokolliert
- **Access Patterns:** Regelmäßige Überprüfung der Zugriffsprotokolle

## Verwendung in Lambda Functions

### Code-Beispiel für Secrets-Abruf:
```javascript
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

async function getSecret(secretName) {
    const client = new SecretsManagerClient({ region: 'eu-central-1' });
    const command = new GetSecretValueCommand({ SecretId: secretName });
    
    try {
        const response = await client.send(command);
        return JSON.parse(response.SecretString);
    } catch (error) {
        console.error('Error retrieving secret:', error);
        throw error;
    }
}

// Verwendung
const dbConfig = await getSecret('matbakh-db-postgres');
```

## Backup & Recovery

### Backup-Strategie
- **Automatische Backups:** AWS Secrets Manager Standard-Backups
- **Cross-Region Replication:** Nicht konfiguriert (kann bei Bedarf aktiviert werden)
- **Version History:** Automatische Versionierung aktiv

### Recovery-Verfahren
1. **Secret Wiederherstellung:** Über AWS Console oder CLI
2. **Version Rollback:** Zu vorheriger Version zurückkehren
3. **Emergency Access:** Root-Account Zugriff als Fallback

## Kosten

### Aktuelle Kosten (geschätzt)
- **Secrets Storage:** ~$0.40/Monat pro Secret
- **API Calls:** ~$0.05/10.000 Calls
- **Gesamt:** ~$1/Monat für beide Secrets

### Kostenoptimierung
- Regelmäßige Überprüfung ungenutzter Secrets
- Konsolidierung ähnlicher Konfigurationen
- Monitoring der API-Call Häufigkeit

## Wartung & Updates

### Regelmäßige Aufgaben
- [ ] Monatliche Überprüfung der Zugriffsprotokolle
- [ ] Quartalsweise Rotation der Database-Credentials
- [ ] Jährliche Überprüfung der IAM-Berechtigungen

### Update-Verfahren
1. **Neue Secrets:** Über `infra/aws/store-secrets.sh` Script
2. **Updates:** AWS CLI oder Console
3. **Validation:** Funktionstest nach jeder Änderung

## Troubleshooting

### Häufige Probleme
1. **Access Denied:** IAM-Berechtigungen überprüfen
2. **Secret Not Found:** Secret-Name und Region validieren
3. **Parsing Error:** JSON-Format der Secret-Werte überprüfen

### Debug-Commands
```bash
# Secret abrufen
aws secretsmanager get-secret-value --secret-id matbakh-db-postgres --region eu-central-1

# Secret-Liste anzeigen
aws secretsmanager list-secrets --region eu-central-1

# Secret-Versionen anzeigen
aws secretsmanager describe-secret --secret-id matbakh-db-postgres --region eu-central-1
```

---

**Letzte Aktualisierung:** 30.08.2025  
**Verantwortlich:** Kiro AI Assistant  
**Review-Zyklus:** Monatlich