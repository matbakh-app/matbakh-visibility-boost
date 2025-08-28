---
title: RBAC Matrix
version: 2025-08-26
---

Roles:
- viewer
- owner
- partner_admin
- admin
- super_admin

Matrix (Kurzform):
- viewer: read-only eigene public Inhalte
- owner: eigenes VC, eigene Aktionen posten, eigene Profile pflegen
- partner_admin: Partner-Einbettungen, Kampagnen, Reports, partner_credits_read (nur eigene Balance/KPIs)
- admin: alle Owners/Partner lesen, Ops-Dashboards, Konfiguration (ohne Hochrisiko), partner_credits_grant, partner_credits_adjust, partner_credits_policy_update, partner_credits_ledger_view
- super_admin: alles + Feature Flags, Allowed Origins, Secrets, Impersonation (mit 2-Step), partner_credits_default_policies

Audit-Pflicht: Jede Admin/Super-Admin Änderung → Audit Log (wer, was, wann, alt→neu).