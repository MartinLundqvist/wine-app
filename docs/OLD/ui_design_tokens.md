# Wine Game UI — Tailwind-Ready Design Tokens (AI-Agent Friendly)

This file defines **design tokens** and **component recipes** for a sophisticated “cellar / oak / linen / candlelight” UI.
It is optimized for later translation into **Tailwind config** (`theme.extend`) and for agentic generation of UI code.

Design intent is grounded in the game loop: large **canonical maps**, structured drills, deduction/elimination feedback, and calm “sommelier ritual” interaction. fileciteturn0file0

---

## 1) Token naming conventions

- **Palettes** use `family-shade` (e.g., `cellar-950`, `burgundy-700`).
- **Semantic** tokens are aliases to palette values (e.g., `semantic.success` → `moss-600`).
- **Component** tokens are recipes: background, border, text, hover, focus, shadow, radius.
- **Motion** tokens are durations + easing names (implementation later).

---

## 2) Core palettes (hex)

### 2.1 Neutrals — Cellar / Linen / Cork

| Token | Hex | Use |
| --- | ---: | --- |
| `cellar-950` | `#0E0B09` | App background, deepest surfaces |
| `cellar-900` | `#16110D` | Nav bars, large panels |
| `cellar-850` | `#1D1612` | Secondary surfaces |
| `cellar-800` | `#241B16` | Card backs on dark |
| `cellar-700` | `#332822` | Elevated panels, map frames |
| `cork-500` | `#8A735E` | Borders/dividers on dark |
| `cork-400` | `#A58B72` | Stronger borders, ticks, rules |
| `cork-300` | `#C2AA92` | Light borders on linen |
| `linen-100` | `#F6F1EA` | Primary light surface |
| `linen-50` | `#FBF8F3` | Background for sheets/modals |

### 2.2 Primary accent — Burgundy / Wine

| Token | Hex | Use |
| --- | ---: | --- |
| `burgundy-800` | `#3B0F1D` | Deep accents, selected state bg on dark |
| `burgundy-700` | `#571325` | Primary buttons, key highlights |
| `burgundy-600` | `#741A2F` | Hover/active primary |
| `burgundy-200` | `#E7C7CF` | Soft chips/tints |
| `burgundy-100` | `#F2E3E7` | Very light tint on linen |

### 2.3 Secondary accent — Oak

| Token | Hex | Use |
| --- | ---: | --- |
| `oak-800` | `#3A261B` | Dark oak panels |
| `oak-700` | `#4A3122` | Secondary buttons on dark |
| `oak-600` | `#6B4632` | Warm highlights, secondary controls |
| `oak-300` | `#C6A58B` | Light oak fills |
| `oak-200` | `#E2CDBD` | Subtle oak tint |

### 2.4 Premium / focus — Brass / Candle

| Token | Hex | Use |
| --- | ---: | --- |
| `brass-600` | `#8B6A2B` | Focus rings, premium emphasis |
| `brass-500` | `#B08A3C` | Icons, badges, “confirmed” check |
| `brass-200` | `#E6D3A5` | Soft halo glow |
| `candle-400` | `#D6A56E` | Warm glow, success nuance |
| `candle-200` | `#F1D7B8` | Gentle overlay glows |

### 2.5 Semantics — moss / amber / oxblood / slate

| Token | Hex | Use |
| --- | ---: | --- |
| `moss-700` | `#1E3B2E` | Success on dark |
| `moss-600` | `#2E5743` | Success default |
| `amber-600` | `#9A5B1F` | Warning |
| `oxblood-700` | `#5C0E18` | Error / destructive |
| `slateblue-600` | `#2C3F52` | Info |

---

## 3) Semantic aliases (map to palette)

> These should become **single source of truth** tokens in Tailwind (via CSS variables or theme colors).

### 3.1 Text

| Semantic token | Value |
| --- | --- |
| `text.onDark.primary` | `linen-100` |
| `text.onDark.secondary` | `#D8CEC4` |
| `text.onDark.muted` | `#B8AA9D` |
| `text.onLight.primary` | `cellar-950` |
| `text.onLight.secondary` | `#40352F` |
| `text.onLight.muted` | `#6A5C52` |

### 3.2 Surfaces

| Semantic token | Value |
| --- | --- |
| `surface.app` | `cellar-950` |
| `surface.panel` | `cellar-900` |
| `surface.elevated` | `cellar-800` |
| `surface.oakPanel` | `oak-800` |
| `surface.linenCard` | `linen-100` |
| `surface.linenSheet` | `linen-50` |

