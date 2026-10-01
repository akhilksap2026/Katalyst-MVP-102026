/**
 * Data Dictionary core — pure functions over the release JSON.
 *
 * The JSON shape (see src/data/dictionary/*.json):
 *   { label, release, description, tables: { NAME: { alias, description,
 *     primaryKey: string[], foreignKeys: [{ columns, references: { table,
 *     columns } }], columns: [{ name, oracleDataType, nullable, description }] } } }
 */
import { RELEASE_DATA } from "@/lib/dictionary-data";

export interface DictColumn {
  name: string;
  oracleDataType: string;
  nullable: boolean;
  description: string;
}

export interface ForeignKey {
  columns: string[];
  references: { table: string; columns: string[] };
}

export interface DictTable {
  name: string;
  alias: string;
  description: string;
  primaryKey: string[];
  foreignKeys: ForeignKey[];
  columns: DictColumn[];
}

export interface DictRelease {
  label: string;
  release: string;
  description: string;
  tables: DictTable[];
}

/** In-memory indexes built once per release. */
export interface DictionaryIndex {
  release: string;
  tables: DictTable[];
  byTable: Map<string, DictTable>;
  /** column name -> every table that has it */
  byColumn: Map<string, { table: DictTable; column: DictColumn }[]>;
  /** alias -> table */
  byAlias: Map<string, DictTable>;
  /** table -> directly related tables (either direction of any FK) */
  related: Map<string, Set<string>>;
  /** column names that belong to the standard footprint */
  footprint: Set<string>;
}

/** Compatibility helpers for shell components (command palette, header, home). */
export interface ReleaseOption {
  id: string;
  label: string;
  status: string;
}

export const dictionaryManifest: { label: string; releases: ReleaseOption[] } = {
  label: "Sample data - replace with KSAP data",
  releases: [
    { id: "26A", label: "Release 26A", status: "current" },
    { id: "26C", label: "Release 26C", status: "preview" },
  ],
};

const moduleIndexCache = new Map<string, DictionaryIndex>();

/** Index for a release id, parsed and cached once for the session. */
export function getIndex(id: string): DictionaryIndex | null {
  if (!moduleIndexCache.has(id)) {
    const raw = RELEASE_DATA[id];
    if (!raw) return null;
    moduleIndexCache.set(id, buildIndex(parseRelease(raw)));
  }
  return moduleIndexCache.get(id)!;
}

export function listTables(releaseId: string): string[] {
  return getIndex(releaseId)?.tables.map((t) => t.name) ?? [];
}

export function getTable(releaseId: string, name: string): DictTable | null {
  return getIndex(releaseId)?.byTable.get(name) ?? null;
}

export function parseRelease(raw: unknown): DictRelease {
  const obj = raw as {
    label: string;
    release: string;
    description: string;
    tables: Record<string, Omit<DictTable, "name">>;
  };
  const tables = Object.entries(obj.tables).map(([name, t]) => ({
    name,
    alias: t.alias ?? "",
    description: t.description ?? "",
    primaryKey: t.primaryKey ?? [],
    foreignKeys: t.foreignKeys ?? [],
    columns: t.columns ?? [],
  }));
  return { label: obj.label, release: obj.release, description: obj.description, tables };
}

/* -------------------------------------------------------------- footprint */

const FOOTPRINT_COLUMNS = new Set([
  "INSERT_USER",
  "INSERT_DATE",
  "UPDATE_USER",
  "UPDATE_DATE",
  "DOMAIN_NAME",
]);

export function isFootprintColumn(name: string): boolean {
  return FOOTPRINT_COLUMNS.has(name);
}

/* ------------------------------------------------------------ flex fields */

export type FlexFamily = "attribute" | "attribute_number" | "attribute_date";

export function flexFamilyOf(name: string): FlexFamily | null {
  if (/^ATTRIBUTE_DATE\d+$/.test(name)) return "attribute_date";
  if (/^ATTRIBUTE_NUMBER\d+$/.test(name)) return "attribute_number";
  if (/^ATTRIBUTE\d+$/.test(name)) return "attribute";
  return null;
}

export function isFlexColumn(name: string): boolean {
  return flexFamilyOf(name) !== null;
}

export function tableHasFlex(table: DictTable): boolean {
  return table.columns.some((c) => isFlexColumn(c.name));
}

