import { describe, expect, it } from "vitest";
import { buildMoonlightPrompt } from "@/server/moonlight/buildMoonlightPrompt";

describe("buildMoonlightPrompt", () => {
  it("prioritizes reflections with marginalia in prompt ordering", () => {
    const prompt = buildMoonlightPrompt([
      {
        id: "reflection-qa",
        summary: "QA-heavy reflection summary.",
      },
      {
        id: "reflection-note",
        summary: "Reflection summary from marginalia-driven session.",
        hasMarginalia: true,
      },
      {
        id: "reflection-translation",
        summary: "Translation support reflection summary.",
      },
    ]);

    const noteIndex = prompt.indexOf("ID=reflection-note");
    const qaIndex = prompt.indexOf("ID=reflection-qa");
    const translationIndex = prompt.indexOf("ID=reflection-translation");

    expect(prompt).toContain(
      "Reflections that include marginalia notes are primary; use others as supporting context.",
    );
    expect(noteIndex).toBeGreaterThan(-1);
    expect(qaIndex).toBeGreaterThan(-1);
    expect(translationIndex).toBeGreaterThan(-1);
    expect(noteIndex).toBeLessThan(qaIndex);
    expect(noteIndex).toBeLessThan(translationIndex);
  });

  it("uses non-marginalia guidance when no reflection has marginalia", () => {
    const prompt = buildMoonlightPrompt([
      {
        id: "reflection-qa",
        summary: "QA-heavy reflection summary.",
      },
      {
        id: "reflection-translation",
        summary: "Translation support reflection summary.",
      },
    ]);

    expect(prompt).toContain(
      "QA-led reflections are primary; translation-led reflections are supporting context.",
    );
  });
});