### 3.3 Borders + dividers

| Semantic token | Value |
| --- | --- |
| `border.onDark` | `cork-500` |
| `border.onLight` | `cork-300` |
| `divider.subtle` | `#2A211C` |

### 3.4 Focus

| Semantic token | Value |
| --- | --- |
| `focus.ring` | `brass-500` |
| `focus.ringSoft` | `brass-200` |

### 3.5 Feedback states

| Semantic token | Value |
| --- | --- |
| `state.success` | `moss-600` |
| `state.warning` | `amber-600` |
| `state.error` | `oxblood-700` |
| `state.info` | `slateblue-600` |

---

## 4) Typography tokens

### 4.1 Font families (names only; pick actual fonts later)

| Token | Value (placeholder) | Notes |
| --- | --- | --- |
| `font.display` | `serif-modern` | Editorial, refined |
| `font.ui` | `sans-neutral` | High legibility, good numerals |

### 4.2 Type scale (px)

| Token | Size | Use |
| --- | ---: | --- |
| `type.display` | 48 | Rare, landing hero |
| `type.h1` | 32 | Screen titles |
| `type.h2` | 24 | Section headers |
| `type.h3` | 20 | Card titles |
| `type.body` | 16 | Default |
| `type.small` | 14 | Labels, helper |
| `type.micro` | 12 | Axis ticks, meta |

### 4.3 Letter spacing

| Token | Value | Use |
| --- | ---: | --- |
| `tracking.ui` | `0.01em` | UI labels |
| `tracking.smallCaps` | `0.08em` | Axis labels / small caps |

---

## 5) Spacing, radius, and elevation

### 5.1 Spacing (px)

| Token | Value |
| --- | ---: |
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 20 |
| `space.6` | 24 |
| `space.8` | 32 |
| `space.10` | 40 |

### 5.2 Radius

| Token | Value | Use |
| --- | ---: | --- |
| `radius.card` | 16 | Cards/panels |
| `radius.control` | 12 | Buttons/inputs |
| `radius.chip` | 999 | Pills |

### 5.3 Shadows (warm, candle-like)

| Token | Value (concept) | Use |
| --- | --- | --- |
| `shadow.lift1` | soft / low | Subtle separation |
| `shadow.lift2` | stronger / focused | Modals, dragging |

> Implementation later: keep shadows *warm* (brown-ish) and blurred, not sharp gray.

---

## 6) Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `motion.fast` | 120ms | Hover, micro interactions |
| `motion.base` | 180ms | Most transitions |
| `motion.slow` | 260ms | Sheets/modals |
| `ease.ritual` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | “Sommelier calm” |

Interaction philosophy: quiet, physical, precise. Drag items “lift”, correct placements “settle”, incorrect gently returns. fileciteturn0file0

---

## 7) Component recipes (Tailwind-friendly)

Each recipe lists recommended token usage. Later you can translate this into Tailwind utility classes or `@apply`.

### 7.1 App shell

**`app.shell`**

- bg: `surface.app`
- text: `text.onDark.primary`
- max width: generous; maps are the hero
- layout: left rail + main stage

**`app.topbar`**

- bg: `surface.panel`
- border-bottom: `border.onDark` at low opacity
- height: 56–64px

**`app.rail`**

- bg: `cellar-900`
- active item: burgundy underline + brass focus ring

---

### 7.2 Panels and sheets

**`panel.oak`**

- bg: `surface.oakPanel` (optionally subtle gradient `oak-800 → cellar-900`)
- border: `border.onDark` (thin)
- radius: `radius.card`
- padding: `space.6`

**`card.linen`**

- bg: `surface.linenCard`
- text: `text.onLight.primary`
- border: `border.onLight`
- radius: `radius.card`
- padding: `space.5`

**`sheet.linen`** (modal / feedback)

- bg: `surface.linenSheet`
- radius: `radius.card`
- shadow: `shadow.lift2`
- max width: readable (not full screen)
- used for “Reasoning” and “Why not X?” explanations fileciteturn0file0

---

### 7.3 Buttons

**`button.primary`**

- bg: `burgundy-700`
- hover: `burgundy-600`
- text: `linen-100`
- radius: `radius.control`
- focus ring: `focus.ring` with soft halo `focus.ringSoft`

**`button.secondary`**

- bg: transparent
- border: `oak-600`
- text: `linen-100` on dark, `cellar-950` on light
- hover: subtle oak fill (`oak-700` on dark, `oak-200` on light)

**`button.tertiary`**

- bg: transparent
- text: secondary text
- hover: slight cork border + lift1

