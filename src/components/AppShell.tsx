import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Eye, PersonStanding, BookOpen, Settings, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/getsemani-logo.png";
import homeHero from "@/assets/home-hero.png";

const nav = [
  { to: "/", label: "Início", Icon: Home },
  { to: "/visualizar", label: "Visualizar", Icon: Eye },
  { to: "/meditar", label: "Meditar", Icon: PersonStanding },
  { to: "/diario", label: "Diário", Icon: BookOpen },
  { to: "/configuracoes", label: "Ajustes", Icon: Settings },
] as const;

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

export function AppNav() {
  return (
    <nav className="app-nav fixed bottom-[calc(.75rem+env(safe-area-inset-bottom))] left-1/2 z-20 grid w-[calc(100%-1.5rem)] max-w-[406px] -translate-x-1/2 grid-cols-5 rounded-[26px] p-2">
      {nav.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true }}
          className="group flex min-h-14 min-w-11 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs text-g-muted transition-all duration-300 data-[status=active]:bg-g-gold/15 data-[status=active]:text-g-gold"
        >
          <Icon className="h-[22px] w-[22px] stroke-[1.8] transition-transform group-data-[status=active]:scale-105" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen g-space font-sans-g text-g-text flex justify-center">
      <Toaster />
      <div className="app-page page-enter relative w-full max-w-[430px] min-h-screen g-stars pb-32">
        {title && (
          <header className="home-hero relative flex h-[240px] flex-col items-center px-6 pt-5 text-center">
            <div
              className="hero-landscape absolute inset-0"
              style={{ backgroundImage: `url(${homeHero})` }}
              aria-hidden="true"
            />
            <BrandLogo className="relative z-10 h-[176px] w-[320px]" />
            <h1 className="font-serif-g relative z-10 -mt-3 text-3xl font-semibold">{title}</h1>
          </header>
        )}
        {children}
        <AppNav />
      </div>
    </div>
  );
}
