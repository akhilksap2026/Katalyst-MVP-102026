/**
 * Content-free analytics stub.
 *
 * Logs only event names and numeric counts (e.g. "list_copied", or
 * "agents_compared { agents: 5 }") to the console as [catalyst] lines.
 * Never log pasted text, file names, GIDs, queries, or any user content —
 * only the fact that something happened and how many items were involved.
 */

export interface AnalyticsEvent {
  name: string;
  count?: number;
  detail?: Record<string, number | boolean | string>;
}

export function track(
  name: string,
  count?: number,
  detail?: Record<string, number | boolean | string>,
): void {
  const parts: string[] = [`[catalyst] ${name}`];
  if (typeof count === "number") parts.push(`count=${count}`);
  if (detail) {
    for (const [k, v] of Object.entries(detail)) parts.push(`${k}=${String(v)}`);
  }
  // Console only. A production build would forward these lines to a
  // privacy-preserving backend; the prototype never sends anything.
  console.info(parts.join(" "));
}
