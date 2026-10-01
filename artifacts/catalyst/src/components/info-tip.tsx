import { HelpCircle, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Small "?" button that opens an explanation; optionally hands a question to the assistant. */
export function InfoTip({ text, ask, label = "More information" }: { text: string; ask?: string; label?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-grid size-5 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HelpCircle className="size-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm" side="top">
        <p>{text}</p>
        {ask && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("catalyst:ask", { detail: ask }))}
            className="mt-2 inline-flex items-center gap-1.5 text-caption font-medium text-primary hover:underline"
          >
            <MessageCircle className="size-3.5" aria-hidden="true" /> Ask the assistant
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
