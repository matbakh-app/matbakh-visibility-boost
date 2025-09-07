# IAM Lambda Secrets Access Role - Dokumentation

## 🎯 **Übersicht**

**Rolle**: `lambda-secrets-access-role`  
**ARN**: `arn:aws:iam::055062860590:role/lambda-secrets-access-role`  
**Zweck**: Sichere IAM-Rolle für Lambda-Funktionen mit Zugriff auf RDS-Secrets und VPC-Netzwerk

## 🔐 **Berechtigungen**

### 1. Secrets Manager Access
```json
{
  "Sid": "SecretsAccess",
  "Effect": "Allow",
  "Action": [
    "secretsmanager:GetSecretValue"
  ],
  "Resource": [
    "arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-db-postgres*"
  ]
}
```

### 2. CloudWatch Logs
```json
{
  "Sid": "CloudWatchLogs",
  "Effect": "Allow",
  "Action": [
    "logs:CreateLogGroup",
    "logs:CreateLogStream", 
    "logs:PutLogEvents"
  ],
  "Resource": "*"
}
```

### 3. VPC Network Interface Management
```json
{
  "Sid": "VPCNetworkInterface",
  "Effect": "Allow",
  "Action": [
    "ec2:CreateNetworkInterface",
    "ec2:DescribeNetworkInterfaces",
    "ec2:DeleteNetworkInterface",
    "ec2:AttachNetworkInterface",
    "ec2:DetachNetworkInterface"
  ],
  "Resource": "*"
}
```

## 📦 **Verfügbare Secrets**

### matbakh-db-postgres
**ARN**: `arn:aws:secretsmanager:eu-central-1:055062860590:secret:matbakh-db-postgres-9G9xNP`

**Verfügbare Keys**:
- `host` - RDS Endpoint
- `port` - Database Port (5432)
- `dbname` - Database Name
- `username` - Database User
- `password` - Database Password
- `engine` - Database Engine (postgres)
- `dbInstanceIdentifier` - RDS Instance ID

## 🚀 **Verwendung in Lambda-Funktionen**

### Node.js Beispiel
```javascript
import AWS from 'aws-sdk';

const secretsManager = new AWS.SecretsManager({ region: 'eu-central-1' });

async function getDatabaseCredentials() {
  try {
    const result = await secretsManager.getSecretValue({
      SecretId: 'matbakh-db-postgres'
    }).promise();
    
    return JSON.parse(result.SecretString);
  } catch (error) {
    console.error('Failed to retrieve database credentials:', error);
    throw error;
  }
}

// Verwendung
const dbCredentials = await getDatabaseCredentials();
const connectionString = `postgresql://${dbCredentials.username}:${dbCredentials.password}@${dbCredentials.host}:${dbCredentials.port}/${dbCredentials.dbname}`;
```

### TypeScript Beispiel
```typescript
import { SecretsManager } from 'aws-sdk';

interface DatabaseCredentials {
  host: string;
  port: number;
  dbname: string;
  username: string;
  password: string;
  engine: string;
  dbInstanceIdentifier: string;
}

const secretsManager = new SecretsManager({ region: 'eu-central-1' });

export async function getDatabaseCredentials(): Promise<DatabaseCredentials> {
  const result = await secretsManager.getSecretValue({
    SecretId: 'matbakh-db-postgres'
  }).promise();
  
  return JSON.parse(result.SecretString!) as DatabaseCredentials;
}
```

## 🔧 **Lambda-Funktionen aktualisieren**

### Automatisches Update Script
```bash
./infra/aws/update-lambda-roles.sh
```

### Manuelles Update
```bash
aws lambda update-function-configuration \
  --function-name <FUNCTION_NAME> \
  --role arn:aws:iam::055062860590:role/lambda-secrets-access-role \
  --region eu-central-1 \
  --profile matbakh-dev
```

## 📊 **Betroffene Lambda-Funktionen**

| Funktion | Aktueller Status | Empfehlung |
|----------|------------------|------------|
| **VcStartFn** | CDK Service Role | ✅ Update für DB-Integration |
| **VcConfirmFn** | CDK Service Role | ✅ Update für DB-Integration |
| **cognito-post-confirmation** | MatbakhLambdaExecutionRole | 🔄 Optional Update |
| **matbakh-fix-tables** | MatbakhLambdaExecutionRole | 🔄 Bereits konfiguriert |

## 🧪 **Testing**

### Secrets Access Test
```bash
# Test Secret Retrieval
aws secretsmanager get-secret-value \
  --secret-id matbakh-db-postgres \
  --region eu-central-1 \
  --profile matbakh-dev
```

### Lambda Function Test
```bash
# Test Lambda with new role
aws lambda invoke \
  --function-name MatbakhVcStack-VcStartFnC5BAD875-Lukpaun5TO53 \
  --payload '{}' \
  /tmp/test-result.json \
  --region eu-central-1 \
  --profile matbakh-dev
```

## 🔒 **Sicherheitshinweise**

1. **Least Privilege**: Rolle hat nur Zugriff auf spezifische Secrets
2. **Resource-based**: Secrets-Zugriff ist auf `matbakh-db-postgres*` beschränkt
3. **VPC Integration**: Unterstützt sichere Datenbankverbindungen im VPC
4. **Logging**: Vollständige CloudWatch-Integration für Monitoring

## 📈 **Nächste Schritte**

### A2.3: Lambda Layer für PostgreSQL
- PostgreSQL Client Library (pg, pg-pool)
- Shared Database Connection Logic
- Error Handling & Retry Logic

### A2.4: Database Integration
- Token-Persistierung in `visibility_check_leads`
- TTL-basierte Token-Validierung
- Audit-Logging für Sicherheit

## ✅ **Status**

**Rolle erstellt**: ✅ 30.08.2025, 15:39 Uhr  
**Berechtigungen getestet**: ✅ Secrets-Zugriff funktional  
**Bereit für Deployment**: ✅ Lambda-Funktionen können aktualisiert werden

**Nächster Schritt**: A2.3 - Lambda Layer für PostgreSQL & Secret Injection