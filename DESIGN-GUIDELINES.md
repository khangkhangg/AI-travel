# Wanderlust Design Guidelines

A comprehensive design system for the AI Travel Planning platform, inspired by modern service app aesthetics with premium glassmorphism accents.

---

## Design Philosophy

**Core Principles:**
- **Approachable Premium** - Feels high-end without being intimidating
- **Mobile-First** - Designed for thumb-friendly mobile interactions first
- **Clear Hierarchy** - Important actions are always visible and obvious
- **Delightful Details** - Subtle animations and effects reward interaction

---

## Color System

### Primary Palette - Deep Teal

| Token | Value | Usage |
|-------|-------|-------|
| `--teal-deep` | `#0d4a4a` | Primary headers, hero backgrounds |
| `--teal-primary` | `#147373` | Primary buttons, links, accents |
| `--teal-light` | `#1a8a8a` | Hover states, gradients |
| `--teal-surface` | `#e8f5f5` | Light backgrounds, icon containers |

```css
/* Hero gradient */
background: linear-gradient(135deg, var(--teal-deep) 0%, var(--teal-primary) 50%, var(--teal-light) 100%);
```

### Accent Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--amber-accent` | `#f5a623` | CTAs, highlights, badges |
| `--cream` | `#faf8f5` | Page background |
| `--cream-dark` | `#f0ede8` | Card backgrounds, dividers |

### Category Colors

Each trip category has its own color for instant recognition:

| Category | Background | Text |
|----------|------------|------|
| Beach & Island | `bg-cyan-50` | `text-cyan-600` |
| Adventure | `bg-amber-50` | `text-amber-600` |
| Food Tours | `bg-rose-50` | `text-rose-600` |
| Culture | `bg-violet-50` | `text-violet-600` |
| City Break | `bg-slate-50` | `text-slate-600` |
| Camping | `bg-emerald-50` | `text-emerald-600` |
| Cruises | `bg-blue-50` | `text-blue-600` |
| Wellness | `bg-pink-50` | `text-pink-600` |

### Glassmorphism Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-white` | `rgba(255, 255, 255, 0.85)` | Glass panel backgrounds |
| `--glass-border` | `rgba(255, 255, 255, 0.3)` | Glass borders |
| `--iridescent-1` | `rgba(167, 139, 250, 0.3)` | Iridescent gradient |
| `--iridescent-2` | `rgba(129, 140, 248, 0.3)` | Iridescent gradient |
| `--iridescent-3` | `rgba(236, 72, 153, 0.2)` | Iridescent gradient |
| `--iridescent-4` | `rgba(59, 130, 246, 0.2)` | Iridescent gradient |

---

## Typography

### Font Families

| Type | Font | Weight | Usage |
|------|------|--------|-------|
| **Display** | Fraunces | 600-700 | H1, H2, hero text |
| **Body** | DM Sans | 400-700 | Everything else |

```css
/* Headings */
font-family: 'Fraunces', Georgia, serif;
font-weight: 600;
line-height: 1.2;

/* Body */
font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
font-weight: 400;
line-height: 1.6;
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Hero H1 | `3rem - 5rem` | 700 | 1.1 |
| Section H2 | `1.125rem` | 700 | 1.2 |
| Card Title | `1rem` | 600 | 1.3 |
| Body | `1rem` | 400 | 1.6 |
| Caption | `0.875rem` | 500 | 1.4 |
| Small | `0.75rem` | 400 | 1.4 |

---

## Spacing

Use Tailwind's spacing scale consistently:

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight inline elements |
| `gap-2` | 8px | Icon + text pairs |
| `gap-3` | 12px | Related items |
| `gap-4` | 16px | Card grids, list items |
| `gap-6` | 24px | Section headers |
| `gap-8` | 32px | Major sections |

### Container Widths

```css
max-w-6xl   /* Main content container: 1152px */
max-w-4xl   /* Narrow content: 896px */
max-w-3xl   /* Forms, search: 768px */
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | 8px | Small buttons, inputs |
| `rounded-xl` | 12px | Buttons, cards |
| `rounded-2xl` | 16px | Large cards, panels |
| `rounded-3xl` | 24px | Hero sections, modals |
| `rounded-full` | 9999px | Pills, avatars, FABs |

