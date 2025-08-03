# Figma Prototype Guide - LanguageSwitch Integration

## 🎯 Ziel
Alle VC-Frames (Landing, Step1, Step2, Loading, Results) sollen nahtlos zwischen DE/EN umschalten können, wenn der User den globalen LanguageSwitch betätigt.

## 🏗️ Component-Variants Setup

### 1. Haupt-Frames vorbereiten
Für jeden VC-Frame erstelle **2 Variants**:

```
Component: Landing Page
├── Variant 1: language=de (Default)
├── Variant 2: language=en
```

```
Component: Restaurant Info Step  
├── Variant 1: language=de (Default)
├── Variant 2: language=en
```

```
Component: Website Analysis Step
├── Variant 1: language=de (Default) 
├── Variant 2: language=en
```

```
Component: AI Loading Screen
├── Variant 1: language=de (Default)
├── Variant 2: language=en
```

### 2. Variant Properties einrichten
- **Property Name**: `language`
- **Type**: Variant
- **Values**: `de`, `en`
- **Default**: `de`

### 3. Text-Layers anpassen
Für jeden Text-Layer in jeder Variant:

#### DE-Variant (language=de)
```
Hero Title: "Restaurant Sichtbarkeits-Analyse"
Hero Subtitle: "Entdecken Sie Ihre Online-Präsenz mit KI-gestützter Analyse"
Button: "Basis-Analyse starten"
Code Title: "🎁 Haben Sie einen Gutschein-Code?"
// ... weitere DE-Texte aus Text-Mapping verwenden
```

#### EN-Variant (language=en)
```
Hero Title: "Restaurant Visibility Analysis"  
Hero Subtitle: "Discover your online presence with AI-powered analysis"
Button: "Start Basic Analysis"
Code Title: "🎁 Do you have a voucher code?"
// ... weitere EN-Texte aus Text-Mapping verwenden
```

## 🔗 LanguageSwitch-Interaction Setup

### 1. LanguageSwitch Component lokalisieren
Der LanguageSwitch befindet sich im **Header-Bereich** jedes VC-Frames:
- Position: Top-right im Header
- Icon: Globe-Symbol
- Dropdown mit DE/EN-Optionen

### 2. Interactions definieren

#### Interaction 1: DE → EN Switch
```
Trigger: LanguageSwitch → Click (when "EN" selected)
Action: Change to → Component Variant
Target: Current Frame
Property: language = en
Transition: Smart Animate
Duration: 200ms
Easing: Ease Out
```

#### Interaction 2: EN → DE Switch  
```
Trigger: LanguageSwitch → Click (when "DE" selected)
Action: Change to → Component Variant
Target: Current Frame  
Property: language = de
Transition: Smart Animate
Duration: 200ms
Easing: Ease Out
```

### 3. Cross-Frame Navigation beibehalten
**Wichtig**: Navigation zwischen Frames (Step1 → Step2 → Loading → Results) muss die aktuelle Sprache beibehalten.

#### Navigation mit Sprach-Persistierung
```
Trigger: "Weiter"-Button (in DE-Variant)
Action: Navigate to → Next Frame (DE-Variant)
Transition: Smart Animate, 300ms

Trigger: "Continue"-Button (in EN-Variant)  
Action: Navigate to → Next Frame (EN-Variant)
Transition: Smart Animate, 300ms
```

## 🎨 Auto-Layout Konfiguration

### 1. Header-Layout
```
Direction: Horizontal
Spacing: 16px (var(--spacing-2))
Padding: 12px 24px (var(--spacing-3))
Alignment: Space Between
Fill Container: Yes
```

### 2. Content-Layout
```
Direction: Vertical
Spacing: 32px (var(--spacing-4))
Padding: 48px 24px (var(--spacing-6))
Alignment: Top Center
Fill Container: Yes
Hug Contents: Height only
```

### 3. Card-Layout
```
Direction: Vertical
Spacing: 24px (var(--spacing-3))
Padding: 32px (var(--spacing-4))
Border Radius: 8px (var(--border-radius))
Auto Layout: Hug Contents
```

