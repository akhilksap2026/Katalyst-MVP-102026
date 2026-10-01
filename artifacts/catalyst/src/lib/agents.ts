/**
 * Agent import — pure parsing for the Agent Compare flow.
 *
 * Accepts OTM CSV (optional table-name line after `#` comments, columns on
 * the next line, RFC 4180 quoting), plain CSV, and DB.XML transmission sets.
 * Produces one model per agent with events and actions sorted by
 * ACTION_FLOW then ACTION_SEQUENCE.
 */

export type AgentTable = "AGENT" | "AGENT_EVENT_DETAILS" | "AGENT_ACTION_DETAILS";

export interface AgentEvent {
  agentGid: string;
  eventGid: string;
  parameters: string;
}

export interface AgentAction {
  agentGid: string;
  flow: number;
  sequence: number;
  actionGid: string;
  parameters: string;
}

export interface AgentRecord {
  gid: string;
  xid: string;
  /** all AGENT columns except AGENT_GID/AGENT_XID (footprint kept for display) */
  header: Record<string, string>;
  events: AgentEvent[];
  actions: AgentAction[];
  savedConditionGids: string[];
  savedQueryGids: string[];
}

export interface AgentWarning {
  file: string;
  /** 1-based line number within the file */
  line: number;
  kind: "unknown-column" | "orphan-row" | "malformed-quotes";
  message: string;
}

export interface RecognisedFile {
  file: string;
  table: AgentTable | null;
  format: "csv" | "dbxml";
  rows: number;
}

export interface SourceModel {
  label: string;
  agents: AgentRecord[];
  files: RecognisedFile[];
  warnings: AgentWarning[];
  /** raw text kept for sample loading / debugging; never persisted */
  raw: Record<string, string>;
}

/* ------------------------------------------------------------- constants */

export const KNOWN_COLUMNS: Record<AgentTable, Set<string>> = {
  AGENT: new Set([
    "AGENT_GID", "AGENT_XID", "DATA_QUERY_TYPE_GID", "SAVED_CONDITION_GID",
    "REENTRANCY_LEVEL", "IS_ACTIVE", "DOMAIN_NAME", "INSERT_USER",
    "INSERT_DATE", "UPDATE_USER", "UPDATE_DATE", "ATTRIBUTE1", "ATTRIBUTE2",
  ]),
  AGENT_EVENT_DETAILS: new Set([
    "AGENT_GID", "AGENT_EVENT_GID", "AGENT_EVENT_PARAMETERS", "DOMAIN_NAME",
  ]),
  AGENT_ACTION_DETAILS: new Set([
    "AGENT_GID", "ACTION_FLOW", "ACTION_SEQUENCE", "AGENT_ACTION_GID",
    "ACTION_PARAMETERS", "DOMAIN_NAME",
  ]),
};

/** Audit columns kept in the header model but excluded from comparison by default. */
export const FOOTPRINT = new Set(["DOMAIN_NAME", "INSERT_USER", "INSERT_DATE", "UPDATE_USER", "UPDATE_DATE"]);

const TABLE_BY_HEADER: Record<string, AgentTable> = {
  AGENT: "AGENT",
  AGENT_EVENT_DETAILS: "AGENT_EVENT_DETAILS",
  AGENT_ACTION_DETAILS: "AGENT_ACTION_DETAILS",
};

/* ------------------------------------------------------------------ CSV */

export interface CsvDoc {
  columns: string[];
  rows: string[][];
  /** 1-based line numbers of the first data row, per row */
  lineNumbers: number[];
  warnings: AgentWarning[];
}

export const SAVED_QUERY_GID = /SAVED_QUERY_GID\s*=\s*([A-Za-z0-9_./-]+)/g;

/**
 * CSV dialect detector: after stripping `#` comment lines and blank lines,
 * if the first remaining line names a known table, it is the OTM header.
 */
export function sniffCsvTable(text: string): { table: AgentTable | null; columns: string[] } | null {
  const lines = text.split(/\r?\n/);
  const meaningful: string[] = [];
  for (const line of lines) {
    const s = line.trim();
    if (s === "" || s.startsWith("#")) continue;
    meaningful.push(s);
  }
  if (meaningful.length === 0) return null;
  const asTable = TABLE_BY_HEADER[meaningful[0]];
  if (asTable && meaningful.length > 1) {
    return { table: asTable, columns: meaningful[1].split(",").map((c) => c.trim()) };
  }
  // Plain CSV: first meaningful line is the column header; infer the table
  // from the columns when possible.
  const columns = meaningful[0].split(",").map((c) => c.trim());
  return { table: guessTableByColumns(columns), columns };
}

