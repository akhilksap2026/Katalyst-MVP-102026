import { addTransitionType, startTransition, useCallback } from "react";
import { useNavigate } from "@/lib/router";

export type NavType = "nav-forward" | "nav-back";

/** Navigate inside a transition, tagging direction so page transitions can slide forward/back. */
export function useGo() {
  const navigate = useNavigate();
  return useCallback(
    (to: string, type?: NavType) => {
      startTransition(() => {
        if (type) addTransitionType(type);
        navigate(to);
      });
    },
    [navigate],
  );
}
