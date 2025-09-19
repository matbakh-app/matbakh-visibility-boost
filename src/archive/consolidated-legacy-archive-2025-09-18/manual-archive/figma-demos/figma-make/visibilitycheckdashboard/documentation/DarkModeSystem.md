# Dark Mode System Documentation
*Sichtbarkeitsanalyse Dashboard - Complete Dark Mode Implementation Guide*

## Overview

The Sichtbarkeitsanalyse Dashboard uses a comprehensive dark mode system built on CSS custom properties, React state management, and smooth transitions. This document provides all details needed to replicate the dark mode functionality elsewhere.

---

## 1. Core Architecture

### Theme State Management

The dark mode is managed through the `useAppState` hook with the following structure:

```typescript
// Theme state in useAppState.ts
const [isDarkMode, setIsDarkMode] = useState(() => {
  if (typeof window === 'undefined') return false;
  
  const savedTheme = localStorage.getItem('dashboard-theme');
  if (savedTheme === 'dark') return true;
  if (savedTheme === 'light') return false;
  
  // Default to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
});

// Theme application
const applyTheme = useCallback(() => {
  const theme = dashboardSettings.theme;
  let shouldBeDark = false;

  if (theme === 'dark') {
    shouldBeDark = true;
  } else if (theme === 'light') {
    shouldBeDark = false;
  } else {
    // system
    shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  setIsDarkMode(shouldBeDark);
  document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
  localStorage.setItem('dashboard-theme', shouldBeDark ? 'dark' : 'light');
}, [dashboardSettings.theme]);
```

### Theme Toggle Function

```typescript
const toggleTheme = useCallback(() => {
  setDashboardSettings(prev => ({
    ...prev,
    theme: prev.theme === 'dark' ? 'light' : 'dark',
    lastUpdated: new Date().toISOString()
  }));
}, []);
```

---

## 2. CSS Color System

### Root Color Tokens (Light Mode)

```css
:root {
  /* Backgrounds */
  --background: #ffffff;
  --card: #ffffff;
  --popover: oklch(1 0 0);
  --sidebar: oklch(0.985 0 0);

  /* Text Colors */
  --foreground: oklch(0.145 0 0);
  --card-foreground: oklch(0.145 0 0);
  --muted-foreground: #6b7280;
  --caption-foreground: #6b7280;

  /* Interactive */
  --primary: #4f46e5;
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.0058 264.53);
  --secondary-foreground: #030213;

  /* Borders & Inputs */
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;

  /* Status Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-neutral: #6b7280;

  /* Chart Colors */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}
```

### Dark Mode Color Tokens

```css
:root[data-theme="dark"] {
  /* Backgrounds */
  --background: #0f172a; /* slate-900 - Main app background */
  --card: #1e293b; /* slate-800 - Widget cards */
  --card-hover: #334155; /* slate-700 - Hover states */
  --popover: #1e293b;
  --sidebar: #1e293b;

  /* Text Colors */
  --foreground: #f1f5f9; /* slate-100 - Primary text */
  --card-foreground: #f1f5f9;
  --muted-foreground: #94a3b8; /* slate-400 - Secondary text */  
  --caption-foreground: #94a3b8;
  --secondary: #64748b; /* slate-500 - Tertiary text */

  /* Interactive */
  --primary: #4f46e5; /* Indigo-600 - Stays consistent */
  --primary-foreground: #ffffff;
  --secondary: #374151; /* gray-700 - Secondary buttons */
  --secondary-foreground: #f1f5f9;

  /* Borders & Inputs */
  --border: #334155; /* slate-700 - Card borders */
  --input: #475569; /* slate-600 - Form inputs */
  --input-background: #1e293b;

  /* Status Colors (Enhanced for dark mode) */
  --color-success: #10b981; /* Same green */
  --color-warning: #f59e0b; /* Same amber */
  --color-error: #ef4444; /* Same red */
  --color-neutral: #94a3b8; /* Lighter gray */

  /* Chart Colors (Lighter variants) */
  --chart-1: #60a5fa; /* blue-400 */
  --chart-2: #34d399; /* emerald-400 */
  --chart-3: #fbbf24; /* amber-400 */
  --chart-4: #f87171; /* red-400 */
  --chart-5: #a78bfa; /* violet-400 */

  /* Additional tokens */
  --muted: #334155;
  --accent: #475569;
  --accent-foreground: #f1f5f9;
  --destructive: #ef4444;
  --destructive-foreground: #ffffff;
  --switch-background: #475569;
  --ring: #64748b;
}
```

