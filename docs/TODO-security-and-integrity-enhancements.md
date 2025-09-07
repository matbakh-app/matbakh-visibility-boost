# Security & Integrity Enhancements – Post A4 Backlog

## Kontext

Diese Verbesserungen wurden während Phase A4 identifiziert und **liegen außerhalb** der ursprünglichen Spezifikation. Sie erhöhen Sicherheit, Datenintegrität und Robustheit. Umsetzung **nach Abschluss** der S3 File Storage Migration (Tasks 1–11) gemäß Plan.

## Status

- Phase A4 (S3 Infra, Presign Lambda, DB-Migration): **on track / abgeschlossen laut Status**
- Diese Enhancements: **deferred (Backlog)**

---

## 1) JWT-Authentifizierung an Presign-Endpoint (Cognito, `jose`)

**Beschreibung:** Presigned-URL-Lambda verlangt gültiges Bearer-JWT (Cognito). Verifikation über JWKS mit `jose`.

- **Rationale:** Zero-Trust, kein anonymer Zugriff, sauberes Rate-Limiting pro User.
- **Scope:**
  - Presign-Lambda: JWT-Verification (`jose`), Issuer-Check.
  - Env: `COGNITO_REGION`, `COGNITO_USER_POOL_ID`.
  - CORS unverändert (OPTIONS frei, POST auth).
- **Nicht in Scope (jetzt):** API-Gateway/WAF Integration (separate Items unten).
- **Akzeptanzkriterien:**
  - `401` bei fehlendem/invalidem Token.
  - Gültige Tokens liefern Presigns wie bisher.
  - Unit-/Integration-Tests für gültig/abgelaufen/gefälscht.
- **Auswirkungen:** Frontend muss Token mitsenden; E2E-Tests aktualisieren.

## 2) S3 Event–getriebene Metadaten-Persistenz

**Beschreibung:** S3 `ObjectCreated` → Lambda `s3-upload-processor` persistiert Upload-Record in `user_uploads` (inkl. Metadaten/Checksums).

- **Rationale:** DB-Konsistenz auch bei Client-Fehlern; Audit-Trail (DSGVO).
- **Scope:**
  - CDK: S3 Event Notifications (uploads/profile) → Lambda.
  - Lambda: HEAD/GET Metadata, Insert in RDS, Fehler pro Record isolieren, DLQ optional.
- **Akzeptanzkriterien:**
  - Jeder erfolgreiche Upload erzeugt DB-Record.
  - Idempotenz: doppeltes Event führt nicht zu Duplikaten.
  - Monitoring: CloudWatch Metrics/Logs vorhanden.
- **Auswirkungen:** Frontend kann optional auf „commit"-Call verzichten; Tests anpassen.

## 3) Checksum Integrity (SHA-256 Pinning)

**Beschreibung:** Client berechnet SHA-256; Presign „pinnt" `ChecksumSHA256`; Upload sendet `x-amz-checksum-sha256`.

- **Rationale:** Integritätsnachweis; Manipulationsschutz.
- **Scope:**
  - Presign-Lambda: Validierung & Signatur mit `ChecksumSHA256`, Speicherung der Checksums in S3 Metadata.
  - Frontend: WebCrypto SHA-256 + Base64-Umwandlung.
  - Event-Processor: Checksums in `user_uploads` persistieren.
- **Akzeptanzkriterien:**
  - S3 lehnt Uploads mit falscher Checksum ab.
  - DB enthält Hash-Werte pro Upload.
  - Tests für korrekte/falsche Checksums.

---

## Weitere optionale Optimierungen (separat planbar)

### 4) API Gateway + Cognito Authorizer (statt Function URL)

- **Nutzen:** Zentrale AuthN/AuthZ, Throttling/Usage Plans.
- **Akzeptanz:** Presign-Endpoint nur mit validem JWT erreichbar; 429 bei Überschreitung.

### 5) WAF-Integration (Rate Limits/IP-Schutz)

- **Nutzen:** Schutz vor Abuse/DoS.
- **Akzeptanz:** Konfigurierbare IP-Based Limits, Security Rules.

### 6) Persistentes Rate-Limiting

