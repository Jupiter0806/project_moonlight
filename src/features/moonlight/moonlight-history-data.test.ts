import { describe, expect, it } from "vitest";

import {
  createMoonlightHistoryDate,
  formatMoonlightHistoryMonthKey,
  parseMoonlightHistoryAvailableDates,
} from "./moonlight-history-data";

describe("moonlight-history-data", () => {
  it("formats month keys for availability api requests", () => {
    expect(formatMoonlightHistoryMonthKey(new Date(2026, 4, 24))).toBe(
      "2026-05",
    );
  });

  it("parses api dates into stable local noon dates", () => {
    const dates = parseMoonlightHistoryAvailableDates([
      "2026-05-08",
      "2026-05-14",
      "bad-value",
    ]);

    expect(dates).toHaveLength(2);
    expect(
      dates.map((date) => ({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
      })),
    ).toEqual([
      { year: 2026, month: 5, day: 8, hour: 12 },
      { year: 2026, month: 5, day: 14, hour: 12 },
    ]);
  });

  it("creates a local noon date from an iso date string", () => {
    const date = createMoonlightHistoryDate("2026-05-24");

    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(24);
    expect(date?.getHours()).toBe(12);
  });

  it("returns null for invalid date text", () => {
    expect(createMoonlightHistoryDate("2026/05/24")).toBeNull();
  });
});
