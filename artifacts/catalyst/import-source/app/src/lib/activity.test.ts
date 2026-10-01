import { beforeEach, describe, expect, it, vi } from "vitest";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}

vi.stubGlobal("window", { localStorage: new MemoryStorage() });

const { logActivity, readActivity, clearActivity } = await import("@/lib/activity");

describe("activity log", () => {
  beforeEach(() => clearActivity());

  it("records visits newest-first", () => {
    logActivity({ kind: "tool", label: "List Utility", href: "/list" });
    logActivity({ kind: "table", label: "SHIPMENT", href: "/dictionary/26A/SHIPMENT" });
    const items = readActivity();
    expect(items.map((i) => i.href)).toEqual(["/dictionary/26A/SHIPMENT", "/list"]);
  });

  it("moves a repeated entry to the top instead of duplicating", () => {
    logActivity({ kind: "tool", label: "List Utility", href: "/list" });
    logActivity({ kind: "tool", label: "Data Dictionary", href: "/dictionary" });
    logActivity({ kind: "tool", label: "List Utility", href: "/list" });
    const items = readActivity();
    expect(items).toHaveLength(2);
    expect(items[0].href).toBe("/list");
  });

  it("limits readActivity to 5 by default", () => {
    for (let i = 0; i < 8; i++) {
      logActivity({ kind: "table", label: `T${i}`, href: `/dictionary/26A/T${i}` });
    }
    expect(readActivity()).toHaveLength(5);
    expect(readActivity(3)).toHaveLength(3);
  });
});
