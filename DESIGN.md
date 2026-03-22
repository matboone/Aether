# Design System Strategy: The Empathetic Guardian

This design system is engineered to transform the chaotic, high-anxiety experience of medical debt into a journey of clarity and resolution. We move beyond standard healthcare UI by adopting an editorial, high-end approach that prioritizes "white space as a feature" and tonal layering over rigid borders and grids.

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Sanctuary"**
In a sanctuary, there is no noise. This system breaks the "standard app" template through intentional asymmetry and a focus on soft, organic depth. We adopt the **Catppuccin Frappé** palette — a soothing dark theme with muted pastels — to deliver a calm, low-fatigue experience during long sessions with sensitive financial data.

The layout should feel "curated." Headlines are bold and authoritative; body text is airy and readable. We use overlapping card structures and varying surface elevations to guide the eye naturally, mimicking the way one might sort through high-quality physical documents on a well-lit desk.

---

## 2. Color & Tonal Architecture — Catppuccin Frappé
The palette is rooted in the **Catppuccin Frappé** flavour with a **green (#a6d189)** accent signifying action, progress, and resolution.

### Frappé Core Surfaces
| Token | Hex | Role |
|:---|:---|:---|
| `base` | `#303446` | Main page background |
| `mantle` | `#292c3c` | Sidebar & panel backgrounds |
| `surface-low` | `#363a4f` | Inset / bubble backgrounds |
| `surface0` | `#414559` | Elevated cards, fact cards |
| `surface1` | `#51576d` | Higher-elevation surfaces |
| `surface2` | `#626880` | Overlay / border base |
| `crust` | `#232634` | Deepest layer, on-primary text |

### Text Hierarchy
| Token | Hex | Usage |
|:---|:---|:---|
| `text` | `#c6d0f5` | Primary body text |
| `subtext0` | `#a5adce` | Muted labels, secondary text |
| `overlay1` | `#838ba7` | Disabled / placeholder text |

### Brand & Semantic Colors
| Token | Hex | Usage |
|:---|:---|:---|
| **Green (primary)** | `#a6d189` | Primary CTAs, active indicators, progress |
| **Teal (secondary)** | `#81c8be` | Confirmed/success states, gradient endpoint |
| **Blue** | `#8caaee` | Informational, tertiary accent |
| **Red** | `#e78284` | Errors, destructive actions |
| **Yellow** | `#e5c890` | Warnings |
| **Mauve** | `#ca9ee6` | Supplementary accent |

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning or container definition.
Boundaries must be created through background color shifts. For example, a `surface-low` (`#363a4f`) card should sit on a `base` (`#303446`) background. The contrast is subtle, professional, and sophisticated.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials in a dark environment.
- **Base Layer:** `base` (#303446) — The foundation of the screen.
- **Mid Layer:** `mantle` (#292c3c) — Used for primary content panels & sidebar.
- **Card Layer:** `surface0` (#414559) — Elevated, interactive cards.
- **Accent Layer:** `surface1` (#51576d) — Highlighted or hovered elements.

### The Glass & Gradient Rule
To prevent a "flat" feel, floating elements (like bottom navigation or modal headers) should utilize **Glassmorphism**:
- **Fill:** `base` at 85% opacity.
- **Effect:** 20px - 40px Backdrop Blur.
- **Signature Polish:** Use a subtle linear gradient on primary CTAs (`green` #a6d189 to `teal` #81c8be) to add a gentle "pulse" of depth.

---

## 3. Typography: Editorial Clarity
We pair the geometric precision of **Inter** with the approachable modernism of **Manrope**.

| Role | Font | Size | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display LG** | Manrope | 3.5rem | Bold | Hero currency values and savings. |
| **Headline MD** | Manrope | 1.75rem | Medium | Section headers and empathetic prompts. |
| **Title LG** | Inter | 1.375rem | Semibold | Card titles and primary labels. |
| **Body LG** | Inter | 1.0rem | Regular | Main instructional text (high readability). |
| **Label MD** | Inter | 0.75rem | Medium | Metadata, tags, and micro-copy. |

**The Numeral Rule:** Currency is the primary stressor. All currency displays must use `display-lg` with increased letter-spacing to ensure the user can process the figures without visual strain.

---

## 4. Elevation & Depth: Tonal Layering
We use **surface stacking** as the primary depth cue, supplemented by soft shadows.

- **The Layering Principle:** Stacking `surface0` on `base` creates natural lift. This tonal layering is the hallmark of this system.
- **Ambient Shadows:** Used for true floating elements (e.g., dialogs, floating buttons).
    - **Color:** `#000000` at 20% to 30% opacity.
    - **Blur:** 24px to 48px.
    - **Y-Offset:** 8px to 16px.
- **The "Ghost Border" Fallback:** If a container requires a border for accessibility (e.g., an input field), use `surface2` (#626880) at 25% opacity. Never use fully opaque lines.

---

## 5. Components

### Cards & Lists
- **Rule:** No dividers. Use `spacing-6` (2rem) of vertical space or a shift from `surface-low` to `surface0` to separate list items.
- **Rounding:** Use `xl` (1.5rem) for main bill cards to feel soft and approachable. Use `lg` (1rem) for internal nested elements.

### Buttons
- **Primary:** Gradient-filled (#a6d189 to #81c8be). Dark text (#232634). `xl` rounding for a pill shape.
- **Secondary:** `surface0` background with `green` text. No border.
- **Tertiary:** Text-only with an icon. Used for "Cancel" or "Go Back" to reduce visual noise.

### Progress Indicators
Utilize the signature **Frappé Green** (`primary` #a6d189).
- **Style:** A thick 6px track with `full` rounding. The track background should be `green` at 15% opacity to maintain a soft, non-threatening aesthetic.

### Additional Signature Components
- **The Bill Triage Chip:** A high-contrast chip using `teal` (#81c8be) for "Analyzed" or "Negotiating" states, providing a calming "status" indicator.
- **Confidence Meters:** Subtle gauges using `blue` (#8caaee) to show the likelihood of bill reduction, utilizing the typography scale for clear, bold percentages.

---

## 6. Do's and Don'ts

### Do
- Use **asymmetric padding** in hero sections (e.g., more space on the left) to create a high-end, editorial feel.
- Use **Catppuccin Frappé surfaces** for backgrounds to lower visual fatigue.
- Prioritize **large-scale numerals** for financial data.
- Use **soft rounding (1.5rem)** on all primary containers.

### Don't
- **Don't use 1px dividers.** It clutters the interface and creates "visual noise."
- **Don't use pure white (#ffffff) text.** Use `text` (#c6d0f5) for all body text to stay within the Frappé palette.
- **Don't use harsh, saturated reds.** Use the `red` (#e78284) token sparingly and always within a muted container to soften the impact of negative news.
- **Don't use heavy shadows.** If you can see the shadow clearly, it's too heavy. Prefer tonal surface shifts.