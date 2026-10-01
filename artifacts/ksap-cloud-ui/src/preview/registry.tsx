import { lazy, type ComponentType } from "react";
import { OverviewPage, ColorsPage, FontsPage, LayoutPage, ContentPage, MotionPage } from "./foundations";

export const DESIGN_SYSTEM = {
  title: "KSAP Cloud UI",
  description: "A shared design system for accurate, calm logistics operations.",
};
export type PreviewEntry = { id: string; title: string; description: string; component: ComponentType };
export const NAV_GROUPS: { title: string; entries: PreviewEntry[] }[] = [
  { title: "Foundations", entries: [
    { id: "overview", title: "Overview", description: "Source-defined foundations and the first five component families.", component: OverviewPage },
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
  ] },
  { title: "Guidelines", entries: [
    { id: "content", title: "Content", description: "Calm, precise and helpful. Labels name outcomes.", component: ContentPage },
    { id: "motion", title: "Motion", description: "Productive feedback, honest loading and reduced-motion support.", component: MotionPage },
  ] },
];
export const ALL_ENTRIES = NAV_GROUPS.flatMap((group) => group.entries);
if (new Set(ALL_ENTRIES.map((entry) => entry.id)).size !== ALL_ENTRIES.length) throw new Error("Duplicate design-system preview page IDs.");