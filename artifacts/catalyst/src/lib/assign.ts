import { sniffCsvTable } from "./agents";

export interface NamedText {
  name: string;
  text: string;
}

/** Which table a file carries; a DB.XML file carries everything, so it is its own kind. */
function kindOf(f: NamedText): string {
  const t = f.text.trimStart();
  if (t.startsWith("<")) return "xml";
  return sniffCsvTable(f.text)?.table ?? "?";
}

/**
 * Split a mixed batch of files into sources A and B.
 * 1) a file name containing one side's label (e.g. AGENT_prod.csv) goes to that side;
 * 2) otherwise fill the side that doesn't yet have that table (so two AGENT.csv land one each).
 * Ambiguous leftovers go to A; the user can Swap.
 */
export function autoAssign(
  files: NamedText[],
  labelA: string,
  labelB: string,
  existingA: NamedText[] = [],
  existingB: NamedText[] = [],
): { a: NamedText[]; b: NamedText[] } {
  const a: NamedText[] = [];
  const b: NamedText[] = [];
  const la = labelA.trim().toLowerCase();
  const lb = labelB.trim().toLowerCase();
  const kindsA = new Set(existingA.map(kindOf));
  const kindsB = new Set(existingB.map(kindOf));
  for (const f of files) {
    const name = f.name.toLowerCase();
    const hitA = !!la && name.includes(la);
    const hitB = !!lb && name.includes(lb);
    const k = kindOf(f);
    let side: "a" | "b";
    if (hitA !== hitB) side = hitA ? "a" : "b";
    else if (!kindsA.has(k)) side = "a";
    else if (!kindsB.has(k)) side = "b";
    else side = "a";
    (side === "a" ? a : b).push(f);
    (side === "a" ? kindsA : kindsB).add(k);
  }
  return { a, b };
}
