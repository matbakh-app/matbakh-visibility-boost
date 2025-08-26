# Requirements Document - KI-gestütztes Onboarding

## Introduction

Das KI-gestützte Onboarding ist das Fundament der matbakh.app Plattform und entscheidet über Erfolg oder Misserfolg der Nutzeraktivierung. Es muss automatisch die richtige Persona erkennen, den Onboarding-Prozess entsprechend anpassen und maximale Datensammlung für präzise KI-Empfehlungen gewährleisten. Das System soll von extremer Einfachheit (Solo-Sarah) bis zu Enterprise-Komplexität (Ketten-Katrin) skalieren und dabei frühe Erfolgserlebnisse garantieren.

## Requirements

### Requirement 1: Persona-Erkennung via 5-Fragen-Heuristik

**User Story:** Als Gastronom möchte ich durch 5 einfache Fragen schnell kategorisiert werden, damit ich den passenden Onboarding-Flow erhalte.

#### Acceptance Criteria

1. WHEN ein Nutzer das Onboarding startet THEN sollen genau 5 Mehrfachwahl-Fragen gestellt werden:
   - Anzahl Standorte (1 / 2-4 / 5+ / Franchise)
   - Marketing-Reife (Anfänger / Fortgeschritten / Profi / Agentur)
   - Hauptziel (Mehr Gäste / Effizienz / Expansion / Datenanalyse)
   - Teamgröße (Solo / 2-10 / 11-50 / 50+)
   - Budget-Band (< €100/Monat / €100-500 / €500-2000 / Enterprise)
2. WHEN alle 5 Fragen beantwortet sind THEN soll eine Heuristik-Mapping die Persona zuweisen:
   - Solo-Sarah: 1 Standort + Anfänger/Fortgeschritten + Mehr Gäste + Solo/2-10 + < €500
   - Bewahrer-Ben: 1-4 Standorte + Fortgeschritten + Effizienz + 2-50 + €100-2000
   - Wachstums-Walter: 2-5 Standorte + Profi + Expansion + 11-50 + €500+
   - Ketten-Katrin: 5+ Standorte + Profi/Agentur + Datenanalyse + 50+ + Enterprise
3. IF die Heuristik unsicher ist (mehrere Personas möglich) THEN soll Solo-Sarah als Fallback gewählt werden
4. WHEN die Persona zugewiesen ist THEN soll ein manueller Switch im UI verfügbar sein ("Passt nicht? Hier wechseln")
5. WHEN ein manueller Switch erfolgt THEN soll das Event persona_manual_override getrackt werden

### Requirement 2: P0-Datensatz (Minimum Viable Data)

**User Story:** Als System möchte ich die essentiellen Geschäftsdaten sammeln, damit ich eine grundlegende Visibility Check durchführen kann.

#### Acceptance Criteria

1. WHEN das Basis-Setup startet THEN sollen folgende Pflichtfelder erfasst werden:
   - Business-Name (Text, max. 100 Zeichen)
   - Adresse (strukturiert: Straße, Hausnummer, PLZ, Stadt, Land)
   - E-Mail (validiert, für VC-Ergebnisse)
   - Bevorzugte Sprache (DE/EN, automatisch erkannt)
2. WHEN zusätzliche Daten verfügbar sind THEN sollen optional erfasst werden:
   - Website/Google-Maps-Link
   - GA4 Measurement ID
   - Google Business Profile Location ID
3. WHEN Consent-Toggles angezeigt werden THEN sollen diese DSGVO-konform sein:
   - Profiling/Personalisierung (erforderlich für KI-Features)
   - Marketing-Kommunikation (optional)
   - 3rd-party API-Zugriffe (erforderlich für VC)
4. WHEN Daten gespeichert werden THEN sollen diese validiert und strukturiert in der Datenbank landen
5. IF Pflichtfelder fehlen THEN soll das System den Nutzer daran hindern fortzufahren

### Requirement 3: Time-to-Value Garantien

**User Story:** Als Gastronom möchte ich schnell erste Ergebnisse sehen, damit ich den Wert der Plattform erkenne.

#### Acceptance Criteria

1. WHEN Solo-Sarah das Onboarding abschließt THEN soll das VC-Ergebnis < 3 Min nach Signup verfügbar sein
2. WHEN Bewahrer-Ben das Setup beendet THEN sollen erste Insights < 24h verfügbar sein UND eine Sofort-Preview nach 10-15 Min
3. WHEN ein VC gestartet wird THEN soll ein Fortschrittsindikator den aktuellen Status anzeigen
4. IF ein VC länger als erwartet dauert THEN soll eine Benachrichtigung mit geschätzter Restzeit gesendet werden
5. WHEN das VC-Ergebnis fertig ist THEN soll eine Push-/E-Mail-Benachrichtigung versendet werden

### Requirement 4: Fehler- und Abbruchpfade

**User Story:** Als Nutzer möchte ich auch bei Problemen oder Unterbrechungen eine gute Erfahrung haben.

#### Acceptance Criteria

1. WHEN kein Google Business Profile verfügbar ist THEN soll ein "Guest-Mode VC" mit reduziertem Funktionsumfang angeboten werden
2. WHEN ein Nutzer das Onboarding abbricht THEN soll der Fortschritt sicher zwischengespeichert werden
3. WHEN ein Nutzer zurückkehrt THEN soll ein "Weiter machen"-Deep-Link per E-Mail verfügbar sein
4. WHEN ein Reentry erfolgt THEN soll der Fortschritt wiederhergestellt und der Nutzer an der richtigen Stelle fortfahren
5. IF technische Fehler auftreten THEN sollen verständliche Fehlermeldungen mit Lösungsvorschlägen angezeigt werden

### Requirement 5: Event-Taxonomie und Messung

**User Story:** Als Produktteam möchten wir das Onboarding-Verhalten messen, damit wir kontinuierlich optimieren können.

#### Acceptance Criteria

1. WHEN das Onboarding startet THEN soll das Event `onb_start` mit Payload `{timestamp, source, language}` getrackt werden
2. WHEN eine Persona zugewiesen wird THEN soll das Event `persona_assigned` mit Payload `{persona, confidence, method}` getrackt werden
3. WHEN Consent erteilt wird THEN soll das Event `consent_granted` mit Payload `{consent_types, timestamp}` getrackt werden
4. WHEN der VC startet THEN soll das Event `vc_started` mit Payload `{persona, data_completeness}` getrackt werden
5. WHEN VC-Ergebnisse verfügbar sind THEN soll das Event `vc_result_ready` mit Payload `{duration, result_type}` getrackt werden
6. WHEN das Onboarding abgeschlossen ist THEN soll das Event `onb_complete` mit Payload `{persona, duration, completion_rate}` getrackt werden
7. WHEN ein Beratungstermin gebucht wird THEN soll das Event `handover_booked` mit Payload `{persona, booking_type}` getrackt werden

### Requirement 6: KPIs und Akzeptanzkriterien

**User Story:** Als Produktteam möchten wir klare Erfolgskriterien definieren, damit wir den Erfolg des Onboardings messen können.

#### Acceptance Criteria

1. WHEN das System produktiv ist THEN sollen ≥95% der Solo-Sarah Flows den VC ohne manuellen Eingriff liefern
2. WHEN Bewahrer-Ben das Onboarding durchläuft THEN sollen ≥70% die Checkliste Schritt 1-3 abschließen
3. WHEN Fehler auftreten THEN sollen Fehlerseiten/Empty-States vorhanden sein ohne Sackgassen
4. WHEN Nutzer das Onboarding abschließen THEN soll die Time-to-Value (TTV) gemessen und optimiert werden
5. WHEN Consent-Prozesse durchlaufen werden THEN soll der Prozentsatz mit Profiling-Consent getrackt werden
6. WHEN API-Integrationen verfügbar sind THEN soll der Prozentsatz mit GBP/GA4-Verbindung gemessen werden

### Requirement 7: Persona-spezifische Flow-Diagramme

**User Story:** Als unterschiedlicher Gastronom-Typ möchte ich einen Onboarding-Prozess, der genau zu meinen Bedürfnissen und meiner verfügbaren Zeit passt.

#### Acceptance Criteria

1. WHEN Solo-Sarah erkannt wird THEN soll der Flow sein:
   - 5-Fragen-Heuristik (2 Min) → P0-Daten (5 Min) → Consent (2 Min) → VC-Start (< 1 Min) → Ergebnis (< 3 Min)
   - Maximal 3 Eingabefelder pro Schritt
   - Automatische Weiterleitung ohne Wartezeiten
