import { describe, expect, it } from "vitest";

import {
  createLocalDate,
  getMoonlightHistoryMockAvailableDates,
  MOONLIGHT_HISTORY_MOCK_DATE_PARTS,
} from "./moonlight-history-data";

describe("moonlight-history-data", () => {
  it("creates stable local dates for the mock availability list", () => {
    const dates = getMoonlightHistoryMockAvailableDates();

    expect(dates).toHaveLength(MOONLIGHT_HISTORY_MOCK_DATE_PARTS.length);
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
      { year: 2026, month: 5, day: 19, hour: 12 },
      { year: 2026, month: 5, day: 24, hour: 12 },
    ]);
  });

  it("creates a local noon date from a date part", () => {
    const date = createLocalDate({ year: 2026, month: 5, day: 24 });

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(24);
    expect(date.getHours()).toBe(12);
  });
});
