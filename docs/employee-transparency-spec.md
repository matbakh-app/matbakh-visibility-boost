# Employee Transparency Specification - matbakh.app

## Übersicht

Dieses Dokument spezifiziert ein Mitarbeiter-Workspace-System für Transparenz, Q&A und Content-Beiträge ohne neue Infrastruktur-Komponenten.

## Flows (Bestehende Infrastruktur nutzen)

### 1. Employee Invite Flow

#### Reuse: Bestehender DOI-Flow
```sql
-- Erweiterte VcTokens für Employee Invites
ALTER TABLE VcTokens ADD COLUMN IF NOT EXISTS purpose VARCHAR(50) DEFAULT 'vc_report';
-- purpose: 'vc_report' | 'employee_invite' | 'password_reset'

-- Employee Invite via bestehenden /vc/start Endpoint
POST /vc/start
{
  "email": "mitarbeiter@restaurant.de",
  "purpose": "employee_invite",
  "organization_id": "01HN123...",
  "role": "staff",
  "invited_by": "01HN456...",
  "locale": "de"
}

-- DOI-Mail mit angepasstem Template
-- /vc/confirm → Redirect zu /team/join?t={token}
```

#### Join-Prozess
```
1. DOI-Bestätigung → /team/join?t={token}
2. Zuordnung zu Organisation/Standort
3. Rollen-Zuweisung: owner | manager | staff | contractor
4. Willkommens-Q&A (kuratierte Fragen)
```

### 2. Q&A System

#### Kuratierte Fragen (Unternehmenswerte, Angebote, Besonderheiten)
```sql
-- Beispiel-Fragen für Restaurant-Mitarbeiter
INSERT INTO qna_questions (org_id, locale, slug, text, is_required, category) VALUES
('01HN123...', 'de', 'company-values', 'Was macht unser Restaurant besonders?', true, 'culture'),
('01HN123...', 'de', 'signature-dishes', 'Welche Gerichte empfehlen Sie am häufigsten?', true, 'offerings'),
('01HN123...', 'de', 'customer-feedback', 'Was sagen Gäste oft über uns?', false, 'reputation'),
('01HN123...', 'de', 'team-atmosphere', 'Wie würden Sie die Arbeitsatmosphäre beschreiben?', false, 'culture'),
('01HN123...', 'de', 'photo-consent', 'Dürfen wir Fotos von Ihnen für Marketing verwenden?', true, 'legal');
```

#### Antwort-Sammlung
- **Strukturiert**: Multiple Choice + Freitext-Ergänzungen
- **Anonymisierbar**: Optional anonyme Antworten für ehrliches Feedback
- **Versioniert**: Antworten können aktualisiert werden
- **Aggregiert**: Für Visibility Check und Marketing-Content nutzbar

### 3. Content-Beiträge (Bilder, Posts)

#### Bild-Upload (Supabase Storage nutzen)
```
Bucket: employee-content/{org_id}/{user_id}/
- Automatische Bildoptimierung
- Metadaten: Aufnahmeort, Beschreibung, Verwendungsrechte
- Moderation-Queue für Owner/Manager
```

#### Post-Vorbereitung (Kein Auto-Publish)
```
- Mitarbeiter erstellen Post-Entwürfe
- Owner/Manager Review und Freigabe
- Integration in Content-Kalender
- Verwendung für Social Media und Website
```

## Datenmodell (Bestehende Tabellen prüfen)

### Zu prüfende bestehende Tabellen
```sql
-- Check if these tables exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('organizations', 'locations', 'profiles', 'user_profiles')
ORDER BY table_name, ordinal_position;

-- Check for existing membership/role tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%member%' 
    OR table_name LIKE '%role%'
    OR table_name LIKE '%team%';
```

### P1-Ergänzungen (falls Tabellen fehlen)

#### org_memberships
```sql
CREATE TABLE org_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'contractor')),
    invited_by UUID REFERENCES user_profiles(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_memberships_org ON org_memberships(org_id, is_active);
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id, is_active);
```

#### qna_questions
```sql
CREATE TABLE qna_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL DEFAULT 'de',
    slug VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'culture', 'offerings', 'reputation', 'legal'
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(org_id, slug, locale)
);
```

#### qna_answers
```sql
CREATE TABLE qna_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES qna_questions(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(org_id, user_id, question_id)
);
```

#### content_assets
```sql
CREATE TABLE content_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video', 'post_draft', 'story_idea')),
    title VARCHAR(255),
    description TEXT,
    url TEXT, -- Supabase Storage URL
    metadata JSONB, -- Bildrechte, Aufnahmeort, etc.
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'published')),
    reviewed_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_assets_org ON content_assets(org_id, status);
CREATE INDEX idx_content_assets_user ON content_assets(user_id, type);
```

#### member_invites
```sql
CREATE TABLE member_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email_lower VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'staff', 'contractor')),
    token_hash VARCHAR(64) NOT NULL,
    invited_by UUID NOT NULL REFERENCES user_profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(org_id, email_lower),
    UNIQUE(token_hash)
);

-- TTL für abgelaufene Invites
CREATE INDEX idx_member_invites_ttl ON member_invites(expires_at) WHERE status = 'pending';
```

