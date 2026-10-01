/**
 * Local help assistant. Answers questions about the loaded comparison and about
 * the tool itself using keyword intents — no network, nothing leaves the browser.
 * ponytail: rule-based, not an LLM; swap `answer` for an API call if a backend is added.
 */
import { eventChanges, actionChanges, type AgentComparison, type CompareResult, type FieldDiff } from "./compare";

export interface Reply {
  text: string;
  suggestions: string[];
}

const GLOSSARY: { keys: RegExp; text: string }[] = [
  { keys: /footprint|insert_user|update_user|insert_date|audit col/, text: "Footprint columns (DOMAIN_NAME, INSERT_USER/DATE, UPDATE_USER/DATE) record who touched a row and when. They differ between environments by nature, so they're ignored by default. Turn that off under Options if you need them compared." },
  { keys: /\bxid\b|\bgid\b|match(ing)? (by|agents)/, text: "AGENT_XID is the agent's short name; AGENT_GID is domain + XID (e.g. KSAP.ORDER_AUTOBOOK). Matching by XID lets DEV and PROD agents pair up even when their domains differ; use GID when the domain matters. Change it under Options." },
  { keys: /moved|\bmove\b|flow|sequence/, text: "An action is 'moved' when it exists on both sides but its ACTION_FLOW or ACTION_SEQUENCE changed, i.e. it runs in a different order or branch." },
  { keys: /reentran/, text: "REENTRANCY_LEVEL controls whether an agent can fire again while it is already running (AGENT, THREAD or SYSTEM level)." },
  { keys: /saved condition|saved query|reference/, text: "Saved conditions and saved queries are objects an agent points to. The References section lists them per side; a highlighted chip means the other environment doesn't reference the same one." },
  { keys: /db\.?xml|xml|csv|format|file type|which file/, text: "Supported inputs: OTM CSV exports (AGENT, AGENT_EVENT_DETAILS, AGENT_ACTION_DETAILS, in any order), plain CSV with a header row, or one DB.XML transmission set. You can drop files, or paste text." },
  { keys: /privacy|upload|secure|safe|server|sent|private/, text: "Everything is processed in your browser. Files and pasted text are never uploaded, and this assistant runs locally too." },
  { keys: /export|download|excel|share|report/, text: "After comparing, use CSV or Excel (top right of the results) to export every difference, or 'Copy summary' for a short text you can paste into a ticket or email." },
  { keys: /shortcut|keyboard|hotkey/, text: "In results, J / K jump between changes. Press ? anywhere for all shortcuts, Ctrl/Cmd+K for search." },
  { keys: /whitespace|case.insens|ignore/, text: "Options let you ignore footprint columns, whitespace-only differences in parameters, and letter case in IDs. They change what counts as a difference, so re-run Compare after changing them." },
  { keys: /duplicate|skipped|same key/, text: "If two agents in one source share the same match key (e.g. the same XID in two domains), only the first is compared and a warning lists the rest. Matching by GID usually resolves it." },
  { keys: /warning|unrecognis|orphan|unknown column/, text: "Warnings flag input problems: unknown columns, rows whose agent isn't in the AGENT file (orphans), or unterminated quotes. Compare still runs; the affected rows may be skipped." },
];

const HOWTO =
  "To compare: 1) add the files (or paste text) for Source A and Source B, or click 'Try sample data'; 2) press Compare. Review changed agents in the list, open one to see header, event and action differences, then export if needed.";

const trunc = (s: string | null, n = 70) => {
  const v = (s ?? "—").replace(/\s+/g, " ").trim();
  return v.length > n ? v.slice(0, n - 1) + "…" : v || "—";
};

const fd = (d: FieldDiff) => `${d.field}: ${trunc(d.valueA)} → ${trunc(d.valueB)}`;

function weight(c: AgentComparison) {
  return c.headerDiffs.length + eventChanges(c) + actionChanges(c);
}

