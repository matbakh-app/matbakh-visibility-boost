# Language Switch Behavior Examples
*Complete Visual Guide - What Changes When Switching Languages*

## Overview

This document demonstrates exactly what happens in the Sichtbarkeitsanalyse Dashboard when users switch between German (DE) and English (EN). Every visual change, formatting difference, and layout behavior is documented with before/after examples.

---

## 1. Header & Navigation Changes

### **App Name & Branding**
```tsx
// Before Switch (DE)
<h1>Sichtbarkeitsanalyse</h1>
<p>Restaurant Performance Dashboard</p>

// After Switch (EN) 
<h1>Visibility Check</h1>
<p>Restaurant Performance Dashboard</p>
```

**Visual Result:**
- Header text changes instantly without reload
- Layout remains stable (both names similar length)
- Subtitle stays the same (intentionally)

### **Navigation Links**
```tsx
// German Navigation
<nav>
  <a href="/dashboard">Dashboard</a>
  <a href="/berichte">Berichte</a>
  <a href="/einstellungen">Einstellungen</a>
  <a href="/hilfe">Hilfe</a>
</nav>

// English Navigation  
<nav>
  <a href="/dashboard">Dashboard</a>
  <a href="/reports">Reports</a>
  <a href="/settings">Settings</a>
  <a href="/help">Help</a>
</nav>
```

### **User Menu**
```tsx
// German User Menu
<DropdownMenu>
  <DropdownMenuItem>Profil anzeigen</DropdownMenuItem>
  <DropdownMenuItem>Kontoeinstellungen</DropdownMenuItem>
  <DropdownMenuItem>Support</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem>Abmelden</DropdownMenuItem>
</DropdownMenu>

// English User Menu
<DropdownMenu>
  <DropdownMenuItem>View Profile</DropdownMenuItem>
  <DropdownMenuItem>Account Settings</DropdownMenuItem>
  <DropdownMenuItem>Support</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem>Logout</DropdownMenuItem>
</DropdownMenu>
```

---

## 2. Number & Currency Formatting

### **Revenue Display**
```tsx
const revenue = 1234567.89;

// German Format
<span>{formatCurrency(revenue, 'de')} // "1.234.567,89 €"</span>

// English Format  
<span>{formatCurrency(revenue, 'en')} // "€1,234,567.89"</span>
```

**Visual Differences:**
- Decimal separator: `,` (DE) vs `.` (EN)
- Thousand separator: `.` (DE) vs `,` (EN)
- Currency position: After amount (DE) vs Before amount (EN)

### **Percentage Values**
```tsx
const occupancy = 87.5;

// German Format
<span>{formatPercentage(occupancy, 'de')} // "87,5 %"</span>

// English Format
<span>{formatPercentage(occupancy, 'en')} // "87.5%"</span>
```

**Visual Differences:**
- Decimal separator: `,` (DE) vs `.` (EN)
- Space before %: Yes (DE) vs No (EN)

### **Large Numbers**
```tsx
const visitors = 12847;

// German Format
<span>{formatNumber(visitors, 'de')} // "12.847"</span>

// English Format
<span>{formatNumber(visitors, 'en')} // "12,847"</span>
```

---

## 3. Date & Time Display

### **Dashboard Date Headers**
```tsx
const today = new Date(2024, 0, 15); // January 15, 2024

// German Format
<h2>{formatDate(today, 'de')} // "15. Jan. 2024"</h2>

// English Format
<h2>{formatDate(today, 'en')} // "Jan 15, 2024"</h2>
```

### **Time Stamps**
```tsx
const businessHour = new Date(2024, 0, 1, 14, 30); // 2:30 PM

// German Format (24-hour)
<span>{formatTime(businessHour, 'de')} // "14:30"</span>

// English Format (12-hour)
<span>{formatTime(businessHour, 'en')} // "2:30 PM"</span>
```