/**
 * RFC 4180 character state machine. Quoted fields may contain commas,
 * doubled quotes and line breaks; unterminated quotes raise a warning.
 */
export function parseCsv(
  text: string,
  file: string,
  startLine: number,
  headerLine?: string,
): { columns: string[]; rows: string[][]; lineNumbers: number[]; warnings: AgentWarning[] } {
  const warnings: AgentWarning[] = [];
  const columns: string[] = headerLine ? headerLine.split(",").map((c) => c.trim()) : [];
  const rows: string[][] = [];
  const lineNumbers: number[] = [];

  let current = "";
  let row: string[] = [];
  let curLine = startLine;
  let rowStartLine = startLine;
  let inQuotes = false;
  let fieldQuoted = false;

  const endField = () => {
    // Trim surrounding whitespace only for unquoted fields.
    const v = fieldQuoted ? current : current.trim();
    if (columns.length === 0 && rows.length === 0) columns.push(v);
    else row.push(v);
    current = "";
    fieldQuoted = false;
  };

  const endRow = () => {
    endField();
    const rowIsBlank = row.length === 1 && row[0] === "" && columns.length > 1;
    if (columns.length > 0 && row.length === columns.length && !rowIsBlank) {
      rows.push(row);
      lineNumbers.push(rowStartLine);
    } else if (!rowIsBlank && row.some((c) => c !== "")) {
      warnings.push({
        file,
        line: rowStartLine,
        kind: "unknown-column",
        message: `Row has ${row.length} fields; expected ${columns.length}.`,
      });
    }
    row = [];
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      if (ch === "\n") curLine += 1;
      current += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      fieldQuoted = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      endField();
      i += 1;
      continue;
    }
    if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
      if (ch === "\r") i += 1;
      endRow();
      i += 1;
      curLine += 1;
      rowStartLine = curLine;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }
  if (inQuotes) {
    warnings.push({ file, line: curLine, kind: "malformed-quotes", message: "Unterminated quoted field." });
    endRow();
  } else if (current !== "" || row.length > 0) {
    endRow();
  }

  return { columns, rows, lineNumbers, warnings };
}

/* ------------------------------------------------------------------ XML */

const XML_ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

/** Decode the five predefined XML entities plus numeric references. */
function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : XML_ENTITIES[e] ?? m,
  );
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function decodeLob(value: string): string {
  value = decodeEntities(value);
  const v = value.trim();
  if (/^[A-Za-z0-9+/=\r\n]+$/.test(v) && v.length > 20) {
    try {
      const bin = atob(v.replace(/\s+/g, ""));
      // Treat as text only when it looks like readable parameter data.
      if (/^[\t\n\r\x20-\x7E]+$/.test(bin)) return bin;
    } catch {
      /* not base64 */
    }
  }
  return value;
}

/* ------------------------------------------------------------- building */

function collectSavedQueryGids(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(SAVED_QUERY_GID)) out.add(m[1]);
  return Array.from(out).sort();
}

interface RawRow {
  file: string;
  line: number;
  values: Record<string, string>;
}

