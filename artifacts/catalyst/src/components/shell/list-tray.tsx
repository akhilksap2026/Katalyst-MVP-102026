import { useTranslation } from "react-i18next";
import { ListChecks, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ksap-cloud-ui/components/ui/sheet";
import { ListTool } from "@/components/list/list-tool";
import { useApp } from "@/state/app";

/**
 * List Utility tray — the same tool as /list in a 480px slide-over.
 * Content and options are shared with the page for the whole session.
 */
export function ListTray() {
  const { t } = useTranslation();
  const { trayOpen, setTrayOpen } = useApp();

  return (
    <Sheet open={trayOpen} onOpenChange={setTrayOpen}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-sheet">
        <SheetHeader className="border-b border-border px-4 py-3 text-start">
          <SheetTitle className="flex items-center gap-2 text-body">
            <ListChecks className="size-icon-sm text-primary" aria-hidden="true" />
            {t("listTray.listUtility")}
          </SheetTitle>
          <SheetDescription className="inline-flex items-center gap-2">
            <ShieldCheck className="size-icon-sm text-primary" aria-hidden="true" />
            {t("listTray.processedInYourBrowser")}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 py-4">
          <ListTool variant="tray" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
