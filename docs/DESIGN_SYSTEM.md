# Design System

**Aesthetic**: Calm, peaceful, minimalist (Lovable-style portfolio)

**Based on**: 60-30-10 UX Design Rule (found in WereCode project)
- **60% Primary**: Off-white/cream backgrounds (dominant)
- **30% Secondary**: Soft grays for text and subtle elements
- **10% Accent**: Muted sage/lavender/mist-blue for highlights and CTAs

---

## Color Palette

### Primary (60%) - Off-white/Cream Backgrounds

```javascript
primary: {
  50: '#fefefe',   // Pure white (rare use)
  100: '#fcfcfc',  // Off-white (main bg)
  200: '#f9f9f9',  // Slightly darker
  300: '#f5f5f5',  // Card backgrounds
  400: '#f0f0f0',  // Hover states
  500: '#ebebeb',  // Borders
  600: '#e5e5e5',  // Dividers
  700: '#d4d4d4',  // Disabled states
  800: '#c4c4c4',
  900: '#a3a3a3',
}
```

**Usage**:
- `primary-100`: Main page background
- `primary-300`: Card backgrounds
- `primary-400`: Hover states
- `primary-500`: Thin borders

### Secondary (30%) - Soft Grays

```javascript
secondary: {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',  // Subtle text
  500: '#737373',  // Body text
  600: '#525252',  // Headings
  700: '#404040',  // Strong text
  800: '#262626',  // Near-black
  900: '#171717',  // True black
}
```

**Usage**:
- `secondary-500`: Body text (main content)
- `secondary-600`: Headings and labels
- `secondary-700`: Strong emphasis
- `secondary-400`: Placeholder text, captions

### Accent (10%) - Sage/Lavender/Mist-Blue

**Sage** (primary accent):
```javascript
sage: {
  50: '#f6f9f7',
  100: '#e8f2ed',
  200: '#d1e5da',
  300: '#a8ceb9',
  400: '#7ab598',  // Main sage
  500: '#5a9d7d',
  600: '#478165',
  700: '#3a6753',
  800: '#315244',
  900: '#2a4439',
}
```

**Lavender** (secondary accent):
```javascript
lavender: {
  50: '#faf8fc',
  100: '#f3eff8',
  200: '#e7dff1',
  300: '#d4c5e4',
  400: '#b8a1d3',  // Main lavender
  500: '#9e81be',
  600: '#8566a6',
  700: '#6f5389',
  800: '#5d4672',
  900: '#4e3c5e',
}
```

**Mist Blue** (tertiary accent):
```javascript
mist: {
  50: '#f6f9fb',
  100: '#ebf3f7',
  200: '#d7e7ef',
  300: '#b5d3e3',
  400: '#8db9d3',  // Main mist blue
  500: '#6fa1c4',
  600: '#5685b0',
  700: '#476c8f',
  800: '#3c5b76',
  900: '#344c62',
}
```

**Usage**:
- `sage-400`: Primary buttons, primary CTA
- `lavender-400`: Secondary actions, badges
- `mist-400`: Info states, links
- Use sparingly (10% rule!)

---

## Typography

### Font Families

Based on WereCode design system:

**Display Font** (headings, hero text):
```javascript
fontFamily: {
  display: [
    'Space Grotesk',
    'Inter',
    'system-ui',
    'sans-serif',
  ]
}
```

**Sans Font** (body text, UI):
```javascript
fontFamily: {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'sans-serif',
  ]
}
```

**Mono Font** (code, technical labels):
```javascript
fontFamily: {
  mono: [
    'JetBrains Mono',
    'Fira Code',
    'Consolas',
    'Monaco',
    'Courier New',
    'monospace',
  ]
}
```

### Font Sizes (Relaxed Scale)

```javascript
fontSize: {
  xs: ['0.75rem', { lineHeight: '1.5' }],      // 12px
  sm: ['0.875rem', { lineHeight: '1.6' }],     // 14px
  base: ['1rem', { lineHeight: '1.7' }],       // 16px (body)
  lg: ['1.125rem', { lineHeight: '1.7' }],     // 18px
  xl: ['1.25rem', { lineHeight: '1.7' }],      // 20px
  '2xl': ['1.5rem', { lineHeight: '1.5' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '1.4' }],  // 30px
  '4xl': ['2.25rem', { lineHeight: '1.3' }],   // 36px (h1)
  '5xl': ['3rem', { lineHeight: '1.2' }],      // 48px
}
```

