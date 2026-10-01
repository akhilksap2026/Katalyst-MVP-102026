import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import i18n from "i18next";
import { toast } from "@workspace/ksap-cloud-ui/components/ui/sonner";
import {
  DEFAULT_OPTIONS,
  computeStats,
  formatOutput,
  isFlaggedValue,
  processTokens,
  splitValues,
  type ListOptions,
} from "@/lib/list";
import { track } from "@/lib/analytics";
import { announce } from "@/components/shell/announcer";
import { readStorage, writeStorage } from "@/lib/storage";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useApp } from "@/state/app";
import messySample from "@/data/lists/messy.txt?raw";

interface ListToolState {
  /** Raw pasted content. Session-only: never persisted. */
  input: string;
  setInput: (value: string) => void;
  options: ListOptions;
  setOptions: (patch: Partial<ListOptions>) => void;
  /** Values after cleaning, before formatting. */
  outputValues: string[];
  /** Formatted text for the output pane and copy/download. */
  outputText: string;
  stats: ReturnType<typeof computeStats>;
  /** Distinct cleaned values flagged for review (spaces, lowercase, >1 dot). */
  flaggedValues: string[];
  clear: () => void;
  swap: () => void;
  copy: () => void;
  download: () => void;
  /** Opens the tray with content pre-filled (used by Home, future Dictionary). */
  openTrayWith: (content: string) => void;
  /** Bundled sample list (src/data/lists/messy.txt), null until loaded. */
  sampleText: string | null;
  loadSample: () => void;
  /** Loads the sample list only when the input is currently empty. */
  loadSampleIfEmpty: () => void;
  /** Reads and clears a pending list.draft; true if one was applied. */
  consumeDraft: () => boolean;
}

const ListToolContext = createContext<ListToolState | null>(null);

export function ListToolProvider({ children }: { children: ReactNode }) {
  const { setTrayOpen } = useApp();
  const [input, setInput] = useState("");
  const [options, setOptionsStored] = useLocalStorage<ListOptions>("list.options", DEFAULT_OPTIONS);
  // Sample data ships with the app, bundled at build time.
  const [sampleText] = useState<string | null>(messySample);

  // Consume a draft handed over by another page (e.g. Home smart paste).
  // The draft is read once and removed so a refresh does not resurrect it.
  // Called on provider mount and by /list on every navigation, since the
  // provider stays mounted while the router switches pages.
  const consumeDraft = useCallback(() => {
    const draft = readStorage<string | null>("list.draft", null);
    if (typeof draft === "string" && draft.length > 0) {
      setInput(draft);
      writeStorage("list.draft", null);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    consumeDraft();
  }, [consumeDraft]);

  const loadSampleIfEmpty = useCallback(() => {
    setInput((prev) => (prev.trim().length === 0 ? messySample : prev));
  }, []);

  const setOptions = useCallback(
    (patch: Partial<ListOptions>) => setOptionsStored((prev) => ({ ...prev, ...patch })),
    [setOptionsStored],
  );

  const rawTokens = useMemo(() => splitValues(input, options.delimiter), [input, options.delimiter]);
  const outputValues = useMemo(() => processTokens(rawTokens, options), [rawTokens, options]);
  const outputText = useMemo(() => formatOutput(outputValues, options), [outputValues, options]);
  const stats = useMemo(
    () => computeStats(rawTokens, outputValues, options),
    [rawTokens, outputValues, options],
  );

  // Distinct flagged values, judged on the cleaned (pre-transform) tokens.
  const flaggedValues = useMemo(() => {
    const cleaned = processTokens(rawTokens, { ...options, removeDuplicates: false });
    return Array.from(new Set(cleaned.filter(isFlaggedValue)));
  }, [rawTokens, options]);

  const clear = useCallback(() => setInput(""), []);
  const swap = useCallback(() => setInput(outputText), [outputText]);

  const copy = useCallback(() => {
    if (!outputText) return;
    void navigator.clipboard.writeText(outputText).then(() => {
      toast.success(i18n.t("listTool.copiedValues", { count: stats.valuesOut }));
      track("list_copied", stats.valuesOut);
      announce(i18n.t("listTool.copiedValues", { count: stats.valuesOut }));
      // Lets other tools (e.g. the join query builder's "Insert list") pick up
      // the copied text without reading the clipboard themselves.
      window.dispatchEvent(new CustomEvent("catalyst:list-copied", { detail: outputText }));
    });
  }, [outputText, stats.valuesOut]);

  const download = useCallback(() => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalyst-list.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(i18n.t("listTool.downloadedValues", { count: stats.valuesOut }));
    track("list_downloaded", stats.valuesOut);
    announce(i18n.t("listTool.downloadedValues", { count: stats.valuesOut }));
  }, [outputText, stats.valuesOut]);

  const openTrayWith = useCallback(
    (content: string) => {
      setInput(content);
      setTrayOpen(true);
    },
    [setTrayOpen],
  );

  const value = useMemo<ListToolState>(
    () => ({
      input,
      setInput,
      options,
      setOptions,
      outputValues,
      outputText,
      stats,
      flaggedValues,
      clear,
      swap,
      copy,
      download,
      openTrayWith,
      sampleText,
      loadSample: () => {
        if (sampleText) setInput(sampleText);
      },
      consumeDraft,
      loadSampleIfEmpty,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, options, outputValues, outputText, stats, flaggedValues, clear, swap, copy, download, openTrayWith, sampleText, consumeDraft, loadSampleIfEmpty],
  );

  return <ListToolContext.Provider value={value}>{children}</ListToolContext.Provider>;
}

export function useListTool(): ListToolState {
  const ctx = useContext(ListToolContext);
  if (!ctx) throw new Error("useListTool must be used inside ListToolProvider");
  return ctx;
}
