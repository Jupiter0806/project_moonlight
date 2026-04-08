"use client";

import { useEffect, useRef } from "react";
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
import { LanguageKey } from "@/lib/languages";
import dynamic from "next/dynamic";

const TranslateThis = dynamic(() => import("../TranslateThis/TranslateThis"), {
  loading: () => <span>Translating...</span>,
});

export function TranslateInput() {
  const [sourceLang, setSourceLang] = useAtom(sourceLanguageAtom);
  const [targetLang, setTargetLang] = useAtom(targetLanguageAtom);
  const [sourceText, setSourceText] = useAtom(sourceTextAtom);
  const setTranslationResult = useSetAtom(translationResultAtom);
  const sourceInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sourceText.trim()) setTranslationResult("");
  }, [sourceText, setTranslationResult]);

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    sourceInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-6 gap-2">
        <LanguageSelect value={sourceLang} onChange={setSourceLang} />
        <Input
          ref={sourceInputRef}
          className="placeholder:text-white/50"
          onChange={setSourceText}
          placeholder={sourceLang.inputPlaceholder ?? "Enter text"}
        />
      </div>
      <button onClick={handleSwap}>switch</button>
      <div className="flex min-h-6 gap-2">
        <LanguageSelect
          className="text-[#66D9EF]"
          value={targetLang}
          onChange={setTargetLang}
        />
        <p className="text-[#66D9EF] placeholder:text-[#66D9EF]/50">
          {sourceText ? (
            <TranslateThis
              sourceText={sourceText}
              source={sourceLang.key as LanguageKey}
              target={targetLang.key as LanguageKey}
              onResult={setTranslationResult}
            />
          ) : (
            <span
              className="cursor-pointer text-[#66D9EF]/50"
              onClick={handleSwap}
            >
              {targetLang.inputPlaceholder ?? "Translation will appear here"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
