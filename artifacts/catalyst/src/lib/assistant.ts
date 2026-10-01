/**
 * Local help assistant. Answers questions about the loaded comparison and about
 * the tool itself using keyword intents — no network, nothing leaves the browser.
 * ponytail: rule-based, not an LLM; swap `answer` for an API call if a backend is added.
 */
import { tr } from "@/lib/tr";
import { eventChanges, actionChanges, type AgentComparison, type CompareResult, type FieldDiff } from "./compare";

export interface Reply {
  text: string;
  suggestions: string[];
}

const GLOSSARY: { keys: RegExp; key: string }[] = [
  { keys: /footprint|insert_user|update_user|insert_date|audit col/, key: "assistantReply.glossary.footprint" },
  { keys: /\bxid\b|\bgid\b|match(ing)? (by|agents)/, key: "assistantReply.glossary.xid" },
  { keys: /moved|\bmove\b|flow|sequence/, key: "assistantReply.glossary.moved" },
  { keys: /reentran/, key: "assistantReply.glossary.reentrancy" },
  { keys: /saved condition|saved query|reference/, key: "assistantReply.glossary.references" },
  { keys: /db\.?xml|xml|csv|format|file type|which file/, key: "assistantReply.glossary.formats" },
  { keys: /privacy|upload|secure|safe|server|sent|private/, key: "assistantReply.glossary.privacy" },
  { keys: /export|download|excel|share|report/, key: "assistantReply.glossary.export" },
  { keys: /shortcut|keyboard|hotkey/, key: "assistantReply.glossary.shortcuts" },
  { keys: /whitespace|case.insens|ignore/, key: "assistantReply.glossary.options" },
  { keys: /duplicate|skipped|same key/, key: "assistantReply.glossary.duplicates" },
  { keys: /warning|unrecognis|orphan|unknown column/, key: "assistantReply.glossary.warnings" },
];

const howto = () => tr("assistantReply.howto");

const trunc = (s: string | null, n = 70) => {
  const v = (s ?? "—").replace(/\s+/g, " ").trim();
  return v.length > n ? v.slice(0, n - 1) + "…" : v || "—";
};

const fd = (d: FieldDiff) => `${d.field}: ${trunc(d.valueA)} → ${trunc(d.valueB)}`;

function weight(c: AgentComparison) {
  return c.headerDiffs.length + eventChanges(c) + actionChanges(c);
}

function describeAgent(c: AgentComparison, a: string, b: string): string {
  if (c.status === "only-a") return tr("assistantReply.onlyIn", { xid: c.xid, has: a, lacks: b, events: c.agentA!.events.length, actions: c.agentA!.actions.length });
  if (c.status === "only-b") return tr("assistantReply.onlyIn", { xid: c.xid, has: b, lacks: a, events: c.agentB!.events.length, actions: c.agentB!.actions.length });
  if (c.status === "identical") return tr("assistantReply.identicalIn", { xid: c.xid, a, b });
  const lines = [tr("assistantReply.differsBetween", { xid: c.xid, a, b })];
  for (const d of c.headerDiffs) lines.push(tr("assistantReply.headerLine", { diff: fd(d) }));
  for (const e of c.eventDiffs.filter((x) => x.status !== "identical"))
    lines.push(tr("assistantReply.eventLine", { gid: e.eventGid, status: e.status, fields: e.fields.map(fd).join("; ") }));
  for (const x of c.actionDiffs.filter((y) => y.status !== "identical")) {
    const where = x.status === "moved" ? tr("assistantReply.movedWhere", { flowA: x.flowA, sequenceA: x.sequenceA, flowB: x.flowB, sequenceB: x.sequenceB }) : "";
    const detail = x.status === "changed" ? tr("assistantReply.actionDetail", { fields: x.fields.map(fd).join("; ") }) : "";
    lines.push(tr("assistantReply.actionLine", { gid: x.actionGid, status: x.status, where, detail }));
  }
  return lines.join("\n");
}

