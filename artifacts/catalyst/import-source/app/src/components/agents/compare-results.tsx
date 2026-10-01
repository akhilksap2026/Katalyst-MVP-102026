import { ViewTransition, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  ArrowDownUp,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCopy,
  Download,
  Equal,
  FileSpreadsheet,
  PencilLine,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { InfoTip } from "@/components/info-tip";
import { announce } from "@/components/shell/announcer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  actionChanges,
  diffLines,
  eventChanges,
  exportRows,
  summaryText,
  type AgentComparison,
  type AgentStatus,
  type CompareResult,
  type ExportRow,
} from "@/lib/compare";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------- tabs */

type Tab = "differences" | "changed" | "only-a" | "only-b" | "identical" | "all";

const TAB_LABELS: Record<Tab, string> = {
  differences: "All differences",
  changed: "Changed",
  "only-a": "Only in A",
  "only-b": "Only in B",
  identical: "Identical",
  all: "All agents",
};

function tabCount(tab: Tab, r: CompareResult): number {
  switch (tab) {
    case "differences":
      return r.counts.differences;
    case "changed":
      return r.counts.changed;
    case "only-a":
      return r.counts.onlyA;
    case "only-b":
      return r.counts.onlyB;
    case "identical":
      return r.counts.identical;
    case "all":
      return r.agents.length;
  }
}

function tabFilter(tab: Tab, status: AgentStatus): boolean {
  switch (tab) {
    case "differences":
      return status !== "identical";
    case "changed":
      return status === "changed";
    case "only-a":
      return status === "only-a";
    case "only-b":
      return status === "only-b";
    case "identical":
      return status === "identical";
    case "all":
      return true;
  }
}

/* ------------------------------------------------------------------ badge */

const STATUS_STYLE: Record<AgentStatus, string> = {
  changed: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "only-a": "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "only-b": "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  identical: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

function StatusBadge({ status, labelA, labelB }: { status: AgentStatus; labelA: string; labelB: string }) {
  const meta: Record<AgentStatus, { icon: typeof Check; label: string }> = {
    changed: { icon: PencilLine, label: "Changed" },
    "only-a": { icon: ArrowLeft, label: `Only in ${labelA}` },
    "only-b": { icon: ArrowDownUp, label: `Only in ${labelB}` },
    identical: { icon: Check, label: "Identical" },
  };
  const { icon: Icon, label } = meta[status];
  return (
    <Badge variant="outline" className={cn("gap-1.5", STATUS_STYLE[status])}>
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  );
}

function MiniBadge({
  status,
}: {
  status: "changed" | "added" | "removed" | "moved" | "only-a" | "only-b" | "identical";
}) {
  const map = {
    changed: { label: "changed", cls: "text-amber-600 border-amber-500/40 bg-amber-500/10" },
    moved: { label: "moved", cls: "text-orange-600 border-orange-500/40 bg-orange-500/10" },
    added: { label: "added", cls: "text-emerald-600 border-emerald-500/40 bg-emerald-500/10" },
    removed: { label: "removed", cls: "text-rose-600 border-rose-500/40 bg-rose-500/10" },
    "only-a": { label: "A only", cls: "text-sky-600 border-sky-500/40 bg-sky-500/10" },
    "only-b": { label: "B only", cls: "text-violet-600 border-violet-500/40 bg-violet-500/10" },
    identical: { label: "identical", cls: "text-muted-foreground" },
  } as const;
  const m = map[status];
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] uppercase", m.cls)}>
      {m.label}
    </Badge>
  );
}

/* ------------------------------------------------------------- line diff */

function ParamDiff({ a, b }: { a: string; b: string }) {
  const lines = useMemo(() => diffLines(a, b), [a, b]);
  return (
    <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-[11px] leading-5">
      {lines.map((l, i) => (
        <div
          key={i}
          className={cn(
            "whitespace-pre-wrap break-all px-1",
            l.type === "added" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
            l.type === "removed" && "bg-rose-500/15 text-rose-800 dark:text-rose-300",
          )}
        >
          <span className="mr-2 inline-block w-3 select-none text-muted-foreground">
            {l.type === "added" ? "+" : l.type === "removed" ? "−" : " "}
          </span>
          {l.text}
        </div>
      ))}
    </pre>
  );
}