2. WHEN Bewahrer-Ben erkannt wird THEN soll der Flow sein:
   - 5-Fragen-Heuristik (3 Min) → Erweiterte Daten (10 Min) → Consent + ROI-Tracking (5 Min) → VC-Start → Preview (15 Min) + Vollbericht (24h)
   - ROI-fokussierte Darstellung aller Schritte
   - Optionale Beratungstermin-Buchung
3. WHEN Wachstums-Walter erkannt wird THEN soll der Flow sein:
   - 5-Fragen-Heuristik → Multi-Standort-Setup (20 Min) → Account-Manager-Zuweisung → Strategisches Onboarding-Gespräch
   - Standortübergreifende Datensammlung
   - Automatische Account-Manager-Benachrichtigung
4. WHEN Ketten-Katrin erkannt wird THEN soll der Flow sein:
   - 5-Fragen-Heuristik → Enterprise-Kontaktformular → Sales-Team-Weiterleitung → Individueller Implementierungsplan
   - Direkter Kontakt zu Enterprise-Sales
   - Custom-Integration-Assessment
5. IF ein Nutzer den Flow abbricht THEN sollen persona-spezifische Reaktivierungsstrategien ausgelöst werden

### Requirement 3: Minimum Viable Datensatz (P0)

**User Story:** Als System möchte ich die essentiellen Geschäftsdaten sammeln, die für den ersten Visibility Check ausreichen.

#### Acceptance Criteria

1. WHEN das Basis-Onboarding startet THEN sollen folgende Pflichtfelder erfasst werden:
   - Business-Name (Text, max. 100 Zeichen, Validierung: nicht leer)
   - Ort/Adresse (Text + Geocoding, Validierung: gültige Adresse)
   - E-Mail (Email-Format, Validierung: deliverable)
   - Bevorzugte Sprache (Dropdown: DE/EN)
2. WHEN zusätzliche Daten verfügbar sind THEN sollen folgende optionale Felder angeboten werden:
   - Website/Google-Maps-Link (URL-Validierung)
   - GA4 Measurement ID (Format: G-XXXXXXXXXX)
   - Google Business Profile Location ID
3. WHEN Daten erfasst werden THEN sollen DSGVO-konforme Consent-Toggles angezeigt werden:
   - "Profiling & Personalisierung" (für KI-Empfehlungen)
   - "Marketing-Kommunikation" (für Newsletter/Updates)
   - "3rd-party API-Zugriff" (für Google/Meta-Integration)
4. WHEN Consent-Texte angezeigt werden THEN sollen diese "klar & explizit" in DE/EN verfügbar sein
5. IF ein Pflichtfeld fehlt THEN soll das Onboarding nicht fortsetzbar sein mit spezifischer Fehlermeldung

### Requirement 4: Frühe Erfolgserlebnisse und Wow-Momente

**User Story:** Als Gastronom möchte ich bereits während des Onboardings erste konkrete Erfolge sehen, damit ich motiviert bleibe und den Wert der Plattform erkenne.

#### Acceptance Criteria

1. WHEN Solo-Sarah das Setup startet THEN soll innerhalb von 10 Minuten ein verbessertes Google Business Profil erstellt werden
2. WHEN Bewahrer-Ben Geschäftsdaten eingibt THEN sollen sofort konkrete Kostenoptimierungsvorschläge mit Einsparpotential angezeigt werden
3. WHEN Wachstums-Walter Standortdaten eingibt THEN sollen automatisch Performance-Vergleiche zwischen Standorten generiert werden
4. WHEN Ketten-Katrin APIs verbindet THEN sollen erste automatisierte Benchmark-Reports mit Wettbewerbsvergleich erstellt werden
5. IF ein Erfolgserlebnis nicht innerhalb der definierten Zeit eintritt THEN soll eine alternative Wow-Strategie aktiviert werden

### Requirement 5: Intelligente Setup-Assistenten

**User Story:** Als technisch weniger versierter Gastronom möchte ich durch komplexe Einrichtungsschritte geführt werden, ohne überfordert zu werden.

#### Acceptance Criteria

1. WHEN komplexe API-Integrationen erforderlich sind THEN sollen visuelle Setup-Assistenten mit Schritt-für-Schritt-Anleitungen verfügbar sein
2. WHEN ein Fehler auftritt THEN soll das System intelligente Fehlerbehandlung mit verständlichen Lösungsvorschlägen bieten
3. IF ein Nutzer bei einem Schritt länger als erwartet verweilt THEN soll kontextsensitive Hilfe automatisch angeboten werden
4. WHEN technische Schritte zu komplex werden THEN soll eine "Mach es für mich" Option gegen Aufpreis verfügbar sein
5. WHEN das Setup abgeschlossen ist THEN soll eine Zusammenfassung aller aktivierten Features und nächsten Schritte angezeigt werden

### Requirement 6: Adaptive Komplexitätsstufen

**User Story:** Als System möchte ich mich an die digitale Reife und Bedürfnisse des Nutzers anpassen, nicht umgekehrt.

#### Acceptance Criteria

1. WHEN die digitale Affinität niedrig ist THEN sollen nur Kernfunktionen im initialen Setup aktiviert werden
2. WHEN die digitale Affinität hoch ist THEN sollen erweiterte Features und Anpassungsoptionen verfügbar sein
3. IF ein Nutzer Schwierigkeiten zeigt THEN soll das System automatisch zu einfacheren Alternativen wechseln
4. WHEN ein Nutzer Fortschritte macht THEN sollen schrittweise komplexere Features freigeschaltet werden
5. WHEN das Nutzungsverhalten analysiert wird THEN soll das System kontinuierlich die optimale Komplexitätsstufe anpassen

### Requirement 7: Nahtlose Integration mit Visibility Check

**User Story:** Als Gastronom möchte ich, dass mein Onboarding nahtlos in den ersten Visibility Check übergeht, damit ich sofort den Wert der Plattform erkenne.

#### Acceptance Criteria

1. WHEN das Basis-Setup abgeschlossen ist THEN soll automatisch ein erster Visibility Check gestartet werden
2. WHEN der Visibility Check läuft THEN sollen die Ergebnisse persona-spezifisch visualisiert werden (Ampelsystem für Solo-Sarah, detaillierte Dashboards für Ketten-Katrin)
3. IF der Visibility Check Probleme identifiziert THEN sollen sofort umsetzbare Lösungsvorschläge angeboten werden
4. WHEN der erste VC abgeschlossen ist THEN soll eine Vorher-Nachher-Darstellung der Verbesserungen gezeigt werden
5. WHEN Optimierungen vorgeschlagen werden THEN sollen diese direkt aus dem Onboarding heraus umsetzbar sein

### Requirement 8: Proaktive Unterstützung und Reaktivierung

**User Story:** Als Gastronom möchte ich proaktive Unterstützung erhalten, wenn ich Schwierigkeiten habe oder das Onboarding abbreche.

#### Acceptance Criteria

1. WHEN ein Nutzer das Onboarding abbricht THEN soll eine persona-spezifische Reaktivierungsstrategie ausgelöst werden
2. WHEN Solo-Sarah abbricht THEN soll eine SMS/WhatsApp-Unterstützung angeboten werden
3. WHEN Bewahrer-Ben Schwierigkeiten zeigt THEN soll ein persönlicher Anruf innerhalb von 24h erfolgen
4. WHEN Wachstums-Walter komplexe Integrationen benötigt THEN soll ein Account Manager zugewiesen werden
5. IF technische Probleme auftreten THEN soll automatisch ein Support-Ticket mit Kontext erstellt werden

### Requirement 9: Datenqualität und Validierung

**User Story:** Als System möchte ich sicherstellen, dass alle gesammelten Daten korrekt und vollständig sind, damit die KI-Empfehlungen präzise werden.

#### Acceptance Criteria

1. WHEN Geschäftsdaten eingegeben werden THEN sollen diese in Echtzeit validiert und auf Plausibilität geprüft werden
2. WHEN widersprüchliche Informationen erkannt werden THEN soll das System nachfragen und Korrekturen vorschlagen
3. IF externe Datenquellen verfügbar sind THEN sollen diese zur Validierung und Ergänzung genutzt werden
4. WHEN das Onboarding abgeschlossen ist THEN soll ein Datenqualitäts-Score berechnet und angezeigt werden
5. WHEN Daten unvollständig sind THEN sollen gezielte Nachfragen zu kritischen Zeitpunkten gestellt werden

### Requirement 10: Skalierbare Architektur für alle Personas

**User Story:** Als Plattform möchte ich eine technische Architektur, die von einfachsten bis zu komplexesten Anforderungen skaliert.

#### Acceptance Criteria

