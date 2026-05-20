"use client";

import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button-as-div";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { Button as ButtonPrimitive } from "@base-ui/react/button";

const Spinner = () => (
  <svg
    className="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

interface IconButtonProps
  extends
    Omit<ButtonPrimitive.Props, "size">,
    VariantProps<typeof buttonVariants> {
  /** Icon to render. Hidden when loading. */
  icon: React.ReactNode;
  /** Optional prop to control icon size */
  iconSize?: "2xs" | "xs" | "sm" | "md" | "lg";
  /** Replaces the icon with a spinner and disables interaction. */
  loading?: boolean;
  /** Accessible label — required for icon-only buttons. */
  accessibleLabel: string;
}

export function IconButton({
  icon,
  loading = false,
  variant = "ghost",
  size = "icon",
  iconSize,
  className,
  accessibleLabel,
  ...props
}: IconButtonProps) {
  const resolvedIconSize =
    iconSize ??
    (size === "icon-2xs"
      ? "2xs"
      : size === "icon-xs"
        ? "xs"
        : size === "icon-sm"
          ? "sm"
          : size === "icon-lg"
            ? "lg"
            : "md");

  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading || props.disabled}
      className={cn(
        resolvedIconSize === "2xs"
          ? "[&_svg]:h-3.5! [&_svg]:w-3.5!"
          : resolvedIconSize === "xs"
            ? "[&_svg]:h-4.25! [&_svg]:w-4.25!"
            : resolvedIconSize === "sm"
              ? "[&_svg]:h-5! [&_svg]:w-5!"
              : resolvedIconSize === "lg"
                ? "[&_svg]:h-7! [&_svg]:w-7!"
                : "[&_svg]:h-6! [&_svg]:w-6!",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      <span className="sr-only">{accessibleLabel}</span>
    </Button>
  );
}
