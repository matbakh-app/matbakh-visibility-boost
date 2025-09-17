# Kiro Matbakh Visibility Coach - Requirements

## Project Overview

A lightweight, public demo project that demonstrates how to use **Kiro** (Spec-to-Code, Hooks, Steering) to build a production-ready app in just a few sessions.

**Input:** Public restaurant URL or short profile  
**Output:** **Next Best Actions** (Top-5 measures) + **Mini-Playbook** as Markdown  
**Focus:** **How** Kiro gets us there (Specification → Code → Tests → small UI)

## User Stories

### Requirement 1: Restaurant Profile Input
**User Story:** As a restaurant owner, I want to input my restaurant URL or profile information so that I can get actionable visibility recommendations.

#### Acceptance Criteria
1. WHEN I provide a restaurant URL THEN the system SHALL parse and extract basic information
2. WHEN I provide a JSON profile with name, city, category, shortBio THEN the system SHALL accept and process it
3. IF no input is provided THEN the system SHALL display clear validation messages
4. WHEN input is invalid THEN the system SHALL provide helpful error messages

### Requirement 2: Visibility Analysis Engine
**User Story:** As a restaurant owner, I want the system to analyze my digital presence so that I can understand my current visibility status.

#### Acceptance Criteria
1. WHEN input is processed THEN the system SHALL generate scores for 5 dimensions (Google Profile, Social Content, Menu Clarity, Locality Signals, Consistency)
2. WHEN scores are calculated THEN each dimension SHALL have a score between 0-100
3. WHEN analysis is complete THEN the system SHALL identify the top 5 priority actions
4. WHEN actions are generated THEN each action SHALL include a 2-sentence rationale

### Requirement 3: Actionable Recommendations
**User Story:** As a restaurant owner, I want to receive prioritized, actionable recommendations so that I know exactly what to do next.

#### Acceptance Criteria
1. WHEN analysis is complete THEN the system SHALL provide exactly 5 prioritized actions
2. WHEN actions are displayed THEN each action SHALL be specific and actionable
3. WHEN actions are generated THEN they SHALL be ranked by impact and effort
4. WHEN recommendations are shown THEN they SHALL include clear next steps

### Requirement 4: Markdown Playbook Export
**User Story:** As a marketing team member, I want to export a shareable 1-page markdown plan so that I can share it with my team.

#### Acceptance Criteria
1. WHEN export is requested THEN the system SHALL generate a structured markdown file
2. WHEN markdown is created THEN it SHALL include title, intro, actions, and next steps
3. WHEN file is generated THEN it SHALL be downloadable
4. WHEN markdown is created THEN it SHALL have deterministic headings for testing

### Requirement 5: CLI Interface
**User Story:** As a developer, I want to use a CLI interface so that I can integrate the tool into my workflow.

#### Acceptance Criteria
1. WHEN CLI is executed with valid input THEN it SHALL print 5 actions in table format
2. WHEN CLI completes THEN it SHALL write a markdown file to disk
3. WHEN CLI encounters errors THEN it SHALL provide clear error messages
4. WHEN CLI is run THEN it SHALL complete within 5 seconds

### Requirement 6: Web Interface
**User Story:** As a restaurant owner, I want a simple web interface so that I can easily use the tool without technical knowledge.

#### Acceptance Criteria
1. WHEN I visit the web interface THEN I SHALL see a simple form for input
2. WHEN I submit valid input THEN I SHALL see the 5 actions displayed
3. WHEN results are shown THEN I SHALL have a "Download .md" button
4. WHEN I click download THEN I SHALL receive the markdown playbook

### Requirement 7: Kiro Integration Demonstration
**User Story:** As a hackathon judge, I want to see how Kiro was used so that I can evaluate the tool's effectiveness.

#### Acceptance Criteria
1. WHEN reviewing the project THEN the /.kiro directory SHALL contain specs, hooks, and steering
2. WHEN code is generated THEN it SHALL follow the specifications exactly
3. WHEN specs change THEN hooks SHALL trigger validation and tests
4. WHEN development occurs THEN steering SHALL ensure consistent code quality

## Non-Functional Requirements

### Performance
- CLI execution SHALL complete within 5 seconds
- Web interface SHALL respond within 2 seconds
- File generation SHALL complete within 1 second

### Quality
- Code coverage SHALL be at least 80%
- All tests SHALL pass before deployment
- Code SHALL follow TypeScript strict mode
- Linting SHALL pass with zero warnings

### Maintainability
- Each feature SHALL have corresponding tests
- README changes SHALL be required for breaking changes
- Code SHALL use functional, pure helpers where possible
- Dependencies SHALL be minimal and justified

## Technical Constraints

- Language: TypeScript
- Runtime: Node.js 18+
- No external APIs in MVP
- No authentication required
- No database required
- Deterministic outputs for testing

## Success Criteria

1. **Functional:** All user stories implemented and tested
2. **Technical:** Kiro workflow fully demonstrated (spec → code → tests → hooks)
3. **Documentation:** Clear evidence of Kiro usage in /.kiro directory
4. **Quality:** 80%+ test coverage, all quality gates passing
5. **Usability:** Both CLI and web interfaces working smoothly