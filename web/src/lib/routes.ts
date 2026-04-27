import { HiOutlineSparkles } from "react-icons/hi2";
import { RiTreeLine } from "react-icons/ri";
import { BsMoonStars } from "react-icons/bs";

export const routes = [
  { path: "/", name: "Chamber", Icon: RiTreeLine },
  { path: "/camphor", name: "Camphor", Icon: HiOutlineSparkles },
  { path: "/moonlight", name: "Moonlight", Icon: BsMoonStars },
];

export function getRouteName(path: string) {
  const route = routes.find((route) => route.path === path);
  return route ? route.name : "Chamber";
}

export function getAllRoutePaths() {
  return routes.map((route) => route.path);
}
