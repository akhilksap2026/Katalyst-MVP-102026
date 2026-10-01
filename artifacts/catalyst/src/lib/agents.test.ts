import { describe, expect, it } from "vitest";
import {
  DEFAULT_COMPARE_OPTIONS,
  buildSource,
  matchKey,
  parseCsv,
  sniffCsvTable,
  sourceCounts,
  type CompareOptions,
} from "@/lib/agents";
import devAgent from "@/data/agents/DEV/AGENT.csv?raw";
import devEvents from "@/data/agents/DEV/AGENT_EVENT_DETAILS.csv?raw";
import devActions from "@/data/agents/DEV/AGENT_ACTION_DETAILS.csv?raw";
import devXml from "@/data/agents/DEV/agents.db.xml?raw";
import prodAgent from "@/data/agents/PROD/AGENT.csv?raw";
import prodEvents from "@/data/agents/PROD/AGENT_EVENT_DETAILS.csv?raw";
import prodActions from "@/data/agents/PROD/AGENT_ACTION_DETAILS.csv?raw";

const opts = (over: Partial<CompareOptions> = {}): CompareOptions => ({ ...DEFAULT_COMPARE_OPTIONS, ...over });

describe("sniffCsvTable", () => {
  it("detects the OTM table-name line after # comments", () => {
    const text = "# Sample data\nAGENT_EVENT_DETAILS\nAGENT_GID,AGENT_EVENT_GID,DOMAIN_NAME\n";
    const sniffed = sniffCsvTable(text);
    expect(sniffed?.table).toBe("AGENT_EVENT_DETAILS");
    expect(sniffed?.columns).toEqual(["AGENT_GID", "AGENT_EVENT_GID", "DOMAIN_NAME"]);
  });

  it("detects plain CSV by its column header", () => {
    const sniffed = sniffCsvTable("AGENT_GID,AGENT_XID,DOMAIN_NAME\nA.A1,A1,KSAP\n");
    expect(sniffed?.table).toBe("AGENT");
  });
});

describe("parseCsv", () => {
  it("handles quoted commas, doubled quotes and line breaks", () => {
    const doc = parseCsv(
      '"one, two","say ""hi""","line1\nline2"\n',
      "f.csv",
      2,
      "A,B,C",
    );
    expect(doc.columns).toEqual(["A", "B", "C"]);
    expect(doc.rows).toEqual([["one, two", 'say "hi"', "line1\nline2"]]);
    expect(doc.lineNumbers).toEqual([2]);
  });

  it("flags an unterminated quote", () => {
    const doc = parseCsv('A,B\n"broken', "f.csv", 1);
    expect(doc.warnings.some((w) => w.kind === "malformed-quotes")).toBe(true);
  });

  it("flags a ragged row", () => {
    const doc = parseCsv("A,B,C\n1,2\n", "f.csv", 1);
    expect(doc.warnings.some((w) => w.kind === "unknown-column" && w.line === 2)).toBe(true);
  });
});

describe("buildSource (CSV)", () => {
  const dev = buildSource("DEV", [
    { name: "AGENT.csv", text: devAgent },
    { name: "AGENT_EVENT_DETAILS.csv", text: devEvents },
    { name: "AGENT_ACTION_DETAILS.csv", text: devActions },
  ]);

  it("builds one model per agent with sorted actions", () => {
    expect(dev.agents).toHaveLength(5);
    const inv = dev.agents.find((a) => a.gid === "KSAP.INVOICE_AUDIT_SYNC")!;
    expect(inv.actions.map((a) => [a.flow, a.sequence])).toEqual([
      [1, 1],
      [2, 1],
    ]);
  });

  it("multi-line SQL parameter is kept intact", () => {
    const perf = dev.agents.find((a) => a.gid === "KSAP.CARRIER_PERF_WEEKLY")!;
    expect(perf.actions[0].parameters).toContain("INSERT INTO KSAP_PERF_WEEKLY");
    expect(perf.actions[0].parameters).toContain("GROUP BY sp.servprov_gid");
  });

  it("collects saved condition and query GIDs", () => {
    const ob = dev.agents.find((a) => a.gid === "KSAP.ORDER_AUTOBOOK")!;
    expect(ob.savedConditionGids).toContain("KSAP.SC_ACTIVE");
    expect(ob.header.SAVED_CONDITION_GID).toBe("KSAP.SC_ACTIVE");
    // Footprint columns are kept in the model; comparison filters them.
    expect(ob.header.INSERT_USER).toBe("KSAP.ADMIN");
  });

  it("reports counts and recognised files", () => {
    expect(sourceCounts(dev)).toEqual({ agents: 5, events: 5, actions: 7 });
    expect(dev.files.map((f) => f.table)).toEqual(["AGENT", "AGENT_EVENT_DETAILS", "AGENT_ACTION_DETAILS"]);
  });
});

