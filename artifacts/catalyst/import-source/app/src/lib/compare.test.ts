import { describe, expect, it } from "vitest";
import { DEFAULT_COMPARE_OPTIONS, buildSource, type CompareOptions } from "@/lib/agents";
import { compareSources, diffLines, exportRows, summaryText } from "@/lib/compare";
import devAgent from "@/data/agents/DEV/AGENT.csv?raw";
import devEvents from "@/data/agents/DEV/AGENT_EVENT_DETAILS.csv?raw";
import devActions from "@/data/agents/DEV/AGENT_ACTION_DETAILS.csv?raw";
import prodAgent from "@/data/agents/PROD/AGENT.csv?raw";
import prodEvents from "@/data/agents/PROD/AGENT_EVENT_DETAILS.csv?raw";
import prodActions from "@/data/agents/PROD/AGENT_ACTION_DETAILS.csv?raw";

const opts = (over: Partial<CompareOptions> = {}): CompareOptions => ({ ...DEFAULT_COMPARE_OPTIONS, ...over });

const dev = buildSource("DEV", [
  { name: "AGENT.csv", text: devAgent },
  { name: "AGENT_EVENT_DETAILS.csv", text: devEvents },
  { name: "AGENT_ACTION_DETAILS.csv", text: devActions },
]);
const prod = buildSource("PROD", [
  { name: "AGENT.csv", text: prodAgent },
  { name: "AGENT_EVENT_DETAILS.csv", text: prodEvents },
  { name: "AGENT_ACTION_DETAILS.csv", text: prodActions },
]);

describe("compareSources on sample data", () => {
  const result = compareSources(dev, prod, opts());

  it("counts changed, only-in and identical agents", () => {
    expect(result.counts.onlyA).toBe(1); // UAT_DATA_PURGE
    expect(result.counts.onlyB).toBe(1); // EDI_997_RETRY
    expect(result.counts.changed).toBe(1); // CARRIER_PERF_WEEKLY
    expect(result.counts.identical).toBe(3);
    expect(result.counts.differences).toBe(3);
  });

  it("marks UAT_DATA_PURGE only in DEV and EDI_997_RETRY only in PROD", () => {
    const purge = result.agents.find((a) => a.xid === "UAT_DATA_PURGE")!;
    expect(purge.status).toBe("only-a");
    expect(purge.agentB).toBeNull();
    const edi = result.agents.find((a) => a.xid === "EDI_997_RETRY")!;
    expect(edi.status).toBe("only-b");
  });

  it("flags the CARRIER_PERF_WEEKLY SQL parameter change", () => {
    const perf = result.agents.find((a) => a.xid === "CARRIER_PERF_WEEKLY")!;
    expect(perf.status).toBe("changed");
    const sql = perf.actionDiffs.find((d) => d.actionGid === "KSAP.RUN_PERF_SQL")!;
    expect(sql.status).toBe("changed");
    expect(sql.fields.some((f) => f.field === "ACTION_PARAMETERS")).toBe(true);
  });

  it("flags the added EMAIL_PERF_SUMMARY action", () => {
    const perf = result.agents.find((a) => a.xid === "CARRIER_PERF_WEEKLY")!;
    const email = perf.actionDiffs.find((d) => d.actionGid === "KSAP.EMAIL_PERF_SUMMARY")!;
    expect(email.status).toBe("added");
    expect(email.flowB).toBe(1);
    expect(email.flowA).toBeNull();
  });

  it("ignores footprint columns by default but reports them when off", () => {
    const a = buildSource("A", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID,IS_ACTIVE,INSERT_USER\nKSAP.A1,A1,Y,KSAP.ADMIN\n" },
    ]);
    const b = buildSource("B", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID,IS_ACTIVE,INSERT_USER\nKSAP.A1,A1,Y,EU.JMERCER\n" },
    ]);
    expect(compareSources(a, b, opts()).counts.identical).toBe(1);
    const withFootprint = compareSources(a, b, opts({ ignoreFootprint: false }));
    expect(withFootprint.counts.changed).toBe(1);
    expect(withFootprint.agents[0].headerDiffs.some((d) => d.field === "INSERT_USER")).toBe(true);
  });

  it("detects references that differ for only-in agents", () => {
    const edi = result.agents.find((a) => a.xid === "EDI_997_RETRY")!;
    expect(edi.referencesDiffer).toBe(true);
    expect(edi.conditionsB.length).toBeGreaterThan(0);
  });
});

