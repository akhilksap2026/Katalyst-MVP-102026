import { useEffect } from "react";
import { logActivity, type ActivityKind } from "@/lib/activity";

/** Log a page visit once on mount (used by tool pages and dictionary tables). */
export function useActivity(kind: ActivityKind, label: string, href: string) {
  useEffect(() => {
    logActivity({ kind, label, href });
  }, [kind, label, href]);
}
