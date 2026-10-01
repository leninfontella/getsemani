import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Home, Eye, PersonStanding, BookOpen, Settings, Sparkles, Menu, X, Plus, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { LiquidConfirmDialog } from "@/components/LiquidConfirmDialog";
import { logoutUser, clearCachedUser } from "@/lib/auth";
import { clearAll } from "@/lib/goals";
import { clearNotifications } from "@/lib/notifications";
import logo from "@/assets/getsemani-logo.png";
import homeHero from "@/assets/home-hero.png";

interface NavItem {
  to: string;
  label: string;
  Icon: typeof Home;
  isAction?: boolean;
  desktopOnly?: boolean;
}

const nav: readonly NavItem[] = [
  { to: "/", label: "Início", Icon: Home },
  { to: "/visualizar", label: "Visualizar", Icon: Eye },
  { to: "/manifestar", label: "Manifestar", Icon: Plus, isAction: true },
  { to: "/meditar", label: "Meditar", Icon: PersonStanding },
  { to: "/diario", label: "Diário", Icon: BookOpen },
  { to: "/configuracoes", label: "Ajustes", Icon: Settings, desktopOnly: true },
];

export function GoalThumb({
  img,
  title,
  className = "",
}: {
  img: string | undefined;
  title: string;
  className?: string;
}) {
  return img ? (
    <img
      src={img}
      alt={title}
      loading="lazy"
      width={816}
      height={816}
      className={`object-cover ${className}`}
    />
  ) : (
    <div className={`g-cta grid place-items-center text-g-bg ${className}`}>
      <Sparkles className="h-7 w-7" />
    </div>
  );
}

export function BrandLogo({ className = "" }: { className?: string }) {
  return <img src={logo} alt="Getsêmani" className={`object-contain ${className}`} />;
}

export function AppNav({ mobileOnly = false }: { mobileOnly?: boolean }) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } finally {
      clearAll();
      clearNotifications();
      clearCachedUser();
      window.location.replace("/login");
    }
  };

  // Volta ao tamanho normal ao navegar entre rotas
  useEffect(() => {
    setIsCompact(false);
  }, [pathname]);

  useEffect(() => {
    if (!desktopOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDesktopOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [desktopOpen]);

  // Redução de tamanho da navbar mobile ao rolar para baixo, expansão ao rolar para cima
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;

    const handleScroll = () => {
      if (typeof window === "undefined" || window.innerWidth >= 1024) {
        setIsCompact((prev) => (prev ? false : prev));
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = Math.max(0, window.scrollY);

          // Próximo ao topo da página: sempre tamanho normal
          if (currentScrollY <= 24) {
            setIsCompact(false);
            lastScrollY = currentScrollY;
            ticking = false;
            return;
          }

          // Previne falso positivo no bounce/rubber-banding inferior do iOS
          const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
          if (maxScrollY > 0 && currentScrollY >= maxScrollY - 10) {
            ticking = false;
            return;
          }

          const diff = currentScrollY - lastScrollY;

          // Limiar para suavizar micro-movimentos
          if (diff > 10) {
            setIsCompact(true);
          } else if (diff < -10) {
            setIsCompact(false);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCompact(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className={`app-nav-trigger ${mobileOnly ? "is-mobile-only" : ""}`}
        aria-label="Abrir menu principal"
        aria-expanded={desktopOpen}
        aria-controls="app-navigation"
        onClick={() => setDesktopOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </button>
      <nav
        id="app-navigation"
        className={`app-nav ${isCompact ? "is-compact" : ""} ${desktopOpen ? "is-open" : ""} ${mobileOnly ? "is-mobile-only" : ""} fixed z-20 grid grid-cols-5 rounded-[26px] p-2`}
        aria-label="Navegação principal"
      >
        <button
          type="button"
          className="app-nav-close"
          aria-label="Fechar menu principal"
          onClick={() => setDesktopOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <Link
          to="/"
          className="app-nav-brand"
          aria-label="Getsêmani - início"
          onClick={() => setDesktopOpen(false)}
        >
          <BrandLogo className="h-24 w-full" />
          <span>Seu espaço de intenção</span>
        </Link>
        {nav.map(({ to, label, Icon, isAction, desktopOnly }) => (
          <Link
            key={to}
            to={to}
            title={label}
            aria-label={label}
            activeOptions={{ exact: true }}
            onClick={() => setDesktopOpen(false)}
            className={`app-nav-item ${desktopOnly ? "app-nav-desktop-only" : ""} ${isAction ? "app-nav-action" : ""} group flex min-h-14 min-w-11 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs text-g-muted transition-all duration-300 data-[status=active]:bg-white/[0.07] data-[status=active]:text-g-gold`}
          >
            {isAction ? (
              <span className="app-nav-action-btn" aria-hidden="true">
                <Icon className="h-4 w-4 stroke-[2.5]" />
              </span>
            ) : (
              <Icon className="app-nav-icon h-[22px] w-[22px] stroke-[1.8] transition-transform group-data-[status=active]:scale-105" />
            )}
            <span className="app-nav-label">{label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => {
            setDesktopOpen(false);
            setConfirmLogout(true);
          }}
          className="app-nav-logout"
          aria-label="Sair da conta"
          title="Sair da conta"
        >
          <LogOut className="h-4 w-4 stroke-[1.8]" />
          <span>Sair</span>
        </button>
      </nav>
      <LiquidConfirmDialog
        open={confirmLogout}
        icon={<LogOut className="h-7 w-7" />}
        title="Deseja realmente sair?"
        description="Você precisará entrar novamente para acessar seus registros e metas."
        confirmLabel="Sair da conta"
        loading={loggingOut}
        destructive
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen g-space font-sans-g text-g-text flex justify-center">
      <Toaster />
      <AppNav />
      <div className="app-page page-enter relative w-full max-w-[430px] min-h-screen g-stars pb-32">
        {title && (
          <header className="home-hero relative flex h-[290px] flex-col items-center justify-center px-6 text-center">
            <div
              className="hero-landscape absolute inset-0"
              style={{ backgroundImage: `url(${homeHero})` }}
              aria-hidden="true"
            />
            <BrandLogo className="app-shell-hero-logo relative z-10 h-[220px] w-[400px] max-w-full" />
            <h1 className="font-serif-g relative z-10 -mt-5 text-3xl font-semibold">{title}</h1>
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
