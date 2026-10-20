/**
 * Layout for everything under `/<country>/<place>`.
 *
 * The locality page itself lives in `$country.$place.index.tsx`; service
 * pages live in `$country.$place.$service.tsx`. This file exists so both
 * render as siblings — without an <Outlet /> here, a service page would
 * never appear beneath the locality route.
 */

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/$country/$place")({
  component: () => <Outlet />,
});
