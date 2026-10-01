import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { readStorage, writeStorage } from "@/lib/storage";

const STEPS = [
  { target: '[data-tour="drop"]', title: "1. Drop everything here", body: "Drop all your agent files at once, from both environments. Catalyst sorts them into Source A and Source B by file name and table." },
  { target: '[data-tour="sources"]', title: "2. Check each side", body: "Each source shows what was found. Rename the labels (DEV, PROD…), add or remove files, or paste text. Use Swap if the sides came out the wrong way round." },
  { target: '[data-tour="compare"]', title: "3. Compare", body: "When both sides have agents, press Compare. Your labels and options are remembered for next time; your files never are." },
  { target: 'button[aria-label="Open assistant"]', title: "4. Ask for help", body: "Stuck on a term or want a summary of the differences? The assistant answers from your comparison. Look for the ? icons for quick explanations." },
];

const KEY = "agents.tourDone";

/** First-run walkthrough. Re-run any time with the `catalyst:tour` window event. */
export function Tour() {
  const [step, setStep] = useState<number | null>(() => (readStorage(KEY, false) ? null : 0));

  useEffect(() => {
    const start = () => setStep(0);
    window.addEventListener("catalyst:tour", start);
    return () => window.removeEventListener("catalyst:tour", start);
  }, []);

  useEffect(() => {
    if (step === null) return;
    const el = document.querySelector<HTMLElement>(STEPS[step].target);
    if (!el) return;
    const prev = el.style.cssText;
    el.style.outline = "2px solid var(--color-primary, #0d9488)";
    el.style.outlineOffset = "4px";
    el.style.borderRadius = "12px";
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    return () => {
      el.style.cssText = prev;
    };
  }, [step]);

  if (step === null) return null;
  const s = STEPS[step];
  const done = () => {
    writeStorage(KEY, true);
    setStep(null);
  };
  return (
    <div
      role="dialog"
      aria-label="Guided tour"
      className="fixed bottom-20 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border bg-popover p-4 text-popover-foreground shadow-xl"
    >
      <p className="text-sm font-semibold">{s.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-caption text-muted-foreground">
          {step + 1} / {STEPS.length}
        </span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={done}>
          Skip
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="sm" onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : (
          <Button size="sm" onClick={done}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
