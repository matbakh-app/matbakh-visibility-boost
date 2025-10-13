# 🧠 matbakh.app – Access, Accounts & Permissions (v1)

**Date:** October 2025  
**Author:** PO/CTO (Rabieb Al-Khatib)  
**Status:** Draft → Audit-Ready Q4 2025  
**Scope:** Identity, Authentication, Permissions, Compliance & Voucher System

\*\* ## Related Documents: docs/Access-and-Accounts

---

## Nutzergruppen & Kontotypen

1️⃣ Super Admin (Owner)

Beschreibung: Plattform-Inhaber mit vollständigem Zugriff

Datentypen: ausschließlich privat

Sichtbarkeit: nur intern (System & Audit)

2️⃣ matbakh Staff (Engineers / Ops)

Beschreibung: Mitarbeitende mit technischen oder operativen Rollen

Datentypen: ausschließlich privat

Sichtbarkeit: intern (Support- oder Dev-Zwecke mit Just-in-Time-Access)

3️⃣ Unternehmens-Admin

Beschreibung: Erstregistrierte Person eines Unternehmens (Organisationsebene)

Datentypen: privat (Person) + Unternehmensdaten

Sichtbarkeit: personenbezogen privat, Unternehmensdaten können öffentlich oder eingeschränkt sichtbar sein

4️⃣ Unternehmens-Bearbeiter

Beschreibung: Vom Admin eingeladene Nutzer, die Inhalte erstellen, prüfen oder freigeben

Datentypen: privat (Person) + Unternehmenskontext

Sichtbarkeit: personenbezogen privat; Änderungen benötigen Freigabe des Admins

5️⃣ Solo-Unternehmen

Beschreibung: Einzelbetrieb mit einer Marke, einem Standort und einem Admin

Datentypen: personenbezogene Daten + Unternehmensdaten

Sichtbarkeit: personenbezogene Daten privat; Unternehmensdaten können (auf Wunsch) veröffentlicht werden

6️⃣ Multi-Standort-Unternehmen

Beschreibung: Ein Unternehmen mit einer Marke, aber mehreren Standorten

Datentypen: gemischt (organisatorisch und lokal)

Sichtbarkeit: standortweise konfigurierbar; lokale Teams mit eigenen Berechtigungen

7️⃣ Multi-Marken-Unternehmen

Beschreibung: Unternehmensgruppe mit mehreren Marken (z. B. Gustoso, Till Hoffmann GmbH, Fritzante GmbH)

Datentypen: gemischt

Sichtbarkeit: markenweise konfigurierbar; globale Admins mit Übersichtsrechten

8️⃣ Test-Account (7 Tage)

Beschreibung: Nur durch Super Admin eingeladen; Vollzugriff auf Features, aber keine permanente Datenspeicherung

Datentypen: privat

Sichtbarkeit: intern; Testdaten werden automatisch gelöscht, wenn kein Upgrade erfolgt

9️⃣ Partner-Konto

Beschreibung: B2B-Partner (Brauereien, Metro, Transgourmet, Shiji Group) mit eigenem Profil und Gutscheinverwaltung

Datentypen: privat (Kontaktperson) + Unternehmensdaten

Sichtbarkeit: personenbezogen privat; Partnerdaten teilweise sichtbar (z. B. für Gutschein-Empfänger)

---

## 2️⃣ Authentifizierung & Registrierung

**Identity Provider:** AWS Cognito (OAuth2/OIDC)  
**Flows:**

- Self-Signup (Admins)
- Invite-Only (Bearbeiter, Test, Partner)
- Role-Binding via Invite Token

**Security:**

- 2FA / TOTP
- SCIM/SSO optional für Enterprise
- Just-in-Time Access für Staff
- Session-Tokens max. 30 min, Refresh-Tokens 24 h

**Double Opt-In & Consent:**

- ✅ Nutzungsbedingungen
- ✅ Datenschutz
- ⚙️ Storytelling-Freigaben (optional pro Thema)
- ⚙️ Marketing-Kommunikation (optional)

---

## 3️⃣ Datenmodell (vereinfachte Struktur)

