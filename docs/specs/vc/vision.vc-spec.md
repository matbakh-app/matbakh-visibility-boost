# VC Vision Spec (User Journey & Microcopy)

**Status:** DRAFT • **Audience:** Produkt/Design/Content • **Last updated:** <AUTO/Kiro>

## 0. Leitbild

Der VC liefert **realitätsgetreue** Sichtbarkeitsergebnisse für einen Betrieb – klar, freundlich, ohne Business-Jargon – und verwandelt diese in **direkte nächste Schritte** mit **One-Click-Freigabe** für Google, Facebook und Instagram. Ziel: **mehr Gäste & mehr Umsatz**.

---

## 1. Kernversprechen (in einfacher Sprache)

- „Wir zeigen dir ehrlich, wo du online stehst – im Vergleich zu ähnlichen Betrieben in deiner Nähe."
- „Wir bereiten dir passende Beiträge & To-dos vor. Du prüfst kurz und gibst frei – fertig."
- „Wir schätzen transparent, was dir eine Aktion **ungefähr** in Euro bringen kann (unverbindlich)."

---

## 2. Personas & Darstellungs-Tiefe

- **Zeitknapp:** 30-Sekunden-Summary + Top-3 Aktionen
- **Überfordert:** Ampel-Darstellung + Schritt-für-Schritt
- **Skeptisch:** Zahlen mit Quellen & Vergleichen
- **Profi:** Detaillierte Tabellen/Downloads

---

## 3. Journey (v1)

1) **/vc/quick:**
   - Felder: E-Mail (Pflicht), Name (optional), Datenschutz-Consent (Pflicht), Marketing-Consent (optional)
   - Microcopy: „Gleich bekommst du eine E-Mail zur Bestätigung."

2) **E-Mail-Klick:** 302 → `/vc/result?t=...`

3) **/vc/result:**
   - **Erfolgs-State:** „Bestätigt! Als Nächstes erstellen wir deinen Check." CTA: „Kurz-Onboarding starten".
   - **Abgelaufen/Invalid:** freundliche Erklärung + CTA „Neuen Link anfordern".

