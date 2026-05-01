import { useIsMobile } from "@/hooks/use-mobile";

const RowHeight = {
  mobile: 180,
  desktop: 160,
};

export function useRowHeight() {
  const isMobile = useIsMobile();
  return isMobile ? RowHeight.mobile : RowHeight.desktop;
}