export function buildSource(label: string, inputs: { name: string; text: string }[]): SourceModel {
  const agents = new Map<string, AgentRecord>();
  const files: RecognisedFile[] = [];
  const warnings: AgentWarning[] = [];
  const raw: Record<string, string> = {};
  const agentRows: RawRow[] = [];
  const eventRows: RawRow[] = [];
  const actionRows: RawRow[] = [];

  const getAgent = (gid: string, xid: string): AgentRecord => {
    let rec = agents.get(gid);
    if (!rec) {
      rec = { gid, xid, header: {}, events: [], actions: [], savedConditionGids: [], savedQueryGids: [] };
      agents.set(gid, rec);
    }
    if (xid && !rec.xid) rec.xid = xid;
    return rec;
  };

  for (const input of inputs) {
    raw[input.name] = input.text;
    const trimmed = input.text.trimStart();
    if (trimmed.startsWith("<") || trimmed.startsWith("<?xml") || trimmed.startsWith("<!--")) {
      files.push(...parseDbXml(input.name, input.text, warnings, agentRows, eventRows, actionRows));
      continue;
    }
    const sniffed = sniffCsvTable(input.text);
    if (!sniffed || sniffed.columns.length === 0) {
      files.push({ file: input.name, table: null, format: "csv", rows: 0 });
      warnings.push({ file: input.name, line: 1, kind: "unknown-column", message: "Empty or unrecognised CSV file." });
      continue;
    }
    const table = sniffed.table ?? TABLE_BY_HEADER[sniffed.columns[0]] ?? guessTableByColumns(sniffed.columns);
    const lines = input.text.split(/\r?\n/);
    const firstMeaningful = lines.findIndex((l) => l.trim() !== "" && !l.trim().startsWith("#"));
    // OTM CSV has the table name on the first meaningful line; plain CSV has
    // the column header there. The guess in sniffCsvTable cannot tell them
    // apart, so decide from the line itself.
    const hasTableLine = TABLE_BY_HEADER[lines[firstMeaningful]?.trim() ?? ""] !== undefined;
    const headerIndex = hasTableLine ? firstMeaningful + 1 : firstMeaningful;
    const body = lines.slice(headerIndex + 1).join("\n");
    const doc = parseCsv(body, input.name, headerIndex + 2, sniffed.columns.join(","));

    // Unknown column warnings (per file, listing the column).
    if (table) {
      for (const col of sniffed.columns) {
        if (!KNOWN_COLUMNS[table].has(col.trim())) {
          warnings.push({
            file: input.name,
            line: headerIndex + 1,
            kind: "unknown-column",
            message: `Unknown column "${col.trim()}" for ${table}.`,
          });
        }
      }
    } else {
      warnings.push({
        file: input.name,
        line: headerIndex + 1,
        kind: "unknown-column",
        message: "Could not determine table from the header.",
      });
    }

    files.push({ file: input.name, table, format: "csv", rows: doc.rows.length });
    warnings.push(...doc.warnings);

    doc.rows.forEach((row, i) => {
      const values: Record<string, string> = {};
      doc.columns.forEach((c, ci) => {
        values[c.trim()] = row[ci] ?? "";
      });
      const rawRow: RawRow = { file: input.name, line: doc.lineNumbers[i] ?? headerIndex + 2 + i, values };
      if (table === "AGENT") agentRows.push(rawRow);
      else if (table === "AGENT_EVENT_DETAILS") eventRows.push(rawRow);
      else if (table === "AGENT_ACTION_DETAILS") actionRows.push(rawRow);
    });
  }

  // Agents
  for (const r of agentRows) {
    const gid = r.values.AGENT_GID?.trim();
    if (!gid) {
      warnings.push({ file: r.file, line: r.line, kind: "orphan-row", message: "AGENT row without AGENT_GID." });
      continue;
    }
    const rec = getAgent(gid, r.values.AGENT_XID?.trim() ?? "");
    for (const [k, v] of Object.entries(r.values)) {
      if (k === "AGENT_GID" || k === "AGENT_XID") continue;
      rec.header[k] = v;
    }
    const sc = r.values.SAVED_CONDITION_GID?.trim();
    if (sc && !rec.savedConditionGids.includes(sc)) rec.savedConditionGids.push(sc);
  }

  // Events
  for (const r of eventRows) {
    const gid = r.values.AGENT_GID?.trim();
    if (!gid || !agents.has(gid)) {
      warnings.push({
        file: r.file,
        line: r.line,
        kind: "orphan-row",
        message: `Event "${r.values.AGENT_EVENT_GID ?? ""}" has no matching AGENT row (AGENT_GID ${gid || "(blank)"}).`,
      });
      continue;
    }
    agents.get(gid)!.events.push({
      agentGid: gid,
      eventGid: r.values.AGENT_EVENT_GID ?? "",
      parameters: r.values.AGENT_EVENT_PARAMETERS ?? "",
    });
  }

  // Actions
  for (const r of actionRows) {
    const gid = r.values.AGENT_GID?.trim();
    if (!gid || !agents.has(gid)) {
      warnings.push({
        file: r.file,
        line: r.line,
        kind: "orphan-row",
        message: `Action "${r.values.AGENT_ACTION_GID ?? ""}" has no matching AGENT row (AGENT_GID ${gid || "(blank)"}).`,
      });
      continue;
    }
    agents.get(gid)!.actions.push({
      agentGid: gid,
      flow: Number(r.values.ACTION_FLOW ?? 0) || 0,
      sequence: Number(r.values.ACTION_SEQUENCE ?? 0) || 0,
      actionGid: r.values.AGENT_ACTION_GID ?? "",
      parameters: r.values.ACTION_PARAMETERS ?? "",
    });
  }

  // Sort actions by flow then sequence; collect saved query references.
  for (const rec of agents.values()) {
    rec.actions.sort((a, b) => a.flow - b.flow || a.sequence - b.sequence || a.actionGid.localeCompare(b.actionGid));
    const refs = [rec.header.SAVED_QUERY_GID ?? ""];
    for (const a of rec.actions) refs.push(a.parameters);
    for (const e of rec.events) refs.push(e.parameters);
    rec.savedQueryGids = collectSavedQueryGids(refs.filter(Boolean).join("\n"));
    rec.savedConditionGids.sort();
  }

  return {
    label,
    agents: Array.from(agents.values()).sort((a, b) => a.gid.localeCompare(b.gid)),
    files,
    warnings,
    raw,
  };
}

