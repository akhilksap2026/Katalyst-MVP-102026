import { describe, expect, it } from "vitest";
import { detectPaste, isIdLike } from "@/lib/detect-paste";

const TABLES = [
  "AGENT",
  "AGENT_ACTION_DETAILS",
  "AGENT_EVENT_DETAILS",
  "LOCATION",
  "ORDER_RELEASE",
  "SHIPMENT",
  "SHIPMENT_STOP",
  "SERVPROV",
];

describe("isIdLike", () => {
  it("accepts bare XIDs, GIDs and subdomain GIDs", () => {
    expect(isIdLike("ORL-100101")).toBe(true);
    expect(isIdLike("KSAP.ORL-100401")).toBe(true);
    expect(isIdLike("KSAP/EU.ORL-100601")).toBe(true);
    expect(isIdLike("SHIPMENT_GID")).toBe(true);
  });
  it("rejects plain words", () => {
    expect(isIdLike("hello")).toBe(false);
    expect(isIdLike("a")).toBe(false);
    expect(isIdLike("two words")).toBe(false);
  });
});

describe("detectPaste", () => {
  it("detects a DB.XML agent extract", () => {
    const xml = `<?xml version="1.0"?>\n<TRANSMISSION>\n  <AGENT>\n    <AGENT_GID>KSAP.ORDER_AUTOBOOK</AGENT_GID>\n  </AGENT>\n</TRANSMISSION>`;
    expect(detectPaste(xml, TABLES)).toMatchObject({ kind: "agent-extract" });
  });

  it("detects a plain CSV with AGENT_GID and AGENT_XID header", () => {
    const csv = `AGENT_GID,AGENT_XID,IS_ACTIVE\nKSAP.ORDER_AUTOBOOK,ORDER_AUTOBOOK,Y`;
    expect(detectPaste(csv, TABLES)).toMatchObject({ kind: "agent-extract" });
  });

  it("detects the OTM CSV variant with the table name on line 1", () => {
    const csv = `AGENT\nAGENT_GID,AGENT_XID,IS_ACTIVE\nKSAP.ORDER_AUTOBOOK,ORDER_AUTOBOOK,Y`;
    expect(detectPaste(csv, TABLES)).toMatchObject({ kind: "agent-extract" });
  });

  it("detects a quoted CSV header", () => {
    const csv = `"AGENT_GID","AGENT_XID"\n"KSAP.A","A"`;
    expect(detectPaste(csv, TABLES)).toMatchObject({ kind: "agent-extract" });
  });

  it("does not treat other CSV files as agent extracts", () => {
    const csv = `SHIPMENT_GID,STATUS\nKSAP.SHIPMENT-1,SECURED`;
    expect(detectPaste(csv, TABLES).kind).not.toBe("agent-extract");
  });

  it("detects a single table name, case-insensitively", () => {
    expect(detectPaste("SHIPMENT_STOP", TABLES)).toMatchObject({
      kind: "table",
      table: "SHIPMENT_STOP",
    });
    expect(detectPaste("shipment_stop", TABLES)).toMatchObject({
      kind: "table",
      table: "SHIPMENT_STOP",
    });
  });

  it("detects a list of bare XIDs", () => {
    const list = "ORL-100101\nORL-100102, ORL-100103";
    const d = detectPaste(list, TABLES);
    expect(d.kind).toBe("list");
    expect(d.values).toHaveLength(3);
  });

  it("detects a list of GIDs with subdomains", () => {
    const list = "KSAP.ORL-100401\tKSAP/EU.ORL-100601\nKSAP.ORL-100402";
    expect(detectPaste(list, TABLES)).toMatchObject({ kind: "list" });
  });

  it("detects a single GID as a list", () => {
    expect(detectPaste("KSAP.ORL-100401", TABLES)).toMatchObject({ kind: "list" });
  });

  it("falls back to text for prose", () => {
    expect(detectPaste("hello world, this is a note", TABLES).kind).toBe("text");
  });

  it("returns text for empty input", () => {
    expect(detectPaste("   ", TABLES).kind).toBe("text");
    expect(detectPaste("", TABLES).kind).toBe("text");
  });
});
