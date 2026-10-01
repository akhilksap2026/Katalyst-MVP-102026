/** Bundled release JSON, keyed by release id (sample data — replace with KSAP data). */
import raw26A from "@/data/dictionary/26A.json";
import raw26C from "@/data/dictionary/26C.json";

export const RELEASE_DATA: Record<string, unknown> = {
  "26A": raw26A,
  "26C": raw26C,
};
