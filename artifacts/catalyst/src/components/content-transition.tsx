import type { ReactNode } from "react";

interface ContentTransitionProps {
  children: ReactNode;
  name?: string;
  share?: string;
  default?: string;
  enter?: string | Record<string, string>;
  exit?: string | Record<string, string>;
}

/**
 * Keep content and Suspense boundaries compatible with stable React.
 * The uploaded application used the canary-only ViewTransition component.
 */
export function ContentTransition({ children }: ContentTransitionProps) {
  return <>{children}</>;
}