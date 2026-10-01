# KSAP Cloud UI — DESIGN.md

**Version 6.1.** This file is the single brief for every KSAP prototype, product screen and AI-generated UI. Place it at the root of every repo. Any person or tool that builds a KSAP screen reads this file first and follows it exactly. Where this file and a habit disagree, this file wins. Where this file and the KSAP Brand Guidelines disagree, the Brand Guidelines win unless the deviation is listed in §14 (Exceptions register).

The reference implementation is the **KSAP Cloud UI component library** (demo + source). When in doubt, copy what it does.

---

## 0. Rule zero — extract before you invent

Before creating any colour, size, component, pattern or string:

1. Look in this file.
2. Look in `ksap-theme.css` and `src/components/ui/`.
3. Look in the approved libraries (§4).

Only if none of the three has it may you propose something new, and you must register it (§14) with a reason, an owner and a review date. Silent invention is how a product ends up looking generated.

---

## 1. What we are building

KSAP Cloud UI is an operations console for logistics data: shipments, lanes, carriers, dock doors, rates, invoices and integrations (notably Oracle Transportation Management). Users are dispatchers, planners, finance analysts and administrators working full shifts. Design for speed, density, accuracy and calm.

Six principles, in priority order:

1. **Do it right the first time.** Constrain inputs so mistakes are hard to make. Validate early, explain the fix.
2. **Fewest clicks.** Bulk actions, keyboard paths, sensible defaults, inline actions, search as navigation.
3. **Undo over "are you sure".** Confirm only what cannot be reversed.
4. **One meaning, one look.** A status, action or colour means the same thing on every screen.
5. **Honest state.** Every screen has designed loading, empty, error, success, offline and partial states.
6. **Authored, not generated.** Every visible decision traces to a line in this file.

---

## 2. Brand foundation (non-negotiable)

Source: KSAP Brand Guidelines (6 pages).

| Brand name | Hex | Token | Job in product |
|---|---|---|---|
| Vivid Blue | `#0253E9` | `--ksap-vivid-blue` | Brand primitive for logo contexts, marketing and gradients. Product UI uses the v4.0 blue scale (§3.3, EX-06) |
| Dark Blue | `#010D43` | `--ksap-dark-blue` | Primary text |
| Blue Gray | `#43576C` | `--ksap-blue-gray` | Secondary text and icons |
| Light Blue | `#DEE9FF` | `--ksap-light-blue` | Brand primitive for marketing fills |
| LB-Surface | `#EBF2FF` | `--ksap-lb-surface` | Inset zones, table headers, hover |
| LG-Border | `#E7EBF3` | `--ksap-lg-border` | Dividers and hairlines (decorative only) |
| White | `#FFFFFF` | `--ksap-white` | Canvas |

**One Accent Principle.** The product has one accent at a time: the user's **palette** (§3.9). The default is Blue, whose fill is **Action Blue `#1258B5`** (v4.0 scale, EX-06). The accent appears on the primary action, links, the selected item, the focus ring, indicators, the one data point a chart is about, and the sidebar. Nothing else takes the accent for decoration. Status colours are never the accent. Brand Vivid Blue `#0253E9` is kept for logo contexts and marketing.

**Gradients.** The brand gradients (G1 `#C7DFFF→#FFF`, G2 `#A2C6F4→#FFF`, G3 `#5D9BFF→#EBF6FE`, approved `#ACD1FE→#FFF`) are **marketing surfaces only** (login splash, empty-state illustration backgrounds, website). Never on buttons, charts, cards, headers or components.

**Logo.** Use the official wordmark files only. Primary (white letters on the blue block) on light backgrounds, including the light Yellow sidebar palette; reversed (blue letters on a white block) on dark backgrounds, which is how it appears on the Blue, Red and Green sidebars and every sidebar in dark theme. The rail picks the variant automatically. Minimum 80 px wide on screen. Clear space on all sides equal to the height of the K. Never recolour, stretch, outline, add effects or rebuild it in type.

**Typography.** Montserrat, weights **400 and 600 only**. No 300, 500, 700 or 800 anywhere. No all-caps text in the product (brand: avoid all caps for body text; product: no all-caps labels either).

---

## 3. Tokens

All tokens live in **`ksap-theme.css`**, the one common stylesheet. It is structured in layers.

### 3.1 Layer 0 — the lock

`ksap-theme.css` deletes Tailwind's default palette, radius, shadow, font, text-size, font-weight and animation scales:

```css
@theme { --color-*: initial; --radius-*: initial; --shadow-*: initial; --font-*: initial;
         --text-*: initial; --font-weight-*: initial; --animate-*: initial; }
```

Result: `bg-purple-500`, `font-bold`, `rounded-2xl`, `shadow-lg` and `text-sm` **do not exist**. Off-brand values cannot be typed, so they cannot ship.

### 3.2 Layer 2 — semantic roles (use these in code)

| Role token | Tailwind utility | Light | Dark | Use |
|---|---|---|---|---|
| `--ksap-canvas` | `bg-background` | `#FFFFFF` | `#0A172B` | Page |
| `--ksap-surface` | `bg-surface` / `bg-muted` | `#EBF2FF` | `#0F2038` | Insets, table header, hover |
| `--ksap-surface-strong` | `bg-surface-strong` | `#DBEAFE` | `#152A49` | Stronger fill, avatars, step markers |
| `--ksap-raised` | `bg-card`, `bg-popover` | `#FFFFFF` | `#1A3254` | Cards, overlays |
| `--ksap-text` | `text-foreground` | `#010D43` | white 90% | Primary text |
| `--ksap-text-secondary` | `text-muted-foreground` | `#43576C` | white 64% | Secondary text |
| `--ksap-text-disabled` | `text-disabled` | Dark Blue 42% | white 40% | Disabled text |
| `--ksap-border` | `border-border` | `#E7EBF3` | white 10% | Hairlines |
| `--ksap-border-control` | `border-input` | `#8693A5` | white 34% | Input, checkbox, radio borders (3:1) |
| `--ksap-action` | `bg-primary` | `#1258B5` | `#4C9AE8` | Button fill; always paired with `text-primary-foreground` (palette) |
| `--ksap-action-ink` | `text-primary-ink`, `bg-primary-ink`, `border-primary-ink` | `#1258B5` | `#6DAEEC` | Links, focus ring, switches, radio, slider, progress, tab underline (palette) |
| `--ksap-action-hover` | `bg-primary-hover` | `#06459A` | `#6DAEEC` | Hover (pressed: `#053B83` / `#93C5FD`) (palette) |
| `--ksap-selected` | `bg-accent` | `#EFF6FF` | `#4C9AE8` at 14% | Selected row / item, plus an ink bar at the start edge (palette) |
| `--ksap-selected-fg` | `text-accent-foreground` | `#06459A` | `#93C5FD` | Text on selected (palette) |
| `--ksap-info` | `bg-info`, `text-info`, `bg-info-subtle`, `text-info-foreground` | `#1258B5` | `#4C9AE8` | Info status (in transit, tendered): fixed blue in every palette |
| `--ksap-success` / `-subtle` | `text-success`, `bg-success-subtle` | `#12703F` / `#E7F5EC` | `#4CC38A` | On time, healthy, saved |
| `--ksap-warning` / `-subtle` | `text-warning`, `bg-warning-subtle` | `#8A5A00` / `#FCF1DC` | `#E5A13D` | At risk, expiring |
| `--ksap-danger` / `-subtle` | `text-danger`, `bg-danger-subtle` | `#B3261E` / `#FBEAE9` | `#F1706A` | Breach and destruction only |
| `--ksap-rail` | `bg-rail` | `#1258B5` | `#082F67` | Navigation rail (palette) |

