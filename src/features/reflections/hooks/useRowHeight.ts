import { useIsMobile } from "@/hooks/use-mobile";

const RowHeight = {
  mobile: 190,
  desktop: 170,
};

const DescriptionLineClamp = {
  mobile: 3,
  desktop: 2,
};

const DescriptionMaxHeight = {
  mobile: 55,
  desktop: 35,
};

export function useRowHeight() {
  const isMobile = useIsMobile();
  return isMobile ? RowHeight.mobile : RowHeight.desktop;
}

export function useDescriptionLineClamp() {
  const isMobile = useIsMobile();
  return isMobile ? DescriptionLineClamp.mobile : DescriptionLineClamp.desktop;
}

export function useDescriptionHeight() {
  const isMobile = useIsMobile();
  return isMobile ? DescriptionMaxHeight.mobile : DescriptionMaxHeight.desktop;
}
