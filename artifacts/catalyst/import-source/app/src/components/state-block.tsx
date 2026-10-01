import type { LucideIcon } from "lucide-react";
import { CircleAlert, Loader2, CheckCircle2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Consistent empty / loading / error / success states for every tool.
 * Loading uses skeleton rows, never spinners.
 */

export function SkeletonRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("grid gap-2", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-md bg-muted"
          style={{ width: `${88 - (i % 3) * 14}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3", className)} aria-hidden="true">
      <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

interface StateBlockProps {
  icon?: LucideIcon;
  title: string;
  /** What happened, in plain language, and what to do next. */
  body?: string;
  action?: React.ReactNode;
  testId?: string;
}

export function EmptyState({ icon = Inbox, title, body, action, testId }: StateBlockProps) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center"
      data-testid={testId ?? "state-empty"}
    >
      {(() => {
        const Icon = icon;
        return <Icon className="size-8 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />;
      })()}
      <div>
        <p className="text-sm font-medium">{title}</p>
        {body && <p className="mx-auto mt-1 max-w-md text-caption text-muted-foreground">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ title, body, action, testId }: StateBlockProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-5 py-4"
      data-testid={testId ?? "state-error"}
    >
      <div className="flex items-start gap-2.5">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          {body && <p className="mt-0.5 max-w-lg text-caption text-muted-foreground">{body}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SuccessState({ title, body, testId }: StateBlockProps) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-5 py-4"
      data-testid={testId ?? "state-success"}
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {body && <p className="mt-0.5 text-caption text-muted-foreground">{body}</p>}
      </div>
    </div>
  );
}

/** Small inline "working" indicator used while async file reads run. */
export function WorkingRow({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-caption text-muted-foreground" role="status">
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}