### Hero Section Curve

```css
.hero-teal {
  border-radius: 0 0 40px 40px;
}
```

---

## Shadows

| Level | Shadow | Usage |
|-------|--------|-------|
| **Subtle** | `shadow-sm` | Resting cards |
| **Default** | `shadow-md` | Elevated cards |
| **Hover** | `shadow-xl` | Hovered elements |
| **Modal** | `shadow-2xl` | Overlays, popovers |

### Colored Shadows

```css
/* Teal glow */
shadow-lg shadow-teal-200

/* Amber accent glow */
shadow-lg shadow-amber-200
```

---

## Components

### Category Card

```jsx
<button className="category-card group">
  <div className="icon-wrapper bg-cyan-50">
    <Icon className="w-6 h-6 text-cyan-600" />
  </div>
  <div className="flex-1 text-left">
    <p className="font-semibold text-gray-900">Category Name</p>
    <p className="text-xs text-gray-500">Description</p>
  </div>
  <ChevronRight className="w-5 h-5 text-gray-300" />
</button>
```

**Specs:**
- Padding: `16px 20px`
- Border radius: `16px`
- Icon container: `48px × 48px`, `14px` radius
- Hover: lift `-2px`, shadow increase

### Destination Card

```jsx
<div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl">
  {/* Image: 40% height */}
  <div className="h-40 bg-gradient-to-br from-teal-100 to-teal-200">
    {/* Tag: top-left */}
    {/* Heart: top-right */}
  </div>
  {/* Content: 60% */}
  <div className="p-4">
    {/* Title + Location */}
    {/* Rating + Reviews */}
    {/* Price + CTA */}
  </div>
</div>
```

### Glass Button (CTA)

```jsx
<button className="glass-button inline-flex items-center gap-4 px-8 py-4">
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-pink-100">
    <Sparkles className="w-5 h-5 text-violet-600" />
  </div>
  <span className="text-lg font-semibold">Start Planning</span>
  <ArrowRight className="w-5 h-5" />
</button>
```

**Specs:**
- Border radius: `100px` (pill)
- Padding: `16px 32px`
- Animated iridescent border (6s cycle)
- Hover: lift `-2px`, glow effect

### Search Bar

```jsx
<div className="relative flex items-center">
  <Search className="absolute left-5 w-5 h-5 text-gray-400" />
  <input
    className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl shadow-lg"
    placeholder="Search for a destination..."
  />
</div>
```

---

## Animations

### Stagger Delays

```css
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }
.stagger-5 { animation-delay: 0.25s; }
```

### Float Animation

```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### Iridescent Border

```css
@keyframes iridescent-shift {
  0% { background-position: 0% 50%; filter: hue-rotate(0deg); }
  50% { background-position: 100% 50%; filter: hue-rotate(15deg); }
  100% { background-position: 0% 50%; filter: hue-rotate(0deg); }
}
```

### Hover Transitions

```css
/* Standard hover lift */
transition: all 0.2s ease;
&:hover {
  transform: translateY(-2px);
  box-shadow: /* elevated shadow */;
}
```

---

## Layout Patterns

### Desktop: Content + Sidebar

```
┌─────────────────────────────────────────────────┐
│ Header (transparent on hero)                     │
├────────────────────────────────┬────────────────┤
│                                │                │
│  Main Content (flex-1)         │  Chat Panel    │
│  - Hero Section                │  (380-460px)   │
│  - Categories                  │  sticky        │
│  - Destinations                │                │
│  - CTA                         │                │
│  - Footer                      │                │
│                                │                │
└────────────────────────────────┴────────────────┘
```

### Mobile: Full Width + Bottom Nav

```
┌─────────────────────┐
│ Hero + Search       │
├─────────────────────┤
│ Categories (2 col)  │
├─────────────────────┤
│ Destinations        │
│ (horizontal scroll) │
├─────────────────────┤
│ CTA                 │
├─────────────────────┤
│ Footer              │
├─────────────────────┤
│ ▣ Home │ Trips │ Chat │ Profile │
└─────────────────────┘
```

### Section Headers

```jsx
<div className="flex items-center justify-between mb-6">
  <h2 className="section-heading">Section Title</h2>
  <button className="section-link group">
    View all
    <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
  </button>
