export type MoonlightPromptReflection = {
  id: string;
  summary: string;
};

export function buildMoonlightPrompt(
  reflections: MoonlightPromptReflection[],
): string {
  return [
    "Write today's Moonlight review based on the reflections below.",
    "Output 2-4 short paragraphs, plain text only.",
    "Group related reflections together naturally.",
    "Whenever mentioning a reflection, include inline token [reflection:<id>].",
    "Every reflection id must appear at least once.",
    "Do not use bullets or markdown headers.",
    "",
    "Reflections:",
    ...reflections.map((reflection, index) => {
      const clippedSummary = reflection.summary.slice(0, 600);
      return `#${index + 1} ID=${reflection.id}\\nSummary: ${clippedSummary}`;
    }),
  ].join("\n");
}