Rows marked *(palette)* are set by the active palette (§3.9); the values shown are the Blue default. **Fill versus ink:** use `bg-primary` only for fills that carry text (buttons, selected page number, checked checkbox, calendar day). Use `primary-ink` for text, lines and indicators that carry no text. The two are identical in Blue, Red and Green; in Yellow the ink is a darker shade, because a light yellow line or link would fail contrast.

Dark theme is **designed, not inverted**: near-black navy canvas, surfaces get lighter as they rise, brand blue is lightened and desaturated, text uses 90/64/40% tiers, hairlines are white at 10%.

Theme selection: `:root[data-theme="dark"]` forces dark, `:root[data-theme="light"]` forces light, no attribute follows the OS.

### 3.3 Product extensions

Product blue scale, restored from v4.0 (EX-06):

| Step | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hex | `#EFF6FF` | `#DBEAFE` | `#BFDBFE` | `#93C5FD` | `#4C9AE8` | `#1258B5` | `#06459A` | `#053B83` | `#082F67` | `#10284A` | `#0A172B` |
| Use | Selected | Strong fill | Chart series | Dark pressed | Dark action | **Action** | Hover | Pressed | Deep fill | Dark chart | Dark canvas |

Contrast: `#1258B5` on white 6.8:1; `#06459A` on `#EFF6FF` 8.3:1; `#4C9AE8` on `#0A172B` 6.1:1. v4.0 annotated this scale with an OKLCH value that did not match the hex; the hex values are authoritative. Skeletons use `#E8EEF6` (light) and white at 7% (dark), also from v4.0. Status and environment colours are registered exceptions (§14).

### 3.4 Type scale

| Role | Utility | Size / line | Weight | Maps to brand role |
|---|---|---|---|---|
| Display | `text-display` | 36 / 44 | 600 | Heading (36–48) |
| Title | `text-title` | 28 / 36 | 600 | Subheading (20–28) |
| Heading | `text-heading` | 20 / 28 | 600 | Subheading min |
| Subheading | `text-subheading` | 16 / 24 | 600 | Body min |
| Body | `text-body` | density: 13/20, 14/22, 16/26 | 400 | Body (EX-01 below 16) |
| Caption | `text-caption` | 12 / 16 | 400 or 600 | Caption (12 min) |

Rules: nothing below 12 px, ever. Line length under 80 characters for prose. Tabular figures are on globally (`font-variant-numeric: tabular-nums`). IBM Plex Mono (EX-02) is used **only** for record IDs, SCACs, lane numbers, trace codes and logs, never for labels or decoration.

Fallback stack: `"Montserrat", "Noto Sans Arabic", "Segoe UI", system-ui, -apple-system, sans-serif`. Montserrat has no Arabic, Hebrew or CJK glyphs; the Noto family covers those scripts (add Noto Sans Hebrew / JP / SC as markets require).

### 3.5 Density (user preference, not a breakpoint)

| Density | Body | Row height | Control height | Panel padding |
|---|---|---|---|---|
| Compact | 13 px | 32 px | 30 px | 12 px |
| Standard (default) | 14 px | 40 px | 36 px | 16 px |
| Relaxed | 16 px | 48 px | 44 px | 20 px |

Set with `data-density` on `<html>`. Components read `--ksap-row-h`, `--ksap-control-h`, `--ksap-pad`. Touch targets stay 44 px effective via invisible hit-area extension.

### 3.6 Named utilities (instead of arbitrary values)

When a component needs a value the scales don't have, it gets a **named utility in `ksap-theme.css`** with a one-line reason, never a bracketed value in markup.

| Utility | Value | Reason |
|---|---|---|
| `max-w-page` | 1280 px | Content width; tables stay scannable |
| `max-w-sheet` | min(420 px, 100vw − 2 rem) | Side sheets |
| `max-h-table` | max(420 px, 100dvh − 18 rem) | Lets the table header stick inside the grid |
| `grid-cols-hero` / `-split` / `-board` | 2fr 1fr 1fr / 3fr 2fr / 1fr 3fr | Dashboard, content + side column, dispatch board |
| `border-w-control` | 1.5 px | Checkbox, radio, step markers |
| `hit-44` | ≥ 44 × 44 px invisible target | Touch targets without enlarging the visual |
| `shadow-hairline` | inset 1 px border colour | Selected segment in toggle groups |
| `pt-safe`, `pb-safe`, `top-safe`, `top-safe-3`, `top-shell`, `h-shell` | env(safe-area-inset) + environment strip | Phones with notches; sticky shell under the environment strip |
| `can-hover:` (variant) | `(hover: hover) and (pointer: fine)` | Hover-revealed UI never hides actions on touch |

References to tokens (`h-[var(--ksap-control-h)]`, `w-[var(--radix-popover-trigger-width)]`) are the only bracketed values allowed. Register new utilities in `tailwind-merge` (`src/lib/utils.js`) so they merge correctly.

### 3.7 Space, radius, elevation

- **Space:** 4 px grid. Use Tailwind spacing steps (1 = 4 px). No arbitrary gaps.
- **Radius:** `rounded-sm` 3 px (checkbox, tag, badge), `rounded-md` 6 px (button, input, menu item), `rounded-lg` 12 px (card, panel, dialog), `rounded-full` (pill, avatar, switch). Nested corners: R_inner = R_outer − padding. Sheets docked to an edge have no corner on that edge.
- **Elevation:** cards and panels use a 1 px border and **no shadow**. `shadow-overlay` for popovers, menus, sheets and toasts. `shadow-critical` only for the irreversible confirmation dialog.

