import { ViewTransition, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "@/lib/router";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  FileUp,
  ArrowLeftRight,
  GitCompareArrows,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_COMPARE_OPTIONS,
  buildSource,
  sniffCsvTable,
  sourceCounts,
  type AgentTable,
  type CompareOptions,
  type SourceModel,
} from "@/lib/agents";
import { track } from "@/lib/analytics";
import { Tour } from "@/components/agents/tour";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { autoAssign } from "@/lib/assign";
import { InfoTip } from "@/components/info-tip";
import { setAssistantResult } from "@/lib/assistant-store";
import { announce } from "@/components/shell/announcer";
import { compareSources, type CompareResult } from "@/lib/compare";
import { readStorage, writeStorage } from "@/lib/storage";
import { CompareResults } from "@/components/agents/compare-results";
import { SkeletonRows } from "@/components/state-block";
import { cn } from "@/lib/utils";

import devAgentCsv from "@/data/agents/DEV/AGENT.csv?raw";
import devEventsCsv from "@/data/agents/DEV/AGENT_EVENT_DETAILS.csv?raw";
import devActionsCsv from "@/data/agents/DEV/AGENT_ACTION_DETAILS.csv?raw";
import prodAgentCsv from "@/data/agents/PROD/AGENT.csv?raw";
import prodEventsCsv from "@/data/agents/PROD/AGENT_EVENT_DETAILS.csv?raw";
import prodActionsCsv from "@/data/agents/PROD/AGENT_ACTION_DETAILS.csv?raw";

/* ------------------------------------------------------------------ types */

interface SourceFile {
  name: string;
  text: string;
}

interface SourceState {
  label: string;
  files: SourceFile[];
}

interface FileKind {
  format: "csv" | "dbxml";
  table: AgentTable | null;
}

function detectKind(text: string): FileKind {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("<") || trimmed.startsWith("<?xml") || trimmed.startsWith("<!--")) {
    return { format: "dbxml", table: /<AGENT[>\s]/.test(text) ? "AGENT" : null };
  }
  return { format: "csv", table: sniffCsvTable(text)?.table ?? null };
}

const TABLE_LABEL: Record<AgentTable, string> = {
  AGENT: "AGENT",
  AGENT_EVENT_DETAILS: "AGENT_EVENT_DETAILS",
  AGENT_ACTION_DETAILS: "AGENT_ACTION_DETAILS",
};

const SAMPLE_FILES: Record<"A" | "B", SourceFile[]> = {
  A: [
    { name: "AGENT.csv", text: devAgentCsv },
    { name: "AGENT_EVENT_DETAILS.csv", text: devEventsCsv },
    { name: "AGENT_ACTION_DETAILS.csv", text: devActionsCsv },
  ],
  B: [
    { name: "AGENT.csv", text: prodAgentCsv },
    { name: "AGENT_EVENT_DETAILS.csv", text: prodEventsCsv },
    { name: "AGENT_ACTION_DETAILS.csv", text: prodActionsCsv },
  ],
};

/* -------------------------------------------------------------- drop zone */

