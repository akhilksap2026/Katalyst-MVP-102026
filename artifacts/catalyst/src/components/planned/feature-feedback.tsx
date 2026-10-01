import { useTranslation } from "react-i18next";
import { useState } from "react";
import { MessageSquareHeart, Send } from "lucide-react";
import { toast } from "@workspace/ksap-cloud-ui/components/ui/sonner";
import { track } from "@/lib/analytics";
import { Button } from "@workspace/ksap-cloud-ui/components/ui/button";
import { Label } from "@workspace/ksap-cloud-ui/components/ui/label";
import { Textarea } from "@workspace/ksap-cloud-ui/components/ui/textarea";

/**
 * "How would you use this?" feedback box. The V1 prototype is connectionless,
 * so the Send button only acknowledges the input — nothing is transmitted.
 */
export function FeatureFeedback({ title }: { title: string }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setText("");
    track("feedback_sent");
    toast.success(t("featureFeedback.thankYouForThe"), {
      description: t("featureFeedback.scoped", { title }),
    });
  };

  return (
    <section aria-label={t("featureFeedback.feedback")} className="grid gap-2">
      <Label htmlFor={`feedback-${title}`} className="flex items-center gap-2 text-body font-semibold">
        <MessageSquareHeart className="size-icon-sm text-muted-foreground" aria-hidden="true" />
        {t("featureFeedback.howWouldYouUse")}
      </Label>
      <Textarea
        id={`feedback-${title}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("featureFeedback.describeYourUseCase")}
        className="min-h-20"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-muted-foreground">
          {t("featureFeedback.thePrototypeSendsNothing")}
        </p>
        <Button size="sm" onClick={send} disabled={!text.trim()} data-testid="planned-feedback-send">
          <Send className="size-icon-sm" aria-hidden="true" />
          {t("featureFeedback.send")}
        </Button>
      </div>
    </section>
  );
}
