import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPTIONS,
  buildInClauses,
  computeStats,
  detectDelimiters,
  formatOutput,
  hasDomain,
  processList,
  quoteValue,
  splitGid,
  splitValues,
  type ListOptions,
} from "@/lib/list";

const opts = (over: Partial<ListOptions> = {}): ListOptions => ({
  ...DEFAULT_OPTIONS,
  ...over,
});

describe("splitGid", () => {
  it("splits on the first dot only", () => {
    expect(splitGid("KSAP.ORD_001")).toEqual({ domain: "KSAP", xid: "ORD_001" });
    expect(splitGid("KSAP.X.ORD_001")).toEqual({ domain: "KSAP", xid: "X.ORD_001" });
  });
  it("preserves subdomain paths", () => {
    expect(splitGid("KSAP/EU.ORD_001")).toEqual({ domain: "KSAP/EU", xid: "ORD_001" });
    expect(splitGid("KSAP/EU/DE.ORD_001")).toEqual({ domain: "KSAP/EU/DE", xid: "ORD_001" });
  });
  it("treats bare XIDs as domainless", () => {
    expect(splitGid("ORD_001")).toEqual({ domain: null, xid: "ORD_001" });
    expect(splitGid("ORD001")).toEqual({ domain: null, xid: "ORD001" });
  });
  it("hasDomain", () => {
    expect(hasDomain("KSAP.ORD_001")).toBe(true);
    expect(hasDomain("KSAP/EU.ORD_001")).toBe(true);
    expect(hasDomain("ORD_001")).toBe(false);
  });
});

