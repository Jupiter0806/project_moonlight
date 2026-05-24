"use client";

import { useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
            className="mx-auto w-full max-w-sm rounded-3xl border"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
