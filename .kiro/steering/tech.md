# Technology Stack & Build System

## Core Technologies
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5 with SWC for fast compilation
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: React Router DOM v6
- **State Management**: TanStack Query for server state, React Context for app state
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Cloud Infrastructure**: AWS (Lambda, SES, Secrets Manager)

## Key Libraries
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: i18next with react-i18next
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Analytics**: Vercel Speed Insights
- **Testing**: Vitest with React Testing Library

## Development Tools
- **Package Manager**: npm (with bun.lockb for faster installs)
- **Linting**: ESLint 9 with TypeScript support
- **Code Quality**: TypeScript strict mode with custom configurations
- **Storybook**: Component development and documentation
- **Bundle Analysis**: Rollup visualizer plugin

## Common Commands

### Development
```bash
npm run dev          # Start development server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing & Quality
```bash
npm run check-legal  # Validate legal content consistency
npm run check:nav    # Validate navigation structure
```

### Internationalization
```bash
i18next-scanner      # Extract translation keys
```

## Build Configuration
- **Code Splitting**: Manual chunks for React, UI libraries, forms, i18n
- **Alias**: `@/` maps to `src/` directory
- **Bundle Size**: Warning limit set to 1000kb
- **Development**: Hot reload with component tagging for debugging

## Environment Variables
- **Frontend**: All variables prefixed with `VITE_`
- **API Base**: `VITE_PUBLIC_API_BASE` for AWS API Gateway
- **Provider**: `VITE_VC_API_PROVIDER` for service selection
- **Secrets**: Managed via AWS Secrets Manager (never in repo)

## Architecture Patterns
- **Component Structure**: Atomic design with ui/, feature/, and page-level components
- **Hooks Pattern**: Custom hooks for business logic and API calls
- **Service Layer**: Dedicated services for external integrations
- **Type Safety**: Comprehensive TypeScript coverage with Zod schemas