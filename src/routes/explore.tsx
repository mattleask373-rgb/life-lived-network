import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/explore")({
  component: ExploreLayout,
});

function ExploreLayout() {
  return <Outlet />;
}
