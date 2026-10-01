# KSAP Cloud UI component inventory

Source: user-provided DESIGN.md version 6.1, components section lines 291–316. Spec-seeded build using the approved shadcn/Radix and documented engines. Rank follows documented order. Pilot: Button, Input, Textarea, Label, Field. Later chunks wait for pilot approval. Each dependency must ship in the same or an earlier chunk.

| Family | Reference | Dependencies | Importance evidence | Chunk | Status |
|---|---|---|---|---|---|
| Button | [Build reference](components/button.md) | Radix Slot | DESIGN.md:299 | 1 | implemented — pilot |
| Input | [Build reference](components/input.md) | none | DESIGN.md:299 | 1 | implemented — pilot |
| Textarea | [Build reference](components/textarea.md) | none | DESIGN.md:299 | 1 | implemented — pilot |
| Label | [Build reference](components/label.md) | Radix Label | DESIGN.md:299 | 1 | implemented — pilot |
| Field | [Build reference](components/field.md) | Label + internal Radix Separator helper | DESIGN.md:299 | 1 | implemented — pilot |
| Checkbox | [Build reference](components/checkbox.md) | Radix Checkbox | DESIGN.md:300 | 2 | pending |
| Radio group | [Build reference](components/radio-group.md) | Radix Radio Group | DESIGN.md:300 | 2 | pending |
| Switch | [Build reference](components/switch.md) | Radix Switch | DESIGN.md:300 | 2 | pending |
| Slider | [Build reference](components/slider.md) | Radix Slider | DESIGN.md:300 | 2 | pending |
| Toggle group | [Build reference](components/toggle-group.md) | Radix Toggle Group | DESIGN.md:300 | 2 | pending |
| Select | [Build reference](components/select.md) | Radix Select | DESIGN.md:300 | 2 | pending |
| Tabs | [Build reference](components/tabs.md) | Radix Tabs | DESIGN.md:301 | 3 | pending |
| Tooltip | [Build reference](components/tooltip.md) | Radix Tooltip | DESIGN.md:301 | 3 | pending |
| Hover card | [Build reference](components/hover-card.md) | Radix Hover Card | DESIGN.md:301 | 3 | pending |
| Popover | [Build reference](components/popover.md) | Radix Popover | DESIGN.md:301 | 3 | pending |
| Dropdown menu | [Build reference](components/dropdown-menu.md) | Radix Dropdown Menu | DESIGN.md:301 | 3 | pending |
| Context menu | [Build reference](components/context-menu.md) | Radix Context Menu | DESIGN.md:301 | 3 | pending |
| Sheet | [Build reference](components/sheet.md) | Dialog | DESIGN.md:302 | 4 | pending |
| Alert dialog | [Build reference](components/alert-dialog.md) | Radix AlertDialog, Input, Button | DESIGN.md:302 | 4 | pending |
| Dialog | [Build reference](components/dialog.md) | Radix Dialog, Button | DESIGN.md:302 | 4 | pending |
| Command and Combobox | [Build reference](components/command.md) | cmdk, Popover | DESIGN.md:303 | 4 | pending |
| Toast | [Build reference](components/sonner.md) | sonner | DESIGN.md:304 | 4 | pending |
| Badge | [Build reference](components/badge.md) | Radix Slot | DESIGN.md:305 | 5 | pending |
| Alert | [Build reference](components/alert.md) | none | DESIGN.md:305 | 5 | pending |
| Skeleton | [Build reference](components/skeleton.md) | none | DESIGN.md:305 | 5 | pending |
| Progress | [Build reference](components/progress.md) | Radix Progress | DESIGN.md:305 | 5 | pending |
| Breadcrumb | [Build reference](components/breadcrumb.md) | Radix Slot | DESIGN.md:305 | 5 | pending |
| Kbd | [Build reference](components/kbd.md) | none | DESIGN.md:305 | 5 | pending |
| Empty | [Build reference](components/empty.md) | Button | DESIGN.md:305 | 5 | pending |
| Avatar | [Build reference](components/avatar.md) | Radix Avatar | DESIGN.md:305 | 5 | pending |
| Table | [Build reference](components/table.md) | none | DESIGN.md:305 | 5 | pending |
| Separator | [Build reference](components/separator.md) | Radix Separator | DESIGN.md:305 | 5 | pending |
| Data table | [Build reference](components/data-table.md) | TanStack Table v8, Table, Checkbox, Dropdown menu | DESIGN.md:306 | 6 | pending |
| Sortable item | [Build reference](components/sortable-item.md) | dnd-kit | DESIGN.md:307 | 6 | pending |
| Form | [Build reference](components/form.md) | react-hook-form, zod, Field | DESIGN.md:308 | 6 | pending |
| Calendar and Date picker | [Build reference](components/calendar.md) | react-day-picker, Popover, Button | DESIGN.md:309 | 6 | pending |
| Chart | [Build reference](components/chart.md) | Recharts | DESIGN.md:310 | 6 | pending |
| Page header | [Build reference](components/page-header.md) | Button, Breadcrumb | DESIGN.md:316 | 7 | pending |
| Panel | [Build reference](components/panel.md) | none | DESIGN.md:316 | 7 | pending |
| Status badge | [Build reference](components/status-badge.md) | Badge | DESIGN.md:316 | 7 | pending |
| Empty state content | [Build reference](components/empty-state-content.md) | Empty, Button | DESIGN.md:316 | 7 | pending |
