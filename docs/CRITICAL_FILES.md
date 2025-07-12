# 🔒 CTO-Governance: Kritische Dateien & Audit-Dokumentation

⚠️ **Diese Datei dokumentiert alle CTO-geschützten Bereiche für Audits und Onboarding** ⚠️

## 📋 Audit-Checkliste für neue Entwickler & Auditoren

### 1. Legal-Governance System ✅
- **Alle Rechtstexte** ausschließlich in `public/locales/{lang}/legal.json`
- **CTO-Schutz** durch Kommentare in jeder legal.json
- **Konsistenz-Check** läuft automatisch: `npm run check-legal`
- **PR-Template** für Legal-Änderungen: `.github/PULL_REQUEST_TEMPLATE/legal.md`
- **Dokumentation** für neue Sprachen: `public/locales/README.md`

### 2. Kritische Layout-Dateien 🔒
- `src/layouts/LegalLayout.tsx` - NUR CTO-Änderungen erlaubt
- `src/components/Footer.tsx` - Internationalisierung CTO-validiert
- `src/components/Header.tsx` - Navigation CTO-freigegeben

### 3. Automatisierte Schutzmaßnahmen 🛡️
- **CI/CD-Integration**: Legal-Konsistenz-Check blockiert fehlerhafte Merges
- **PR-Templates**: Zwingen CTO-Review für Legal-Änderungen ein
- **Audit-Transparenz**: Footer zeigt Governance-Status und letztes Audit

## 🎯 Onboarding-Workflow für neue Entwickler

### Schritt 1: Governance verstehen
1. Diese Datei vollständig lesen
2. `public/locales/README.md` studieren  
3. Legal-PR-Template in `.github/PULL_REQUEST_TEMPLATE/legal.md` verstehen
4. Konsistenz-Check mit `npm run check-legal` testen

### Schritt 2: Verbotene Aktionen verstehen
❌ **NIEMALS ohne CTO-Freigabe:**
- Änderungen an `public/locales/*/legal.json`
- Modifikation von `src/layouts/LegalLayout.tsx`
- Rechtstexte in andere Übersetzungsdateien kopieren
- Legal-Navigation oder Footer-Struktur ändern

### Schritt 3: Erlaubte Aktionen
✅ **Ohne CTO-Freigabe erlaubt:**
- UI-Komponenten außerhalb Legal-Bereich
- Funktionale Features (non-legal)
- Bug-Fixes an Business-Logic
- Styling-Anpassungen (außer Legal-Layout)

## 🔍 Audit-Kontrollpunkte

### A) Legal-Content-Integrität
- [ ] Alle 8 Legal-Seiten verwenden ausschließlich `legal.json`
- [ ] Keine Duplikate in `translation.json` oder anderen Dateien
- [ ] CTO-Kommentare in allen `legal.json` vorhanden
- [ ] `lastUpdated` Felder korrekt und aktuell

### B) Technische Konsistenz
- [ ] Konsistenz-Check (`npm run check-legal`) läuft erfolgreich
- [ ] Alle Sprachen (DE/EN) haben identische Schlüssel-Struktur
- [ ] Footer reagiert live auf Sprachwechsel
- [ ] LegalLayout zeigt nur eine Navigation (Header)

### C) Governance-Compliance  
- [ ] PR-Template für Legal-Änderungen aktiv
- [ ] CTO-Freigabe für alle Legal-PRs dokumentiert
- [ ] Audit-Hinweis im Footer sichtbar
- [ ] Changelog in `legal.json` gepflegt

## 📊 Audit-Reporting

### Letztes vollständiges Audit
- **Datum**: Januar 2025
- **Auditor**: CTO
- **Status**: ✅ Vollständig compliant
- **Nächstes Audit**: März 2025

### Kritische Governance-Metriken
- **Legal-Files unter CTO-Schutz**: 2 (DE/EN)
- **Automatisierte Checks**: 1 (Konsistenz-Prüfung)
- **Geschützte Layout-Dateien**: 3
- **PR-Templates für Legal**: 1

## 🚨 Eskalation bei Governance-Verletzungen

**Bei versehentlicher Änderung von Legal-Dateien:**
1. Sofortiger Rollback der Änderungen
2. CTO informieren  
3. PR-Beschreibung mit Erklärung ergänzen
4. Governance-Workflow erneut durchlesen

**Bei System-kritischen Legal-Problemen:**
1. Deployment stoppen
2. CTO sofort kontaktieren
3. Incident-Log erstellen
4. Nach CTO-Freigabe Hotfix deployen

---

🏆 **Diese Governance-Dokumentation ist Grundlage für alle Audits, Onboarding-Prozesse und Compliance-Prüfungen.**