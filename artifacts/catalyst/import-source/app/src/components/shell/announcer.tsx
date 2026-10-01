import { useEffect, useRef, useState } from "react";

/**
 * Global aria-live announcer. Components call `announce()` to surface
 * copy/export/count results to screen-reader users through a single
 * visually-hidden polite region.
 */

type AnnounceFn = (message: string) => void;

let listener: AnnounceFn | null = null;

export function announce(message: string): void {
  listener?.(message);
}

export function Announcer() {
  const [message, setMessage] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    listener = (m: string) => {
      // Clear first so repeated identical messages re-announce.
      window.clearTimeout(timer.current);
      setMessage("");
      timer.current = window.setTimeout(() => setMessage(m), 30);
    };
    return () => {
      listener = null;
      window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div aria-live="polite" role="status" className="sr-only" data-testid="announcer">
      {message}
    </div>
  );
}