</div>
```

---

## Accessibility

### Focus States

```css
focus:outline-none focus:ring-2 focus:ring-teal-400/50
```

### Color Contrast

- Body text on cream: `text-gray-900` (AAA)
- Muted text: `text-gray-600` (AA)
- Links: `text-teal-700` (AA)
- White on teal hero: `text-white` (AAA)

### Touch Targets

- Minimum: `44px × 44px`
- Mobile nav buttons: `48px × 48px`
- Category cards: Full width on mobile

---

## Icon Usage

**Library:** Lucide React (https://lucide.dev)

**Important:** Never use emojis in the UI. Always use Lucide React icons for visual consistency, scalability, and proper color inheritance.

| Context | Size | Color |
|---------|------|-------|
| Navigation | `w-4 h-4` | `text-white/80` or `text-gray-600` |
| Category icons | `w-6 h-6` | Category color |
| Card actions | `w-4 h-4` | `text-gray-400` hover `text-teal-600` |
| Hero decorative | `w-5 h-5` | `text-white` |
| Inline with text | `w-4 h-4` | Inherit from parent |

---

## Do's and Don'ts

### Do
- Use the teal gradient for primary hero sections
- Apply category colors consistently
- Add hover lift effects to interactive cards
- Use glassmorphism sparingly for premium CTAs
- Maintain generous whitespace

### Don't
- Mix teal with other saturated colors (use neutrals)
- Overuse glassmorphism effects
- Skip stagger animations on lists
- Use sharp corners (always round)
- Forget mobile bottom nav spacing
- Use emojis in the UI — always use Lucide React icons instead for consistency and scalability

---

## File Reference

| File | Purpose |
|------|---------|
| `app/globals.css` | CSS variables, animations, utility classes |
| `components/landing/HeroSection.tsx` | Hero with search |
| `components/landing/TripCategories.tsx` | Category cards |
| `components/landing/PopularDestinations.tsx` | Destination gallery |
| `components/landing/GlassCTA.tsx` | Glassmorphism CTA |

---

## Responsive Breakpoints

### Breakpoint Scale

| Token | Value | Target Devices |
|-------|-------|----------------|
| `sm` | `640px` | Large phones (landscape) |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Small laptops, tablets (landscape) |
| `xl` | `1280px` | Desktops |
| `2xl` | `1536px` | Large desktops |

### Mobile-First Approach

Always write styles mobile-first, then add responsive overrides:

```jsx
// ✅ Correct: Mobile-first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// ❌ Avoid: Desktop-first
<div className="grid grid-cols-4 md:grid-cols-2 sm:grid-cols-1">
```

### Common Responsive Patterns

```jsx
// Text sizing
<h1 className="text-3xl sm:text-4xl lg:text-5xl">

// Padding
<section className="px-4 sm:px-6 lg:px-8">

// Grid columns
<div className="grid grid-cols-2 lg:grid-cols-4">

// Show/hide
<nav className="hidden lg:flex">
<button className="lg:hidden">
```

### Breakpoint Behavior

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Navigation | Hamburger menu | Hamburger menu | Inline links |
| Categories | 2 columns | 2 columns | 4 columns |
| Destinations | Horizontal scroll | 2 columns | 3 columns |
| Chat Panel | Bottom sheet overlay | Bottom sheet | Fixed sidebar |
| Bottom Nav | Visible | Visible | Hidden |

---

## Grid System

### Column Grid

```jsx
// 12-column conceptual grid using Tailwind
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 lg:col-span-8">Main content</div>
  <div className="col-span-12 lg:col-span-4">Sidebar</div>
</div>
```

### Common Grid Layouts

```jsx
// Equal columns
<div className="grid grid-cols-2 gap-4">        // 2 equal
<div className="grid grid-cols-3 gap-4">        // 3 equal
<div className="grid grid-cols-4 gap-4">        // 4 equal

