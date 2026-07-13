# UI/UX Design Brief — Visual & Interaction Design Guide
## Ittisalo — AI-Powered Omnichannel WhatsApp CRM

**Version:** 1.0  
**Date:** July 12, 2026  
**Reference:** [PRD.md](./PRD.md) · [APP_FLOW.md](./APP_FLOW.md)

---

## 1. Brand Identity

### 1.1 Product Name & Branding

| Element | Value |
|---------|-------|
| **Product Name** | Ittisalo (means "connection" in Arabic) |
| **Logo Mark** | Stylized "I" integrated with a chat bubble, crimson red gradient icon |
| **Logo File** | `/public/ittisalo-logo.svg` |
| **Logo Size** | 34×34px (sidebar), 40×40px (onboarding), 44×44px (loading) |
| **Logo Radius** | 10–13px border-radius |
| **Tagline** | "AI-Powered WhatsApp Business Dashboard" |

### 1.2 Color Palette

#### Primary Colors (Red Family — Brand Identity)

| Name | Hex | Usage |
|------|-----|-------|
| **Primary Red** | `#dc2626` | Buttons, active states, logo, accent highlights |
| **Primary Dark Red** | `#b91c1c` | Gradient endpoints, hover states |
| **Red Light** | `#fef2f2` | Card backgrounds, subtle red tints |
| **Red Border** | `rgba(220,38,38,0.08)` | Card borders, dividers |
| **Red Shadow** | `rgba(220,38,38,0.3)` | Button box-shadows |
| **Red Hover BG** | `#fff5f5` | Hover states on nav items, dropdown items |

#### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success Green** | `#10b981` | Confirmed status, positive trends |
| **Info Blue** | `#3b82f6` | Dispatched status, info badges |
| **Warning Amber** | `#f59e0b` | Pending status, warnings |
| **Purple** | `#8b5cf6` | eCommerce niche, premium features |
| **Pink** | `#ec4899` | Salon niche |
| **Cyan** | `#06b6d4` | Medical clinic niche |
| **Error Red** | `#ef4444` | Errors, cancellations |

#### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Dark** | `#111827` | Headings, primary text |
| **Body** | `#374151` | Body text |
| **Muted** | `#4b5563` | Secondary text |
| **Subtle** | `#6b7280` | Descriptions, timestamps |
| **Placeholder** | `#9ca3af` | Inactive states, placeholders |
| **Divider** | `#e5e7eb` | Borders, separators |
| **BG Light** | `#faf9f9` | Main content background |
| **BG Card** | `#ffffff` | Card backgrounds |

#### Channel Colors

| Channel | Hex | Usage |
|---------|-----|-------|
| WhatsApp | `#25D366` | Channel badges, pie chart |
| Instagram | `#e1306c` | Channel badges, pie chart |
| Messenger | `#0084ff` | Channel badges, pie chart |

### 1.3 Typography

| Element | Font | Size | Weight | Letter Spacing |
|---------|------|------|--------|----------------|
| **Primary Font** | Inter (Google Fonts) | — | — | — |
| **H1 / Page Title** | Inter | 28px | 900 (Black) | -0.7px |
| **H2 / Section Title** | Inter | 15–20px | 800 (ExtraBold) | -0.3px |
| **Body Text** | Inter | 13–14px | 500 | 0 |
| **Stat Value** | Inter | 28px | 900 | -0.5px |
| **Stat Label** | Inter | 11px | 700 | 0.09em (uppercase) |
| **Nav Label** | Inter | 12px | 500–700 | 0 |
| **Badge / Tag** | Inter | 10–12px | 700 | 0 |
| **Button** | Inter | 13–15px | 600–700 | 0 |

---

## 2. Layout System

### 2.1 Page Shell Structure