function DiffValue({ value, changed, side }: { value: string | null; changed: boolean; side: "a" | "b" }) {
  return (
    <td
      className={cn(
        "max-w-[280px] whitespace-pre-wrap break-all px-3 py-1.5 align-top font-mono text-[11px]",
        changed && (side === "a" ? "bg-rose-500/10" : "bg-emerald-500/10"),
        value == null && "text-muted-foreground italic",
      )}
    >
      {value ?? "—"}
    </td>
  );
}

/* ------------------------------------------------------- change ordering */

interface ChangeItem {
  id: string;
  section: string;
  label: string;
}

function changeItems(cmp: AgentComparison): ChangeItem[] {
  const out: ChangeItem[] = [];
  cmp.headerDiffs.forEach((d, i) =>
    out.push({ id: `chg-hdr-${i}`, section: "Header", label: `${d.field}: ${d.valueA ?? "∅"} → ${d.valueB ?? "∅"}` }),
  );
  cmp.eventDiffs
    .filter((d) => d.status !== "identical")
    .forEach((d) => {
      const i = cmp.eventDiffs.indexOf(d);
      out.push({ id: `chg-ev-${i}`, section: "Events", label: d.eventGid });
    });
  cmp.actionDiffs
    .filter((d) => d.status !== "identical")
    .forEach((d) => {
      const i = cmp.actionDiffs.indexOf(d);
      out.push({ id: `chg-ac-${i}`, section: "Actions", label: `${d.actionGid} (${d.status})` });
    });
  return out;
}

/* ------------------------------------------------------------ references */

