import { useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

export function useIsMobile(): boolean {
  const [isMobile] = useState(false);

  // useEffect(() => {
  //   // todo
  //   // media query not implemented yet
  //   const mql = window.matchMedia(MOBILE_QUERY);
  //   // setIsMobile(mql.matches);

  //   const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
  //   mql.addEventListener("change", handler);
  //   return () => mql.removeEventListener("change", handler);
  // }, []);

  return isMobile;
}