```
┌──────────────────────────────────────────────────────────────┐
│  TopBanner (38px, sticky, z-index: 50)                       │
├─────┬────────────────────────────────────────────────────────┤
│     │  Header (60px, sticky, z-index: 40)                    │
│     │  [Niche Badge]  Ittisalo Studio  ...  [Profile ▼]     │
│  S  ├────────────────────────────────────────────────────────┤
│  i  │                                                        │
│  d  │  Main Content Area                                     │
│  e  │  padding: 24px                                         │
│  b  │  background: #faf9f9                                   │
│  a  │                                                        │
│  r  │  ┌──────────────┐  ┌──────────────┐                   │
│     │  │  Stat Card    │  │  Stat Card    │                   │
│  64 │  └──────────────┘  └──────────────┘                   │
│  px │                                                        │
│     │  ┌─────────────────────────────────┐                   │
│     │  │  Section Card                    │                   │
│     │  └─────────────────────────────────┘                   │
├─────┴────────────────────────────────────────────────────────┤
│  Mobile Bottom Nav (56px, fixed bottom, md:hidden)           │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Responsive Breakpoints

| Breakpoint | Sidebar | Bottom Nav | Layout |
|------------|---------|------------|--------|
| **< 768px** (Mobile) | Hidden | Visible (5 items + More) | Single column, full-width cards |
| **≥ 768px** (Desktop) | Visible (64px icon rail) | Hidden | Multi-column grids |

### 2.3 CSS Custom Properties

```css
--sidebar-w: 64px;     /* Desktop sidebar width */
```

### 2.4 Grid Layouts (Dashboard)

| Grid | Columns | Usage |
|------|---------|-------|
| Stat Cards | `repeat(4, 1fr)` | Top-level metrics |
| Main Layout | `2fr 1fr` | Left content + right sidebar |
| Niche Detail | `1fr 1fr` | Two-column section cards |
| Kanban Board | `1fr 1fr 1fr` | 3-column pipeline |
| Onboarding Grid | `repeat(3, 1fr)` | 6 niche cards |
| Mobile Menu Grid | `1fr 1fr` | Nav items in bottom sheet |

---

## 3. Component Design Specifications

### 3.1 Stat Card

```
┌───────────────────────────────────┐
│  [Icon 46×46]          [Trend ↑]  │
│                                   │
│  LABEL (11px, uppercase, gray)    │
│  VALUE (28px, black, bold)        │
│  Description (12px, gray)         │
└───────────────────────────────────┘

- Border-radius: 18px
- Padding: 24px 26px
- Border: 1px solid rgba(220,38,38,0.06)
- Shadow: 0 4px 20px rgba(0,0,0,0.02)
- Hover: translateY(-2px), shadow increase
- Icon container: 46×46px, 12px radius, colored background
- Trend badge: 12px font, green/red pill with arrow icon
```

### 3.2 Section Card

```
┌───────────────────────────────────┐
│  Title (15px, bold)    [Action]   │
│  Subtitle (12px, gray)            │
│───────────────────────────────────│
│  Content Area                     │
│                                   │
└───────────────────────────────────┘