### 3.8 Motion

| Class | Duration | Easing | Use |
|---|---|---|---|
| Feedback | 100 ms | productive | Hover, press, toggle |
| Exit | 180 ms | productive | Closing overlays |
| Entrance | 240 ms | productive | Opening overlays |
| Attention | 650 ms | expressive | SLA breach only — the one licensed bounce |
| Stagger | +50 ms per item | productive | Lists entering |
| Continuous | 1.6 s | linear | Syncing pulse, skeleton shimmer |

Productive = `cubic-bezier(.2,0,.38,.9)`. Expressive = `cubic-bezier(.175,.885,.32,1.275)`. Movement (position, size, entrance, exit) uses only `transform` and `opacity`. Colour and border changes are allowed only as feedback-class transitions (100 ms). `prefers-reduced-motion` collapses everything to instant. No entrance animations on page sections, no hover lifts on cards.

---

### 3.9 Accent palettes

Users choose a **Palette** under Display settings: Blue (default), Red, Green or Yellow. The choice is saved per user and sets `data-palette` on `<html>`. The command palette can also switch it.

**What a palette changes:** every accent role. That covers the button fill, hover and pressed states, text on the fill, ink (links, focus ring, switches, radio, slider, progress, tab underline, sort arrow), selection tint and text, the chart accent and muted series, strong fills, and the sidebar with its logo variant.
**What it never changes:** status colours (danger, success, warning and info), neutrals, surfaces, text, the environment strip and the logo artwork.

**Single source.** Palettes are defined in `src/styles/palettes.json`. `npm run palettes` generates the palette section of `ksap-theme.css` between the `@palettes` markers. Never edit that section by hand. The Foundations page reads the same JSON, so the documentation can't drift.

**How a palette is formed.**
1. **Scale.** 12 steps (50, 100–900, 950 and a 350 step for dark-theme hover and ink), built in OKLCH on the lightness curve of the v4.0 blue and gamut-mapped to sRGB. Equal steps give equal contrast across palettes.
2. **Hue.** Chosen to sit as far from the status hues as the name allows: Red 12 (crimson), Green 162 (emerald), Yellow 90 (gold).
3. **Role mapping.** Light theme: fill 500, hover 600, pressed 700, selected 50, strong fill 100, muted chart 200, sidebar 500. Dark theme: fill 400, hover 350, pressed 300, sidebar 800, muted chart 900.
4. **Ink.** Chosen per palette so text clears contrast **and** stays at least ΔE 10 from every status colour:

| Palette | Light fill / ink | Dark fill / ink | Text on fill | Sidebar light / dark |
|---|---|---|---|---|
| Blue | `#1258B5` / `#1258B5` | `#4C9AE8` / `#6DAEEC` | White / navy | `#1258B5` / `#082F67` |
| Red | `#A32444` / `#74112C` (wine) | `#DD6E7F` / `#F8A7B0` | White / navy | `#A32444` / `#5C1023` |
| Green | `#016E4A` / `#014C32` | `#48AC80` / `#BEE2CF` | White / navy | `#016E4A` / `#013C27` |
| Yellow | `#D6BF7F` / `#5C4801` | `#D6BF7F` / `#E5D7B2` | Dark Blue / navy | `#F0E8D4` (dark text, primary logo) / `#332701` |

Yellow is special. Real yellow only exists when light, so its fills are light and carry Dark Blue text, while its ink, focus ring and chart accent use the dark gold 600 step.

**Safeguards where a fill sits near a status colour** (implemented in `ksap-theme.css` and declared in `palettes.json`):

| Palette | Collision (ΔE) | Safeguard |
|---|---|---|
| Red | Fill vs Breached, 5.8 light / 4.7 dark | Destructive buttons render outlined (danger text and border, plus icon), so a red primary action never looks like deletion. Links and focus use wine red, ΔE 14.9 from danger |
| Green | Fill vs On time, 1.9 light / 6.6 dark | On time always shows a dot and the word. Links use deep green (ΔE 11.9). Selected rows carry an ink bar at the start edge, so selection never relies on the green tint. Validate with users before offering Green by default |
| Yellow | Dark fill vs At risk, 8.0 | At risk always shows a dot and the word. Fills carry dark text. The UAT strip keeps its icon and label chip |
| All | — | Info status (in transit, tendered) is fixed blue. The environment strip never changes |

**Enforcement.** `scripts/palettes.mjs` runs before every build and fails when:
- any role misses WCAG AA: button text 4.5:1 on fill, hover and pressed; links 4.5:1 on every surface; selected text 4.5:1; focus, indicators and chart accent 3:1; sidebar labels 4.5:1 and indicator 3:1;
- any ink sits within ΔE 10 of a status colour in either theme;
- any fill does so without a declared safeguard;
- the stylesheet section is out of sync with the JSON.

**Adding a palette:** add it to `palettes.json` with a full scale, both themes and any safeguards, run `npm run palettes`, pass the gate, and register it (EX-07).

### 3.10 Column group colours

Some tables need a set of columns to stand apart from the rest of the data, for example the spot quote columns in SpotDFN. For this there are three alternate tints, **Group A (red family), Group B (green family) and Group C (yellow family)**. A developer picks one per column group. They sit in the colour guideline below Background, Surface and Error, and like those rows they are **fixed in every palette**.

| Role | Token | Group A light / dark | Group B light / dark | Group C light / dark | Use |
|---|---|---|---|---|---|
| Fill | `--ksap-group-*-fill` | `#FEDEE9` / `#371B26` | `#C3F5DE` / `#082C1F` | `#F2E9BB` / `#2B2506` | Body cells |
| Header | `--ksap-group-*-header` | `#FFC7DB` / `#512537` | `#A7EACC` / `#02402C` | `#E7DA9D` / `#3F3500` | Group label and its column headers |
| Edge | `--ksap-group-*-edge` | `#BB4E7F` / `#E68AAF` | `#07835E` / `#54C398` | `#837106` / `#BFAB49` | 3 px line above the group label |
| Ink | `--ksap-group-*-ink` | `#73294B` / `#FCCBDD` | `#00563C` / `#B6E8D1` | `#544701` / `#E5DCAF` | Group label text |