// Auto-fit responsive
<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
```

### Gutter Sizes

| Context | Gap | Usage |
|---------|-----|-------|
| Card grids | `gap-4` (16px) | Destination cards, categories |
| Form fields | `gap-3` (12px) | Label + input groups |
| Inline items | `gap-2` (8px) | Icon + text, tags |
| Sections | `gap-8` (32px) | Between major sections |

---

## Z-Index Scale

### Layer System

| Token | Value | Usage |
|-------|-------|-------|
| `z-0` | 0 | Base layer, backgrounds |
| `z-10` | 10 | Elevated cards, sticky elements |
| `z-20` | 20 | Dropdowns, popovers |
| `z-30` | 30 | Fixed header |
| `z-40` | 40 | Mobile bottom nav |
| `z-50` | 50 | Modals, overlays, chat panel |
| `z-[60]` | 60 | Toast notifications |
| `z-[100]` | 100 | Critical alerts, loading overlays |

### Layer Diagram

```
┌─────────────────────────────────────┐ z-[100] Critical overlays
│  ┌─────────────────────────────┐    │ z-[60]  Toasts
│  │  ┌─────────────────────┐    │    │ z-50    Modals/Chat
│  │  │  ┌───────────────┐  │    │    │ z-40    Bottom nav
│  │  │  │  ┌─────────┐  │  │    │    │ z-30    Header
│  │  │  │  │ Content │  │  │    │    │ z-20    Dropdowns
│  │  │  │  └─────────┘  │  │    │    │ z-10    Cards
│  │  │  └───────────────┘  │    │    │ z-0     Base
│  │  └─────────────────────┘    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Button Hierarchy

### Button Variants

| Variant | Class | Usage |
|---------|-------|-------|
| **Primary** | `bg-gradient-to-r from-teal-600 to-teal-700 text-white` | Main CTAs, form submissions |
| **Secondary** | `bg-white border border-gray-200 text-gray-700` | Secondary actions |
| **Ghost** | `bg-transparent hover:bg-gray-100 text-gray-600` | Tertiary actions |
| **Accent** | `bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900` | Promotional CTAs |
| **Destructive** | `bg-red-600 text-white` | Delete, cancel (use sparingly) |
| **Glass** | `glass-button` | Premium CTAs only |

### Button Sizes

| Size | Padding | Font | Min Height |
|------|---------|------|------------|
| **Small** | `px-3 py-1.5` | `text-sm` | 32px |
| **Medium** | `px-4 py-2.5` | `text-sm` | 40px |
| **Large** | `px-6 py-3` | `text-base` | 48px |
| **XL** | `px-8 py-4` | `text-lg` | 56px |

### Button States

```jsx
// Primary button with all states
<button className="
  px-4 py-2.5 rounded-xl font-semibold text-sm
  bg-gradient-to-r from-teal-600 to-teal-700 text-white
  hover:from-teal-700 hover:to-teal-800
  active:scale-[0.98]
  disabled:opacity-50 disabled:cursor-not-allowed
  focus:outline-none focus:ring-2 focus:ring-teal-400/50
  transition-all
">
  Button Text
</button>
```

### Icon Buttons

```jsx
// Icon-only button
<button className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
  <Icon className="w-5 h-5 text-gray-600" />
</button>

// Icon + text
<button className="flex items-center gap-2 px-4 py-2.5">
  <Icon className="w-4 h-4" />
  <span>Label</span>
</button>
```

---

## Loading States

### Skeleton Screens

Use skeleton placeholders that match the shape of content:

```jsx
// Skeleton card
<div className="animate-pulse">
  <div className="h-40 bg-gray-200 rounded-t-2xl" />
  <div className="p-4 space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4" />
    <div className="h-3 bg-gray-200 rounded w-1/2" />
    <div className="h-3 bg-gray-200 rounded w-1/4" />
  </div>
</div>
```

### Shimmer Effect

```css
.animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--teal-surface) 25%,
    #d1f5f5 50%,
    var(--teal-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Spinner

```jsx
// Simple spinner
<div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />

