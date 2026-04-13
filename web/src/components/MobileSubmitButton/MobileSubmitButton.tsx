"use client";

import clsx from "clsx";
import { MdArrowUpward } from "react-icons/md";
import { Button } from "../Button/Button";
import { WithClassName } from "@/types/withClassName";

interface MobileSubmitButtonProps extends WithClassName {
  onClick?: () => void;
  disabled?: boolean;
}

export function MobileSubmitButton({
  onClick,
  disabled,
  className,
}: MobileSubmitButtonProps) {
  return (
    <Button
      aria-label="Submit"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "h-9! bg-blue-500 px-2! hover:bg-blue-600 md:hidden",
        className,
      )}
    >
      <MdArrowUpward className="text-xl" />
    </Button>
  );
}
