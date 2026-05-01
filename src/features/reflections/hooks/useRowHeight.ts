import { useIsMobile } from "@/hooks/use-mobile";

const RowHeight = {
  mobile: 180,
  desktop: 160,
};

const DescriptionMaxHeight = {
  mobile: 60,
  desktop: 40,
};

export function useRowHeight() {
  const isMobile = useIsMobile();
  return isMobile ? RowHeight.mobile : RowHeight.desktop;
}

export function useDescriptionMaxHeight() {
  const isMobile = useIsMobile();
  return isMobile ? DescriptionMaxHeight.mobile : DescriptionMaxHeight.desktop;
}