## RLS-Policies (Supabase)

### org_memberships
```sql
-- Nutzer können eigene Mitgliedschaften lesen
CREATE POLICY "Users can read own memberships" ON org_memberships
    FOR SELECT USING (user_id = auth.uid());

-- Owner/Manager können Org-Mitgliedschaften verwalten
CREATE POLICY "Owners and managers can manage org memberships" ON org_memberships
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() 
                AND role IN ('owner', 'manager')
                AND is_active = true
        )
    );

ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;
```

### qna_answers
```sql
-- Mitarbeiter können eigene Antworten schreiben/lesen
CREATE POLICY "Members can manage own answers" ON qna_answers
    FOR ALL USING (
        user_id = auth.uid() 
        AND org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Owner/Manager können alle Antworten ihrer Org lesen
CREATE POLICY "Owners and managers can read org answers" ON qna_answers
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() 
                AND role IN ('owner', 'manager')
                AND is_active = true
        )
    );

-- Keine öffentlichen Antworten (nur anonymisierte Aggregationen für Reports)
ALTER TABLE qna_answers ENABLE ROW LEVEL SECURITY;
```

### content_assets
```sql
-- Mitarbeiter können eigene Assets verwalten
CREATE POLICY "Members can manage own assets" ON content_assets
    FOR ALL USING (
        user_id = auth.uid() 
        AND org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Owner/Manager können alle Assets ihrer Org verwalten
CREATE POLICY "Owners and managers can manage org assets" ON content_assets
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM org_memberships 
            WHERE user_id = auth.uid() 
                AND role IN ('owner', 'manager')
                AND is_active = true
        )
    );

ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
```

## Gamification-Integration

### Team-Aktivitäts-Punkte
```sql
-- Punkte-System für Mitarbeiter-Beiträge
CREATE VIEW v_team_activity_score AS
SELECT 
    om.org_id,
    om.user_id,
    (
        (SELECT COUNT(*) FROM qna_answers WHERE user_id = om.user_id AND org_id = om.org_id) * 10 +
        (SELECT COUNT(*) FROM content_assets WHERE user_id = om.user_id AND org_id = om.org_id AND status = 'approved') * 15 +
        (SELECT COUNT(*) FROM content_assets WHERE user_id = om.user_id AND org_id = om.org_id AND type = 'post_draft' AND status = 'approved') * 20
    ) AS activity_score
FROM org_memberships om
WHERE om.is_active = true;
```

### Team-Badges
- **"Team aktiv"**: ≥ 3 Mitarbeiter haben Q&A beantwortet
- **"Content Creator"**: ≥ 5 genehmigte Bild-Uploads
- **"Story Teller"**: ≥ 3 genehmigte Post-Entwürfe
- **"Vollständiges Profil"**: Alle Pflicht-Q&As beantwortet

### Progress-Integration
```sql
-- Team-Aktivität fließt in Onboarding-Progress ein
UPDATE onboarding_progress 
SET team_activity_bonus = (
    SELECT COALESCE(AVG(activity_score), 0) * 0.1 -- 10% Bonus
    FROM v_team_activity_score 
    WHERE org_id = onboarding_progress.org_id
)
WHERE org_id IS NOT NULL;
```

## Transparenz-Features

### Öffentliche Einblicke (Anonymisiert)
```sql
-- Aggregierte Team-Insights für Visibility Check
CREATE VIEW v_public_team_insights AS
SELECT 
    org_id,
    COUNT(DISTINCT user_id) as team_size,
    AVG(activity_score) as avg_team_activity,
    COUNT(*) FILTER (WHERE activity_score > 50) as active_members,
    MAX(created_at) as last_team_activity
FROM v_team_activity_score
GROUP BY org_id;
```

### Content-Pipeline
```
1. Mitarbeiter → Post-Entwurf/Bild-Upload
2. Manager → Review & Approval
3. System → Content-Kalender-Integration
4. Owner → Publishing-Entscheidung
5. Analytics → Performance-Tracking
```

## Events & KPIs

### Neue Events
```json
{
  "employee_invite_sent": {
    "org_id": "uuid",
    "email_lower": "string",
    "role": "string",
    "invited_by": "uuid"
  },
  "employee_joined": {
    "org_id": "uuid", 
    "user_id": "uuid",
    "role": "string",
    "invite_duration_hours": "number"
  },
  "qna_answer_submitted": {
    "org_id": "uuid",
    "user_id": "uuid", 
    "question_id": "uuid",
    "is_anonymous": "boolean"
  },
  "asset_uploaded": {
    "org_id": "uuid",
    "user_id": "uuid",
    "asset_type": "string",
    "file_size_mb": "number"
  },
  "post_draft_created": {
    "org_id": "uuid",
    "user_id": "uuid",
    "content_type": "string",
    "word_count": "number"
  }
}
```

