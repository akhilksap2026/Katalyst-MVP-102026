import { Info, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dictionaryManifest } from "@/lib/dictionary";
import { APP_VERSION } from "@/lib/version";
import { useApp } from "@/state/app";

export function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { release } = useApp();
  const current = dictionaryManifest.releases.find((r) => r.id === release);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="about-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="size-4 text-primary" aria-hidden="true" />
            About Catalyst
          </DialogTitle>
          <DialogDescription>Consultant toolkit for OTM — connectionless prototype.</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono" data-testid="about-version">
              {APP_VERSION}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Dictionary release</dt>
            <dd className="font-mono" data-testid="about-release">
              {release}
              {current ? ` · ${current.status}` : ""}
            </dd>
          </div>
        </dl>
        <section aria-label="Privacy statement" className="grid gap-1.5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Privacy statement
          </h3>
          <p className="text-[13px] leading-6 text-muted-foreground">
            Everything you paste or upload is processed in your browser and never sent over the
            network. No content is stored, logged or shared — analytics record only anonymous
            event names and counts, such as <span className="font-mono">list_copied</span>. Your
            data leaves this page only if you copy or export it yourself.
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
