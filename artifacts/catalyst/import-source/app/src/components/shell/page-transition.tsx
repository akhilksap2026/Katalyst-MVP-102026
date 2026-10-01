import { Suspense, ViewTransition } from "react";
import { Outlet, useLocation } from "react-router";
import { SkeletonRows } from "@/components/state-block";

const ENTER = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-in" };
const EXIT = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-out" };

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10" role="status" aria-label="Loading page">
      <div className="mb-6 h-7 w-56 animate-pulse rounded-md bg-muted" />
      <SkeletonRows rows={6} />
    </div>
  );
}

/**
 * Page-level transition. Keyed by pathname so every route change (including
 * /dictionary/:release/:table → another table) exits the old page and enters the new one.
 * Hierarchical moves carry a direction type (see useGo); everything else fades.
 * Lazy routes suspend here, and the skeleton → page reveal slides up.
 */
export function PageTransition() {
  const { pathname } = useLocation();
  return (
    <ViewTransition key={pathname} enter={ENTER} exit={EXIT} default="none">
      <Suspense
        fallback={
          <ViewTransition exit="slide-down">
            <PageSkeleton />
          </ViewTransition>
        }
      >
        <ViewTransition enter="slide-up" default="none">
          <Outlet />
        </ViewTransition>
      </Suspense>
    </ViewTransition>
  );
}
