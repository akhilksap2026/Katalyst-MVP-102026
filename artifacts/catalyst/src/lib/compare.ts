/**
 * Agent comparison engine — pure diff between two parsed sources.
 *
 * Produces one AgentComparison per matched agent pair (or single-side agent),
 * with field-level diffs for the header, events and actions. All option
 * handling (match key, footprint, whitespace, case) is applied here so the UI
 * only renders the result.
 */
import { tr } from "@/lib/tr";

import {
  FOOTPRINT,
  matchKey,
  type AgentAction,
  type AgentEvent,
  type AgentRecord,
  type CompareOptions,
  type SourceModel,
} from "./agents";

/* ------------------------------------------------------------------ types */

export type ChangeType = "added" | "removed" | "changed";
export type AgentStatus = "identical" | "changed" | "only-a" | "only-b";
export type ActionStatus = "identical" | "changed" | "moved" | "added" | "removed";

export interface FieldDiff {
  field: string;
  valueA: string | null;
  valueB: string | null;
  changeType: ChangeType;
}

export interface EventDiff {
  eventGid: string;
  status: "identical" | "changed" | "only-a" | "only-b";
  fields: FieldDiff[];
}

export interface ActionDiff {
  actionGid: string;
  flowA: number | null;
  sequenceA: number | null;
  flowB: number | null;
  sequenceB: number | null;
  status: ActionStatus;
  fields: FieldDiff[];
  /** parameters from each side, for the line-by-line diff view */
  paramsA: string | null;
  paramsB: string | null;
}

export interface AgentComparison {
  key: string;
  xid: string;
  agentA: AgentRecord | null;
  agentB: AgentRecord | null;
  status: AgentStatus;
  headerDiffs: FieldDiff[];
  eventDiffs: EventDiff[];
  actionDiffs: ActionDiff[];
  conditionsA: string[];
  conditionsB: string[];
  queriesA: string[];
  queriesB: string[];
  referencesDiffer: boolean;
}

export interface CompareCounts {
  changed: number;
  onlyA: number;
  onlyB: number;
  identical: number;
  /** changed + onlyA + onlyB */
  differences: number;
}

export interface CompareResult {
  labelA: string;
  labelB: string;
  agents: AgentComparison[];
  counts: CompareCounts;
  /** Agents dropped because another agent in the same source had the same match key. */
  duplicates: { source: "A" | "B"; key: string }[];
}

export interface ExportRow {
  xid: string;
  section: "Header" | "Events" | "Actions";
  key: string;
  field: string;
  valueA: string;
  valueB: string;
  changeType: string;
}

export interface LineDiff {
  type: "same" | "added" | "removed";
  text: string;
}

/* -------------------------------------------------------------- normalise */

function norm(v: string | null | undefined, opts: CompareOptions): string {
  if (v == null) return "";
  let s = v;
  if (opts.ignoreWhitespace) s = s.replace(/\s+/g, " ").trim();
  else s = s.replace(/\r\n/g, "\n");
  if (opts.ignoreCase) s = s.toUpperCase();
  return s;
}

