export const routes = [
  { path: "/", name: "Chamber" },
  { path: "/camphor", name: "Camphor" },
];

export function getRouteName(path: string) {
  const route = routes.find((route) => route.path === path);
  return route ? route.name : "Chamber";
}

export function getAllRoutePaths() {
  return routes.map((route) => route.path);
}
