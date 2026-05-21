"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectReflectionById } from "@/store/slices/entitiesSlice";
import { type MoonlightData } from "@/lib/moonlight-service";
import type { Reflection } from "@/types/Reflection";

const ReflectionTracesDrawer = dynamic(
  () => import("@/features/reflections/reflection-traces-drawer"),
);

const REFLECTION_TOKEN_REGEX = /\[reflection:([^\]]+)\]/g;

export function MoonlightDisplayWidget({
  moonlight,
}: {
  moonlight: MoonlightData;
}) {
  const readableDate = useMemo(
    () => formatMoonlightDate(moonlight.id),
    [moonlight.id],
  );
  const paragraphs = useMemo(
    () => splitParagraphs(moonlight.summary),
    [moonlight.summary],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm leading-6">
          A quick reflection of the day, grouped by what connects.
        </p>
        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-3 text-xs">
          <span>{moonlight.reflectionCount} reflections reviewed</span>
          <span>Moonlight ID: {readableDate}</span>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-7">
        {paragraphs.map((paragraph, index) => (
          <p key={`${moonlight.id}-${index}`} className="text-foreground">
            <MoonlightParagraph text={paragraph} />
          </p>
        ))}
      </div>
    </div>
  );
}

function splitParagraphs(summary: string): string[] {
  return summary
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function formatMoonlightDate(id: string): string {
  if (!/^\d+$/.test(id)) {
    return id;
  }

  const timestamp = Number(id);
  if (!Number.isFinite(timestamp)) {
    return id;
  }

  const milliseconds = id.length <= 10 ? timestamp * 1000 : timestamp;
  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    return id;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function MoonlightParagraph({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(REFLECTION_TOKEN_REGEX)) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      nodes.push(<span key={`${match.index}-text`}>{before}</span>);
    }

    const reflectionId = match[1];
    nodes.push(
      <MoonlightReflectionLink
        key={`${match.index}-${reflectionId}`}
        reflectionId={reflectionId}
      />,
    );
    lastIndex = match.index + match[0].length;
  }

  const tail = text.slice(lastIndex);
  if (tail) {
    nodes.push(<span key="tail">{tail}</span>);
  }

  if (nodes.length === 0) {
    return <>{text}</>;
  }

  return <>{nodes}</>;
}

function MoonlightReflectionLink({ reflectionId }: { reflectionId: string }) {
  const reflection = useAppSelector((state) =>
    selectReflectionById(state, reflectionId),
  ) as Reflection | undefined;
  const [open, setOpen] = useState(false);

  if (!reflection) {
    return (
      <span
        className="text-blue-600 underline underline-offset-4 dark:text-blue-400"
        title={`Reflection ${reflectionId}`}
      >
        reflection
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className="font-medium text-blue-600 underline underline-offset-4 dark:text-blue-400"
        onClick={() => setOpen(true)}
        title="Open reflection drawer"
      >
        reflection
      </button>

      <ReflectionTracesDrawer
        reflection={reflection}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