export function tableHasFks(table: DictTable, index: DictionaryIndex): boolean {
  if (table.foreignKeys.length > 0) return true;
  for (const others of index.related.get(table.name) ?? []) {
    const other = index.byTable.get(others);
    if (other?.foreignKeys.some((fk) => fk.references.table === table.name)) return true;
  }
  return false;
}

/* ---------------------------------------------------------------- indexes */

export function buildIndex(release: DictRelease): DictionaryIndex {
  const byTable = new Map<string, DictTable>();
  const byColumn = new Map<string, { table: DictTable; column: DictColumn }[]>();
  const byAlias = new Map<string, DictTable>();
  const related = new Map<string, Set<string>>();

  for (const table of release.tables) {
    byTable.set(table.name, table);
    if (table.alias) byAlias.set(table.alias.toUpperCase(), table);
    related.set(table.name, new Set());
    for (const col of table.columns) {
      const list = byColumn.get(col.name);
      if (list) list.push({ table, column: col });
      else byColumn.set(col.name, [{ table, column: col }]);
    }
  }
  for (const table of release.tables) {
    for (const fk of table.foreignKeys) {
      if (!byTable.has(fk.references.table)) continue;
      related.get(table.name)!.add(fk.references.table);
      related.get(fk.references.table)!.add(table.name);
    }
  }

  return {
    release: release.release,
    tables: release.tables,
    byTable,
    byColumn,
    byAlias,
    related,
    footprint: FOOTPRINT_COLUMNS,
  };
}

/* ---------------------------------------------------------------- search */

export interface TableHit {
  table: DictTable;
  score: number;
  /** which field matched, for display */
  matched: "name" | "alias" | "description";
}

export interface ColumnHit {
  table: DictTable;
  column: DictColumn;
  score: number;
}

function tokenScore(haystack: string, tokens: string[]): number | null {
  const h = haystack.toUpperCase();
  let score = 0;
  for (const token of tokens) {
    const idx = h.indexOf(token);
    if (idx < 0) return null;
    // Prefix matches rank above interior matches; earlier matches rank higher.
    score += token.length * 10 - idx + (idx === 0 ? 5 : 0);
  }
  return score;
}

/**
 * Fuzzy search over table names, aliases and descriptions and over column
 * names. "ship stop" matches SHIPMENT_STOP (token prefix) ahead of SHIPMENT
 * (only the first token matches).
 */
export function searchTables(index: DictionaryIndex, query: string): TableHit[] {
  const tokens = query.toUpperCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const hits: TableHit[] = [];
  for (const table of index.tables) {
    const candidates: { matched: TableHit["matched"]; score: number }[] = [];
    const nameScore = tokenScore(table.name, tokens);
    if (nameScore !== null) candidates.push({ matched: "name", score: nameScore });
    if (table.alias) {
      const aliasScore = tokenScore(table.alias, tokens);
      if (aliasScore !== null) candidates.push({ matched: "alias", score: aliasScore });
    }
    const descScore = tokenScore(table.description, tokens);
    if (descScore !== null) candidates.push({ matched: "description", score: descScore * 0.5 });
    if (candidates.length === 0) continue;
    candidates.sort((a, b) => b.score - a.score);
    hits.push({ table, score: candidates[0].score, matched: candidates[0].matched });
  }
  return hits.sort((a, b) => b.score - a.score || a.table.name.localeCompare(b.table.name));
}

export function searchColumns(index: DictionaryIndex, query: string): ColumnHit[] {
  const tokens = query.toUpperCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const hits: ColumnHit[] = [];
  for (const [name, entries] of index.byColumn) {
    const score = tokenScore(name, tokens);
    if (score === null) continue;
    for (const { table, column } of entries) hits.push({ table, column, score });
  }
  return hits.sort((a, b) => b.score - a.score || a.table.name.localeCompare(b.table.name));
}

/* ----------------------------------------------------------------- joins */

export interface JoinEdge {
  /** table the edge starts from (child for an outgoing FK) */
  from: string;
  /** table the edge ends at */
  to: string;
  /** join condition written from -> to */
  condition: string;
  /** the FK that produced this edge */
  fk: ForeignKey;
}

export interface JoinPath {
  tables: string[];
  edges: JoinEdge[];
  hops: number;
}

