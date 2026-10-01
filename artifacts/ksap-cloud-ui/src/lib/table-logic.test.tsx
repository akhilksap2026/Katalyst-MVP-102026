import { describe, expect, it } from "vitest"
import { isSelectableDate, pruneSelection, selectionRange } from "./table-logic"

describe("selectionRange", () => {
  const ids = ["a", "b", "c", "d"]
  it("selects forward and backward ranges inclusively", () => {
    expect(selectionRange(ids, "a", "c")).toEqual(["a", "b", "c"])
    expect(selectionRange(ids, "d", "b")).toEqual(["b", "c", "d"])
  })
  it("falls back to the target without a valid anchor", () => {
    expect(selectionRange(ids, null, "c")).toEqual(["c"])
    expect(selectionRange(ids, "z", "c")).toEqual(["c"])
  })
})

describe("pruneSelection", () => {
  it("removes ids that left the data and keeps identity otherwise", () => {
    const sel = { a: true, b: true }
    expect(pruneSelection(sel, ["a"])).toEqual({ a: true })
    expect(pruneSelection(sel, ["a", "b"])).toBe(sel)
  })
})

describe("isSelectableDate", () => {
  it("rejects days before the minimum", () => {
    const min = new Date(2025, 0, 10, 15)
    expect(isSelectableDate(new Date(2025, 0, 9), min)).toBe(false)
    expect(isSelectableDate(new Date(2025, 0, 10), min)).toBe(true)
    expect(isSelectableDate(new Date(2025, 0, 1))).toBe(true)
  })
})