function RefChips({ title, items, other, markDiffer }: { title: string; items: string[]; other: string[]; markDiffer: boolean }) {
  if (items.length === 0 && other.length === 0) return null;
  const otherNorm = new Set(other.map((s) => s.toUpperCase()));
  return (
    <div className="grid gap-1">
      <p className="text-caption text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 && <span className="text-caption text-muted-foreground italic">none</span>}
        {items.map((gid) => {
          const differs = markDiffer && !otherNorm.has(gid.toUpperCase());
          return (
            <Badge
              key={gid}
              variant="outline"
              className={cn("font-mono text-[11px]", differs && "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400")}
            >
              {gid}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- detail panel */

function FieldRow({
  field,
  valueA,
  valueB,
  changeType,
  id,
}: {
  field: string;
  valueA: string | null;
  valueB: string | null;
  changeType: "added" | "removed" | "changed" | "same";
  id?: string;
}) {
  const changed = changeType !== "same";
  const isLong = (valueA?.length ?? 0) > 80 || (valueB?.length ?? 0) > 80;
  const [open, setOpen] = useState(false);
  return (
    <tr id={id} className="border-b last:border-0">
      <td className="w-40 shrink-0 px-3 py-1.5 align-top text-[12px] font-medium whitespace-nowrap">{field}</td>
      {isLong && open ? (
        <td colSpan={2} className="px-3 py-1.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-caption text-muted-foreground">Line-by-line diff</span>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              <ChevronUp className="size-3.5" aria-hidden="true" /> Collapse
            </Button>
          </div>
          <ParamDiff a={valueA ?? ""} b={valueB ?? ""} />
        </td>
      ) : (
        <>
          <DiffValue value={valueA} changed={changed} side="a" />
          <DiffValue value={valueB} changed={changed} side="b" />
        </>
      )}
      {!(isLong && open) && (
        <td className="w-10 px-2 py-1.5 align-top">
          {isLong && (
            <Button
              size="sm"
              variant="ghost"
              className="size-7 p-0"
              aria-label={`Open line diff for ${field}`}
              onClick={() => setOpen(true)}
            >
              <ChevronDown className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </td>
      )}
    </tr>
  );
}

function AgentDetail({
  cmp,
  labelA,
  labelB,
  changeIndex,
  onSelectChange,
  single,
}: {
  cmp: AgentComparison | null;
  labelA: string;
  labelB: string;
  changeIndex: number;
  onSelectChange: (i: number) => void;
  single: boolean;
}) {
  const items = useMemo(() => (cmp ? changeItems(cmp) : []), [cmp]);

  useEffect(() => {
    const el = document.getElementById(items[changeIndex]?.id ?? "");
    el?.scrollIntoView({ block: "nearest" });
  }, [changeIndex, items]);

  if (!cmp) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Select an agent in the list to inspect its differences.
      </div>
    );
  }

  if (cmp.status === "identical") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <Check className="size-8 text-emerald-600" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-sm font-medium">{cmp.xid} is identical in both sources</p>
        <p className="text-caption text-muted-foreground">
          No header, event or action differences under the current options.
        </p>
      </div>
    );
  }

  /* ---- single agent outline view ---- */
  if (single) {
    const agent = cmp.agentA ?? cmp.agentB!;
    const flows = new Map<number, typeof agent.actions>();
    for (const ac of agent.actions) {
      const list = flows.get(ac.flow) ?? [];
      list.push(ac);
      flows.set(ac.flow, list);
    }
    return (
      <div className="flex h-full flex-col gap-5 overflow-auto p-4">
        <div>
          <h4 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">Header</h4>
          <dl className="mt-1.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {Object.entries(agent.header).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[12px]">
                <dt className="w-44 shrink-0 truncate font-mono text-muted-foreground">{k}</dt>
                <dd className="min-w-0 break-all font-mono">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h4 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">Events</h4>
          <ul className="mt-1.5 grid gap-1.5">
            {agent.events.map((ev, i) => (
              <li key={i} className="rounded-md border px-3 py-2">
                <p className="text-[12px] font-medium">{ev.eventGid}</p>
                {ev.parameters && <p className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">{ev.parameters}</p>}
              </li>
            ))}
            {agent.events.length === 0 && <li className="text-caption text-muted-foreground italic">No events</li>}
          </ul>
        </div>
        <div>
          <h4 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">Actions</h4>
          <div className="mt-1.5 grid gap-3">
            {Array.from(flows.entries()).map(([flow, actions]) => (
              <div key={flow} className="rounded-md border">
                <p className="border-b bg-muted/40 px-3 py-1.5 font-mono text-[11px] font-semibold text-muted-foreground">
                  Flow {flow}
                </p>
                <ol className="grid">
                  {actions.map((ac, i) => (
                    <li key={i} className="flex items-baseline gap-3 border-b px-3 py-1.5 last:border-0">
                      <span className="w-8 shrink-0 font-mono text-[11px] text-muted-foreground">{ac.sequence}.</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium">{ac.actionGid}</p>
                        {ac.parameters && (
                          <p className="break-all font-mono text-[11px] text-muted-foreground">{ac.parameters}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            {agent.actions.length === 0 && <p className="text-caption text-muted-foreground italic">No actions</p>}
          </div>
        </div>
      </div>
    );
  }

  /* ---- diff view ---- */
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <span className="font-mono text-[13px] font-semibold">{cmp.xid}</span>
        <StatusBadge status={cmp.status} labelA={labelA} labelB={labelB} />
        <span className="ml-auto flex items-center gap-1 text-caption text-muted-foreground">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Previous change"
            disabled={items.length === 0}
            onClick={() => onSelectChange((changeIndex - 1 + items.length) % items.length)}
          >
            <SkipBack className="size-3.5" aria-hidden="true" /> Prev
          </Button>
          <span className="tabular-nums">
            {items.length === 0 ? 0 : changeIndex + 1}/{items.length}
          </span>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Next change"
            disabled={items.length === 0}
            onClick={() => onSelectChange((changeIndex + 1) % items.length)}
          >
            Next <SkipForward className="size-3.5" aria-hidden="true" />
          </Button>
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-5">
          {/* Header section */}
          <section aria-label="Header differences">
            <h4 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">Header</h4>
            <div className="mt-1.5 overflow-hidden rounded-md border">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-muted/40 text-caption text-muted-foreground">
                    <th className="px-3 py-1.5 font-medium">Field</th>
                    <th className="px-3 py-1.5 font-medium">A</th>
                    <th className="px-3 py-1.5 font-medium">B</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cmp.status === "changed" && cmp.headerDiffs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-caption text-muted-foreground italic">
                        No header differences
                      </td>
                    </tr>
                  )}
                  {cmp.status === "changed" &&
                    cmp.headerDiffs.map((d, i) => (
                      <FieldRow
                        key={d.field}
                        id={`chg-hdr-${i}`}
                        field={d.field}
                        valueA={d.valueA}
                        valueB={d.valueB}
                        changeType={d.changeType}
                      />
                    ))}
                  {(cmp.status === "only-a" || cmp.status === "only-b") &&
                    Object.entries((cmp.agentA ?? cmp.agentB)!.header).map(([k, v]) => (
                      <FieldRow
                        key={k}
                        field={k}
                        valueA={cmp.agentA ? v : null}
                        valueB={cmp.agentB ? v : null}
                        changeType={cmp.status === "only-a" ? "removed" : "added"}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Events section */}
          <section aria-label="Event differences">
            <h4 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">Events</h4>
            <div className="mt-1.5 grid gap-2">
              {cmp.eventDiffs.length === 0 && (
                <p className="text-caption text-muted-foreground italic">No events in either source</p>
              )}
              {cmp.eventDiffs.map((ev, i) => (
                <div key={`${ev.eventGid}-${i}`} id={`chg-ev-${i}`} className="overflow-hidden rounded-md border">
                  <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5">
                    <span className="font-mono text-[12px] font-medium">{ev.eventGid}</span>
                    <MiniBadge status={ev.status} />
                  </div>
                  {ev.status !== "identical" && (
                    <table className="w-full border-collapse text-left">
                      <tbody>
                        {ev.fields.map((d) => (
                          <FieldRow
                            key={d.field}
                            field={d.field}
                            valueA={d.valueA}
                            valueB={d.valueB}
                            changeType={d.changeType}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Actions section */}
          <section aria-label="Action differences">
            <h4 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
              Actions
            </h4>
            <div className="mt-1.5 grid gap-2">
              {cmp.actionDiffs.length === 0 && (
                <p className="text-caption text-muted-foreground italic">No actions in either source</p>
              )}
              {cmp.actionDiffs.map((ac, i) => {
                const pos = (f: number | null, s: number | null) =>
                  f == null ? "—" : `F${f}/S${s}`;
                return (
                  <div key={`${ac.actionGid}-${i}`} id={`chg-ac-${i}`} className="overflow-hidden rounded-md border">
                    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-1.5">
                      <span className="font-mono text-[12px] font-medium">{ac.actionGid}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {pos(ac.flowA, ac.sequenceA)} → {pos(ac.flowB, ac.sequenceB)}
                      </span>
                      <MiniBadge status={ac.status} />
                    </div>
                    {ac.status !== "identical" && ac.fields.length > 0 && (
                      <table className="w-full border-collapse text-left">
                        <tbody>
                          {ac.fields.map((d) => (
                            <FieldRow
                              key={d.field}
                              field={d.field}
                              valueA={d.valueA}
                              valueB={d.valueB}
                              changeType={d.changeType}
                            />
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* References */}
          <section aria-label="References">
            <h4 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">References</h4>
            <div className="mt-1.5 grid gap-3 rounded-md border p-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <RefChips
                  title={`Saved conditions in ${labelA}`}
                  items={cmp.conditionsA}
                  other={cmp.conditionsB}
                  markDiffer={cmp.status === "changed"}
                />
                <RefChips
                  title={`Saved queries in ${labelA}`}
                  items={cmp.queriesA}
                  other={cmp.queriesB}
                  markDiffer={cmp.status === "changed"}
                />
              </div>
              <div className="grid gap-2">
                <RefChips
                  title={`Saved conditions in ${labelB}`}
                  items={cmp.conditionsB}
                  other={cmp.conditionsA}
                  markDiffer={cmp.status === "changed"}
                />
                <RefChips
                  title={`Saved queries in ${labelB}`}
                  items={cmp.queriesB}
                  other={cmp.queriesA}
                  markDiffer={cmp.status === "changed"}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- main view */

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toCsv(rows: ExportRow[]): string {
  const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const line = (r: ExportRow) =>
    [r.xid, r.section, r.key, r.field, r.valueA, r.valueB, r.changeType].map(esc).join(",");
  return ["Agent XID,Section,Key,Field,Value A,Value B,Change type", ...rows.map(line)].join("\r\n");
}

export function CompareResults({ result, onBack }: { result: CompareResult; onBack: () => void }) {
  const { labelA, labelB } = result;
  const [tab, setTab] = useState<Tab>("differences");
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState({ xid: "", query: "", active: "", status: "" });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [changeIndex, setChangeIndex] = useState(0);
  const [single, setSingle] = useState(false);
  const [split, setSplit] = useState(52);
  const dragState = useRef<{ startY: number; startPct: number } | null>(null);

  const rows = useMemo(() => {
    return result.agents.filter((a) => tabFilter(tab, a.status));
  }, [result, tab]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cf = {
      xid: colFilter.xid.trim().toLowerCase(),
      query: colFilter.query.trim().toLowerCase(),
      active: colFilter.active.trim().toLowerCase(),
      status: colFilter.status.trim().toLowerCase(),
    };
    return rows.filter((a) => {
      const qa = a.agentA?.header.DATA_QUERY_TYPE_GID ?? "";
      const qb = a.agentB?.header.DATA_QUERY_TYPE_GID ?? "";
      const activeA = a.agentA?.header.IS_ACTIVE ?? "";
      const activeB = a.agentB?.header.IS_ACTIVE ?? "";
      const activeText = activeA === activeB ? activeA : `${activeA} ${activeB}`;
      const statusText =
        a.status === "only-a" ? `only in ${labelA}` : a.status === "only-b" ? `only in ${labelB}` : a.status;
      if (cf.xid && !a.xid.toLowerCase().includes(cf.xid)) return false;
      if (cf.query && !`${qa} ${qb}`.toLowerCase().includes(cf.query)) return false;
      if (cf.active && !activeText.toLowerCase().includes(cf.active)) return false;
      if (cf.status && !statusText.toLowerCase().includes(cf.status)) return false;
      if (
        q &&
        !`${a.xid} ${qa} ${qb} ${activeText} ${statusText}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [rows, search, colFilter, labelA, labelB]);

  const selected = visible.find((a) => a.key === selectedKey) ?? visible[0] ?? null;

  // Reset change navigation when the selection changes (derive during render, not in an effect).
  const [prevKey, setPrevKey] = useState(selected?.key);
  if (prevKey !== selected?.key) {
    setPrevKey(selected?.key);
    setChangeIndex(0);
  }

  // J / K keyboard shortcuts for change navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      const items = selected ? changeItems(selected).length : 0;
      if (items === 0) return;
      if (e.key === "j" || e.key === "J") {
        setChangeIndex((i) => (i + 1) % items);
      } else if (e.key === "k" || e.key === "K") {
        setChangeIndex((i) => (i - 1 + items) % items);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const onDragStart = (e: React.MouseEvent) => {
    dragState.current = { startY: e.clientY, startPct: split };
    const onMove = (ev: MouseEvent) => {
      const d = dragState.current;
      if (!d) return;
      const host = document.getElementById("agents-split");
      if (!host) return;
      const dy = ((ev.clientY - d.startY) / host.clientHeight) * 100;
      setSplit(Math.min(80, Math.max(20, d.startPct + dy)));
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const exportAll = useCallback(() => {
    const rowsAll = result.agents.filter((a) => a.status !== "identical").flatMap(exportRows);
    if (rowsAll.length === 0) {
      toast.info("No differences to export");
      return;
    }
    const stem = `agent-differences-${labelA}-vs-${labelB}`;
    return { rowsAll, stem };
  }, [result, labelA, labelB]);

  const exportCsv = () => {
    const data = exportAll();
    if (!data) return;
    download(`${data.stem}.csv`, toCsv(data.rowsAll), "text/csv");
    toast.success(`Exported ${data.rowsAll.length} differences to CSV`);
    track("agents_exported", data.rowsAll.length, { format: "csv" });
    announce(`Exported ${data.rowsAll.length} differences to CSV`);
  };

  const exportExcel = () => {
    const data = exportAll();
    if (!data) return;
    const ws = XLSX.utils.json_to_sheet(
      data.rowsAll.map((r) => ({
        "Agent XID": r.xid, Section: r.section, Key: r.key, Field: r.field,
        "Value A": r.valueA, "Value B": r.valueB, "Change type": r.changeType,
      })),
    );
    ws["!cols"] = [{ wch: 24 }, { wch: 8 }, { wch: 24 }, { wch: 28 }, { wch: 40 }, { wch: 40 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Differences");
    XLSX.writeFile(wb, `${data.stem}.xlsx`);
    toast.success(`Exported ${data.rowsAll.length} differences to Excel`);
    track("agents_exported", data.rowsAll.length, { format: "xlsx" });
    announce(`Exported ${data.rowsAll.length} differences to Excel`);
  };

  const copySummary = async () => {
    const text = summaryText(result);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Summary copied to clipboard");
      track("agents_summary_copied", result.counts.differences);
      announce(`Summary copied: ${result.counts.differences} differences`);
    } catch {
      // Clipboard can be unavailable (permissions); show the text instead.
      toast.info("Clipboard unavailable — summary shown in console", { description: text.slice(0, 200) });
      console.log(text);
    }
  };

  const strip: { tab: Tab; label: string; value: number }[] = [
    { tab: "changed", label: "Changed", value: result.counts.changed },
    { tab: "only-a", label: `Only in ${labelA}`, value: result.counts.onlyA },
    { tab: "only-b", label: `Only in ${labelB}`, value: result.counts.onlyB },
    { tab: "identical", label: "Identical", value: result.counts.identical },
  ];

  return (
    <div className="flex flex-col gap-4">
      {result.duplicates.length > 0 && (
        <p role="alert" className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          {result.duplicates.length} agent(s) share a match key with another agent in the same source and were skipped:{" "}
          <span className="font-mono">{result.duplicates.map((d) => `${d.source}:${d.key}`).join(", ")}</span>. Try matching by GID.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ChevronRight className="size-4 rotate-180" aria-hidden="true" /> Back to review
        </Button>
        <span className="text-sm text-muted-foreground">
          <span className="font-mono font-medium text-foreground">{labelA}</span>
          {" vs "}
          <span className="font-mono font-medium text-foreground">{labelB}</span>
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={copySummary} data-testid="agents-copy-summary">
            <ClipboardCopy className="size-3.5" aria-hidden="true" /> Copy summary
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} data-testid="agents-export-csv">
            <Download className="size-3.5" aria-hidden="true" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={exportExcel} data-testid="agents-export-xlsx">
            <FileSpreadsheet className="size-3.5" aria-hidden="true" /> Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm" role="status">
        {result.counts.differences === 0 ? (
          <span>No differences between <b>{labelA}</b> and <b>{labelB}</b> under the current options.</span>
        ) : (
          <span>
            <b>{result.counts.differences}</b> of {result.agents.length} agents differ between <b>{labelA}</b> and <b>{labelB}</b>.
            {" "}Select a row to see exactly what changed; identical agents are hidden by default.
          </span>
        )}
        <InfoTip
          text="Changed = on both sides with different header, events or actions. Only in X = exists on just one side. Identical = same under your Options (footprint columns are ignored by default)."
          ask="Give me a summary"
          label="What do these statuses mean?"
        />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="group" aria-label="Summary">
        {strip.map((s) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => startTransition(() => setTab(s.tab))}
            aria-pressed={tab === s.tab}
            data-testid={`agents-strip-${s.tab}`}
            className={cn(
              "rounded-lg border px-4 py-3 text-left transition-colors",
              tab === s.tab ? "border-primary bg-primary/5" : "bg-card hover:border-primary/50",
            )}
          >
            <p className="text-caption text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Result filters" className="flex flex-wrap gap-1">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => startTransition(() => setTab(t))}
              data-testid={`agents-tab-${t}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {t === "only-a" ? `Only in ${labelA}` : t === "only-b" ? `Only in ${labelB}` : TAB_LABELS[t]}
              <span className="ml-1.5 text-caption tabular-nums opacity-70">{tabCount(t, result)}</span>
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents…"
          aria-label="Search agents"
          className="ml-auto h-8 w-52"
        />
      </div>

      {/* Resizable split: list top, detail bottom */}
      <div id="agents-split" className="flex flex-col rounded-lg border bg-card" style={{ height: 780 }}>
        <div className="overflow-auto" style={{ height: `${split}%` }}>
          <div className="min-w-[680px]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b text-caption text-muted-foreground">
                <th className="px-2 py-2 font-medium">
                  <Input
                    value={colFilter.xid}
                    onChange={(e) => setColFilter({ ...colFilter, xid: e.target.value })}
                    placeholder="Agent XID"
                    aria-label="Filter by agent XID"
                    className="h-6 w-24 border-none bg-transparent px-1 text-caption shadow-none focus-visible:ring-0"
                  />
                </th>
                <th className="px-2 py-2 font-medium">
                  <Input
                    value={colFilter.query}
                    onChange={(e) => setColFilter({ ...colFilter, query: e.target.value })}
                    placeholder="Data query type"
                    aria-label="Filter by data query type"
                    className="h-6 w-20 border-none bg-transparent px-1 text-caption shadow-none focus-visible:ring-0"
                  />
                </th>
                <th className="px-2 py-2 font-medium">
                  <Input
                    value={colFilter.active}
                    onChange={(e) => setColFilter({ ...colFilter, active: e.target.value })}
                    placeholder="Active (A / B)"
                    aria-label="Filter by active state"
                    className="h-6 w-20 border-none bg-transparent px-1 text-caption shadow-none focus-visible:ring-0"
                  />
                </th>
                <th className="px-2 py-2 text-right font-medium">Events changed <InfoTip text="Number of events (the triggers that fire the agent) that were added, removed or edited." label="About events" /></th>
                <th className="px-2 py-2 text-right font-medium">Actions changed <InfoTip text="Number of actions (what the agent does, in flow/sequence order) that were added, removed, moved or edited." ask="What does moved mean?" label="About actions" /></th>
                <th className="px-2 py-2 font-medium">
                  <Input
                    value={colFilter.status}
                    onChange={(e) => setColFilter({ ...colFilter, status: e.target.value })}
                    placeholder="Status"
                    aria-label="Filter by status"
                    className="h-6 w-24 border-none bg-transparent px-1 text-caption shadow-none focus-visible:ring-0"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => {
                const qa = a.agentA?.header.DATA_QUERY_TYPE_GID ?? null;
                const qb = a.agentB?.header.DATA_QUERY_TYPE_GID ?? null;
                const aa = a.agentA?.header.IS_ACTIVE ?? null;
                const ab = a.agentB?.header.IS_ACTIVE ?? null;
                const ec = eventChanges(a);
                const ac = actionChanges(a);
                const isSel = selected?.key === a.key;
                return (
                  <ViewTransition key={a.key}>
                  <tr

                    onClick={() => setSelectedKey(a.key)}
                    aria-selected={isSel}
                    data-testid={`agents-row-${a.xid}`}
                    className={cn(
                      "cursor-pointer border-b last:border-0",
                      isSel ? "bg-primary/5" : "hover:bg-muted/40",
                    )}
                  >
                    <td className="px-2 py-2 font-mono text-[12px] font-medium">{a.xid}</td>
                    <td className="px-2 py-2 font-mono text-[11px]">
                      {qa ?? "—"}
                      {qa !== qb && qb != null && <span className="text-muted-foreground"> → {qb}</span>}
                      {qb == null && qa != null && a.agentB && <span className="text-muted-foreground"> (no col)</span>}
                    </td>
                    <td className="px-2 py-2 font-mono text-[11px]">
                      {aa ?? "—"}
                      {aa !== ab && <span className="text-muted-foreground"> → {ab ?? "—"}</span>}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{ec}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{ac}</td>
                    <td className="px-2 py-2">
                      <StatusBadge status={a.status} labelA={labelA} labelB={labelB} />
                    </td>
                  </tr>
                  </ViewTransition>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-caption text-muted-foreground">
                    No agents match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* drag handle */}
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize detail panel"
          onMouseDown={onDragStart}
          className="flex h-2 cursor-row-resize items-center justify-center border-y bg-muted/30 hover:bg-primary/20"
        >
          <div className="h-0.5 w-10 rounded bg-muted-foreground/40" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-1.5">
            <Label htmlFor="agents-single-view" className="text-caption text-muted-foreground">
              Single agent view
            </Label>
            <InfoTip text="Show one agent's full structure (events, then actions by flow) instead of only its differences." label="About single agent view" />
            <Switch
              id="agents-single-view"
              checked={single}
              onCheckedChange={setSingle}
              data-testid="agents-single-toggle"
            />
            <span className="ml-auto hidden items-center gap-1 text-caption text-muted-foreground sm:flex">
              <Equal className="size-3" aria-hidden="true" /> Press <kbd className="rounded border px-1">J</kbd>/
              <kbd className="rounded border px-1">K</kbd> to move between changes
            </span>
          </div>
          <AgentDetail
            cmp={selected ?? null}
            labelA={labelA}
            labelB={labelB}
            changeIndex={changeIndex}
            onSelectChange={setChangeIndex}
            single={single}
          />
        </div>
      </div>
    </div>
  );
}
