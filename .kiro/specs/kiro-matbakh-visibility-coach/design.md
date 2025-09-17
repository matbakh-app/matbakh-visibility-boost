# Kiro Matbakh Visibility Coach - Design Document

## Architecture Overview

This project demonstrates a clean, testable architecture that showcases Kiro's spec-to-code capabilities.

```
[User Input] → (Parser) → (Heuristik + Rulesets) → (Top-5 Maßnahmen, Scores)
                                ↘︎ (Markdown-Playbook Renderer) → Export (.md)
```

## System Components

### Core Processing Pipeline

#### 1. Input Parser (`src/core/parser.ts`)
- **Purpose:** Normalize different input formats (URL vs JSON profile)
- **Input:** String URL or JSON object `{ name, city, category, shortBio? }`
- **Output:** Standardized `RestaurantProfile` object
- **Logic:** 
  - URL detection and basic parsing (MVP: simple heuristics)
  - JSON validation and normalization
  - Error handling for invalid inputs

#### 2. Visibility Scorer (`src/core/scorer.ts`)
- **Purpose:** Generate scores across 5 visibility dimensions
- **Input:** `RestaurantProfile`
- **Output:** `VisibilityScores` object with 0-100 scores
- **Dimensions:**
  - Google Profile Completeness (0-100)
  - Social Content Quality (0-100)
  - Menu Clarity (0-100)
  - Locality Signals (0-100)
  - Brand Consistency (0-100)
- **Logic:** Rule-based scoring with category-specific weights

#### 3. Action Planner (`src/core/planner.ts`)
- **Purpose:** Generate prioritized action recommendations
- **Input:** `VisibilityScores` + `RestaurantProfile`
- **Output:** Array of exactly 5 `ActionItem` objects
- **Logic:**
  - Impact vs Effort matrix
  - Category-specific action templates
  - Priority ranking algorithm

#### 4. Markdown Renderer (`src/core/markdown_renderer.ts`)
- **Purpose:** Generate structured markdown playbook
- **Input:** `ActionItem[]` + `RestaurantProfile`
- **Output:** Formatted markdown string
- **Structure:**
  - Header with restaurant name
  - Executive summary
  - Prioritized action list
  - Next steps section

### Interface Layers

#### CLI Interface (`src/cli/index.ts`)
- **Purpose:** Command-line interface for developers
- **Features:**
  - Argument parsing (URL or JSON file)
  - Table output for actions
  - File writing for markdown export
  - Error handling and help text

#### Web Interface (`src/web/App.tsx`)
- **Purpose:** Simple web UI for non-technical users
- **Features:**
  - Input form (URL or manual entry)
  - Results display card
  - Download button for markdown
  - Responsive design

## Data Models

### Core Types

```typescript
interface RestaurantProfile {
  name: string;
  city: string;
  category: RestaurantCategory;
  shortBio?: string;
  url?: string;
}

interface VisibilityScores {
  googleProfile: number;      // 0-100
  socialContent: number;      // 0-100
  menuClarity: number;        // 0-100
  localitySignals: number;    // 0-100
  brandConsistency: number;   // 0-100
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  rationale: string;          // 2 sentences max
  priority: number;           // 1-5
  estimatedEffort: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
}

type RestaurantCategory = 
  | 'casual-dining' 
  | 'fine-dining' 
  | 'fast-food' 
  | 'cafe' 
  | 'bar' 
  | 'family-friendly'
  | 'vegan'
  | 'ethnic';
```

## Processing Logic

### Scoring Algorithm

Each dimension uses weighted factors:

**Google Profile (Weight: 30%)**
- Name consistency: 20%
- Address completeness: 25%
- Hours accuracy: 20%
- Photos quality: 35%

**Social Content (Weight: 25%)**
- Post frequency: 40%
- Engagement rate: 30%
- Content quality: 30%

**Menu Clarity (Weight: 20%)**
- Price transparency: 50%
- Description quality: 30%
- Category organization: 20%

**Locality Signals (Weight: 15%)**
- Local keywords: 40%
- Community engagement: 35%
- Local partnerships: 25%

**Brand Consistency (Weight: 10%)**
- Visual consistency: 60%
- Message alignment: 40%

### Action Prioritization Matrix

```
High Impact + Low Effort = Priority 1
High Impact + Medium Effort = Priority 2
Medium Impact + Low Effort = Priority 3
High Impact + High Effort = Priority 4
Medium Impact + Medium Effort = Priority 5
```

## File Structure

```
src/
├── core/
│   ├── parser.ts           # Input normalization
│   ├── scorer.ts           # Visibility scoring
│   ├── planner.ts          # Action generation
│   └── markdown_renderer.ts # Export functionality
├── cli/
│   ├── index.ts            # CLI entry point
│   └── fixtures/           # Test data
├── web/
│   └── App.tsx             # Web interface
└── types/
    └── index.ts            # Type definitions

tests/
├── unit/
│   ├── parser.test.ts
│   ├── scorer.test.ts
│   ├── planner.test.ts
│   └── markdown_renderer.test.ts
├── integration/
│   └── cli.test.ts
└── snapshots/
    └── markdown_output.test.ts
```

## Quality Assurance

### Testing Strategy

1. **Unit Tests:** Each core component isolated
2. **Integration Tests:** CLI end-to-end workflow
3. **Snapshot Tests:** Markdown output consistency
4. **Property Tests:** Score ranges and action counts

### Kiro Integration Points

1. **Spec-to-Code:** This design document drives implementation
2. **Hooks:** Validate on spec changes, run tests on commits
3. **Steering:** Enforce TypeScript strict mode, functional patterns
4. **Quality Gates:** ESLint, Prettier, type checking, test coverage

## Performance Considerations

- **Target:** Sub-5-second CLI execution
- **Memory:** Minimal footprint, no caching needed
- **Scalability:** Stateless design, easily parallelizable
- **Dependencies:** Keep minimal for fast startup

## Security Considerations

- **Input Validation:** Sanitize all user inputs
- **No External Calls:** MVP avoids API dependencies
- **File System:** Safe path handling for exports
- **XSS Prevention:** Sanitize web form inputs

## Future Extensibility

- **Plugin Architecture:** Easy to add new scoring dimensions
- **API Integration:** Ready for real data sources
- **Multi-language:** Template-based text generation
- **Advanced Analytics:** Score trending and benchmarking