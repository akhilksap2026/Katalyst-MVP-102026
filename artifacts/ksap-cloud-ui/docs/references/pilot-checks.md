# KSAP source-backed pilot checks

Authoritative source: retained `DESIGN.md` version 6.1.

## Pilot scope and implementation evidence

| Family | Approved seed and live implementation | Story | Source requirements checked |
|---|---|---|---|
| Button | shadcn Button / Radix Slot; `src/components/ui/button.tsx` | `src/preview/demos/button.tsx` | Six variants, density-sized controls, small and large sizes, icon and link composition, disabled/loading, keyboard focus, 100 ms press feedback, red-palette destruction safeguard |
| Input | shadcn native Input; `src/components/ui/input.tsx` | `src/preview/demos/input.tsx` | Native type/props/ref forwarding, 1.5 px accessible control border, invalid, read-only, disabled, density and ID typography |
| Textarea | shadcn native Textarea; `src/components/ui/textarea.tsx` | `src/preview/demos/textarea.tsx` | Native props/ref forwarding, multiline entry, invalid, read-only, disabled and associated help |
| Label | shadcn Label / Radix Label; `src/components/ui/label.tsx` | `src/preview/demos/label.tsx` | Native association, required semantics, 600 weight and sentence case |
| Field | shadcn Field composition; `src/components/ui/field.tsx` | `src/preview/demos/field.tsx` | Vertical/horizontal/responsive layouts; fieldset/legend/group/content/title/separator; helper text; one/multiple errors; touched validation and valid feedback |

The Radix Separator seed required by Field is retained privately under
`src/components/internal/field-separator.tsx`. This does not ship or register
the independent Separator family early.

## Shared source fidelity

- Action Blue `#1258B5` is separate from brand Vivid Blue `#0253E9`.
- Light canvas `#FFFFFF`, text `#010D43`, secondary text `#43576C`,
  controls `#8693A5`, dividers `#E7EBF3`; dark canvas `#0A172B`.
- Full 32-role portable contract in both light and dark.
- Every supplied palette fill, ink, text-on-fill and rail anchor is retained.
  Blue hover/pressed/selected values are retained exactly. Missing non-blue
  intermediate values follow the specified OKLCH lightness-curve approach.
- Button text and links are contrast-checked for every palette and mode during
  token generation. Complete palette/status separation and group-distance gates
  are part of the remaining palette governance work, not claimed as finished.
- Montserrat 400/600, IBM Plex Mono only for IDs/codes/logs; 12 px floor.
- 4 px spacing; 3/6/12 px radii; bordered panels without shadows.
- Named icon sizes and productive motion; reduced-motion and forced-color rules.
- Overview renders all five pilot families together; each family has a lazy,
  separately linked story with supported states.

## Explicitly pending

Later inventory chunks, full governance/i18n checks and Catalyst migration
follow pilot approval. Planned Catalyst modules, demo sign-in and local data
processing are not changed by this pilot.

## Verification evidence

- Package TypeScript check and production build passed.
- The managed preview workflow starts and serves without errors.
- Main-agent visual checks passed for the desktop Overview, mobile Overview
  and compact dark/Yellow Button story. No render errors were logged.
- Evidence: `screenshots/pilot-desktop.jpg`, `screenshots/pilot-mobile.jpg`
  and `screenshots/pilot-dark-buttons.jpg`.
- Display choices can be shared through preview query parameters, while
  family pages use stable hash links. Product preference persistence remains
  the consuming application's responsibility.