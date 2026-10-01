import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/** Catalyst wordmark: a small teal spark plus the name in Inter 600. */
export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex h-9 items-center gap-2 overflow-hidden">
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"
      >
        <Zap className="size-4" strokeWidth={2.25} />
      </span>
      <span
        className={cn(
          "truncate text-[17px] font-semibold tracking-tight transition-opacity",
          collapsed && "sr-only",
        )}
      >
        Catalyst
      </span>
    </span>
  );
}
