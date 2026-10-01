import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { readStorage, writeStorage } from "@/lib/storage";

const STEPS = [
  { target: '[data-tour="drop"]', id: "s0" },
  { target: '[data-tour="sources"]', id: "s1" },
  { target: '[data-tour="compare"]', id: "s2" },
  { target: '[data-tour="assistant"]', id: "s3" },
];

const KEY = "agents.tourDone";

/** First-run walkthrough. Re-run any time with the `catalyst:tour` window event. */
export function Tour() {
  const { t } = useTranslation();
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
    el.classList.add("outline-2", "outline-offset-4", "outline-ring", "rounded-lg");
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    return () => {
      el.classList.remove("outline-2", "outline-offset-4", "outline-ring", "rounded-lg");
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
      aria-label={t("tour.guidedTour")}
      className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sheet rounded-lg border bg-popover p-4 text-popover-foreground shadow-overlay"
    >
      <p className="text-body font-semibold">{t(`tour.steps.${s.id}.title`)}</p>
      <p className="mt-1 text-body text-muted-foreground">{t(`tour.steps.${s.id}.body`)}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-caption text-muted-foreground">
          {step + 1} / {STEPS.length}
        </span>
        <Button variant="ghost" size="sm" className="ms-auto" onClick={done}>
          {t("tour.skip")}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="sm" onClick={() => setStep(step + 1)}>
            {t("tour.next")}
          </Button>
        ) : (
          <Button size="sm" onClick={done}>
            {t("tour.done")}
          </Button>
        )}
      </div>
    </div>
  );
}