- Border-radius: 20px
- Padding: 22px 24px
- Border: 1px solid rgba(220,38,38,0.06)
- Shadow: 0 4px 20px rgba(0,0,0,0.02)
```

### 3.3 Sidebar Nav Item (Desktop)

```
┌────────┐
│  Icon  │  40×40px, 11px radius
│ 18px   │  Active: red bg (#fef2f2), red icon, left accent bar (3×20px)
└────────┘  Hover: light red bg (#fff5f5)
            Tooltip: fixed left:72px, dark bg (#111827), 12px text
```

### 3.4 Profile Dropdown (Glassmorphism)

```
┌──────────────────────────────┐
│  Name (13.5px, bold)         │
│  Email (11px, gray)          │
├──────────────────────────────┤
│  👤  My Profile              │
│  🤖  AI Copilot Config       │
│  🔌  Connected Channels      │
│  ⚙️  System Settings         │
├──────────────────────────────┤
│  🚪  Log out (red)           │
└──────────────────────────────┘

- Width: 230px
- Background: rgba(255,255,255,0.96)
- Backdrop-filter: blur(10px)
- Border: 1px solid rgba(220,38,38,0.12)
- Shadow: 0 10px 25px rgba(220,38,38,0.15)
- Border-radius: 12px
- Item hover: #fef2f2 bg, #dc2626 text
- Animation: fadeUp 0.15s
```

### 3.5 Mobile Bottom Sheet

```
┌────────────────────────────────────┐
│          ─── (handle bar)          │
│                                    │
│  [Logo]  Ittisalo          [X]     │
│                                    │
│  ┌───────────┐  ┌───────────┐     │
│  │ 📊 Overview│  │ 💬 Chats  │     │
│  └───────────┘  └───────────┘     │
│  ┌───────────┐  ┌───────────┐     │
│  │ 👥 Contacts│  │ 🛍️ Orders │     │
│  └───────────┘  └───────────┘     │
│  ...                               │
│                                    │
│  [👑 Super Admin] (if applicable)  │
│                                    │
│  [🚪 Sign Out]                     │
└────────────────────────────────────┘

- Slides up from bottom (slideInUp 0.28s)
- Backdrop: rgba(0,0,0,0.45) + blur(4px)
- Border-radius: 20px 20px 0 0
- Handle: 40×4px centered, #e5e7eb
- Grid: 2 columns, 8px gap
- Nav items: 12px gap, 12px radius, active=red
```

### 3.6 Loading Spinner

```
┌───────────────────────────────────┐
│                                   │
│         [A Logo]                  │
│    "Loading Ittisalo…"            │
│         ◌ (spinning)              │
│                                   │
└───────────────────────────────────┘

- Background: gradient(#fef2f2, #fff5f5)
- Spinner: 32×32px, 3px border, #dc2626 top
- Animation: spin 0.8s linear infinite
```

---

## 4. Interaction Patterns

### 4.1 Hover Effects

| Element | Effect |
|---------|--------|
| Stat Card | `translateY(-2px)`, increased shadow |
| Nav Item | Background: `#fff5f5`, icon color: `#dc2626` |
| Dropdown Item | Background: `#fef2f2`, text color: `#dc2626` |
| Button (Primary) | Slight brightness increase |
| Table Row | Background tint |

### 4.2 Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `fadeUp` | 0.15s | ease-out | Dropdown menus, tooltips |
| `slideInUp` | 0.28s | ease | Mobile bottom sheet |
| `spin` | 0.8s | linear | Loading spinners |
| `fadeIn` | 0.2s | ease | Modal overlays |
| Transitions | 0.15s | — | All hover/active state changes |

### 4.3 Transition Properties

All interactive elements use:
```css
transition: all 0.15s ease;
```

### 4.4 Click Feedback
- Buttons: cursor: pointer, opacity reduction on disabled
- Cards: cursor: pointer (when clickable)
- Nav items: immediate color/background change

---

## 5. Niche-Specific Theming

While the primary UI chrome (sidebar, header, buttons) always uses the **red brand color**, each niche has a secondary accent for its specific content:

| Niche | Accent Color | Background Tint | AI Agent Name |
|-------|-------------|-----------------|---------------|
| Restaurant | `#dc2626` (red) | `#fffbeb` | FoodBot |
| eCommerce | `#8b5cf6` (purple) | `#f5f3ff` | ShopBot |
| Dental | `#10b981` (green) | `#ecfdf5` | DentalBot |
| Real Estate | `#3b82f6` (blue) | `#eff6ff` | PropBot |
| Salon | `#ec4899` (pink) | `#fdf2f8` | GlowBot |
| Medical Clinic | `#06b6d4` (cyan) | `#ecfeff` | MediBot |

### Niche Badge (Header)
```
┌────────────────────┐
│  Restaurant / Food │  12px, bold, red text
└────────────────────┘
Background: #fef2f2
Border: 1px solid rgba(220,38,38,0.15)
Radius: 8px
Padding: 4px 10px
```

---

## 6. Chart Design Standards

### 6.1 Area Chart (Chat Volume)

| Property | Value |
|----------|-------|
| Grid | Dashed, `#f3f4f6` |
| X-Axis | Weekday names (Mon, Tue, ...) |
| Inbound Line | Red (`#dc2626`) with gradient fill to transparent |
| Outbound Line | Blue (`#3b82f6`) with gradient fill to transparent |
| Tooltip | Dark bg (#111827), 12px radius, 12px font |

### 6.2 Pie Chart (Channel Distribution)

| Property | Value |
|----------|-------|
| Inner radius | 50 (donut) |
| Outer radius | 80 |
| WhatsApp | `#25D366` |
| Instagram | `#e1306c` |
| Messenger | `#0084ff` |
| Stroke | 2px white |

### 6.3 Custom Tooltip

```
┌──────────────────────────┐
│  Monday         (label)  │  #9ca3af, 700
│  Inbound:    12          │  white text, colored value
│  Outbound:    8          │  white text, colored value
└──────────────────────────┘
Background: #111827
Radius: 12px
Padding: 10px 16px
Shadow: 0 10px 25px rgba(0,0,0,0.15)
```

---

## 7. Form Design

### 7.1 Input Fields

| Property | Value |
|----------|-------|
| Border | 1.5px solid rgba(220,38,38,0.2) |
| Border-radius | 9px |
| Padding | 11px 14px |
| Font size | 13.5px |
| Background | #fafafa |
| Focus | 2px ring rgba(220,38,38,0.2), border color #dc2626 |

### 7.2 Primary Button

| Property | Value |
|----------|-------|
| Background | linear-gradient(135deg, #dc2626, #b91c1c) |
| Text | White, 15px, 600 weight |
| Padding | 14px |
| Border-radius | 12px |
| Shadow | 0 4px 14px rgba(220,38,38,0.3) |
| Disabled | #e5e7eb bg, #9ca3af text, no shadow |
| With loading | Spinner icon + "Loading..." text |

### 7.3 Secondary Button

| Property | Value |
|----------|-------|
| Background | #111827 |
| Text | White, 13px, 700 weight |
| Padding | 10px 18px |
| Border-radius | 8px |

---

## 8. Empty States

Every data-driven section displays a meaningful empty state:

| Context | Message |
|---------|---------|
| No orders | "No order data yet. Orders from WhatsApp will appear here." |
| No conversations | "No conversations yet. Messages will appear when customers reach out." |
| WooCommerce not connected | "⚠️ WooCommerce not connected. Go to Settings → eCommerce Platform to link your WooCommerce store." |
| Meta not connected | "Connect your WhatsApp Business to start receiving messages." |
| QR code unavailable | "Connect WhatsApp first" |
| No campaigns | "No campaigns created yet." |

---

## 9. Iconography

- **Library:** Lucide React (tree-shakeable SVG icons)
- **Default Size:** 18px for nav, 14–16px for inline, 21px for stat card icons
- **Stroke Width:** 1.8 (default), 2.2 (active state), 2.5 (stat card emphasis)
- **Color:** Inherits from parent (gray for inactive, red for active, semantic colors for context)

---

## 10. Accessibility Guidelines

| Requirement | Implementation |
|-------------|---------------|
| Color contrast | All text meets WCAG AA against backgrounds |
| Focus indicators | Focus rings on all interactive elements |
| Keyboard navigation | Tab order follows visual order |
| Touch targets | Minimum 40×40px for mobile tap targets |
| Screen reader | `title` attributes on icon-only buttons |
| Loading states | Spinner + text description |
| Error messages | Red text on red-tinted background, visible without color alone |

---

## 11. Design Tokens Summary

```css
/* Brand */
--color-primary: #dc2626;
--color-primary-dark: #b91c1c;
--color-primary-light: #fef2f2;
--color-primary-hover: #fff5f5;

/* Semantic */
--color-success: #10b981;
--color-info: #3b82f6;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-purple: #8b5cf6;

/* Neutrals */
--color-text-primary: #111827;
--color-text-secondary: #4b5563;
--color-text-muted: #6b7280;
--color-text-subtle: #9ca3af;
--color-bg-main: #faf9f9;
--color-bg-card: #ffffff;
--color-border: rgba(220,38,38,0.06);
--color-divider: rgba(220,38,38,0.07);

/* Layout */
--sidebar-width: 64px;
--header-height: 60px;
--banner-height: 38px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 18px;
--radius-xl: 20px;

/* Shadows */
--shadow-card: 0 4px 20px rgba(0,0,0,0.02);
--shadow-dropdown: 0 10px 25px rgba(220,38,38,0.15);
--shadow-button: 0 4px 14px rgba(220,38,38,0.3);

/* Transitions */
--transition-fast: 0.15s ease;
--transition-medium: 0.28s ease;
```
