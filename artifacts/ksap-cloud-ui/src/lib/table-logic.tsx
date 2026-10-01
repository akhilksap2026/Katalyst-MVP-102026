import { startOfDay } from "date-fns"

/** Ids between anchor and target, inclusive, in the displayed order. Falls back to the target alone. */
export function selectionRange(displayedIds: string[], anchorId: string | null, targetId: string): string[] {
  const to = displayedIds.indexOf(targetId)
  const from = anchorId === null ? -1 : displayedIds.indexOf(anchorId)
  if (to < 0) return []
  if (from < 0) return [targetId]
  const [start, end] = from < to ? [from, to] : [to, from]
  return displayedIds.slice(start, end + 1)
}

/** Drops selected ids that no longer exist in the data. Returns the same object when nothing changed. */
export function pruneSelection(selection: Record<string, boolean>, existingIds: Iterable<string>): Record<string, boolean> {
  const live = new Set(existingIds)
  const keys = Object.keys(selection)
  if (keys.every((key) => live.has(key))) return selection
  return Object.fromEntries(keys.filter((key) => live.has(key)).map((key) => [key, selection[key]]))
}

const INTERACTIVE =
  "input,button,a,select,textarea,label,summary,[role=checkbox],[role=button],[role=link],[role=menuitem],[role=switch],[role=combobox],[contenteditable=true]"

/** True when the event target is, or sits inside, an interactive control within the row. */
export function isInteractiveTarget(target: EventTarget | null, row: Element): boolean {
  if (!(target instanceof Element)) return false
  const hit = target.closest(INTERACTIVE)
  return hit !== null && row.contains(hit)
}

/** A date is selectable when no minimum applies or it is on or after the minimum day. */
export function isSelectableDate(date: Date, minDate?: Date): boolean {
  return !minDate || startOfDay(date).getTime() >= startOfDay(minDate).getTime()
}
