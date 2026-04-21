"use client";

import { currentChamberInputAtom } from "@/atoms/chamber-input-atoms";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useAtom } from "jotai";
import { BsTranslate } from "react-icons/bs";
import { HiOutlineSparkles } from "react-icons/hi2";

export function ChamberMoreOptions() {
  const [currInput, setCurrInput] = useAtom(currentChamberInputAtom);

  return (
    <DropdownMenuContent align="end">
      <DropdownMenuItem>
        New Kinen
        <span className="sr-only">new kinen</span>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuLabel>
          More Inputs
          <span className="sr-only">more inputs</span>
        </DropdownMenuLabel>
        <DropdownMenuItem
          hidden={currInput === "translating"}
          onClick={() => setCurrInput("translating")}
        >
          <BsTranslate />
          Translation
          <span className="sr-only">translation</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          hidden={currInput === "asking"}
          onClick={() => setCurrInput("asking")}
        >
          <HiOutlineSparkles />
          QA
          <span className="sr-only">qa</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