describe("option handling", () => {
  it("ignoreWhitespace treats parameter whitespace differences as equal", () => {
    const mk = (param: string) =>
      buildSource("X", [
        {
          name: "AGENT.csv",
          text: `AGENT_GID,AGENT_XID,DATA_QUERY_TYPE_GID,IS_ACTIVE\nKSAP.A1,A1,KSAP.SQL_QUERY,Y\n`,
        },
        {
          name: "AGENT_ACTION_DETAILS.csv",
          text: `AGENT_GID,ACTION_FLOW,ACTION_SEQUENCE,AGENT_ACTION_GID,ACTION_PARAMETERS\nKSAP.A1,1,1,KSAP.X,"${param}"\n`,
        },
      ]);
    const a = mk("A=1;\nB=2");
    const b = mk("A=1;   B=2");
    expect(compareSources(a, b, opts({ ignoreWhitespace: false })).counts.changed).toBe(1);
    expect(compareSources(a, b, opts({ ignoreWhitespace: true })).counts.identical).toBe(1);
  });

  it("ignoreCase matches agents with differing case XIDs", () => {
    const a = buildSource("A", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID,IS_ACTIVE\nKSAP.FOO,FooBar,Y\n" },
    ]);
    const b = buildSource("B", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID,IS_ACTIVE\nEU.FOOBAR,FOOBAR,Y\n" },
    ]);
    expect(compareSources(a, b, opts()).counts.onlyA).toBe(1);
    const ci = compareSources(a, b, opts({ ignoreCase: true }));
    expect(ci.counts.identical).toBe(1);
  });

  it("matchBy gid keeps domains distinct", () => {
    const a = buildSource("A", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID,IS_ACTIVE\nKSAP.FOO,FOO,Y\n" },
    ]);
    const b = buildSource("B", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID,IS_ACTIVE\nEU.FOO,FOO,Y\n" },
    ]);
    expect(compareSources(a, b, opts({ matchBy: "gid" })).counts.onlyA).toBe(1);
  });
});

describe("moved actions", () => {
  it("marks an action at a different flow/sequence as moved", () => {
    const mk = (flow: number, seq: number) =>
      buildSource("X", [
        { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID\nKSAP.A1,A1\n" },
        {
          name: "AGENT_ACTION_DETAILS.csv",
          text: `AGENT_GID,ACTION_FLOW,ACTION_SEQUENCE,AGENT_ACTION_GID,ACTION_PARAMETERS\nKSAP.A1,${flow},${seq},KSAP.STEP1,P=1\n`,
        },
      ]);
    const result = compareSources(mk(1, 1), mk(2, 1), opts());
    const cmp = result.agents[0];
    expect(cmp.actionDiffs[0].status).toBe("moved");
    expect(cmp.actionDiffs[0].fields.some((f) => f.field === "ACTION_FLOW")).toBe(true);
  });
});

describe("exportRows", () => {
  it("emits one row per difference for a changed agent", () => {
    const result = compareSources(dev, prod, opts());
    const perf = result.agents.find((a) => a.xid === "CARRIER_PERF_WEEKLY")!;
    const rows = exportRows(perf);
    expect(rows.length).toBe(
      perf.headerDiffs.length +
        perf.eventDiffs.reduce((s, e) => s + e.fields.length, 0) +
        perf.actionDiffs.reduce((s, a2) => s + a2.fields.length, 0),
    );
    expect(rows.every((r) => r.xid === "CARRIER_PERF_WEEKLY")).toBe(true);
    expect(rows.some((r) => r.section === "Actions" && r.changeType === "added")).toBe(true);
  });

  it("emits agent-level rows for only-in agents", () => {
    const result = compareSources(dev, prod, opts());
    const purge = result.agents.find((a) => a.xid === "UAT_DATA_PURGE")!;
    const rows = exportRows(purge);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.changeType === "only in A" && r.valueB === "")).toBe(true);
    expect(rows.some((r) => r.section === "Actions")).toBe(true);
  });
});

describe("summaryText", () => {
  it("lists the counts and the differing agents", () => {
    const result = compareSources(dev, prod, opts());
    const text = summaryText(result);
    expect(text).toContain("DEV vs PROD");
    expect(text).toContain("Only in DEV: 1");
    expect(text).toContain("UAT_DATA_PURGE");
    expect(text).not.toContain("IDENTICAL_AGENT_NEVER_MATCHES");
  });
});

describe("diffLines", () => {
  it("marks added, removed and unchanged lines", () => {
    const out = diffLines("a\nb\nc", "a\nx\nc");
    expect(out).toEqual([
      { type: "same", text: "a" },
      { type: "removed", text: "b" },
      { type: "added", text: "x" },
      { type: "same", text: "c" },
    ]);
  });

  it("handles empty sides", () => {
    expect(diffLines("", "x\ny")).toEqual([
      { type: "added", text: "x" },
      { type: "added", text: "y" },
    ]);
    expect(diffLines("x", "")).toEqual([{ type: "removed", text: "x" }]);
    expect(diffLines("", "")).toEqual([]);
  });
});

describe("duplicate match keys", () => {
  it("reports agents skipped because their match key repeats in one source", () => {
    const mk = (gid: string) =>
      buildSource("S", [{ name: "AGENT.csv", text: `AGENT_GID,AGENT_XID,IS_ACTIVE\n${gid},DUP,Y\n` }]).agents[0];
    const src = { label: "A", files: [], warnings: [], raw: {}, agents: [mk("D1.DUP"), mk("D2.DUP")] };
    const empty = { ...src, label: "B", agents: [] };
    const r = compareSources(src, empty, DEFAULT_COMPARE_OPTIONS);
    expect(r.duplicates).toEqual([{ source: "A", key: "DUP" }]);
  });
});
