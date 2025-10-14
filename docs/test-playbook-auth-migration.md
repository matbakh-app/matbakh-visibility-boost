# 🧪 Test-Playbook: Auth-System Migration (Phase 2.2.x)

## 🎯 Ziel
Dieses Playbook dokumentiert manuelle und automatisierbare Tests zur sicheren Migration des Authentifizierungssystems von `useSafeAuth` / `useUnifiedAuth` hin zu `useAuthUnified`. Alle kritischen Komponenten, Entry Points und DSGVO-relevanten Funktionen werden abgedeckt.

---

## 🧩 1. App-Start & Initialisierung

| Testschritt | Erwartetes Verhalten | Status |
|-------------|----------------------|--------|
| App-Start (`npm run dev`) | Keine Fehler in Console oder UI | ☐ |
| Routing auf `/` | Erfolgreiches Routing, ggf. Auth Redirect | ☐ |
| AuthProvider initialisiert | Kein Fehler `AuthContext undefined` | ☐ |
| AppProviders lädt | Keine Provider-Fehler, alle Context verfügbar | ☐ |
| i18n initialisiert | Sprache wird korrekt geladen (de/en) | ☐ |

**Kritische Fehler-Patterns:**
- `Cannot read property 'user' of undefined`
- `useAuth must be used within an AuthProvider`
- `React.ErrorBoundary is not a function`

---

## 🔐 2. Authentifizierungs-Flows

| Testfall | Ablauf | Erwartetes Verhalten | Status |
|----------|--------|----------------------|--------|
| Login via Email/Passwort | `/login` aufrufen, gültige Daten eingeben | Erfolgreiches Login, Session gesetzt | ☐ |
| Logout | Auf Logout klicken | Session gelöscht, Redirect zu `/` | ☐ |
| Session Restore | Reload nach Login | User bleibt eingeloggt | ☐ |
| OAuth Login (Google) | Google-Flow starten & abschließen | Erfolgreiche Session nach Redirect | ☐ |
| OAuth Login (Facebook) | Facebook-Flow starten & abschließen | Erfolgreiche Session nach Redirect | ☐ |
| Magic Link | Email-basierter Login | Token wird korrekt verarbeitet | ☐ |

**Auth-spezifische Prüfungen:**
- Supabase Session wird korrekt gesetzt
- OAuth Tokens werden in DB gespeichert (`google_oauth_tokens`, `facebook_oauth_tokens`)
- `oauth_event_logs` werden korrekt erstellt
- Redirect URLs funktionieren (`/auth/callback`)

---

## 📋 3. DSGVO Consent Flow

| Testfall | Ablauf | Erwartung | Status |
|----------|--------|-----------|--------|
| Consent Tracking | Upload-Seite öffnen | Consent wird via API `/track-consent` gesendet | ☐ |
| Consent Verweigerung | Consent-Banner "ablehnen" klicken | Upload blockiert, Hinweis sichtbar | ☐ |
| Consent Logging | Supabase/AWS DB prüfen | Tracking-Eintrag korrekt gesetzt | ☐ |
| Consent Enforcement | Upload ohne Consent | Lambda blockiert Request | ☐ |
| PII Detection | Upload mit persönlichen Daten | PII wird erkannt und redacted | ☐ |

**DSGVO-kritische Prüfungen:**
- `consent_audit_protocol` Lambda funktioniert
- `dsgvo_consent_enforcement` blockiert korrekt
- `upload_data_protection` erkennt PII
- Audit-Trail wird vollständig geloggt

---

## 📁 4. Upload Flow (auth-abhängig)

| Testfall | Ablauf | Erwartung | Status |
|----------|--------|-----------|--------|
| Datei-Upload (gültiger Token) | Als eingeloggter User Datei hochladen | Presigned URL wird erzeugt, Upload erfolgreich | ☐ |
| Upload ohne Auth | Upload-Seite als Gast aufrufen | Upload verhindert, Redirect oder Fehler | ☐ |
| Consent + Upload | Consent akzeptiert, Datei hochladen | Upload erlaubt, Logging korrekt | ☐ |
| File Validation | Ungültige Datei hochladen | Validation schlägt fehl, Fehler angezeigt | ☐ |
| S3 Integration | Erfolgreicher Upload | Datei in S3 Bucket verfügbar | ☐ |

**Upload-spezifische Prüfungen:**
- `useS3Upload` Hook funktioniert
- `useUploadManagement` verwaltet State korrekt
- Presigned URLs werden generiert
- File Preview funktioniert

---

## 📈 5. VC Start & Forecast Demo

| Testfall | Ablauf | Erwartung | Status |
|----------|--------|-----------|--------|
| VC Start mit Auth | Sichtbarkeits-Check starten | Analyseprozess startet, keine Auth-Fehler | ☐ |
| VC ohne Auth | VC als Gast starten | Public Flow funktioniert | ☐ |
| Forecast Demo Seite | `/forecast-demo` aufrufen | ForecastChart + Controls werden korrekt angezeigt | ☐ |
| Chart-Interaktionen | Range umstellen, Hover über Datenpunkte | Interaktionen funktionieren wie erwartet | ☐ |
| AI Integration | VC Analyse mit Bedrock | AI-Analyse läuft durch, Ergebnisse angezeigt | ☐ |

**VC/AI-spezifische Prüfungen:**
- `useEnhancedVisibilityCheck` funktioniert
- `useForecast` Hook lädt Daten
- Bedrock AI Integration funktioniert
- Chart-Utils werden korrekt verwendet

