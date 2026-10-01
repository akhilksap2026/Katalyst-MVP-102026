import i18n from "@/i18n";

/** Translate a key from the catalyst namespace; used by processing code that returns presentation text. */
export function tr(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options) as string;
}