function SourcePanel({
  sourceKey,
  state,
  onChange,
  defaultLabel,
}: {
  sourceKey: "A" | "B";
  state: SourceState;
  onChange: (next: SourceState) => void;
  defaultLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [paste, setPaste] = useState("");
  const [reading, setReading] = useState(false);
  const pasteSerial = useRef(0);

  const addFiles = useCallback(
    (incoming: SourceFile[]) => {
      if (incoming.length === 0) return;
      startTransition(() => onChange({
        ...state,
        files: [
          ...state.files,
          ...incoming.map((f, i) => ({
            ...f,
            name: state.files.some((x) => x.name === f.name) || incoming.findIndex((x) => x.name === f.name) !== i
              ? `${f.name.replace(/(\.[^.]*)?$/, `-${state.files.length + i + 1}$1`)}`
              : f.name,
          })),
        ],
      }));
    },
    [state, onChange],
  );

  const pickFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setReading(true);
    try {
      const loaded: SourceFile[] = [];
      for (const f of Array.from(list)) {
        loaded.push({ name: f.name, text: await f.text() });
      }
      addFiles(loaded);
    } catch {
      // File.text() can fail on read errors; tell the user instead of failing silently.
      toast.error(`Could not read ${list.length > 1 ? "those files" : "the file"}.`, {
        description: "Check the file is a readable CSV or XML export, then try again.",
      });
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addPaste = () => {
    const text = paste.trim();
    if (!text) return;
    pasteSerial.current += 1;
    const kind = detectKind(text);
    const ext = kind.format === "dbxml" ? ".xml" : ".csv";
    addFiles([{ name: `pasted-${pasteSerial.current}${ext}`, text: paste }]);
    setPaste("");
  };

  const removeFile = (name: string) =>
    startTransition(() => onChange({ ...state, files: state.files.filter((f) => f.name !== name) }));

  return (
    <section aria-label={`Source ${sourceKey}`} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`agents-${sourceKey}-label`} className="text-caption">
            Source label
          </Label>
          <Input
            id={`agents-${sourceKey}-label`}
            value={state.label}
            onChange={(e) => onChange({ ...state, label: e.target.value })}
            placeholder={defaultLabel}
            className="h-8 w-44 font-mono text-[13px]"
          />
        </div>
        <Badge variant="outline" className="gap-1.5 text-caption">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          Processed in your browser
        </Badge>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Drop files for source ${sourceKey}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void pickFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-6 py-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:border-primary/60",
        )}
      >
        <FileUp className="size-7 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-sm font-medium">Drop files here, or click to choose</p>
        <p className="max-w-md text-caption text-muted-foreground">
          AGENT.csv, AGENT_EVENT_DETAILS.csv, AGENT_ACTION_DETAILS.csv (any order, several at once) or one
          DB.XML transmission set.
        </p>
        {reading && (
          <div role="status" aria-label="Reading files" className="grid w-full gap-2 px-4">
            <p className="text-caption text-muted-foreground">Reading files…</p>
            <SkeletonRows rows={2} />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.xml,text/csv,text/xml"
          className="hidden"
          onChange={(e) => void pickFiles(e.target.files)}
          data-testid={`agents-${sourceKey}-file-input`}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`agents-${sourceKey}-paste`} className="text-caption">
          Or paste extract content
        </Label>
        <Textarea
          id={`agents-${sourceKey}-paste`}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={"AGENT_GID,AGENT_XID,…\n…or a DB.XML fragment"}
          className="min-h-20 font-mono text-[12px]"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={addPaste}
            disabled={!paste.trim()}
            data-testid={`agents-${sourceKey}-add-paste`}
          >
            Add pasted content
          </Button>
        </div>
      </div>

      {state.files.length > 0 && (
        <ul className="flex flex-col divide-y rounded-lg border" aria-label={`Files for source ${sourceKey}`}>
          {state.files.map((f) => {
            const kind = detectKind(f.text);
            return (
              <ViewTransition key={f.name}>
              <li className="flex items-center gap-3 px-3 py-2">
                <span className="truncate font-mono text-[12px]">{f.name}</span>
                <Badge
                  variant={kind.table ? "secondary" : "outline"}
                  className={cn("ml-auto shrink-0 font-mono text-[11px]", !kind.table && "text-amber-600")}
                >
                  {kind.format === "dbxml" ? "DB.XML" : kind.table ? TABLE_LABEL[kind.table] : "Unrecognised"}
                </Badge>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => removeFile(f.name)}
                  className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
              </ViewTransition>
            );
          })}
        </ul>
      )}

      {state.files.length > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startTransition(() => onChange({ ...state, files: [] }))}
            data-testid={`agents-${sourceKey}-clear`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Clear source
          </Button>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- review */

function OptionsPanel({
  options,
  onChange,
}: {
  options: CompareOptions;
  onChange: (next: CompareOptions) => void;
}) {
  const row = "flex items-center justify-between gap-4";
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex min-h-6 items-center gap-1.5 rounded-md py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        {open ? (
          <ChevronDown className="size-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="size-4" aria-hidden="true" />
        )}
        Options
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="grid gap-4 rounded-lg border bg-card p-4">
          <div className={row}>
            <div>
              <p className="flex items-center gap-1 text-sm font-medium">Match agents by <InfoTip text="How agents are paired across sources. XID ignores the domain so DEV and PROD pair up; GID is stricter." ask="XID or GID?" /></p>
              <p className="text-caption text-muted-foreground">
                AGENT_XID ignores the domain; AGENT_GID includes it.
              </p>
            </div>
            <RadioGroup
              value={options.matchBy}
              onValueChange={(v) => onChange({ ...options, matchBy: v as CompareOptions["matchBy"] })}
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="xid" id="agents-match-xid" />
                <Label htmlFor="agents-match-xid" className="font-normal">
                  AGENT_XID
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="gid" id="agents-match-gid" />
                <Label htmlFor="agents-match-gid" className="font-normal">
                  AGENT_GID
                </Label>
              </div>
            </RadioGroup>
          </div>
          <Separator />
          <div className={row}>
            <div>
              <p className="flex items-center gap-1 text-sm font-medium">Ignore footprint columns <InfoTip text="Audit columns (who/when a row was created or updated) almost always differ between environments." ask="What is footprint?" /></p>
              <p className="text-caption text-muted-foreground">INSERT_USER, INSERT_DATE, UPDATE_USER, UPDATE_DATE.</p>
            </div>
            <Checkbox
              checked={options.ignoreFootprint}
              onCheckedChange={(v) => onChange({ ...options, ignoreFootprint: v === true })}
              aria-label="Ignore footprint columns"
            />
          </div>
          <Separator />
          <div className={row}>
            <div>
              <p className="text-sm font-medium">Ignore whitespace-only differences in parameters</p>
              <p className="text-caption text-muted-foreground">Treat parameter text differing only by spaces as equal.</p>
            </div>
            <Checkbox
              checked={options.ignoreWhitespace}
              onCheckedChange={(v) => onChange({ ...options, ignoreWhitespace: v === true })}
              aria-label="Ignore whitespace-only differences"
            />
          </div>
          <Separator />
          <div className={row}>
            <div>
              <p className="text-sm font-medium">Ignore case in IDs</p>
              <p className="text-caption text-muted-foreground">Match and compare IDs case-insensitively.</p>
            </div>
            <Checkbox
              checked={options.ignoreCase}
              onCheckedChange={(v) => onChange({ ...options, ignoreCase: v === true })}
              aria-label="Ignore case in IDs"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ------------------------------------------------------------------ flow */

function SourceSummary({ counts, files }: { counts: { agents: number; events: number; actions: number } | null; files: number }) {
  if (!counts || files === 0) return <p className="text-caption text-muted-foreground">No files yet.</p>;
  return (
    <p className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground" aria-live="polite">
      <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
      <span className="font-medium text-foreground">{counts.agents} agents</span> · {counts.events} events ·{" "}
      {counts.actions} actions · {files} file(s)
      {counts.agents === 0 && <span className="text-amber-600">— no agents found; check the files</span>}
    </p>
  );
}

export function AgentImportFlow() {
  // Labels and options are remembered between visits; files never are (privacy).
  const [labels, setLabels] = useLocalStorage("agents.labels", { a: "DEV", b: "PROD" });
  const [storedOptions, setOptions] = useLocalStorage<CompareOptions>("agents.options", DEFAULT_COMPARE_OPTIONS);
  const options = useMemo(() => ({ ...DEFAULT_COMPARE_OPTIONS, ...storedOptions }), [storedOptions]);
  const [filesA, setFilesA] = useState<SourceFile[]>([]);
  const [filesB, setFilesB] = useState<SourceFile[]>([]);
  const a = useMemo<SourceState>(() => ({ label: labels.a, files: filesA }), [labels.a, filesA]);
  const b = useMemo<SourceState>(() => ({ label: labels.b, files: filesB }), [labels.b, filesB]);
  const setA = useCallback((st: SourceState) => { setLabels((l) => ({ ...l, a: st.label })); setFilesA(st.files); }, [setLabels]);
  const setB = useCallback((st: SourceState) => { setLabels((l) => ({ ...l, b: st.label })); setFilesB(st.files); }, [setLabels]);
  const [sorting, setSorting] = useState(false);

  const addSorted = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setSorting(true);
    try {
      const loaded: SourceFile[] = [];
      for (const f of Array.from(list)) loaded.push({ name: f.name, text: await f.text() });
      const sorted = autoAssign(loaded, a.label, b.label, a.files, b.files);
      const merge = (cur: SourceFile[], add: SourceFile[]) => {
        const out = [...cur];
        for (const f of add) {
          let name = f.name;
          for (let n = 2; out.some((x) => x.name === name); n++) name = f.name.replace(/(.[^.]*)?$/, `-${n}$1`);
          out.push({ ...f, name });
        }
        return out;
      };
      setFilesA((cur) => merge(cur, sorted.a));
      setFilesB((cur) => merge(cur, sorted.b));
      toast.success(`Sorted ${loaded.length} file(s): ${sorted.a.length} → ${a.label || "A"}, ${sorted.b.length} → ${b.label || "B"}`, {
        description: "Wrong way round? Use Swap.",
      });
    } catch {
      toast.error("Could not read those files.", { description: "Check they are readable CSV or XML exports." });
    } finally {
      setSorting(false);
    }
  };
  const [result, setResult] = useState<CompareResult | null>(null);
  const modelsRef = useRef<{ a: SourceModel | null; b: SourceModel | null }>({ a: null, b: null });

  const runCompare = () => {
    const { a, b } = modelsRef.current;
    if (!a || !b) return;
    const res = compareSources(a, b, options);
    startTransition(() => setResult(res));
    setAssistantResult(res);
    track("agents_compared", res.agents.length, {
      changed: res.counts.changed,
      onlyA: res.counts.onlyA,
      onlyB: res.counts.onlyB,
    });
    announce(
      `Comparison ready: ${res.counts.differences} differences — ${res.counts.changed} changed, ` +
        `${res.counts.onlyA} only in ${res.labelA}, ${res.counts.onlyB} only in ${res.labelB}, ` +
        `${res.counts.identical} identical`,
    );
  };

  const loadSample = useCallback(() => {
    setA({ label: "DEV", files: SAMPLE_FILES.A });
    setB({ label: "PROD", files: SAMPLE_FILES.B });
  }, [setA, setB]);

  // Home smart-paste handoff: consume the draft once into source A.
  const [draftChecked, setDraftChecked] = useState(false);
  const [searchParams] = useSearchParams();
  useEffect(() => {
    if (draftChecked) return;
    setDraftChecked(true);
    const draft = readStorage<string | null>("agents.draft", null);
    if (typeof draft === "string" && draft.trim().length > 0) {
      const kind = detectKind(draft);
      setFilesA((prev) => [...prev, { name: `pasted-draft.${kind.format === "dbxml" ? "xml" : "csv"}`, text: draft }]);
      writeStorage("agents.draft", null);
      return;
    }
    if (searchParams.get("sample") === "1") loadSample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftChecked]);

  const bothEmpty = a.files.length === 0 && b.files.length === 0;

  // Deep-link ?sample=1 arriving AFTER mount (SPA navigation reuses this component).
  // Only loads while both sources are empty — never clobbers files the user already added.
  const sampleRequested = searchParams.get("sample") === "1";
  const [sampleHandled, setSampleHandled] = useState(false);
  useEffect(() => {
    if (!sampleRequested || sampleHandled || !draftChecked) return;
    setSampleHandled(true);
    if (bothEmpty) loadSample();
  }, [sampleRequested, sampleHandled, draftChecked, bothEmpty, loadSample]);

  const modelA = useMemo(() => (a.files.length ? buildSource(a.label || "A", a.files) : null), [a]);
  const modelB = useMemo(() => (b.files.length ? buildSource(b.label || "B", b.files) : null), [b]);
  modelsRef.current = { a: modelA, b: modelB };
  const countsA = modelA ? sourceCounts(modelA) : null;
  const countsB = modelB ? sourceCounts(modelB) : null;
  const canCompare = (countsA?.agents ?? 0) >= 1 && (countsB?.agents ?? 0) >= 1;

  const warnings = useMemo(() => {
    const out: { source: string; file: string; line: number; kind: string; message: string }[] = [];
    for (const [source, model] of [
      [a.label || "A", modelA],
      [b.label || "B", modelB],
    ] as const) {
      for (const w of model?.warnings ?? []) out.push({ source, ...w });
    }
    return out;
  }, [a.label, b.label, modelA, modelB]);

  if (result)
    return (
      <ViewTransition key="results" enter="slide-up" exit="fade-out" default="none">
        <CompareResults result={result} onBack={() => startTransition(() => setResult(null))} />
      </ViewTransition>
    );

  const missing = !a.files.length && !b.files.length ? "Add files to both sources" : !canCompare ? "Add at least one agent to each source" : "";

  return (
    <ViewTransition key="workspace" enter="fade-in" exit="fade-out" default="none">
    <div className="flex flex-col gap-6">
      <Tour />
      <label
        data-tour="drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void addSorted(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border-2 border-dashed bg-card px-5 py-5 hover:border-primary/60"
      >
        <FileUp className="size-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-sm">
          <span className="font-medium">Drop all your files here</span>{" "}
          <span className="text-muted-foreground">
            from both environments — we'll sort them into A and B. Or click to choose.
          </span>
        </span>
        {sorting && <span role="status" className="text-caption text-muted-foreground">Sorting…</span>}
        <input
          type="file"
          multiple
          accept=".csv,.xml,text/csv,text/xml"
          className="hidden"
          onChange={(e) => {
            void addSorted(e.target.files);
            e.target.value = "";
          }}
          data-testid="agents-smart-input"
        />
        <InfoTip text="Files are matched to a side by name (e.g. AGENT_prod.csv goes to PROD). If names don't say, repeated tables are split one per side. Always check the result and Swap if needed." ask="Which file formats are supported?" />
      </label>

      {bothEmpty && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-card px-5 py-4">
          <GitCompareArrows className="size-6 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm">
            <span className="font-medium">Compare two environments.</span>{" "}
            <span className="text-muted-foreground">
              Drop the extracts for each side below, or see how it works with sample data.
            </span>
          </p>
          <Button variant="outline" size="sm" className="ml-auto" onClick={loadSample} data-testid="agents-try-sample">
            Try sample data
          </Button>
        </div>
      )}

      <div data-tour="sources" className="grid gap-6 lg:grid-cols-2">
        {(
          [
            ["A", a, setA, "DEV", countsA],
            ["B", b, setB, "PROD", countsB],
          ] as const
        ).map(([key, state, set, def, counts]) => (
          <div key={key} className="flex flex-col gap-3 rounded-xl border bg-card/40 p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {key}
              </span>
              <h2 className="text-sm font-semibold">Source {key}</h2>
              <InfoTip
                text={`The ${key === "A" ? "first" : "second"} environment or extract to compare, e.g. ${def}. Add all three agent CSVs, or a single DB.XML file.`}
                ask="Which file formats are supported?"
              />
            </div>
            <SourcePanel sourceKey={key} state={state} onChange={set} defaultLabel={def} />
            <SourceSummary counts={counts} files={state.files.length} />
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <section aria-label="Warnings">
          <h3 className="flex items-center gap-2 text-subheading font-semibold">
            Warnings
            <Badge variant="outline" className="text-amber-600">
              {warnings.length}
            </Badge>
            <InfoTip text="Problems found while reading your files. Compare still runs; affected rows may be skipped." ask="What do the warnings mean?" />
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {warnings.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                <span className="text-caption shrink-0 font-mono text-muted-foreground">
                  {w.source}:{w.file}:{w.line}
                </span>
                <span className="min-w-0">{w.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <OptionsPanel options={options} onChange={setOptions} />

      <div data-tour="compare" className="sticky bottom-0 z-10 -mx-6 flex flex-wrap items-center gap-3 border-t bg-background/95 px-6 py-3 backdrop-blur">
        <Button disabled={!canCompare} onClick={runCompare} data-testid="agents-compare">
          <GitCompareArrows className="size-4" aria-hidden="true" />
          Compare {a.label || "A"} vs {b.label || "B"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={bothEmpty}
          onClick={() => {
            setA(b);
            setB(a);
          }}
          aria-label="Swap sources A and B"
        >
          <ArrowLeftRight className="size-4" aria-hidden="true" /> Swap
        </Button>
        {missing && <p className="text-caption text-muted-foreground">{missing} to compare.</p>}
      </div>
    </div>
    </ViewTransition>
  );
}
