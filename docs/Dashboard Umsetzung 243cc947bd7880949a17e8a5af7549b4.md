# Dashboard Umsetzung

Übergeordnetes Thema: Information Architecture & Navigation
Datum & Uhrzeit: August 2, 2025
Status: Backlog
Teil des Gesamtkonzepts: No

# Dashboard Umsetzung: Verfügbare API-Metriken für Gastro-Dashboard

## Google My Business / Business Profile API

Die Google Business Profile API bietet Zugriff auf folgende relevante Daten für Restaurants/Gastronomiebetriebe:

### Basis-Informationen (accounts.locations)

- **Standortdaten:** Name, Adresse, Telefon, Website, Öffnungszeiten, Attribute, Kategorien
- **Sichtbarkeit:** Profilansichten, Nutzung der Wegbeschreibung, Telefonanrufe über GMB
- **Status:** Verifizierungsstatus, Profilaktualität, Vollständigkeit

### Bewertungs-Daten (accounts.locations.reviews)

- **Bewertungen-Übersicht:** Durchschnittliche Bewertung, Anzahl der Bewertungen
- **Einzelne Bewertungen:** Bewertungstext, Sternebewertung, Zeitstempel
- **Antworten:** Eigene Antworten auf Bewertungen, Zeitstempel der Antwort

### Media/Bilder (accounts.locations.media)

- **Fotos:** Anzahl hochgeladener Fotos, Kategorisierung (Logo, Cover, Innen, Speisen)
- **Kundenbeiträge:** Von Kunden hochgeladene Fotos (accounts.locations.media.customers)

### Posts/Updates (accounts.locations.localPosts)

- **Beiträge:** Anzahl der Beiträge, Zeitstempel, Interaktionen
- **Performance:** Impressions, Engagement-Daten für Beiträge

## Meta Insights API

Die Meta Insights API bietet zahlreiche Metriken für Facebook- und Instagram-Seiten:

### Seiten-Reichweite & Interaktionen

- **page_impressions:** Wie oft Inhalte Ihrer Seite gesehen wurden
- **page_impressions_unique:** Anzahl der Personen, die Ihre Inhalte gesehen haben
- **page_engaged_users:** Anzahl der Interaktionen mit Ihrer Seite
- **page_post_engagements:** Interaktionen mit Beiträgen (Reaktionen, Kommentare, Shares)

### Follower & Fans

- **page_fans:** Gesamtzahl der Personen, die Ihre Seite mit "Gefällt mir" markiert haben
- **page_fans_city/country/locale:** Demografische Daten der Fans nach Stadt/Land/Sprache
- **page_fan_adds/removes:** Neue/Verlorene Fans der Seite
- **page_follows/page_daily_follows:** Follower-Entwicklung

### Beitrags-Performance

- **post_impressions/post_impressions_unique:** Reichweite von Beiträgen
- **post_reactions_by_type_total:** Reaktionen auf Beiträge nach Typ (Like, Love, etc.)
- **post_clicks/post_clicks_by_type:** Klicks auf Beiträge

### Videos & Medien

- **page_video_views:** Videoaufrufe (mind. 3 Sekunden)
- **page_video_complete_views_30s:** Vollständige Videoaufrufe (30 Sek.)
- **page_video_view_time:** Gesamte Anschauungszeit in Millisekunden

## Potenzielle Dashboard-KPIs & Widgets

| **KPI/Widget** | **Datenquelle** | **Beschreibung** | **Darstellungstyp** | **Berechtigung** |
| --- | --- | --- | --- | --- |
| Visibility Score | Google, Meta (aggregiert) | Gesamtwert aus einer Scoring-Formel basierend auf Impressions, Reichweite, etc. | Gauge/Score | Alle |
| Profil-Vollständigkeit | Google, Meta | Prozentsatz der ausgefüllten Profilelemente | Fortschrittsbalken | Alle |
| Bewertungs-Dashboard | Google My Business | Anzahl, Durchschnitt, Entwicklung, letzte Bewertungen | Karte mit Zahlen & Chart | Alle |
| Follower-Entwicklung | Meta (Facebook/Instagram) | Neue Follower/Fans, Verlauf, Wachstumsrate | Linienchart | Social |
| Reichweiten-Übersicht | Meta Insights | Organische vs. bezahlte Reichweite, Entwicklung | Gestapeltes Balkendiagramm | Social |
| Interaktionsrate | Meta Insights | Engagement in Relation zur Reichweite | Prozent & Trend | Social |
| Posting-Frequenz | Google, Meta | Häufigkeit und Regelmäßigkeit der Beiträge | Kalender-Heatmap | Social |
| Top-Fotos | Google, Meta | Meistangesehene/beliebteste Fotos | Galerie mit Metriken | Content |
| Performance-Alerts | Alle Quellen | Wichtige Änderungen/Probleme hervorheben | Alert-Karten | Alle |
| Aktions-Empfehlungen | KI/Analyse | Automatisierte Vorschläge zur Verbesserung | Priorisierte Liste | Alle |

