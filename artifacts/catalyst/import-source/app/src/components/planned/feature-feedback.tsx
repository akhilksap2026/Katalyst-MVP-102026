import { useState } from "react";
import { MessageSquareHeart, Send } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * "How would you use this?" feedback box. The V1 prototype is connectionless,
 * so the Send button only acknowledges the input — nothing is transmitted.
 */
export function FeatureFeedback({ title }: { title: string }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setText("");
    track("feedback_sent");
    toast.success("Thank you for the feedback", {
      description: `"${title}" is still being scoped — your note helps prioritise it. Nothing was sent anywhere.`,
    });
  };

  return (
    <section aria-label="Feedback" className="grid gap-2">
      <Label htmlFor={`feedback-${title}`} className="flex items-center gap-1.5 text-sm font-medium">
        <MessageSquareHeart className="size-4 text-muted-foreground" aria-hidden="true" />
        How would you use this?
      </Label>
      <Textarea
        id={`feedback-${title}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe your use case — what data you would bring, and what you want back…"
        className="min-h-20"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-muted-foreground">
          The prototype sends nothing over the network; this is just a note to yourself.
        </p>
        <Button size="sm" onClick={send} disabled={!text.trim()} data-testid="planned-feedback-send">
          <Send className="size-3.5" aria-hidden="true" />
          Send
        </Button>
      </div>
    </section>
  );
}