- **Optionen:** DynamoDB/Redis statt In-Memory.
- **Akzeptanz:** Limits pro User/Client stabil über Lambda-Concurrency hinweg.

### 7) Multipart Upload (>5MB)

- **Nutzen:** Stabilität bei größeren Dateien.
- **Akzeptanz:** End-zu-Ende Tests für Multi-Part (Create/UploadPart/Complete).

### 8) OAI → OAC Migration (CloudFront)

- **Nutzen:** Modernes SigV4, vereinfachte Policies.
- **Akzeptanz:** Reports-Delivery funktioniert unverändert; Policies schlanker.

### 9) Response Headers/Metadata Policy

- **Nutzen:** Kontrolle von `Cache-Control`, `Content-Disposition` (PDF inline/attachment).
- **Akzeptanz:** Richtige Anzeige & Caching per Objekt-Metadata.

### 10) Frontend S3 Upload Library – Follow-ups

**Beschreibung:** Kleine Code-Hardening- und UX/A11y-Verbesserungen in der Browser-Upload-Lib.

- **Remove Node crypto import:** `import { createHash } from 'crypto'` entfernen (Browser-Build).
- **Content-Type setzen:** Request-Header immer explizit setzen. Falls Presign `requiredHeaders['Content-Type']` liefert, exakt diesen Wert verwenden (S3-Signatur muss matchen).
- **Checksum-Header erzwingen:** Wenn Presign `x-amz-checksum-sha256` verlangt, Header immer mitsenden (Single + Multipart).
- **Multipart Guards:** Vor Start prüfen `partUrls.length === totalParts`; bei Mismatch sauberer Fehler.
- **Object URL Cleanup:** In `compressImage()` `URL.revokeObjectURL(img.src)` nach `onload`/`onerror` aufrufen.
- **AVIF erlauben:** `image/avif` in `ALLOWED_MIME_TYPES.images` aufnehmen.
- **Network-Check Fallback:** Fallback auf `navigator.onLine` + optional `${API_BASE_URL}/health` (HEAD). `AbortSignal.timeout` nicht überall verfügbar.
- **A11y Progress:** `role="progressbar"` + `aria-valuenow/min/max` + `aria-live` sr-only Status hinzufügen.
- **MD5 Handling:** `calculateMD5` als „not used" markieren oder entfernen; sicherstellen, dass Presign keinen `Content-MD5` verlangt.
- **Cookie-Token decode:** Cookie-Wert via `decodeURIComponent` parsen; Name trimmen.

**Akzeptanzkriterien:**
- Single- und Multipart-Uploads funktionieren unverändert mit Presign-Policies.
- Kein Build-Warnung/Polyfill wegen Node-`crypto`.
- Progressbar ist screen-reader-freundlich.
- Keine Memory Leaks bei Bild-Kompression.

---

## Abhängigkeiten & Auswirkungen

- Frontend: Token-Handling, Checksum-Berechnung, ggf. Wegfall „commit"-Call.
- DevOps: CDK-Erweiterungen (Events, Policies, API GW/WAF), Secrets/ENV.
- QA: Neue Testpfade (Auth-Failure, Checksum-Mismatch, Event-Idempotenz).
- Compliance: Audit-Trail erweitert; PII-Maskierung in Logs prüfen.

## Risiken

- Erhöhter Komplexitätsgrad (Events, Auth, Checksums).
- Rollout-Koordination Frontend/Backend.
- Rate-Limit Persistenz erfordert zusätzliche Services.

## Rollout-Vorschlag (nach Abschluss A4 Tasks)

1. JWT-Auth an Presign (klein, hoher Sicherheitsgewinn).
2. Event-Persistenz (Konsistenz/Audit).
3. Checksum-Pinning (Integrität).
4. API GW + WAF + persistentes Rate-Limiting.
5. Multipart Upload.
6. OAC Migration.

## Referenzen

- Buckets: `matbakh-files-uploads`, `matbakh-files-profile`, `matbakh-files-reports`
- CloudFront: `dtkzvn1fvvkgu.cloudfront.net`
- RDS Secret: `matbakh-db-postgres`
#
## Upload History & Access Hooks – Follow-ups

