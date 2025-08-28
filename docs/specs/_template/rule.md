---
dashboard_id: vc.recommendations
spec_id: vc.rule.example_id
source_of_truth: figma:FILE/FRAME
canonical: true
version: 2025-01-25
---

# Recommendation Rule: <Title>

## Intent

Welche Verbesserung (in € / Gäste / Sichtbarkeit) adressiert diese Regel? Warum ist sie wichtig für Gastronomen?

## Trigger (Messwerte → Regel)

- **Bedingungen:** z.B. post_frequency < 1/week AND gmb_completeness < 80%
- **Evidence:** Links auf spezifische Messwerte aus vc_runs
- **Schwellenwerte:** Konkrete Zahlen, ab wann Regel aktiviert wird
- **Ausschlüsse:** Wann Regel NICHT angezeigt wird

## Output

```typescript
type Recommendation = {
  title: string;
  summary: string;            // einfache Sprache, max 2 Sätze
  roi: { 
    estimate_eur_min: number; 
    estimate_eur_max: number;
    confidence: 'low'|'med'|'high';
  };
  effort: 'low'|'med'|'high';
  time_estimate: string;      // "15 Minuten", "1 Stunde"
  next_steps: string[];       // 1-Click-Action Flow
  evidence_refs: string[];    // pointers zu Messwerten
  persona: ('zeitknapp'|'überfordert'|'skeptiker'|'profi')[];
}
```

## Microcopy (DE/EN)

### Deutsch
- **Titel:** Actionable Überschrift (z.B. "Mehr Fotos hochladen")
- **Zusammenfassung:** Warum wichtig + was passiert
- **CTA:** Klarer Handlungsaufruf
- **Begründung:** "Weil..." mit Daten-Bezug

### English
- **Title:** Actionable headline
- **Summary:** Why important + what happens
- **CTA:** Clear call to action
- **Reasoning:** "Because..." with data reference

## One-Click-Action (Plan)

### Kanäle
- **Google My Business:** Posts, Fotos, Öffnungszeiten
- **Facebook:** Organische Posts, Events, Story-Updates
- **Instagram:** Feed-Posts, Stories, Reels

### UI-Flow
1. **Vorschlag anzeigen:** KI-generierter Content + Bildideen
2. **Nutzer-Input:** 1-2 optionale Ergänzungsfelder
3. **Vorschau:** Wie es auf den Plattformen aussieht
4. **Freigabe:** Ein Klick für Multi-Channel-Posting
5. **Bestätigung:** Erfolg + nächste Empfehlung

### Datensammlung
- **Minimal:** Nur notwendige Felder für Content-Erstellung
- **Optional:** Zusätzliche Details für Personalisierung
- **Validation:** Client-side Prüfung vor Submission

## ROI-Berechnung

### Basis-Formel
```
ROI = (Impact × Probability × Revenue_Potential) / (Effort × Time × Cost)
```

### Faktoren
- **Impact:** Historische Daten ähnlicher Aktionen
- **Probability:** Erfolgswahrscheinlichkeit basierend auf Kontext
- **Revenue_Potential:** Geschätzte Umsatzsteigerung (unverbindlich)
- **Effort:** Zeitaufwand und Komplexität
- **Time:** Umsetzungsdauer
- **Cost:** Monetäre Kosten (meist 0 für organische Aktionen)

## Evidence & Confidence

- **Datenquellen:** Welche Adapter-Ergebnisse fließen ein
- **Confidence-Level:** Wie sicher ist die Empfehlung
- **Vergleichsdaten:** Benchmarks für ähnliche Betriebe
- **Erfolgs-Tracking:** Wie wird Wirksamkeit gemessen

## Persona-Anpassungen

- **Zeitknapp:** Nur Top-1 Empfehlung, minimaler Text
- **Überfordert:** Schritt-für-Schritt Anleitung, Screenshots
- **Skeptiker:** Detaillierte Begründung mit Zahlen und Quellen
- **Profi:** Batch-Aktionen, API-Integration, Custom-Parameter