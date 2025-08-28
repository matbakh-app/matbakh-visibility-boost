---
spec_id: VC-MC-DE-1
links:
  - ./requirements.vc-spec.md
  - ./vision.vc-spec.md
  - ./design.vc-spec.md
  - ./traceability.md
title: VC Microcopy (Deutsch)
owner: product@matbakh.app
version: 1.0
---

# VC Microcopy (DE)

## 1. Identify (Q&D) — Formular

**Felder**
- Unternehmen (Pflicht): „Name deines Betriebs"
- Adresse (Pflicht): „Adresse oder Stadt/PLZ"
- Website (optional): „Website (falls vorhanden)"
- Instagram (optional): „Instagram (optional)"
- Facebook (optional): „Facebook (optional)"
- E-Mail (optional für DOI): „E-Mail für Ergebnisse (optional)"

**Hilfetexte**
- Unternehmen: „So wie Gäste dich kennen (z. B. 'Pizzeria Roma')."
- Adresse: „Reicht auch Stadt/PLZ, wir finden Vorschläge."
- Website/SoMe: „Hilft uns, dich sicher zuzuordnen."

**Buttons**
- Primär: „Sichtbarkeit prüfen"
- Sekundär (Standby/Neutral): „Später entscheiden"
- Loading: „Wird geprüft …"

**Fehler**
- Validation: „Bitte Namen und Adresse angeben."
- Keine Kandidaten: „Wir konnten deinen Betrieb nicht finden. Bitte prüfe Schreibweise oder ergänze die Website."
- Mehrdeutig: „Wir haben mehrere Treffer gefunden. Wähle deinen Betrieb aus der Liste."
- Rate-Limit: „Kurz durchatmen – zu viele Anfragen. In wenigen Minuten nochmal versuchen."
- Server: „Das hat bei uns nicht geklappt. Versuch's später erneut."

---

## 2. Teaser Result (Evidence-basiert)

**Titel**
- „Deine lokale Sichtbarkeit: {score}%"
- „Erster Eindruck: {verdict}"

**Beschreibung (≤120 Zeichen)**
- „Du liegst {benchmark_pos} in deiner Kategorie. {quick_win} kann dir schnell helfen."
- „Stark bei {strength_1}. Potenzial bei {gap_1}."

**Badges**
- „Google-Präsenz", „Social-Aktivität", „Website-Basics", „Bewertungen"

**Hinweise/Evidence**
- „Quelle: {source} • {timestamp} • Sicherheit: {confidence}%"

**CTA**
- „Nächste Schritte zeigen"
- „Bericht per E-Mail erhalten"

**Fehler/Leerzustände**
- „Momentan keine verwertbaren Daten gefunden. Ergänze Website/Instagram für bessere Ergebnisse."

---

## 3. DOI / E-Mail

**Info**
- „Wir senden dir den vollständigen Bericht per E-Mail. Bestätige bitte kurz (Double-Opt-In)."

**CTA**
- „E-Mail senden"
- Nach Versand: „Check deine Inbox – Betreff 'Dein Sichtbarkeits-Bericht'"

**Hinweis**
- „Kein Risiko, kein Spam. Du kannst dich jederzeit abmelden."

---

## 4. Handlungsempfehlungen (Story-/Bilder-/Aktions-Posts)

**Intro**
- „Schnelle Gewinne zuerst: Diese Schritte bringen dir voraussichtlich am meisten in kurzer Zeit."

**Beispiele**
- Story-Post: „Erzähl, warum Gäste euch lieben – z. B. {usp}. Vorschlag ansehen."
- Bilder-Post: „Zeig {top_dish} mit Preis und Öffnungszeiten. Vorschlag ansehen."
- Google-Beitrag: „Aktualisiere {field} – bessere Auffindbarkeit. Jetzt umsetzen."

**ROI-Hinweis**
- „Prognose (unverbindlich): +{euros} € / Monat bei Umsetzung. Quelle & Annahmen im Bericht."

**Freigabe-Flow**
- „Vorschlag prüfen → Optional anpassen → Freigeben zum Posten"

---

## 5. OG/Share (Social Preview)

**Titel (≤60)**
- „Wie sichtbar ist {business_name}?"

**Beschreibung (≤120)**
- „Ergebnis in 1 Minute: Sichtbarkeit, Chancen, nächste Schritte."

**Alt-Text**
- „Sichtbarkeits-Vorschau für {business_name}"

---

## 6. Tonalität (Kulturdimensionen)

- Klar, freundlich, handlungsorientiert.
- Keine Fachbegriffe („ROI" → „Wie viel Euro bringt dir das").
- Knapp, konkret, mit Beispiel.## 
Admin — Partner Credits
- actions.grant.title: "Credits gutschreiben"
- actions.adjust.title: "Kontingent anpassen"
- actions.viewLedger.title: "Transaktionen anzeigen"
- actions.export.title: "Ledger exportieren"
- form.quantity.label: "Anzahl"
- form.reason.label: "Grund"
- form.reason.placeholder: "Grund für die Änderung..."
- form.expiresAt.label: "Verfällt am (optional)"
- policy.billing_mode.label: "Abrechnungsmodus"
- policy.billing_mode.issue: "Bei Ausstellung"
- policy.billing_mode.redeem: "Bei Einlösung"
- policy.overage_policy.label: "Überbuchung"
- policy.overage_policy.allow: "Erlauben und abrechnen"
- policy.overage_policy.block: "Blockieren bei 0 Credits"
- policy.unit_price.label: "Preis pro Code (EUR)"
- toast.saved: "Gespeichert"
- toast.granted: "Credits gutgeschrieben"
- toast.adjusted: "Kontingent angepasst"
- error.load: "Credits konnten nicht geladen werden"
- error.save: "Speichern fehlgeschlagen"
- error.validation.quantity: "Anzahl muss größer als 0 sein"
- error.validation.reason: "Grund ist erforderlich"
- confirm.policyChange.title: "Richtlinien ändern?"
- confirm.policyChange.message: "Diese Änderung betrifft zukünftige Abrechnungen."
- confirm.adjust.title: "Kontingent anpassen?"
- confirm.adjust.message: "Diese Aktion wird im Ledger protokolliert."#
# ui.mode
- toggle.label: "Darstellung"
- toggle.standard: "Standard"
- toggle.invisible: "Kompakt (ohne Scrollen)"
- toggle.system: "System"

## ui.invisible
- nudge.title: "Schneller zum Punkt?"
- nudge.body: "Probiere kompakte Antworten mit gezielten Nachfragen. Listen sind jederzeit einblendbar."
- chips.evidence: "Zeig mir, worauf das basiert"
- chips.impact: "Wie viel Euro bringt das?"
- chips.howto: "Wie setze ich das in 5 Minuten um?"
- cta.primary: "Jetzt umsetzen"

## tone.female_pref
- guidance: "Wir sprechen dich klar, freundlich und lösungsorientiert an. Ohne Klischees. Du bestimmst Tempo und Tiefe."
- confirm: "Tonalität angepasst. Du kannst das jederzeit in den Einstellungen ändern."