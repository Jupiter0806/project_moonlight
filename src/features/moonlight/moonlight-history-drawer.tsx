"use client";

import { useEffect, useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MoonlightDisplayWidget } from "@/features/moonlight/moonlight-display-widget";
import {
  type MoonlightData,
  getMoonlightByDate,
  getMoonlightDates,
} from "@/lib/moonlight-service";
import {
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [timeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [selectedMoonlight, setSelectedMoonlight] =
    useState<MoonlightData | null>(null);
  const [isSelectedMoonlightLoading, setIsSelectedMoonlightLoading] =
    useState(false);

  const visibleMonthKey = useMemo(
    () => formatMoonlightHistoryMonthKey(visibleMonth),
    [visibleMonth],
  );
  const selectedDateKey = useMemo(
    () => (selectedDate ? formatMoonlightHistoryDateKey(selectedDate) : null),
    [selectedDate],
  );

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

  useEffect(() => {
    if (!open || !selectedDateKey) {
      setSelectedMoonlight(null);
      return;
    }

    const controller = new AbortController();

    async function loadSelectedMoonlight() {
      setIsSelectedMoonlightLoading(true);

      try {
        const data = await getMoonlightByDate(
          selectedDateKey,
          controller.signal,
        );
        setSelectedMoonlight(
          data.exists && data.moonlight ? data.moonlight : null,
        );
      } catch {
        if (!controller.signal.aborted) {
          setSelectedMoonlight(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSelectedMoonlightLoading(false);
        }
      }
    }

    void loadSelectedMoonlight();

    return () => {
      controller.abort();
    };
  }, [open, selectedDateKey]);

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
            onSelect={setSelectedDate}
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

        <div className="border-t px-4 py-6">
          {isSelectedMoonlightLoading ? (
            <p className="text-muted-foreground text-center text-sm">
              Loading selected moonlight...
            </p>
          ) : selectedMoonlight ? (
            <MoonlightDisplayWidget moonlight={selectedMoonlight} />
          ) : (
            <p className="text-muted-foreground text-center text-sm">
              No moonlight found for the selected date.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
