
# 🏗️ Layout-Regeln für matbakh.app

## Grundregel: Einheitliches Layout-System

**ALLE Seiten verwenden IMMER `AppLayout`** - keine Ausnahmen!

## Navigation-Steuerung

### Standard-Verhalten (mit Header/Navigation)
```tsx
<AppLayout>
  <MeinSeitenContent />
</AppLayout>
```

### Ohne Header/Navigation (für spezielle Seiten)
```tsx
<AppLayout hideNav>
  <MeinSeitenContent />
</AppLayout>
```

## Anwendungsfälle

### ✅ MIT Header/Navigation
- Normale Seiten (Services, Angebote, etc.)
- Dashboard-Seiten
- Legal-Seiten
- Kontakt-Seiten

### ❌ OHNE Header/Navigation (`hideNav={true}`)
- Landingpages für Kampagnen
- Funnel-Seiten
- Spezielle Promo-Seiten
- Checkout-Flows
- Onboarding-Prozesse

## Beispiele

### Normale Seite
```tsx
// pages/ServicesPage.tsx
const ServicesPage = () => (
  <AppLayout>
    <div className="container mx-auto">
      <h1>Unsere Services</h1>
      {/* Content */}
    </div>
  </AppLayout>
);
```

### Landingpage ohne Navigation
```tsx
// pages/SpecialPromoPage.tsx
const SpecialPromoPage = () => (
  <AppLayout hideNav>
    <div className="min-h-screen">
      <h1>Spezielle Promo</h1>
      {/* Content ohne störende Navigation */}
    </div>
  </AppLayout>
);
```

## Wichtige Regeln

1. **Niemals AppLayout weglassen** - jede Seite muss es verwenden
2. **Nur `hideNav` Prop für Navigation-Steuerung** - keine anderen Patterns
3. **Footer bleibt immer sichtbar** - auch bei `hideNav={true}`
4. **Back-Buttons werden automatisch ausgeblendet** wenn `hideNav={true}`

## Implementierung

Das `AppLayout` prüft das `hideNav` Prop und:
- Blendet `Header` aus wenn `hideNav={true}`
- Blendet `BackHomeButtons` aus wenn `hideNav={true}`
- Lässt `Footer` immer sichtbar

## Warum diese Regel?

- **Konsistenz**: Einheitliches Layout-System im gesamten Projekt
- **Flexibilität**: Einfache Steuerung der Navigation pro Seite
- **Wartbarkeit**: Zentrale Layout-Logik in einer Komponente
- **SEO**: Footer mit wichtigen Links bleibt immer verfügbar

---

**Diese Regel gilt ab sofort für alle Seiten und darf nicht willkürlich geändert werden!**