1. WHEN das System geladen wird THEN soll es sich automatisch an die Persona-Anforderungen anpassen
2. WHEN einfache Integrationen benötigt werden THEN sollen diese zu 85% automatisierbar sein
3. WHEN Enterprise-Integrationen erforderlich sind THEN sollen maßgeschneiderte Workflows verfügbar sein
4. IF die Nutzerlast steigt THEN soll das System automatisch skalieren ohne Performance-Verlust
5. WHEN neue Personas hinzugefügt werden THEN soll das System erweiterbar sein ohne Architektur-Änderungen
##
# Requirement 8: Risiken und Scope-Cuts (Was explizit NICHT in P0 ist)

**User Story:** Als Entwicklungsteam möchten wir klar definieren, was nicht im ersten Release enthalten ist, damit wir fokussiert liefern können.

#### Acceptance Criteria

1. WHEN P0 definiert wird THEN sind folgende Features explizit ausgeschlossen:
   - Wachstums-Walter und Ketten-Katrin Flows (erst nach Solo-Sarah/Bewahrer-Ben Validierung)
   - Komplexe KI-Empfehlungen (nur Basis-Persona-Erkennung)
   - Multi-Language Support (nur DE/EN)
   - Advanced Analytics und Reporting
   - POS-System-Integrationen
2. WHEN technische Risiken identifiziert werden THEN sollen Fallback-Strategien definiert sein:
   - API-Ausfälle → Cached/Mock-Daten
   - KI-Service-Probleme → Regel-basierte Fallbacks
   - E-Mail-Delivery-Probleme → Alternative Kommunikationswege
3. WHEN Scope-Creep droht THEN soll das Team auf P0-Funktionen fokussiert bleiben
4. WHEN externe Abhängigkeiten kritisch werden THEN sollen interne Alternativen bereitstehen
5. WHEN Performance-Probleme auftreten THEN sollen degradierte Modi verfügbar sein

### Requirement 9: Integration mit bestehenden Komponenten

**User Story:** Als Entwickler möchte ich bestehende Komponenten wiederverwenden, damit ich nicht alles neu entwickeln muss.

#### Acceptance Criteria

1. WHEN das neue Onboarding entwickelt wird THEN sollen bestehende Komponenten wiederverwendet werden:
   - `RestaurantInfoStep.tsx` für Geschäftsdaten-Erfassung
   - `WebsiteAnalysisStep.tsx` für Website/Benchmark-Eingabe
   - `useOnboardingQuestions.ts` für dynamische Fragen
   - `CategorySelector.tsx` für GMB-Kategorien
   - `SmartOnboardingWizard.tsx` als Basis-Framework
2. WHEN neue Komponenten erstellt werden THEN sollen diese das bestehende Design-System nutzen
3. WHEN Datenstrukturen definiert werden THEN sollen diese mit bestehenden Supabase-Tabellen kompatibel sein
4. WHEN Events getrackt werden THEN sollen diese in das bestehende Analytics-System integriert werden
5. WHEN APIs aufgerufen werden THEN sollen bestehende Supabase Edge Functions genutzt werden

### Requirement 10: DSGVO-konforme Consent-Verwaltung

**User Story:** Als Nutzer möchte ich transparent über Datenverwendung informiert werden und granulare Kontrolle haben.

#### Acceptance Criteria

1. WHEN Consent-Optionen angezeigt werden THEN sollen diese klar und verständlich formuliert sein:
   - "Erforderlich für Analyse-Funktionen" vs. "Optional für Marketing"
   - Deutsche und englische Texte verfügbar
   - Klare Erklärung der Datenverwendung
2. WHEN Consent erteilt wird THEN soll dies rechtssicher dokumentiert werden:
   - Timestamp, IP-Adresse, Consent-Version
   - Granulare Speicherung pro Consent-Typ
   - Widerrufsmöglichkeit jederzeit verfügbar
3. WHEN Daten verarbeitet werden THEN sollen nur genehmigte Verwendungszwecke aktiv sein
4. WHEN ein Nutzer Consent widerruft THEN sollen entsprechende Datenverarbeitungen gestoppt werden
5. WHEN Audit-Anfragen kommen THEN soll eine vollständige Consent-Historie verfügbar sein
##
 DSGVO/DOI-Compliance Block (P0)

### Requirement 11: Consent-Datenmodell

**User Story:** Als System möchte ich rechtssichere Einverständniserklärungen speichern und nachweisen können.

#### Acceptance Criteria

1. WHEN `/vc/start` aufgerufen wird THEN sollen in VcTokens (DynamoDB) folgende Felder gespeichert werden:
   - `email_lower`, `name`, `locale`, `purposes:["vc_report"]`
   - `marketing_opt_in_requested:boolean`, `consent_version:"2025-08-25"`
   - `privacy_url`, `terms_url`, `ip_start`, `ua_start`, `token_hash`, `created_at`, `ttl`
2. WHEN `/vc/confirm` aufgerufen wird THEN sollen folgende Felder ergänzt werden:
   - `status:"confirmed"`, `confirmed_at`, `ip_confirm`, `ua_confirm`, `email_verified:true`
   - IF `marketing_opt_in_requested==true` THEN `marketing_consent:true`, `marketing_consent_at`
3. WHEN Consent-Journal implementiert wird (P1) THEN soll eine append-only DDB-Tabelle `ConsentJournal` erstellt werden:
   - Item: `{pk:"email:<lower>", sk:"consent#<ts>#<token_hash>", type:"marketing|processing|email_verification", decision:"granted|denied", version:"2025-08-25", ip, ua, source:"web", link:"/vc/confirm?t=..."}`
4. WHEN Daten gespeichert werden THEN sollen alle Consent-relevanten Felder vollständig und strukturiert vorliegen
5. WHEN Audit-Anfragen kommen THEN soll für jede bestätigte E-Mail-Adresse mindestens 1 Consent-Record reproduzierbar sein

### Requirement 12: Frontend-Consent (UI)

**User Story:** Als Nutzer möchte ich klar verständliche Consent-Optionen haben, die nicht manipulativ sind.

#### Acceptance Criteria

1. WHEN Consent-Checkboxen angezeigt werden THEN sollen diese NICHT vorangekreuzt sein
2. WHEN die Pflicht-Checkbox angezeigt wird THEN soll der Text lauten:
   - "Ich möchte den kostenlosen Visibility-Report per E-Mail erhalten. Ich habe die Datenschutzhinweise gelesen." (Link zu Privacy)
3. WHEN die optionale Marketing-Checkbox angezeigt wird THEN soll der Text lauten:
   - "Ich möchte Produkt-News & Angebote per E-Mail erhalten (Marketing-Einwilligung)."
4. WHEN das Formular abgesendet wird THEN sollen folgende Felder an `/vc/start` gesendet werden:
   - `marketing_opt_in_requested`, `consent_version`, `privacy_url`, `terms_url`
5. WHEN die Pflicht-Checkbox nicht angehakt ist THEN soll das System den Start verhindern

### Requirement 13: DOI-Mail (SES) - Pflichtinhalte

**User Story:** Als Nutzer möchte ich eine rechtskonforme Bestätigungs-E-Mail erhalten, die alle erforderlichen Informationen enthält.

#### Acceptance Criteria

1. WHEN eine DOI-Mail auf Deutsch versendet wird THEN soll sie folgende Inhalte haben:
   - Betreff: "Bitte E-Mail-Adresse bestätigen: Visibility-Report für {{business_name}}"
   - Kerntext: "Du erhältst nach Bestätigung deinen Visibility-Report."
   - Zweck: "Versand des Reports (transaktional). Optional: Marketing, falls angehakt."
   - Anbieter: "matbakh.app (Impressum/Datenschutz-Links)"
   - Button: "E-Mail bestätigen → {{CONFIRM_URL}}"
   - Hinweis: "Wenn du das nicht warst: Ignoriere die E-Mail (keine weiteren Mails)."
   - Footer: List-Unsubscribe Header + Link
