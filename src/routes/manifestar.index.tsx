import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, Sparkles } from "lucide-react";
import { addCustomGoal, manifestGoals } from "@/lib/goals";
import universe from "@/assets/goal-universe.png";
import { BrandLogo } from "@/components/AppShell";

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
    <div className="min-h-screen g-space font-sans-g text-g-text flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen g-stars px-6 pt-8 pb-10">
        <header className="relative flex min-h-[158px] items-center">
          <Link
            to="/"
            aria-label="Voltar"
            className="h-10 w-10 grid place-items-center rounded-full g-glass shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <BrandLogo className="absolute left-1/2 top-0 h-[158px] w-[315px] -translate-x-1/2 rounded-xl" />
        </header>
        <h2 className="mt-8 text-2xl font-semibold leading-snug">
          O que você deseja
          <br />
          manifestar hoje?
        </h2>
        <p className="mt-2 text-sm text-g-muted">Escolha e escreva como se já fosse seu.</p>
        <div className="mt-6 space-y-4">
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
                className="mt-3 w-full rounded-xl border border-g-muted/30 bg-g-bg/50 px-4 py-3 outline-none focus:border-g-gold"
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
    </div>
  );
}
