/**
 * List Utility — all transformation logic as pure functions.
 * No DOM, no storage, no I/O: everything is unit-testable.
 */

/* ------------------------------------------------------------------ types */

export type Delimiter = "auto" | "newline" | "tab" | "comma" | "semicolon" | "pipe" | "space";
export type SortMode = "none" | "az" | "za" | "natural";
export type DomainAction = "keep" | "remove" | "add" | "replace";
export type CaseMode = "keep" | "upper";
export type QuoteStyle = "single" | "double" | "none";
export type OutputPreset = "lines" | "comma" | "quoted-comma" | "sql" | "json" | "otm-oids";

export interface ListOptions {
  delimiter: Delimiter;
  trim: boolean;
  removeBlanks: boolean;
  removeDuplicates: boolean;
  caseInsensitiveDuplicates: boolean;
  sort: SortMode;
  domain: DomainAction;
  domainAdd: string;
  domainReplaceFrom: string;
  domainReplaceTo: string;
  stripPrefix: string;
  addPrefix: string;
  stripSuffix: string;
  addSuffix: string;
  case: CaseMode;
  quoteStyle: QuoteStyle;
  preset: OutputPreset;
  sqlColumn: string;
  chunkInLists: boolean;
}

export const DEFAULT_OPTIONS: ListOptions = {
  delimiter: "auto",
  trim: true,
  removeBlanks: true,
  removeDuplicates: true,
  caseInsensitiveDuplicates: false,
  sort: "none",
  domain: "keep",
  domainAdd: "",
  domainReplaceFrom: "",
  domainReplaceTo: "",
  stripPrefix: "",
  addPrefix: "",
  stripSuffix: "",
  addSuffix: "",
  case: "keep",
  quoteStyle: "double",
  preset: "lines",
  sqlColumn: "SHIPMENT_GID",
  chunkInLists: true,
};

export interface ListStats {
  valuesIn: number;
  valuesOut: number;
  duplicatesRemoved: number;
  blanksRemoved: number;
  withDomain: number;
  withoutDomain: number;
  /** Values with spaces, lowercase letters, or more than one "." (before cleaning). */
  flagged: number;
}

export const ORACLE_IN_LIMIT = 1000;

export interface GidParts {
  domain: string | null;
  xid: string;
}

/* ---------------------------------------------------------------- GIDs */

/**
 * Split a GID on the FIRST "." only. Domain may contain "/" subdomains
 * (e.g. KSAP/EU.ORD_001 → domain KSAP/EU, xid ORD_001).
 */
export function splitGid(value: string): GidParts {
  const idx = value.indexOf(".");
  if (idx <= 0) return { domain: null, xid: value };
  const domain = value.slice(0, idx);
  const xid = value.slice(idx + 1);
  if (!domain || !xid) return { domain: null, xid: value };
  return { domain, xid };
}

export function hasDomain(value: string): boolean {
  return splitGid(value).domain !== null;
}

/* -------------------------------------------------------------- splitting */

const DELIMITER_CHARS: Record<Exclude<Delimiter, "auto">, string[]> = {
  newline: ["\n", "\r"],
  tab: ["\t"],
  comma: [","],
  semicolon: [";"],
  pipe: ["|"],
  space: [" "],
};

const AUTO_SPLIT_CHARS = new Set(["\n", "\r", "\t", ",", ";", "|", " "]);

function isQuote(ch: string): boolean {
  return ch === '"' || ch === "'";
}

/**
 * Character state-machine splitter. Handles quoted regions ("..." or '...')
 * that may contain delimiters, and doubled quotes ("" / '') inside quoted
 * regions. Outside quotes every delimiter char splits; consecutive
 * delimiters yield blank tokens (which cleaning can then remove).
 */
export function splitValues(input: string, delimiter: Delimiter): string[] {
  if (input === "") return [];

  // Label/comment lines start with "#" (OTM export convention, e.g. the
  // "Sample data" banner) and are never values.
  input = input
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");

  let isDelim: (ch: string) => boolean;
  if (delimiter === "auto") {
    isDelim = (ch) => AUTO_SPLIT_CHARS.has(ch);
  } else {
    const chars = new Set(DELIMITER_CHARS[delimiter]);
    isDelim = (ch) => chars.has(ch);
  }

  const tokens: string[] = [];
  let current = "";
  let quoteChar: string | null = null;
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (quoteChar !== null) {
      if (ch === quoteChar) {
        const next = input[i + 1];
        if (next === quoteChar) {
          current += ch;
          i += 2;
          continue;
        }
        quoteChar = null;
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }
    if (isQuote(ch)) {
      quoteChar = ch;
      i += 1;
      continue;
    }
    if (isDelim(ch)) {
      tokens.push(current);
      current = "";
      i += 1;
      // Collapse runs of delimiter characters: "A\n\nB" -> ["A", "B"], so a
      // blank *line* becomes one blank token (counted once), not two.
      while (i < input.length && isDelim(input[i]) && !isQuote(input[i])) {
        i += 1;
      }
      continue;
    }
    current += ch;
    i += 1;
  }
  tokens.push(current);
  return tokens;
}

/** Detect which delimiters appear in the input (used for UI feedback). */
export function detectDelimiters(input: string): Delimiter[] {
  const found: Delimiter[] = [];
  if (input.includes("\n")) found.push("newline");
  if (input.includes("\t")) found.push("tab");
  if (input.includes(",")) found.push("comma");
  if (input.includes(";")) found.push("semicolon");
  if (input.includes("|")) found.push("pipe");
  if (input.includes(" ")) found.push("space");
  return found;
}

/* ------------------------------------------------------------- cleaning */

