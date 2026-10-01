# Input build reference

Source: retained DESIGN.md, line 299; token contract lines 75–176; component policy lines 291–340; interaction/accessibility lines 346–548.

## Source evidence
| Button, Input, Textarea, Label, Field | shadcn/ui | Radix Slot, Label | MIT |
| Checkbox, Radio group, Switch, Slider, Toggle group, Select | shadcn/ui | Radix | MIT |

Implementation: approved shadcn/ui scaffold with the documented behavior engine. Preserve primitive semantics; apply KSAP theme centrally. Approved implementation license: MIT.

Public module: src/components/ui/input.tsx (implemented only in its assigned chunk).
Dependencies: none.
Importance: documented component order in DESIGN.md. Chunk: 1.

Variants and states: default, invalid, disabled and read-only; density-responsive control height.

Visual contract: Montserrat 400/600 only; 12px floor; 4px spacing grid; 3/6/12px corner scale; controls use 30/36/44px density heights; 3:1 control borders; 2px ink focus ring. Fill uses action, indicators use action-ink. Fixed status colors are not accent colors. Dark theme is source-defined, not inverted.

Behavior: retain library keyboard/focus/disabled/controlled behavior. Buttons under loading retain width, expose aria-busy and reject repeat presses. Reduced motion is instant. Effective targets are at least 44px. Do not invent missing behavior to make previews look complete.

## Verified pilot evidence

Approved scaffold implementation was inspected before theming. Live implementation: src/components/ui/input.tsx. Family story: src/preview/demos/input.tsx. Shared CSS source: scripts/ksap-theme.mjs; generated through scripts/build-tokens.mjs. Native/Radix behavior and forwarded props are retained. The source-backed fidelity checklist is docs/references/pilot-checks.md. Status: implemented for pilot review.