function groupBy<T>(list: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of list) {
    const k = keyFn(item);
    const arr = map.get(k);
    if (arr) arr.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function fieldDiff(field: string, a: string | null, b: string | null, opts: CompareOptions): FieldDiff | null {
  if (norm(a, opts) === norm(b, opts)) return null;
  const changeType: ChangeType = a == null ? "added" : b == null ? "removed" : "changed";
  return { field, valueA: a, valueB: b, changeType };
}

function collectFieldDiffs(
  pairs: [string, string | null, string | null][],
  opts: CompareOptions,
): FieldDiff[] {
  const out: FieldDiff[] = [];
  for (const [field, a, b] of pairs) {
    const d = fieldDiff(field, a, b, opts);
    if (d) out.push(d);
  }
  return out;
}

/* ----------------------------------------------------------------- events */

export function compareEvents(a: AgentEvent[], b: AgentEvent[], opts: CompareOptions): EventDiff[] {
  const groupsA = groupBy(a, (e) => e.eventGid);
  const groupsB = groupBy(b, (e) => e.eventGid);
  const gids = Array.from(new Set([...groupsA.keys(), ...groupsB.keys()])).sort();
  const out: EventDiff[] = [];
  for (const gid of gids) {
    const la = groupsA.get(gid) ?? [];
    const lb = groupsB.get(gid) ?? [];
    const n = Math.max(la.length, lb.length);
    for (let i = 0; i < n; i++) {
      const ea = la[i];
      const eb = lb[i];
      if (ea && !eb) {
        out.push({
          eventGid: gid,
          status: "only-a",
          fields: [
            { field: "AGENT_EVENT_PARAMETERS", valueA: ea.parameters, valueB: null, changeType: "removed" },
          ],
        });
      } else if (!ea && eb) {
        out.push({
          eventGid: gid,
          status: "only-b",
          fields: [
            { field: "AGENT_EVENT_PARAMETERS", valueA: null, valueB: eb.parameters, changeType: "added" },
          ],
        });
      } else if (ea && eb) {
        const fields = collectFieldDiffs(
          [["AGENT_EVENT_PARAMETERS", ea.parameters, eb.parameters]],
          opts,
        );
        out.push({ eventGid: gid, status: fields.length > 0 ? "changed" : "identical", fields });
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------- actions */

export function compareActions(a: AgentAction[], b: AgentAction[], opts: CompareOptions): ActionDiff[] {
  const groupsA = groupBy(a, (x) => x.actionGid);
  const groupsB = groupBy(b, (x) => x.actionGid);
  const gids = Array.from(new Set([...groupsA.keys(), ...groupsB.keys()])).sort();
  const out: ActionDiff[] = [];
  for (const gid of gids) {
    const la = groupsA.get(gid) ?? [];
    const lb = groupsB.get(gid) ?? [];
    const n = Math.max(la.length, lb.length);
    for (let i = 0; i < n; i++) {
      const aa = la[i];
      const ab = lb[i];
      if (aa && !ab) {
        out.push({
          actionGid: gid,
          flowA: aa.flow,
          sequenceA: aa.sequence,
          flowB: null,
          sequenceB: null,
          status: "removed",
          fields: collectFieldDiffs(
            [
              ["ACTION_FLOW", String(aa.flow), null],
              ["ACTION_SEQUENCE", String(aa.sequence), null],
              ["ACTION_PARAMETERS", aa.parameters, null],
            ],
            opts,
          ),
          paramsA: aa.parameters,
          paramsB: null,
        });
      } else if (!aa && ab) {
        out.push({
          actionGid: gid,
          flowA: null,
          sequenceA: null,
          flowB: ab.flow,
          sequenceB: ab.sequence,
          status: "added",
          fields: collectFieldDiffs(
            [
              ["ACTION_FLOW", null, String(ab.flow)],
              ["ACTION_SEQUENCE", null, String(ab.sequence)],
              ["ACTION_PARAMETERS", null, ab.parameters],
            ],
            opts,
          ),
          paramsA: null,
          paramsB: ab.parameters,
        });
      } else if (aa && ab) {
        const moved = aa.flow !== ab.flow || aa.sequence !== ab.sequence;
        const fields = collectFieldDiffs(
          [
            ["ACTION_FLOW", String(aa.flow), String(ab.flow)],
            ["ACTION_SEQUENCE", String(aa.sequence), String(ab.sequence)],
            ["ACTION_PARAMETERS", aa.parameters, ab.parameters],
          ],
          opts,
        );
        out.push({
          actionGid: gid,
          flowA: aa.flow,
          sequenceA: aa.sequence,
          flowB: ab.flow,
          sequenceB: ab.sequence,
          status: moved ? "moved" : fields.length > 0 ? "changed" : "identical",
          fields,
          paramsA: aa.parameters,
          paramsB: ab.parameters,
        });
      }
    }
  }
  // Display order: flow then sequence, preferring the A side position.
  out.sort(
    (x, y) =>
      (x.flowA ?? x.flowB ?? 0) - (y.flowA ?? y.flowB ?? 0) ||
      (x.sequenceA ?? x.sequenceB ?? 0) - (y.sequenceA ?? y.sequenceB ?? 0) ||
      x.actionGid.localeCompare(y.actionGid),
  );
  return out;
}

/* ----------------------------------------------------------------- header */

export function compareHeaders(
  a: AgentRecord | null,
  b: AgentRecord | null,
  opts: CompareOptions,
): FieldDiff[] {
  const fields = new Set<string>();
  for (const src of [a, b]) {
    if (!src) continue;
    for (const k of Object.keys(src.header)) fields.add(k);
  }
  const out: FieldDiff[] = [];
  for (const f of Array.from(fields).sort()) {
    if (f === "AGENT_GID" || f === "AGENT_XID") continue;
    if (opts.ignoreFootprint && FOOTPRINT.has(f)) continue;
    const hasA = a != null && f in a.header;
    const hasB = b != null && f in b.header;
    const d = fieldDiff(f, hasA ? a.header[f] : null, hasB ? b.header[f] : null, opts);
    if (d) out.push(d);
  }
  return out;
}

/* ---------------------------------------------------------------- compare */

export function compareSources(modelA: SourceModel, modelB: SourceModel, opts: CompareOptions): CompareResult {
  const mapA = new Map<string, AgentRecord>();
  const mapB = new Map<string, AgentRecord>();
  const duplicates: CompareResult["duplicates"] = [];
  for (const [source, model, map] of [["A", modelA, mapA], ["B", modelB, mapB]] as const) {
    for (const agent of model.agents) {
      const k = matchKey(agent, opts);
      if (map.has(k)) duplicates.push({ source, key: k });
      else map.set(k, agent);
    }
  }

  const keys = Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort((x, y) =>
    (mapA.get(x) ?? mapB.get(x))!.xid.localeCompare((mapA.get(y) ?? mapB.get(y))!.xid),
  );

  const agents: AgentComparison[] = keys.map((key) => {
    const agentA = mapA.get(key) ?? null;
    const agentB = mapB.get(key) ?? null;
    const xid = agentA?.xid || agentB?.xid || key;
    const headerDiffs = compareHeaders(agentA, agentB, opts);
    const eventDiffs = compareEvents(agentA?.events ?? [], agentB?.events ?? [], opts);
    const actionDiffs = compareActions(agentA?.actions ?? [], agentB?.actions ?? [], opts);
    const status: AgentStatus =
      agentA && !agentB ? "only-a" : agentB && !agentA ? "only-b"
      : headerDiffs.length + eventDiffs.filter((d) => d.status !== "identical").length +
          actionDiffs.filter((d) => d.status !== "identical").length > 0
        ? "changed"
        : "identical";

    const conditionsA = agentA?.savedConditionGids ?? [];
    const conditionsB = agentB?.savedConditionGids ?? [];
    const queriesA = agentA?.savedQueryGids ?? [];
    const queriesB = agentB?.savedQueryGids ?? [];
    const normRef = (s: string) => (opts.ignoreCase ? s.toUpperCase() : s);
    const sameSet = (x: string[], y: string[]) =>
      x.length === y.length && [...x].map(normRef).sort().join("\n") === [...y].map(normRef).sort().join("\n");
    const referencesDiffer = !sameSet(conditionsA, conditionsB) || !sameSet(queriesA, queriesB);

    return {
      key,
      xid,
      agentA,
      agentB,
      status,
      headerDiffs,
      eventDiffs,
      actionDiffs,
      conditionsA,
      conditionsB,
      queriesA,
      queriesB,
      referencesDiffer,
    };
  });

  const counts: CompareCounts = {
    changed: agents.filter((a) => a.status === "changed").length,
    onlyA: agents.filter((a) => a.status === "only-a").length,
    onlyB: agents.filter((a) => a.status === "only-b").length,
    identical: agents.filter((a) => a.status === "identical").length,
    differences: 0,
  };
  counts.differences = counts.changed + counts.onlyA + counts.onlyB;

  return { labelA: modelA.label, labelB: modelB.label, agents, counts, duplicates };
}

/* ---------------------------------------------------------------- helpers */

export function eventChanges(cmp: AgentComparison): number {
  return cmp.eventDiffs.filter((d) => d.status !== "identical").length;
}

export function actionChanges(cmp: AgentComparison): number {
  return cmp.actionDiffs.filter((d) => d.status !== "identical").length;
}

/** Flatten one agent comparison into export rows (one per difference). */
export function exportRows(cmp: AgentComparison): ExportRow[] {
  const rows: ExportRow[] = [];
  const base = { xid: cmp.xid };
  if (cmp.status === "only-a" || cmp.status === "only-b") {
    const side = cmp.status === "only-a" ? "A" : "B";
    const agent = cmp.status === "only-a" ? cmp.agentA! : cmp.agentB!;
    const changeType = cmp.status === "only-a" ? "only in A" : "only in B";
    for (const [field, value] of Object.entries(agent.header)) {
      if (field === "AGENT_GID" || field === "AGENT_XID") continue;
      rows.push({
        ...base,
        section: "Header",
        key: "",
        field,
        valueA: side === "A" ? value : "",
        valueB: side === "B" ? value : "",
        changeType,
      });
    }
    for (const ev of agent.events) {
      rows.push({
        ...base,
        section: "Events",
        key: ev.eventGid,
        field: "AGENT_EVENT_PARAMETERS",
        valueA: side === "A" ? ev.parameters : "",
        valueB: side === "B" ? ev.parameters : "",
        changeType,
      });
    }
    for (const ac of agent.actions) {
      rows.push({
        ...base,
        section: "Actions",
        key: `${ac.flow}/${ac.sequence}`,
        field: ac.actionGid,
        valueA: side === "A" ? ac.parameters : "",
        valueB: side === "B" ? ac.parameters : "",
        changeType,
      });
    }
    return rows;
  }
  for (const d of cmp.headerDiffs) {
    rows.push({
      ...base,
      section: "Header",
      key: "",
      field: d.field,
      valueA: d.valueA ?? "",
      valueB: d.valueB ?? "",
      changeType: d.changeType,
    });
  }
  for (const ev of cmp.eventDiffs) {
    for (const d of ev.fields) {
      rows.push({
        ...base,
        section: "Events",
        key: ev.eventGid,
        field: d.field,
        valueA: d.valueA ?? "",
        valueB: d.valueB ?? "",
        changeType: d.changeType,
      });
    }
  }
  for (const ac of cmp.actionDiffs) {
    for (const d of ac.fields) {
      rows.push({
        ...base,
        section: "Actions",
        key: `${ac.flowA ?? ac.flowB}/${ac.sequenceA ?? ac.sequenceB}`,
        field: `${ac.actionGid} · ${d.field}`,
        valueA: d.valueA ?? "",
        valueB: d.valueB ?? "",
        changeType: ac.status === "moved" && d.changeType === "changed" ? "moved" : d.changeType,
      });
    }
  }
  return rows;
}

/** Short text summary suitable for a ticket or email. */
export function summaryText(result: CompareResult): string {
  const { labelA, labelB, counts } = result;
  const lines = [
    tr("summary.title", { labelA, labelB }),
    tr("summary.counts", { changed: counts.changed, labelA, onlyA: counts.onlyA, labelB, onlyB: counts.onlyB, identical: counts.identical }),
  ];
  for (const a of result.agents) {
    if (a.status === "identical") continue;
    const bits: string[] = [];
    if (a.headerDiffs.length) bits.push(tr("summary.header", { count: a.headerDiffs.length }));
    const ec = eventChanges(a);
    const ac = actionChanges(a);
    if (ec) bits.push(tr("summary.events", { count: ec }));
    if (ac) bits.push(tr("summary.actions", { count: ac }));
    const label =
      a.status === "only-a" ? tr("summary.onlyIn", { label: labelA })
      : a.status === "only-b" ? tr("summary.onlyIn", { label: labelB })
      : bits.join(", ");
    lines.push(tr("summary.line", { xid: a.xid, label }));
  }
  return lines.join("\n");
}

/** Line-by-line diff for long parameter values (simple LCS). */
export function diffLines(a: string, b: string): LineDiff[] {
  const al = a === "" ? [] : a.split("\n");
  const bl = b === "" ? [] : b.split("\n");
  const n = al.length;
  const m = bl.length;
  // LCS lengths table.
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = al[i] === bl[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: LineDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (al[i] === bl[j]) {
      out.push({ type: "same", text: al[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "removed", text: al[i] });
      i += 1;
    } else {
      out.push({ type: "added", text: bl[j] });
      j += 1;
    }
  }
  while (i < n) out.push({ type: "removed", text: al[i++] });
  while (j < m) out.push({ type: "added", text: bl[j++] });
  return out;
}