function guessTableByColumns(columns: string[]): AgentTable | null {
  const set = new Set(columns.map((c) => c.trim()));
  if (set.has("AGENT_EVENT_GID")) return "AGENT_EVENT_DETAILS";
  if (set.has("ACTION_SEQUENCE") || set.has("AGENT_ACTION_GID")) return "AGENT_ACTION_DETAILS";
  if (set.has("AGENT_GID") && set.has("AGENT_XID")) return "AGENT";
  return null;
}

function parseDbXml(
  name: string,
  text: string,
  warnings: AgentWarning[],
  agentRows: RawRow[],
  eventRows: RawRow[],
  actionRows: RawRow[],
): RecognisedFile[] {
  const files: RecognisedFile[] = [];
  let agentsFound = 0;
  // Turn CDATA into escaped text first so its contents (SQL, <tags>) can't be mistaken for nested elements.
  text = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_m, body: string) => escapeXml(body));

  const readChildren = (block: string): { values: Record<string, string>; kids: Record<string, string[]> } => {
    const values: Record<string, string> = {};
    const kids: Record<string, string[]> = {};
    const re = /<([A-Z0-9_]+)>([\s\S]*?)<\/\1>/g;
    for (const m of block.matchAll(re)) {
      const tag = m[1];
      const body = m[2];
      if (/<[A-Z0-9_]+>/.test(body)) {
        (kids[tag] ??= []).push(body);
      } else {
        values[tag] = decodeLob(body);
      }
    }
    return { values, kids };
  };

  const agentRe = /<AGENT>([\s\S]*?)<\/AGENT>/g;
  for (const m of text.matchAll(agentRe)) {
    agentsFound += 1;
    const { values, kids } = readChildren(m[1]);
    agentRows.push({ file: name, line: 0, values });
    for (const evBlock of kids.AGENT_EVENT_DETAILS ?? []) {
      eventRows.push({ file: name, line: 0, values: readChildren(evBlock).values });
    }
    for (const actBlock of kids.AGENT_ACTION_DETAILS ?? []) {
      actionRows.push({ file: name, line: 0, values: readChildren(actBlock).values });
    }
  }

  if (agentsFound === 0) {
    warnings.push({ file: name, line: 1, kind: "unknown-column", message: "XML parse failed or no AGENT elements found." });
    files.push({ file: name, table: null, format: "dbxml", rows: 0 });
    return files;
  }
  files.push({ file: name, table: "AGENT", format: "dbxml", rows: agentsFound });
  return files;
}

/* ------------------------------------------------------- compare options */

export interface CompareOptions {
  matchBy: "xid" | "gid";
  ignoreFootprint: boolean;
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
}

export const DEFAULT_COMPARE_OPTIONS: CompareOptions = {
  matchBy: "xid",
  ignoreFootprint: true,
  ignoreWhitespace: true,
  ignoreCase: false,
};

/** Match key for an agent under the chosen strategy. */
export function matchKey(agent: AgentRecord, opts: CompareOptions): string {
  const raw = opts.matchBy === "gid" ? agent.gid : agent.xid || agent.gid.split(".").pop() || agent.gid;
  return opts.ignoreCase ? raw.toUpperCase() : raw;
}

export function sourceCounts(source: SourceModel): { agents: number; events: number; actions: number } {
  return {
    agents: source.agents.length,
    events: source.agents.reduce((n, a) => n + a.events.length, 0),
    actions: source.agents.reduce((n, a) => n + a.actions.length, 0),
  };
}
