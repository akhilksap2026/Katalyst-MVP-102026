import { cn } from "@workspace/ksap-cloud-ui/lib/utils";

const BRAND = "Catalyst";

/** Catalyst name as a plain-text mark. No official Catalyst logo was supplied, so none is drawn. */
export function Wordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className={cn("flex h-control items-center text-heading font-semibold text-foreground", collapsed && "sr-only")}>
      {BRAND}
    </span>
  );
}
