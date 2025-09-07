# Requirements Document - S3 File Storage Migration (Phase A4)

## Introduction

Diese Spezifikation definiert die vollständige Migration aller Dateispeicher-Funktionalitäten von Supabase Storage zu AWS S3. Nach Abschluss dieser Phase können alle Supabase-Abhängigkeiten entfernt werden, da alle Uploads, Avatare, Screenshots und AI-generierte PDFs ausschließlich über S3 verwaltet werden.

**Ziel:** Eine saubere, zukunftsfähige und vollständige Datei‑/Upload‑Infrastruktur auf AWS zu spezifizieren, die Supabase vollständig ersetzt und DSGVO-konform, sicher und skalierbar funktioniert.

## Aktueller Stand (Kontext)

### ✅ Bereits in AWS erledigt:
- **RDS (PostgreSQL 15.14)** instanziiert (matbakh-db) - Endpoint: matbakh-db.chq6q4cs0evx.eu-central-1.rds.amazonaws.com
- **Secrets Manager** Secret matbakh-db-postgres vorhanden
- **Lambda-Funktionen** deployed:
  - AuthCallbackFn (auth-callback.handler)
  - matbakh-db-test (mit pg-client-layer)
  - ses-events-worker (Python 3.12)
  - VcStartFn, VcConfirmFn (aus Kontext)
- **SES** konfiguriert & verbunden (DOI-Mails über Lambda)
- **VPC-Integration** konfiguriert (vpc-0c72fab3273a1be4f)
- **CloudWatch Logging**, SubnetGroup, Security Groups konfiguriert
- **Layer** pg-client-layer:1 für PostgreSQL-Verbindungen

### 📁 Frontend-Struktur (React + TypeScript):
```
src/
├── main.tsx                    # Entry Point
├── App.tsx                     # Haupt-App mit Routing
├── pages/                      # Alle Seiten/Pages
├── components/                 # Wiederverwendbare Komponenten
│   ├── ui/                     # shadcn/ui Komponenten
│   ├── auth/                   # Auth-Komponenten
│   ├── visibility/             # VC-Komponenten
│   └── admin/                  # Admin-Panel
├── lib/                        # Utilities und Helper
├── contexts/                   # React Contexts
├── hooks/                      # Custom React Hooks
├── integrations/supabase/      # 🚨 ZU MIGRIEREN
└── figma-make/                 # Figma-Komponenten
```

### 🔍 Supabase-Abhängigkeiten (zu migrieren):
- **Auth**: 47 Dateien nutzen `supabase.auth.*`
- **Database**: 35 Dateien nutzen `supabase.from()`
- **Functions**: 15 Dateien nutzen `supabase.functions.invoke()`
- **Storage**: Aktuell keine direkten Storage-Calls gefunden (gut!)
- **Client**: `src/integrations/supabase/client.ts` - Zentrale Konfiguration

### 🎯 Ziel Phase A4:
**Vollständige Migration von Supabase Storage zu AWS S3**, sodass Supabase komplett abgeschaltet werden kann. Fokus auf Dateien-Migration - andere Supabase-Abhängigkeiten werden in separaten Phasen behandelt.

## Requirements

### Requirement 1: S3 Bucket Infrastructure & Dateitypen

**User Story:** Als System-Administrator möchte ich eine strukturierte S3-Bucket-Architektur mit definierten Dateitypen, damit alle Dateien sicher und organisiert gespeichert werden.

#### Acceptance Criteria

1. WHEN die S3-Infrastruktur erstellt wird THEN SHALL das System drei separate Buckets mit spezifischen Zwecken bereitstellen:

| Typ | Beispiele | Zugriff | Bucket | Lebensdauer |
|-----|-----------|---------|--------|-------------|
| User Uploads | Bilder, PDF-Dateien, AI-generierte Inhalte | privat | matbakh-files-uploads | dauerhaft |
| Profile Media | Avatare, Logos, CM-Bilder | halb-öffentlich | matbakh-files-profile | dauerhaft |
| Generated Reports | VC Reports, PDFs, Snapshots | öffentlich über Link | matbakh-files-reports | 14–30 Tage |

2. WHEN ein S3-Bucket erstellt wird THEN SHALL das System folgende Sicherheitseinstellungen aktivieren:
   - Server-side encryption (SSE-S3)
   - Public Access Blocked (für uploads & profile)
   - reports kann Leserechte für CloudFront erhalten
   - CORS-Policy: `[{"AllowedOrigins": ["https://matbakh.app"], "AllowedMethods": ["GET", "PUT", "HEAD"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3000, "ExposeHeaders": ["ETag"]}]`

3. WHEN Lifecycle Rules konfiguriert werden THEN SHALL das System folgende Regeln implementieren:
   - uploads: keine automatische Löschung
   - profile: keine Löschung  
   - reports: automatisch löschen nach 30 Tagen
   - reports/tmp/: optional nach 7 Tagen löschen

4. WHEN die Infrastruktur bereitgestellt wird THEN SHALL das System CloudFormation/CDK Stack für Wiederholbarkeit verwenden

