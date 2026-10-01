# Sheet build reference

Source: retained DESIGN.md, line 302; token contract lines 75–176; component policy lines 291–340; interaction/accessibility lines 346–548.

## Source evidence
| Sheet (drawer), Alert dialog, Dialog | shadcn/ui | Radix Dialog / AlertDialog | MIT |
| Command palette, Combobox | shadcn/ui Command | cmdk | MIT |

Implementation: approved shadcn/ui scaffold with the documented behavior engine. Preserve primitive semantics; apply KSAP theme centrally. Approved implementation license: MIT.

Public module: src/components/ui/sheet.tsx (implemented only in its assigned chunk).
Dependencies: Dialog.
Importance: documented component order in DESIGN.md. Chunk: 4.

Variants and states: end-edge drawer, closed and open.

Visual contract: Montserrat 400/600 only; 12px floor; 4px spacing grid; 3/6/12px corner scale; controls use 30/36/44px density heights; 3:1 control borders; 2px ink focus ring. Fill uses action, indicators use action-ink. Fixed status colors are not accent colors. Dark theme is source-defined, not inverted.

Behavior: retain library keyboard/focus/disabled/controlled behavior. Buttons under loading retain width, expose aria-busy and reject repeat presses. Reduced motion is instant. Effective targets are at least 44px. Do not invent missing behavior to make previews look complete.