// Button loading state
<button disabled className="flex items-center gap-2">
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  <span>Loading...</span>
</button>
```

### Loading Guidelines

| Context | Pattern | Duration |
|---------|---------|----------|
| Page load | Skeleton screen | Until content loads |
| Button action | Inline spinner | Until action completes |
| List loading | Skeleton rows | Until items load |
| Image loading | Blur placeholder | Until image loads |
| Infinite scroll | Spinner at bottom | Until next page loads |

---

## Empty States

### Empty State Structure

```jsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  {/* Illustration or icon */}
  <div className="w-24 h-24 mb-6 rounded-full bg-teal-50 flex items-center justify-center">
    <Icon className="w-12 h-12 text-teal-300" />
  </div>

  {/* Title */}
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    No trips yet
  </h3>

  {/* Description */}
  <p className="text-gray-500 mb-6 max-w-sm">
    Start planning your first adventure and it will appear here.
  </p>

  {/* Action */}
  <button className="px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold">
    Plan Your First Trip
  </button>
</div>
```

### Empty State Types

| Type | Icon/Illustration | Title | Action |
|------|-------------------|-------|--------|
| No results | Search icon | "No destinations found" | Adjust filters |
| Empty list | Folder icon | "No trips yet" | Create first item |
| No favorites | Heart icon | "No favorites saved" | Browse destinations |
| No messages | Chat icon | "No messages yet" | Start conversation |

---

## Error States

### Error Message Styles

```jsx
// Inline field error
<div className="mt-1.5 flex items-center gap-1.5 text-red-600">
  <AlertCircle className="w-4 h-4" />
  <span className="text-sm">Please enter a valid email</span>
</div>

// Error card
<div className="p-4 rounded-xl bg-red-50 border border-red-200">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-medium text-red-800">Something went wrong</p>
      <p className="text-sm text-red-600 mt-1">Please try again or contact support.</p>
    </div>
  </div>
</div>
```

### Error Page (404, 500)

```jsx
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
    <div className="text-8xl mb-4">🗺️</div>
    <h1 className="text-4xl font-bold text-gray-900 mb-2">Page not found</h1>
    <p className="text-gray-500 mb-8">Looks like you've wandered off the map.</p>
    <button className="px-6 py-3 bg-teal-600 text-white rounded-xl">
      Back to Home
    </button>
  </div>
</div>
```

---

## Feedback Messages

### Toast Notifications

| Type | Colors | Icon | Duration |
|------|--------|------|----------|
| **Success** | `bg-emerald-50 border-emerald-200 text-emerald-800` | CheckCircle | 3s |
| **Error** | `bg-red-50 border-red-200 text-red-800` | XCircle | 5s (or manual) |
| **Warning** | `bg-amber-50 border-amber-200 text-amber-800` | AlertTriangle | 4s |
| **Info** | `bg-blue-50 border-blue-200 text-blue-800` | Info | 3s |

### Toast Structure

```jsx
<div className="fixed bottom-6 right-6 z-[60]">
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-lg">
    <CheckCircle className="w-5 h-5 text-emerald-600" />
    <span className="text-emerald-800 font-medium">Trip saved successfully</span>
    <button className="ml-2 text-emerald-600 hover:text-emerald-800">
      <X className="w-4 h-4" />
    </button>
  </div>
</div>
```

### Inline Alerts

```jsx
// Info banner
<div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
  <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
  <div>
    <p className="text-blue-800">Pro tip: Add your preferences for better recommendations.</p>
  </div>
</div>
```

---

## Form Design

### Input Fields

```jsx
// Standard input
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700">
    Email address
  </label>
  <input
    type="email"
    className="
      w-full px-4 py-3 rounded-xl border border-gray-200
      focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400
      placeholder-gray-400
      transition-colors
    "
    placeholder="you@example.com"
  />
</div>

// With error
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700">Email</label>
  <input
    className="w-full px-4 py-3 rounded-xl border border-red-300 focus:ring-red-400/50"
  />
  <p className="text-sm text-red-600 flex items-center gap-1">
    <AlertCircle className="w-4 h-4" />
    Invalid email format
  </p>
</div>
```

### Input Sizes

| Size | Padding | Font | Height |
|------|---------|------|--------|
| **Small** | `px-3 py-2` | `text-sm` | 36px |
| **Medium** | `px-4 py-3` | `text-base` | 48px |
| **Large** | `px-5 py-4` | `text-lg` | 56px |

### Select / Dropdown

```jsx
<div className="relative">
  <select className="
    w-full px-4 py-3 rounded-xl border border-gray-200
    appearance-none bg-white pr-10
    focus:outline-none focus:ring-2 focus:ring-teal-400/50
  ">
    <option>Select an option</option>
  </select>
  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
