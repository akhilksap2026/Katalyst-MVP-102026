import { lazy, type ComponentType } from "react";
import { OverviewPage, ColorsPage, FontsPage, LayoutPage, ContentPage, MotionPage } from "./foundations";

export const DESIGN_SYSTEM = {
  title: "KSAP Cloud UI",
  description: "A shared design system for accurate, calm logistics operations.",
};
export type PreviewEntry = { id: string; title: string; description: string; component: ComponentType };
export const NAV_GROUPS: { title: string; entries: PreviewEntry[] }[] = [
  { title: "Foundations", entries: [
    { id: "overview", title: "Overview", description: "Source-defined foundations and the complete shared component library.", component: OverviewPage },
    { id: "colors", title: "Colors", description: "One accent. Fixed status colors. Designed light and dark surfaces.", component: ColorsPage },
    { id: "fonts", title: "Typography", description: "Montserrat 400 and 600. IBM Plex Mono for codes and IDs.", component: FontsPage },
    { id: "layout", title: "Layout and density", description: "A 4 px grid and three user-controlled densities.", component: LayoutPage },
  ] },
  { title: "Components", entries: [
    { id: "buttons", title: "Button", description: "Outcome labels, honest loading and clear action hierarchy.", component: lazy(() => import("./demos/button")) },
    { id: "inputs", title: "Input", description: "Constrained inputs with clear disabled, read-only and invalid states.", component: lazy(() => import("./demos/input")) },
    { id: "textareas", title: "Textarea", description: "Multiline input using the same field and validation contract.", component: lazy(() => import("./demos/textarea")) },
    { id: "labels", title: "Label", description: "Sentence-case, associated labels at weight 600.", component: lazy(() => import("./demos/label")) },
    { id: "fields", title: "Field", description: "Accessible labels, descriptions, errors and responsive layouts.", component: lazy(() => import("./demos/field")) },
    { id: "checkbox", title: "Checkbox", description: "Checked, indeterminate and invalid choices.", component: lazy(() => import("./demos/checkbox")) },
    { id: "radio-group", title: "Radio group", description: "A single, keyboard-operable choice.", component: lazy(() => import("./demos/radio-group")) },
    { id: "switch", title: "Switch", description: "Clear on and off preferences.", component: lazy(() => import("./demos/switch")) },
    { id: "slider", title: "Slider", description: "Bounded values and ranges.", component: lazy(() => import("./demos/slider")) },
    { id: "toggle-group", title: "Toggle group", description: "Single or multiple segmented choices.", component: lazy(() => import("./demos/toggle-group")) },
    { id: "select", title: "Select", description: "Constrained, accessible choices.", component: lazy(() => import("./demos/select")) },
    { id: "tabs", title: "Tabs", description: "Keyboard paths between related views.", component: lazy(() => import("./demos/tabs")) },
    { id: "tooltip", title: "Tooltip", description: "Short field-level help.", component: lazy(() => import("./demos/tooltip")) },
    { id: "hover-card", title: "Hover card", description: "Secondary contextual information.", component: lazy(() => import("./demos/hover-card")) },
    { id: "popover", title: "Popover", description: "Focused contextual controls.", component: lazy(() => import("./demos/popover")) },
    { id: "dropdown-menu", title: "Dropdown menu", description: "Actions, choices and shortcuts.", component: lazy(() => import("./demos/dropdown-menu")) },
    { id: "context-menu", title: "Context menu", description: "Contextual actions and nested menus.", component: lazy(() => import("./demos/context-menu")) },
    { id: "sheet", title: "Sheet", description: "Focused tasks in a dismissible side panel.", component: lazy(() => import("./demos/sheet")) },
    { id: "alert-dialog", title: "Alert dialog", description: "Clear confirmation for irreversible actions.", component: lazy(() => import("./demos/alert-dialog")) },
    { id: "dialog", title: "Dialog", description: "Accessible modal tasks and focus return.", component: lazy(() => import("./demos/dialog")) },
    { id: "command", title: "Command and Combobox", description: "Keyboard-driven search and constrained selection.", component: lazy(() => import("./demos/command")) },
    { id: "sonner", title: "Toast", description: "Brief feedback with shared notifications.", component: lazy(() => import("./demos/sonner")) },
    { id: "badge", title: "Badge", description: "Words and icons for clear states.", component: lazy(() => import("./demos/badge")) },
    { id: "alert", title: "Alert", description: "Actionable information and errors.", component: lazy(() => import("./demos/alert")) },
    { id: "skeleton", title: "Skeleton", description: "Loading placeholders that match known shapes.", component: lazy(() => import("./demos/skeleton")) },
    { id: "progress", title: "Progress", description: "Determinate work with visible counts.", component: lazy(() => import("./demos/progress")) },
    { id: "breadcrumb", title: "Breadcrumb", description: "Location in the workspace hierarchy.", component: lazy(() => import("./demos/breadcrumb")) },
    { id: "kbd", title: "Kbd", description: "Shortcuts beside their actions.", component: lazy(() => import("./demos/kbd")) },
    { id: "empty", title: "Empty", description: "Explain an empty state and its next action.", component: lazy(() => import("./demos/empty")) },
    { id: "avatar", title: "Avatar", description: "Identity with initials and image fallbacks.", component: lazy(() => import("./demos/avatar")) },
    { id: "table", title: "Table", description: "Dense rows and named column groups.", component: lazy(() => import("./demos/table")) },
    { id: "separator", title: "Separator", description: "Decorative and semantic boundaries.", component: lazy(() => import("./demos/separator")) },
    { id: "data-table", title: "Data table", description: "Sorting, filtering, selection and pagination.", component: lazy(() => import("./demos/data-table")) },
    { id: "sortable-item", title: "Sortable item", description: "Pointer and keyboard ordering with undo.", component: lazy(() => import("./demos/sortable-item")) },
    { id: "form", title: "Form", description: "Touched-field validation and associated errors.", component: lazy(() => import("./demos/form")) },
    { id: "calendar", title: "Calendar and Date picker", description: "Bounded dates, ranges and practical presets.", component: lazy(() => import("./demos/calendar")) },
    { id: "resizable", title: "Resizable panels", description: "Approved supporting primitive for adjustable list and detail views.", component: lazy(() => import("./demos/resizable")) },
  ] },
  { title: "Charts", entries: [
    { id: "chart", title: "Chart", description: "One accent, muted context and a table alternative.", component: lazy(() => import("./demos/chart")) },
  ] },
  { title: "Patterns", entries: [
    { id: "page-header", title: "Page header", description: "Breadcrumbs, context and one primary outcome action.", component: lazy(() => import("./demos/page-header")) },
    { id: "panel", title: "Panel", description: "Bordered, shadowless surfaces with density-aware spacing.", component: lazy(() => import("./demos/panel")) },
    { id: "status-badge", title: "Status badge", description: "A word and a dot or icon for every status.", component: lazy(() => import("./demos/status-badge")) },
    { id: "empty-state-content", title: "Empty state content", description: "An explanation and a clear next action.", component: lazy(() => import("./demos/empty-state-content")) },
  ] },
  { title: "Guidelines", entries: [
    { id: "content", title: "Content", description: "Calm, precise and helpful. Labels name outcomes.", component: ContentPage },
    { id: "motion", title: "Motion", description: "Productive feedback, honest loading and reduced-motion support.", component: MotionPage },
  ] },
];
export const ALL_ENTRIES = NAV_GROUPS.flatMap((group) => group.entries);
if (new Set(ALL_ENTRIES.map((entry) => entry.id)).size !== ALL_ENTRIES.length) throw new Error("Duplicate design-system preview page IDs.");