---

## 3. Typography System

### Font Definitions

```css
:root {
  /* Font families */
  --font-inter: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "Roboto Mono", ui-monospace, monospace;
  --font-system: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  
  /* Typography scale */
  --text-xs: 0.75rem; /* 12px */
  --text-sm: 0.875rem; /* 14px */
  --text-base: 1rem; /* 16px */
  --text-lg: 1.125rem; /* 18px */
  --text-xl: 1.25rem; /* 20px */
  --text-2xl: 1.5rem; /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem; /* 36px */
  --text-5xl: 3rem; /* 48px */
}
```

### Typography Classes

```css
/* Headlines - Inter font, 18-24px, font-weight 600 */
.headline-xl {
  font-family: var(--font-inter);
  font-size: var(--text-2xl);
  font-weight: 600;
  line-height: 1.3;
  color: var(--foreground);
}

.headline-lg {
  font-family: var(--font-inter);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.3;
  color: var(--foreground);
}

.headline-md {
  font-family: var(--font-inter);
  font-size: var(--text-lg);
  font-weight: 600;
  line-height: 1.3;
  color: var(--foreground);
}

/* Metrics - Roboto Mono, large sizes */
.metric-xl {
  font-family: var(--font-mono);
  font-size: var(--text-5xl);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--foreground);
}

.metric-lg {
  font-family: var(--font-mono);
  font-size: var(--text-4xl);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--foreground);
}

.metric-md {
  font-family: var(--font-mono);
  font-size: var(--text-3xl);
  font-weight: 600;
  line-height: 1.1;
  color: var(--foreground);
}

/* Body Text - System font */
.body-lg {
  font-family: var(--font-system);
  font-size: var(--text-base);
  font-weight: 400;
  line-height: 1.5;
  color: var(--foreground);
}

.body-md {
  font-family: var(--font-system);
  font-size: var(--text-sm);
  font-weight: 400;
  line-height: 1.5;
  color: var(--foreground);
}

/* Captions */
.caption {
  font-family: var(--font-system);
  font-size: var(--text-xs);
  font-weight: 400;
  line-height: 1.4;
  color: var(--caption-foreground);
}
```

---

## 4. Component Adaptations

### Widget Cards

```css
.widget-card {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: var(--widget-padding);
  transition: all 200ms ease-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.widget-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.15);
}

/* Dark mode widget cards */
:root[data-theme="dark"] .widget-card {
  background-color: var(--card);
  border: 1px solid var(--border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

:root[data-theme="dark"] .widget-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
  background-color: var(--card-hover);
}
```

### Form Elements

```css
input, textarea, select {
  background-color: var(--input-background);
  border: 1px solid var(--input);
  color: var(--foreground);
  font-family: var(--font-system);
  font-size: var(--text-sm);
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 200ms ease;
}

input:focus, textarea:focus, select:focus {
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

input::placeholder, textarea::placeholder {
  color: var(--muted-foreground);
}

/* Dark mode form elements */
:root[data-theme="dark"] input,
:root[data-theme="dark"] textarea,
:root[data-theme="dark"] select {
  background-color: var(--input-background);
  border-color: var(--input);
  color: var(--foreground);
}

:root[data-theme="dark"] input:focus,
:root[data-theme="dark"] textarea:focus,
:root[data-theme="dark"] select:focus {
  border-color: var(--primary);
  background-color: var(--card);
}
```

### Buttons

