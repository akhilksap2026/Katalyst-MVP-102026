import { startTransition, useCallback } from "react";
import { useNavigate } from "@/lib/router";

export type NavType = "nav-forward" | "nav-back";

/** Navigate inside a supported React transition. */
export function useGo() {
  const navigate = useNavigate();
  return useCallback(
    (to: string, _type?: NavType) => {
      startTransition(() => {
        navigate(to);
      });
    },
    [navigate],
  );
}