**How they are formed.** OKLCH on hues 355 (rose red), 165 (mint green) and 98 (straw yellow), chosen to sit clear of the status hues and of each other. The obvious choice, the palettes' 50 steps, was rejected: the three were only ΔE 1.4 to 2.5 apart and could not be told apart in a table.

**How to use them.**

```jsx
<TableRow>
  <TableHead colSpan={3} />
  <TableHead group="a" colSpan={2} scope="colgroup">Spot quote</TableHead>
  <TableHead group="b" colSpan={3} scope="colgroup">Contract rate</TableHead>
</TableRow>
<TableRow>… <TableHead group="a" className="text-end">Rate</TableHead> …</TableRow>
… <TableCell group="a">{fmtCurrency(lng, row.spot)}</TableCell>
```

Rules:
- Up to three groups per table. Every group is named by a header cell spanning its columns (`scope="colgroup"`). Colour is never the only signal.
- Keep the same letter for the same meaning across a feature (spot quote is Group A on every SpotDFN screen).
- Groups mark **columns**. Never use them for status, single cells, rows, a second accent, charts or decoration.
- Group cells keep their tint on hover and selection, so a column never breaks. The row shows those states through its other cells, its checkbox and the ink bar at the start edge.
- Status badges inside a group cell gain a 1 px outline in their own colour, so a chip never dissolves into a tint of a similar hue.
- Where two groups touch, a 2 px canvas line separates them.

**Single source and gate.** The groups live in `palettes.json` under `groups` and are generated into the palette section of `ksap-theme.css`. `scripts/palettes.mjs` fails the build when, in either theme:
- body text, secondary text, status text or any palette's link colour misses 4.5:1 on a group fill;
- the group label or secondary text misses 4.5:1 on the header, or the edge misses 3:1;
- a fill is closer than ΔE 4 to the canvas or surface, a header closer than ΔE 3 to its fill, or two groups closer than ΔE 5;
- a fill sits within ΔE 5 of a status tint or a palette's selection tint without the declared safeguard.

Registered as EX-08.

### 3.11 Iconography

Lucide (ISC), 24-unit grid, 2-unit stroke, round caps.

**Icons fill their shape.** The icon box is the container minus its padding. A 36 px icon button carries a 20 px icon with 8 px each side, not a 16 px icon floating in the middle. Use the named sizes only; numeric `size-4` on an icon fails the style gate.

| Utility | Size | Use |
|---|---|---|
| `size-icon-xs` | 12 px | Marks drawn inside a control smaller than 20 px (checkbox tick) |
| `size-icon-sm` | 16 px | Beside caption text: badges, chevrons, sort arrows, field messages, breadcrumbs, the environment strip |
| `size-icon-md` | 18 / 20 / 24 px by density | Default. Inside controls: buttons, inputs, menu and command items, the rail, alerts, list rows, sheet close |
| `size-icon-lg` | 24 px | Standalone icons: notifications, the icon vocabulary |
| `size-icon-xl` | 32 px | Empty states, drawn with a 1.5 stroke so the line stays 2 px |

Library components set these centrally (`[&_svg]:size-icon-md` in Button, menus, Command, Alert; `size-icon-sm` in Badge, Toggle group, small buttons). Apps size an icon only when it stands alone.

**One concept, one icon.** Concept icons come from the vocabulary in `src/lib/icons.js` (`ICON.invoice`), never from a direct Lucide import, so a concept can be redrawn in one place. Generic UI glyphs (chevrons, close, check, search, plus) come straight from `lucide-react`.

**Lookalike concepts get different outlines.** Concepts users confuse must differ in silhouette, not only in a mark inside the same outline: at 16 to 20 px the inner mark is the first detail to disappear.

| Family | Concepts and icons |
|---|---|
| Paperwork | Document `FileText` (page), Invoice `ReceiptText` (torn-edge receipt), Bill of lading `ScrollText` (scroll), Manifest `ClipboardList` (clipboard), Proof of delivery `Signature`, Customs entry `Stamp` |
| Prices and money | Invoice `ReceiptText`, Rate `Tag`, Spot quote `Gavel`, Contract rate `Handshake`, Payment `Banknote` |
| Freight and places | Shipment `Package`, Carrier `Truck`, Container `Container`, Lane `Route`, Stop `MapPin`, Dock or facility `Warehouse` |
| Work | Exception `TriangleAlert`, Import `Upload`, Export `Download`, Scan `ScanLine`, Filter `Filter` |

`scripts/icons.mjs` fails the build when two concepts resolve to the same icon, or a family names a concept that does not exist. Adding a concept: add it to `ICON`, `ICON_LABELS` and, if people could confuse it with another, to a family in `ICON_FAMILIES`.

## 4. Components — library first

**Policy.** Every component comes from an approved library. We do not hand-roll a component that exists in a library. A custom component requires a written exception (§14).

**Primary library: shadcn/ui (MIT)** over **Radix UI** primitives (MIT). shadcn components are copied once into the shared `@ksap/ui` package, kept as close to upstream as possible, and updated from the upstream registry. Apps import from `@ksap/ui`; they never copy or edit component source.

| Need | Use | Engine | Licence |
|---|---|---|---|
| Button, Input, Textarea, Label, Field | shadcn/ui | Radix Slot, Label | MIT |
| Checkbox, Radio group, Switch, Slider, Toggle group, Select | shadcn/ui | Radix | MIT |
| Tabs, Tooltip, Hover card, Popover, Dropdown menu, Context menu | shadcn/ui | Radix | MIT |
| Sheet (drawer), Alert dialog, Dialog | shadcn/ui | Radix Dialog / AlertDialog | MIT |
| Command palette, Combobox | shadcn/ui Command | cmdk | MIT |
| Toast | shadcn/ui Sonner | sonner | MIT |
| Badge, Alert, Skeleton, Progress, Breadcrumb, Kbd, Empty, Avatar, Table, Separator | shadcn/ui | Radix where applicable | MIT |
| Data table | shadcn/ui Data Table pattern | TanStack Table v8 | MIT |
| Drag and drop, sortable | KSAP `SortableItem` wrapper | dnd-kit | MIT |
| Forms and validation | shadcn/ui Form pattern | react-hook-form + zod | MIT |
| Date picker (when needed) | shadcn/ui Calendar / Date picker | react-day-picker | MIT |
| Charts | shadcn/ui Chart pattern | Recharts | MIT |
| Icons | lucide-react, through the KSAP vocabulary `@/lib/icons` (§3.11) | — | ISC |
| i18n | — | i18next, react-i18next, `Intl` | MIT |

