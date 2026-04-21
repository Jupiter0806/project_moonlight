import { usePathname } from "next/navigation";

export type RouteName = "home" | "dashboard" | "settings";

export function useRoute(): RouteName {
  const pathname = usePathname();

  switch (pathname) {
    case "/dashboard":
      return "dashboard";
    case "/settings":
      return "settings";
    default:
      return "home";
  }
}