```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border: 1px solid var(--primary);
  font-family: var(--font-system);
  font-size: var(--text-sm);
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  min-height: var(--touch-target);
  transition: all 150ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #4338ca; /* indigo-700 */
  transform: scale(1.02);
}

.btn-primary:active {
  transform: scale(0.98);
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  border: 1px solid var(--border);
}

/* Ghost Button */
.btn-ghost {
  background-color: transparent;
  color: var(--foreground);
  border: 1px solid transparent;
}

.btn-ghost:hover {
  background-color: var(--accent);
}

/* Dark mode button adaptations */
:root[data-theme="dark"] .btn-secondary:hover {
  background-color: var(--accent);
}

:root[data-theme="dark"] .btn-ghost:hover {
  background-color: var(--accent);
}
```

---

## 5. Theme Toggle Implementation

### Complete ThemeToggle Component Usage

```tsx
import ThemeToggle from './components/ThemeToggle';
import { useAppState } from './hooks/useAppState';

function MyComponent() {
  const { isDarkMode, toggleTheme } = useAppState();

  return (
    <div className="header-controls">
      {/* Basic usage */}
      <ThemeToggle 
        isDarkMode={isDarkMode} 
        onToggle={toggleTheme} 
      />
      
      {/* With label and custom size */}
      <ThemeToggle 
        isDarkMode={isDarkMode} 
        onToggle={toggleTheme}
        size="lg"
        showLabel={true}
        variant="outline"
      />
      
      {/* In a dropdown menu */}
      <DropdownMenuItem onClick={toggleTheme}>
        <ThemeToggle 
          isDarkMode={isDarkMode} 
          onToggle={() => {}} // Controlled by outer onClick
          size="sm"
          disabled={false}
        />
        <span className="ml-2">
          {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
        </span>
      </DropdownMenuItem>
    </div>
  );
}
```

### ThemeToggle Props Interface

```typescript
interface ThemeToggleProps {
  isDarkMode: boolean;           // Current theme state
  onToggle: () => void;          // Toggle function
  size?: 'sm' | 'md' | 'lg';    // Button size
  variant?: 'ghost' | 'outline' | 'default'; // Button variant
  showLabel?: boolean;           // Show text label
  disabled?: boolean;            // Disable interaction
}
```

---

## 6. Transitions & Animations

### Global Theme Transitions

```css
/* Smooth transitions for all elements */
*,
*::before,
*::after {
  transition:
    background-color 300ms ease-in-out,
    border-color 300ms ease-in-out,
    color 300ms ease-in-out,
    box-shadow 300ms ease-in-out;
}

/* Theme toggle specific animations */
.theme-toggle {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  min-height: var(--touch-target);
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  filter: brightness(1.1);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-toggle-icon {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Document-level theme transition */
:root {
  transition: color-scheme 300ms ease-in-out;
}

:root[data-theme="dark"] {
  color-scheme: dark;
}

:root[data-theme="light"] {
  color-scheme: light;
}
```

### Icon Transitions

```css
/* Sun icon animation */
.theme-toggle-sun {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  color: #f59e0b; /* amber-500 */
}

/* Light mode: visible sun */
:root[data-theme="light"] .theme-toggle-sun {
  transform: rotate(0deg) scale(1);
  opacity: 1;
}

/* Dark mode: hidden sun */
:root[data-theme="dark"] .theme-toggle-sun {
  transform: rotate(90deg) scale(0);
  opacity: 0;
}

/* Moon icon animation */
.theme-toggle-moon {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  color: #64748b; /* slate-500 */
}

/* Light mode: hidden moon */
:root[data-theme="light"] .theme-toggle-moon {
  transform: rotate(-90deg) scale(0);
  opacity: 0;
}

/* Dark mode: visible moon */
:root[data-theme="dark"] .theme-toggle-moon {
  transform: rotate(0deg) scale(1);
  opacity: 1;
  color: #94a3b8; /* slate-400 */
}
```

---

## 7. Chart & Data Visualization

### Chart Color Adaptations

