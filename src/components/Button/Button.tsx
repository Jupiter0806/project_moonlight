import { WithClassName } from "@/types/withClassName";
import clsx from "clsx";

interface ButtonProps extends WithClassName {
  children?: React.ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
  disabled?: boolean;
}

export function Button({
  children,
  onClick,
  "aria-label": ariaLabel,
  disabled,
  className,
}: ButtonProps) {
  return (
    <div
      role="button"
      aria-label={ariaLabel}
      onClick={disabled ? undefined : onClick}
      className={clsx(
        "border-border hover:bg-surface-hover flex h-12 w-fit cursor-pointer items-center justify-center rounded-full border border-solid px-5 transition-colors hover:border-transparent",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {children}
    </div>
  );
}
