import { StatusBadge, type StatusBadgeStatus } from "@workspace/ksap-cloud-ui/components/patterns/status-badge";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@workspace/ksap-cloud-ui/components/ui/resizable";
import { Kbd } from "@workspace/ksap-cloud-ui/components/ui/kbd";
import { Trans, useTranslation } from "react-i18next";
import { Fragment, startTransition, useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardCopy,
  Download,
  Equal,
  FileSpreadsheet,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { toast } from "@workspace/ksap-cloud-ui/components/ui/sonner";
import { track } from "@/lib/analytics";
import { InfoTip } from "@/components/info-tip";
import { announce } from "@/components/shell/announcer";
import { Badge } from "@workspace/ksap-cloud-ui/components/ui/badge";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Input } from "@workspace/ksap-cloud-ui/components/ui/input";
import { Label } from "@workspace/ksap-cloud-ui/components/ui/label";
import { Switch } from "@workspace/ksap-cloud-ui/components/ui/switch";
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
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";

/* ------------------------------------------------------------------- tabs */

type Tab = "differences" | "changed" | "only-a" | "only-b" | "identical" | "all";

const TABS: Tab[] = ["differences", "changed", "only-a", "only-b", "identical", "all"];

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

const STATUS_VARIANT = {
  changed: "warning",
  "only-a": "info",
  "only-b": "neutral",
  identical: "success",
} as const satisfies Record<AgentStatus, StatusBadgeStatus>;

function AgentStatusBadge({ status, labelA, labelB }: { status: AgentStatus; labelA: string; labelB: string }) {
  const { t } = useTranslation();
  const label =
    status === "changed"
      ? t("compareResults.statusChanged")
      : status === "identical"
        ? t("compareResults.statusIdentical")
        : t("compareResults.onlyIn", { label: status === "only-a" ? labelA : labelB });
  return <StatusBadge status={STATUS_VARIANT[status]}>{label}</StatusBadge>;
}

function MiniBadge({
  status,
}: {
  status: "changed" | "added" | "removed" | "moved" | "only-a" | "only-b" | "identical";
}) {
  const { t } = useTranslation();
  const map = {
    changed: { label: t("compareResults.miniChanged"), variant: "warning" },
    moved: { label: t("compareResults.miniMoved"), variant: "warning" },
    added: { label: t("compareResults.miniAdded"), variant: "success" },
    removed: { label: t("compareResults.miniRemoved"), variant: "danger" },
    "only-a": { label: t("compareResults.miniOnlyA"), variant: "info" },
    "only-b": { label: t("compareResults.miniOnlyB"), variant: "neutral" },
    identical: { label: t("compareResults.miniIdentical"), variant: "neutral" },
  } as const satisfies Record<string, { label: string; variant: StatusBadgeStatus }>;
  const m = map[status];
  return <StatusBadge status={m.variant}>{m.label}</StatusBadge>;
}

/* ------------------------------------------------------------- line diff */

