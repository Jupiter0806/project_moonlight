export type MoonlightHistoryMockDatePart = {
  year: number;
  month: number;
  day: number;
};

export const MOONLIGHT_HISTORY_MOCK_DATE_PARTS = [
  { year: 2026, month: 5, day: 8 },
  { year: 2026, month: 5, day: 14 },
  { year: 2026, month: 5, day: 19 },
  { year: 2026, month: 5, day: 24 },
] satisfies readonly MoonlightHistoryMockDatePart[];

export function createLocalDate({
  year,
  month,
  day,
}: MoonlightHistoryMockDatePart): Date {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function getMoonlightHistoryMockAvailableDates(): Date[] {
  return MOONLIGHT_HISTORY_MOCK_DATE_PARTS.map((datePart) =>
    createLocalDate(datePart),
  );
}