export function suggestionsFor(r: CompareResult | null): string[] {
  if (!r) return [tr("assistantReply.suggest.start"), tr("assistantReply.suggest.footprint"), tr("assistantReply.suggest.xid"), tr("assistantReply.suggest.uploaded")];
  const top = [...r.agents].filter((a) => a.status === "changed").sort((x, y) => weight(y) - weight(x))[0];
  return [
    tr("assistantReply.suggest.summary"),
    tr("assistantReply.suggest.onlyIn", { label: r.labelA }),
    ...(top ? [tr("assistantReply.suggest.changedIn", { xid: top.xid })] : []),
    tr("assistantReply.suggest.export"),
  ];
}

export function answer(question: string, r: CompareResult | null): Reply {
  const q = question.toLowerCase().trim();
  const suggestions = suggestionsFor(r);
  if (!q) return { text: tr("assistantReply.empty"), suggestions };

  if (r) {
    const hit = r.agents.find((a) => {
      const x = a.xid.toLowerCase();
      return q.includes(x) || q.includes(x.replace(/_/g, " "));
    });
    if (hit) return { text: describeAgent(hit, r.labelA, r.labelB), suggestions };
  }

  const resultsIntent = /summary|overview|what (has |have )?changed|which agents|differen|\bdiff\b|only|missing|identical|unchanged|how many|count|biggest|most|risk/.test(q);
  const g = GLOSSARY.find((e) => e.keys.test(q));
  if (g && !resultsIntent) return { text: tr(g.key), suggestions };

  if (!resultsIntent && /how (do|can|to)|start|begin|use this|help/.test(q)) return { text: howto(), suggestions };

  if (resultsIntent) {
    if (!r) return { text: tr("assistantReply.noComparison", { howto: howto() }), suggestions };
    const { counts, labelA, labelB } = r;
    const list = (xs: AgentComparison[]) => (xs.length ? xs.map((a) => a.xid).join(", ") : tr("assistantReply.none"));
    const by = (s: AgentComparison["status"]) => r.agents.filter((a) => a.status === s);
    const wantsA = q.includes(labelA.toLowerCase());
    const wantsB = q.includes(labelB.toLowerCase());
    if (/only|missing/.test(q)) {
      const parts: string[] = [];
      if (!wantsB || wantsA) parts.push(tr("assistantReply.onlyInList", { label: labelA, list: list(by("only-a")) }));
      if (!wantsA || wantsB) parts.push(tr("assistantReply.onlyInList", { label: labelB, list: list(by("only-b")) }));
      return { text: parts.join("\n"), suggestions };
    }
    if (/identical|unchanged/.test(q)) return { text: tr("assistantReply.identicalList", { count: counts.identical, list: list(by("identical")) }), suggestions };
    if (/biggest|most|risk/.test(q)) {
      const top = [...by("changed")].sort((x, y) => weight(y) - weight(x))[0];
      return { text: top ? tr("assistantReply.largest", { xid: top.xid, count: weight(top), detail: describeAgent(top, labelA, labelB) }) : tr("assistantReply.noChanged"), suggestions };
    }
    if (/how many|count/.test(q)) return { text: tr("assistantReply.howMany", { total: r.agents.length, changed: counts.changed, onlyA: counts.onlyA, labelA, onlyB: counts.onlyB, labelB, identical: counts.identical }), suggestions };
    const lines = [tr("assistantReply.differ", { differences: counts.differences, total: r.agents.length, labelA, labelB })];
    for (const a of r.agents.filter((x) => x.status !== "identical")) {
      const what =
        a.status === "only-a"
          ? tr("assistantReply.onlyInShort", { label: labelA })
          : a.status === "only-b"
            ? tr("assistantReply.onlyInShort", { label: labelB })
            : tr("assistantReply.changeCounts", { header: a.headerDiffs.length, events: eventChanges(a), actions: actionChanges(a) });
      lines.push(tr("assistantReply.agentLine", { xid: a.xid, what }));
    }
    return { text: lines.join("\n"), suggestions };
  }

  return {
    text: tr("assistantReply.fallback"),
    suggestions,
  };
}
