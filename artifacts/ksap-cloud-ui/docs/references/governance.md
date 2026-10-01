# Source governance

These checks are source guards, not a substitute for reviewing the rendered
design. Their authored inputs are `DESIGN.md` and `tokens.json`; gates never
write or repair those inputs.

## Commands

Run from the KSAP Cloud UI project root:

```sh
node scripts/check-styles.mjs
node scripts/check-styles.mjs --app ../my-app/src
node scripts/check-styles.mjs --path src/features/dispatch
node scripts/palettes.mjs
node scripts/icons.mjs
```

The style gate defaults to `src/`; `--app`, `--path`, or a positional path
scans a supplied application subtree. The scanner uses TypeScript's AST when
TypeScript is resolvable in the environment and a dependency-free TSX/JSX
fallback otherwise. Product copy is checked in JSX text, literal accessible
labels, placeholders, titles, and toast calls. It also checks deleted Tailwind
scales, arbitrary utility values/properties, numeric icon sizes, inline
styling, CSS modules, and the formatting tells in DESIGN.md §10. The UI
component directory (`src/components/ui/`, the retained primitive source scope)
has only the approved inline geometry exception described by DESIGN.md §5.
Sortable-item runtime transform/transition and Progress's `value == null`
conditional `translateX` transform are allowed there, along with narrowly
defined chart indicator styles. The generated `<style>` block is allowed only
in ChartStyle in `src/components/ui/chart.tsx`. These exceptions do not apply
to application files or arbitrary UI styles.
Ordinary CSS, SCSS, Sass, and Less files are scanned too. The canonical
`src/index.css` is the shared theme source and owns its documented
`@source "./components";` registration. In an application scan, a root
`index.css` is allowed only when it contains the single shared-theme import
`@import "@workspace/ksap-cloud-ui/styles.css";`. CSS modules and all other
custom stylesheets, including primitive-local stylesheets, are rejected.
The reference browser's `src/preview/` demonstrations are documentation
surfaces, so their authored explanatory copy is not treated as product i18n
copy; styling rules still apply there.
Arbitrary values/properties and deleted-utility checks run only on class strings
in `className`/`class` attributes or `cn`, `cva`, `clsx`, and `cx` calls. The
scanner checks literal strings and static template segments, not interpolated
JavaScript expressions elsewhere in a template. Bracketed selector variants
such as `data-[state=checked]` and `[&>*]` are distinguished from bracketed
CSS values; arbitrary declarations/values remain blocked, with exact
`var(--token)` or `--token` references accepted. Raw hex and dot-decimal
arbitrary values are rejected.

An intentional documentation example can be annotated on the same line or
immediately before it with `// ksap-allow: <reason>`. The exemption is honored
only in a `docs/` source path or MDX; it does not exempt product files.

The palette gate reads `$extensions["com.ksap.cloud"]` directly. Explicit
palette values remain source anchors. For omitted Red, Green, and Yellow
interaction roles it derives hover, pressed, and selected values using the
same OKLCH blue lightness curve and gamut mapping as the theme generator. The
gate prints every such derived value but never writes one back to tokens or
the generated theme. Its accessibility checks cover action / hover / pressed
fills, link and focus ink on canvas/card/surface, selected text, rail labels
and indicators, all group text/link pairs, and group pair distances. ΔE is
Euclidean OKLab distance scaled by 100.

The palette calculation also exposes the generated `strong` and `chartMuted`
roles. Their explicit Blue anchors are `#DBEAFE` / `#152A49` for strong
(light / dark), and `#BFDBFE` / `#10284A` for chart muted. Non-Blue strong
uses the corresponding light step 100 / dark step 800; non-Blue chart muted
uses light step 200 / dark step 900. Strong-fill body-text contrast is checked;
chart-muted is a non-text chart series and is reported without inventing a
text-contrast requirement.

## Source anchors, derivations, and declared exceptions

### Palette-role source gaps

