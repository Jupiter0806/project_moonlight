"use client";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
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
import { Button } from "@/components/Button/Button";
import { MdOutlineSwapCalls } from "react-icons/md";
import { useFlushTranslation } from "./hooks/useFlushTranslation";
import { MobileSubmitButton } from "@/components/MobileSubmitButton/MobileSubmitButton";

const TranslateThis = dynamic(() => import("../TranslateThis/TranslateThis"), {
  loading: () => <span>Translating...</span>,
});

export function TranslateInput() {
  const [sourceLang, setSourceLang] = useAtom(sourceLanguageAtom);
  const [targetLang, setTargetLang] = useAtom(targetLanguageAtom);
  const [sourceText, setSourceText] = useAtom(sourceTextAtom);
  const [translationResult, setTranslationResult] = useAtom(
    translationResultAtom,
  );
  const sourceInputRef = useRef<HTMLTextAreaElement>(null);
  const flushTranslation = useFlushTranslation();

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
      <div>
        <LanguageSelect
          value={sourceLang}
          onChange={setSourceLang}
          className="-ml-1 text-sm"
        />
        <div className="flex min-h-6 items-center gap-2">
          <Input
            ref={sourceInputRef}
            className="text-xl placeholder:text-white/50"
            value={sourceText}
            onChange={setSourceText}
            placeholder={sourceLang.inputPlaceholder ?? "Enter text"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                flushTranslation();
              }
            }}
          />
        </div>
      </div>
      <div className="flex justify-center">
        <Button aria-label="Switch" onClick={handleSwap}>
          <MdOutlineSwapCalls />
        </Button>
      </div>
      <div>
        <LanguageSelect
          className="-ml-1 text-sm text-[#66D9EF]"
          value={targetLang}
          onChange={setTargetLang}
        />

        <div className="flex min-h-6 items-center gap-2">
          <p className="w-full text-[#66D9EF] placeholder:text-[#66D9EF]/50">
            {sourceText ? (
              <TranslateThis
                sourceText={sourceText}
                source={sourceLang.key as LanguageKey}
                target={targetLang.key as LanguageKey}
                onResult={setTranslationResult}
                className="text-xl"
              />
            ) : (
              <span
                className="cursor-pointer text-xl text-[#66D9EF]/50"
                onClick={handleSwap}
              >
                {targetLang.inputPlaceholder ?? "Translation will appear here"}
              </span>
            )}
          </p>
          <MobileSubmitButton
            className="self-end"
            disabled={!translationResult.trim()}
            onClick={flushTranslation}
          />
        </div>
      </div>
    </div>
  );
}

export default TranslateInput;