2. WHEN eine DOI-Mail auf Englisch versendet wird THEN soll sie sinngemäß identische Inhalte auf Englisch haben
3. WHEN SES-Headers gesetzt werden THEN sollen folgende Header enthalten sein:
   - `List-Unsubscribe`, `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
   - `X-Configuration-Set: matbakh-default`
4. WHEN die DOI-Mail generiert wird THEN sollen alle Pflichtangaben vollständig gerendert werden
5. WHEN Links eingefügt werden THEN sollen diese auf die korrekten Datenschutz- und Impressum-Seiten verweisen

### Requirement 14: Zustelllogik (Compliance)

**User Story:** Als System möchte ich E-Mails nur an verifizierte Adressen mit entsprechendem Consent senden.

#### Acceptance Criteria

1. WHEN ein Visibility-Report versendet wird THEN soll dies nur erfolgen wenn `email_verified==true`
2. WHEN Marketing-E-Mails versendet werden THEN sollen diese nur gesendet werden wenn `marketing_consent==true` UND `email_verified==true`
3. WHEN E-Mails versendet werden THEN soll jede E-Mail einen One-Click-Unsubscribe-Link enthalten
4. WHEN E-Mails versendet werden THEN sollen vollständige Absender-Informationen enthalten sein
5. WHEN ein Nutzer sich abmeldet THEN soll dies sofort wirksam werden und dokumentiert werden

### Requirement 15: Events & Nachweise

**User Story:** Als System möchte ich alle Consent-relevanten Aktionen nachvollziehbar dokumentieren.

#### Acceptance Criteria

1. WHEN Consent-Events auftreten THEN sollen folgende Events emittiert werden:
   - `onb_start`, `persona_assigned`, `consent_granted` (payload: purpose, version, ip, ua)
   - `vc_started`, `vc_result_ready`, `onb_complete`
2. WHEN `consent_granted` getrackt wird THEN soll das Payload enthalten: `{purpose, version, ip, ua, timestamp}`
3. WHEN CloudWatch-Logs geschrieben werden THEN sollen `vc-start` & `vc-confirm` enthalten:
   - `ip_*`, `ua_*`, `token_hash` (KEINE Klartext-Tokens)
4. WHEN Audit-Logs erstellt werden THEN sollen diese vollständig und unveränderlich sein
5. WHEN Compliance-Prüfungen stattfinden THEN sollen alle erforderlichen Nachweise verfügbar sein

### Requirement 16: DOI-Akzeptanzkriterien (P0)

**User Story:** Als Compliance-Team möchte ich sicherstellen, dass alle rechtlichen Anforderungen erfüllt sind.

#### Acceptance Criteria

1. WHEN DOI-Mails generiert werden THEN sollen DE/EN-Versionen mit allen Pflichtangaben gerendert werden
2. WHEN `/vc/confirm` aufgerufen wird THEN soll `email_verified` gesetzt werden UND ggf. `marketing_consent` UND Redirect zu `/vc/result?t=...`
3. WHEN Token-TTL abläuft THEN sollen unbestätigte Tokens gelöscht werden (keine weiteren E-Mails)
4. WHEN Audit durchgeführt wird THEN soll für jede bestätigte Adresse mindestens 1 Consent-Record mit allen Feldern reproduzierbar sein
5. WHEN Checkboxen angezeigt werden THEN sollen diese NICHT vorangekreuzt sein UND ohne Pflicht-Consent kein Start möglich
6. WHEN One-Click-Unsubscribe getestet wird THEN soll dieser funktionieren (SES Config-Set aktiv)
7. WHEN Compliance-Test durchgeführt wird THEN sollen alle DSGVO-Anforderungen erfüllt sein#
# Progressive Onboarding-Strategie (14 Tage)

### Requirement 17: Day-0 Mini-Flow (5-7 Minuten)

**User Story:** Als Gastronom möchte ich in wenigen Minuten erste Ergebnisse sehen, ohne mich zu komplexen Setups verpflichten zu müssen.

#### Acceptance Criteria

1. WHEN der Day-0 Flow startet THEN sollen nur folgende Pflichtfelder erfasst werden:
   - `business_name` (Text, max. 100 Zeichen)
   - `category` (Dropdown, GMB-Kategorien)
   - `angebot_leistungen` (Mehrfachwahl, vordefinierte Optionen)
   - `city_or_address` (Text, für lokale Suche)
   - `email` (validiert)
   - `language` (DE/EN, automatisch erkannt)
2. WHEN Consent-Checkboxen angezeigt werden THEN sollen diese sein:
   - Pflicht: "Ich möchte den kostenlosen Visibility-Report per E-Mail erhalten"
   - Optional: "Ich möchte Produkt-News & Angebote per E-Mail erhalten"
3. WHEN DOI-Prozess durchlaufen wird THEN soll der Flow sein:
   - `/vc/start` → DOI-Mail → `/vc/confirm` → `email_verified=true`
4. WHEN E-Mail bestätigt wird THEN soll sofort ein Visibility Check angestoßen werden
5. WHEN erste Insights verfügbar sind THEN sollen diese < 3 Min nach DOI-Bestätigung angezeigt werden
6. WHEN Persona-Erkennung läuft THEN sollen 3-5 Kurzfragen gestellt werden mit späterer manueller Wechselmöglichkeit

### Requirement 18: Häppchen-Plan (14 Tage, je ≤ 2 Minuten)

**User Story:** Als Gastronom möchte ich schrittweise mein Profil verbessern, ohne überfordert zu werden.

#### Acceptance Criteria

1. WHEN Tag 1 aktiviert wird THEN soll der Schritt "GBP verbinden" verfügbar sein:
   - Google OAuth-Integration
   - Öffnungszeiten-Prüfung
   - Fortschritts-Score +1
2. WHEN Tag 2 aktiviert wird THEN soll der Schritt "GA4 verbinden" verfügbar sein:
   - GA4 Measurement ID eingeben
   - Basis-KPIs ins Dashboard laden
3. WHEN Tag 3 aktiviert wird THEN soll der Schritt "Logo/Profilfotos hochladen" verfügbar sein:
   - Bild-Upload-Interface
   - Qualitäts-Score-Erhöhung sichtbar
4. WHEN Tag 4 aktiviert wird THEN soll der Schritt "Kategorien/Keywords verfeinern" verfügbar sein:
   - Hauptkategorien überprüfen
   - VC-Score neu berechnen
5. WHEN Tag 5 aktiviert wird THEN soll der Schritt "Social-Links verbinden" verfügbar sein:
   - Instagram/Facebook-Links (optional)
6. WHEN Tag 6-14 aktiviert werden THEN sollen Micro-Tasks verfügbar sein:
   - Bewertungen beantworten
   - Menü/Leistungen strukturieren
   - NAP-Check (Name, Address, Phone)
   - Einfache Posts erstellen
7. WHEN jeder Schritt abgeschlossen wird THEN soll der Score sichtbar erhöht werden
8. WHEN ein Schritt übersprungen wird THEN soll eine "Später"-Option verfügbar sein

### Requirement 19: Kommunikation & Reminder

**User Story:** Als Nutzer möchte ich hilfreiche Erinnerungen erhalten, ohne gespamt zu werden.

#### Acceptance Criteria

1. WHEN Reminder versendet werden THEN sollen folgende Kanäle genutzt werden:
   - In-App Banner (primär)
   - E-Mail via SES (sekundär)
2. WHEN E-Mail-Frequenz gesteuert wird THEN soll ein Frequenz-Cap von max. 3 E-Mails/Woche gelten
3. WHEN E-Mails versendet werden THEN soll List-Unsubscribe aktiv sein
4. WHEN E-Mail-Serie definiert wird THEN sollen folgende Templates existieren:
   - "Day-0 VC ready" (sofort nach DOI)
   - "Verbinde GBP" (Tag 1)
   - "Verbinde GA4" (Tag 2)
   - "Fotos hinzufügen" (Tag 3)
   - "Review-Boost" (Tag 7)
   - "Wochenüberblick" (Tag 7, 14)
5. WHEN Deep-Links generiert werden THEN sollen diese das Format haben:
   - `https://matbakh.app/onboarding?step={id}&t={token}` (1-Click Reentry)
   - Signiert und mit Ablaufzeit versehen

### Requirement 20: Daten/Tracking für Progressive Onboarding

**User Story:** Als Produktteam möchten wir den Fortschritt und Erfolg des progressiven Onboardings messen.

#### Acceptance Criteria

1. WHEN Events getrackt werden THEN sollen folgende Events emittiert werden:
   - `step_started` (payload: step_id, day, persona)
   - `step_completed` (payload: step_id, duration, score_change)
   - Bestehende Events: `onb_start`, `persona_assigned`, `consent_granted`, `vc_started`, `vc_result_ready`, `onb_complete`, `handover_booked`
2. WHEN KPIs gemessen werden THEN sollen folgende Metriken getrackt werden:
   - Time-to-Value (TTV) < 3 Min
   - Day-0 Completion ≥ 80%
   - 14-Tage Retention-Onboarding ≥ 50%
   - DOI-Rate ≥ 90%
3. WHEN Fortschritt gespeichert wird THEN soll die DynamoDB-Tabelle `OnboardingProgress` genutzt werden:
   - `pk=email_lower`, `sk=step#date`
   - TTL für inaktive Pfade (30 Tage)
4. WHEN Analytics ausgewertet werden THEN sollen Conversion-Raten pro Schritt verfügbar sein
5. WHEN Performance gemessen wird THEN sollen Ladezeiten und Fehlerquoten pro Schritt getrackt werden