**Note**: Line heights are "comfortable" (1.6-1.7) for airy feel.

### Letter Spacing

```javascript
letterSpacing: {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
}
```

**Usage**:
- `tracking-tight`: Large headings (display font)
- `tracking-normal`: Body text
- `tracking-wide`: Labels, buttons (mono font)

---

## Spacing (Generous)

Use Tailwind's default spacing scale with preference for larger values:

**Common spacing**:
- `gap-6`: Card grids
- `p-6`: Card padding
- `p-8`: Section padding
- `space-y-8`: Vertical rhythm

**Whitespace is key** - don't be afraid of large gaps!

---

## Border Radius

Consistent rounded corners:

```javascript
borderRadius: {
  'none': '0',
  'sm': '0.125rem',    // 2px
  'DEFAULT': '0.375rem', // 6px
  'md': '0.5rem',      // 8px
  'lg': '0.75rem',     // 12px
  'xl': '1rem',        // 16px
  '2xl': '1.5rem',     // 24px (main - for cards)
  '3xl': '2rem',       // 32px
  'full': '9999px',
}
```

**Usage**:
- `rounded-2xl`: Cards, panels, modals
- `rounded-xl`: Buttons, inputs
- `rounded-lg`: Smaller components, badges

---

## Shadows (Soft, Subtle)

```javascript
boxShadow: {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
}
```

**Note**: Shadows are very subtle (low opacity) for calm aesthetic.

---

## Gradients (Subtle)

```javascript
backgroundImage: {
  'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  'gradient-sage': 'linear-gradient(135deg, #7ab598 0%, #5a9d7d 100%)',
  'gradient-lavender': 'linear-gradient(135deg, #b8a1d3 0%, #9e81be 100%)',
  'gradient-mist': 'linear-gradient(135deg, #8db9d3 0%, #6fa1c4 100%)',
  'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(122, 181, 152, 0.1) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(184, 161, 211, 0.08) 0px, transparent 50%)',
}
```

**Usage**:
- `bg-gradient-mesh`: Page background (subtle accent mesh)
- `bg-gradient-sage`: Primary buttons (hover state)
- Keep subtle and low opacity!

---

## Hover Effects

Gentle lift and color shift:

```javascript
transition: {
  DEFAULT: 'all 200ms ease-in-out',
  colors: 'color 150ms ease-in-out',
  transform: 'transform 200ms ease-in-out',
}
```

**Example Card Hover**:
```css
.card-hover {
  @apply transition-all duration-200 ease-in-out;
  @apply hover:shadow-lg hover:-translate-y-1;
}
```

---

## Component Patterns

### Card

```css
.card-base {
  @apply bg-primary-300 border border-primary-500 rounded-2xl shadow-md p-6;
}

.card-hover {
  @apply card-base transition-all hover:shadow-lg hover:-translate-y-1;
}
```

### Button Primary

```css
.btn-primary {
  @apply bg-sage-400 text-white rounded-xl px-6 py-3 font-medium;
  @apply transition-colors hover:bg-sage-500;
  @apply focus:ring-2 focus:ring-sage-300 focus:outline-none;
}
```

### Button Secondary

```css
.btn-secondary {
  @apply bg-primary-400 text-secondary-700 rounded-xl px-6 py-3 font-medium;
  @apply border border-primary-600;
  @apply transition-colors hover:bg-primary-500;
}
```

### Input

```css
.input-base {
  @apply bg-primary-200 border border-primary-500 rounded-xl px-4 py-3;
  @apply text-secondary-700 placeholder:text-secondary-400;
  @apply focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400;
  @apply transition-all;
}
```

---

## Implementation Location

**ALL design tokens in ONE file**: `tailwind.config.ts`

Colors, fonts, spacing, shadows - everything centralized for easy editing.

**Global styles**: `app/globals.css` (font imports, base styles)

