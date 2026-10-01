/** Small, typed wrappers around localStorage. All values are scoped to "catalyst.". */

const PREFIX = "catalyst.";

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — non-fatal for a prototype */
  }
}