### KPIs für Transparenz
- **Transparenz-Score**: (Beantwortete Pflicht-Q&As / Gesamt-Pflicht-Q&As) * 100
- **Team-Aktivität**: Durchschnittliche Activity-Score pro Mitarbeiter
- **Content-Beitrag**: Genehmigte Assets pro Monat
- **Einfluss auf VC-Score**: Team-Aktivität → +5-15% VC-Score-Bonus
- **Tier-Progress**: Team-Beiträge beschleunigen Onboarding-Tiers

## Workflow-Integration

### Onboarding-Integration
```
Tier 50% → "Team einladen" freigeschaltet
Tier 80% → Q&A-System aktiviert  
Tier 95% → Content-Collaboration verfügbar
```

### Visibility Check Integration
```sql
-- Team-Daten fließen in VC-Berechnung ein
SELECT 
    vc.overall_score,
    vc.team_transparency_score,
    (vc.overall_score + vc.team_transparency_score * 0.15) as enhanced_score
FROM visibility_checks vc
LEFT JOIN v_public_team_insights pti ON vc.org_id = pti.org_id;
```

## Datenschutz & Compliance

### Mitarbeiter-Rechte
- **Anonyme Antworten**: Optional für ehrliches Feedback
- **Löschung**: Mitarbeiter können eigene Beiträge löschen
- **Austritt**: Automatische Deaktivierung bei Org-Verlassen
- **Bildrechte**: Explizite Einverständniserklärung für Marketing-Nutzung

### DSGVO-Konformität
```sql
-- Mitarbeiter-Daten-Export
SELECT 
    'org_memberships' as table_name, * FROM org_memberships WHERE user_id = ?
UNION ALL
SELECT 'qna_answers', * FROM qna_answers WHERE user_id = ?
UNION ALL  
SELECT 'content_assets', * FROM content_assets WHERE user_id = ?;

-- Mitarbeiter-Daten-Löschung (Cascade)
DELETE FROM org_memberships WHERE user_id = ?;
-- Triggers löschen automatisch abhängige qna_answers und content_assets
```

## UI/UX Konzept

### Team-Dashboard (/team)
```
Header: Org-Name, Rolle, Team-Größe
Sidebar: Q&A, Content, Einstellungen
Main: 
  - Willkommens-Q&A (bei Erstbesuch)
  - Content-Upload-Bereich
  - Team-Aktivitäts-Feed
  - Transparenz-Score-Anzeige
```

### Q&A-Interface
```
Frage-Kategorien: Kultur, Angebote, Reputation, Rechtliches
Progress-Anzeige: "3 von 8 Pflicht-Fragen beantwortet"
Anonymitäts-Toggle: "Anonym antworten" (für ehrliches Feedback)
Speichern-Mechanik: Auto-Save + "Später fortsetzen"
```

### Content-Upload
```
Drag & Drop: Bilder direkt hochladen
Metadaten-Form: Beschreibung, Verwendungsrechte, Aufnahmeort
Preview: Wie es in Posts/Website aussehen würde
Status-Tracking: Draft → Review → Approved → Published
```

## Testing & Validierung

### Invite-Flow-Test
```sql
-- Test Employee Invite
INSERT INTO VcTokens (email_lower, purpose, org_id, role, invited_by, token_hash, created_at, ttl)
VALUES ('test@restaurant.de', 'employee_invite', '01HN123...', 'staff', '01HN456...', 'test-hash', NOW(), NOW() + INTERVAL '7 days');

-- Test DOI-Confirm für Employee
-- GET /vc/confirm?t=test-token → Should redirect to /team/join
```

### Q&A-System-Test
```sql
-- Test Q&A Flow
INSERT INTO qna_questions (org_id, locale, slug, text, is_required, category)
VALUES ('01HN123...', 'de', 'test-question', 'Was ist unser Signature-Dish?', true, 'offerings');

INSERT INTO qna_answers (org_id, user_id, question_id, answer)
VALUES ('01HN123...', '01HN789...', (SELECT id FROM qna_questions WHERE slug = 'test-question'), 'Unser berühmtes Schnitzel Wiener Art');
```

## Erfolgskriterien

1. **Team-Adoption**: ≥ 60% der eingeladenen Mitarbeiter schließen Q&A ab
2. **Content-Qualität**: ≥ 80% der hochgeladenen Assets werden genehmigt
3. **Transparenz-Impact**: Team-aktive Restaurants haben 15% höhere VC-Scores
4. **Retention**: Restaurants mit aktiven Teams haben 25% niedrigere Churn-Rate
5. **Authentizität**: User-generated Content erhöht Engagement um 40%

## Implementierungs-Phasen

### P0 (Sofort - Bestehende Infrastruktur)
1. VcTokens um purpose='employee_invite' erweitern
2. DOI-Mail-Template für Employee Invites
3. /team/join Route mit Token-Validierung

### P1 (4 Wochen - Neue Tabellen)
1. org_memberships, qna_questions, qna_answers Tabellen
2. RLS-Policies für Team-Zugriff
3. Q&A-Interface und Content-Upload

### P2 (8 Wochen - Integration)
1. Gamification-Integration (Team-Badges, Activity-Score)
2. VC-Integration (Team-Transparenz-Score)
3. Content-Pipeline und Approval-Workflow