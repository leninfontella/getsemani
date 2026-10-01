import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Plus, Search, Sparkles } from "lucide-react";
import { addCustomGoal, manifestGoals } from "@/lib/goals";
import otherManifestations from "@/assets/goal-other-manifestations.jpg";
import homeHero from "@/assets/home-hero.png";
import { AppNav, BackButton, BrandLogo } from "@/components/AppShell";

const goalGroups = [
  {
    title: "Prosperidade e carreira",
    ids: [
      "dinheiro",
      "carreira",
      "proprio-negocio",
      "liberdade-financeira",
      "dividas-quitadas",
      "reconhecimento-influencia",
    ],
  },
  {
    title: "Relações",
    ids: [
      "amor",
      "casamento-parceria",
      "maternidade-paternidade",
      "familia-unida",
      "amizades-verdadeiras",
      "perdao-libertacao",
    ],
  },
  {
    title: "Corpo e mente",
    ids: [
      "saude",
      "alimentacao-saudavel",
      "corpo-dos-sonhos",
      "energia-disposicao",
      "sono-descanso",
      "libertacao-habitos",
    ],
  },
  {
    title: "Espiritual",
    ids: ["paz", "gratidao", "fe-proposito", "protecao", "conexao-com-deus"],
  },
  {
    title: "Crescimento pessoal",
    ids: ["autoconfianca", "criatividade", "novo-idioma-talento", "aprovacao-concurso"],
  },
  {
    title: "Sonhos e estilo de vida",
    ids: ["casa", "carro-novo", "viagem", "morar-exterior", "casa-praia-campo"],
  },
] as const;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

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
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState("Todas");

  const normalizedQuery = normalizeText(query.trim());
  const visibleGroups = goalGroups
    .filter((group) => activeGroup === "Todas" || group.title === activeGroup)
    .map((group) => ({
      ...group,
      goals: group.ids
        .map((id) => manifestGoals.find((goal) => goal.id === id))
        .filter((goal) => goal && normalizeText(goal.title).includes(normalizedQuery)),
    }))
    .filter((group) => group.goals.length > 0);
  const showCustomCard =
    activeGroup === "Todas" && normalizeText("Outras Manifestações").includes(normalizedQuery);

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
          <BackButton className="absolute left-6 top-7 z-10" />
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
        <div className="manifest-picker-tools mt-6 px-6">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-g-muted"
              aria-hidden="true"
            />
            <span className="sr-only">Buscar manifestação</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar manifestação"
              className="manifest-search g-glass w-full rounded-full border border-white/15 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-g-muted focus:border-g-gold"
            />
          </label>
          <div
            className="manifest-group-chips mt-3 flex gap-2 overflow-x-auto pb-2"
            aria-label="Grupos"
          >
            {["Todas", ...goalGroups.map((group) => group.title)].map((group) => (
              <button
                key={group}
                type="button"
                aria-pressed={activeGroup === group}
                onClick={() => setActiveGroup(group)}
                className="manifest-group-chip shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition"
              >
                {group}
              </button>
            ))}
          </div>
        </div>
        <div className="manifest-picker-grid mt-5 space-y-8 px-6">
          {visibleGroups.map((group) => (
            <section key={group.title} className="manifest-goal-group">
              <h3 className="flex items-baseline gap-2 font-serif-g text-2xl font-semibold text-g-gold">
                {group.title}
                <span className="font-sans-g text-xs font-normal text-g-muted">
                  {group.goals.length}
                </span>
              </h3>
              <div className="manifest-goal-grid mt-3 grid gap-4">
                {group.goals.map((goal) => (
                  <Link
                    key={goal!.id}
                    to="/manifestar/$goal"
                    params={{ goal: goal!.id }}
                    search={{ historico: false }}
                    className="flex items-center gap-4 rounded-2xl border border-g-violet/50 g-glass p-3 transition hover:border-g-gold active:scale-[0.98]"
                  >
                    <img
                      src={goal!.img}
                      alt={goal!.title}
                      loading="lazy"
                      width={816}
                      height={816}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <span className="min-w-0 flex-1 text-lg font-semibold">{goal!.title}</span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-g-gold" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {showCustomCard && (
            <section className="manifest-goal-group" aria-label="Outras manifestações">
              <div className="manifest-goal-grid grid gap-4">
                <button
                  type="button"
                  onClick={() => setShowCustom((value) => !value)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-g-gold/60 g-glass p-3 text-left transition hover:border-g-gold active:scale-[0.98]"
                >
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={otherManifestations}
                      alt="Portal cósmico de novas possibilidades"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-g-bg/15">
                      <Plus className="h-8 w-8 text-white drop-shadow-lg" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 text-lg font-semibold">Outras Manifestações</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-g-gold" />
                </button>
              </div>
            </section>
          )}
          {visibleGroups.length === 0 && !showCustomCard && (
            <p className="py-10 text-center text-sm text-g-muted">
              Nenhuma manifestação encontrada. Tente outra palavra ou escolha “Outras
              Manifestações”.
            </p>
          )}
          {showCustomCard && showCustom && (
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
