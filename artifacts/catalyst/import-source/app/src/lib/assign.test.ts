import { describe, expect, it } from "vitest";
import { autoAssign } from "@/lib/assign";

const agent = "AGENT_GID,AGENT_XID\nX.A,A\n";
const events = "AGENT_GID,AGENT_EVENT_GID,AGENT_EVENT_PARAMETERS\nX.A,E,p\n";
const f = (name: string, text: string) => ({ name, text });

describe("autoAssign", () => {
  it("uses labels in file names", () => {
    const r = autoAssign([f("AGENT_prod.csv", agent), f("AGENT_dev.csv", agent)], "DEV", "PROD");
    expect(r.a.map((x) => x.name)).toEqual(["AGENT_dev.csv"]);
    expect(r.b.map((x) => x.name)).toEqual(["AGENT_prod.csv"]);
  });
  it("splits repeated tables one per side when names give no hint", () => {
    const r = autoAssign([f("1.csv", agent), f("2.csv", events), f("3.csv", agent), f("4.csv", events)], "DEV", "PROD");
    expect(r.a.map((x) => x.name)).toEqual(["1.csv", "2.csv"]);
    expect(r.b.map((x) => x.name)).toEqual(["3.csv", "4.csv"]);
  });
  it("accounts for files already loaded", () => {
    const r = autoAssign([f("x.csv", agent)], "DEV", "PROD", [f("AGENT.csv", agent)], []);
    expect(r.b).toHaveLength(1);
  });
});
