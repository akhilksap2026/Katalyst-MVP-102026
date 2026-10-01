const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** "just now", "12 minutes ago", "3 hours ago", "2 days ago". */
export function relativeTime(from: number, now: number = Date.now(), locale?: string, justNow = "just now"): string {
  const diff = now - from;
  if (diff < MINUTE) return justNow;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diff < HOUR) return rtf.format(-Math.round(diff / MINUTE), "minute");
  if (diff < DAY) return rtf.format(-Math.round(diff / HOUR), "hour");
  return rtf.format(-Math.round(diff / DAY), "day");
}
