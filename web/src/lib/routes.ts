import { HiOutlineSparkles } from "react-icons/hi2";
import { RiTreeLine } from "react-icons/ri";

export const routes = [
  { path: "/", name: "Chamber", Icon: RiTreeLine },
  { path: "/camphor", name: "Camphor", Icon: HiOutlineSparkles },
];

export function getRouteName(path: string) {
  const route = routes.find((route) => route.path === path);
  return route ? route.name : "Chamber";
}

export function getAllRoutePaths() {
  return routes.map((route) => route.path);
}
