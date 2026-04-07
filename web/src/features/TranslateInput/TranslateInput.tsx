"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/Input/Input";
import { LanguageSelect } from "../LanguageSelect/LanguageSelect";
import {
  sourceLanguageAtom,
  targetLanguageAtom,
  sourceTextAtom,
  translationResultAtom,
} from "./atom/translateAtoms";

async function fetchTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });
  if (!res.ok) throw new Error("Translation failed");
  const data = (await res.json()) as { translatedText: string };
  return data.translatedText;
}

export function TranslateInput() {
  const [sourceLang, setSourceLang] = useAtom(sourceLanguageAtom);
  const [targetLang, setTargetLang] = useAtom(targetLanguageAtom);
  const [sourceText, setSourceText] = useAtom(sourceTextAtom);
  const [translationResult] = useAtom(translationResultAtom);
  const setTranslationResult = useSetAtom(translationResultAtom);

  const { data: translatedText } = useQuery({
    queryKey: ["translate", sourceText, sourceLang, targetLang],
    queryFn: () => fetchTranslation(sourceText, sourceLang, targetLang),
    enabled: sourceText.trim().length > 0,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (translatedText !== undefined) setTranslationResult(translatedText);
  }, [translatedText, setTranslationResult]);

  useEffect(() => {
    if (!sourceText.trim()) setTranslationResult("");
  }, [sourceText, setTranslationResult]);

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <LanguageSelect value={sourceLang} onChange={setSourceLang} />
        <Input
          value={sourceText}
          onChange={setSourceText}
          placeholder="Enter text"
          debounce={200}
        />
      </div>
      <button onClick={handleSwap}>switch</button>
      <div className="flex gap-2">
        <LanguageSelect value={targetLang} onChange={setTargetLang} />
        <p>{translationResult}</p>
      </div>
    </div>
  );
}
