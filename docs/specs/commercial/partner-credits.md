---
title: Partner Credits (Kontingente)
version: 2025-08-26
spec_ids: [CRED-01, CRED-02, CRED-03, CRED-04]
---

# Partner Credits System

## Zweck
Partnern (z.B. Augustiner) ein fixes Kontingent (z.B. 100 Kampagnen-Credits) zuweisen. Standard-Verbrauch bei **Ausstellung** von Codes; optional umschaltbar auf **Einlösung**.

## Modelle

### Partner Credits Configuration
- `billing_mode`: "issue" (Standard) | "redeem" 
- `overage_policy`: "allow_and_invoice" (Standard) | "block_when_exhausted"
- `unit_price_eur`: Betrag pro Code (für Overage-Abrechnung)
- `credit_grant`: { partner_id, quantity, reason, expires_at? }

### Billing Modes
- **issue**: Credits werden bei Code-Ausstellung verbraucht
- **redeem**: Credits werden bei Code-Einlösung verbraucht

### Overage Policies
- **allow_and_invoice**: Überbuchung erlaubt, wird separat abgerechnet
- **block_when_exhausted**: Keine weitere Code-Ausstellung bei 0 Credits

## Ledger System
Jede Bewegung (grant|consume|adjust|expire) als Eintrag mit vollständigem Audit-Trail:
- who: Benutzer-ID der ausführenden Person
- when: Timestamp der Aktion
- meta: Zusätzliche Kontext-Informationen (JSONB)

## KPIs & Monitoring
- `balance` = grants - consumed - expired (+/- adjustments)
- Warnings bei Low-Balance (< 10% des ursprünglichen Kontingents)
- Overage-Tracking für Abrechnungszwecke
- Verbrauchsrate-Analyse für Kapazitätsplanung

## RBAC Permissions
- **admin**: grant/adjust Credits, view Ledger, Policy-Updates
- **super_admin**: globale Policies setzen, Preis-Defaults festlegen
- **partner_admin**: read-only Balance/KPIs (kein grant/adjust)

## Integration Points
- Code-Ausstellung: Automatischer Credit-Verbrauch
- Abrechnungssystem: Overage-Erfassung für Invoicing
- Monitoring: Alerts bei kritischen Balances