import { usePathname } from "next/navigation";
import { ChamberMoreOptions } from "./chamber-more-options";
import { MoonlightMoreOptions } from "./moonlight-more-options";
import { ReflectionMoreOptions } from "./reflection-more-options";

export function MoreOptions() {
  const pathname = usePathname();

  switch (pathname) {
    case "/":
      return <ChamberMoreOptions />;

    case "/camphor":
      return <ReflectionMoreOptions />;

    case "/moonlight":
      return <MoonlightMoreOptions />;
  }

  return null;
}
