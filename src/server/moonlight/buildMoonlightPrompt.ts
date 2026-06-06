export type MoonlightPromptReflection = {
  id: string;
  summary: string;
  hasMarginalia?: boolean;
};

export function buildMoonlightPrompt(
  reflections: MoonlightPromptReflection[],
): string {
  const sortedReflections = reflections
    .map((reflection, index) => ({ reflection, index }))
    .sort((a, b) => {
      const aPriority = a.reflection.hasMarginalia ? 0 : 1;
      const bPriority = b.reflection.hasMarginalia ? 0 : 1;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a.index - b.index;
    })
    .map((item) => item.reflection);

  const hasMarginalia = sortedReflections.some(
    (reflection) => reflection.hasMarginalia,
  );

  return [
    "Write today's Moonlight review based on the reflections below.",
    "Output 2-4 short paragraphs, plain text only.",
    hasMarginalia
      ? "Reflections that include marginalia notes are primary; use others as supporting context."
      : "QA-led reflections are primary; translation-led reflections are supporting context.",
    "Group related reflections together naturally.",
    "Whenever mentioning a reflection, include inline token [reflection:<id>].",
    "Every reflection id must appear at least once.",
    "Do not use bullets or markdown headers.",
    "",
    "Reflections:",
    ...sortedReflections.map((reflection, index) => {
      const clippedSummary = reflection.summary.slice(0, 600);
      return `#${index + 1} ID=${reflection.id}\\nSummary: ${clippedSummary}`;
    }),
  ].join("\n");
}
