import { useRoute } from "@/hooks/use-route";
import { ChamberMoreOptions } from "./chamber-more-options";

export function MoreOptions() {
  const route = useRoute();

  switch (route) {
    case "home":
      return <ChamberMoreOptions />;
  }

  return null;
}
