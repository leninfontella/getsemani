import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { isAuthenticated } from "../lib/auth";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Getsêmani — Manifeste sua realidade" },
      { name: "description", content: "Manifeste aquilo que deseja, como se já fosse seu." },
      { name: "author", content: "Getsêmani" },
      { name: "theme-color", content: "#12111a" },
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
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (pathname === "/login") return;
    void isAuthenticated().then((authenticated) => {
      if (!authenticated) navigate({ to: "/login", replace: true });
    });
  }, [navigate, pathname]);

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
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
