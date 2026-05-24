"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";

import { selectedMoonlightHistoryDateAtom } from "@/atoms/moonlight-history-atoms";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { getMoonlightDates } from "@/lib/moonlight-service";
import {
  createMoonlightHistoryDate,
  formatMoonlightHistoryDateKey,
  formatMoonlightHistoryMonthKey,
  parseMoonlightHistoryAvailableDates,
} from "./moonlight-history-data";

export function MoonlightHistoryDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedHistoryDate, setSelectedHistoryDate] = useAtom(
    selectedMoonlightHistoryDateAtom,
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    selectedHistoryDate
      ? (createMoonlightHistoryDate(selectedHistoryDate) ?? new Date())
      : new Date(),
  );
  const [timeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const visibleMonthKey = useMemo(
    () => formatMoonlightHistoryMonthKey(visibleMonth),
    [visibleMonth],
  );

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);

    if (!date) {
      return;
    }

    setSelectedHistoryDate(formatMoonlightHistoryDateKey(date));
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();

    async function loadAvailableDates() {
      try {
        const data = await getMoonlightDates(
          visibleMonthKey,
          controller.signal,
        );

        setAvailableDates(
          parseMoonlightHistoryAvailableDates(data.availableDates ?? []),
        );
      } catch {
        if (!controller.signal.aborted) {
          setAvailableDates([]);
        }
      }
    }

    void loadAvailableDates();

    return () => {
      controller.abort();
    };
  }, [open, visibleMonthKey]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Moonlight history</DrawerTitle>
          <DrawerDescription>
            Select a date to review a past Moonlight summary.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            onMonthChange={setVisibleMonth}
            timeZone={timeZone}
            modifiers={{ available: availableDates }}
            modifiersClassNames={{
              available:
                "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30 hover:bg-primary/20",
            }}
            className="mx-auto w-full max-w-md rounded-3xl border"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
