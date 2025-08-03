# Restaurant Dashboard Guidelines

## General Design Philosophy

This Restaurant Dashboard follows a data-driven design approach with emphasis on:
* **Clarity**: Information hierarchy that prioritizes critical business metrics
* **Efficiency**: Quick access to actionable insights for restaurant operations
* **Accessibility**: WCAG 2.1 AA compliance with multi-language support (DE/EN)
* **Responsiveness**: Seamless experience across desktop (1440px), tablet (768px), and mobile (375px)

---

## Design System Rules

### Typography Hierarchy
* **Headlines**: Inter font, 18-24px, font-weight 600 for widget titles and main headers
* **Metrics**: Roboto Mono font, 28-48px, font-weight 600 for numerical data display
* **Body Text**: System font, 14px, line-height 1.5 for content and descriptions
* **Captions**: 12px for secondary information and metadata
* **Never override** font-size, font-weight, or line-height classes unless specifically requested

### Color Semantics
* **Primary Brand**: #4F46E5 (Indigo) for CTAs and primary actions
* **Success**: #10B981 (Emerald) for positive metrics, growth indicators
* **Warning**: #F59E0B (Amber) for attention-required metrics
* **Error**: #EF4444 (Red) for negative trends, critical alerts
* **Neutral**: #6B7280 (Gray) for secondary information

### Spacing System (8px Grid)
* **Widget Padding**: 24px for internal widget spacing
* **Grid Gaps**: 16px on mobile, 24px on desktop
* **Component Margins**: 8px, 16px, 24px, 32px increments only
* **Touch Targets**: Minimum 40px (44px on mobile) for interactive elements

---

## Restaurant-Specific Components

### Widget Categories
1. **Performance**: Visibility Score, Performance Trends, KPI metrics
2. **Customer**: Reviews, Reservations, Loyalty Programs  
3. **Business**: Orders & Revenue, Analytics, Marketing ROI
4. **Operations**: Staff Management, Location Overview, Delivery Tracking
5. **Intelligence**: Competitor Monitoring, Cultural Insights, A/B Testing

### Data Visualization Rules
* **Currency**: Always use localized formatting (€3.247,50 DE vs €3,247.50 EN)
* **Dates**: DD.MM.YYYY (German) vs MM/DD/YYYY (English)
* **Time**: 24-hour format (German) vs 12-hour format (English)
* **Numbers**: Use thousand separators appropriate to language
* **Percentages**: Include + or - indicators for trend directions

### Widget Sizing Standards
* **Small**: 1x2 grid slots - Single metric focus (Instagram Stories, Quick Stats)
* **Medium**: 1x2 grid slots - Multiple related metrics (Visibility Score, Location Overview)  
* **Large**: 2x2 grid slots - Comprehensive dashboards (Analytics, Reviews, Marketing)
* **Compact Mode**: All widgets reduce to 1x1 for dense information display

---

## Internationalization (i18n) Requirements

### Language Support
* **Default Language**: German (DE) - Primary market
* **Secondary Language**: English (EN) - International users
* **Text Direction**: Left-to-right for both languages
* **Language Switch**: Always visible in header, persistent across sessions

### Localization Standards
* **Business Hours**: Use local time format preferences
* **Addresses**: Follow local postal standards
* **Phone Numbers**: Use country-appropriate formatting
* **Currency**: Default to EUR with localized number formatting

### Content Guidelines
* **Error Messages**: Provide helpful, contextual information in both languages
* **Loading States**: Include translated loading text and skeleton screens
* **Empty States**: Offer constructive guidance for next steps
* **Success Feedback**: Confirm actions with appropriate cultural context

---

## User Experience Rules

### Dashboard Interaction
* **Widget Reordering**: Drag-and-drop functionality with visual feedback
* **Responsive Grid**: Automatic layout adjustment based on screen size
* **Infinite Scroll**: Not used - prefer pagination for better performance
* **Auto-refresh**: Configurable intervals (30s, 1m, 5m) with manual override

### Accessibility Standards
* **Keyboard Navigation**: All interactive elements must be keyboard accessible
* **Screen Readers**: Proper ARIA labels and semantic HTML structure
* **Color Contrast**: Minimum 4.5:1 ratio for text, 3:1 for UI elements
* **Focus Indicators**: Visible focus rings with 2px outline offset

