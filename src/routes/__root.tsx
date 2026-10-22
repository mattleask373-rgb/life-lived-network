import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { WorldProvider } from "../lib/world-context";
import { useSession } from "../hooks/use-session";
import { CompassMark } from "../components/compass-mark";
import { Compass, Search, Route as RouteIcon, User } from "lucide-react";

const BOUNDARY_BUTTON =
  "focus-ink inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm";

function NotFoundComponent() {
  return (
    <main className="paper-grain flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl">This page isn't here</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The address may be mistyped, or the page has moved. Nothing has been lost.
        </p>
        <div className="mt-6">
          <Link to="/" className={`${BOUNDARY_BUTTON} bg-primary text-primary-foreground`}>
            Back to the map
          </Link>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="paper-grain flex min-h-screen items-center justify-center px-4">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-2xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our side. Trying again usually fixes it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className={`${BOUNDARY_BUTTON} bg-primary text-primary-foreground`}
          >
            Try again
          </button>
          {/* A full reload, so a broken client state cannot block the way home. */}
          <a href="/" className={`${BOUNDARY_BUTTON} border border-border bg-card`}>
            Back to the map
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0c6b56" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "Real World Atlas — a real-life network" },
      {
        name: "description",
        content:
          "A living map of what people are actually doing near you: work, music, food, nature, community projects and people open to meeting.",
      },
      { property: "og:title", content: "Real World Atlas — a real-life network" },
      {
        property: "og:description",
        content:
          "Find something real happening near you, then go and live it. Work, music, experiences, community projects and people.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Three doors into one world.
 *
 * Explore, Find and Journey are not three products — they are three ways into
 * the same places, people, needs and possibilities. Everything else a person
 * does (their hour, their skills, their saved things, their conversations) sits
 * quietly underneath the door it belongs to, rather than competing with it.
 */
const DOORS: {
  to: string;
  label: string;
  blurb: string;
  under: { to: string; label: string }[];
}[] = [
  {
    to: "/",
    label: "Explore",
    blurb: "What's around you",
    under: [
      { to: "/make", label: "Add something real" },
      { to: "/life-list", label: "Your life list" },
      { to: "/memories", label: "Places I've known" },
    ],
  },
  {
    to: "/need",
    label: "Find",
    blurb: "What you need, or can give",
    under: [
      { to: "/give", label: "I have an hour" },
      { to: "/help", label: "What you can do" },
      { to: "/earn", label: "Ways to earn" },
      { to: "/conversations", label: "Conversations" },
    ],
  },
  {
    to: "/road-trip",
    label: "Journey",
    blurb: "What's along your way",
    under: [{ to: "/journey", label: "Shape a longer stay" }],
  },
];

function SiteHeader() {
  const { user, ready } = useSession();
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <nav aria-label="Main" className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <Link to="/" className="focus-ink flex min-w-0 items-center gap-2 rounded-md">
            <CompassMark className="h-8 w-8 shrink-0" />
            <span className="min-w-0 leading-none">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Real World
              </span>
              <span className="block truncate font-display text-lg italic">Atlas</span>
            </span>
          </Link>
          <Link
            to={user ? "/profile" : "/auth"}
            activeProps={{ className: "text-foreground" }}
            className="focus-ink shrink-0 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {!ready ? "Account" : user ? "Your account" : "Sign in"}
          </Link>
        </div>
        <div className="hidden items-stretch gap-2 overflow-x-auto pb-1 md:flex">
          {DOORS.map((door) => (
            <Link
              key={door.to}
              to={door.to}
              activeProps={{ className: "border-primary/60 bg-background text-foreground" }}
              className="focus-ink min-w-0 flex-1 whitespace-nowrap rounded-xl border border-border px-3 py-2 hover:bg-background"
            >
              <span className="block text-sm font-medium">{door.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{door.blurb}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap text-xs text-muted-foreground">
          {DOORS.flatMap((door) => door.under).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeProps={{ className: "text-foreground" }}
              className="hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

/** Thumb-reach tabs on small screens; the same doors as the desktop header. */
function MobileTabs() {
  const { user } = useSession();
  const tabs = [
    { to: "/", label: "Explore", icon: Compass, exact: true },
    { to: "/need", label: "Find", icon: Search, exact: false },
    { to: "/road-trip", label: "Journey", icon: RouteIcon, exact: false },
    { to: user ? "/profile" : "/auth", label: "You", icon: User, exact: false },
  ];
  return (
    <nav
      aria-label="Main tabs"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm md:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-around px-2 pt-1">
        {tabs.map(({ to, label, icon: Icon, exact }) => (
          <li key={label} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              activeProps={{ className: "text-primary", "aria-current": "page" }}
              className="focus-ink flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium text-muted-foreground"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
    // Install only the privacy-safe shell worker; registration failure must not
    // interfere with the online application.
    void navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch(() => undefined);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WorldProvider>
        <SiteHeader />
        <div className="pb-20 md:pb-0">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
        <MobileTabs />
      </WorldProvider>
    </QueryClientProvider>
  );
}
