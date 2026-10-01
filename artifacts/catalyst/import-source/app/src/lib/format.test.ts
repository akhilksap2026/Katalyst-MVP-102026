import { describe, expect, it } from "vitest";
import { relativeTime } from "@/lib/format";

describe("relativeTime", () => {
  const now = 1_800_000_000_000;
  it("shows just now under a minute", () => {
    expect(relativeTime(now - 30_000, now)).toBe("just now");
  });
  it("shows minutes, hours and days", () => {
    expect(relativeTime(now - 5 * 60_000, now)).toBe("5 minutes ago");
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe("3 hours ago");
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe("2 days ago");
  });
});