```mermaid
erDiagram
USER ||--o{ ROLEBINDING : has
ORGANIZATION ||--o{ BRAND : owns
BRAND ||--o{ LOCATION : owns
USER {
  id
  name
  email
  locale
  roles[]
  consents{}
  privacyPrefs{}
}
ORGANIZATION {
  id
  name
  brands[]
  publicationPolicy{}
}
BRAND {
  id
  org_id
  visibilitySettings{}
}
LOCATION {
  id
  brand_id
  address
  hours
  publicationFlags{}
}

4️⃣ Rollen & Berechtigungen
Ebene	Rolle	Rechte
Plattformweit	SuperAdmin	Vollzugriff
	Staff	Support/Ops (JIT Access, kein Default)
Kunde (Org)	OrgAdmin	Nutzerverwaltung, Integrationen, Freigaben
	Editor	Inhalte erstellen, Vorschläge senden
	Viewer	Nur lesen (Reports, KPIs)
Partner	PartnerAdmin	Gutscheinmodul + Kampagnen

Feingranulare Rechte (Auszug)
content.create, content.publish, content.requestApproval,
org.inviteUsers, org.linkIntegrations,
story.publish_sensitive, brand.manageAssets

5️⃣ Arbeitsabläufe & Freigaben
🧱 Approval Flow

Editor erstellt Inhalt → Status pending

Policy prüft approval_required

OrgAdmin prüft & genehmigt

Veröffentlichung → API / Meta / Google

AuditTrail dokumentiert alle Schritte

🧩 Storytelling (sensible Themen)

Jede Story-Sektion trägt Sensitivity Tags

Veröffentlichung nur mit Opt-in

Alternativ: KI-Umschreibung zu neutraler Form

Automatisierte Checks: DSGVO, Markenlogos, Tonalität

6️⃣ Einladungen & Test-Accounts

Invites:

Token-basiert (gültig 48 h)

Rolle + Scope eingebettet

Optional: Ablaufdatum für Berechtigungen

Test-Accounts:

Laufzeit: 7 Tage

Volle Features, isolierte Umgebung

Nach Ablauf: auto-deletion

Upgrade möglich → persistenter Standard-Account

Wenn Upgrade: Datenmigration + AuditTrail-Eintrag

7️⃣ Multi-Standort & Multi-Marke

Hierarchische Vererbung: Org ⟶ Brand ⟶ Location

Lokale Policies können global überschreiben

„Konfliktregel“: restriktivere Policy gewinnt

Bulk-Aktionen für Filialen (z. B. Öffnungszeiten, Kampagnen)

8️⃣ Partner & Gutscheine

Partner (B2B2B)

Eigene Partner-Organisation

Modul „Gutscheine“ (Voucher Management)

Sichtbar nur für eigene Kampagnen

Kein Zugriff auf Kundendaten

Gutscheine (30 Tage Vollzugriff)

Typ	Beschreibung
voucher.full30	Einladungscode für 30 Tage Full Access
Ablauf	30 Tage, danach Grace 7 Tage read-only
Erinnerung	D-7 / D-3 / D-1 per E-Mail
Free Plan	❌ nicht vorhanden (nur Trial/Test)
9️⃣ Benachrichtigungen

Kanäle:

In-App (Notifications Center)

E-Mail (SendGrid)

Webhooks (Enterprise)

Push (Mobile, später)

Events:

Einladung gesendet/angenommen

Freigabe angefordert/erteilt

Veröffentlichung (erfolgreich/fehlgeschlagen)

Abrechnung / Gutschein-Ablauf

Sicherheitsereignisse (Login, 2FA, Integration abgelaufen)

Nicht abwählbar:

Sicherheit & Abrechnung

🔒 10️⃣ Datenschutz & Compliance

Privacy by Default (Opt-in für Publikationen)

DSGVO Art. 6 (Berechtigtes Interesse, Vertragserfüllung, Einwilligung)

Datenminimierung: keine unnötigen Felder

Redaction in Logs/Audit

Export/Löschung jederzeit im User-Dashboard

Staff-Access: nur mit JIT-Zustimmung & Banner

AuditTrail: Hash-Chain, 180 Tage Aufbewahrung (Prod)

⚙️ 11️⃣ Policy Defaults (Config Layer)
{
  "approval_required": true,
  "editor_can_invite": false,
  "publish_to_meta": "manual",
  "sensitive_story_allowed": false,
  "location_override_allowed": true,
  "audit_retention_days": 180,
  "auto_delete_test_accounts": true
}

✅ 12️⃣ Launch-Checkliste (RBAC & Auth)
Kategorie	Punkt	Status
Auth	Cognito + 2FA aktiviert	⏳
	Double-Opt-In aktiv	⏳
Rollen & Policies	RBAC Mapping implementiert	⏳
	Approval Workflow aktiv	⏳
	Storytelling Consent verfügbar	⏳
Test & Voucher	Test-Accounts isoliert & Auto-Delete	⏳
	Voucher-Flow aktiv (30 Tage Full Access)	⏳
Compliance	AuditTrail funktionsfähig	⏳
	Datenschutz-Check bestanden	⏳
Partner	Voucher-Management aktiv	⏳
Monitoring	Benachrichtigungssystem produktionsbereit	⏳
📘 13️⃣ Erweiterungsvorschläge (Q1–Q2 2026)

Delegated Admins mit Ablaufdatum

Rollen-Sandbox („Testrechte ohne Risiko“)

Chain Reports (Markenübergreifende KPIs)

Visual Role Editor im Dashboard

Story Review AI-Agent („tone & compliance check“)

End of Document
This file is part of the Governance & Access Suite of matbakh.app.
```