### **Relative Time**
```tsx
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

// German Format
<span>{formatRelativeTime(twoHoursAgo, 'de')} // "vor 2 Stunden"</span>

// English Format
<span>{formatRelativeTime(twoHoursAgo, 'en')} // "2 hours ago"</span>
```

---

## 4. Widget Content Changes

### **Visibility Score Widget**
```tsx
// German Content
<CardTitle>Sichtbarkeits-Score</CardTitle>
<CardDescription>Google Business Profil Performance</CardDescription>
<div className="metric">
  <span>87/100</span>
  <span>Ausgezeichnet</span>
</div>
<Button>Details anzeigen</Button>

// English Content
<CardTitle>Visibility Score</CardTitle>
<CardDescription>Google Business Profile Performance</CardDescription>
<div className="metric">
  <span>87/100</span>
  <span>Excellent</span>
</div>
<Button>View Details</Button>
```

### **Reviews Widget**
```tsx
// German Reviews Widget
<CardTitle>Bewertungen</CardTitle>
<CardDescription>Multi-Platform Bewertungen</CardDescription>
<div className="review-summary">
  <span>4,6 ⭐</span>
  <span>1.247 Bewertungen</span>
</div>
<div className="review-platforms">
  <span>Google: 4,7 ⭐ (892 Bewertungen)</span>
  <span>TripAdvisor: 4,5 ⭐ (201 Bewertungen)</span>
  <span>Yelp: 4,4 ⭐ (154 Bewertungen)</span>
</div>

// English Reviews Widget
<CardTitle>Reviews</CardTitle>
<CardDescription>Multi-Platform Reviews</CardDescription>
<div className="review-summary">
  <span>4.6 ⭐</span>
  <span>1,247 Reviews</span>
</div>
<div className="review-platforms">
  <span>Google: 4.7 ⭐ (892 reviews)</span>
  <span>TripAdvisor: 4.5 ⭐ (201 reviews)</span>
  <span>Yelp: 4.4 ⭐ (154 reviews)</span>
</div>
```

**Note:** Rating values use localized decimal separators (4,6 vs 4.6)

### **Orders & Revenue Widget**
```tsx
// German Orders Widget
<CardTitle>Bestellungen & Umsatz</CardTitle>
<div className="daily-stats">
  <div>
    <span className="metric">€3.247,50</span>
    <span className="label">Umsatz heute</span>
  </div>
  <div>
    <span className="metric">142</span>
    <span className="label">Bestellungen</span>
  </div>
  <div>
    <span className="metric">€22,89</span>
    <span className="label">Ø Bestellwert</span>
  </div>
</div>

// English Orders Widget
<CardTitle>Orders & Revenue</CardTitle>
<div className="daily-stats">
  <div>
    <span className="metric">€3,247.50</span>
    <span className="label">Today's Revenue</span>
  </div>
  <div>
    <span className="metric">142</span>
    <span className="label">Orders</span>
  </div>
  <div>
    <span className="metric">€22.89</span>
    <span className="label">Avg Order Value</span>
  </div>
</div>
```

---

## 5. Chart & Graph Changes

### **Chart Axis Labels**
```tsx
// German Chart
const germanData = [
  { day: 'Mo', revenue: 2840 },
  { day: 'Di', revenue: 3120 },
  { day: 'Mi', revenue: 3450 },
  { day: 'Do', revenue: 3280 },
  { day: 'Fr', revenue: 4150 },
  { day: 'Sa', revenue: 4780 },
  { day: 'So', revenue: 4230 }
];

// English Chart
const englishData = [
  { day: 'Mon', revenue: 2840 },
  { day: 'Tue', revenue: 3120 },
  { day: 'Wed', revenue: 3450 },
  { day: 'Thu', revenue: 3280 },
  { day: 'Fri', revenue: 4150 },
  { day: 'Sat', revenue: 4780 },
  { day: 'Sun', revenue: 4230 }
];
```