describe("buildSource (DB.XML)", () => {
  const dev = buildSource("DEV", [{ name: "agents.db.xml", text: devXml }]);

  it("reads agents, events and actions from TRANSACTION_SET", () => {
    expect(sourceCounts(dev)).toEqual({ agents: 5, events: 5, actions: 7 });
    const ob = dev.agents.find((a) => a.gid === "KSAP.ORDER_AUTOBOOK")!;
    expect(ob.xid).toBe("ORDER_AUTOBOOK");
    expect(ob.events[0].eventGid).toBe("ORDER_RELEASE - MODIFIED");
    expect(ob.actions).toHaveLength(2);
  });
});

describe("warnings", () => {
  it("flags orphan events with file and line", () => {
    const src = buildSource("DEV", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID,DOMAIN_NAME\nKSAP.A1,A1,KSAP\n" },
      {
        name: "AGENT_EVENT_DETAILS.csv",
        text: "AGENT_GID,AGENT_EVENT_GID,DOMAIN_NAME\nKSAP.NOPE,ORDER - MODIFIED,KSAP\n",
      },
    ]);
    const w = src.warnings.find((x) => x.kind === "orphan-row")!;
    expect(w.file).toBe("AGENT_EVENT_DETAILS.csv");
    expect(w.line).toBe(2);
  });

  it("flags unknown columns", () => {
    const src = buildSource("DEV", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID,BOGUS_COL\nKSAP.A1,A1,x\n" },
    ]);
    expect(src.warnings.some((w) => w.kind === "unknown-column" && w.message.includes("BOGUS_COL"))).toBe(true);
  });

  it("flags malformed quotes", () => {
    const src = buildSource("DEV", [
      { name: "AGENT.csv", text: "AGENT_GID,AGENT_XID\n\"A1,KSAP\n" },
    ]);
    expect(src.warnings.some((w) => w.kind === "malformed-quotes")).toBe(true);
  });
});

describe("matchKey", () => {
  const agent = { gid: "KSAP.ORDER_AUTOBOOK", xid: "ORDER_AUTOBOOK" } as never;

  it("matches by XID by default, ignoring domain", () => {
    expect(matchKey(agent, opts())).toBe("ORDER_AUTOBOOK");
  });

  it("can match by full GID and ignore case", () => {
    expect(matchKey(agent, opts({ matchBy: "gid" }))).toBe("KSAP.ORDER_AUTOBOOK");
    expect(matchKey(agent, opts({ matchBy: "gid", ignoreCase: true }))).toBe("KSAP.ORDER_AUTOBOOK");
  });
});

describe("sample data parity", () => {
  it("DEV CSV and DEV DB.XML build the same agent set", () => {
    const fromCsv = buildSource("DEV", [
      { name: "AGENT.csv", text: devAgent },
      { name: "AGENT_EVENT_DETAILS.csv", text: devEvents },
      { name: "AGENT_ACTION_DETAILS.csv", text: devActions },
    ]);
    const fromXml = buildSource("DEV", [{ name: "agents.db.xml", text: devXml }]);
    expect(fromCsv.agents.map((a) => a.gid)).toEqual(fromXml.agents.map((a) => a.gid));
    expect(sourceCounts(fromCsv)).toEqual(sourceCounts(fromXml));
  });

  it("PROD adds EDI_997_RETRY and an extra CARRIER_PERF action", () => {
    const prod = buildSource("PROD", [
      { name: "AGENT.csv", text: prodAgent },
      { name: "AGENT_EVENT_DETAILS.csv", text: prodEvents },
      { name: "AGENT_ACTION_DETAILS.csv", text: prodActions },
    ]);
    expect(prod.agents.map((a) => a.gid)).toContain("KSAP.EDI_997_RETRY");
    const perf = prod.agents.find((a) => a.gid === "KSAP.CARRIER_PERF_WEEKLY")!;
    expect(perf.actions).toHaveLength(2);
    expect(prod.agents.some((a) => a.gid === "KSAP.UAT_DATA_PURGE")).toBe(false);
  });
});

describe("DB.XML value decoding", () => {
  it("unwraps CDATA and decodes entities so XML matches CSV", () => {
    const xml = `<AGENT><AGENT_GID>D.A</AGENT_GID><AGENT_XID>A</AGENT_XID>
      <AGENT_ACTION_DETAILS><AGENT_GID>D.A</AGENT_GID><ACTION_FLOW>1</ACTION_FLOW><ACTION_SEQUENCE>1</ACTION_SEQUENCE>
      <AGENT_ACTION_GID>D.X</AGENT_ACTION_GID><ACTION_PARAMETERS><![CDATA[a<b AND <TAG>x</TAG>]]></ACTION_PARAMETERS></AGENT_ACTION_DETAILS>
      <AGENT_EVENT_DETAILS><AGENT_GID>D.A</AGENT_GID><AGENT_EVENT_GID>E</AGENT_EVENT_GID><AGENT_EVENT_PARAMETERS>A &amp; B</AGENT_EVENT_PARAMETERS></AGENT_EVENT_DETAILS></AGENT>`;
    const a = buildSource("X", [{ name: "a.xml", text: xml }]).agents[0];
    expect(a.actions[0].parameters).toBe("a<b AND <TAG>x</TAG>");
    expect(a.events[0].parameters).toBe("A & B");
  });
});
