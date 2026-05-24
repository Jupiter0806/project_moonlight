"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const MoonlightHistoryDrawer = dynamic(
  () =>
    import("@/features/moonlight/moonlight-history-drawer").then(
      (mod) => mod.MoonlightHistoryDrawer,
    ),
  { ssr: false },
);

export function MoonlightMoreOptions() {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
          History
          <span className="sr-only">moonlight history</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {historyOpen ? (
        <MoonlightHistoryDrawer
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        />
      ) : null}
    </>
  );
}