function describeAgent(c: AgentComparison, a: string, b: string): string {
  if (c.status === "only-a") return `${c.xid} exists only in ${a}. It has ${c.agentA!.events.length} event(s) and ${c.agentA!.actions.length} action(s) that ${b} lacks.`;
  if (c.status === "only-b") return `${c.xid} exists only in ${b}. It has ${c.agentB!.events.length} event(s) and ${c.agentB!.actions.length} action(s) that ${a} lacks.`;
  if (c.status === "identical") return `${c.xid} is identical in ${a} and ${b} under the current options.`;
  const lines = [`${c.xid} differs between ${a} and ${b}:`];
  for (const d of c.headerDiffs) lines.push(`• Header ${fd(d)}`);
  for (const e of c.eventDiffs.filter((x) => x.status !== "identical"))
    lines.push(`• Event ${e.eventGid} (${e.status}): ${e.fields.map(fd).join("; ")}`);
  for (const x of c.actionDiffs.filter((y) => y.status !== "identical")) {
    const where = x.status === "moved" ? ` moved F${x.flowA}/S${x.sequenceA} → F${x.flowB}/S${x.sequenceB}` : "";
    lines.push(`• Action ${x.actionGid} ${x.status}${where}${x.status === "changed" ? ": " + x.fields.map(fd).join("; ") : ""}`);
  }
  return lines.join("\n");
}

export function suggestionsFor(r: CompareResult | null): string[] {
  if (!r) return ["How do I start?", "What is footprint?", "XID or GID?", "Is my data uploaded?"];
  const top = [...r.agents].filter((a) => a.status === "changed").sort((x, y) => weight(y) - weight(x))[0];
  return [
    "Give me a summary",
    `Which agents are only in ${r.labelA}?`,
    ...(top ? [`What changed in ${top.xid}?`] : []),
    "How do I export this?",
  ];
}

export function answer(question: string, r: CompareResult | null): Reply {
  const q = question.toLowerCase().trim();
  const suggestions = suggestionsFor(r);
  if (!q) return { text: "Ask me about your comparison, or how any part of the tool works.", suggestions };

  if (r) {
    const hit = r.agents.find((a) => {
      const x = a.xid.toLowerCase();
      return q.includes(x) || q.includes(x.replace(/_/g, " "));
    });
    if (hit) return { text: describeAgent(hit, r.labelA, r.labelB), suggestions };
  }

  const resultsIntent = /summary|overview|what (has |have )?changed|which agents|differen|\bdiff\b|only|missing|identical|unchanged|how many|count|biggest|most|risk/.test(q);
  const g = GLOSSARY.find((e) => e.keys.test(q));
  if (g && !resultsIntent) return { text: g.text, suggestions };

  if (!resultsIntent && /how (do|can|to)|start|begin|use this|help/.test(q)) return { text: HOWTO, suggestions };

  if (resultsIntent) {
    if (!r) return { text: "There's no comparison yet. " + HOWTO, suggestions };
    const { counts, labelA, labelB } = r;
    const list = (xs: AgentComparison[]) => (xs.length ? xs.map((a) => a.xid).join(", ") : "none");
    const by = (s: AgentComparison["status"]) => r.agents.filter((a) => a.status === s);
    const wantsA = q.includes(labelA.toLowerCase());
    const wantsB = q.includes(labelB.toLowerCase());
    if (/only|missing/.test(q)) {
      const parts: string[] = [];
      if (!wantsB || wantsA) parts.push(`Only in ${labelA}: ${list(by("only-a"))}`);
      if (!wantsA || wantsB) parts.push(`Only in ${labelB}: ${list(by("only-b"))}`);
      return { text: parts.join("\n"), suggestions };
    }
    if (/identical|unchanged/.test(q)) return { text: `Identical (${counts.identical}): ${list(by("identical"))}`, suggestions };
    if (/biggest|most|risk/.test(q)) {
      const top = [...by("changed")].sort((x, y) => weight(y) - weight(x))[0];
      return { text: top ? `Largest change set: ${top.xid} (${weight(top)} differences).\n\n${describeAgent(top, labelA, labelB)}` : "No agent has changed fields.", suggestions };
    }
    if (/how many|count/.test(q)) return { text: `${r.agents.length} agents compared: ${counts.changed} changed, ${counts.onlyA} only in ${labelA}, ${counts.onlyB} only in ${labelB}, ${counts.identical} identical.`, suggestions };
    const lines = [`${counts.differences} of ${r.agents.length} agents differ (${labelA} vs ${labelB}).`];
    for (const a of r.agents.filter((x) => x.status !== "identical")) {
      lines.push(`• ${a.xid}: ${a.status === "only-a" ? `only in ${labelA}` : a.status === "only-b" ? `only in ${labelB}` : `${a.headerDiffs.length} header, ${eventChanges(a)} event, ${actionChanges(a)} action change(s)`}`);
    }
    return { text: lines.join("\n"), suggestions };
  }

  return {
    text: "I can explain your comparison (summary, which agents changed or are missing, what changed in a named agent) and how the tool works (formats, matching, options, export, privacy). Try one of the suggestions below.",
    suggestions,
  };
}