function ParamDiff({ a, b }: { a: string; b: string }) {
  const lines = useMemo(() => diffLines(a, b), [a, b]);
  return (
    <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-caption leading-5">
      {lines.map((l, i) => (
        <div
          key={i}
          className={cn(
            "whitespace-pre-wrap break-all px-1",
            l.type === "added" && "bg-success-subtle text-success",
            l.type === "removed" && "bg-danger-subtle text-danger",
          )}
        >
          <span className="me-2 inline-block w-3 select-none text-muted-foreground">
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
        "max-w-xs whitespace-pre-wrap break-all px-3 py-2 align-top font-mono text-caption",
        changed && (side === "a" ? "bg-danger-subtle" : "bg-success-subtle"),
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
  const { t } = useTranslation();
  if (items.length === 0 && other.length === 0) return null;
  const otherNorm = new Set(other.map((s) => s.toUpperCase()));
  return (
    <div className="grid gap-1">
      <p className="text-caption text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-caption text-muted-foreground italic">{t("compareResults.none")}</span>}
        {items.map((gid) => {
          const differs = markDiffer && !otherNorm.has(gid.toUpperCase());
          return (
            <Badge
              key={gid}
              variant="outline"
              className={cn("font-mono text-caption", differs && "border-warning bg-warning-subtle text-warning")}
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
  const { t } = useTranslation();
  const changed = changeType !== "same";
  const isLong = (valueA?.length ?? 0) > 80 || (valueB?.length ?? 0) > 80;
  const [open, setOpen] = useState(false);
  return (
    <tr id={id} className="border-b last:border-0">
      <td className="w-40 shrink-0 px-3 py-2 align-top text-caption font-semibold whitespace-nowrap">{field}</td>
      {isLong && open ? (
        <td colSpan={2} className="px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-caption text-muted-foreground">{t("compareResults.lineByLineDiff")}</span>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              <ChevronUp className="size-icon-sm" aria-hidden="true" />{" "}{t("compareResults.collapse")}
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
        <td className="w-10 px-2 py-2 align-top">
          {isLong && (
            <Button
              size="sm"
              variant="ghost"
              className="size-7 p-0"
              aria-label={t("compareResults.openLineDiff", { field })}
              onClick={() => setOpen(true)}
            >
              <ChevronDown className="size-icon-sm" aria-hidden="true" />
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
  const { t } = useTranslation();
  const items = useMemo(() => (cmp ? changeItems(cmp) : []), [cmp]);

  useEffect(() => {
    const el = document.getElementById(items[changeIndex]?.id ?? "");
    el?.scrollIntoView({ block: "nearest" });
  }, [changeIndex, items]);

  if (!cmp) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-body text-muted-foreground">
        {t("compareResults.selectAnAgentIn")}
      </div>
    );
  }

  if (cmp.status === "identical") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <Check className="size-icon-lg text-success" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-body font-semibold">{t("compareResults.xidIsIdenticalIn", { xid: cmp.xid })}</p>
        <p className="text-caption text-muted-foreground">
          {t("compareResults.noHeaderEventOr")}
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
          <h4 className="text-caption font-semibold text-muted-foreground">{t("compareResults.header")}</h4>
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {Object.entries(agent.header).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-caption">
                <dt className="w-44 shrink-0 truncate font-mono text-muted-foreground">{k}</dt>
                <dd className="min-w-0 break-all font-mono">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h4 className="text-caption font-semibold text-muted-foreground">{t("compareResults.events")}</h4>
          <ul className="mt-2 grid gap-2">
            {agent.events.map((ev, i) => (
              <li key={i} className="rounded-md border px-3 py-2">
                <p className="text-caption font-semibold">{ev.eventGid}</p>
                {ev.parameters && <p className="mt-1 break-all font-mono text-caption text-muted-foreground">{ev.parameters}</p>}
              </li>
            ))}
            {agent.events.length === 0 && <li className="text-caption text-muted-foreground italic">{t("compareResults.noEvents")}</li>}
          </ul>
        </div>
        <div>
          <h4 className="text-caption font-semibold text-muted-foreground">{t("compareResults.actions")}</h4>
          <div className="mt-2 grid gap-3">
            {Array.from(flows.entries()).map(([flow, actions]) => (
              <div key={flow} className="rounded-md border">
                <p className="border-b bg-muted/40 px-3 py-2 font-mono text-caption font-semibold text-muted-foreground">
                  {t("compareResults.flowFlow", { flow })}
                </p>
                <ol className="grid">
                  {actions.map((ac, i) => (
                    <li key={i} className="flex items-baseline gap-3 border-b px-3 py-2 last:border-0">
                      <span className="w-8 shrink-0 font-mono text-caption text-muted-foreground">{ac.sequence}.</span>
                      <div className="min-w-0">
                        <p className="text-caption font-semibold">{ac.actionGid}</p>
                        {ac.parameters && (
                          <p className="break-all font-mono text-caption text-muted-foreground">{ac.parameters}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            {agent.actions.length === 0 && <p className="text-caption text-muted-foreground italic">{t("compareResults.noActions")}</p>}
          </div>
        </div>
      </div>
    );
  }

  /* ---- diff view ---- */
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <span className="font-mono text-body font-semibold">{cmp.xid}</span>
        <AgentStatusBadge status={cmp.status} labelA={labelA} labelB={labelB} />
        <span className="ms-auto flex items-center gap-1 text-caption text-muted-foreground">
          <Button
            size="sm"
            variant="ghost"
            aria-label={t("compareResults.previousChange")}
            disabled={items.length === 0}
            onClick={() => onSelectChange((changeIndex - 1 + items.length) % items.length)}
          >
            <SkipBack className="size-icon-sm" aria-hidden="true" />{" "}{t("compareResults.prev")}
          </Button>
          <span className="tabular-nums">
            {items.length === 0 ? 0 : changeIndex + 1}/{items.length}
          </span>
          <Button
            size="sm"
            variant="ghost"
            aria-label={t("compareResults.nextChange")}
            disabled={items.length === 0}
            onClick={() => onSelectChange((changeIndex + 1) % items.length)}
          >
            {t("compareResults.next")}{" "}<SkipForward className="size-icon-sm" aria-hidden="true" />
          </Button>
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid gap-5">
          {/* Header section */}
          <section aria-label={t("compareResults.headerDifferences")}>
            <h4 className="text-caption font-semibold text-muted-foreground">{t("compareResults.header")}</h4>
            <div className="mt-2 overflow-hidden rounded-md border">
              <table className="w-full border-collapse text-start">
                <thead>
                  <tr className="border-b bg-muted/40 text-caption text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">{t("compareResults.field")}</th>
                    <th className="px-3 py-2 font-semibold">{t("compareResults.a")}</th>
                    <th className="px-3 py-2 font-semibold">{t("compareResults.b")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cmp.status === "changed" && cmp.headerDiffs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-caption text-muted-foreground italic">
                        {t("compareResults.noHeaderDifferences")}
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
          <section aria-label={t("compareResults.eventDifferences")}>
            <h4 className="text-caption font-semibold text-muted-foreground">{t("compareResults.events")}</h4>
            <div className="mt-2 grid gap-2">
              {cmp.eventDiffs.length === 0 && (
                <p className="text-caption text-muted-foreground italic">{t("compareResults.noEventsInEither")}</p>
              )}
              {cmp.eventDiffs.map((ev, i) => (
                <div key={`${ev.eventGid}-${i}`} id={`chg-ev-${i}`} className="overflow-hidden rounded-md border">
                  <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
                    <span className="font-mono text-caption font-semibold">{ev.eventGid}</span>
                    <MiniBadge status={ev.status} />
                  </div>
                  {ev.status !== "identical" && (
                    <table className="w-full border-collapse text-start">
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
          <section aria-label={t("compareResults.actionDifferences")}>
            <h4 className="text-caption font-semibold text-muted-foreground">
              {t("compareResults.actions")}
            </h4>
            <div className="mt-2 grid gap-2">
              {cmp.actionDiffs.length === 0 && (
                <p className="text-caption text-muted-foreground italic">{t("compareResults.noActionsInEither")}</p>
              )}
              {cmp.actionDiffs.map((ac, i) => {
                const pos = (f: number | null, s: number | null) =>
                  f == null ? "—" : `F${f}/S${s}`;
                return (
                  <div key={`${ac.actionGid}-${i}`} id={`chg-ac-${i}`} className="overflow-hidden rounded-md border">
                    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
                      <span className="font-mono text-caption font-semibold">{ac.actionGid}</span>
                      <span className="font-mono text-caption text-muted-foreground">
                        {pos(ac.flowA, ac.sequenceA)} → {pos(ac.flowB, ac.sequenceB)}
                      </span>
                      <MiniBadge status={ac.status} />
                    </div>
                    {ac.status !== "identical" && ac.fields.length > 0 && (
                      <table className="w-full border-collapse text-start">
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
          <section aria-label={t("compareResults.references")}>
            <h4 className="text-caption font-semibold text-muted-foreground">{t("compareResults.references")}</h4>
            <div className="mt-2 grid gap-3 rounded-md border p-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <RefChips
                  title={t("compareResults.savedConditionsIn", { label: labelA })}
                  items={cmp.conditionsA}
                  other={cmp.conditionsB}
                  markDiffer={cmp.status === "changed"}
                />
                <RefChips
                  title={t("compareResults.savedQueriesIn", { label: labelA })}
                  items={cmp.queriesA}
                  other={cmp.queriesB}
                  markDiffer={cmp.status === "changed"}
                />
              </div>
              <div className="grid gap-2">
                <RefChips
                  title={t("compareResults.savedConditionsIn", { label: labelB })}
                  items={cmp.conditionsB}
                  other={cmp.conditionsA}
                  markDiffer={cmp.status === "changed"}
                />
                <RefChips
                  title={t("compareResults.savedQueriesIn", { label: labelB })}
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

function toSpreadsheetXml(rows: ExportRow[]): string {
  const columns = ["Agent XID", "Section", "Key", "Field", "Value A", "Value B", "Change type"];
  const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const row = (values: string[]) => `<Row>${values.map((value) => `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`).join("")}</Row>`;
  const records = rows.map((r) => [r.xid, r.section, r.key, r.field, r.valueA, r.valueB, r.changeType]);
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Differences"><Table>${row(columns)}${records.map(row).join("")}</Table></Worksheet></Workbook>`;
}

export function CompareResults({ result, onBack }: { result: CompareResult; onBack: () => void }) {
  const { t } = useTranslation();
  const { labelA, labelB } = result;
  const [tab, setTab] = useState<Tab>("differences");
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState({ xid: "", query: "", active: "", status: "" });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [changeIndex, setChangeIndex] = useState(0);
  const [single, setSingle] = useState(false);

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
        a.status === "only-a" ? t("compareResults.onlyIn", { label: labelA }) : a.status === "only-b" ? t("compareResults.onlyIn", { label: labelB }) : a.status === "changed" ? t("compareResults.statusChanged") : t("compareResults.statusIdentical");
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

  const exportAll = useCallback(() => {
    const rowsAll = result.agents.filter((a) => a.status !== "identical").flatMap(exportRows);
    if (rowsAll.length === 0) {
      toast.info(t("compareResults.noDifferencesToExport"));
      return;
    }
    const stem = `agent-differences-${labelA}-vs-${labelB}`;
    return { rowsAll, stem };
  }, [result, labelA, labelB]);

  const exportCsv = () => {
    const data = exportAll();
    if (!data) return;
    download(`${data.stem}.csv`, toCsv(data.rowsAll), "text/csv");
    toast.success(t("compareResults.exportedCsv", { count: data.rowsAll.length }));
    track("agents_exported", data.rowsAll.length, { format: "csv" });
    announce(t("compareResults.exportedCsv", { count: data.rowsAll.length }));
  };

  const exportExcel = () => {
    const data = exportAll();
    if (!data) return;
    download(`${data.stem}.xls`, toSpreadsheetXml(data.rowsAll), "application/vnd.ms-excel;charset=utf-8");
    toast.success(t("compareResults.exportedExcel", { count: data.rowsAll.length }));
    track("agents_exported", data.rowsAll.length, { format: "xlsx" });
    announce(t("compareResults.exportedExcel", { count: data.rowsAll.length }));
  };

  const copySummary = async () => {
    const text = summaryText(result);
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("compareResults.summaryCopiedToClipboard"));
      track("agents_summary_copied", result.counts.differences);
      announce(t("compareResults.summaryCopiedCount", { count: result.counts.differences }));
    } catch {
      // Clipboard can be unavailable (permissions); show the text instead.
      toast.info(t("compareResults.clipboardUnavailableSummaryShown"), { description: text.slice(0, 200) });
      console.log(text);
    }
  };

  const tabLabel = (id: Tab) =>
    id === "only-a" || id === "only-b"
      ? t("compareResults.onlyIn", { label: id === "only-a" ? labelA : labelB })
      : t(`compareResults.tabs.${id}`);

  const strip: { tab: Tab; label: string; value: number }[] = [
    { tab: "changed", label: t("compareResults.labelChanged"), value: result.counts.changed },
    { tab: "only-a", label: t("compareResults.onlyIn", { label: labelA }), value: result.counts.onlyA },
    { tab: "only-b", label: t("compareResults.onlyIn", { label: labelB }), value: result.counts.onlyB },
    { tab: "identical", label: t("compareResults.labelIdentical"), value: result.counts.identical },
  ];

  return (
    <div className="flex flex-col gap-4">
      {result.duplicates.length > 0 && (
        <p role="alert" className="rounded-md border border-warning bg-warning-subtle px-3 py-2 text-body">
          {t("compareResults.lengthAgentSShare", { length: result.duplicates.length })}{" "}
          <span className="font-mono">{result.duplicates.map((d) => `${d.source}:${d.key}`).join(", ")}</span>{t("compareResults.tryMatchingByGid")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ChevronRight className="size-icon-sm rotate-180" aria-hidden="true" />{" "}{t("compareResults.backToReview")}
        </Button>
        <span className="text-body text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{labelA}</span>
          {" vs "}
          <span className="font-mono font-semibold text-foreground">{labelB}</span>
        </span>
        <div className="ms-auto flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={copySummary} data-testid="agents-copy-summary">
            <ClipboardCopy className="size-icon-sm" aria-hidden="true" />{" "}{t("compareResults.copySummary")}
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} data-testid="agents-export-csv">
            <Download className="size-icon-sm" aria-hidden="true" />{" "}{t("compareResults.csv")}
          </Button>
          <Button size="sm" variant="outline" onClick={exportExcel} data-testid="agents-export-xlsx">
            <FileSpreadsheet className="size-icon-sm" aria-hidden="true" />{" "}{t("compareResults.excel")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-3 text-body" role="status">
        {result.counts.differences === 0 ? (
          <span>{t("compareResults.noDifferencesBetween")}{" "}<b>{labelA}</b>{" "}{t("compareResults.and")}{" "}<b>{labelB}</b>{" "}{t("compareResults.underTheCurrentOptions")}</span>
        ) : (
          <span>
            <b>{result.counts.differences}</b>{" "}{t("compareResults.ofLengthAgentsDiffer", { length: result.agents.length })}{" "}<b>{labelA}</b>{" "}{t("compareResults.and")}{" "}<b>{labelB}</b>.
            {" "}{t("compareResults.selectARowTo")}
          </span>
        )}
        <InfoTip
          text={t("compareResults.statusLegend")}
          ask="Give me a summary"
          label={t("compareResults.whatDoTheseStatuses")}
        />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="group" aria-label={t("compareResults.summary")}>
        {strip.map((s) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => startTransition(() => setTab(s.tab))}
            aria-pressed={tab === s.tab}
            data-testid={`agents-strip-${s.tab}`}
            className={cn(
              "rounded-lg border px-4 py-3 text-start transition-colors",
              tab === s.tab ? "border-primary bg-primary/5" : "bg-card hover:border-primary/50",
            )}
          >
            <p className="text-caption text-muted-foreground">{s.label}</p>
            <p className="text-title font-semibold tabular-nums">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label={t("compareResults.resultFilters")} className="flex flex-wrap gap-1">
          {TABS.map((tabId) => (
            <button
              key={tabId}
              role="tab"
              aria-selected={tab === tabId}
              onClick={() => startTransition(() => setTab(tabId))}
              data-testid={`agents-tab-${tabId}`}
              className={cn(
                "rounded-md px-3 py-2 text-body transition-colors",
                tab === tabId ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {tabLabel(tabId)}
              <span className="ms-2 text-caption tabular-nums opacity-70">{tabCount(tabId, result)}</span>
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("compareResults.searchAgents")}
          aria-label={t("compareResults.searchAgents2")}
          className="ms-auto h-8 w-52"
        />
      </div>

      {/* Resizable split: list top, detail bottom */}
      <ResizablePanelGroup direction="vertical" className="h-dvh max-h-table rounded-lg border bg-card">
        <ResizablePanel defaultSize={52} minSize={20} maxSize={80} className="overflow-auto">
          <div className="min-w-max">
          <table className="w-full border-collapse text-start text-body">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b text-caption text-muted-foreground">
                <th className="px-2 py-2 font-semibold">
                  <Input
                    value={colFilter.xid}
                    onChange={(e) => setColFilter({ ...colFilter, xid: e.target.value })}
                    placeholder={t("compareResults.agentXid")}
                    aria-label={t("compareResults.filterByAgentXid")}
                    className="h-6 w-24 border-none bg-transparent px-1 text-caption focus-visible:ring-0"
                  />
                </th>
                <th className="px-2 py-2 font-semibold">
                  <Input
                    value={colFilter.query}
                    onChange={(e) => setColFilter({ ...colFilter, query: e.target.value })}
                    placeholder={t("compareResults.dataQueryType")}
                    aria-label={t("compareResults.filterByDataQuery")}
                    className="h-6 w-20 border-none bg-transparent px-1 text-caption focus-visible:ring-0"
                  />
                </th>
                <th className="px-2 py-2 font-semibold">
                  <Input
                    value={colFilter.active}
                    onChange={(e) => setColFilter({ ...colFilter, active: e.target.value })}
                    placeholder={t("compareResults.activeAB")}
                    aria-label={t("compareResults.filterByActiveState")}
                    className="h-6 w-20 border-none bg-transparent px-1 text-caption focus-visible:ring-0"
                  />
                </th>
                <th className="px-2 py-2 text-end font-semibold">{t("compareResults.eventsChanged")}{" "}<InfoTip text={t("compareResults.tipEvents")} label={t("compareResults.aboutEvents")} /></th>
                <th className="px-2 py-2 text-end font-semibold">{t("compareResults.actionsChanged")}{" "}<InfoTip text={t("compareResults.tipActions")} ask={t("compareResults.askMoved")} label={t("compareResults.aboutActions")} /></th>
                <th className="px-2 py-2 font-semibold">
                  <Input
                    value={colFilter.status}
                    onChange={(e) => setColFilter({ ...colFilter, status: e.target.value })}
                    placeholder={t("compareResults.status")}
                    aria-label={t("compareResults.filterByStatus")}
                    className="h-6 w-24 border-none bg-transparent px-1 text-caption focus-visible:ring-0"
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
                  <Fragment key={a.key}>
                  <tr

                    onClick={() => setSelectedKey(a.key)}
                    aria-selected={isSel}
                    data-testid={`agents-row-${a.xid}`}
                    className={cn(
                      "cursor-pointer border-b last:border-0",
                      isSel ? "bg-primary/5" : "hover:bg-muted/40",
                    )}
                  >
                    <td className="px-2 py-2 font-mono text-caption font-semibold">{a.xid}</td>
                    <td className="px-2 py-2 font-mono text-caption">
                      {qa ?? "—"}
                      {qa !== qb && qb != null && <span className="text-muted-foreground"> → {qb}</span>}
                      {qb == null && qa != null && a.agentB && <span className="text-muted-foreground">{t("compareResults.noCol")}</span>}
                    </td>
                    <td className="px-2 py-2 font-mono text-caption">
                      {aa ?? "—"}
                      {aa !== ab && <span className="text-muted-foreground"> → {ab ?? "—"}</span>}
                    </td>
                    <td className="px-2 py-2 text-end tabular-nums">{ec}</td>
                    <td className="px-2 py-2 text-end tabular-nums">{ac}</td>
                    <td className="px-2 py-2">
                      <AgentStatusBadge status={a.status} labelA={labelA} labelB={labelB} />
                    </td>
                  </tr>
                  </Fragment>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-caption text-muted-foreground">
                    {t("compareResults.noAgentsMatchThe")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle aria-label={t("compareResults.resizeDetailPanel")} />

        <ResizablePanel defaultSize={48} minSize={20} className="overflow-auto">
        <div className="flex min-h-full flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-2">
            <Label htmlFor="agents-single-view" className="text-caption text-muted-foreground">
              {t("compareResults.singleAgentView")}
            </Label>
            <InfoTip text={t("compareResults.tipSingle")} label={t("compareResults.aboutSingleAgentView")} />
            <Switch
              id="agents-single-view"
              checked={single}
              onCheckedChange={setSingle}
              data-testid="agents-single-toggle"
            />
            <span className="ms-auto hidden items-center gap-1 text-caption text-muted-foreground sm:flex">
              <Equal className="size-icon-sm" aria-hidden="true" />{" "}
              <Trans i18nKey="compareResults.pressJk" components={{ j: <Kbd />, k: <Kbd /> }} />
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