describe("splitValues", () => {
  it("splits on mixed delimiters in auto mode", () => {
    expect(splitValues("A,B\tC;D|E\nF G", "auto")).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
  });
  it("splits on newlines only when newline is chosen", () => {
    expect(splitValues("A,B\nC", "newline")).toEqual(["A,B", "C"]);
  });
  it("keeps delimiters inside quotes", () => {
    expect(splitValues('"A,B",C', "comma")).toEqual(["A,B", "C"]);
    expect(splitValues("'A;B';C", "auto")).toEqual(["A;B", "C"]);
  });
  it("unescapes doubled quotes", () => {
    expect(splitValues('"A ""Q""",B', "comma")).toEqual(['A "Q"', "B"]);
  });
  it("handles quotes spanning multiple lines", () => {
    expect(splitValues('"line1\nline2"\nB', "auto")).toEqual(["line1\nline2", "B"]);
  });
  it("handles spaces inside quotes in auto mode", () => {
    expect(splitValues('"KSAP.City Name",KSAP.OTHER', "auto")).toEqual(["KSAP.City Name", "KSAP.OTHER"]);
  });
  it("skips # label/comment lines", () => {
    expect(splitValues("# Sample data - replace with KSAP data\nA\n# another note\nB", "auto")).toEqual([
      "A",
      "B",
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(splitValues("", "auto")).toEqual([]);
  });
});

describe("detectDelimiters", () => {
  it("reports which delimiters appear", () => {
    expect(detectDelimiters("A,B\tC")).toEqual(["tab", "comma"]);
  });
});

describe("processList", () => {
  it("trims, removes blanks and duplicates by default", () => {
    expect(processList(" A \n\nA\n b ", opts())).toEqual(["A", "b"]);
  });

  it("removes duplicates case-insensitively when enabled", () => {
    expect(processList("ksap.orl-1\nKSAP.ORL-1\nKSAP.ORL-2", opts({ caseInsensitiveDuplicates: true })))
      .toEqual(["ksap.orl-1", "KSAP.ORL-2"]);
  });

  it("sorts A-Z, Z-A and natural", () => {
    const input = "ITEM10\nITEM2\nITEM1";
    expect(processList(input, opts({ sort: "az" }))).toEqual(["ITEM1", "ITEM10", "ITEM2"]);
    expect(processList(input, opts({ sort: "za" }))).toEqual(["ITEM2", "ITEM10", "ITEM1"]);
    expect(processList(input, opts({ sort: "natural" }))).toEqual(["ITEM1", "ITEM2", "ITEM10"]);
  });

  it("uppercases with case: upper", () => {
    expect(processList("ksap.orl-1", opts({ case: "upper" }))).toEqual(["KSAP.ORL-1"]);
  });

  it("removes the domain, preserving the XID", () => {
    expect(processList("KSAP/EU.ORD_001\nKSAP.ORD_002", opts({ domain: "remove" }))).toEqual([
      "ORD_001",
      "ORD_002",
    ]);
  });

  it("adds a domain only to values without one", () => {
    expect(processList("ORD_001\nKSAP.ORD_002\nKSAP/EU.ORD_003", opts({ domain: "add", domainAdd: "KSAP" })))
      .toEqual(["KSAP.ORD_001", "KSAP.ORD_002", "KSAP/EU.ORD_003"]);
  });

  it("replaces the domain KSAP/EU with TEST on the first dot only", () => {
    expect(
      processList("KSAP/EU.ORD_001", opts({ domain: "replace", domainReplaceFrom: "KSAP/EU", domainReplaceTo: "TEST" })),
    ).toEqual(["TEST.ORD_001"]);
  });

  it("domain replace leaves other domains and bare XIDs untouched", () => {
    expect(
      processList(
        "KSAP/EU.A\nKSAP.B\nC",
        opts({ domain: "replace", domainReplaceFrom: "KSAP/EU", domainReplaceTo: "TEST" }),
      ),
    ).toEqual(["TEST.A", "KSAP.B", "C"]);
  });

  it("adds a prefix to the XID part only, keeping subdomains", () => {
    expect(processList("KSAP/EU.ORD_001", opts({ addPrefix: "OLD_" }))).toEqual(["KSAP/EU.OLD_ORD_001"]);
  });

  it("strips a prefix from the XID part only", () => {
    expect(processList("KSAP/EU.OLD_ORD_001\nX.OLD_ORD", opts({ stripPrefix: "OLD_" }))).toEqual([
      "KSAP/EU.ORD_001",
      "X.ORD",
    ]);
  });

  it("adds and strips suffixes on the XID part", () => {
    expect(
      processList("KSAP.ORD_001.IN\nORD_002", opts({ addSuffix: ".NEW", stripSuffix: ".IN" })),
    ).toEqual(["KSAP.ORD_001.NEW", "ORD_002.NEW"]);
  });
});

describe("buildInClauses", () => {
  it("chunks 2,500 values into 3 IN groups (1000 / 1000 / 500)", () => {
    const values = Array.from({ length: 2500 }, (_, i) => `GID-${i}`);
    const clauses = buildInClauses(values, "SHIPMENT_GID", true);
    expect(clauses).toHaveLength(3);
    expect(clauses[0].startsWith("SHIPMENT_GID IN (")).toBe(true);
    expect(clauses[0].match(/GID-/g)).toHaveLength(1000);
    expect(clauses[2].match(/GID-/g)).toHaveLength(500);
    expect(clauses[1].match(/GID-/g)).toHaveLength(1000);
  });

  it("emits a single clause when chunking is off", () => {
    const values = Array.from({ length: 1500 }, (_, i) => `G${i}`);
    expect(buildInClauses(values, "C", false)).toHaveLength(1);
  });
});

describe("quoteValue", () => {
  it("quotes and escapes per style", () => {
    expect(quoteValue(`a"b`, "double")).toBe(`"a""b"`);
    expect(quoteValue(`a'b`, "single")).toBe(`'a''b'`);
    expect(quoteValue("a,b", "none")).toBe("a,b");
  });
});

describe("formatOutput", () => {
  const values = ["KSAP.A1", "KSAP.A2"];

  it("formats one per line", () => {
    expect(formatOutput(values, opts({ preset: "lines" }))).toBe("KSAP.A1\nKSAP.A2");
  });

  it("formats comma and quoted comma lists", () => {
    expect(formatOutput(values, opts({ preset: "comma" }))).toBe("KSAP.A1, KSAP.A2");
    expect(formatOutput(values, opts({ preset: "quoted-comma", quoteStyle: "single" }))).toBe(
      "'KSAP.A1', 'KSAP.A2'",
    );
  });

  it("formats a single SQL IN clause", () => {
    expect(formatOutput(values, opts({ preset: "sql", sqlColumn: "SHIPMENT_GID" }))).toBe(
      "(SHIPMENT_GID IN ('KSAP.A1', 'KSAP.A2'))",
    );
  });

  it("formats chunked SQL clauses OR-joined with parens", () => {
    const big = Array.from({ length: 1001 }, (_, i) => `G${i}`);
    const out = formatOutput(big, opts({ preset: "sql", sqlColumn: "C", chunkInLists: true }));
    expect(out.split("\nOR ")).toHaveLength(2);
    expect(out.startsWith("(C IN (")).toBe(true);
  });

  it("formats a JSON array", () => {
    expect(JSON.parse(formatOutput(values, opts({ preset: "json" })))).toEqual(values);
  });

  it("formats OTM Object IDs", () => {
    expect(formatOutput(values, opts({ preset: "otm-oids", sqlColumn: "SHIPMENT_GID" }))).toBe(
      'SHIPMENT_GID="KSAP.A1",\nSHIPMENT_GID="KSAP.A2"',
    );
  });
});

describe("computeStats", () => {
  it("counts in/out, duplicates, blanks and domain split", () => {
    const input = [" KSAP.ORL-1 ", "KSAP.ORL-1", "", "ORL-2"].join("\n");
    const options = opts();
    const raw = splitValues(input, options.delimiter);
    const out = processList(input, options);
    const stats = computeStats(raw, out, options);
    expect(stats.valuesIn).toBe(3);
    expect(stats.valuesOut).toBe(2);
    expect(stats.duplicatesRemoved).toBe(1);
    expect(stats.blanksRemoved).toBe(1);
    expect(stats.withDomain).toBe(1);
    expect(stats.withoutDomain).toBe(1);
  });

  it("flags values with spaces, lowercase, or more than one dot", () => {
    // The spaced value is quoted so auto mode keeps it as one value.
    const input = ['KSAP.ORL-1', '"KSAP.City Name"', "lowercase", "A.B.C"].join("\n");
    const options = opts({ removeBlanks: true });
    const raw = splitValues(input, options.delimiter);
    const stats = computeStats(raw, processList(input, options), options);
    expect(stats.flagged).toBe(3);
  });
});