### **Chart Tooltips**
```tsx
// German Tooltip
const GermanTooltip = ({ active, payload, label }) => {
  if (active && payload) {
    return (
      <div className="tooltip">
        <p className="label">{label}</p>
        <p className="value">
          Umsatz: {formatCurrency(payload[0].value, 'de')}
        </p>
        <p className="value">
          Bestellungen: {formatNumber(payload[1].value, 'de')}
        </p>
      </div>
    );
  }
};

// English Tooltip
const EnglishTooltip = ({ active, payload, label }) => {
  if (active && payload) {
    return (
      <div className="tooltip">
        <p className="label">{label}</p>
        <p className="value">
          Revenue: {formatCurrency(payload[0].value, 'en')}
        </p>
        <p className="value">
          Orders: {formatNumber(payload[1].value, 'en')}
        </p>
      </div>
    );
  }
};
```

---

## 6. Form Elements

### **Login Form**
```tsx
// German Login Form
<form>
  <div>
    <label htmlFor="email">E-Mail-Adresse</label>
    <input 
      id="email"
      type="email" 
      placeholder="ihre.email@sichtbarkeitsanalyse.de"
      aria-describedby="email-error"
    />
    <span id="email-error">Bitte geben Sie eine gültige E-Mail-Adresse ein</span>
  </div>
  
  <div>
    <label htmlFor="password">Passwort</label>
    <input 
      id="password"
      type="password" 
      placeholder="Ihr Passwort"
    />
  </div>
  
  <button type="submit">Anmelden</button>
  <a href="/passwort-vergessen">Passwort vergessen?</a>
</form>

// English Login Form
<form>
  <div>
    <label htmlFor="email">Email Address</label>
    <input 
      id="email"
      type="email" 
      placeholder="your.email@visibilitycheck.com"
      aria-describedby="email-error"
    />
    <span id="email-error">Please enter a valid email address</span>
  </div>
  
  <div>
    <label htmlFor="password">Password</label>
    <input 
      id="password"
      type="password" 
      placeholder="Your password"
    />
  </div>
  
  <button type="submit">Sign In</button>
  <a href="/forgot-password">Forgot password?</a>
</form>
```

### **Search & Filter Forms**
```tsx
// German Search
<div className="search-container">
  <input 
    type="search"
    placeholder="Restaurants, Bewertungen oder Kennzahlen suchen..."
    aria-label="Suche"
  />
  <select aria-label="Filter">
    <option value="">Alle Kategorien</option>
    <option value="performance">Leistung</option>
    <option value="reviews">Bewertungen</option>
    <option value="revenue">Umsatz</option>
  </select>
  <button>Suchen</button>
</div>

// English Search  
<div className="search-container">
  <input 
    type="search"
    placeholder="Search restaurants, reviews, or metrics..."
    aria-label="Search"
  />
  <select aria-label="Filter">
    <option value="">All Categories</option>
    <option value="performance">Performance</option>
    <option value="reviews">Reviews</option>
    <option value="revenue">Revenue</option>
  </select>
  <button>Search</button>
</div>
```

---

## 7. Status & Notification Messages

### **Success Messages**
```tsx
// German Success Messages
<div className="notification success">
  <h4>Erfolgreich gespeichert</h4>
  <p>Ihre Einstellungen wurden erfolgreich aktualisiert.</p>
  <button>Schließen</button>
</div>

// English Success Messages
<div className="notification success">
  <h4>Successfully Saved</h4>
  <p>Your settings have been updated successfully.</p>
  <button>Close</button>
</div>
```

### **Error Messages**
```tsx
// German Error Messages
<div className="notification error">
  <h4>Verbindungsfehler</h4>
  <p>Die Daten konnten nicht geladen werden. Überprüfen Sie Ihre Internetverbindung.</p>
  <div className="actions">
    <button>Erneut versuchen</button>
    <button>Support kontaktieren</button>
  </div>
</div>

// English Error Messages
<div className="notification error">
  <h4>Connection Error</h4>
  <p>Data could not be loaded. Please check your internet connection.</p>
  <div className="actions">
    <button>Try Again</button>
    <button>Contact Support</button>
  </div>
</div>
```

