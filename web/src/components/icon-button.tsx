"use client";

import { Button, buttonVariants } from "@/components/ui/button";
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
  /** Replaces the icon with a spinner and disables interaction. */
  loading?: boolean;
  /** Accessible label — required for icon-only buttons. */
  "aria-label": string;
}

export function IconButton({
  icon,
  loading = false,
  variant = "ghost",
  size = "icon",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={loading || props.disabled}
      className={cn("[&_svg]:h-6! [&_svg]:w-6!", className)}
      {...props}
    >
      {loading ? <Spinner /> : icon}
    </Button>
  );
}
