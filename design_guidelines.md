# Design Guidelines: Compañera Digital de Cuidado

## Design Approach

**Selected Framework**: Material Design 3 with Healthcare-Focused Customization

This healthcare companion app requires the reliability of a proven design system while maintaining warmth and emotional connection. Material Design 3 provides excellent accessibility, familiar patterns for diverse users, and flexibility for personalization - essential for both medical professionals and patients.

---

## Core Design Principles

1. **Empatía Visual**: Every interaction should feel supportive, never judgmental
2. **Claridad Terapéutica**: Information hierarchy that reduces cognitive load for patients in care
3. **Progreso Visible**: Constant visual reinforcement of advancement and achievement
4. **Calidez Profesional**: Balance medical credibility with human warmth

---

## Color Palette

### Primary Colors (Light Mode)
- **Primary Brand**: 155 65% 48% (Teal/healing green - represents growth and care)
- **Primary Container**: 155 65% 92%
- **On Primary**: 0 0% 100%

### Primary Colors (Dark Mode)
- **Primary Brand**: 155 50% 65%
- **Primary Container**: 155 45% 25%
- **On Primary**: 155 10% 10%

### Accent & Support
- **Success/Achievement**: 142 71% 45% (vibrant green for completed tasks)
- **Encouragement**: 24 95% 65% (warm coral for motivational elements)
- **Warning/Missed**: 38 92% 50% (gentle amber, never harsh red)
- **Neutral Progress**: 220 15% 50%

### Surface Colors
- **Light Surface**: 155 15% 98%
- **Dark Surface**: 155 10% 12%
- **Cards/Elevated**: White with subtle teal tint in light mode

---

## Typography

**Font Families** (via Google Fonts CDN):
- **Display/Headings**: 'Poppins' - Modern, friendly, highly legible
- **Body/UI**: 'Inter' - Professional, optimized for screens
- **Data/Metrics**: 'Poppins' with tabular numbers

**Type Scale**:
- **Hero Message**: text-4xl md:text-5xl font-bold (Daily motivational)
- **Section Headers**: text-2xl md:text-3xl font-semibold
- **Card Titles**: text-lg font-semibold
- **Body**: text-base leading-relaxed
- **Captions/Metadata**: text-sm text-slate-500 dark:text-slate-400

---

## Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 20
- **Component Internal**: p-4, gap-4, space-y-4
- **Section Padding**: py-12 md:py-16 lg:py-20
- **Card Spacing**: p-6 md:p-8
- **Page Margins**: px-4 md:px-6 lg:px-8

**Container Strategy**:
- **Max Width**: max-w-7xl for dashboard layouts
- **Content Width**: max-w-4xl for reading content
- **Form Width**: max-w-md for input forms

**Grid Patterns**:
- **Retos/Challenges**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- **Stats Cards**: grid-cols-2 md:grid-cols-4
- **Dual Pathway**: grid-cols-1 lg:grid-cols-2 (side-by-side on desktop)

---

## Component Library

### Navigation
- **Top Navigation Bar**: Sticky header with logo, user role indicator, profile menu
- **Role Switcher** (for nurses): Subtle toggle showing current mode (Enfermero/Paciente view)
- **Bottom Navigation** (mobile): Fixed nav with icons for Inicio, Retos, Progreso, Perfil

### Cards & Containers
- **Daily Challenge Card**: Elevated card with gradient background (primary to primary-container), large touch target for completion
- **Progress Cards**: Clean white/dark cards with visual progress indicators (bars, rings, charts)
- **Achievement Cards**: Celebratory design with badge icons, subtle animations on unlock
- **Info Cards**: Rounded-lg borders, subtle shadows, hover lift effect

### Progress Visualizations
- **Daily Progress Bar**: Thick (h-4), rounded-full, animated fill with gradient
- **Consistency Calendar**: Grid of rounded squares, green (completed), gray (pending), amber (missed but empathetic)
- **Dual Pathway Tracks**: Parallel vertical timelines with connecting nodes, differentiated by color (patient=teal, support=coral)
- **Points Counter**: Large, prominent number with animated increment, badge-style background

### Forms & Inputs
- **Challenge Input (Nurses)**: Large textarea with character count, tag selector for categories
- **Completion Button**: Full-width on mobile, prominent with icon, immediate visual feedback
- **Patient Selector**: Searchable dropdown with avatar and status indicators

### Feedback Elements
- **Motivational Messages**: Card with gradient background, icon, large typography
- **Empathy Messages** (on skip): Soft background, supportive icon, gentle animation
- **Achievement Toasts**: Slide-in from top-right, auto-dismiss, celebratory colors
- **Empty States**: Illustration + encouraging text, never punitive

### Data Display
- **Stats Dashboard**: Grid of metric cards with icons, numbers, and trend indicators
- **History Timeline**: Vertical timeline with dates, icons for events, expandable details
- **Badge Gallery**: Grid of unlocked/locked badges with tooltips

---

## Images & Visual Assets

**Hero Section** (Bienvenida Screen):
- Large hero image showing caring hands or supportive healthcare imagery
- Gradient overlay (teal to transparent) for text legibility
- Positioning: background cover, center
- Image description: "Warm, professional healthcare setting with emphasis on human connection and support"

**Icon Library**: Heroicons (via CDN)
- Challenge icons: CheckCircle, Trophy, Heart, Star
- Navigation: Home, ListBullet, ChartBar, User
- Actions: Plus, Check, XMark, ArrowPath

**Illustrations** (for empty/success states):
- Use unDraw or similar for consistent, warm medical/care illustrations
- Color customized to match primary teal palette

---

## Interaction Patterns

**Challenge Completion Flow**:
1. Tap challenge card → Card expands with detail
2. Tap "Marcar completado" → Success animation (scale + checkmark)
3. Points increment with count-up animation
4. Confetti or subtle celebration effect
5. Next challenge reveals with slide animation

**Empathy on Skip**:
- Gentle fade-in of message
- No negative visual indicators (no red X)
- "Continuar" button to move forward without pressure

**Dual Pathway Interaction**:
- Hover on timeline node reveals detail card
- Toggle between timeline view and list view
- Visual connection lines animate when scrolling

**Nurse Dashboard**:
- Quick-add challenge floating action button
- Patient cards with real-time status updates
- Bulk actions for managing multiple patients

---

## Accessibility & Responsiveness

- **Touch Targets**: Minimum 44px for all interactive elements
- **Color Contrast**: WCAG AAA compliance for all text
- **Focus States**: Clear 2px teal outline on keyboard focus
- **Screen Reader**: Comprehensive ARIA labels in Spanish
- **Motion**: Respect prefers-reduced-motion for all animations
- **Dark Mode**: Automatic system preference detection with manual toggle

---

## Mobile-First Considerations

- **Priority Content**: Daily message and challenge always above fold
- **Swipe Gestures**: Swipe cards for quick complete/skip actions
- **Thumb Zone**: Primary actions within bottom 60% of screen
- **Progressive Disclosure**: Details hidden behind taps, not scrolling
- **Native Feel**: Bottom sheet modals, pull-to-refresh for updates