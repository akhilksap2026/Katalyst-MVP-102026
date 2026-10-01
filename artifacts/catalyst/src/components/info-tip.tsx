import { useTranslation } from "react-i18next";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ksap-cloud-ui/components/ui/popover";

/** Small "?" button that opens an explanation; optionally hands a question to the assistant. */
export function InfoTip({ text, ask, label }: { text: string; ask?: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label ?? t("infoTip.moreInformation")}
          className="inline-grid size-5 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HelpCircle className="size-icon-sm" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-body" side="top">
        <p>{text}</p>
        {ask && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("catalyst:ask", { detail: ask }))}
            className="mt-2 inline-flex items-center gap-2 text-caption font-semibold text-primary-ink hover:underline"
          >
            <MessageCircle className="size-icon-sm" aria-hidden="true" />{" "}{t("infoTip.askTheAssistant")}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
