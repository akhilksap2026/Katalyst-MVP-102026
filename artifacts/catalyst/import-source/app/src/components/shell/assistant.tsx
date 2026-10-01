import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { answer, suggestionsFor } from "@/lib/assistant";
import { useAssistantResult } from "@/lib/assistant-store";
import { cn } from "@/lib/utils";

interface Msg {
  from: "user" | "bot";
  text: string;
}

const WELCOME: Msg = {
  from: "bot",
  text: "Hi! I can explain your comparison or how Catalyst works. I run entirely in your browser, so nothing you load is sent anywhere.",
};

export function Assistant() {
  const result = useAssistantResult();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
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
      <Button
        onClick={() => setOpen(true)}
        aria-label="Open assistant"
        style={{ viewTransitionName: "assistant-fab" }}
        className="fixed right-5 bottom-5 z-40 h-11 gap-2 rounded-full px-4 shadow-lg"
      >
        <Bot className="size-5" aria-hidden="true" /> Ask
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" /> Assistant
            </SheetTitle>
            <SheetDescription>
              {result ? `Aware of your ${result.labelA} vs ${result.labelB} comparison.` : "Ask how anything works."}
            </SheetDescription>
          </SheetHeader>
          <div ref={logRef} className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.from === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {suggestionsFor(result).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border px-2.5 py-1 text-caption hover:bg-accent"
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
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" aria-label="Ask the assistant" />
            <Button type="submit" size="icon" aria-label="Send">
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