### Performance Requirements
* **Initial Load**: Under 3 seconds for dashboard visibility
* **Widget Loading**: Progressive loading with skeleton screens
* **Image Optimization**: WebP format with fallbacks, responsive sizing
* **Code Splitting**: Lazy load widgets to improve initial bundle size

---

## Dark Mode Implementation

### Color Token System
* Use CSS custom properties for all colors to support theme switching
* Maintain semantic color meaning across light and dark themes
* Ensure sufficient contrast ratios in both modes (minimum 4.5:1)

### Theme Transition
* **Smooth Animations**: 300ms ease-in-out for color transitions
* **System Preference**: Respect user's OS theme preference by default
* **Manual Override**: Allow users to force light/dark mode regardless of system
* **Persistence**: Save theme preference in localStorage

### Component Adaptations
* **Widget Cards**: Enhanced shadows and borders in dark mode
* **Charts**: Adapted grid lines and tooltips for dark backgrounds
* **Form Elements**: Proper background and border colors for visibility

---

## Restaurant Business Logic

### Key Performance Indicators (KPIs)
* **Revenue Metrics**: Daily/weekly/monthly revenue with YoY comparisons
* **Customer Satisfaction**: Review aggregation across platforms (Google, TripAdvisor, Yelp)
* **Operational Efficiency**: Table turnover, wait times, staff productivity
* **Marketing ROI**: ROAS, conversion rates, customer acquisition costs

### Time-Sensitive Data
* **Real-time Updates**: Reservations, current occupancy, order queue
* **Daily Metrics**: Revenue, guest count, average order value
* **Weekly Trends**: Performance comparisons, staffing insights
* **Monthly Reports**: Comprehensive business intelligence summaries

### Alert Thresholds
* **Critical**: Revenue down >20%, customer satisfaction <3.5 stars
* **Warning**: Occupancy >90%, wait times >30 minutes  
* **Info**: New reviews, upcoming reservations, staff schedule changes

---

## Technical Implementation

### State Management
* **useAppState**: Central hook for dashboard settings, theme, and widget visibility
* **useLanguage**: i18n context with formatting helpers for dates, currency, numbers
* **Error Boundaries**: Graceful fallbacks for individual widget failures

### Performance Optimization
* **Lazy Loading**: Widgets load only when visible or prioritized
* **Memoization**: React.memo for expensive chart components
* **Virtual Scrolling**: For large data sets (reviews, order history)
* **Caching Strategy**: 5-minute cache for non-critical data, real-time for critical metrics

### Responsive Design
* **Mobile-First**: Design and implement for mobile, then enhance for larger screens
* **Breakpoints**: 375px (mobile), 768px (tablet), 1024px (desktop), 1440px (large)
* **Touch Targets**: Ensure 44px minimum touch area on mobile devices
* **Gesture Support**: Swipe for navigation, long-press for context menus

---

## Quality Assurance

### Testing Requirements
* **Cross-browser**: Chrome, Firefox, Safari, Edge (latest 2 versions)
* **Device Testing**: iPhone 12/13, iPad, common Android devices
* **Accessibility**: Screen reader testing with NVDA/VoiceOver
* **Performance**: Lighthouse score >90 for all metrics

### Code Quality
* **TypeScript**: Strict mode enabled, proper type definitions
* **ESLint**: Consistent code style, accessibility rule enforcement
* **Component Structure**: Maximum 300 lines per component, clear separation of concerns
* **Documentation**: JSDoc comments for complex business logic

---

## Business Requirements

### Restaurant Operations Context
* **Peak Hours**: Special handling for lunch (12:00-14:00) and dinner (19:00-21:00) rushes
* **Multi-Location**: Support for restaurant chains with location switching
* **Role-Based Access**: Admin, Manager, View-Only user permissions
* **Integration**: POS systems, reservation platforms, review aggregators

### Compliance & Privacy
* **GDPR**: Customer data protection for EU operations
* **PCI DSS**: Secure handling of payment-related data
* **Data Retention**: Configurable policies for analytics and customer data
* **Audit Trails**: Log critical business actions for compliance

These guidelines ensure consistent, high-quality implementation of the Restaurant Dashboard while maintaining focus on real business needs and user experience excellence.