**Beschreibung:** Stabilitäts- und Security-Nachschärfungen für `useUploadHistory` & Co.

- **API-Base vereinheitlichen:** Alle Endpunkte über `VITE_PUBLIC_API_BASE` statt relative Pfade.
- **SSR-Safety:** Token-Zugriff nur, wenn `window` verfügbar; Cookies via `decodeURIComponent`.
- **Abort/Race-Safety:** `AbortController` + Cleanup in `useEffect` verwenden (kein State-Update nach Unmount).
- **Error Messaging vereinheitlichen:** Frontend-Fehler über zentrale `getUserFriendlyErrorMessage(...)` mappen.
- **Cursor-Pagination:** Serverseitig Cursor statt page/limit (besser für große Datenmengen).
- **RBAC/Filter-Validierung:** Serverseitig `userId/partnerId` aus JWT claims statt Query zuordnen.
- **Rate Limits:** Soft-Limit auf History-Reads je User (WAF/API-GW).
- **Caching:** Optionales SWR/Cache (ETag/If-None-Match) für History-Endpunkte.
- **Auditability:** Server-Logs mit Request-IDs, PII-Masking (DSGVO).

**Akzeptanzkriterien:**
- Keine Race-Conditions bei schnellem Paginieren/Filtern.
- Einheitliche Fehlertexte im UI.
- History-Abrufe skalieren bei großen Datenmengen (Cursor).
- Security: Filter nicht vertrauensbasiert aus Query, sondern aus Token abgeleitet.

Erfolgskriterium: Block ist in der Datei enthalten; PR verlinkt ihn als Post-A4 Follow-up.
---

#
# Post-A4 File Preview & Upload Hardening

**Kontext:** Diese Verbesserungen wurden nach der Implementierung der React UI Components (Task 6) identifiziert und betreffen die Sicherheit und Benutzerfreundlichkeit der File Preview und Upload Management Funktionen.

### 1) PDF Viewer Enhancement

**Beschreibung:** Wechsel von iframe-basiertem PDF Viewer auf PDF.js für bessere Kompatibilität und Sicherheit.

- **Rationale:** CORS-sichere PDF-Darstellung, bessere Zoom/Navigation, mobile Kompatibilität.
- **Scope:**
  - PDF.js Integration in FilePreviewModal
  - Zoom- und Seitennavigation-Controls
  - Bessere Fehlerbehandlung für korrupte PDFs
  - Mobile-responsive PDF-Anzeige
- **Akzeptanzkriterien:**
  - PDFs werden ohne CORS-Probleme angezeigt
  - Zoom und Seitennavigation funktionieren
  - Mobile Geräte unterstützt
  - Fehlerbehandlung für nicht-ladbare PDFs
- **Risiko:** Medium - erfordert signifikante UI-Änderungen
- **Aufwand:** Large (L)

### 2) Secure URL Broker

**Beschreibung:** Alle Preview-Aktionen zentral über useS3FileAccess Hook mit presigned URLs.

- **Rationale:** Sichere private Datei-Zugriffe, TTL-basierte URLs, zentrales Caching.
- **Scope:**
  - Integration von useS3FileAccess in alle Preview-Komponenten
  - Automatische URL-Erneuerung vor Ablauf
  - Zentralisiertes Caching und Error-Handling
  - Support für private Datei-Zugriffe
- **Akzeptanzkriterien:**
  - Alle Datei-URLs verwenden presigned URLs mit TTL
  - Automatische URL-Refresh vor Ablauf
  - Private Dateien sind sicher zugänglich
  - Zentralisierte Fehlerbehandlung
- **Risiko:** Low - erweitert bestehende Funktionalität
- **Aufwand:** Medium (M)

### 3) Thumbnail Service

**Beschreibung:** Serverseitige Thumbnail-Generierung für schnellere Previews.

- **Rationale:** Schnellere Listen/History-Anzeige, reduzierte Bandbreite.
- **Scope:**
  - Lambda@Edge oder Thumbor Integration
  - Automatische Thumbnail-Generierung für Bilder und PDFs
  - Multiple Thumbnail-Größen (small, medium, large)
  - CDN-Caching für Thumbnails