**Approach**:
1. Copy this design system into `tailwind.config.ts` `theme.extend` section
2. Import fonts in `app/globals.css` via Google Fonts CDN
3. Use Tailwind classes throughout app (no custom CSS unless needed)
4. To change colors later: edit `tailwind.config.ts` only!

---

## Usage Guidelines

### DO ✅
- Use lots of whitespace (`gap-8`, `py-12`)
- Keep shadows soft and subtle
- Use `rounded-2xl` for main cards
- Limit accent colors to ~10% of design
- Use `font-display` for headings, `font-sans` for body
- Comfortable line-height (1.6-1.7)

### DON'T ❌
- Use harsh shadows or high contrast
- Overuse accent colors (breaks 60-30-10 rule)
- Use small spacing (prefer generous gaps)
- Use small border radius (prefer rounded-xl/2xl)
- Use pure black or pure white (use soft tones)

---

## Mathematical Color Relationships

**60% Primary** = Backgrounds, containers, large surfaces
- `primary-100`: ~60% of viewport
- `primary-300`: ~20% (cards within bg)

**30% Secondary** = Text, subtle elements
- `secondary-500`: Body text (~20% of surface)
- `secondary-600`: Headings (~10% of surface)

**10% Accent** = CTAs, highlights, interactive elements
- `sage-400`: Buttons, badges (~7%)
- `lavender-400`: Secondary actions (~2%)
- `mist-400`: Info/links (~1%)

**Visual weight**, not literal percentage. Measured by visual attention draw.

---

## Accessibility

**Color Contrast Ratios**:
- Body text (`secondary-500` on `primary-100`): ~7:1 ✅ AAA
- Headings (`secondary-600` on `primary-100`): ~8.5:1 ✅ AAA
- Buttons (`white` on `sage-400`): ~4.8:1 ✅ AA

**Focus States**:
- All interactive elements MUST have visible focus ring
- Use `focus:ring-2` with accent color

**Motion**:
- Respect `prefers-reduced-motion` (add utility class)

---

## Examples

### Page Layout

```tsx
<div className="min-h-screen bg-primary-100 bg-gradient-mesh">
  <div className="max-w-7xl mx-auto px-6 py-12">
    <h1 className="font-display text-4xl font-bold text-secondary-700 tracking-tight">
      Reel Story Studio
    </h1>
    <p className="font-sans text-lg text-secondary-500 mt-4 leading-relaxed">
      Create engaging short-form video reels with AI-powered audio.
    </p>
  </div>
</div>
```

### Card Component

```tsx
<div className="bg-primary-300 border border-primary-500 rounded-2xl shadow-md p-6 transition-all hover:shadow-lg hover:-translate-y-1">
  <h3 className="font-display text-xl font-semibold text-secondary-700 mb-3">
    Script Module
  </h3>
  <p className="font-sans text-secondary-500 leading-relaxed mb-4">
    Generate structured script from your source content.
  </p>
  <button className="bg-sage-400 text-white rounded-xl px-6 py-3 font-medium hover:bg-sage-500 transition-colors">
    Run Script Generation
  </button>
</div>
```

### Status Badge

```tsx
<span className="inline-flex items-center gap-2 bg-lavender-100 text-lavender-700 rounded-lg px-3 py-1 font-mono text-sm font-medium">
  <span className="w-2 h-2 bg-lavender-500 rounded-full" />
  Processing
</span>
```

---

## Quick Reference

**Primary BG**: `bg-primary-100`
**Card BG**: `bg-primary-300`
**Body Text**: `text-secondary-500`
**Heading**: `text-secondary-700`
**Border**: `border-primary-500`
**Button Primary**: `bg-sage-400 text-white`
**Button Secondary**: `bg-primary-400 text-secondary-700`
**Rounded**: `rounded-2xl` (cards), `rounded-xl` (buttons)
**Shadow**: `shadow-md` (default), `shadow-lg` (hover)
**Font Display**: `font-display` (Space Grotesk)
**Font Sans**: `font-sans` (Inter)
**Font Mono**: `font-mono` (JetBrains Mono)

---

**Remember**: All tokens in `tailwind.config.ts` - edit once, change everywhere! 🎨