5. WHEN Buckets erstellt werden THEN SHALL das System Tags versehen: `project: matbakh, env: prod`

### Requirement 2: Presigned URL Service & IAM-Sicherheit

**User Story:** Als Entwickler möchte ich einen sicheren Upload-Service über Presigned URLs, damit Dateien direkt vom Frontend zu S3 hochgeladen werden können ohne Backend-Durchleitung.

#### Acceptance Criteria

1. WHEN eine Presigned URL angefordert wird THEN SHALL die Lambda-Funktion folgende Input-Parameter akzeptieren:
```json
{
  "bucket": "matbakh-files-uploads",
  "filename": "1234-abc.jpg", 
  "contentType": "image/jpeg",
  "folder": "user-uploads/"
}
```

2. WHEN eine gültige Anfrage gestellt wird THEN SHALL das System folgende Response zurückgeben:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...signed...",
  "fileUrl": "s3://.../user-uploads/1234-abc.jpg",
  "publicUrl": "https://matbakh.app/files/user-uploads/1234-abc.jpg"
}
```

3. WHEN die Lambda-Funktion deployed wird THEN SHALL sie als "matbakh-get-presigned-url" verfügbar sein

4. WHEN IAM-Policies konfiguriert werden THEN SHALL das System folgende Zugriffslogik implementieren:

| Rolle | Berechtigung | Anmerkung |
|-------|--------------|-----------|
| Lambda (Upload URL) | s3:PutObject auf alle Buckets | signiert mit zeitlichem Token |
| Lambda (Serve File) | s3:GetObject auf reports | optional: CloudFront Integration |
| Admins | s3:ListBucket + Logs lesen | über Konsole |
| CloudFront | Leserechte via Origin Access ID | Für öffentliche Downloads |

5. WHEN Presigned URLs generiert werden THEN SHALL das System eine maximale Gültigkeitsdauer von 15 Minuten für Uploads und 24h für Downloads setzen

### Requirement 3: Frontend Upload Migration & UX

**User Story:** Als Frontend-Entwickler möchte ich alle Supabase Storage Calls durch S3-Uploads ersetzen, damit das Frontend unabhängig von Supabase funktioniert.

#### Acceptance Criteria

1. WHEN Supabase Storage Calls entfernt werden THEN SHALL das System alle `supabase.storage.*` Aufrufe eliminieren

2. WHEN ein Upload durchgeführt wird THEN SHALL das System `fetch(uploadUrl, { method: 'PUT' })` verwenden

3. WHEN Bilder geladen werden THEN SHALL das System `src=fileUrl` für alle Avatare und Logos verwenden

4. WHEN Upload-Komponenten aktualisiert werden THEN SHALL das System folgende Komponenten bereitstellen:
   - ImageUpload (für Bilder)
   - FileInput (für allgemeine Dateien)

5. WHEN Custom Hooks implementiert werden THEN SHALL das System folgende Hooks bereitstellen:
   - useS3Upload (für Upload-Funktionalität mit Axios oder native fetch)
   - useAvatar (für Avatar-Management)

6. WHEN die S3-Upload-Library erstellt wird THEN SHALL sie unter `src/lib/s3-upload.ts` verfügbar sein

7. WHEN Upload-UX implementiert wird THEN SHALL das System folgende Features bereitstellen:
   - Fortschrittsanzeige (ProgressBar oder Spinner)
   - MIME-Type & Dateigröße Validierung (max. 10 MB)
   - Vorschau für Bilder und PDFs
   - OnSuccess: Speichere fileUrl in RDS

8. WHEN Drag & Drop implementiert wird THEN SHALL das System Multi-Upload für CM/Admins unterstützen

### Requirement 4: Datenmodell Migration & RDS Schema

**User Story:** Als Backend-Entwickler möchte ich die Datenbank-Schemas von Supabase-Pfaden auf S3-URLs migrieren, damit alle Dateireferenzen korrekt funktionieren.

#### Acceptance Criteria

1. WHEN Datenbank-Schemas aktualisiert werden THEN SHALL das System folgende Feldänderungen vornehmen:
   - `storage_path` → `s3_file_url`
   - Optional: `bucket_name`, `folder`, `file_name` Felder hinzufügen

2. WHEN neue Upload-Tabellen erstellt werden THEN SHALL das System folgendes Schema implementieren:
```sql
CREATE TABLE user_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  s3_url TEXT NOT NULL,
  content_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false
);
```

3. WHEN Backend-Queries angepasst werden THEN SHALL das System alle Datei-Abfragen über S3 URLs durchführen

4. WHEN Reports abgerufen werden THEN SHALL das System S3 URLs für PDF-Zugriff verwenden

5. WHEN Metadaten gespeichert werden THEN SHALL das System Tabellen wie `user_uploads`, `business_profiles`, `visibility_check_reports` mit S3-Referenzen verwenden

### Requirement 5: Security & DSGVO-Compliance

**User Story:** Als Compliance-Officer möchte ich sicherstellen, dass alle Uploads DSGVO-konform und sicher sind, damit rechtliche Anforderungen erfüllt werden.

#### Acceptance Criteria

1. WHEN private Daten gespeichert werden THEN SHALL das System folgende DSGVO-Regel enforzen: Private Daten (personenbezogene Uploads) dürfen nur über signierte URLs ausgeliefert werden

2. WHEN Dateien hochgeladen werden THEN SHALL das System Dateigrößen-Limits enforzen

3. WHEN sensible Daten gespeichert werden THEN SHALL das System Server-side Encryption verwenden

4. WHEN User-Daten verarbeitet werden THEN SHALL das System DSGVO-konforme Löschfunktionen bereitstellen:
   - Kein direkter Zugriff auf private Dateien ohne Auth (Presigned + RoleCheck)
   - Möglichkeit zur Datenlöschung je Nutzer (Recht auf Vergessen)
   - Audit-Logs über Zugriffe (bei Admin-Download via CloudTrail)
   - Download-Zeitfenster auf max. 24h begrenzen (Presigned TTL)

5. WHEN Audit-Logs aktiviert werden THEN SHALL das System CloudTrail für Nachweis von Zugriffen verwenden

6. WHEN Access-Logs benötigt werden THEN SHALL das System optional S3 Access Logs auf separaten Bucket aktivieren

### Requirement 6: Performance & CDN Integration

**User Story:** Als End-User möchte ich schnelle Ladezeiten für Bilder und Dateien, damit die Anwendung performant bleibt.

#### Acceptance Criteria

1. WHEN Dateien ausgeliefert werden THEN SHALL das System CloudFront Distribution für reports (CDN für schnelle Auslieferung) bereitstellen

2. WHEN große Dateien hochgeladen werden THEN SHALL das System Multipart Upload für Dateien > 5MB verwenden

3. WHEN Bilder angezeigt werden THEN SHALL das System optimierte Bildformate (WebP, AVIF) unterstützen

4. WHEN Zukunftserweiterungen implementiert werden THEN SHALL das System folgende Features vorbereiten:
   - Versionierung aktivieren (optional)
   - Webhook/Callback bei Upload-Finish
   - ImageOptimierung (Lambda@Edge) für Thumbnails
   - Integration mit Cognito für user_id-Auslese

### Requirement 7: Testing & Validation

**User Story:** Als QA-Engineer möchte ich umfassende Tests für alle Upload-Funktionalitäten, damit die Migration fehlerfrei funktioniert.

#### Acceptance Criteria

1. WHEN Unit-Tests geschrieben werden THEN SHALL das System Tests für PUT, GET, LIST Operationen bereitstellen

2. WHEN Integration-Tests durchgeführt werden THEN SHALL das System End-to-End Upload-Tests bereitstellen

3. WHEN die Migration validiert wird THEN SHALL das System keine Abhängigkeiten zu Supabase Storage mehr haben

### Requirement 8: AWS-Bestandsaufnahme & Migration-Scope

**User Story:** Als DevOps-Engineer möchte ich eine klare Übersicht über bestehende AWS-Ressourcen, damit ich die S3-Migration effizient planen kann.

#### Acceptance Criteria

1. WHEN AWS-Ressourcen analysiert werden THEN SHALL das System folgende bestehende Infrastruktur berücksichtigen:
   - RDS: matbakh-db (PostgreSQL 15.14) verfügbar
   - Lambda: AuthCallbackFn, matbakh-db-test, ses-events-worker deployed
   - VPC: vpc-0c72fab3273a1be4f mit konfigurierten Subnets
   - Layer: pg-client-layer:1 für DB-Verbindungen

2. WHEN Supabase-Abhängigkeiten identifiziert werden THEN SHALL das System folgende Bereiche NICHT in dieser Phase migrieren:
   - Auth-Calls (47 Dateien) - separate Phase
   - Database-Calls (35 Dateien) - bereits zu RDS migriert
   - Function-Calls (15 Dateien) - separate Phase

3. WHEN Storage-Migration geplant wird THEN SHALL das System bestätigen: Keine direkten Supabase Storage-Calls im Frontend gefunden

4. WHEN Migration-Scope definiert wird THEN SHALL das System sich ausschließlich auf S3-Dateispeicher konzentrieren

## Abschlusskriterien Phase A4

1. Alle Uploads (User, Content Management, Admin, AI) landen sicher in S3
2. Keine Abhängigkeit zu Supabase Storage vorhanden
3. Presigned Upload funktioniert DSGVO-konform
4. Avatar-Uploads und Bilder im UI funktionieren über S3
5. Media/Dateien können bei Bedarf via CDN (CloudFront) ausgeliefert werden
6. Vollständige Test-Coverage für alle Upload-Szenarien
7. Dokumentation für Deployment und Wartung vorhanden
8. **Migration-Fokus**: Nur S3-Storage, andere Supabase-Abhängigkeiten bleiben für separate Phasen