### **Loading States**
```tsx
// German Loading
<div className="loading-state">
  <div className="spinner" />
  <h3>Daten werden geladen...</h3>
  <p>Bitte warten Sie, während wir Ihre Dashboard-Daten aktualisieren.</p>
</div>

// English Loading
<div className="loading-state">
  <div className="spinner" />
  <h3>Loading data...</h3>
  <p>Please wait while we update your dashboard data.</p>
</div>
```

---

## 8. Footer & Legal Information

### **Footer Content**
```tsx
// German Footer
<footer>
  <div className="copyright">
    © 2024 Sichtbarkeitsanalyse. Alle Rechte vorbehalten.
  </div>
  <nav className="legal-links">
    <a href="/datenschutz">Datenschutz</a>
    <a href="/nutzungsbedingungen">Nutzungsbedingungen</a>
    <a href="/impressum">Impressum</a>
    <a href="/support">Support</a>
  </nav>
  <div className="contact">
    <p>Fragen? <a href="mailto:support@sichtbarkeitsanalyse.de">support@sichtbarkeitsanalyse.de</a></p>
  </div>
</footer>

// English Footer
<footer>
  <div className="copyright">
    © 2024 Visibility Check. All rights reserved.
  </div>
  <nav className="legal-links">
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
    <a href="/about">About</a>
    <a href="/support">Support</a>
  </nav>
  <div className="contact">
    <p>Questions? <a href="mailto:support@visibilitycheck.com">support@visibilitycheck.com</a></p>
  </div>
</footer>
```

---

## 9. Layout Stability & Performance

### **Text Length Considerations**

```css
/* Ensuring layout stability during language switches */
.metric-container {
  min-width: 120px; /* Accommodates both "Ausgezeichnet" and "Excellent" */
  text-align: center;
  transition: all 200ms ease-in-out;
}

.button-text {
  min-width: 100px; /* Prevents button size jumping */
  text-align: center;
}

.nav-link {
  min-width: 80px; /* Consistent navigation spacing */
  text-align: center;
}
```

### **Responsive Breakpoints**

```tsx
// German text tends to be longer - responsive handling
<div className="responsive-text">
  <span className="hidden lg:inline">
    {language === 'de' ? 'Durchschnittsbewertung' : 'Average Rating'}
  </span>
  <span className="lg:hidden">
    {language === 'de' ? 'Ø Bewertung' : 'Avg Rating'}
  </span>
</div>
```

### **Animation During Switch**

```css
/* Smooth transition during language change */
[data-language-switching="true"] {
  opacity: 0.8;
  transition: opacity 150ms ease-in-out;
}

[data-language-switching="true"] .text-content {
  transform: translateY(2px);
  transition: transform 150ms ease-in-out;
}

/* Prevent layout jump */
.language-transition-container {
  overflow: hidden;
  transition: height 200ms ease-in-out;
}
```

---

## 10. Accessibility During Language Switch

### **Screen Reader Announcements**
```tsx
// Announce language change to screen readers
const announceLanguageChange = (newLanguage: Language) => {
  const message = newLanguage === 'de' 
    ? 'Sprache wurde zu Deutsch geändert'
    : 'Language changed to English';
    
  // Create live region for screen reader
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};
```

### **Focus Management**
```tsx
// Maintain focus after language switch
const LanguageSwitchWithFocus = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const handleLanguageSwitch = (newLang: Language) => {
    setLanguage(newLang);
    
    // Maintain focus on the trigger button
    setTimeout(() => {
      buttonRef.current?.focus();
    }, 100);
  };
  
  return (
    <Button ref={buttonRef} onClick={() => handleLanguageSwitch('en')}>
      Switch Language
    </Button>
  );
};
```

This comprehensive guide shows exactly how every part of the Sichtbarkeitsanalyse Dashboard transforms when users switch languages, ensuring a seamless and localized experience.