# Project Structure & Organization

## Root Directory Structure
```
├── .github/          # GitHub workflows and templates
├── .kiro/           # Kiro AI assistant configuration
├── docs/            # Project documentation and specifications
├── public/          # Static assets and localization files
├── src/             # Source code
├── supabase/        # Supabase functions and configurations
├── infra/           # Infrastructure as code
└── scripts/         # Build and deployment scripts
```

## Source Code Organization (`src/`)

### Core Application
- `App.tsx` - Main application component with routing
- `main.tsx` - Application entry point
- `index.css` - Global styles and CSS variables

### Component Architecture
```
components/
├── ui/              # Reusable UI primitives (shadcn/ui)
├── layout/          # Layout components (Header, Footer, etc.)
├── navigation/      # Navigation-specific components
├── auth/            # Authentication components
├── dashboard/       # Dashboard-specific components
├── onboarding/      # User onboarding flow
├── vc/              # Visibility Check components
├── admin/           # Admin panel components
└── [feature]/       # Feature-specific component groups
```

### Business Logic
```
hooks/               # Custom React hooks for business logic
services/            # External service integrations
contexts/            # React Context providers
lib/                 # Utility libraries and configurations
utils/               # Helper functions and utilities
```

### Data & Types
```
types/               # TypeScript type definitions
constants/           # Application constants
mocks/               # Mock data for development
integrations/        # Third-party service integrations
```

### Pages & Routing
```
pages/               # Route components
├── legal/           # Legal pages (Impressum, Datenschutz, etc.)
└── [feature]/       # Feature-specific pages
```

## Internationalization Structure
```
public/locales/
├── de/              # German translations (primary)
│   ├── common.json
│   ├── navigation.json
│   ├── legal.json
│   └── [namespace].json
└── en/              # English translations
    ├── common.json
    ├── navigation.json
    ├── legal.json
    └── [namespace].json
```

## Critical Files & Governance

### Navigation (Requires CTO Approval)
- `src/components/navigation/NavigationConfig.ts` - Central navigation configuration
- `public/locales/*/nav.json` - Navigation labels
- `public/sitemap.xml` - SEO URL structure

### Legal Compliance (Audit-Critical)
- `public/locales/*/legal.json` - All legal texts
- `src/pages/legal/` - Legal page components
- `docs/CRITICAL_FILES.md` - Governance documentation

### Configuration Files
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useUserProfile.ts`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Types**: PascalCase (`BusinessProfile.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

### Code Conventions
- **React Components**: PascalCase with descriptive names
- **Props Interfaces**: ComponentName + "Props" (`UserProfileProps`)
- **Custom Hooks**: Start with "use" (`useBusinessData`)
- **Event Handlers**: Start with "handle" (`handleSubmit`)

## Import Patterns
```typescript
// External libraries first
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal imports with @ alias
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/auth';
```

## Feature Organization
Each major feature should follow this structure:
```
components/[feature]/
├── index.ts         # Export barrel
├── [Feature]Main.tsx
├── [Feature]Form.tsx
├── [Feature]List.tsx
└── types.ts         # Feature-specific types
```

## Archive & Legacy
- `src/archive/` - Deprecated code kept for reference
- `*.bak` files - Backup versions of modified files
- Clear README.md in archive explaining deprecation reasons