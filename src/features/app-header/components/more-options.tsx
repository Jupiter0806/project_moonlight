import { usePathname } from "next/navigation";
import { ChamberMoreOptions } from "./chamber-more-options";

export function MoreOptions() {
  const pathname = usePathname();

  switch (pathname) {
    case "/":
      return <ChamberMoreOptions />;

    case "/camphor":
      // return <CamphorMoreOptions />;
      return null;
  }

  return null;
}
