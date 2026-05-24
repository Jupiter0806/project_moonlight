export type MoonlightHistoryDatesResult = {
  month: string;
  availableDates: string[];
};

const MOCK_AVAILABLE_DAY_NUMBERS = [8, 14, 19, 24];

function parseMonthKey(monthKey: string | null): string {
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    return monthKey;
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function listMoonlightHistoryDates(
  monthKey: string | null,
): MoonlightHistoryDatesResult {
  const resolvedMonthKey = parseMonthKey(monthKey);
  const [yearText, monthText] = resolvedMonthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const daysInMonth = getDaysInMonth(year, month);

  return {
    month: resolvedMonthKey,
    availableDates: MOCK_AVAILABLE_DAY_NUMBERS.filter(
      (day) => day <= daysInMonth,
    ).map((day) => `${resolvedMonthKey}-${String(day).padStart(2, "0")}`),
  };
}
