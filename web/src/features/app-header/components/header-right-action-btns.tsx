"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeaderIcon } from "./header-icon";
import { IoIosMore } from "react-icons/io";
import { useState } from "react";
import { MoreOptions } from "./more-options";

export function HeaderRightActionButtons() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={(newValue) => setDropdownOpen(newValue)}
    >
      <DropdownMenuTrigger>
        <HeaderIcon icon={<IoIosMore />} accessibleLabel="More options" />
      </DropdownMenuTrigger>

      <MoreOptions />
    </DropdownMenu>
  );
}
