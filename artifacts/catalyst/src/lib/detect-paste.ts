/**
 * Paste detection for the Home smart paste box.
 * Pure functions — no DOM, no storage — so they are unit-testable.
 */
import { tr } from "@/lib/tr";

export type PasteKind = "agent-extract" | "table" | "list" | "text";

export interface PasteDetection {
  kind: PasteKind;
  /** Matched dictionary table (present when kind === "table"). */
  table?: string;
  /** Values found in the input (present when kind === "list"). */
  values?: string[];
  /** Human-readable explanation shown next to the suggestion. */
  reason: string;
}

const AGENT_CSV_COLUMNS = ["AGENT_GID", "AGENT_XID"] as const;

function splitCsvLine(line: string): string[] {
  return line
    .split(",")
    .map((cell) => cell.trim().replace(/^"|"$/g, "").toUpperCase());
}

/** A token looks like an OTM ID or GID: bare XID, DOMAIN.XID or DOMAIN/SUB.XID. */
export function isIdLike(token: string): boolean {
  if (token.length < 2) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9_./-]*$/.test(token)) return false;
  return token.includes(".") || token.includes("-") || /^[A-Z]{2,}[A-Z0-9_]*$/.test(token);
}

/**
 * Classify pasted text. `tableNames` must be the uppercase table names of the
 * selected dictionary release.
 */
export function detectPaste(input: string, tableNames: readonly string[]): PasteDetection {
  const text = input.trim();
  if (!text) return { kind: "text", reason: tr("detect.nothing") };

  // 1. DB.XML agent extract
  if (/<AGENT[\s>]/.test(text) || /<AGENT_GID>/.test(text)) {
    return { kind: "agent-extract", reason: tr("detect.xml") };
  }

  // 2. CSV extract of the AGENT table: plain header on line 1, or the OTM
  //    variant with the table name on line 1 and the header on line 2.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (lines.length >= 2) {
    const first = splitCsvLine(lines[0]);
    const second = splitCsvLine(lines[1]);
    const header = first.includes("AGENT_GID")
      ? first
      : /^[A-Z][A-Z0-9_]*$/.test(lines[0]) && second.includes("AGENT_GID")
        ? second
        : null;
    if (header && AGENT_CSV_COLUMNS.every((c) => header.includes(c))) {
      return {
        kind: "agent-extract",
        reason: tr("detect.csv", { columns: AGENT_CSV_COLUMNS.join(tr("detect.and")) }),
      };
    }
  }

  // 3. A single dictionary table name (case-insensitive)
  if (text.length <= 60 && !/[\s,;]/.test(text)) {
    const upper = text.toUpperCase();
    if (tableNames.includes(upper)) {
      return { kind: "table", table: upper, reason: tr("detect.table", { table: upper }) };
    }
  }

  // 4. A list of IDs or GIDs
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const idLike = tokens.filter(isIdLike);
  if (tokens.length > 0 && idLike.length > 0 && idLike.length / tokens.length >= 0.6) {
    return {
      kind: "list",
      values: tokens,
      reason: tr("detect.ids", { count: idLike.length, total: tokens.length }),
    };
  }

  return { kind: "text", reason: tr("detect.none") };
}
