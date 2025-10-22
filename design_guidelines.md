# Emergency Hamburg RP Bot Portal - Design Guidelines

## Design Approach

**Selected Framework:** Dashboard-focused design system inspired by modern admin panels (Discord's developer portal, Linear's clean dashboards) with Emergency/RP gaming aesthetic adaptations.

**Core Principles:**
- Information clarity over decoration
- Quick access to critical functions
- Hierarchical information display
- Professional yet approachable German interface

## Typography System

**Font Family:**
- Primary: Inter or Roboto (via Google Fonts CDN)
- Monospace: JetBrains Mono for bot tokens, IDs, timestamps

**Type Scale:**
- Page Titles: text-2xl font-bold
- Section Headers: text-xl font-semibold  
- Subsection Headers: text-lg font-medium
- Body Text: text-base font-normal
- Secondary Text: text-sm
- Meta Information (timestamps, IDs): text-xs font-mono

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 (e.g., p-4, gap-6, space-y-8)

**Page Structure:**
- Fixed sidebar navigation (w-64) on desktop
- Top mobile navigation bar (full-width)
- Main content area with max-w-7xl container and p-6 to p-8 padding
- Consistent section spacing: space-y-8 between major sections

**Grid Patterns:**
- Dashboard Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Server/Channel Lists: Single column with nested structure
- Application Table: Full-width responsive table

## Component Library

### Navigation
**Sidebar (Desktop):**
- Logo/branding at top with "Emergency Assistant" title
- Navigation items with icons (Heroicons via CDN)
- Active state highlighting
- Sections: Dashboard, Server/Kanäle, Nachrichten senden, Bewerbungen, Einstellungen

**Mobile Header:**
- Hamburger menu toggle
- Compact logo
- Status indicator badge

### Dashboard Widgets

**Status Card:**
- Bot online/offline indicator with pulsing badge
- Uptime display
- Version number
- Quick stats (server count, pending applications)
- Server status: "Spielt Hamburg Response Network (HRN)"
- Layout: Single card with grid-cols-2 internal layout for metrics

**Quick Actions Panel:**
- Large touch-friendly buttons (min-h-12)
- Icon + label layout
- Actions: "Nachricht senden", "Bewerbungen ansehen", "Server durchsuchen"

### Server & Channel Browser

**Server List:**
- Collapsible accordion structure
- Server icon + name header
- Channel list nested beneath with indentation (pl-6)
- Channel icons indicating type (text/voice/announcement)
- Click to select for message sending

**Channel Item:**
- Hashtag/speaker icon prefix
- Channel name
- Member count badge (if applicable)
- Hover state for selection

### Message Sending Interface

**Compose Form:**
- Server/Channel selector with search/filter (select dropdown)
- Large textarea (min-h-32) with character count
- Preview toggle option
- Send button prominently placed (bottom-right)
- Success/error toast notifications

### Application Management

**Application List View:**
- Filter tabs: "Alle", "Admin-Bewerbung", "Member-Bewerbung", "Neu", "Bearbeitet"
- Table structure:
  - Columns: Discord Name, Kategorie, Zeitstempel, Status, Aktionen
  - Sortable headers
  - Row actions: Ansehen, Annehmen, Ablehnen
- Pagination controls (bottom)
- Mobile: Card-based layout instead of table

**Application Detail Modal:**
- Full-screen overlay (md: centered modal with max-w-2xl)
- Header: Applicant name, timestamp, category badge
- Scrollable content area with application details
- Footer actions: Status update buttons, close button

### Forms & Inputs

**Input Fields:**
- Labels above inputs (text-sm font-medium, mb-2)
- Full-width inputs with p-3 padding
- Focus states with ring treatment
- Helper text below (text-xs)
- Error states with inline validation messages

**Buttons:**
- Primary action: Larger padding (px-6 py-3), font-semibold
- Secondary action: Ghost/outline style
- Destructive actions: Distinct treatment
- Icon buttons: Square aspect ratio (w-10 h-10)

### Data Display

**Tables:**
- Zebra striping for row distinction
- Sticky header on scroll
- Responsive: Convert to stacked cards on mobile (hidden md:table-cell pattern)
- Action column always visible (right-aligned)

**Badges:**
- Pill-shaped (rounded-full px-3 py-1 text-xs)
- Use for: Status (Online/Offline), Categories (Admin/Member), Counts
- Subtle treatment, not overly vibrant

**Cards:**
- Consistent structure: Header (title + optional action), Content, Footer (optional)
- Padding: p-6
- Rounded corners: rounded-lg
- Spacing between elements: space-y-4

### Status Indicators

**Bot Status:**
- Large centered indicator on dashboard
- Pulsing animation for "online" state (subtle, single color fade)
- Icon + status text + timestamp format
- Emergency-themed iconography (shield, radio, signal waves)

**Notification Toasts:**
- Fixed position (top-right)
- Auto-dismiss (5 seconds)
- Success, error, info variants
- Icon + message + dismiss button

## Responsive Behavior

**Breakpoints:**
- Mobile: base (< 768px) - single column, stacked layout
- Tablet: md (768px+) - 2-column grids, visible sidebar
- Desktop: lg (1024px+) - 3-column grids, expanded layouts

**Mobile Optimizations:**
- Bottom navigation bar option
- Larger tap targets (min 44x44px)
- Simplified table views (card format)
- Collapsible sections for content density

## Accessibility

**Focus Management:**
- Visible focus rings on all interactive elements (ring-2)
- Logical tab order through forms and navigation
- Skip-to-content link

**Semantic Structure:**
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA labels for icon-only buttons
- Role attributes for dynamic content regions

**Form Accessibility:**
- Labels associated with inputs (htmlFor)
- Required field indicators
- Error announcements via aria-live
- Autocomplete attributes where applicable

## Images & Media

**Logo Placement:**
- Sidebar header (120x40px approximately)
- Mobile navigation (32x32px icon version)
- Emergency-themed badge/shield aesthetic

**Empty States:**
- Illustration or icon-based empty state for: No servers, no applications, no channels
- Centered layout with helpful text and call-to-action

**No hero image needed** - This is a dashboard application, not a marketing site. Focus remains on functional interface elements.