**`button.destructive`**

- border: `oxblood-700`
- text: `oxblood-700` on light, `linen-100` on dark
- hover: muted oxblood fill (never bright)

---

### 7.4 Chips (grapes, descriptors)

**`chip.base`**

- radius: `radius.chip`
- border: `border.onDark` or `border.onLight`
- padding: `space.2` (x) / `space.1` (y)

**`chip.selected`**

- border: `burgundy-700`
- text: `text.onDark.primary`
- optional: very subtle `burgundy-800` tint on dark

**`chip.correct`**

- border: `moss-600`
- icon: brass check
- optional glow: `brass-200` (soft)

**`chip.incorrect`**

- border: `oxblood-700`
- show linen tooltip with explanation (not red flashing) fileciteturn0file0

---

### 7.5 Sliders (structure + oak)

Sliders represent your ordinal / style scale interactions. fileciteturn0file0

**`slider.track`**

- base: `cork-500` (thin line)
- ticks: `cork-400`

**`slider.thumb`**

- ring: `brass-500`
- center dot: `linen-100` on dark, `cellar-950` on light

**`slider.fill`**

- structure sliders: subtle `burgundy-700` tint (low opacity)
- oak slider: subtle `oak-600` tint

**`slider.valueBadge`**

- bg: linen
- text: cellar
- border: cork

---

### 7.6 Canonical maps (signature component)

Maps are central: tannin vs acidity, plus other “canonical placements”. fileciteturn0file0

**`map.frame`**

- container: `panel.oak`
- axis lines: `cork-500`
- axis labels: small caps feel (tracking `tracking.smallCaps`)

**`map.quadrantHints`**

- text: muted on dark (`text.onDark.muted`)
- opacity: low (10–20%)

**`map.token`** (grape marker)

- shape: choose *one* (circle OR rounded-square) and commit
- default: border cork, bg cellar-800, text linen
- hover: `shadow.lift1`, slight scale (1.02)
- dragging: `shadow.lift2`, brass halo
- correct: candle glow pulse + snap alignment
- incorrect: gentle shake (2–3px) + return, show linen tooltip reason fileciteturn0file0

---

### 7.7 Feedback (“Reasoning” sheet)

**`feedback.sheet`**

- uses `sheet.linen`
- sections:
  - “Structure match”
  - “Fruit direction”
  - “Oak influence”
  - collapsible “Why not X?”
- tone: short, confident, instructional (sommelier note card)

---

## 8) Data-visual tokens for ordinal scales (1–5)

Your game uses 1–5 ordinals across attributes and targets. fileciteturn0file0

**Preferred visual:** 5-notch bar or 5-dot ladder

- base: cork notches
- selected: brass ring
- labels appear on hover/press only

| Token | Value |
| --- | --- |
| `ordinal.notch.base` | `cork-500` |
| `ordinal.notch.active` | `brass-500` |
| `ordinal.label` | `text.onDark.secondary` / `text.onLight.secondary` |

---

## 9) Accessibility constraints (brand-safe)

- Contrast: linen text on cellar must remain readable.
- Focus: always visible (brass ring).
- Don’t rely on color alone: correctness uses outline + icon + text.

---

## 10) Tailwind mapping checklist (implementation later)

When you implement:

- Add palette families: `cellar`, `linen`, `cork`, `burgundy`, `oak`, `brass`, `candle`, `moss`, `amber`, `oxblood`, `slateblue`
- Add semantic aliases (optional): via CSS variables or `theme.extend.colors.semantic.*`
- Add radii: `rounded-card`, `rounded-control`
- Add shadows: `shadow-lift1`, `shadow-lift2`
- Add typography: `font-display`, `font-ui`
- Create utilities/components via recipes above (`panel-oak`, `sheet-linen`, `map-frame`, etc.)

---

## Appendix: Quick token dictionary (copy/paste friendly)

### Colors

- `cellar`: 950/900/850/800/700
- `linen`: 100/50
- `cork`: 500/400/300
- `burgundy`: 800/700/600/200/100
- `oak`: 800/700/600/300/200
- `brass`: 600/500/200
- `candle`: 400/200
- `moss`: 700/600
- `amber`: 600
- `oxblood`: 700
- `slateblue`: 600

### Radii

- `radius.card` 16
- `radius.control` 12
- `radius.chip` 999

### Motion

- `motion.fast` 120ms
- `motion.base` 180ms
- `motion.slow` 260ms
- `ease.ritual` cubic-bezier(0.2, 0.8, 0.2, 1)
