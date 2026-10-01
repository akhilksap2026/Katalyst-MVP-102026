import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ksap-cloud-ui/components/ui/alert";
import { Skeleton } from "@workspace/ksap-cloud-ui/components/ui/skeleton";
import { cn } from "@workspace/ksap-cloud-ui/lib/utils";

/**
 * Error state and loading skeleton for the tools. Empty states use the package
 * EmptyStateContent pattern directly. Loading uses skeleton rows, never spinners.
 */

const ROW_WIDTHS = ["w-full", "w-3/4", "w-1/2"] as const;

export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("grid gap-2", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("h-control", ROW_WIDTHS[i % ROW_WIDTHS.length])} />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  /** What happened, in plain language, and what to do next. */
  body?: string;
  action?: ReactNode;
  testId?: string;
}

export function ErrorState({ title, body, action, testId }: ErrorStateProps) {
  return (
    <Alert variant="error" data-testid={testId ?? "state-error"}>
      <AlertTitle>{title}</AlertTitle>
      {body && <AlertDescription>{body}</AlertDescription>}
      {action}
    </Alert>
  );
}
