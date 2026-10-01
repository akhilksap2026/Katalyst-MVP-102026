import { ListChecks, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ListTool } from "@/components/list/list-tool";
import { useApp } from "@/state/app";

/**
 * List Utility tray — the same tool as /list in a 480px slide-over.
 * Content and options are shared with the page for the whole session.
 */
export function ListTray() {
  const { trayOpen, setTrayOpen } = useApp();

  return (
    <Sheet open={trayOpen} onOpenChange={setTrayOpen}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-4 text-primary" aria-hidden="true" />
            List Utility
          </SheetTitle>
          <SheetDescription className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            Processed in your browser — content never leaves this tab.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 py-4">
          <ListTool variant="tray" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