### Requirement 21: Fehler- und Abbruchpfade (Progressive)

**User Story:** Als Nutzer möchte ich auch bei Problemen oder Unterbrechungen eine gute Erfahrung haben.

#### Acceptance Criteria

1. WHEN kein GBP/GA4 verfügbar ist THEN soll ein Guest-Mode VC angeboten werden mit späterer Verbindungsmöglichkeit
2. WHEN ein Nutzer einen Schritt abbricht THEN soll eine Resume-Mail mit Deep-Link versendet werden
3. WHEN Rate-Limits erreicht werden THEN soll das System robust reagieren mit Retry-Mechanismen
4. WHEN Fehlerseiten angezeigt werden THEN sollen diese keine Sackgassen sein
5. WHEN ein Nutzer inaktiv wird THEN soll nach 7 Tagen eine sanfte Reaktivierungs-E-Mail versendet werden

### Requirement 22: Progressive Onboarding Akzeptanzkriterien

**User Story:** Als Qualitätssicherung möchten wir sicherstellen, dass das progressive Onboarding funktioniert.

#### Acceptance Criteria

1. WHEN Day-0 durchgeführt wird THEN soll in 95% der Fälle ein verlässlicher VC ohne manuellen Eingriff geliefert werden
2. WHEN Micro-Steps durchgeführt werden THEN soll jeder Schritt ≤ 2 Min dauern und mobil bedienbar sein
3. WHEN "Später"-Optionen genutzt werden THEN sollen diese klar verfügbar und funktional sein
4. WHEN DOI/Consent durchgeführt wird THEN soll dies wie im DSGVO-Block spezifiziert funktionieren
5. WHEN Reminder-Mails versendet werden THEN sollen diese One-Click-Unsubscribe haben und Config-Set aktiv sein
6. WHEN der Fortschritt gemessen wird THEN sollen alle definierten KPIs trackbar und auswertbar sein
7. WHEN das System getestet wird THEN sollen alle Fehler- und Abbruchpfade ohne Sackgassen funktionieren#
# Inklusive Kommunikation & Progressive Ansprache (DSGVO-konform)

### Requirement 23: Prinzipien & Compliance für inklusive Kommunikation

**User Story:** Als Nutzer möchte ich respektvolle, inklusive Kommunikation erhalten, die meine Präferenzen berücksichtigt, ohne diskriminiert zu werden.

#### Acceptance Criteria

1. WHEN das System Kommunikation generiert THEN soll KEIN Inferenz-Profiling sensibler Merkmale (Geschlecht, Herkunft, Alter) stattfinden
2. WHEN Kommunikationsstile angeboten werden THEN sollen diese präferenzbasiert statt demografisch sein
3. WHEN freiwillige Angaben angeboten werden THEN sollen diese nur opt-in, mit klarem Zweck, jederzeit änderbar sein
4. WHEN Präferenzen gespeichert werden THEN sollen diese NICHT für Differenzierung der Leistungen genutzt werden, nur für Texte/Ton
5. WHEN keine Präferenzen angegeben werden THEN soll ein neutraler Standard ohne Abfrage verwendet werden

### Requirement 24: Day-0 Communication Preferences (≤30 Sekunden)

**User Story:** Als Nutzer möchte ich schnell meine Kommunikationspräferenzen einstellen, damit die Ansprache zu mir passt.

#### Acceptance Criteria

1. WHEN Communication Preferences angezeigt werden THEN sollen folgende Optionen verfügbar sein:
   - Anrede: Sie / Du / Neutral
   - Ton: Faktenfokussiert / Ermutigend / Kurz & direkt
   - Hilfsstufe: Schnellstart / Standard / Einfach erklärt
   - Lesbarkeit/Barrierefreiheit: Größere Schrift (UI-Toggle), Tooltips anzeigen, Schritt-für-Schritt
   - Sprache: DE (Default), EN (weitere Sprachen später)
2. WHEN Präferenzen ausgewählt werden THEN soll die Auswahl ≤ 30 Sekunden dauern
3. WHEN Präferenzen gespeichert werden THEN sollen diese als `CommunicationPrefs` (nicht-personenbezogene Klassifizierung) gespeichert werden
4. WHEN Nutzer Präferenzen ändern möchten THEN sollen diese jederzeit in den Profileinstellungen änderbar sein
5. WHEN keine Präferenzen gewählt werden THEN soll eine Skip-Option verfügbar sein mit neutralen Standardwerten

### Requirement 25: Copy-Varianten-Bibliothek (Message Bank)

**User Story:** Als System möchte ich für jeden Onboarding-Schritt passende Textvarianten haben, die den Nutzerpräferenzen entsprechen.

#### Acceptance Criteria

1. WHEN Copy-Varianten erstellt werden THEN sollen pro Onboarding-Schritt 3 Ton-Varianten existieren:
   - Ermutigend: "Super, noch 2 Schritte – dann ist dein Report da."
   - Faktenfokussiert: "Nächster Schritt: Kategorie wählen. Dauer: ~30 Sek."
   - Kurz & direkt: "Kategorie wählen → Weiter"
2. WHEN Anrede-Varianten gerendert werden THEN sollen Token verwendet werden:
   - `{GREET_SIE}`, `{GREET_DU}`, `{GREET_NEUTRAL}`
3. WHEN "Einfach erklärt"-Modus aktiv ist THEN sollen Texte folgende Kriterien erfüllen:
   - Kurze Sätze (max. 12-15 Wörter)
   - Keine Fachbegriffe
   - Klare, einfache Sprache
4. WHEN Copy-Varianten ausgewählt werden THEN soll dies basierend auf Nutzerpräferenzen erfolgen
5. WHEN neue Schritte hinzugefügt werden THEN sollen alle 3 Ton-Varianten + "Einfach erklärt"-Version erstellt werden

### Requirement 26: Progressive 14-Tage-Flows (Communication-angepasst)

**User Story:** Als Nutzer möchte ich während des 14-Tage-Flows Kommunikation erhalten, die meinem gewählten Stil entspricht.

#### Acceptance Criteria

1. WHEN 14-Tage Micro-Tasks erstellt werden THEN soll jede Task 3 Copy-Varianten + "Einfach erklärt"-Version haben
2. WHEN E-Mails aus der SES-Serie versendet werden THEN sollen diese 2 Betreff-Varianten haben:
   - Ermutigend: "🎉 Dein Restaurant wird noch sichtbarer!"
   - Faktenbasiert: "Schritt 2: Google Analytics verbinden"
3. WHEN E-Mail-Varianten getestet werden THEN sollen GA4-Experimente für A/B-Tests eingerichtet werden
4. WHEN Reminder versendet werden THEN sollen diese dem gewählten Kommunikationsstil entsprechen
5. WHEN Deep-Links generiert werden THEN sollen diese die Präferenzen beibehalten

### Requirement 27: UI-Mechaniken für inklusive Kommunikation

**User Story:** Als Nutzer möchte ich eine barrierefreie, anpassbare Benutzeroberfläche haben.

#### Acceptance Criteria

1. WHEN "Einfach erklärt"-Modus verfügbar ist THEN soll der Toggle immer sichtbar sein und sich die Wahl merken
2. WHEN Tooltips angeboten werden THEN sollen diese on-demand und nicht aufdringlich sein
3. WHEN "Später"-Optionen angezeigt werden THEN sollen diese bei jedem Schritt verfügbar sein mit Reminder-Deep-Link
4. WHEN die UI gerendert wird THEN soll sie Mobile-First mit großen CTAs und klarer Fortschrittsanzeige sein
5. WHEN Barrierefreiheits-Optionen aktiviert werden THEN sollen größere Schrift und erweiterte Tooltips verfügbar sein

### Requirement 28: Events, Messung & Experimente für inklusive Kommunikation

**User Story:** Als Produktteam möchten wir die Wirksamkeit inklusiver Kommunikation messen, ohne sensible Daten zu sammeln.

#### Acceptance Criteria

1. WHEN Communication-Events getrackt werden THEN sollen folgende Events emittiert werden:
   - `prefs_set` (payload: tone, address, help_level, language)
   - `copy_variant_served` (view_id, variant_id)
   - `assist_mode_used` (tooltips=on/off, simple_mode=true/false)
2. WHEN Custom Dimensions definiert werden THEN sollen diese sein:
   - `onb_tone`, `onb_address`, `onb_help_level`, `onb_copy_variant`
3. WHEN KPIs gemessen werden THEN sollen folgende Metriken getrackt werden:
   - Day-0 Completion Rate nach Tone/Address/Help segmentiert (ohne sensible Merkmale)
   - Time-to-Value (TTV) Median < 3 Min (alle Varianten)
   - Bounce-Rate je Schritt vs. "Einfach erklärt" Nutzung
   - E-Mail-Open/Click nach Copy-Variante (A/B)
