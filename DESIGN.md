# Design Brief

## Direction

Vivid Productivity — Light-mode QR generator with confident teal accent colors for actions, professional business aesthetic.

## Tone

Clean, modern, confident — no decoration, maximum focus on the tool's core interface (URL input, QR display, save form).

## Differentiation

Card-based layout for saved QR codes with subtle shadows; vivid teal accent on primary actions (Generate, Download) creates clear visual hierarchy for tool interaction.

## Color Palette

| Token      | OKLCH           | Role                                  |
| ---------- | --------------- | ------------------------------------- |
| background | 0.99 0.005 260  | Light crisp white, primary surface    |
| foreground | 0.15 0.01 260   | Dark grey text, maximum readability   |
| card       | 1.0 0.0 0       | Pure white for QR code display cards  |
| primary    | 0.55 0.18 195   | Vivid cyan/teal for CTAs              |
| accent     | 0.55 0.18 195   | Matches primary for consistency       |
| muted      | 0.95 0.01 260   | Light grey for inactive states        |
| border     | 0.9 0.01 260    | Subtle grey dividers                  |

## Typography

- Display: Space Grotesk — confident, geometric, tech-forward; used for headings and hero text
- Body: DM Sans — clean, neutral, professional; used for UI labels, body copy, and form text
- Scale: hero `text-5xl font-bold tracking-tight`, h2 `text-3xl font-bold tracking-tight`, label `text-sm font-semibold uppercase`, body `text-base`

## Elevation & Depth

Subtle shadows on cards (shadow-sm) create gentle elevation; no shadows on input fields; light grey borders (border-border) provide visual separation without shadows.

## Structural Zones

| Zone    | Background            | Border             | Notes                                      |
| ------- | -------------------- | ------------------ | ------------------------------------------ |
| Header  | bg-background         | border-b border-border | Nav + logo; spans full width              |
| Content | bg-background         | —                  | QR generator form; alternates bg-card     |
| Footer  | bg-muted/20           | border-t border-border | Ticker message bar; 80 char message       |

## Spacing & Rhythm

Spacious layout with consistent 6px border-radius on all interactive elements; section gaps 24–32px; micro-spacing (gap, padding) in 4px/8px/12px increments for consistent visual rhythm.

## Component Patterns

- Buttons: rounded-md bg-primary text-primary-foreground; hover:bg-primary/80
- Cards: rounded-md bg-card border border-border shadow-sm
- Inputs: rounded-md border border-input bg-background px-3 py-2; focus:ring-2 ring-primary
- Badges: rounded-full text-xs font-semibold bg-muted/30 text-foreground

## Motion

- Entrance: fade-in on page load (opacity 0 → 1 over 200ms)
- Hover: transition-smooth (all properties over 300ms); buttons darken on hover
- Decorative: none; keep interface clean and focused

## Constraints

- No gradients; flat color surfaces only
- No heavy shadows; shadow-sm (0 1px 2px) maximum
- Vivid teal accent used sparingly — primary CTA, focus states, and sidebar active items only
- All text must pass WCAG AA contrast on both light and dark backgrounds

## Signature Detail

Vivid teal accent color (H:195, C:0.18) creates immediate visual focus on the primary action (Generate QR Code button), signaling to users where interaction begins.