**Reference systems** (study, do not import): Oracle **Redwood** (host compatibility with OTM, see §15), Google **Material 3** (state layers, motion, accessibility), IBM **Carbon** (data tables, skeleton, productive/expressive motion), **Atlassian** (tokens, keyboard), Shopify **Polaris** (voice, empty states), plus Skyscanner Backpack, Nordhealth Nord, Mews MDS and monday.com Vibe from the anti-slop analysis.

**Compositions** (Page header, Panel, Status badge, Empty state content) are assemblies of library components with no new behaviour. They live in `@ksap/ui/patterns`, not in apps.

---

## 5. Styling rules — the overlay overrules

1. **One stylesheet.** Every app imports `ksap-theme.css` and no other styling source. It maps KSAP roles onto the shadcn variable contract (`--background`, `--primary`, `--border`, `--ring`…) and adds weight and motion to library components through `[data-slot="…"]` selectors and library attributes (`[data-sonner-toast]`, `[cmdk-item]`, `.recharts-*`).
2. **No direct styling in apps.** No `style={{…}}`, no `<style>` blocks, no CSS modules, no styled-components. Exception: geometry computed at runtime (dnd-kit transforms via `SortableItem`, Progress fill, Tabs indicator) inside `@ksap/ui` only.
3. **No arbitrary values**, except references to tokens: `h-[var(--ksap-control-h)]` is allowed; `bg-[#0253e9]`, `p-[13px]`, `rounded-[10px]`, `grid-cols-[2fr_1fr]` and arbitrary properties like `[--x:1px]` are not. Add a named utility instead (§3.6).
4. **Change the library, not the app.** A visual change is a change to `ksap-theme.css` or a new `cva` variant in `@ksap/ui`, reviewed by the design system team. Apps pick variants; they do not override them with `className`.
5. **App `className` is for layout only**: flex/grid, gap, margin, width, responsive visibility, and token text colours.

**Enforcement (merge-blocking):** `scripts/check-styles.mjs`, `scripts/palettes.mjs` and `scripts/icons.mjs` run before every build (`npm run build` = the three gates + Vite) and in CI (`npm run check`). The style gate fails on:

| Rule | Catches |
|---|---|
| `arbitrary-value` | Any bracketed value that is not `var(--…)` |
| `arbitrary-property` | `[--name:value]` in markup |
| `deleted-utility` | `font-bold`, `text-sm`, `shadow-lg`, `rounded-xl` and the rest of the deleted scales |
| `inline-style` | `style={…}` outside `src/components/ui/` |
| `hard-coded-copy` | Literal labels, aria-labels, placeholders, titles, JSX text or toast text on product surfaces |
| `icon-size` | Numeric sizes on icons (`size-4`, `[&_svg]:size-4`); use `size-icon-*` (§3.11) |
| `formatting-tell` | Spaced em-dash labels, middle-dot meta strings, trailing arrows |

A documentation example may end with `// ksap-allow: <reason>`; nothing else is exempt.

Add `eslint-plugin-jsx-a11y` and `react/forbid-dom-props: [style]` to the shared ESLint config.

---

## 6. Weight — how interaction feels

"Weight" means every action has a physical, honest response.