</div>
```

### Checkbox & Radio

```jsx
// Checkbox
<label className="flex items-center gap-3 cursor-pointer">
  <input
    type="checkbox"
    className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-400/50"
  />
  <span className="text-gray-700">I agree to the terms</span>
</label>
```

### Form Layout

```jsx
// Vertical stack (default)
<form className="space-y-4">
  <Input label="Name" />
  <Input label="Email" />
  <Button>Submit</Button>
</form>

// Inline fields
<div className="flex gap-4">
  <Input label="First name" className="flex-1" />
  <Input label="Last name" className="flex-1" />
</div>
```

---

## Motion Principles

### When to Animate

| Animate | Don't Animate |
|---------|---------------|
| State changes (hover, focus) | Purely decorative motion |
| Content entering/leaving | Motion that blocks interaction |
| Drawing attention to updates | Excessive bouncing/pulsing |
| Micro-interactions | Motion without purpose |
| Page transitions | Motion during critical tasks |

### Duration Guidelines

| Type | Duration | Easing |
|------|----------|--------|
| **Micro** (hover, focus) | 150-200ms | `ease-out` |
| **Standard** (modals, dropdowns) | 200-300ms | `ease-out` |
| **Complex** (page transitions) | 300-500ms | `ease-in-out` |
| **Decorative** (float, pulse) | 2000-4000ms | `ease-in-out` |

### Easing Functions

```css
/* Quick response */
transition-timing-function: ease-out;

/* Smooth movement */
transition-timing-function: ease-in-out;

/* Bouncy effect */
transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Voice & Tone

### Microcopy Guidelines

| Context | Tone | Example |
|---------|------|---------|
| **CTAs** | Action-oriented, enthusiastic | "Start Planning", "Explore Now" |
| **Empty states** | Encouraging, helpful | "No trips yet — let's change that!" |
| **Errors** | Apologetic, solution-focused | "Something went wrong. Please try again." |
| **Success** | Celebratory, brief | "Trip saved!" |
| **Loading** | Patient, informative | "Finding the best destinations..." |

### Button Labels

| Do | Don't |
|----|-------|
| "Save Trip" | "Submit" |
| "Plan My Adventure" | "Continue" |
| "View Details" | "Click Here" |
| "Try Again" | "Retry" |

### Error Messages

| Do | Don't |
|----|-------|
| "Please enter a valid email" | "Invalid input" |
| "We couldn't save your trip. Please try again." | "Error 500" |
| "This destination isn't available right now" | "Not found" |

### Placeholder Text

```jsx
// Search
placeholder="Search destinations, activities, or regions..."

// Date
placeholder="When are you traveling?"

// Travelers
placeholder="How many travelers?"
```

---

## Image Guidelines

### Aspect Ratios

| Usage | Ratio | Example Sizes |
|-------|-------|---------------|
| Hero banner | 16:9 | 1920×1080, 1280×720 |
| Destination card | 4:3 | 400×300, 320×240 |
| Thumbnail | 1:1 | 80×80, 120×120 |
| Avatar | 1:1 | 40×40, 48×48 |
| Gallery | 3:2 | 600×400 |

### Placeholder Strategy

```jsx
// Gradient placeholder
<div className="bg-gradient-to-br from-teal-100 to-teal-200" />

// Blur-up technique
<img
  src={lowResUrl}
  className="blur-sm transition-all duration-300"
  onLoad={(e) => {
    e.target.src = highResUrl;
    e.target.classList.remove('blur-sm');
  }}
/>
```

### Lazy Loading

```jsx
<img
  src={url}
  loading="lazy"
  decoding="async"
  alt="Descriptive alt text"
/>
```

### Image Optimization

- Use WebP format with JPEG fallback
- Serve responsive sizes via `srcset`
- Maximum file size: 200KB for cards, 500KB for heroes
- Always include meaningful `alt` text