## Erweiterte Dashboard-Komponenten

### Schlüssel-KPIs

- **Gesamtbewertungsscore:** Gewichteter Durchschnitt aller Plattform-Bewertungen
- **Wöchentliche Besucherzahlen:** Trend der Google My Business Profilaufrufe im Wochenvergleich
- **Conversion-Rate:** Anteil der Profilbesucher, die eine Aktion ausführen (Anruf, Wegbeschreibung, Besuch)
- **Marktanteil-Index:** Vergleich der eigenen Performance mit lokalen Wettbewerbern
- **Antwortrate bei Bewertungen:** Prozentsatz der beantworteten Kundenbewertungen
- **Social Media Engagement-Rate:** Interaktionen pro 100 Follower
- **Content-Aktualitätsscore:** Bewertung der Aktualität aller Online-Inhalte

### Chart-Typen & Visualisierungen

- **Performance-Radar:** Spinnendiagramm mit allen Hauptmetriken im Vergleich zum Branchendurchschnitt
- **Sentiment-Analyse-Trend:** Liniendiagramm zur Entwicklung der Stimmung in Kundenbewertungen
- **Heatmap der Besucheraktivität:** Farbliche Darstellung nach Wochentagen/Uhrzeiten
- **Competitive Benchmark:** Balkendiagramm mit Vergleich zu den Top-3-Wettbewerbern
- **Bewertungs-Distribution:** Donut-Chart zur Verteilung der Sternebewertungen
- **Geo-Heatmap:** Karte mit Herkunft der Besucher/Kunden
- **Keyword-Cloud:** Visualisierung häufiger Begriffe aus Bewertungen und Kommentaren
- **Posting-Performance:** Bubble-Chart zur Darstellung von Reichweite, Engagement und Themen

### Listen & Action-Items

- **Top-Handlungsempfehlungen:** Priorisierte Liste mit KI-generierten Maßnahmenvorschlägen
- **Wettbewerbsbeobachtung:** Übersicht der Aktivitäten und Änderungen bei Hauptkonkurrenten
- **Bewertungs-Feed:** Chronologische Liste der neuesten Bewertungen mit Status (beantwortet/offen)
- **Content-Kalender:** Planung und Status zukünftiger Posts und Aktionen
- **Keyword-Tracking:** Überwachung relevanter Suchbegriffe und deren Performance
- **Performance-Alerts:** Warnungen bei signifikanten Veränderungen oder Problemen
- **Historisches Benchmark:** Vergleich aktueller KPIs mit vorherigen Zeiträumen (MoM, QoQ, YoY)

### Filtermöglichkeiten & Personalisierung

- **Zeitraum-Selector:** Flexible Auswahl des Analyse-Zeitraums
- **Plattform-Filter:** Einschränkung der Daten auf bestimmte Quellen (Google, Facebook, Instagram)
- **Nutzer-spezifische Views:** Anpassbare Dashboard-Ansichten für verschiedene Benutzerrollen
- **Export-Funktionen:** Download von Berichten und Rohdaten in verschiedenen Formaten

## Technische Anforderungen

- **Daten-Aktualisierung:** Real-time vs. tägliche vs. wöchentliche Updates je nach Metrik
- **API-Limits beachten:** Optimierte Abfragen zur Vermeidung von Überschreitungen der API-Kontingente
- **Caching-Strategie:** Zwischenspeicherung häufig angefragter Daten zur Performance-Optimierung
- **Responsive Design:** Optimierte Darstellung für verschiedene Geräte (Desktop, Tablet, Mobile)
- **Daten-Historisierung:** Archivierung historischer Daten für Langzeit-Trendanalysen