- **Press:** buttons move down 1 px; the primary button's bottom inner shadow flips to a top inner shadow. Feedback within 100 ms.
- **Structure:** a coloured navigation rail (the user's sidebar palette, §3.9) carries the logo and anchors every screen. Headings are 600; body is 400; there is no in-between.
- **Borders that hold:** control borders at 3:1 contrast (EX-03), not faint hairlines.
- **Loading is a system:**

| Wait | Show |
|---|---|
| Under 300 ms | Nothing (a flash reads as a bug) |
| Shape known, over 300 ms | Skeleton matching the final layout (rows, bars, avatars) |
| Unknown, under 3 s | Inline spinner in the control that started it |
| Percentage known | Determinate progress bar with a count ("6,400 of 10,000 rows") |
| Reversible mutation | Optimistic update + Undo toast |
| Money, carrier tender, cancellation, anything irreversible | Honest loading button — wait for the server, never fake success |

- **Buttons while working** keep their width, show a spinner, set `aria-busy`, and ignore repeat clicks. Never confuse disabled with loading.

---

## 7. UX principles → patterns

### 7.1 Intuitive use
One primary action per surface, placed last (bottom-end of forms, top-end of page headers). Labels name outcomes ("Tender to carrier (3)", "Create shipment"), never "Submit" or "OK". Destructive actions sit apart from confirming ones.

### 7.2 Drag and drop where relevant
Use dnd-kit. Relevant here means: assigning loads to doors/carriers, reordering stops or priorities, moving cards between states, file upload. Every drag must:
- show three "holding" signals: grab cursor, lifted overlay, faded source;
- light up valid drop zones as soon as the drag starts, and refuse invalid ones visibly (red zone + toast explaining why, e.g. capacity);
- be fully keyboard-operable (Space pick up, arrows move, Space drop, Esc cancel) with screen-reader announcements;
- offer Undo for 5 seconds after the drop.

### 7.3 Keyboard shortcuts and sequencing

| Keys | Action |
|---|---|
| `Ctrl`/`⌘` + `K` | Search / command palette |
| `?` | Show shortcuts |
| `G` then `H` / `S` / `B` | Go to Start / Shipments / Dispatch board |
| `N` | New shipment |
| `/` | Focus the page filter |
| `Enter` | Open focused row |
| `X` | Select focused row |
| `Esc` | Close the top panel or step back |

Rules: single-key shortcuts never fire while typing; sequences time out after 1.2 s; every shortcut is shown next to its action (menu, tooltip, palette); focus order matches visual order.

### 7.4 Navigation, breadcrumbs and browser Back
- Persistent left rail on desktop (≥1024 px); a menu sheet on smaller screens.
- Breadcrumbs in the top bar whenever a page is two or more levels deep: workspace › section › record.
- **Back means "previous action".** History policy:

| Event | History |
|---|---|
| Change page | push |
| Open a record panel, drawer or flow step | push (so Back closes it / returns a step) |
| Filter, sort, search text, tab switch, pagination | replace (state lives in the URL, but Back doesn't replay keystrokes) |
| Close a pushed panel with its close button | `history.back()` — button and Back behave identically |

Every view state that matters is in the URL, so links and refresh restore it. Restore scroll position on Back.

### 7.5 Built-in help
Three layers: field-level (helper text under fields; `?` tooltip for one sentence more), page-level (Help sheet from the top bar, content authored per page), and system-level (shortcuts sheet, command palette "Help" group, full guide link, contact support). First-run guidance uses a short setup checklist on Start, not coach-mark tours.

### 7.6 Validation and input controls
- Prefer controls that can't be wrong: Select/Combobox over free text, the Date Picker with a minimum date and presets (Tomorrow, In 2 days, Next Monday, In a week; two months side by side on wide screens; full keyboard control), Slider for bounded quantities, masks for known formats (`PO-####`, weights digits only), uppercase coercion for codes.
- **Validate on blur**, then live once a field has been touched (react-hook-form `mode: "onTouched"`).
- Errors = colour + icon + message that hands over the fix ("Use PO- followed by 4 to 8 digits, like PO-48213").
- Confirm correct fields in place (green check under the field), not with a toast.
- Filter dependent options (hazmat on → only certified carriers).
- Keep buttons live instead of disabling them: "Continue" validates the step and focuses the first blocking field; a type-to-confirm button explains what is missing and focuses the field. Unavailable steps (Previous on page 1) are hidden, not disabled.
- Multi-step flows chunk by context, show progress, and save a draft on every step.

### 7.7 Comprehensive search
- Global command palette (`Ctrl/⌘+K`): recent items on open, then records, actions, pages, help; fuzzy match with the matched letters highlighted; each result shows type and status.
- Page filters accept plain text plus scoped syntax: `status:at_risk carrier:KNIG lane:4423`.
- Filter chips show live counts; a "Clear N filters" button appears beside them whenever filters are active; "Select all N matching" follows the filter.
- Zero results always suggests what to try and offers one action ("Clear all filters").

### 7.8 Consistency of meaning

| Meaning | Always shown as |
|---|---|
| On time / healthy | Green dot + "On time" |
| At risk | Amber dot + "At risk" |
| Breached / destructive | Red dot or icon + words. Red is spent on nothing else, except the pale Group A column tint, which is always named by its header (EX-08) |
| In progress / tendered | Blue dot + words |
| Neutral / delivered / unassigned | Grey dot + words |
| Selected | Palette 50 tint plus an ink bar at the start edge |
| Primary action | Palette fill with its text colour (Action Blue by default) |
| Column group | Group tint on the columns plus a spanning header that names the group (§3.10) |
| A concept (invoice, lane, carrier) | Its icon from the vocabulary, on every screen (§3.11) |

Never colour alone. Same word for the same action through the whole flow: the button says "Tender", the toast says "tendered".

### 7.9 Fewer clicks
Bulk selection and actions on every list; inline row actions on hover/focus; smart defaults (persona, last-used facility); search that navigates directly to records; keyboard for everything; no confirmation for reversible actions.

### 7.10 Confirmations only for the irreversible
The **Alert dialog is the only modal** in the system. It is used when an action cannot be undone (cancel a shipment, delete an integration, revoke access). It requires typing the record name, uses verb buttons ("Cancel shipment" / "Keep shipment"), and writes an audit entry. Everything else: do it immediately and offer **Undo** in a toast (10 s for bulk actions, 5 s for single).

### 7.11 Persona support, visually
Personas: Dispatcher, Planner, Finance analyst, Administrator. The top bar always shows who you are viewing as (avatar + role). Persona changes defaults, not permissions: Start page title and quick actions, default visible columns (finance sees cost, dispatch sees weight), default sort. Personas never change colours or the accent.

### 7.12 Environment, visually
| Environment | Treatment |
|---|---|
| Production | Calm: no banner; a small neutral "Production" badge in the top bar |
| UAT / test | 32 px amber strip across the top, persistent on every page: "UAT environment. Data is test data and resets every night at 02:00." Title prefixed `[UAT]` |
| Development | 32 px blue-gray strip with white text; title prefixed `[Development]` |

The strip is sticky, cannot be dismissed, and sits above everything except overlays. Use a distinct favicon per environment where the host allows.

---

## 8. States matrix (spec before you build)

No screen or component is done until each row has a designed answer.

| State | Rule |
|---|---|
| Loading | §6 loading table. Skeleton shape = final layout |
| Empty — first run | Explain what the thing is, one primary action ("Load demo data") |
| Empty — no results | Echo the query, suggest alternatives, one action |
| Empty — filtered out | Say how many exist and which filter hides them, "Clear all N filters" |
| Error | Typed (validation / network / server / permission). Say what happened, what's safe, what to do. Always a way out (Retry, trace ID) |
| Success | Confirm in place (field check, row update, inline alert). Toast only for background completion |
| Offline | A status pill in the top bar is the truth: "All changes saved", "Offline. 3 changes queued", "Syncing 3 changes". Edits queue on the device, drain oldest first on reconnect, and never overwrite silently |
| Partial | Unknown values are "—" with an explanation on hover; never fake zeros |

Toast contract: info 4 s, warning 7 s, error sticky until dismissed; max 3; bottom-end corner on desktop, top on phones, never centred; always dismissible; left border coded by type plus icon.

Every data view also designs its **load failure**: what failed, that the user's filters are kept, a trace ID, and Retry.

---

## 9. Data display

- Numbers right-aligned, text left-aligned; tabular figures; never truncate numbers.
- Currency, numbers, dates and relative times through `Intl` for the active locale. Relative time for recent/near ("in 3 hours"), absolute beyond 3 days ("Sep 27"), full timestamp on hover.
- Tables: one hairline between rows (no zebra), header and identity columns pinned, row height from density, sort arrow only on the active column with `aria-sort`, per-row actions in one menu revealed on row hover or focus (always visible on touch) with destructive last, tri-state header checkbox, Shift+click range selection, keyboard row focus, page number in the URL, scroll position restored on Back.
- Column groups (§3.10) mark up to three sets of related columns with Group A, B or C and a spanning header. They never mark status.
- Missing values are a dash with the reason on hover or focus ("Weight not reported by the carrier yet"), never a zero.
- Phones: tables restructure into two-line rows (identity + value, then status + due); tap opens the full record.
- Charts: bars start at zero; one accent (the palette's chart accent) for the point, the rest the palette's muted series; label directly, no legend when avoidable; every chart has a "Show as table" toggle; no 3D, no gradients, no drop shadows.
- Dashboards: one hero metric large, others subordinate. Comparisons name the period ("vs. the previous 7 days"). Sparklines over "+12.5%" badges.

---

## 10. Voice and copy

KSAP speaks like an experienced operations lead: calm, precise, helpful. Plain verbs, sentence case, no filler, no emoji, no exclamation marks, 8th-grade reading level (the audience is global and often non-native).

| Instead of | Write |
|---|---|
| Submit / OK | Create shipment / Tender to carrier (3) |
| An error occurred | Export stopped at row 2,048 of 5,000. The invoice service timed out. |
| Are you sure? | Cancel shipment SHP-88214? The carrier is released. This cannot be undone. |
| No data | No lanes yet. Lanes are the routes your freight moves on. |
| Welcome back, Dana 👋 | What needs you this shift. Atlanta DC, day shift. Data refreshed 2 minutes ago. |
| See more | Go to shipments |

Formatting tells to avoid (they read as generated): all-caps eyebrow labels, "A · B · C" middle-dot meta strings, "Word — fragment" labels, "→" appended to buttons, numbered markers on things that aren't sequences, accenting one word of a headline.

---

## 11. Multi-lingual support

- Every product string lives in i18next resources (`t('ship.tender')`), never in JSX. Keys are stable, namespaced, and flat.
- Plurals use i18next suffixes (`_one`, `_other`, plus `_zero`/`_two`/`_few`/`_many` where the language needs them — Arabic uses all six). Always provide a base key as fallback.
- Interpolate values; never concatenate sentence fragments.
- Format numbers, currency, dates, relative times and lists with `Intl` for the active locale.
- **RTL:** set `dir` on `<html>`. Use logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `border-s`). Flip directional icons (chevrons, arrows) with `.ksap-flip-rtl`; never flip logos, checkmarks or media controls. Numeric charts stay LTR.
- Text expansion: layouts must survive +35% (German, Finnish). The **pseudo-locale** (accents + 35% padding) is a shipping QA language; every screen is checked in it.
- Shipping locales in the reference build: English, Spanish, Arabic (RTL), Pseudo.
- Fonts per script: Montserrat (Latin, Cyrillic, Vietnamese); Noto Sans Arabic; add Noto Sans Hebrew / JP / SC / KR as markets are added.

---

## 12. Multi-browser support

| Browser | Versions | Support |
|---|---|---|
| Chrome, Edge | Last 2 | Full |
| Firefox | Last 2 + ESR | Full |
| Safari macOS / iOS | Last 2 (16.4+) | Full |
| Samsung Internet | Last 2 | Best effort |
| Internet Explorer, legacy Edge | — | Not supported |

- Build target: `chrome111, edge111, firefox113, safari16.4` (supports OKLCH, `:has()`, container queries, `dvh`, logical properties).
- Emit hex for colour tokens; compute scales in OKLCH offline.
- Radix and dnd-kit handle pointer, touch and keyboard differences — another reason not to hand-roll.
- Guard hover-only affordances with `@media (hover: hover)`; never hide primary actions behind hover on touch.
- Honour `prefers-color-scheme`, `prefers-reduced-motion` and `forced-colors` (Windows High Contrast).
- CI: Playwright runs every component story and key flow in Chromium, Firefox and WebKit, in light, dark, RTL and pseudo-locale.

---

## 13. Accessibility floor (WCAG 2.2 AA, merge-blocking)

2 px focus ring with offset and 3:1 contrast on every surface (`:focus-visible`); skip link; DOM order = visual order; focus trapped in overlays and returned to the trigger; 44 px effective targets; text contrast 4.5:1 (secondary text 7.45:1 on white); control boundaries 3:1; status never by colour alone; live-region announcements for toasts, copy and drag-and-drop; keyboard-complete sliders, menus, comboboxes, tables and drag-and-drop; `aria-busy` on loading regions. Accessible components don't guarantee accessible pages — test the whole journey.

---

## 14. Exceptions register

| ID | Exception | Reason | Owner | Review |
|---|---|---|---|---|
| EX-01 | Body text 13–14 px in Compact and Standard density | Brand minimum body is 16 px; operators scan dense tables all shift. Relaxed density meets 16 px | Brand owner | 2027-03-31 |
| EX-02 | IBM Plex Mono for IDs, codes and logs | Brand defines no monospace; IDs must be character-exact | Brand owner | 2027-03-31 |
| EX-03 | Control border `#8693A5` | LG-Border is 1.2:1; WCAG 1.4.11 needs 3:1 | Accessibility lead | Permanent |
| EX-04 | Status colours green / amber / red | Semantic, always with icon or text; not accents | Design system team | Permanent |
| EX-05 | Environment strip amber (UAT) / blue-gray (Dev) | Non-production must be unmistakable | Design system team | Permanent |
| EX-06 | Product blue scale from v4.0 (action `#1258B5`) instead of brand Vivid Blue `#0253E9` | Product decision to keep the v4.0 blues. The two differ visibly (ΔE 7.3); Vivid Blue stays for logo and marketing contexts | Brand owner | Sign-off pending |
| EX-07 | Accent palettes Red, Green and Yellow as a user preference for every accent role | Status colours fixed; safeguards declared per palette and enforced by the palette gate (§3.9) | Brand owner | Sign-off pending |
| EX-08 | Column group tints A (red family), B (green) and C (yellow) | Tables such as SpotDFN must set some columns apart from the rest. Pale tints only, always with a spanning header label; badges inside keep an outline; checked by the palette gate (§3.10) | Design system team | 2027-03-31 |

To add one: state the need, prove no approved library covers it, name an owner and a review date, and build it from the same tokens. Unregistered deviations are defects.

---

## 15. Oracle Redwood / OTM bridge

KSAP screens embed in or sit beside Oracle Transportation Management, which uses Oracle's Redwood system (Oracle JET, `--oj-*` variables). When embedded:

- Map the host's Redwood variables onto KSAP roles in a bridge block of `ksap-theme.css` (e.g. `--oj-core-text-color-primary → --ksap-text`), rather than restyling components.
- Keep KSAP typography and accent inside KSAP surfaces; don't restyle host chrome.
- Match Redwood's interaction conventions where users cross between the two (Esc closes, drawers from the end edge, breadcrumbs format).
- Test inside the OTM iframe for focus handling, `history` behaviour and scroll containment.

---

## 16. Anti-slop audit — run before every release

A screen ships only if it passes all ten. Record the evidence per screen, not as a blanket pass; the Governance page of the reference library shows the format.

1. **Gradient** — no gradients in product UI.
2. **Type** — Montserrat 400/600 only; Plex Mono only on IDs; no Inter, no default weights.
3. **Cards and icons** — icons at named sizes and from the vocabulary (§3.11); no pastel or tinted icon tiles (empty states use a plain icon); no identical card grids unless the items are true peers; bordered, not shadowed; radius follows size.
4. **Hierarchy** — the eye lands once per screen: one hero, the rest subordinate.
5. **States** — loading, empty (4 kinds), error, success, offline, partial all designed; skeleton matches layout.
6. **Numbers** — tabular, right-aligned, `Intl`-formatted, periods named.
7. **Copy** — outcome labels, errors with the fix, no "Submit" / "An error occurred", no formatting tells (§10).
8. **Tokens and copy** — `npm run check` passes: style, palette and icon gates (§5).
9. **Accessibility** — §13 checks pass in Chromium, Firefox and WebKit.
10. **Motion** — within the §3.8 budget; bounce only for SLA-breach attention.

Subtractive test: if you could swap the accent for any other colour, or silently revert the font to Inter, and nobody noticed — the decision was never made. Fix it.

---

## 17. Instructions for AI coding agents and prototypes

When you generate a KSAP screen:

1. Read this file completely before writing code.
2. Import components from `@/components/ui/*` (the reference library). Do not create new components, do not edit components, do not restyle them with `className` beyond layout.
3. Import `ksap-theme.css` once. Write no CSS. Use only the utilities in §3 (they are the only ones that exist). Use `bg-primary` only for fills that carry text; use `primary-ink` for links, lines and indicators; never use status colours as the accent or the accent as a status (§3.9). To set columns apart, use `group="a" | "b" | "c"` on table cells with a spanning header (§3.10). Take concept icons from `@/lib/icons` and size icons with `size-icon-*` (§3.11).
4. Put every user-facing string in the i18n resources. Use `Intl` via `@/lib/format`.
5. Before coding a screen, list: the persona, the primary action, the worst mistake a user could make here, and all states from §8. Build every state.
6. Use the history policy in §7.4 via `useRoute()` (`navigate`, `setParams`, `openOverlay`, `closeOverlay`).
7. Use Undo, not confirmation, unless the action is irreversible (§7.10).
8. Use real domain content (shipments, lanes, SCACs, docks). Never lorem ipsum, never "Welcome back 👋", never "+12.5%".
9. Run `npm run check`, then §16 on your output. Report any item that fails, with the reason.
10. If something you need is missing, stop and propose an exception (§14). Do not improvise.

---

## Appendix A — Project layout (reference library)

```
ksap-ui/
  DESIGN.md                 ← this file
  scripts/check-styles.mjs  ← style and copy gate (runs before every build)
  scripts/palettes.mjs      ← palette and column-group generator and gate: contrast, status distance, sync
  scripts/icons.mjs         ← icon vocabulary gate: one concept, one icon
  src/styles/palettes.json  ← palette and column-group source of truth
  src/lib/icons.js          ← icon vocabulary (concept → Lucide icon, families)
  index.html                ← viewport-fit=cover, font links
  vite.config.js            ← browser targets, single-file demo build
  src/
    styles/ksap-theme.css   ← THE common stylesheet (tokens, lock, named utilities, overrides)
    components/ui/          ← shadcn/ui components (library layer; do not edit in apps)
    lib/                    ← cn(), router (history + scroll policy), i18n, Intl formatters
    app/                    ← shell: env strip, rail, top bar, breadcrumbs, palette, help,
                              sync.jsx (offline queue + status pill)
    pages/                  ← Start, Shipments, Dispatch board, New shipment,
                              Components, Foundations, Governance
    data/mock.js            ← deterministic logistics mock data
```

## Appendix B — Changes from v4.0

| v4.0 | v5.0 |
|---|---|
| IBM Plex Sans, weights 400/500/600/700 | Montserrat 400/600 (brand); Plex Mono for IDs only |
| Accent `#1258B5` (unregistered) | Accent `#1258B5` and the v4.0 blue scale kept as registered exception EX-06; Vivid Blue reserved for brand contexts |
| Hexagon mark | Official KSAP wordmark, primary or reversed to suit the sidebar palette |
| 26 hand-rolled primitives in raw CSS | shadcn/ui + Radix and approved libraries; zero hand-rolled |
| Inline styles throughout the spec | One common stylesheet; inline styles blocked in CI |
| Tailwind-style defaults available | Default palette, weights, radii, shadows deleted |
| 36 declarations below 12 px; 13 px body | 12 px floor; density-driven body (EX-01) |
| "Gradients banned, no exceptions" | Brand gradients are marketing-only tokens |
| Control borders 1.72:1 | 3.1:1 (EX-03) |
| All-caps eyebrows, middle-dot meta strings | Sentence case; no formatting tells |
| No i18n / RTL | i18next + Intl, RTL via logical properties, pseudo-locale QA |
| No breadcrumbs, no history policy | Breadcrumbs + push/replace policy; Back closes panels |
| No drag and drop | dnd-kit, keyboard-complete, undo |
| Cmd+K only | Palette + scoped search syntax + shortcuts sheet + sequences |
| No persona or environment treatment | Persona switcher and defaults; UAT/Dev strips, calm production |
| No built-in help | Field, page and system help layers |
| No enforcement | Style and copy gate blocks the build (§5) |
| No offline or failure states | Offline queue with status pill; load-failure state with Retry |
| Single fixed accent | Accent palettes (Blue, Red, Green, Yellow) under Display settings, generated from one JSON file and gated for contrast and status distance |

## Appendix C — Changes in 6.1

Source: review with the larger innovation group.

| Feedback | 6.1 |
|---|---|
| Iconography: larger size, use the full shape | Named icon sizes `size-icon-xs` to `-xl`; default inside controls up from 16 to 20 px (18 / 20 / 24 by density); library components sized centrally; numeric icon sizes blocked by the style gate (§3.11) |
| Different icons for similar concepts, such as Document and Invoice | Icon vocabulary `src/lib/icons.js`: one icon per concept, lookalike concepts get different outlines (Document is a page, Invoice a torn-edge receipt); icon gate blocks duplicates; existing mismatches fixed, such as the lane empty state that used the shipment icon (§3.11) |
| Add Red, Green and Yellow palettes next to Blue | Already shipped in 6.0 (§3.9). Foundations now also shows each palette as a Material-style colour guideline |
| Group A, B and C with red, green and yellow variants below Background, Surface and Error, for columns that must stand apart (SpotDFN) | Column group colours, fixed in every palette, placed in the guideline below Background, Surface and Error; `group` prop on `TableHead` and `TableCell`; contrast and distance checked by the palette gate; registered as EX-08 (§3.10) |