- **Akzeptanzkriterien:**
  - Thumbnails werden automatisch generiert
  - Verschiedene Größen verfügbar
  - CDN-Caching implementiert
  - Fallback für nicht-unterstützte Dateitypen
- **Risiko:** Medium - neue Infrastruktur-Komponente
- **Aufwand:** Large (L)

### 4) Lazy Virtualization

**Beschreibung:** react-virtualized für Upload-History bei >500 Items.

- **Rationale:** Performance-Optimierung bei großen Datensätzen, reduzierte Memory-Nutzung.
- **Scope:**
  - react-virtualized Integration in UploadHistory
  - Smooth Scrolling bei großen Datensätzen
  - Memory-Optimierung
  - Erhaltung von Such- und Filter-Funktionalität
- **Akzeptanzkriterien:**
  - Smooth Scrolling mit >500 Items
  - Reduzierte Memory-Nutzung
  - Such- und Filter-Funktionen bleiben erhalten
  - Progressive Metadaten-Ladung
- **Risiko:** Low - UI-Optimierung
- **Aufwand:** Medium (M)

### 5) Image Viewer Accessibility

**Beschreibung:** Erweiterte Accessibility-Features für Image Viewer.

- **Rationale:** Bessere Zugänglichkeit für Benutzer mit Behinderungen.
- **Scope:**
  - Tastatur-basiertes Panning und Zooming
  - Screen Reader-Beschreibungen für Bildinhalte
  - prefers-reduced-motion Support
  - High Contrast Mode Kompatibilität
- **Akzeptanzkriterien:**
  - Vollständige Tastatur-Navigation
  - Screen Reader-Unterstützung
  - Respektierung von Motion-Präferenzen
  - High Contrast Mode funktioniert
- **Risiko:** Low - Accessibility-Verbesserung
- **Aufwand:** Small (S)

### 6) Telemetrie und Monitoring

**Beschreibung:** Custom Metrics und Alerting für Datei-Operationen.

- **Rationale:** Bessere Überwachung und Fehlererkennung.
- **Scope:**
  - Tracking von preview_open, preview_fail, copy_url Events
  - CloudWatch Custom Metrics Integration
  - Automatisierte Alerts bei hohen Fehlerquoten
  - Performance Monitoring Dashboard
- **Akzeptanzkriterien:**
  - Events werden korrekt getrackt
  - CloudWatch Metrics verfügbar
  - Alerts bei Anomalien
  - Performance Dashboard funktional
- **Risiko:** Low - Monitoring-Erweiterung
- **Aufwand:** Medium (M)

### Implementierungs-Priorität (Post-A4)

**High Priority:**
- [ ] Secure URL Broker (#2) - Sicherheit
- [ ] Image Viewer Accessibility (#5) - Compliance

**Medium Priority:**
- [ ] Lazy Virtualization (#4) - Performance
- [ ] Telemetrie und Monitoring (#6) - Observability

**Low Priority:**
- [ ] PDF Viewer Enhancement (#1) - UX-Verbesserung
- [ ] Thumbnail Service (#3) - Performance-Optimierung

### Abhängigkeiten

- **Secure URL Broker:** Erfordert vollständige useS3FileAccess Hook Implementation
- **Thumbnail Service:** Benötigt zusätzliche AWS Lambda/CloudFront Konfiguration
- **PDF Viewer:** Erfordert PDF.js Bundle-Integration
- **Telemetrie:** Benötigt CloudWatch Permissions und Dashboard-Setup

### Rollout-Strategie

1. **Phase 1:** Secure URL Broker + Image Viewer Accessibility (Sicherheit & Compliance)
2. **Phase 2:** Lazy Virtualization + Telemetrie (Performance & Monitoring)
3. **Phase 3:** PDF Viewer Enhancement + Thumbnail Service (UX-Verbesserungen)

### Testing-Anforderungen

- [ ] Security Testing für private Datei-Zugriffe
- [ ] Performance Testing mit großen Datensätzen (>1000 Items)
- [ ] Accessibility Testing mit Screen Readern
- [ ] Cross-Browser Testing für PDF.js Integration
- [ ] Mobile Testing für alle Preview-Funktionen