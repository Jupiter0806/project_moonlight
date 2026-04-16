import { IconButton } from "@/components/icon-button";
import { cn } from "@/lib/utils";

export const IconClassnames = "m-2 h-11 w-11";

export function HeaderIcon(
  props: Omit<React.ComponentProps<typeof IconButton>, "iconSize" | "variant">,
) {
  return (
    <IconButton
      iconSize="sm"
      variant="outline"
      {...props}
      className={cn(IconClassnames, props.className)}
    />
  );
}