---

## 🧭 6. Navigation / Sidebar / Menü (auth-abhängig)

| Testfall | Ablauf | Erwartung | Status |
|----------|--------|-----------|--------|
| Sidebar lädt korrekt | Als eingeloggter Nutzer App starten | Sidebar sichtbar, keine Fehler | ☐ |
| Admin-Menü sichtbar | Als Admin einloggen | `AdminPanel` sichtbar | ☐ |
| Admin-Menü versteckt | Als normaler Nutzer | Kein Admin-Eintrag sichtbar | ☐ |
| Navigation Menu | Header-Navigation testen | Alle Links funktionieren | ☐ |
| User Menu | UserMenu Dropdown | Profile, Settings, Logout verfügbar | ☐ |

**Navigation-spezifische Prüfungen:**
- `NavigationMenu` verwendet `useSafeAuth` korrekt
- `UserMenu` zeigt korrekte User-Daten
- RBAC (Role-Based Access Control) funktioniert
- `isAdmin` Flag wird korrekt gesetzt

---

## 🛠️ 7. Dev Tools & Debug Seiten

| Testfall | Ablauf | Erwartung | Status |
|----------|--------|-----------|--------|
| `/auth-debug` Page | Seite öffnen | useUnifiedAuth + useSafeAuth Debug-Werte sichtbar | ☐ |
| Deprecated Warning | Console beim Nutzen von `useSafeAuth` | `@deprecated` Warning wird ausgegeben | ☐ |
| `/_kiro` Diagnose | Kiro Diagnose-Seite | Auth-Status und Flags sichtbar | ☐ |
| Feature Flags | Feature Flag System | Flags werden korrekt geladen und angewendet | ☐ |

**Debug-spezifische Prüfungen:**
- AuthDebug zeigt alle Auth-States
- Console Warnings für deprecated Hooks
- Feature Flag Integration funktioniert
- Environment Variables werden korrekt geladen

---

## 🔄 8. Migration-spezifische Tests

| Testfall | Ablauf | Erwartung | Status |
|----------|--------|-----------|--------|
| Parallelbetrieb | `useSafeAuth` + `useAuthUnified` gleichzeitig | Beide funktionieren, keine Konflikte | ☐ |
| Deprecated Warnings | Dev-Modus mit `useSafeAuth` | Console Warning erscheint | ☐ |
| Fallback Behavior | `useAuthUnified` nicht verfügbar | `useSafeAuth` fällt auf Fallback zurück | ☐ |
| Import Aliases | Verschiedene Import-Patterns | Alle Imports funktionieren korrekt | ☐ |

---

## ✅ Abschlusskriterien für Migration

- [ ] `useAuthUnified.ts` ist erstellt, getestet und produktionsbereit
- [ ] `useSafeAuth` zeigt korrekten `@deprecated` Hinweis
- [ ] Alle Komponenten mit `useSafeAuth`/`useUnifiedAuth` getestet
- [ ] Kein Feature wurde durch Umstellung gebrochen
- [ ] Migration in Changelog + Developer README dokumentiert
- [ ] Alle Tests in diesem Playbook bestanden (100% ✅)

---

## 📊 Test-Execution Tracking

### Pre-Migration Baseline
- [ ] Alle Tests durchgeführt und dokumentiert
- [ ] Screenshots/Videos von kritischen Flows erstellt
- [ ] Performance-Baseline gemessen

### Post-Migration Validation  
- [ ] Alle Tests erneut durchgeführt
- [ ] Regression-Tests bestanden
- [ ] Performance-Impact gemessen

---

## 📌 Hinweise

- Alle Smoke Tests **vor jedem Release ausführen**, bis `useSafeAuth` vollständig entfernt wurde
- Verwende für neue Komponenten **ausschließlich `useAuthUnified`**
- Verwende `process.env.NODE_ENV !== 'production'` für Debug-Warnings in deprecated Hooks
- AuthContext selbst **nicht mutieren**, solange Critical Path Lock aktiv ist

---

## 🔒 Critical Path Reminder

Die folgenden Dateien sind gesperrt für Änderungen ohne explizite Freigabe:
- `src/App.tsx`
- `src/contexts/AuthContext.tsx`
- `src/contexts/AppProviders.tsx`
- `src/pages/Auth*.tsx`
- `src/components/layout/Sidebar.tsx`

---

## 🚨 Emergency Rollback Plan

Falls kritische Probleme auftreten:

1. **Sofortiger Rollback:**
   ```bash
   git revert <migration-commit>
   npm run build
   npm run deploy
   ```

2. **Hotfix für Deprecated Hooks:**
   ```typescript
   // Temporär alle Warnings deaktivieren
   export const useSafeAuth = () => {
     return useUnifiedAuth(); // Ohne Warning
   };
   ```

3. **Critical Path Restore:**
   - Restore `AuthContext.tsx` aus Backup
   - Restore `AppProviders.tsx` aus Backup
   - Verify App-Start funktioniert

---

## 📈 Success Metrics

- **Zero Downtime:** App bleibt während Migration verfügbar
- **Zero Regressions:** Alle bestehenden Features funktionieren
- **Clean Migration:** Deprecated Code wird schrittweise entfernt
- **Developer Experience:** Neue API ist einfacher zu verwenden

**Status:** Test-Playbook bereit für Execution 🧪