DESIGN.md §3.9 gives exact non-Blue palette fills, ink, rail and on-fill
anchors, but not exact non-Blue hover, pressed or selected hex values. These
are intentionally derived from each palette fill along the documented Blue
lightness curve. The gate reports derived outputs, not new authoritative
anchors. Blue interaction values that are explicitly present in `tokens.json`
remain exact, as do the source `selected` and `selectedFg` values.

### Fixed Blue Info identity

Info is expressly fixed Blue while the default Blue palette also uses Blue.
The source therefore makes light Info and Blue action fill/ink identical
(`#1258B5`, ΔE 0) and dark Info and action fill identical (`#4C9AE8`, ΔE 0).
Dark Blue action ink `#6DAEEC` is ΔE 6.6 from dark Info. This intentionally
exempts only Blue-versus-Info from §3.9's general ΔE 10 action-ink/status
separation rule; it does not move or recolor either source anchor.

### Palette fill / status safeguards

The source's named safeguards are required when the palette fill approaches a
status colour. The checked source distances and safeguards are:

| Palette and mode | Fill / status | ΔE | Declared safeguard |
|---|---|---:|---|
| Red, light | Action / danger | 5.8 | Destructive actions are outlined in danger colour. |
| Red, dark | Action / danger | 4.7 | Destructive actions are outlined in danger colour. |
| Green, light | Action / success | 1.9 | Success retains a dot and word; selected rows retain an ink bar. |
| Green, dark | Action / success | 6.6 | Success retains a dot and word; selected rows retain an ink bar. |
| Yellow, dark | Action / warning | 8.0 | At-risk status retains a dot and word; the UAT strip keeps icon and label. |

The Blue / Info identity above is the corresponding fixed-status exception.
Each exception is encoded by exact palette, mode, status key, and both source
hex values in the gate; an unlisted or changed close pairing fails instead of
receiving a broad palette exemption.

### Column-group tint proximity

DESIGN.md §3.10 sets a ΔE 5 separation from status / selection tints while
also prescribing safeguards for those same cases. The current source has these
sub-threshold pairs:

| Group / mode | Nearby source tint | ΔE | Specific §3.10 safeguard |
|---|---|---:|---|
| A, light | Danger subtle `#FBEAE9` | 3.1 | A status badge in a group cell has a 1 px outline in its status colour. |
| B, light | Success subtle `#E7F5EC` | 5.0* | A status badge in a group cell has a 1 px outline in its status colour. |
| C, light | Warning subtle `#FCF1DC` | 4.5 | A status badge in a group cell has a 1 px outline in its status colour. |
| A, light | Red selection tint (derived) `#FFF2F3` | 4.8 | Group cells retain their tint; row selection appears in other cells and the start-edge ink bar. |
| A, dark | Red selection tint (derived) `#282337` | 4.4 | Group cells retain their tint; row selection appears in other cells and the start-edge ink bar. |
| B, dark | Green selection tint (derived) `#132C37` | 4.8 | Group cells retain their tint; row selection appears in other cells and the start-edge ink bar. |

`*` The displayed 5.0 is rounded; the source calculation is slightly below
the strict threshold, so it is explicitly listed and safeguarded. These
exceptions are exact group/mode/tint pairs. Group fill, selection or status
anchors are not silently adjusted to clear the distance rule.

## Icon vocabulary

`src/lib/icons.tsx` is the concept-to-Lucide boundary from DESIGN.md §3.11.
`scripts/icons.mjs` checks that each source concept has exactly one unique
Lucide symbol and label, that all vocabulary keys agree, and that every family
references an existing concept. A concept such as Invoice can appear in more
than one family; it remains one vocabulary entry and one icon.

## Portable formatting

`src/lib/format.tsx` requires the active locale on every helper call and
delegates to `Intl.DateTimeFormat` / `Intl.NumberFormat`. Callers provide the
locale from i18next and the ISO currency code for monetary values. There is no
implicit application locale or fixed-locale fallback.