/** All FK edges touching a table, in both directions. */
export function edgesOf(tableName: string, index: DictionaryIndex): JoinEdge[] {
  const table = index.byTable.get(tableName);
  if (!table) return [];
  const edges: JoinEdge[] = [];
  // Outgoing: this table's FKs point at the parent.
  for (const fk of table.foreignKeys) {
    const parent = index.byTable.get(fk.references.table);
    if (!parent) continue;
    edges.push({
      from: table.name,
      to: parent.name,
      condition: fk.columns
        .map((c, i) => `${table.alias}.${c} = ${parent.alias}.${fk.references.columns[i]}`)
        .join(" AND "),
      fk,
    });
  }
  // Incoming: children whose FK references this table.
  for (const child of index.tables) {
    if (child.name === tableName) continue;
    for (const fk of child.foreignKeys) {
      if (fk.references.table !== tableName) continue;
      edges.push({
        from: table.name,
        to: child.name,
        condition: fk.columns
          .map((c, i) => `${child.alias}.${c} = ${table.alias}.${fk.references.columns[i]}`)
          .join(" AND "),
        fk,
      });
    }
  }
  return edges;
}

const MAX_HOPS = 4;

/**
 * Breadth-first search over foreign keys in both directions, up to 4 hops.
 * Returns up to `limit` paths ranked by fewest hops, then alphabetically by
 * the table chain.
 */
export function findJoinPaths(
  index: DictionaryIndex,
  fromName: string,
  toName: string,
  viaName?: string,
  limit = 5,
): JoinPath[] {
  if (!index.byTable.has(fromName) || !index.byTable.has(toName)) return [];
  if (fromName === toName) return [{ tables: [fromName], edges: [], hops: 0 }];

  const via = viaName && viaName !== fromName && viaName !== toName ? viaName : undefined;

  interface Node {
    table: string;
    tables: string[];
    edges: JoinEdge[];
  }
  const results: JoinPath[] = [];
  const queue: Node[] = [{ table: fromName, tables: [fromName], edges: [] }];
  let hops = 0;

  while (queue.length > 0 && hops < MAX_HOPS && results.length < limit * 4) {
    hops += 1;
    const level = queue.length;
    for (let n = 0; n < level; n++) {
      const node = queue.shift()!;
      for (const edge of edgesOf(node.table, index)) {
        if (node.tables.includes(edge.to)) continue; // no cycles, no repeats
        const tables = [...node.tables, edge.to];
        const edges = [...node.edges, edge];
        if (edge.to === toName) {
          if (!via || tables.includes(via)) {
            results.push({ tables, edges, hops });
          }
          continue;
        }
        queue.push({ table: edge.to, tables, edges });
      }
    }
  }

  results.sort(
    (a, b) => a.hops - b.hops || a.tables.join(">").localeCompare(b.tables.join(">")),
  );
  return results.slice(0, limit);
}

/* ------------------------------------------------------------------- SQL */

/** Ready-to-copy SELECT of all non-footprint columns with the table alias. */
export function selectSql(table: DictTable, includeFootprint = false): string {
  const cols = table.columns.filter((c) => includeFootprint || !isFootprintColumn(c.name));
  const lines = cols.map(
    (c, i) => `  ${table.alias}.${c.name}${i < cols.length - 1 ? "," : ""}`,
  );
  return `SELECT\n${lines.join("\n")}\nFROM ${table.name} ${table.alias}`;
}

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "IN", "JOIN", "ON", "GROUP", "BY", "ORDER",
  "LEFT", "RIGHT", "INNER", "OUTER", "AS", "DISTINCT", "UNION", "BETWEEN", "LIKE", "IS",
  "NULL", "NOT",
]);

/** Lightweight Oracle SQL highlighter: keywords, comments, strings, numbers. */
export function highlightSql(sql: string): string {
  const escaped = sql.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(
    /(--[^\n]*)|('(?:[^']|'')*')|\b(SELECT|FROM|WHERE|AND|OR|IN|JOIN|ON|GROUP|BY|ORDER|LEFT|RIGHT|INNER|OUTER|AS|DISTINCT|UNION|BETWEEN|LIKE|IS|NULL|NOT)\b|\b(\d+(?:\.\d+)?)\b/gi,
    (m, comment, str, kw, num) => {
      if (comment) return `<span class="text-muted-foreground italic">${comment}</span>`;
      if (str) return `<span class="text-emerald-700 dark:text-emerald-400">${str}</span>`;
      if (kw) return `<span class="text-primary font-semibold">${kw.toUpperCase()}</span>`;
      if (num) return `<span class="text-amber-700 dark:text-amber-400">${num}</span>`;
      return m;
    },
  );
}

export function isKeyword(word: string): boolean {
  return SQL_KEYWORDS.has(word.toUpperCase());
}
