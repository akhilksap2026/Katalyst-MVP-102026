import { describe, expect, it } from "vitest";
import { RELEASE_DATA } from "@/lib/dictionary-data";

import {
  buildIndex,
  findJoinPaths,
  flexFamilyOf,
  isFootprintColumn,
  parseRelease,
  searchColumns,
  searchTables,
  selectSql,
  tableHasFlex,
  type DictionaryIndex,
} from "@/lib/dictionary";

const index26A: DictionaryIndex = buildIndex(parseRelease(RELEASE_DATA["26A"]));
const index26C: DictionaryIndex = buildIndex(parseRelease(RELEASE_DATA["26C"]));

describe("parseRelease + buildIndex", () => {
  it("parses tables into a flat list", () => {
    expect(index26A.tables.map((t) => t.name)).toContain("SHIPMENT");
    expect(index26A.tables).toHaveLength(13);
  });

  it("indexes tables, columns and aliases", () => {
    expect(index26A.byTable.get("SHIPMENT")?.alias).toBe("SH");
    expect(index26A.byAlias.get("SH")?.name).toBe("SHIPMENT");
    const gidCols = index26A.byColumn.get("SHIPMENT_GID")!.map((e) => e.table.name);
    expect(gidCols).toContain("SHIPMENT");
    expect(gidCols).toContain("SHIPMENT_STOP");
  });

  it("indexes related tables in both FK directions", () => {
    expect(index26A.related.get("SHIPMENT_STOP")!.has("SHIPMENT")).toBe(true);
    expect(index26A.related.get("SHIPMENT")!.has("SHIPMENT_STOP")).toBe(true);
    expect(index26A.related.get("LOCATION")!.has("SHIPMENT_STOP")).toBe(true);
  });
});

describe("footprint and flex fields", () => {
  it("detects footprint columns", () => {
    expect(isFootprintColumn("INSERT_USER")).toBe(true);
    expect(isFootprintColumn("UPDATE_DATE")).toBe(true);
    expect(isFootprintColumn("SHIPMENT_GID")).toBe(false);
  });

  it("detects flex families", () => {
    expect(flexFamilyOf("ATTRIBUTE1")).toBe("attribute");
    expect(flexFamilyOf("ATTRIBUTE_NUMBER10")).toBe("attribute_number");
    expect(flexFamilyOf("ATTRIBUTE_DATE3")).toBe("attribute_date");
    expect(flexFamilyOf("SHIPMENT_GID")).toBeNull();
  });

  it("tables carry full flex families on SHIPMENT", () => {
    const sh = index26A.byTable.get("SHIPMENT")!;
    expect(tableHasFlex(sh)).toBe(true);
    expect(sh.columns.filter((c) => flexFamilyOf(c.name) === "attribute")).toHaveLength(20);
    expect(sh.columns.filter((c) => flexFamilyOf(c.name) === "attribute_number")).toHaveLength(10);
    expect(sh.columns.filter((c) => flexFamilyOf(c.name) === "attribute_date")).toHaveLength(10);
  });
});

describe("search", () => {
  it('"ship stop" finds SHIPMENT_STOP first', () => {
    const hits = searchTables(index26A, "ship stop");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].table.name).toBe("SHIPMENT_STOP");
  });

  it("finds tables by alias", () => {
    const hits = searchTables(index26A, "sh");
    expect(hits[0].table.name).toBe("SHIPMENT");
  });

  it("finds tables by description token", () => {
    const hits = searchTables(index26A, "carrier");
    expect(hits.map((h) => h.table.name)).toContain("SERVPROV");
  });

  it("matches whole table when all tokens hit", () => {
    expect(searchTables(index26A, "order release")).not.toHaveLength(0);
  });

  it("finds columns across tables", () => {
    const hits = searchColumns(index26A, "location_gid");
    const tables = hits.map((h) => h.table.name);
    expect(tables).toContain("SHIPMENT_STOP");
    expect(tables).toContain("ORDER_RELEASE");
  });

  it("returns nothing for empty query", () => {
    expect(searchTables(index26A, "  ")).toEqual([]);
    expect(searchColumns(index26A, "")).toEqual([]);
  });
});

describe("findJoinPaths", () => {
  it("SHIPMENT to LOCATION top path is via SHIPMENT_STOP", () => {
    const paths = findJoinPaths(index26A, "SHIPMENT", "LOCATION");
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].tables).toEqual(["SHIPMENT", "SHIPMENT_STOP", "LOCATION"]);
    expect(paths[0].hops).toBe(2);
    expect(paths[0].edges[0].condition).toBe("SS.SHIPMENT_GID = SH.SHIPMENT_GID");
    expect(paths[0].edges[1].condition).toBe("SS.LOCATION_GID = LOC.LOCATION_GID");
  });

  it("ranks fewer hops first, then alphabetically", () => {
    const paths = findJoinPaths(index26A, "SHIPMENT", "LOCATION", undefined, 5);
    const hops = paths.map((p) => p.hops);
    expect(hops).toEqual([...hops].sort((a, b) => a - b));
  });

  it("Via table forces an intermediate table", () => {
    const paths = findJoinPaths(index26A, "SHIPMENT", "LOCATION", "SHIPMENT_STOP");
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].tables).toContain("SHIPMENT_STOP");
  });

  it("direct hop when the FK exists", () => {
    const paths = findJoinPaths(index26A, "SHIPMENT_STOP", "SHIPMENT");
    expect(paths[0].hops).toBe(1);
    expect(paths[0].tables).toEqual(["SHIPMENT_STOP", "SHIPMENT"]);
  });

  it("returns empty for unknown tables", () => {
    expect(findJoinPaths(index26A, "NOPE", "LOCATION")).toEqual([]);
  });

  it("respects the 5-path limit", () => {
    const paths = findJoinPaths(index26A, "SHIPMENT", "SAVED_CONDITION");
    expect(paths.length).toBeLessThanOrEqual(5);
  });
});

describe("selectSql", () => {
  it("selects non-footprint columns with aliases", () => {
    const sql = selectSql(index26A.byTable.get("SHIPMENT_STOP")!);
    expect(sql).toContain("SELECT");
    expect(sql).toContain("SS.SHIPMENT_GID");
    expect(sql).toContain("FROM SHIPMENT_STOP SS");
    expect(sql).not.toContain("SS.INSERT_USER");
  });

  it("can include footprint columns", () => {
    const sql = selectSql(index26A.byTable.get("SHIPMENT_STOP")!, true);
    expect(sql).toContain("SS.INSERT_USER");
  });
});

describe("releases", () => {
  it("26C adds SHIPMENT.CARBON_EMISSION_KG and ORDER_RELEASE.DROPSHIP_INDICATOR", () => {
    const a = index26A.byTable.get("SHIPMENT")!.columns.map((c) => c.name);
    const c = index26C.byTable.get("SHIPMENT")!.columns.map((x) => x.name);
    expect(c).toContain("CARBON_EMISSION_KG");
    expect(a).not.toContain("CARBON_EMISSION_KG");
    expect(index26C.byTable.get("ORDER_RELEASE")!.columns.map((x) => x.name)).toContain(
      "DROPSHIP_INDICATOR",
    );
  });
});
