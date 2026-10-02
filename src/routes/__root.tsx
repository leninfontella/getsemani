import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import * as React from "react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { clearCachedUser, isAuthenticated } from "../lib/auth";
import { clearAll, loadSettings, SETTINGS_CHANGED } from "../lib/goals";
import { clearNotifications, ensureAutomaticNotifications } from "../lib/notifications";
import { clearBrowserSessionData, supabase } from "../lib/supabase";
import { AudioPlayerProvider } from "../components/AudioPlayerProvider";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const configuredGoogleAnalyticsId = import.meta.env["VITE_GA_ID"] as string | undefined;
const googleAnalyticsId = /^G-[A-Z0-9]+$/.test(configuredGoogleAnalyticsId ?? "")
  ? configuredGoogleAnalyticsId
  : undefined;

let lastTrackedPage: string | undefined;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Getsêmani — Manifeste sua realidade" },
      { name: "description", content: "Manifeste aquilo que deseja, como se já fosse seu." },
      { name: "author", content: "Getsêmani" },
      { name: "theme-color", content: "#12111a" },
      { name: "application-name", content: "Getsêmani" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Getsêmani" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "Getsêmani" },
      { property: "og:description", content: "Manifeste aquilo que deseja, como se já fosse seu." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Getsêmani" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:image", content: "/getsemani-share.jpg" },
      { property: "og:image:width", content: "1024" },
      { property: "og:image:height", content: "1024" },
      { property: "og:image:alt", content: "Logotipo dourado do aplicativo Getsêmani" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Getsêmani" },
      {
        name: "twitter:description",
        content: "Manifeste aquilo que deseja, como se já fosse seu.",
      },
      { name: "twitter:image", content: "/getsemani-share.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter+Tight:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/getsemani-icon.png", type: "image/png" },
      { rel: "shortcut icon", href: "/getsemani-icon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/getsemani-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        {googleAnalyticsId ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', ${JSON.stringify(googleAnalyticsId)}, { send_page_view: false });`,
              }}
            />
          </>
        ) : null}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  React.useEffect(() => {
    if (!googleAnalyticsId || typeof window.gtag !== "function") return;

    const trackPageView = (href: string) => {
      const url = new URL(href, window.location.origin);
      const page = `${url.pathname}${url.search}${url.hash}`;
      if (lastTrackedPage === page) return;

      lastTrackedPage = page;
      window.gtag("event", "page_view", {
        page_title: document.title,
        page_location: url.href,
        page_path: page,
      });
    };

    trackPageView(window.location.href);

    return router.subscribe("onResolved", ({ toLocation, hrefChanged }) => {
      if (hrefChanged) trackPageView(toLocation.href);
    });
  }, [router]);

  useEffect(() => {
    if (pathname === "/login") return;
    let active = true;
    const validateSession = async () => {
      const authenticated = await isAuthenticated();
      if (!active || authenticated) return;
      clearAll();
      clearNotifications();
      clearCachedUser();
      queryClient.clear();
      await clearBrowserSessionData();
      window.location.replace("/login");
    };
    void validateSession();
    const interval = window.setInterval(validateSession, 30_000);
    const validateOnFocus = () => void validateSession();
    window.addEventListener("focus", validateOnFocus);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", validateOnFocus);
    };
  }, [pathname, queryClient]);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_OUT") return;
      queryClient.clear();
      void clearBrowserSessionData().finally(() => {
        if (window.location.pathname !== "/login") window.location.replace("/login");
      });
    });
    const rejectRestoredPrivatePage = (event: PageTransitionEvent) => {
      if (event.persisted && window.location.pathname !== "/login") window.location.reload();
    };
    window.addEventListener("pageshow", rejectRestoredPrivatePage);
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("pageshow", rejectRestoredPrivatePage);
    };
  }, [queryClient]);

  useEffect(() => {
    if (pathname === "/login") return;
    const refreshAutomaticNotifications = () => ensureAutomaticNotifications();
    refreshAutomaticNotifications();
    const interval = window.setInterval(refreshAutomaticNotifications, 30_000);
    window.addEventListener("focus", refreshAutomaticNotifications);
    window.addEventListener("visibilitychange", refreshAutomaticNotifications);
    window.addEventListener(SETTINGS_CHANGED, refreshAutomaticNotifications);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshAutomaticNotifications);
      window.removeEventListener("visibilitychange", refreshAutomaticNotifications);
      window.removeEventListener(SETTINGS_CHANGED, refreshAutomaticNotifications);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/login") return;
    const respondToInteraction = (event: MouseEvent) => {
      if (!loadSettings().sounds || !navigator.vibrate) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest<HTMLElement>("button, a, [role='switch']");
      if (
        !control ||
        control.matches(":disabled") ||
        control.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }
      navigator.vibrate(10);
    };
    window.addEventListener("click", respondToInteraction);
    return () => window.removeEventListener("click", respondToInteraction);
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const showScrollbar = () => {
      document.documentElement.classList.add("is-scrolling");
      clearTimeout(timer);
      timer = setTimeout(() => document.documentElement.classList.remove("is-scrolling"), 700);
    };
    window.addEventListener("scroll", showScrollbar, { passive: true });
    return () => {
      window.removeEventListener("scroll", showScrollbar);
      clearTimeout(timer);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AudioPlayerProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AudioPlayerProvider>
    </QueryClientProvider>
  );
}
