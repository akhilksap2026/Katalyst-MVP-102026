import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDownUp,
  ArrowRight,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Download,
  Info,
  ListChecks,
  ShieldCheck,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useListTool } from "@/state/list-tool";
import { useApp } from "@/state/app";
import { detectDelimiters, ORACLE_IN_LIMIT, type Delimiter, type DomainAction, type OutputPreset, type SortMode } from "@/lib/list";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------- small pieces */

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label className="text-caption text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

const SPLIT_LABELS: Record<Delimiter, string> = {
  auto: "Auto",
  newline: "New line",
  tab: "Tab",
  comma: "Comma",
  semicolon: "Semicolon",
  pipe: "Pipe",
  space: "Space",
};

function SplitSelect({ id }: { id: string }) {
  const { input, options, setOptions } = useListTool();
  const detected = options.delimiter === "auto" ? detectDelimiters(input) : [];
  return (
    <Field
      label={
        detected.length > 0
          ? `Split on · detected ${detected.map((d) => SPLIT_LABELS[d].toLowerCase()).join(", ")}`
          : "Split on"
      }
    >
      <Select value={options.delimiter} onValueChange={(v) => setOptions({ delimiter: v as Delimiter })}>
        <SelectTrigger id={id} className="h-8 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SPLIT_LABELS) as Delimiter[]).map((d) => (
            <SelectItem key={d} value={d} className="text-xs">
              {SPLIT_LABELS[d]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const PRESET_LABELS: Record<OutputPreset, string> = {
  lines: "One per line",
  comma: "Comma list",
  "quoted-comma": "Quoted comma list",
  sql: "SQL IN clause",
  json: "JSON array",
  "otm-oids": "OTM Object IDs",
};

function PresetSelect({ id }: { id: string }) {
  const { options, setOptions } = useListTool();
  return (
    <Field label="Output">
      <Select value={options.preset} onValueChange={(v) => setOptions({ preset: v as OutputPreset })}>
        <SelectTrigger id={id} className="h-8 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(PRESET_LABELS) as OutputPreset[]).map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {PRESET_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const DOMAIN_LABELS: Record<DomainAction, string> = {
  keep: "Keep domains",
  remove: "Remove domains",
  add: "Add where missing",
  replace: "Replace domain…",
};

function DomainControl() {
  const { options, setOptions } = useListTool();
  return (
    <div className="flex flex-col gap-2">
      <Field label="Domain">
        <Select value={options.domain} onValueChange={(v) => setOptions({ domain: v as DomainAction })}>
          <SelectTrigger id="list-domain-action" className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(DOMAIN_LABELS) as DomainAction[]).map((d) => (
              <SelectItem key={d} value={d} className="text-xs">
                {DOMAIN_LABELS[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {options.domain === "add" && (
        <Field label="Domain to add">
          <Input
            value={options.domainAdd}
            onChange={(e) => setOptions({ domainAdd: e.target.value })}
            placeholder="KSAP"
            className="h-8 font-mono text-xs"
            spellCheck={false}
          />
        </Field>
      )}
      {options.domain === "replace" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="From">
            <Input
              value={options.domainReplaceFrom}
              onChange={(e) => setOptions({ domainReplaceFrom: e.target.value })}
              placeholder="KSAP/EU"
              className="h-8 font-mono text-xs"
              spellCheck={false}
            />
          </Field>
          <Field label="To">
            <Input
              value={options.domainReplaceTo}
              onChange={(e) => setOptions({ domainReplaceTo: e.target.value })}
              placeholder="TEST"
              className="h-8 font-mono text-xs"
              spellCheck={false}
            />
          </Field>
        </div>
      )}
      <p className="text-caption text-muted-foreground">
        GIDs split on the first "." only — subdomains like KSAP/EU are kept intact.
      </p>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  id,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="scale-90" />
    </div>
  );
}

/* -------------------------------------------------------------- stats bar */

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono text-xs font-semibold tabular-nums">{value}</span>
      <span className="text-caption text-muted-foreground">{label}</span>
    </span>
  );
}

function StatsBar() {
  const { stats } = useListTool();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <Stat value={stats.valuesIn} label={stats.valuesIn === 1 ? "value in" : "values in"} />
      <Stat value={stats.valuesOut} label={stats.valuesOut === 1 ? "value out" : "values out"} />
      {stats.duplicatesRemoved > 0 && <Stat value={stats.duplicatesRemoved} label="duplicates removed" />}
      {stats.blanksRemoved > 0 && <Stat value={stats.blanksRemoved} label="blanks removed" />}
      <span className="text-caption text-muted-foreground">
        <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{stats.withDomain}</span>{" "}
        with domain ·{" "}
        <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{stats.withoutDomain}</span>{" "}
        without
      </span>
    </div>
  );
}

/* ------------------------------------------------------- validation hints */

function ValidationHints({ onReveal }: { onReveal: (value: string) => void }) {
  const { stats, flaggedValues } = useListTool();
  const [open, setOpen] = useState(false);
  if (stats.flagged === 0) return null;
  const shown = flaggedValues.slice(0, 12);
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <TriangleAlert className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-caption text-amber-700 dark:text-amber-300">
          {stats.flagged} {stats.flagged === 1 ? "value contains" : "values contain"} spaces, lowercase letters or
          more than one "."
        </p>
        <Button variant="link" size="sm" className="h-auto px-0 py-0 text-caption" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      {open && (
        <div className="mt-2 flex flex-wrap gap-1">
          {shown.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onReveal(v)}
              className="rounded border border-amber-500/40 bg-background px-1.5 py-0.5 font-mono text-[11px] text-amber-700 hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-300"
              title="Select in input"
            >
              {v}
            </button>
          ))}
          {flaggedValues.length > shown.length && (
            <span className="px-1 py-0.5 text-caption text-muted-foreground">
              +{flaggedValues.length - shown.length} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ options box */

function OptionsPanel() {
  const { options, setOptions } = useListTool();
  const isQuotedComma = options.preset === "quoted-comma";
  const isSqlLike = options.preset === "sql" || options.preset === "otm-oids";
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="text-caption font-medium text-muted-foreground">Clean</p>
          <ToggleRow id="opt-trim" label="Trim whitespace" checked={options.trim} onChange={(v) => setOptions({ trim: v })} />
          <ToggleRow id="opt-blanks" label="Remove blanks" checked={options.removeBlanks} onChange={(v) => setOptions({ removeBlanks: v })} />
          <ToggleRow id="opt-dupes" label="Remove duplicates" checked={options.removeDuplicates} onChange={(v) => setOptions({ removeDuplicates: v })} />
          <ToggleRow
            id="opt-dupes-ci"
            label="Case-insensitive duplicates"
            checked={options.caseInsensitiveDuplicates}
            onChange={(v) => setOptions({ caseInsensitiveDuplicates: v })}
          />
          <Field label="Sort" className="mt-1">
            <Select value={options.sort} onValueChange={(v) => setOptions({ sort: v as SortMode })}>
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">None</SelectItem>
                <SelectItem value="az" className="text-xs">A–Z</SelectItem>
                <SelectItem value="za" className="text-xs">Z–A</SelectItem>
                <SelectItem value="natural" className="text-xs">Natural (ORL-2 before ORL-10)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DomainControl />
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Add prefix (to XID)">
            <Input value={options.addPrefix} onChange={(e) => setOptions({ addPrefix: e.target.value })} placeholder="e.g. ORL-" className="h-8 font-mono text-xs" spellCheck={false} />
          </Field>
          <Field label="Strip prefix">
            <Input value={options.stripPrefix} onChange={(e) => setOptions({ stripPrefix: e.target.value })} placeholder="e.g. ORL-" className="h-8 font-mono text-xs" spellCheck={false} />
          </Field>
          <Field label="Add suffix (to XID)">
            <Input value={options.addSuffix} onChange={(e) => setOptions({ addSuffix: e.target.value })} placeholder="e.g. -V2" className="h-8 font-mono text-xs" spellCheck={false} />
          </Field>
          <Field label="Strip suffix">
            <Input value={options.stripSuffix} onChange={(e) => setOptions({ stripSuffix: e.target.value })} placeholder="e.g. -V2" className="h-8 font-mono text-xs" spellCheck={false} />
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          <Field label="Case">
            <Select value={options.case} onValueChange={(v) => setOptions({ case: v as "keep" | "upper" })}>
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep" className="text-xs">Keep as pasted</SelectItem>
                <SelectItem value="upper" className="text-xs">UPPERCASE</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={isQuotedComma ? "Quote style" : "Quote style (quoted comma list)"}>
            <Select
              value={options.quoteStyle}
              onValueChange={(v) => setOptions({ quoteStyle: v as "single" | "double" | "none" })}
              disabled={!isQuotedComma}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="double" className="text-xs">Double "</SelectItem>
                <SelectItem value="single" className="text-xs">Single '</SelectItem>
                <SelectItem value="none" className="text-xs">None</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      {isSqlLike && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label={options.preset === "sql" ? "SQL column" : "Object ID column"}>
                <Input
                  value={options.sqlColumn}
                  onChange={(e) => setOptions({ sqlColumn: e.target.value })}
                  placeholder="SHIPMENT_GID"
                  className="h-8 font-mono text-xs uppercase"
                  spellCheck={false}
                />
              </Field>
              {options.preset === "sql" && (
                <div className="flex items-end justify-between gap-3 pb-1">
                  <Label htmlFor="opt-chunk" className="text-xs">
                    Chunk IN lists at {ORACLE_IN_LIMIT.toLocaleString()}
                  </Label>
                  <Switch id="opt-chunk" checked={options.chunkInLists} onCheckedChange={(v) => setOptions({ chunkInLists: v })} className="scale-90" />
                </div>
              )}
            </div>
            {options.preset === "sql" && options.chunkInLists && (
              <p className="inline-flex items-start gap-1.5 text-caption text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                Oracle rejects IN lists with more than {ORACLE_IN_LIMIT.toLocaleString()} literals. Longer lists
                are split into groups joined with OR — paste them together into your WHERE clause.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- main tool */

function OracleBanner({ count }: { count: number }) {
  const groups = Math.ceil(count / ORACLE_IN_LIMIT);
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
      <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-caption text-muted-foreground">
        Oracle rejects IN lists with more than {ORACLE_IN_LIMIT.toLocaleString()} literals, so this list is
        split into{" "}
        <span className="font-mono font-semibold tabular-nums text-foreground">{groups}</span>{" "}
        {groups === 1 ? "group" : "groups"} joined with OR — paste them together into your WHERE clause.
      </p>
    </div>
  );
}

function TrayMoreLink() {
  const navigate = useNavigate();
  const { setTrayOpen } = useApp();
  return (
    <button
      type="button"
      className="inline-flex w-fit items-center gap-1 text-caption text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => {
        setTrayOpen(false);
        navigate("/list");
      }}
    >
      More options
      <ArrowRight className="size-3" aria-hidden="true" />
    </button>
  );
}

export function ListTool({ variant }: { variant: "page" | "tray" }) {
  const tool = useListTool();
  const { input, setInput, options, setOptions, outputText, stats, copy, download, clear, swap, loadSample } = tool;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const pasteFromClipboard = () => {
    navigator.clipboard
      .readText()
      .then((text) => setInput(text))
      .catch(() => toast.error("Clipboard unavailable — paste with Ctrl/Cmd+V instead."));
  };

  const reveal = (value: string) => {
    const el = inputRef.current;
    if (!el) return;
    const idx = input.indexOf(value);
    if (idx < 0) return;
    el.focus();
    el.setSelectionRange(idx, idx + value.length);
    el.scrollTop = Math.max(0, (input.slice(0, idx).split("\n").length - 8) * 18);
  };

  // Ctrl/Cmd+↵ copies the output from anywhere on the page (window-level so it
  // still fires when focus sits outside the tool, e.g. after the empty state).
  useEffect(() => {
    if (variant !== "page") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant, copy]);

  const hasInput = input.trim().length > 0;
  const paneHeight = variant === "page" ? "h-80" : "h-36";
  const controlId = (name: string) => `list-${variant}-${name}`;

  if (!hasInput) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card text-center",
          variant === "page" ? "px-6 py-14" : "px-4 py-8",
        )}
      >
        <ListChecks className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">No values yet</p>
          <p className="mt-1 max-w-sm text-caption text-muted-foreground">
            Paste a list below, or start from sample data to see it cleaned and chunked live.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" onClick={loadSample}>
            <Wand2 className="size-4" aria-hidden="true" />
            Try sample data
          </Button>
          <Button size="sm" variant="outline" onClick={pasteFromClipboard}>
            <ClipboardPaste className="size-4" aria-hidden="true" />
            Paste from clipboard
          </Button>
        </div>
        <p className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          Pasted content is processed in your browser and never sent anywhere.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", variant === "page" && "outline-none")}>
      {/* Panes */}
      <div className={cn("grid gap-3", variant === "page" && "lg:grid-cols-2")}>
        <section aria-label="Input values" className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-caption font-medium text-muted-foreground">Input</h2>
            <span className="font-mono text-caption tabular-nums text-muted-foreground">
              {stats.valuesIn} {stats.valuesIn === 1 ? "value" : "values"}
            </span>
          </div>
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={"Paste values — new lines, commas, tabs or pipes all work…"}
            className={cn(paneHeight, "resize-none overflow-auto font-mono text-[13px] leading-5")}
            aria-label="Input values"
          />
        </section>
        <section aria-label="Output values" className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-caption font-medium text-muted-foreground">Output</h2>
            <span className="font-mono text-caption tabular-nums text-muted-foreground">
              {stats.valuesOut} {stats.valuesOut === 1 ? "value" : "values"}
            </span>
          </div>
          <Textarea
            readOnly
            value={outputText}
            spellCheck={false}
            className={cn(
              paneHeight,
              "resize-none overflow-auto font-mono text-[13px] leading-5",
              "border-primary/30 bg-muted/30",
            )}
            aria-label="Output values"
          />
        </section>
      </div>

      {/* Stats + validation */}
      <StatsBar />
      <ValidationHints onReveal={reveal} />

      {options.preset === "sql" && options.chunkInLists && stats.valuesOut > 0 && (
        <OracleBanner count={stats.valuesOut} />
      )}

      {/* Most-used controls */}
      <div className="flex flex-wrap items-end gap-2">
        <SplitSelect id={controlId("split")} />
        <PresetSelect id={controlId("preset")} />
        {variant === "tray" && (
          <>
            <Field label="Duplicates">
              <div className="flex h-8 items-center">
                <Switch
                  id={controlId("dupes")}
                  checked={options.removeDuplicates}
                  onCheckedChange={(v) => setOptions({ removeDuplicates: v })}
                  className="scale-90"
                />
              </div>
            </Field>
            <Field label="Domain">
              <Select
                value={options.domain}
                onValueChange={(v) => setOptions({ domain: v as DomainAction })}
              >
                <SelectTrigger id={controlId("domain")} className="h-8 w-[9.5rem] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DOMAIN_LABELS) as DomainAction[]).map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {DOMAIN_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}
      </div>

      {/* Options */}
      <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-fit gap-1.5 px-2 text-caption">
            <ChevronDown className={cn("size-3.5 transition-transform", optionsOpen && "rotate-180")} aria-hidden="true" />
            Options
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 data-[state=closed]:animate-none">
          {variant === "page" ? <OptionsPanel /> : <p className="text-caption text-muted-foreground">All options are available on the full page.</p>}
        </CollapsibleContent>
      </Collapsible>
      {variant === "tray" && <TrayMoreLink />}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={copy}>
          <Copy className="size-4" aria-hidden="true" />
          Copy output
          <KbdGroup aria-hidden="true">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
          </KbdGroup>
        </Button>
        <Button size="sm" variant="outline" onClick={download} disabled={stats.valuesOut === 0}>
          <Download className="size-4" aria-hidden="true" />
          Download .txt
        </Button>
        <Button size="sm" variant="outline" onClick={swap} disabled={stats.valuesOut === 0}>
          <ArrowDownUp className="size-4" aria-hidden="true" />
          Swap to input
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clear();
            inputRef.current?.focus();
          }}
        >
          <X className="size-4" aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  );
}