4. WHEN Guardrails implementiert werden THEN sollen diese sicherstellen:
   - Keine automatische Ableitung von Geschlecht/Herkunft
   - Keine Diskriminierung bei Leistungen
   - Varianten nur basierend auf opt-in-Präferenzen oder anonymem Verhalten
5. WHEN Experimente durchgeführt werden THEN sollen diese ethisch und DSGVO-konform sein

### Requirement 29: Datenmodell für Communication Preferences

**User Story:** Als System möchte ich Kommunikationspräferenzen strukturiert und DSGVO-konform speichern.

#### Acceptance Criteria

1. WHEN Communication Preferences gespeichert werden THEN soll die Struktur sein:
   ```json
   user_profile.communication_prefs: {
     address: 'sie|du|neutral',
     tone: 'encouraging|facts|brief',
     help: 'fast|standard|simple',
     language: 'de|en',
     fontScale: 1|1.2,
     tooltips: true|false,
     created_at: timestamp,
     updated_at: timestamp
   }
   ```
2. WHEN Events in DDB/GA4 gespeichert werden THEN sollen diese wie in Requirement 28 spezifiziert sein
3. WHEN der bestehende Consent-Block verwendet wird THEN soll dieser unverändert bleiben (DOI/Marketing)
4. WHEN Daten exportiert werden THEN sollen Communication Preferences im Export enthalten sein
5. WHEN Daten gelöscht werden THEN sollen Communication Preferences vollständig entfernt werden

### Requirement 30: Akzeptanzkriterien für inklusive Kommunikation

**User Story:** Als Qualitätssicherung möchten wir sicherstellen, dass inklusive Kommunikation korrekt funktioniert.

#### Acceptance Criteria

1. WHEN Day-0 Screen angezeigt wird THEN soll "Communication Preferences" optional mit Skip-Option verfügbar sein (≤ 30 Sek)
2. WHEN Kernansichten gerendert werden THEN sollen passende Copy-Varianten + Sie/Du/Neutral korrekt angezeigt werden
3. WHEN "Einfach erklärt"-Modus getestet wird THEN soll dieser Abbrüche um ≥ 15% bei Erstbesuchern senken (A/B über 7 Tage)
4. WHEN Compliance geprüft wird THEN soll keine personenbezogene Inferenz sensibler Daten stattfinden
5. WHEN Präferenzen verwaltet werden THEN sollen alle Präferenzen editierbar sein
6. WHEN Datenrechte ausgeübt werden THEN sollen Export/Löschung aller Communication Preferences möglich sein
7. WHEN Barrierefreiheit getestet wird THEN sollen alle UI-Elemente mit Screenreadern und Tastatur bedienbar sein#
# Dualer Onboarding-Modus: VCC Quick & Dirty + Subscription/Extended

### Requirement 31: VCC Quick & Dirty Modus (Lead-Gen)

**User Story:** Als Gastronom möchte ich in wenigen Minuten einen ersten Visibility Check erhalten, ohne mich zu einem langen Prozess verpflichten zu müssen.

#### Acceptance Criteria

1. WHEN VCC Quick & Dirty gewählt wird THEN sollen nur folgende Pflichtfelder erfasst werden (≤ 2-3 Min):
   - `email` (mit DOI-Prozess)
   - `business_name` (Text, max. 100 Zeichen)
   - `category` (Dropdown, GMB-Kategorien)
   - `angebot_leistungen` (Mehrfachwahl, vordefinierte Optionen)
   - `city_or_address` (Text für lokale Suche)
   - `language` (DE Default, EN verfügbar)
   - Consent: Report (Pflicht) + Marketing (optional)
2. WHEN der Quick-Flow durchlaufen wird THEN soll der Ablauf sein:
   - `/vc/start` → DOI-Mail → `/vc/confirm` → VC sofort rendern
3. WHEN ein Account erstellt wird THEN soll dieser leichtgewichtig sein:
   - Passwortlos/OTP für Fortsetzen & Downloads
   - Minimale Datenstruktur für Resume-Funktionalität
4. WHEN i18n verwendet wird THEN sollen DE (Default) und EN verfügbar sein
5. WHEN der VC abgeschlossen ist THEN soll sofort ein 30%-Tier-Report verfügbar sein

### Requirement 32: Subscription/Extended Modus (Vollprozess)

**User Story:** Als Gastronom möchte ich einen umfassenden Onboarding-Prozess durchlaufen, der jederzeit pausierbar ist und meinen Fortschritt speichert.

#### Acceptance Criteria

1. WHEN Extended-Modus gewählt wird THEN soll eine Info angezeigt werden:
   - "Ca. 40 Minuten gesamt, jederzeit pausierbar, Fortschritt wird gespeichert"
2. WHEN der Extended-Prozess läuft THEN soll die Mechanik sein:
   - Micro-Tasks (≤ 2 Min je Schritt)
   - Deep-Links zum Wiederaufnehmen mit Signierung und Ablaufzeit
   - Automatische Fortschritts-Speicherung nach jedem Schritt
3. WHEN ein Nutzer pausiert THEN soll der Fortschritt in OnboardingProgress (DDB) gespeichert werden
4. WHEN ein Nutzer zurückkehrt THEN soll der Deep-Link den exakten Fortschritt wiederherstellen
5. WHEN der Prozess unterbrochen wird THEN sollen Resume-E-Mails nach 24h, 72h, 7 Tagen versendet werden

### Requirement 33: Progress & Reward-Tiers (Gamification)

**User Story:** Als Gastronom möchte ich meinen Fortschritt sehen und schrittweise wertvollere Berichte freischalten.

#### Acceptance Criteria

1. WHEN Progress berechnet wird THEN soll die Formel sein:
   - `progress = answered_weighted / required_weighted`
   - Core-Felder (höher gewichtet): Kategorie, Standort, Öffnungszeiten, NAP, primäre Plattform-Links, Hauptleistungen
   - Non-Core (niedriger gewichtet): Bilder, Sekundär-Keywords, Wettbewerberliste
2. WHEN Tiers erreicht werden THEN sollen folgende Freischaltungen erfolgen:
   - **30%**: Erster Analyse-Report (Ranking vs. anonymisierte Peers) + PDF-Download
   - **50%**: Erweiterte Sichtbarkeitsanalyse (alle Medien) + "ungenutztes Potenzial" + Kurz-Empfehlungen
   - **80%**: SWOT-Analyse (Stärken/Schwächen/Chancen/Risiken) datenbasiert
   - **90%**: Standortanalyse (Lage/Einzugsgebiet/Umfeldsignale)
   - **95%**: Balanced Scorecard-Mini (Kunden/Prozess/Lernen/Finanzen)
   - **100%**: Vollreport + "Next 30 Days"-Plan
3. WHEN die Competition-UI angezeigt wird THEN soll sie enthalten:
   - Fortschritts-Ring mit aktueller Prozent-Anzeige
   - Badges ("30% freigeschaltet", "50% freigeschaltet", etc.)
   - Peer-Vergleich anonymisiert (Quartile/Perzentile, keine Firmennamen Dritter)
4. WHEN ein Tier erreicht wird THEN soll sofort der entsprechende Report generiert werden
5. WHEN Peer-Vergleiche angezeigt werden THEN sollen diese vollständig anonymisiert sein

### Requirement 34: DSGVO & Ethik-Guardrails für Dual-Modus

**User Story:** Als Nutzer möchte ich sicherstellen, dass auch im gamifizierten System meine Daten ethisch und DSGVO-konform verarbeitet werden.

#### Acceptance Criteria

1. WHEN Consent-Gating angewendet wird THEN soll dies wie bereits spezifiziert funktionieren:
   - Report erst nach DOI-Bestätigung
   - Marketing nur mit explizitem Opt-in
2. WHEN Kommunikation generiert wird THEN sollen KEINE sensiblen Merkmale abgeleitet werden:
   - Kein Inferenz-Profiling von Geschlecht, Herkunft, Alter
   - Kommunikation nur per explizite Preferences (Sie/Du/Neutral, Ton, Hilfegrad)
3. WHEN Kultur/Zielgruppen-Analysen durchgeführt werden THEN sollen diese begrenzt sein auf:
   - Aggregierte, öffentliche Markt-/Region-Signale
   - Keine individuellen Profile
   - Dokumentierte Quellen und Aggregationsstufen
4. WHEN Datenrechte ausgeübt werden THEN sollen Fortschritt & Antworten exportier-/löschbar sein per `user_id|email_lower`
5. WHEN Peer-Vergleiche erstellt werden THEN sollen diese vollständig anonymisiert und aggregiert sein

