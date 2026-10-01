import { readStorage, writeStorage } from "@/lib/storage";

export type ActivityKind = "tool" | "table" | "comparison";

export interface ActivityItem {
  kind: ActivityKind;
  label: string;
  href: string;
  at: number;
}

const KEY = "activity";
/** Stored list is capped so localStorage stays small; Home shows the first 5. */
const MAX_STORED = 20;

function readAll(): ActivityItem[] {
  return readStorage<ActivityItem[]>(KEY, []);
}

/** Record a visit. Same kind + href moves to the top instead of duplicating. */
export function logActivity(entry: { kind: ActivityKind; label: string; href: string }): void {
  const items = readAll();
  const next: ActivityItem[] = [
    { ...entry, at: Date.now() },
    ...items.filter((i) => !(i.kind === entry.kind && i.href === entry.href)),
  ].slice(0, MAX_STORED);
  writeStorage(KEY, next);
}

/** Most recent activity first. */
export function readActivity(limit = 5): ActivityItem[] {
  return readAll().slice(0, limit);
}

/** Test helper: reset the log. */
export function clearActivity(): void {
  writeStorage(KEY, []);
}
