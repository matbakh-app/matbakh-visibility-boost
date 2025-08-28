---
title: Admin — Partner Credits
version: 2025-08-26
spec_ids: [ADMIN-CR-01, ADMIN-CR-02]
permissions: [admin, super_admin]
---

# Admin Partner Credits Interface

## Overview
Administrative interface for managing partner credit allocations, policies, and consumption tracking.

## Main View - Credits Table

### Table Columns
- **Partner ID**: Clickable link to detail view
- **Balance**: Current available credits with color coding
  - 🟢 Green: > 50% of original allocation
  - 🟠 Orange: 10-50% remaining  
  - 🔴 Red: < 10% remaining or negative (overage)
- **Billing Mode**: "issue" | "redeem" with badge styling
- **Overage Policy**: "allow_and_invoice" | "block_when_exhausted"
- **Unit Price**: EUR per credit (for overage billing)
- **Updated At**: Last modification timestamp
- **Actions**: Quick action buttons

### Quick Actions
- **Grant Credits**: Opens modal for credit allocation
- **Adjust**: Opens modal for +/- adjustments
- **View Ledger**: Navigate to detailed transaction history

## Detail View - Partner Credit Management

### Summary Cards
- **Current Balance**: Large number with trend indicator
- **Total Granted**: Lifetime credit allocations
- **Total Consumed**: Credits used for code generation
- **Overage Amount**: Credits consumed beyond allocation (if any)

### Policy Configuration Panel
- **Billing Mode**: Radio buttons (issue/redeem) with explanations
- **Overage Policy**: Toggle with impact warnings
- **Unit Price**: EUR input with validation (2 decimal places)
- **Save Changes**: Button with confirmation dialog

### Ledger Feed (Paginated)
- **Transaction List**: Chronological order (newest first)
- **Entry Format**: 
  ```
  [TIMESTAMP] [KIND] [±QUANTITY] by [USER]
  Reason: [REASON_TEXT]
  Meta: [JSON_DETAILS]
  ```
- **Filtering**: By kind (grant/consume/adjust/expire), date range
- **Export**: CSV download for accounting

## Modals & Dialogs

### Grant Credits Modal
- **Partner ID**: Read-only display
- **Quantity**: Number input (min: 1, max: 10000)
- **Reason**: Text area (required)
- **Expires At**: Optional date picker
- **Preview**: Shows new balance calculation
- **Actions**: Cancel | Grant Credits

### Adjust Credits Modal  
- **Current Balance**: Display for reference
- **Adjustment**: Number input (positive or negative)
- **Reason**: Text area (required, mandatory for adjustments)
- **Impact Preview**: Shows resulting balance
- **Actions**: Cancel | Apply Adjustment

### Policy Change Confirmation
- **Current Settings**: Display existing policies
- **New Settings**: Highlight changes
- **Impact Warning**: Explain consequences of policy changes
- **Actions**: Cancel | Confirm Changes

## States & Error Handling

### Loading States
- **Table Loading**: Skeleton rows with shimmer effect
- **Detail Loading**: Card placeholders
- **Action Loading**: Disabled buttons with spinners

### Empty States
- **No Partners**: "No partner credits configured" with setup CTA
- **No Ledger**: "No transactions yet" with grant credits CTA

### Error States
- **Load Error**: "Credits konnten nicht geladen werden" with retry button
- **Save Error**: Toast notification with specific error message
- **Validation Error**: Inline field errors with red styling

## Microcopy (German)

### Actions
- `actions.grant.title`: "Credits gutschreiben"
- `actions.adjust.title`: "Kontingent anpassen"  
- `actions.viewLedger.title`: "Transaktionen anzeigen"
- `actions.export.title`: "Ledger exportieren"

### Forms
- `form.quantity.label`: "Anzahl"
- `form.reason.label`: "Grund"
- `form.reason.placeholder`: "Grund für die Änderung..."
- `form.expiresAt.label`: "Verfällt am (optional)"

### Policies
- `policy.billingMode.label`: "Abrechnungsmodus"
- `policy.billingMode.issue`: "Bei Ausstellung"
- `policy.billingMode.redeem`: "Bei Einlösung"
- `policy.overagePolicy.label`: "Überbuchung"
- `policy.overagePolicy.allow`: "Erlauben und abrechnen"
- `policy.overagePolicy.block`: "Blockieren bei 0 Credits"
- `policy.unitPrice.label`: "Preis pro Code (EUR)"

### Status Messages
- `toast.saved`: "Gespeichert"
- `toast.granted`: "Credits gutgeschrieben"
- `toast.adjusted`: "Kontingent angepasst"
- `error.load`: "Credits konnten nicht geladen werden"
- `error.save`: "Speichern fehlgeschlagen"
- `error.validation.quantity`: "Anzahl muss größer als 0 sein"
- `error.validation.reason`: "Grund ist erforderlich"

### Confirmations
- `confirm.policyChange.title`: "Richtlinien ändern?"
- `confirm.policyChange.message`: "Diese Änderung betrifft zukünftige Abrechnungen."
- `confirm.adjust.title`: "Kontingent anpassen?"
- `confirm.adjust.message`: "Diese Aktion wird im Ledger protokolliert."

## Technical Requirements

### API Integration
- **GET** `/partner-credits?partner_id=X` - Fetch balance and policies
- **POST** `/partner-credits` - Grant credits and set policies
- **PATCH** `/partner-credits` - Adjust credits or update policies

### Data Validation
- Quantity: Positive integers only
- Reason: Required for all adjustments, max 500 characters
- Unit Price: 2 decimal places, non-negative
- Partner ID: Must exist in system

### Performance
- Table pagination: 50 entries per page
- Ledger pagination: 100 transactions per page
- Real-time balance updates after actions
- Optimistic UI updates with rollback on error

### Security
- RBAC enforcement on all endpoints
- Audit logging for all credit modifications
- Input sanitization and SQL injection prevention
- Rate limiting on credit grant/adjust operations