### Requirement 35: State Machine für Dual-Modus

**User Story:** Als System möchte ich den Onboarding-Status klar verwalten und Übergänge zwischen Modi ermöglichen.

#### Acceptance Criteria

1. WHEN States definiert werden THEN sollen folgende verfügbar sein:
   - `lead_quick`: VCC Quick & Dirty Modus aktiv
   - `extended_opted_in`: Extended-Modus gewählt
   - `in_progress`: Extended-Onboarding läuft
   - `paused`: Extended-Onboarding pausiert
   - `tier_30`, `tier_50`, `tier_80`, `tier_90`, `tier_95`: Entsprechende Tiers erreicht
   - `complete`: 100% Onboarding abgeschlossen
2. WHEN Transitions erfolgen THEN sollen diese via Micro-Tasks ausgelöst werden:
   - Jeder Task ≤ 2 Min
   - "Später"-Option immer verfügbar
   - Resume über signierte Deep-Links
3. WHEN ein State-Wechsel erfolgt THEN soll dieser in OnboardingProgress (DDB) dokumentiert werden
4. WHEN ein Nutzer von Quick zu Extended wechselt THEN sollen bereits erfasste Daten übernommen werden
5. WHEN ein Nutzer pausiert THEN soll der State `paused` mit Timestamp gesetzt werden

### Requirement 36: Events & KPIs für Dual-Modus

**User Story:** Als Produktteam möchten wir den Erfolg beider Onboarding-Modi messen und optimieren.

#### Acceptance Criteria

1. WHEN neue Events definiert werden THEN sollen folgende hinzugefügt werden:
   - `onb_mode_selected` (payload: mode="quick|extended")
   - `tier_unlocked` (payload: percentage=30|50|80|90|95|100)
   - `report_generated` (payload: tier, format="pdf|web")
   - `pause` (payload: current_progress, step_id)
   - `resume` (payload: pause_duration_hours, deep_link_used)
   - `download_report` (payload: tier, format)
   - `handover_booked` (payload: tier_at_booking)
2. WHEN KPIs gemessen werden THEN sollen folgende Zielwerte gelten:
   - Time-to-Value Quick < 3 Min
   - Day-0 Completion Quick ≥ 80%
   - First-Report @30% Conversion ≥ 60%
   - Resume Rate nach Pause ≥ 50%
   - Extended Completion (14 Tage) ≥ 50%
3. WHEN Events getrackt werden THEN sollen diese in das bestehende Analytics-System integriert werden
4. WHEN A/B-Tests durchgeführt werden THEN sollen diese tier-spezifisch segmentiert werden
5. WHEN Performance gemessen wird THEN sollen Tier-Unlock-Zeiten und Report-Generierung-Zeiten getrackt werden

### Requirement 37: i18n & Copy für Dual-Modus

**User Story:** Als internationaler Nutzer möchte ich tier-spezifische Inhalte in meiner Sprache erhalten.

#### Acceptance Criteria

1. WHEN i18n-Keys definiert werden THEN sollen folgende Strukturen existieren:
   - `locales/{de,en}/vc_result.json`: `tier30.title/desc`, `tier50.*`, ..., `tier100.*`
   - `locales/{de,en}/onboarding.json`: Mode-spezifische Texte
2. WHEN Copy-Varianten erstellt werden THEN sollen diese den bestehenden Leitlinien folgen:
   - Drei Tonvarianten (ermutigend/fakten/kurz)
   - "Einfach erklärt"-Version (≤ 12-15 Wörter)
   - Sie/Du/Neutral-Varianten per Token
3. WHEN E-Mails für Quick-Modus versendet werden THEN sollen folgende Templates existieren:
   - "Dein erster VC ist da" (Day-0)
   - "Hol dir 50% für Potenzial-Insights" (Day-2)
   - "80% für SWOT-Analyse" (Day-5)
   - Frequenz-Cap ≤ 3 E-Mails/Woche
4. WHEN Sprache gewählt wird THEN soll UI-Sprache == E-Mail-Sprache sein
5. WHEN Tier-Texte angezeigt werden THEN sollen diese persona- und präferenz-spezifisch gerendert werden

### Requirement 38: Daten & Berichte für Dual-Modus

**User Story:** Als System möchte ich tier-spezifische Berichte generieren und versioniert speichern.

#### Acceptance Criteria

1. WHEN Report-Rendering erfolgt THEN sollen PDFs für alle Tiers (30/50/80/90/95/100%) verfügbar sein:
   - Sprachabhängige Generierung (DE/EN)
   - Speicherung in S3 mit per-user Prefix
   - SSE-KMS Verschlüsselung
2. WHEN Berichte versioniert werden THEN sollen diese enthalten:
   - `report_version` mit Semantic Versioning
   - Changelog im Dokument für Transparenz
   - Generierungs-Timestamp und verwendete Datenquellen
3. WHEN Progress gespeichert wird THEN soll die Struktur sein:
   - OnboardingProgress (DDB): State, Tier, Timestamps
   - answers_{section} (Postgres/Supabase): Detaillierte Antworten
   - Nightly Export nach S3 Data Lake
4. WHEN Berichte generiert werden THEN sollen diese den DSGVO-Anforderungen entsprechen:
   - Keine PII in anonymisierten Peer-Vergleichen
   - Klare Datenquellen-Attribution
   - Löschbarkeit über user_id
5. WHEN Tier-Inhalte erstellt werden THEN sollen diese datenbasiert und nachvollziehbar sein

### Requirement 39: Akzeptanzkriterien für Dual-Modus (P0)

**User Story:** Als Qualitätssicherung möchten wir sicherstellen, dass beide Onboarding-Modi korrekt funktionieren.

#### Acceptance Criteria

1. WHEN Quick-Flow getestet wird THEN soll der Ablauf sein: DOI → VC in < 3 Min → Download @30%
2. WHEN Extended-Modus getestet wird THEN sollen Pausieren/Resume beliebig funktionieren
3. WHEN Tiers erreicht werden THEN sollen sofort die passenden Module/E-Mails ausgelöst werden
4. WHEN Deep-Links verwendet werden THEN sollen diese 7-14 Tage gültig sein und korrekt funktionieren
5. WHEN DSGVO-Compliance geprüft wird THEN sollen alle Nachweise vollständig sein
6. WHEN One-Click-Unsubscribe getestet wird THEN soll dieser überall aktiv sein
7. WHEN i18n getestet wird THEN sollen alle Tier-Texte in DE/EN vorhanden sein
8. WHEN keine Sackgassen existieren THEN soll jeder Schritt eine "Später"- oder "Zurück"-Option haben
9. WHEN Performance gemessen wird THEN sollen alle definierten KPIs erreichbar sein
10. WHEN Fehlerbehandlung getestet wird THEN sollen alle Edge Cases abgefangen werden#
# Business Card / Visitenkarte (Conversion-Optimiert)

### Requirement 40: "Proof & Trust"-Zeile mit Mikro-Badges

**User Story:** Als Besucher möchte ich sofort sehen, dass die Plattform vertrauenswürdig und schnell ist.

#### Acceptance Criteria

1. WHEN die Visitenkarte angezeigt wird THEN sollen 3 Mikro-Badges unter dem Namen erscheinen:
   - ✓ DSGVO-konform
   - ✓ E-Mail verifiziert (nur nach DOI-Bestätigung)
   - ⏱ <3 Min Report
2. WHEN die Badges gerendert werden THEN sollen sie dezent aber sichtbar platziert sein
3. WHEN ein Badge nicht zutrifft THEN soll es ausgeblendet werden (z.B. E-Mail verifiziert vor DOI)
4. WHEN Badges geklickt werden THEN sollen kurze Tooltips mit Erklärungen erscheinen
5. WHEN A/B-Tests durchgeführt werden THEN soll die Conversion-Wirkung messbar sein

### Requirement 41: Hero-Block mit Single CTA

**User Story:** Als Besucher möchte ich eine klare, einzige Handlungsaufforderung ohne Verwirrung durch mehrere Optionen.

#### Acceptance Criteria

1. WHEN der Hero-Block angezeigt wird THEN soll links stehen:
   - Name (business_name)
   - Kategorie (category)
   - Ort (city_or_address)
   - 1-Zeiler "Was ihr anbietet" (offerings)
2. WHEN der CTA-Button angezeigt wird THEN soll rechts genau EIN Button stehen:
   - Vor DOI: "E-Mail bestätigen & Report starten"
   - Nach DOI: "Sofort-Report anzeigen"
3. WHEN keine zweite Primäraktion vorhanden ist THEN sollen Drop-offs reduziert werden
4. WHEN der Button geklickt wird THEN soll der entsprechende Flow gestartet werden
5. WHEN der Hero-Block responsive ist THEN soll er auf Mobile optimal dargestellt werden

