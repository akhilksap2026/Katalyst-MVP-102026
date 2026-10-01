import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { getIndex, type DictionaryIndex } from "@/lib/dictionary";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useApp } from "@/state/app";

export interface Pin {
  release: string;
  table: string;
}

interface DictionaryState {
  /** Index for the release currently chosen in the header. */
  index: DictionaryIndex | null;
  release: string;
  pins: Pin[];
  isPinned: (table: string) => boolean;
  togglePin: (table: string) => void;
  recents: string[];
  pushRecentSearch: (query: string) => void;
  /** Plain-language load failure for the current release, if any. */
  loadError: string | null;
}

const DictionaryContext = createContext<DictionaryState | null>(null);

export function DictionaryProvider({ children }: { children: ReactNode }) {
  const { release } = useApp();
  const [pins, setPins] = useLocalStorage<Pin[]>("dictionary.pins", []);
  const [recents, setRecents] = useLocalStorage<string[]>("dictionary.recents", []);

  const { index, loadError } = useMemo(() => {
    try {
      const idx = getIndex(release) ?? null;
      return { index: idx, loadError: idx ? null : `No dictionary data found for release ${release}.` };
    } catch {
      return {
        index: null,
        loadError: `The ${release} dictionary failed to load — its data file may be corrupted. Try another release from the header, then refresh the page.`,
      };
    }
  }, [release]);

  const isPinned = useCallback((table: string) => pins.some((p) => p.release === release && p.table === table), [pins, release]);

  const togglePin = useCallback(
    (table: string) => {
      setPins((prev) => {
        const rest = prev.filter((p) => !(p.release === release && p.table === table));
        return rest.length === prev.length ? [...prev, { release, table }] : rest;
      });
    },
    [release, setPins],
  );

  const pushRecentSearch = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;
      setRecents((prev) => [q, ...prev.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 8));
    },
    [setRecents],
  );

  const value = useMemo<DictionaryState>(
    () => ({ index, release, pins, isPinned, togglePin, recents, pushRecentSearch, loadError }),
    [index, release, pins, isPinned, togglePin, recents, pushRecentSearch, loadError],
  );

  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
}

export function useDictionary(): DictionaryState {
  const ctx = useContext(DictionaryContext);
  if (!ctx) throw new Error("useDictionary must be used inside DictionaryProvider");
  return ctx;
}