```css
/* Light mode chart colors */
:root {
  --chart-1: #3b82f6; /* blue-500 */
  --chart-2: #10b981; /* emerald-500 */
  --chart-3: #f59e0b; /* amber-500 */
  --chart-4: #ef4444; /* red-500 */
  --chart-5: #8b5cf6; /* violet-500 */
}

/* Dark mode chart colors (lighter variants) */
:root[data-theme="dark"] {
  --chart-1: #60a5fa; /* blue-400 */
  --chart-2: #34d399; /* emerald-400 */
  --chart-3: #fbbf24; /* amber-400 */
  --chart-4: #f87171; /* red-400 */
  --chart-5: #a78bfa; /* violet-400 */
}

/* Recharts adaptations for dark mode */
:root[data-theme="dark"] {
  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical line {
    stroke: var(--border);
    stroke-opacity: 0.5;
  }

  .recharts-tooltip-wrapper {
    background: var(--card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  }

  .recharts-tooltip-label,
  .recharts-tooltip-item {
    color: var(--foreground) !important;
  }
}
```

---

## 8. Accessibility & Reduced Motion

### Accessibility Enhancements

```css
/* Focus indicators */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Dark mode focus indicators */
:root[data-theme="dark"] *:focus-visible {
  outline-color: #60a5fa; /* blue-400 for better visibility */
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .widget-card {
    border-width: 2px;
  }

  .theme-toggle {
    border-width: 2px !important;
  }

  /* Enhanced contrast for dark mode */
  :root[data-theme="dark"] {
    --foreground: #ffffff;
    --muted-foreground: #cbd5e1;
    --border: #475569;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .theme-toggle,
  .theme-toggle-icon {
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Implementation Checklist

### Required Files Structure

```
src/
├── components/
│   └── ThemeToggle.tsx           # Theme toggle button
├── hooks/
│   ├── useAppState.ts           # Theme state management
│   └── useLanguage.ts           # i18n support
├── styles/
│   └── globals.css              # Complete CSS system
└── utils/
    └── formatters.ts            # Brand-specific utilities
```

### Integration Steps

1. **Install Dependencies**
   ```bash
   npm install lucide-react
   ```

2. **Import Required Components**
   ```tsx
   import ThemeToggle from './components/ThemeToggle';
   import { useAppState } from './hooks/useAppState';
   import { LanguageProvider } from './hooks/useLanguage';
   ```

3. **Setup State Management**
   ```tsx
   const { isDarkMode, toggleTheme } = useAppState();
   ```

4. **Add CSS Variables**
   - Copy all CSS custom properties from globals.css
   - Ensure proper :root and :root[data-theme="dark"] definitions

5. **Implement Theme Toggle**
   ```tsx
   <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
   ```

6. **Apply data-theme Attribute**
   ```tsx
   useEffect(() => {
     document.documentElement.setAttribute(
       'data-theme', 
       isDarkMode ? 'dark' : 'light'
     );
   }, [isDarkMode]);
   ```

### Testing Checklist

- [ ] Theme persists across browser sessions
- [ ] System preference detection works
- [ ] All components adapt to dark mode
- [ ] Smooth transitions between themes
- [ ] Accessibility standards met
- [ ] Reduced motion preference respected
- [ ] Charts and visualizations adapt
- [ ] Form elements properly styled
- [ ] Touch targets meet minimum size
- [ ] Focus indicators visible in both modes

---

## 10. Customization Options

### Custom Color Schemes

```css
/* Add custom brand colors */
:root {
  --brand-primary: #your-color;
  --brand-secondary: #your-color;
}

:root[data-theme="dark"] {
  --brand-primary: #your-dark-color;
  --brand-secondary: #your-dark-color;
}
```

### Custom Transitions

```css
/* Customize theme transition duration */
:root {
  --theme-transition-duration: 200ms; /* Default: 300ms */
}

*,
*::before,
*::after {
  transition:
    background-color var(--theme-transition-duration) ease-in-out,
    border-color var(--theme-transition-duration) ease-in-out,
    color var(--theme-transition-duration) ease-in-out,
    box-shadow var(--theme-transition-duration) ease-in-out;
}
```

### Custom Toggle Variants

```tsx
// Create custom theme toggle variants
<ThemeToggle 
  isDarkMode={isDarkMode}
  onToggle={toggleTheme}
  size="lg"
  variant="outline"
  showLabel={true}
  customClass="my-custom-toggle"
/>
```

This complete documentation provides everything needed to replicate the Sichtbarkeitsanalyse dark mode system in any other application or context.