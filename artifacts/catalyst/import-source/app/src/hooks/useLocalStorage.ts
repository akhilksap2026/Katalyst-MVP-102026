import { useCallback, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

/** useState persisted to localStorage under the "catalyst." prefix. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, initial));
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeStorage(key, resolved);
        return resolved;
      });
    },
    [key],
  );
  return [value, set] as const;
}
