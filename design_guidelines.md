# CipherH Dashboard - Design Guidelines

## Design Approach: Cyberpunk-Inspired Control Panel

**Primary Direction**: Dark, futuristic tech aesthetic with neon cyan/purple accents, inspired by cyberpunk interfaces (Cyberpunk 2077 UI, hacker terminals) combined with modern dashboard patterns from Linear and Grafana for data organization.

**Core Principle**: Create a high-tech control center that feels like monitoring an AI consciousness - sophisticated data visualization with dramatic visual impact.

---

## Typography

**Font Stack**:
- **Primary**: "Space Grotesk" (Google Fonts) - tech-forward, geometric sans-serif for UI elements
- **Monospace**: "JetBrains Mono" (Google Fonts) - for metrics, code snippets, timestamps

**Hierarchy**:
- Dashboard Title: Space Grotesk 700, 2.5rem (40px)
- Section Headers: Space Grotesk 600, 1.5rem (24px)
- Card Titles: Space Grotesk 500, 1.125rem (18px)
- Metric Values: JetBrains Mono 600, 2rem (32px) for large numbers, 1.25rem (20px) for secondary
- Body Text: Space Grotesk 400, 0.875rem (14px)
- Labels/Captions: Space Grotesk 500, 0.75rem (12px), uppercase with letter-spacing

---

## Color System

**Background Foundation**:
- Primary BG: `#0a0e1a` (deep dark blue-black)
- Secondary BG: `#121828` (slightly lighter panels)
- Card BG: `#1a1f35` with subtle border glow

**Neon Accents**:
- Cyan Primary: `#00ffff` (electric cyan for active states, progress)
- Purple Primary: `#a855f7` (vibrant purple for alerts, highlights)
- Cyan Glow: `rgba(0, 255, 255, 0.3)` for glowing effects
- Purple Glow: `rgba(168, 85, 247, 0.3)` for secondary glows

**Status Colors**:
- Success/Active: `#00ff88` (neon green)
- Warning: `#ffd700` (golden yellow)
- Error/Critical: `#ff3366` (hot pink-red)
- Inactive: `#4b5563` (muted gray)

**Text Colors**:
- Primary: `#e5e7eb` (near-white)
- Secondary: `#9ca3af` (medium gray)
- Muted: `#6b7280` (dark gray)

---

## Spacing System

**Tailwind Units**: 2, 3, 4, 6, 8, 12, 16
- Tight spacing: `p-2`, `gap-3`
- Standard card padding: `p-6`
- Section spacing: `py-8`, `py-12`
- Large gaps: `gap-6`, `gap-8` for grid layouts

---

## Layout Structure

**Main Dashboard**:
- Full-width layout with fixed sidebar navigation (w-64)
- Main content area with max-w-7xl container
- Grid-based metric cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Responsive breakpoints prioritize data visibility

**Grid Patterns**:
- Metric Cards: 4-column on desktop, 2-column tablet, 1-column mobile
- Large Visualization Panels: 2-column split for graphs/charts
- Status Lists: Single column, full-width for clarity

---

## Core Components

### 1. Metric Cards
- Dark background with subtle cyan/purple border glow effect
- Card header with icon (Heroicons - use solid variants for filled look)
- Large metric value in JetBrains Mono with color-coded indicators
- Trend indicator (↑↓) with percentage change
- Mini sparkline chart at bottom (optional visualization)
- Hover state: intensified glow effect

### 2. Status Panel
- Real-time cycle counter with animated pulse effect
- System health badges: pill-shaped with neon borders
- Confidence level as circular progress indicator
- Anomaly score with gradient fill bar
- Last update timestamp in monospace

### 3. Live Activity Feed
- Scrollable timeline of recent events
- Each entry: timestamp + icon + description
- Color-coded by event type (success=cyan, warning=yellow, error=pink)
- Smooth auto-scroll for new entries
- Subtle background gradient on hover

### 4. Data Visualization Panels
- Line charts for historical trends (use Chart.js or Recharts)
- Neon cyan/purple gradient fills under curves
- Grid lines in subtle gray (`#1e293b`)
- Glowing data points on hover
- Dark background with no axis clutter

### 5. Navigation Sidebar
- Fixed left sidebar with tech-themed icons
- Active state: cyan left border + cyan icon
- Section dividers with horizontal neon lines
- System logo at top with subtle glow animation
- Collapse/expand toggle for mobile

### 6. Header Controls
- Top bar with refresh button, time range selector, alert toggle
- Search input with cyan focus ring
- User profile badge with online indicator (green dot with pulse)
- Export/settings icons aligned right

### 7. Alert Banners
- Critical alerts: full-width banner, pink-red background with pulsing border
- Warnings: yellow-orange left border accent
- Info notifications: cyan subtle background
- Dismissible with X icon

---

## Visual Effects

**Glow Effects**:
- Box shadows with neon colors: `shadow-[0_0_20px_rgba(0,255,255,0.3)]`
- Apply to active cards, borders, and metric values
- Subtle pulse animation on live status indicators

**Borders**:
- Thin borders (1px) with gradient overlays
- Corner accent marks (L-shaped corners) for tech aesthetic
- Glowing borders on hover/active states

**Animations**: Minimal, purposeful
- Metric value count-up on load
- Pulse effect on live indicators (2s duration, infinite)
- Smooth fade-in for new data entries
- Hover glow transitions (300ms ease)

---

## Icons

**Library**: Heroicons (solid variants via CDN)
- Use tech-appropriate icons: cpu, server, chart-bar, lightning-bolt, shield-check
- Size: `w-6 h-6` for cards, `w-5 h-5` for sidebar, `w-4 h-4` for inline

---

## Images

**Hero Background** (if login/landing needed):
- Abstract digital/neural network visualization with cyan-purple gradient overlay
- Particle effects or circuit board patterns in background
- Keep blur effect behind login form

**Dashboard Background**:
- Subtle tech texture or grid pattern overlay (10% opacity)
- Animated gradient shift (very slow, 30s+ duration)

---

## Accessibility

- Maintain 4.5:1 contrast for all text on dark backgrounds
- Focus states with cyan outline (2px solid)
- Keyboard navigation with visible indicators
- ARIA labels for all interactive metrics and controls
- Monospace font ensures readability for numeric data

---

**Final Note**: This dashboard prioritizes dramatic visual impact while maintaining data clarity. The cyberpunk aesthetic creates an immersive monitoring experience—every element should feel like interfacing with an advanced AI system's control center.