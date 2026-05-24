"use client";

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function ReflectionMoreOptions() {
  return (
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => {}}>
        Coming soon
        <span className="sr-only">coming soon</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