### 4. Text-Responsive Behavior
```
Text Layers:
├── Auto Width: No (für konsistente Layouts)
├── Fixed Width: Definiert (verhindert Layout-Shifts)
├── Text Align: Center/Left je nach Kontext
└── Truncate: None (vollständige Texte anzeigen)
```

## ⚡ Smart Animate Considerations

### 1. Text-Transitions
```
Property Changes: Nur Text-Content
Animation: Fade + Scale (95% → 100%)
Duration: 200ms
Easing: Ease Out
```

### 2. Layout-Stability
```
Matching Layers: Automatisch durch Layer-Namen
Position Stability: Fixed Container-Größen
Content Flow: Auto-Layout verhindert Sprünge
```

### 3. Icon-Consistency
```
Icons: Bleiben identisch (keine Animation)
Positions: Fixiert durch Auto-Layout
Colors: CSS-Variables für Theme-Consistency
```

## 🧪 Testing Checklist

### 1. Prototype Mode Testing
- [ ] LanguageSwitch funktioniert in jedem Frame
- [ ] Texte wechseln vollständig DE ↔ EN
- [ ] Keine Layout-Shifts oder Sprünge
- [ ] Navigation zwischen Frames behält Sprache bei
- [ ] Smart Animate läuft flüssig (200ms)

### 2. Content-Validation
- [ ] Alle i18n-Keys durch echte Texte ersetzt
- [ ] DE-Texte korrekt und vollständig
- [ ] EN-Texte korrekt und vollständig  
- [ ] Keine Placeholder-Texte mehr sichtbar
- [ ] Buttons, Labels, Inputs alle übersetzt

### 3. Design-System Compliance
- [ ] Inter-Font für Headlines verwendet
- [ ] System-Font für Body-Text verwendet
- [ ] Farben entsprechen Dashboard-Palette
- [ ] 8px-Grid korrekt eingehalten
- [ ] Auto-Layout responsive funktional

### 4. Cross-Frame Testing
- [ ] Landing → Step1 → Step2 → Loading → Results
- [ ] Zurück-Navigation funktional
- [ ] Sprache bleibt konsistent im gesamten Flow
- [ ] LanguageSwitch in jedem Frame verfügbar

## 📱 Responsive Considerations

### Mobile (375px)
```
LanguageSwitch: Compact-Variant verwenden
Text-Sizes: System-Default beibehalten
Spacing: var(--spacing-2) reduziert
Layout: Single-Column für Content-Cards
```

### Tablet (1024px)
```
LanguageSwitch: Standard-Variant
Text-Sizes: Default-Werte
Spacing: var(--spacing-3) Standard
Layout: 2-Column Grid für Features
```

### Desktop (1440px+)
```  
LanguageSwitch: Full-Variant mit Labels
Text-Sizes: Default-Werte
Spacing: var(--spacing-4) erweitert
Layout: 3-Column Grid für Features
```

## 🔍 Debug & Troubleshooting

### Häufige Probleme

#### 1. Text wechselt nicht
```
Lösung: 
- Variant Property korrekt benannt? (language)
- Text-Layer in beiden Variants vorhanden?
- Interaction korrekt auf Component-Level?
```

#### 2. Layout springt beim Wechsel
```
Lösung:
- Auto-Layout aktiviert?
- Fixed-Width für Text-Container?
- Matching Layer-Namen in beiden Variants?
```

#### 3. Navigation verliert Sprache
```
Lösung:
- Separate Interactions für DE/EN-Buttons?
- Target-Frame entspricht aktueller Sprache?
- Smart Animate zwischen richtigen Variants?
```

#### 4. LanguageSwitch nicht sichtbar
```
Lösung:
- Component im Header-Container?
- Z-Index/Layer-Reihenfolge korrekt?
- Constraints/Auto-Layout-Position richtig?
```

Diese Spezifikation gewährleistet eine pixel-perfekte Umsetzung des globalen LanguageSwitch-Systems in Figma mit vollständiger DE/EN-Funktionalität.