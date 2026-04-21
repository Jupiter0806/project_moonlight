"use client";

import { useRoute } from "@/hooks/use-route";

export function HeaderTitle() {
  const route = useRoute();

  return <div className="text-lg font-semibold">{mapRouteToTitle(route)}</div>;
}

function mapRouteToTitle(route: string) {
  // You can implement more complex logic here to map different routes to different titles
  if (route === "dashboard") {
    return "Dashboard";
  } else if (route === "settings") {
    return "Settings";
  }
  return "Chamber"; // Default title
}
