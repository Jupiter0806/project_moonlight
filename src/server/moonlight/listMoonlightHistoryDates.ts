export type MoonlightHistoryDatesResult = {
  month: string;
  availableDates: string[];
};

export type MoonlightHistoryMoonlightResult = {
  date: string;
  exists: boolean;
  canGenerate: boolean;
  moonlight?: {
    id: string;
    summary: string;
    reflectionIds: string[];
    reflectionCount: number;
  };
};

export type GenerateMoonlightHistoryByDateResult = {
  date: string;
  generated: boolean;
  moonlight: {
    id: string;
    summary: string;
    reflectionIds: string[];
    reflectionCount: number;
  };
};

export class GenerateMoonlightHistoryError extends Error {
  constructor(
    public readonly code: "NO_REFLECTIONS",
    message: string,
  ) {
    super(message);
    this.name = "GenerateMoonlightHistoryError";
  }
}

const MOCK_AVAILABLE_DAY_NUMBERS = [8, 14, 19, 24];

const MOCK_MOONLIGHT_BY_DATE: Record<
  string,
  {
    id: string;
    summary: string;
    reflectionIds: string[];
    reflectionCount: number;
  }
> = {
  "2026-05-24": {
    id: "2026-05-24",
    summary:
      "You revisited prompt structure and test boundaries. [reflection:mock-reflection-1]\n\nYou also tightened API contracts and reduced component-side fetch complexity. [reflection:mock-reflection-2]",
    reflectionIds: ["mock-reflection-1", "mock-reflection-2"],
    reflectionCount: 2,
  },
};

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

export function getMoonlightHistoryByDate(
  dateKey: string,
): MoonlightHistoryMoonlightResult {
  const moonlight = MOCK_MOONLIGHT_BY_DATE[dateKey];

  if (!moonlight) {
    const hasReflections = listMoonlightHistoryDates(
      dateKey.slice(0, 7),
    ).availableDates.includes(dateKey);

    return {
      date: dateKey,
      exists: false,
      canGenerate: hasReflections,
    };
  }

  return {
    date: dateKey,
    exists: true,
    canGenerate: false,
    moonlight,
  };
}

export function generateMoonlightHistoryByDate(
  dateKey: string,
): GenerateMoonlightHistoryByDateResult {
  const existingMoonlight = MOCK_MOONLIGHT_BY_DATE[dateKey];
  if (existingMoonlight) {
    return {
      date: dateKey,
      generated: false,
      moonlight: existingMoonlight,
    };
  }

  const hasReflections = listMoonlightHistoryDates(
    dateKey.slice(0, 7),
  ).availableDates.includes(dateKey);

  if (!hasReflections) {
    throw new GenerateMoonlightHistoryError(
      "NO_REFLECTIONS",
      "No reflections, unable to generate.",
    );
  }

  const generatedMoonlight = {
    id: dateKey,
    summary:
      "A retrospective moonlight was generated from your reflections for this date.",
    reflectionIds: ["mock-reflection-generated-1"],
    reflectionCount: 1,
  };

  MOCK_MOONLIGHT_BY_DATE[dateKey] = generatedMoonlight;

  return {
    date: dateKey,
    generated: true,
    moonlight: generatedMoonlight,
  };
}