function stripOnce(value: string, affix: string): string {
  if (!affix) return value;
  return value.startsWith(affix) ? value.slice(affix.length) : value;
}

function stripSuffixOnce(value: string, affix: string): string {
  if (!affix) return value;
  return value.endsWith(affix) ? value.slice(0, value.length - affix.length) : value;
}

export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export function processList(input: string, options: ListOptions): string[] {
  return processTokens(splitValues(input, options.delimiter), options);
}

/** The cleaning pipeline over already-split tokens. */
export function processTokens(tokens: string[], options: ListOptions): string[] {
  let values = options.trim ? tokens.map((t) => t.trim()) : tokens.slice();

  // Prefix/suffix apply to the XID part; keep domain and subdomain path intact.
  if (options.stripPrefix || options.addPrefix || options.stripSuffix || options.addSuffix) {
    values = values.map((v) => {
      const { domain, xid } = splitGid(v);
      let x = stripOnce(xid, options.stripPrefix);
      x = stripSuffixOnce(x, options.stripSuffix);
      if (options.addPrefix) x = options.addPrefix + x;
      if (options.addSuffix) x = x + options.addSuffix;
      return domain !== null ? `${domain}.${x}` : x;
    });
  }

  if (options.domain === "remove") {
    values = values.map((v) => splitGid(v).xid);
  } else if (options.domain === "add" && options.domainAdd) {
    values = values.map((v) => {
      const { domain } = splitGid(v);
      // Skip values that already carry a domain (incl. subdomain paths).
      return domain !== null ? v : `${options.domainAdd}.${v}`;
    });
  } else if (options.domain === "replace" && options.domainReplaceFrom) {
    const from = options.domainReplaceFrom;
    values = values.map((v) => {
      const { domain, xid } = splitGid(v);
      // Exact domain match; a value whose domain differs (or is absent) is untouched.
      return domain === from ? `${options.domainReplaceTo}.${xid}` : v;
    });
  }

  if (options.case === "upper") {
    values = values.map((v) => v.toUpperCase());
  }

  if (options.removeBlanks) {
    const kept: string[] = [];
    for (const v of values) {
      if (v !== "") kept.push(v);
    }
    values = kept;
  }

  if (options.removeDuplicates) {
    const seen = new Set<string>();
    const kept: string[] = [];
    for (const v of values) {
      const key = options.caseInsensitiveDuplicates ? v.toLowerCase() : v;
      if (!seen.has(key)) {
        seen.add(key);
        kept.push(v);
      }
    }
    values = kept;
  }

  switch (options.sort) {
    case "az":
      values = values.slice().sort((a, b) => a.localeCompare(b));
      break;
    case "za":
      values = values.slice().sort((a, b) => b.localeCompare(a));
      break;
    case "natural":
      values = values.slice().sort(naturalCompare);
      break;
    case "none":
      break;
  }

  return values;
}

/** Values that likely need attention: contain whitespace, lowercase letters or >1 dot. */
export function isFlaggedValue(v: string): boolean {
  return /\s/.test(v) || /[a-z]/.test(v) || (v.match(/\./g)?.length ?? 0) > 1;
}

export function computeStats(
  rawTokens: string[],
  output: string[],
  options: ListOptions,
): ListStats {
  // Values after trim + blank removal, before duplicate removal: "values in".
  // Operates on the already-split tokens: re-joining and re-splitting would
  // break quoted values that contain spaces (auto mode splits on spaces).
  const cleaned = processTokens(rawTokens, { ...options, removeDuplicates: false });

  // Domain split describes the final list (after dedup and transforms).
  const withDomain = output.filter((v) => hasDomain(v)).length;

  // Flags are judged on the cleaned values (as pasted), never on blanks.
  const flagged = cleaned.filter(isFlaggedValue).length;

  return {
    valuesIn: cleaned.length,
    valuesOut: output.length,
    duplicatesRemoved: cleaned.length - output.length,
    blanksRemoved: rawTokens.length - cleaned.length,
    withDomain,
    withoutDomain: output.length - withDomain,
    flagged,
  };
}

/* ---------------------------------------------------------------- output */

export function quoteValue(value: string, style: QuoteStyle): string {
  switch (style) {
    case "single":
      return `'${value.replace(/'/g, "''")}'`;
    case "double":
      return `"${value.replace(/"/g, '""')}"`;
    case "none":
      return value;
  }
}

/** "COL IN (...)" chunks of at most ORACLE_IN_LIMIT literals, OR-joined. */
export function buildInClauses(values: string[], column: string, chunk: boolean): string[] {
  const size = chunk ? ORACLE_IN_LIMIT : values.length || 1;
  const clauses: string[] = [];
  for (let i = 0; i < values.length; i += size) {
    clauses.push(`${column} IN (${values.slice(i, i + size).join(", ")})`);
  }
  return clauses;
}

/** One OTM Object ID reference per value, for DB.XML export files. */
export function otmObjectIds(values: string[], column: string): string[] {
  return values.map((v) => `${column}="${v}"`);
}

export function formatOutput(values: string[], options: ListOptions): string {
  const quote = (v: string) => quoteValue(v, options.quoteStyle);

  switch (options.preset) {
    case "lines":
      return values.join("\n");
    case "comma":
      return values.join(", ");
    case "quoted-comma":
      return values.map(quote).join(", ");
    case "sql":
      // SQL string literals are single-quoted; double quotes would be identifiers.
      return buildInClauses(
        values.map((v) => quoteValue(v, "single")),
        options.sqlColumn,
        options.chunkInLists,
      )
        .map((c) => `(${c})`)
        .join("\nOR ");
    case "json":
      return JSON.stringify(values, null, 2);
    case "otm-oids":
      return otmObjectIds(values, options.sqlColumn).join(",\n");
  }
}
