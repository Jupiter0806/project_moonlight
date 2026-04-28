"use client";

import { getRouteName } from "@/lib/routes";
import { usePathname } from "next/navigation";

export function HeaderTitle() {
  const pathname = usePathname();
  return <div className="text-lg font-semibold">{getRouteName(pathname)}</div>;
}
