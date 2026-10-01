import { useTranslation } from "react-i18next";
import { Info, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ksap-cloud-ui/components/ui/dialog";
import { dictionaryManifest } from "@/lib/dictionary";
import { APP_VERSION } from "@/lib/version";
import { useApp } from "@/state/app";

export function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation();
  const { release } = useApp();
  const current = dictionaryManifest.releases.find((r) => r.id === release);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="about-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="size-icon-sm text-primary" aria-hidden="true" />
            {t("aboutDialog.aboutCatalyst")}
          </DialogTitle>
          <DialogDescription>{t("aboutDialog.consultantToolkitForOtm")}</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3 rounded-lg border bg-muted/40 p-4 text-body">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{t("aboutDialog.version")}</dt>
            <dd className="font-mono" data-testid="about-version">
              {APP_VERSION}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{t("aboutDialog.dictionaryRelease")}</dt>
            <dd className="font-mono" data-testid="about-release">
              {release}
              {current ? ` · ${current.status}` : ""}
            </dd>
          </div>
        </dl>
        <section aria-label={t("aboutDialog.privacyStatement")} className="grid gap-2">
          <h3 className="flex items-center gap-2 text-body font-semibold">
            <ShieldCheck className="size-icon-sm text-primary" aria-hidden="true" />
            {t("aboutDialog.privacyStatement")}
          </h3>
          <p className="text-body leading-6 text-muted-foreground">
            {t("aboutDialog.everythingYouPasteOr")}{" "}<span className="font-mono">{t("aboutDialog.listCopied")}</span>{t("aboutDialog.yourDataLeavesThis")}
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
