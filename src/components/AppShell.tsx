import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Eye, PersonStanding, BookOpen, Settings, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/getsemani-logo.png";

const nav = [
  { to: "/", label: "Início", Icon: Home },
  { to: "/visualizar", label: "Visualizar", Icon: Eye },
  { to: "/meditar", label: "Meditar", Icon: PersonStanding },
  { to: "/diario", label: "Diário", Icon: BookOpen },
  { to: "/configuracoes", label: "Configurações", Icon: Settings },
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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-20 w-full max-w-[430px] rounded-t-3xl g-glass border-t border-g-muted/20 px-2 pt-3 pb-6 grid grid-cols-5">
      {nav.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true }}
          className="group flex flex-col items-center gap-1 text-[11px] text-g-muted data-[status=active]:text-g-gold"
        >
          <Icon className="h-6 w-6" />
          {label}
          <span className="h-0.5 w-6 rounded-full bg-transparent group-data-[status=active]:bg-g-gold" />
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen g-space font-sans-g text-g-text flex justify-center">
      <Toaster />
      <div className="relative w-full max-w-[430px] min-h-screen g-stars pb-32">
        {title && (
          <header className="px-6 pt-8 text-center">
            <BrandLogo className="mx-auto h-[158px] w-[315px] rounded-xl" />
            <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
          </header>
        )}
        {children}
        <AppNav />
      </div>
    </div>
  );
}