4) **(Später) Ergebnis-Ansicht:**
   - **Summary:** Gesamtscore, 3 wichtigste Erkenntnisse, 3 Aktionen (One-Click).
   - **Details:** Register „Google", „Social", „Website", „Branche & Umfeld".
   - **Quellenhinweise** unter jedem Block („Datenstand: 12.03., Quelle: Google/Trends/…").

### 3.1 Quick & Dirty: „Betrieb finden" (nach E-Mail)

**Ziel:** In <60 Sekunden den Betrieb eindeutig zuordnen, ohne Fachbegriffe.

**Form-Felder (einfach):**
- „Wie heißt dein Betrieb?" *(Pflicht)*
- „In welcher Stadt/Adresse?" *(Pflicht)*
- „Website (optional)"
- „Instagram/Facebook (optional)"
- „Wofür steht ihr? (1 Satz, optional)"

**UI-Interaktion:**
- Während der Eingabe: Vorschläge (Google-Treffer) mit Name + Adresse.
- Treffer anklicken → „Passt!"
- Nicht dabei? → „Manuell eintragen" (wir prüfen im Hintergrund).

**Microcopy (DE):**
- Titel: „Hilf uns, deinen Betrieb sicher zu finden"
- Platzhalter:
  - Name: „z. B. Ristorante Napoli"
  - Ort/Adresse: „z. B. München Schwabing oder Hohenzollernstr. 11"
  - Website: „https://…"
  - Instagram: „https://instagram.com/…"
- Hinweis: „Optional hilft uns deine Website/Instagram, dich schneller zu erkennen."
- CTA: „Bestätigen & E-Mail prüfen"

**Microcopy (EN):**
- Title: "Help us find your business"
- Placeholder examples accordingly.

**Fehler-/Hinweise:**
- „Wir sind uns noch nicht ganz sicher – magst du kurz bestätigen?"
- „Kein Treffer? Trag's kurz manuell ein – wir übernehmen den Rest."

### 3.2 Realitätssicherheit (sanft & ehrlich)

- Nach Auswahl zeigen wir eine Mini-Karte (Name, Adresse, ggf. Foto/Website).
- Copy: „Ist das euer Betrieb? Wenn ja, geht's direkt weiter."

### 3.3 Privatsphäre & Motivation

- „Wir nutzen die Daten nur für deinen Sichtbarkeits-Check."
- „Mit optionalen Links (Website/Instagram) geht's schneller und wird genauer."

---

## 4. Sprache & Begriffs-Mapping (Beispiele)

- „Conversion Rate" → „Wie viele Besucher werden zu Gästen"
- „ROI" → „Was könnte das **ungefähr** in Euro bringen"
- „Benchmark" → „Vergleich mit ähnlichen Betrieben in deiner Nähe"
- „Sentiment" → „Stimmung in den Bewertungen"

---

## 5. Ergebnisse, die **wirklich** zur Realität passen

- Standort, Angebot, Geschichte („Story behind") und Wettbewerber werden **explizit gespiegelt**.
- Bei niedriger Sicherheit: „Wir sind bei Punkt X noch unsicher – magst du es kurz bestätigen?" (2-Klick-Korrektur)
- Jede Zahl hat eine **Quelle** (Anzeige: „Quelle anzeigen").

---

## 6. Handlungsempfehlungen (Kategorien & Beispiele)

- **Content-Storytelling:**
  „Erzähle in 3 Sätzen, was eure Spezialität ausmacht. Vorschlag liegt bereit – du kannst einen Satz ergänzen."

- **Bilder-Storytelling & Aktionen:**
  „Zeige 2 neue Fotos: Tagesgericht & Team. Wir haben dir eine Bild-Ideenliste vorbereitet."

- **Prozess/Listing:**
  „Öffnungszeiten und Reservierungslink prüfen – 2 Punkte fehlen aktuell. Wir füllen dir die Maske aus."

- **Video (später, YouTube/Note-LLM):**
  „30-Sekunden-Küchenblick – wir haben ein Skript vorbereitet."

**One-Click-Freigabe:** Vorschau → „Freigeben" → wir posten/aktualisieren in Google/Facebook/Instagram (nach jeweiliger Verbindung).

---

## 7. Zusätzliche Quellen für Relevanz

- **Google Trends:** „In deiner Stadt wird 'Brunch' im Frühjahr häufiger gesucht."
- **OnPal:** „Nächste Woche: Stadtfest → gute Chance für ein Themen-Menü."
- **Kulturdimensionen:** Tonalitäts-Hinweis („Duzen/Siezen", Bildsprache, Direktheit) passend zur Region.

---

## 8. Microcopy-Snippets (DE/EN)

**DE – Erfolg / Result:**
- „Geschafft! Deine E-Mail ist bestätigt."
- „Als Nächstes erstellen wir deinen Sichtbarkeits-Check."
- CTA: „Kurz-Onboarding starten"

**DE – Abgelaufen/Invalid:**
- „Der Link ist leider nicht mehr gültig."
- CTA: „Neuen Link anfordern"

**EN – Success / Result:**
- "All set! Your email is confirmed."
- "Next, we'll create your visibility check."
- CTA: "Start quick onboarding"

**EN – Expired/Invalid:**
- "This link is no longer valid."
- CTA: "Request a new link"

---

## 9. Transparente Prognosen (Motivation, aber ehrlich)

- „Wenn du die 3 Schritte umsetzt, liegt der mögliche Mehrumsatz bei **~€X–€Y/Monat** (Schätzung auf Basis ähnlicher Betriebe)."
- „Du entscheidest, was passt – wir machen es dir so leicht wie möglich."

---

## 10. Nächste Schritte (Vision → Umsetzung)

- Konto verbinden (GBP/FB/IG) für One-Click-Actions
- 3 wöchentliche Quick Wins automatisch vorschlagen
- Monats-Update mit Fortschritt & neuen Ideen

---

## 11. UX-Akzeptanz (für diese Doku-Session)

- Diese Datei existiert unter `docs/specs/vc/vision.vc-spec.md`.
- Microcopy vorhanden (DE/EN, Result-States + Onboarding).
- Realitäts-Prinzip, Quellen-Hinweise und One-Click-Prinzip beschrieben.
- **Stop nach Write** (Abstimmung vor weiterem Ausbau).
##
# 3.1 Quick & Dirty: Betrieb finden (nach E-Mail)

**Ziel:** < 60 Sek. eindeutige Zuordnung.

**Felder:**
- Betrieb: „Wie heißt dein Betrieb?" *(Pflicht)*
- Ort/Adresse: „In welcher Stadt/Adresse?" *(Pflicht)*
- Website (optional), Instagram/Facebook (optional)
- „Wofür steht ihr? (1 Satz, optional)"

**Interaktion:**
- Live-Vorschläge (Name + Adresse). Klick = „Passt!"
- Kein Treffer → „Manuell eintragen" (wir prüfen im Hintergrund).
- Mini-Karte/Preview nach Auswahl: „Ist das euer Betrieb?"

**Microcopy (DE):**
- Titel: „Hilf uns, deinen Betrieb sicher zu finden"
- Hinweise: „Mit Website/Instagram geht's schneller & genauer."
- CTA: „Bestätigen & E-Mail prüfen"

**Microcopy (EN):**
- Title: "Help us find your business"
- CTA: "Confirm & check your email"

### 3.2 Realitäts-Sicherheit (ehrlich & einfach)

- Nach Auswahl kurze Bestätigung: Name, Adresse, ggf. Foto/Website.
- Hinweis: „Wenn das nicht euer Betrieb ist, ändere Name/Ort – wir suchen neu."

### 3.3 Kultur & Tonalität (Hofstede-informiert)

- **DE (höhere UA):** Klar, strukturiert, Sicherheit betonen („Wir prüfen das für dich").
- **US (niedrigere UA, höhere IDV):** Chancen/Benefits betonen („Get more guests").
- **Anwendung:** Microcopy-Varianten pro Land; Soft-A/B bei unbekannter Kultur.

### 3.4 Empfehlungen → One-Click-Aktionen (Q&D)

- Kategorien: **Content-Storytelling**, **Bilder-Storytelling/Aktionen**, **Social Posts**, **(später) Videos**
- Regeln: Empfehlung muss **sichtbar** aus gemessenen Stärken/Schwächen abgeleitet sein.
- Ablauf:
  1) KI-Vorschlag (Text + Bildidee) basierend auf Stärken/Trends/Events
  2) Nutzer ergänzt 1–2 Details (optional)
  3) Vorschau → „Freigeben & posten" (GMB/FB/IG) — *später via Integrationen*
- Motivation: Unverbindliche **€-Prognose** je Empfehlung (Range), „so viele sehen's mehr / so viel häufiger kommen sie".

### 3.5 Transparenz & Vertrauen

- „Wir nutzen nur öffentliche Infos, die bereits im Netz über euch zu finden sind."
- „Du kannst jederzeit sagen: Das sind wir nicht – dann korrigieren wir's direkt."

---

## 12. Zusätzliche Datenquellen & Kontextualisierung

### 12.1 Google Trends Integration
- **Saisonale Patterns:** „In deiner Stadt wird 'Brunch' im Frühjahr häufiger gesucht."
- **Lokale Trends:** Regionale Suchvolumen-Spitzen für gastronomierelevante Keywords
- **Content-Timing:** Optimale Zeitpunkte für thematische Posts basierend auf Suchtrends

### 12.2 OnPal Event-Integration
- **Lokale Events:** „Nächste Woche: Stadtfest → gute Chance für ein Themen-Menü."
- **Event-basierte Empfehlungen:** Automatische Content-Vorschläge zu lokalen Veranstaltungen
- **Saisonale Opportunities:** Feiertage, Festivals, Sportevents als Content-Anlässe

### 12.3 Kulturdimensionen (Hofstede-Framework)
- **Tonalitäts-Anpassung:** Duzen/Siezen, Direktheit, Bildsprache passend zur Region
- **Uncertainty Avoidance:** Sicherheits- vs. Chancen-fokussierte Kommunikation
- **Individualism vs. Collectivism:** Community- vs. individual-orientierte Ansprache
- **Power Distance:** Hierarchie-bewusste vs. egalitäre Kommunikation

---

## 13. ROI-Prognosen & Monetarisierungs-Kommunikation

### 13.1 Transparente Umsatzschätzungen
- „Wenn du die 3 Schritte umsetzt, liegt der mögliche Mehrumsatz bei **~€X–€Y/Monat** (Schätzung auf Basis ähnlicher Betriebe)."
- „Diese Aktion könnte dir ca. 15% mehr Reservierungen bringen (unverbindlich)."
- „Investition: 30 Min Zeit → Potentieller Mehrwert: 1.200€/Monat"

### 13.2 Motivation durch Vergleichswerte
- „8 von 10 ähnlichen Restaurants sehen Verbesserungen"
- „Durchschnittlich 23% mehr Online-Sichtbarkeit nach Umsetzung"
- „Ähnliche Betriebe steigerten Umsatz um durchschnittlich 8%"

### 13.3 Disclaimer & Ehrlichkeit
- Immer mit Hinweis: „Prognosen sind unverbindlich und basieren auf Erfahrungswerten"
- „Du entscheidest, was passt – wir machen es dir so leicht wie möglich."
- „Keine Garantie, aber basiert auf echten Daten ähnlicher Betriebe"---


## 14. Dashboard UX Alignment

### Dual Source of Truth

- **Figma Frames:** Visuelle Gestaltung, Layout, Interaktionen, Design-System
- **Repo Specs:** Formeln, Datenquellen, Microcopy, Business Logic, Persona-Anpassungen

### Journey-Integration

- **Spec-Referenzen:** Jede Karte/KPI/Chart in der User Journey verweist auf entsprechende `spec_id`
- **Konsistente Terminologie:** Alle Dashboard-Komponenten verwenden einheitliche Gastronomen-Sprache
- **Persona-Adaptive UI:** Dashboard passt sich automatisch an erkannte Nutzertypen an

### Microcopy-Standards

#### Einfache Sprache (Gastro-freundlich)
- **"Conversion Rate"** → **"Wie viele Besucher werden zu Gästen"**
- **"ROI"** → **"Was könnte das ungefähr in Euro bringen"**
- **"Benchmark"** → **"Vergleich mit ähnlichen Betrieben in deiner Nähe"**
- **"Sentiment"** → **"Stimmung in den Bewertungen"**

#### Transparenz-Prinzipien
- **Quellenangaben:** Jede Zahl hat sichtbare Quelle ("Datenstand: 12.03., Quelle: Google")
- **Confidence-Level:** Unsicherheiten werden kommuniziert ("Wir sind bei Punkt X noch unsicher")
- **Unverbindlichkeit:** ROI-Prognosen immer mit Disclaimer

### Persona-Dashboard-Varianten

#### "Der Zeitknappe"
- **30-Sekunden-Summary:** Gesamtscore + Top-3 Aktionen
- **Mobile-optimiert:** Große Buttons, minimaler Text
- **Push-Notifications:** Nur kritische Issues

#### "Der Überforderte"
- **Ampel-System:** 🟢 Läuft super, 🟠 Geht besser, 🔴 Sofort handeln
- **Schritt-für-Schritt:** Guided Workflows mit Screenshots
- **Vereinfachte Sprache:** Keine Fachbegriffe, kurze Sätze

#### "Der Skeptiker"
- **Detaillierte Metriken:** Vollständige Zahlen mit Quellenangaben
- **Vergleichsdaten:** Benchmarks mit Berechnungsmethoden
- **Proof Points:** Konkrete Belege für alle Aussagen

#### "Der Profi"
- **Vollständige Exports:** CSV, PDF, API-Zugang
- **Advanced Analytics:** Custom Reports, Drill-down-Funktionen
- **White-Label:** Branded Dashboards für Agenturen

### Dashboard-Komponenten-Mapping

#### KPIs (Key Performance Indicators)
- **Total Visibility Score:** `vc.kpi.total_visibility`
- **GMB Completeness:** `vc.kpi.gmb_completeness`
- **Social Engagement:** `vc.kpi.social_engagement`

#### Charts (Visualisierungen)
- **Subscores Timeline:** `vc.chart.subscores_timeseries`
- **Benchmark Comparison:** `vc.chart.benchmark_percentiles`
- **Competitor Analysis:** `vc.chart.competitor_comparison`

#### Rules (Empfehlungen)
- **Content Frequency:** `vc.rule.quickwin_post_frequency`
- **Photo Updates:** `vc.rule.image_storytelling`
- **Seasonal Content:** `vc.rule.seasonal_opportunities`

### UX-Konsistenz-Regeln

- **Einheitliche Iconographie:** Gleiche Icons für gleiche Konzepte
- **Konsistente Farbkodierung:** Ampel-System durchgängig angewendet
- **Standardisierte Tooltips:** Einheitliche Hilfe-Texte und Erklärungen
- **Responsive Design:** Alle Komponenten funktionieren auf Mobile und Desktop## Pl
acement & Entry Points

**Empfehlung:** Kombination aus *Landing-Teaser inline* + *dedizierte Seite `/vc`*.

- **Inline im Hero:** Ein Primary-CTA → öffnet Inline-Panel (kein Page-Wechsel).
- **Seite `/vc` (Standalone):** Für Kampagnen/AB-Tests/Partner-Refs.
- **Optional Modal:** Globaler CTA in Navbar → identischer 60s-Flow.

### Entry Points
- Landing-Hero → Inline-Panel
- Direkter Seitenaufruf `/vc`
- Share-Link (LinkedIn/Facebook): `https://matbakh.app/vc?ref=li|fb&c=post_id`
- Partner iFrame: `https://matbakh.app/embed/vc?partner=XYZ` (Allowlist, postMessage)
- QR/Offline: `https://matbakh.app/vc?ref=qr_<campaign>`

## External Starts

- **Share-Preview (OG):** Teaser-Bild „Finde dein Ranking in 60s".
- **LinkedIn Lead Gen → Webhook:** Lead → `POST /vc/start` (idempotent, DOI-Gate).
- **Partner-Embed (iFrame):** Minimaler Ident-Flow im iFrame, Ergebnis & DOI auf matbakh.app.

## Messaging & Microcopy (DE)

**Headline:** „Wie sichtbar ist dein Restaurant? Finde es in 60 Sekunden heraus."

**Sub:** „Erhalte dein Ranking, ungenutzte Potenziale und konkrete Schritte zu mehr Umsatz & besserem Arbeitgeber-Branding."

**Bullets (3):**
- „Dein **Ranking** vs. ähnlichen Betrieben in deiner Nähe"
- „**Top-Potenziale** mit Euro-Schätzung (unverbindlich)"
- „**1-Klick-Aktionen** für Google, Instagram & Co."

**Primary CTA:** „Jetzt Sichtbarkeit prüfen"

**Trust:** „Kostenlos · Kein Login · Quellen ausgewiesen"

### Inline-Panel Felder
- Betriebsname* · Ort/Adresse* (Autocomplete)
- Website? · Instagram? · Facebook?
- Consent (Analyse & Report per E-Mail, DOI) · optional Marketing-Consent

### Teaser-Ergebnis (nach Identifikation)
- Badge: „Sichtbarkeits-Ranking: **Top 22 %** in [Stadt/Kategorie]"
- Card „Ungehobene Chancen" (Top-3) inkl. **+€X–€Y/Monat** (unverbindlich)
- Button: „**Vollständigen Report kostenlos per E-Mail**"

### Gründe zu starten (Landing, unter Hero)
- „Wissen, **wo du stehst** (Ranking & Benchmarks)"
- „Verstehen, **was wirkt** (klare, einfache Sprache)"
- „Sofort **mehr rausholen** (1-Klick-Aktionen & Vorlagen)"
- „**Employer-Branding** stärken (Vorlagen für Team & Jobs)"

## Trust & Transparenz

- Jede Metrik mit **Evidence** (Quelle, Zeitpunkt, Link) & **Confidence** (0–1).
- Datenschutz in einfacher Sprache, DOI-Pflicht, Export/Deletion-Prozess erläutert.