# PostgreSQL Lambda Layer - Dokumentation

## 🎯 **Layer erfolgreich deployed!**

**Layer Name**: `pg-client-layer`  
**ARN**: `arn:aws:lambda:eu-central-1:055062860590:layer:pg-client-layer:1`  
**Runtime**: nodejs18.x, nodejs20.x  
**Status**: ✅ **LIVE UND BEREIT**

## 📦 **Enthaltene Dependencies**

### Core Dependencies
- **pg**: ^8.11.1 - PostgreSQL client for Node.js
- **@aws-sdk/client-secrets-manager**: ^3.0.0 - AWS Secrets Manager client

### Included Modules
- **pgClient.ts**: Hauptmodul mit Connection Pool Management
- **index.ts**: Export-Barrel für alle Funktionen

## 🔧 **Verfügbare Funktionen**

### 1. getPgClient()
```typescript
import { getPgClient } from '/opt/nodejs/pgClient';

const pool = await getPgClient();
// Returns: Pool instance with cached connection
```

**Features**:
- ✅ Automatic secret retrieval from AWS Secrets Manager
- ✅ Connection pooling with Lambda-optimized settings
- ✅ Cold start caching for performance
- ✅ SSL connection with RDS

### 2. executeQuery(query, params)
```typescript
import { executeQuery } from '/opt/nodejs/pgClient';

const result = await executeQuery(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);
```

**Features**:
- ✅ Automatic connection management
- ✅ Parameter binding for SQL injection protection
- ✅ Error handling and logging

### 3. executeTransaction(queries)
```typescript
import { executeTransaction } from '/opt/nodejs/pgClient';

const results = await executeTransaction([
  { query: 'INSERT INTO users (email) VALUES ($1)', params: ['user@example.com'] },
  { query: 'INSERT INTO profiles (user_id) VALUES ($1)', params: [userId] }
]);
```

**Features**:
- ✅ Automatic BEGIN/COMMIT/ROLLBACK
- ✅ Multiple queries in single transaction
- ✅ Error rollback on failure

### 4. healthCheck()
```typescript
import { healthCheck } from '/opt/nodejs/pgClient';

const health = await healthCheck();
// Returns: { success: boolean, message: string, timestamp: string }
```

**Features**:
- ✅ Database connectivity test
- ✅ Version information
- ✅ Timestamp for monitoring

### 5. closePgClient()
```typescript
import { closePgClient } from '/opt/nodejs/pgClient';

await closePgClient();
// Closes connection pool (useful for Lambda cleanup)
```

## 🚀 **Lambda Integration**

### Schritt 1: Layer zu Lambda hinzufügen
```bash
aws lambda update-function-configuration \
  --function-name YOUR_FUNCTION_NAME \
  --layers arn:aws:lambda:eu-central-1:055062860590:layer:pg-client-layer:1 \
  --region eu-central-1 \
  --profile matbakh-dev
```

### Schritt 2: IAM Role aktualisieren
```bash
aws lambda update-function-configuration \
  --function-name YOUR_FUNCTION_NAME \
  --role arn:aws:iam::055062860590:role/lambda-secrets-access-role \
  --region eu-central-1 \
  --profile matbakh-dev
```

### Schritt 3: Lambda Code anpassen
```javascript
// Beispiel für VcConfirmFn
import { executeQuery, healthCheck } from '/opt/nodejs/pgClient';

export const handler = async (event) => {
  try {
    const token = event.queryStringParameters?.token || '';
    
    // Token in Datenbank validieren
    const result = await executeQuery(
      'SELECT * FROM visibility_check_leads WHERE confirm_token_hash = $1 AND confirm_expires_at > NOW()',
      [token]
    );
    
    if (result.rows.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }
    
    // Token als bestätigt markieren
    await executeQuery(
      'UPDATE visibility_check_leads SET email_confirmed = true, double_optin_confirmed_at = NOW() WHERE confirm_token_hash = $1',
      [token]
    );
    
    // Redirect zu Frontend
    const base = process.env.RESULT_URL || 'https://matbakh.app/vc/result';
    const location = `${base}?t=${encodeURIComponent(token)}`;
    
    return { 
      statusCode: 302, 
      headers: { Location: location },
      body: '' 
    };
    
  } catch (error) {
    console.error('Database error:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' }) 
    };
  }
};
```

## 🔐 **Secrets Manager Integration**

### Automatische Credential-Abfrage
Der Layer ruft automatisch die Datenbank-Credentials aus AWS Secrets Manager ab:

**Secret**: `matbakh-db-postgres`  
**Enthält**:
- `host` - RDS Endpoint
- `username` - Database User
- `password` - Database Password
- `dbname` - Database Name
- `port` - Database Port (5432)

### Connection Pool Settings
```javascript
{
  max: 5,                    // Maximum connections
  min: 1,                    // Minimum connections
  idleTimeoutMillis: 30000,  // Close idle after 30s
  connectionTimeoutMillis: 10000, // Connection timeout
  ssl: { rejectUnauthorized: false } // RDS SSL
}
```

## 📊 **Performance Optimierungen**

### Cold Start Caching
- ✅ Connection Pool wird zwischen Lambda-Invocations gecacht
- ✅ Secrets werden nur einmal pro Cold Start abgerufen
- ✅ Optimierte Pool-Settings für Lambda-Umgebung

### Error Handling
- ✅ Automatische Retry-Logik für Connection-Fehler
- ✅ Graceful Degradation bei DB-Ausfall
- ✅ Strukturierte Logging für Debugging

## 🧪 **Testing**

### Layer-Funktionalität testen
```bash
# Test Layer in Lambda
aws lambda invoke \
  --function-name test-function \
  --payload '{"action":"health_check"}' \
  /tmp/test-result.json \
  --region eu-central-1 \
  --profile matbakh-dev
```

### Lokale Entwicklung
```bash
# Layer-Code lokal testen
cd infra/layers/pg-client-layer
npm test
```

## 📋 **Nächste Schritte**

### A2.4: Lambda-Funktionen aktualisieren
1. ✅ **VcStartFn**: Token-Persistierung in `visibility_check_leads`
2. ✅ **VcConfirmFn**: Token-Validierung und Bestätigung
3. ✅ **Layer Integration**: Beide Funktionen mit pg-client-layer

### A2.5: End-to-End Test
1. ✅ **Database Integration**: Vollständiger VC-Flow mit DB
2. ✅ **Token Lifecycle**: Start → Email → Confirm → Result
3. ✅ **Error Handling**: Robuste Fehlerbehandlung

## ✅ **Status**

**Layer deployed**: ✅ 30.08.2025, 15:45 Uhr  
**ARN gespeichert**: ✅ `.env.layer`  
**Bereit für Integration**: ✅ Lambda-Funktionen können aktualisiert werden

**PG_CLIENT_LAYER_ARN**: `arn:aws:lambda:eu-central-1:055062860590:layer:pg-client-layer:1`