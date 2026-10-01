import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Input } from "@workspace/ksap-cloud-ui/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@workspace/ksap-cloud-ui/components/ui/sheet";
import { answer, suggestionsFor } from "@/lib/assistant";
import { useAssistantResult } from "@/lib/assistant-store";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";

interface Msg {
  from: "user" | "bot";
  text: string;
}


export function Assistant() {
  const { t } = useTranslation();
  const result = useAssistantResult();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ from: "bot", text: t("assistant.welcome") }]);
  const logRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef(result);
  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    const reply = answer(text, resultRef.current);
    setMsgs((m) => [...m, { from: "user", text }, { from: "bot", text: reply.text }]);
    setInput("");
  };

  // InfoTip "Ask the assistant" links and any other part of the app can open it with a question.
  useEffect(() => {
    const onAsk = (e: Event) => {
      setOpen(true);
      ask(String((e as CustomEvent<string>).detail ?? ""));
    };
    window.addEventListener("catalyst:ask", onAsk);
    return () => window.removeEventListener("catalyst:ask", onAsk);
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  return (
    <>
      <div className="fixed end-4 bottom-4 z-40 pb-safe">
      <Button
        onClick={() => setOpen(true)}
        aria-label={t("assistant.openAssistant")}
        data-tour="assistant"
        className="gap-2 px-4"
      >
        <Bot className="size-icon-md" aria-hidden="true" />{" "}{t("assistant.ask")}
      </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full max-w-sheet flex-col gap-0">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-icon-sm text-primary" aria-hidden="true" />{" "}{t("assistant.assistant")}
            </SheetTitle>
            <SheetDescription>
              {result ? t("assistant.aware", { labelA: result.labelA, labelB: result.labelB }) : t("assistant.askHow")}
            </SheetDescription>
          </SheetHeader>
          <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-full rounded-lg px-3 py-2 text-body whitespace-pre-wrap",
                  m.from === "user" ? "ms-auto bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {suggestionsFor(result).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border px-3 py-1 text-caption hover:bg-accent"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("assistant.askAQuestion")} aria-label={t("assistant.askTheAssistant")} />
            <Button type="submit" size="icon" aria-label={t("assistant.send")}>
              <Send className="size-icon-sm" aria-hidden="true" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
