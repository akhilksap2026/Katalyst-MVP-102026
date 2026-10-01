import { describe, expect, it } from "vitest";
import { DEFAULT_COMPARE_OPTIONS, buildSource } from "@/lib/agents";
import { compareSources } from "@/lib/compare";
import { answer } from "@/lib/assistant";
import a1 from "@/data/agents/DEV/AGENT.csv?raw";
import a2 from "@/data/agents/DEV/AGENT_EVENT_DETAILS.csv?raw";
import a3 from "@/data/agents/DEV/AGENT_ACTION_DETAILS.csv?raw";
import b1 from "@/data/agents/PROD/AGENT.csv?raw";
import b2 from "@/data/agents/PROD/AGENT_EVENT_DETAILS.csv?raw";
import b3 from "@/data/agents/PROD/AGENT_ACTION_DETAILS.csv?raw";

const src = (l: string, t: string[]) => buildSource(l, t.map((text, i) => ({ name: `${i}.csv`, text })));
const r = compareSources(src("DEV", [a1, a2, a3]), src("PROD", [b1, b2, b3]), DEFAULT_COMPARE_OPTIONS);

describe("assistant", () => {
  it("summarises and names agents", () => {
    expect(answer("give me a summary", r).text).toContain("3 of 6 agents differ");
    expect(answer("what changed in carrier perf weekly?", r).text).toContain("DAY=MON");
    expect(answer("which agents are only in PROD?", r).text).toContain("EDI_997_RETRY");
  });
  it("explains terms and guides without a comparison", () => {
    expect(answer("what is footprint", null).text).toContain("INSERT_USER");
    expect(answer("how do I start", null).text).toContain("Compare");
    expect(answer("summary", null).text).toContain("no comparison yet");
  });
});
