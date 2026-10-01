import { useSyncExternalStore } from "react";
import type { CompareResult } from "./compare";

/** Latest comparison, shared with the assistant. In-memory only; never persisted or sent anywhere. */
let current: CompareResult | null = null;
const subs = new Set<() => void>();

export function setAssistantResult(r: CompareResult | null) {
  current = r;
  subs.forEach((f) => f());
}

export function useAssistantResult(): CompareResult | null {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => current,
  );
}
