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
import { LocaleProvider, LOCALE_LABELS, SUPPORTED_LOCALES, isLocale, useLocale, type TranslationKey } from "../lib/locale";
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
  labelKey: TranslationKey;
  blurbKey: TranslationKey;
  under: { to: string; labelKey: TranslationKey }[];
}[] = [
  {
    to: "/",
    labelKey: "nav.explore",
    blurbKey: "nav.exploreBlurb",
    under: [
      { to: "/make", labelKey: "nav.addSomething" },
      { to: "/life-list", labelKey: "nav.lifeList" },
      { to: "/memories", labelKey: "nav.memories" },
    ],
  },
  {
    to: "/need",
    labelKey: "nav.find",
    blurbKey: "nav.findBlurb",
    under: [
      { to: "/give", labelKey: "nav.haveHour" },
      { to: "/help", labelKey: "nav.whatCanDo" },
      { to: "/earn", labelKey: "nav.waysEarn" },
      { to: "/conversations", labelKey: "nav.conversations" },
    ],
  },
  {
    to: "/road-trip",
    labelKey: "nav.journey",
    blurbKey: "nav.journeyBlurb",
    under: [{ to: "/journey", labelKey: "nav.longerStay" }],
  },
];

function SiteHeader() {
  const { user, ready } = useSession();
  const { locale, setLocale, t } = useLocale();
  const doors = DOORS.map((door) => ({
    to: door.to,
    label: t(door.labelKey),
    blurb: t(door.blurbKey),
    under: door.under.map((link) => ({ to: link.to, label: t(link.labelKey) })),
  }));
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <nav aria-label={t("nav.main")} className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6">
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
          <div className="flex shrink-0 items-center gap-2">
            <label className="sr-only" htmlFor="atlas-language">{t("language.label")}</label>
            <select
              id="atlas-language"
              aria-label={t("language.label")}
              value={locale}
              onChange={(event) => {
                if (isLocale(event.currentTarget.value)) setLocale(event.currentTarget.value);
              }}
              className="focus-ink min-h-11 max-w-28 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
            >
              {SUPPORTED_LOCALES.map((supported) => (
                <option key={supported} value={supported}>{LOCALE_LABELS[supported]}</option>
              ))}
            </select>
            <Link
              to={user ? "/profile" : "/auth"}
              activeProps={{ className: "text-foreground" }}
              className="focus-ink shrink-0 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {!ready ? t("nav.account") : user ? t("nav.yourAccount") : t("nav.signIn")}
            </Link>
          </div>
        </div>
        <div className="hidden items-stretch gap-2 overflow-x-auto pb-1 md:flex">
          {doors.map((door) => (
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
          {doors.flatMap((door) => door.under).map((link) => (
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
  const { t } = useLocale();
  const tabs = [
    { to: "/", labelKey: "nav.explore", icon: Compass, exact: true },
    { to: "/need", labelKey: "nav.find", icon: Search, exact: false },
    { to: "/road-trip", labelKey: "nav.journey", icon: RouteIcon, exact: false },
    { to: user ? "/profile" : "/auth", labelKey: "nav.you", icon: User, exact: false },
  ];
  return (
    <nav
      aria-label={t("nav.mainTabs")}
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm md:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-around px-2 pt-1">
        {tabs.map(({ to, labelKey, icon: Icon, exact }) => (
          <li key={labelKey} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact }}
              activeProps={{ className: "text-primary", "aria-current": "page" }}
              className="focus-ink flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium text-muted-foreground"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {t(labelKey)}
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
      <LocaleProvider>
        <WorldProvider>
          <SiteHeader />
          <div className="pb-20 md:pb-0">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </div>
          <MobileTabs />
        </WorldProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