### Requirement 42: "Einfach erklärt"-Toggle (sichtbar)

**User Story:** Als Nutzer möchte ich komplexe Inhalte in einfacher Sprache lesen können.

#### Acceptance Criteria

1. WHEN der Toggle angezeigt wird THEN soll er permanent sichtbar und zugänglich sein
2. WHEN der Toggle aktiviert wird THEN sollen sofort alle Texte auf kurze Sätze (≤ 12-15 Wörter) umschalten
3. WHEN die Wahl getroffen wird THEN soll sie in CommunicationPrefs gespeichert werden
4. WHEN A/B-Tests durchgeführt werden THEN sollen messbar weniger Abbrüche bei Erstanwendung auftreten
5. WHEN der Modus gewechselt wird THEN soll die Änderung sofort ohne Reload sichtbar sein

### Requirement 43: Progress-Ring (dezent) mit Belohnungs-Preview

**User Story:** Als Nutzer möchte ich meinen Fortschritt sehen und wissen, was mich bei den nächsten Stufen erwartet.

#### Acceptance Criteria

1. WHEN der Progress-Ring angezeigt wird THEN soll er dezent mit % und kurzem Text erscheinen:
   - "Bei 30% bekommst du deinen ersten PDF-Report"
2. WHEN der Ring geklickt/gehovered wird THEN soll eine kompakte Tier-Liste als Tooltip erscheinen:
   - 30/50/80/90/95/100% mit kurzen Beschreibungen
3. WHEN kein großer Block verwendet wird THEN soll die UI clean und fokussiert bleiben
4. WHEN der Fortschritt aktualisiert wird THEN soll der Ring animiert reagieren
5. WHEN Mobile-Ansicht verwendet wird THEN soll der Ring angemessen skaliert werden

### Requirement 44: i18n-Quick Switch

**User Story:** Als internationaler Nutzer möchte ich schnell zwischen Sprachen wechseln können.

#### Acceptance Criteria

1. WHEN der Sprachumschalter angezeigt wird THEN soll er direkt im Header (DE/EN) verfügbar sein
2. WHEN die Sprache gewechselt wird THEN sollen E-Mails der UI-Sprache folgen
3. WHEN gemischtes Publikum vorhanden ist THEN soll der Switch sofort helfen
4. WHEN die Sprache geändert wird THEN soll die Änderung in user_profile.language gespeichert werden
5. WHEN weitere Sprachen hinzugefügt werden THEN soll das System erweiterbar sein

### Requirement 45: SEO & Share (kostenarm)

**User Story:** Als Geschäftsinhaber möchte ich, dass meine Visitenkarte teilbar und SEO-optimiert ist.

#### Acceptance Criteria

1. WHEN SEO-Meta-Tags generiert werden THEN sollen OpenGraph + JSON-LD LocalBusiness enthalten sein:
   - Name, Kategorie, Ort, Web/Maps-Link
2. WHEN ein teilbarer Link erstellt wird THEN soll dieser signiert und 7 Tage gültig sein
3. WHEN der Link geteilt wird THEN soll er die Visitenkarte + aktuellen Score zeigen
4. WHEN JSON-LD validiert wird THEN soll es strukturierte Daten korrekt enthalten
5. WHEN OpenGraph-Preview getestet wird THEN soll es korrekt in Social Media erscheinen

### Requirement 46: Vertrauens-Footer (minimal)

**User Story:** Als Nutzer möchte ich Transparenz über Datenschutz und Kommunikation haben.

#### Acceptance Criteria

1. WHEN der Footer angezeigt wird THEN soll er enthalten:
   - Impressum/Datenschutz Links
   - List-Unsubscribe-Hinweis
2. WHEN der Mini-Text angezeigt wird THEN soll er lauten:
   - "Wir schicken nur Report-Updates & Onboarding-Tipps (opt-out jederzeit)."
3. WHEN der Footer minimal gehalten wird THEN soll er nicht von der Hauptaktion ablenken
4. WHEN Links geklickt werden THEN sollen sie in neuen Tabs öffnen
5. WHEN DSGVO-Compliance geprüft wird THEN sollen alle erforderlichen Hinweise vorhanden sein

### Requirement 47: Visitenkarten-Events (4 Events)

**User Story:** Als Produktteam möchten wir die Visitenkarten-Performance mit minimalen Events messen.

#### Acceptance Criteria

1. WHEN Events definiert werden THEN sollen genau 4 Events getrackt werden:
   - `vc_card_view` (payload: business_name, language, referrer)
   - `cta_primary_click` (payload: cta_type="confirm_email|show_report", progress_pct)
   - `simple_mode_toggle` (payload: enabled=true|false, previous_state)
   - `share_link_copied` (payload: share_method, current_tier)
2. WHEN Analytics-Overkill vermieden wird THEN sollen nur diese 4 Events verwendet werden
3. WHEN Events getrackt werden THEN sollen sie in das bestehende Analytics-System integriert werden
4. WHEN A/B-Tests durchgeführt werden THEN sollen diese Events als Basis dienen
5. WHEN Performance gemessen wird THEN sollen Conversion-Raten pro Event verfügbar sein

### Requirement 48: Business Card Datenmodell (P0)

**User Story:** Als System möchte ich die Visitenkarten-Daten strukturiert und minimal speichern.

#### Acceptance Criteria

1. WHEN das Datenmodell definiert wird THEN soll es folgende Struktur haben:
   ```json
   {
     "business_card": {
       "business_name": "string",
       "category": "string", 
       "offerings": ["string"],
       "city_or_address": "string",
       "website_url": "string|null",
       "gmap_url": "string|null",
       "language": "de|en",
       "email_verified": true|false,
       "progress_pct": 0-100,
       "tier_unlocked": 0|30|50|80|90|95|100
     }
   }
   ```
2. WHEN weitere Details benötigt werden THEN sollen diese späteren Häppchen-Schritten vorbehalten bleiben:
   - Öffnungszeiten, Bilder, detaillierte Beschreibungen
3. WHEN das Modell erweitert wird THEN soll es rückwärtskompatibel bleiben
4. WHEN Daten validiert werden THEN sollen alle Felder den definierten Typen entsprechen
5. WHEN das Modell gespeichert wird THEN soll es in Supabase user_profiles integriert werden

### Requirement 49: Visitenkarten-Copy (DE) - Direkt verwendbar

**User Story:** Als Content-Team möchten wir sofort verwendbare, getestete Copy-Texte haben.

#### Acceptance Criteria

1. WHEN CTA-Texte verwendet werden THEN sollen diese sein:
   - Vor DOI: "E-Mail bestätigen & Report starten"
   - Nach DOI: "Sofort-Report anzeigen"
2. WHEN "Einfach erklärt"-Toggle verwendet wird THEN sollen die Texte sein:
   - Ein: "Kurze Sätze aktiv"
   - Aus: "Kurze Sätze aus"
3. WHEN Progress-Hint angezeigt wird THEN soll er lauten:
   - "Bei 30% erhältst du deinen ersten PDF-Report."
4. WHEN Mikro-Badge-Tooltips angezeigt werden THEN sollen sie kurz und prägnant sein
5. WHEN Copy-Varianten getestet werden THEN sollen A/B-Tests die Wirksamkeit messen

### Requirement 50: Visitenkarten-Akzeptanzkriterien

**User Story:** Als Qualitätssicherung möchten wir sicherstellen, dass die Visitenkarte optimal performt.

#### Acceptance Criteria

1. WHEN Performance gemessen wird THEN soll LCP < 2s auf der Visitenkarte erreicht werden
2. WHEN UI-Design geprüft wird THEN soll genau 1 Primär-CTA vorhanden sein
3. WHEN Navigation getestet wird THEN sollen keine UI-Sackgassen existieren
4. WHEN i18n-Switch verwendet wird THEN soll sich die Sprache in E-Mails widerspiegeln
5. WHEN "Einfach erklärt" getestet wird THEN sollen Abbrüche um ≥ 10% reduziert werden (7-Tage-Test)
6. WHEN JSON-LD validiert wird THEN soll es strukturierte Daten korrekt enthalten
7. WHEN OpenGraph-Preview getestet wird THEN soll es in Social Media korrekt erscheinen
8. WHEN Mobile-Responsiveness geprüft wird THEN soll die Visitenkarte auf allen Geräten optimal dargestellt werden
9. WHEN Accessibility getestet wird THEN sollen alle Elemente screenreader-kompatibel sein
10. WHEN Load-Tests durchgeführt werden THEN soll die Visitenkarte auch bei hoher Last performant bleiben