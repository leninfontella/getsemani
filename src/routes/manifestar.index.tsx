import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { addCustomGoal, manifestGoals } from "@/lib/goals";
import universe from "@/assets/goal-universe.png";
import homeHero from "@/assets/home-hero.png";
import { AppNav, BrandLogo } from "@/components/AppShell";

export const Route = createFileRoute("/manifestar/")({
  head: () => ({
    meta: [
      { title: "Escolha sua Manifestação — Getsêmani" },
      {
        name: "description",
        content: "Escolha o que deseja manifestar hoje: casa, paz, carreira ou viagem.",
      },
      { property: "og:title", content: "Escolha sua Manifestação — Getsêmani" },
      { property: "og:description", content: "Escolha o que deseja manifestar hoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChooseGoal,
});

function ChooseGoal() {
  const navigate = useNavigate();
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const createCustom = () => {
    const title = customName.trim();
    if (!title) return;
    const goal = addCustomGoal(title);
    navigate({ to: "/manifestar/$goal", params: { goal: goal.id }, search: { historico: false } });
  };
  return (
    <div className="manifest-picker min-h-screen g-space font-sans-g text-g-text flex justify-center">
      <div className="manifest-picker-page w-full max-w-[430px] min-h-screen g-stars pb-32">
        <header className="home-hero relative flex h-[320px] flex-col items-center px-6 pt-5 text-center">
          <div
            className="hero-landscape absolute inset-0"
            style={{ backgroundImage: `url(${homeHero})` }}
            aria-hidden="true"
          />
          <Link
            to="/"
            aria-label="Voltar"
            className="g-glass absolute left-6 top-7 z-10 grid h-11 w-11 place-items-center rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <BrandLogo className="relative z-10 h-[176px] w-[320px]" />
          <h2 className="font-serif-g relative z-10 mt-1 text-[2rem] font-semibold leading-[1.05]">
            O que você deseja
            <br />
            manifestar hoje?
          </h2>
          <p className="relative z-10 mt-3 text-sm text-g-muted">
            Escolha e escreva como se já fosse seu.
          </p>
        </header>
        <div className="manifest-picker-grid mt-6 space-y-4 px-6">
          {manifestGoals.map((g) => (
            <Link
              key={g.id}
              to="/manifestar/$goal"
              params={{ goal: g.id }}
              search={{ historico: false }}
              className="flex items-center gap-4 rounded-2xl border border-g-violet/50 g-glass p-3 transition hover:border-g-gold active:scale-[0.98]"
            >
              <img
                src={g.img}
                alt={g.title}
                loading="lazy"
                width={816}
                height={816}
                className="h-20 w-20 rounded-xl object-cover shrink-0"
              />
              <span className="min-w-0 flex-1 text-lg font-semibold">{g.title}</span>
              <ChevronRight className="h-5 w-5 text-g-gold shrink-0" />
            </Link>
          ))}
          <button
            onClick={() => setShowCustom((value) => !value)}
            className="w-full flex items-center gap-4 rounded-2xl border border-dashed border-g-gold/60 g-glass p-4 text-left transition hover:border-g-gold active:scale-[0.98]"
          >
            <span className="relative h-20 w-20 overflow-hidden rounded-xl shrink-0">
              <img src={universe} alt="Universo místico" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-g-bg/20">
                <Plus className="h-8 w-8 text-white" />
              </span>
            </span>
            <span className="min-w-0 flex-1 text-lg font-semibold">Outras Manifestações</span>
            <ChevronRight className="h-5 w-5 text-g-gold shrink-0" />
          </button>
          {showCustom && (
            <div className="rounded-2xl border border-g-violet/50 g-glass p-4">
              <label htmlFor="custom-goal" className="text-sm font-medium">
                Qual é a sua manifestação?
              </label>
              <input
                id="custom-goal"
                autoFocus
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createCustom()}
                placeholder="Ex.: Meu novo projeto"
                className="g-glass mt-3 w-full rounded-xl border border-g-muted/30 px-4 py-3 outline-none focus:border-g-gold"
              />
              <button
                onClick={createCustom}
                disabled={!customName.trim()}
                className="g-cta mt-3 w-full rounded-full py-3 font-bold text-g-bg flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Continuar <Sparkles className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <AppNav mobileOnly />
    </div>
  );
}
