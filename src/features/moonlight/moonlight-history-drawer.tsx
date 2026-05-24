"use client";

import { useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { getMoonlightHistoryMockAvailableDates } from "./moonlight-history-data";

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
  const availableDates = useMemo(
    () => getMoonlightHistoryMockAvailableDates(),
    [],
  );

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
