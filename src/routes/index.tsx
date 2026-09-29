import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Shell } from "lucide-react";
import { AppShell, BrandLogo, GoalThumb } from "@/components/AppShell";
import {
  loadEntries,
  loadSettings,
  manifestedGoals,
  saveSettings,
  syncEntries,
  type Goal,
} from "@/lib/goals";
import { loadUser, refreshCachedUser } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Getsêmani — Painel de Manifestação" }] }),
  component: HomePage,
});

function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState("Amelia");
  const [welcome, setWelcome] = useState("Bem-vindo(a)");
  const [days, setDays] = useState(0);
  const [practiceDates, setPracticeDates] = useState<Set<string>>(new Set());
  const [week, setWeek] = useState<{ label: string; key: string; today: boolean }[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselDrag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  useEffect(() => {
    const cachedUser = loadUser();
    setGoals(manifestedGoals());
    setName(cachedUser?.name || loadSettings().name);
    const gender = cachedUser?.gender;
    setWelcome(
      gender === "masculino" ? "Bem-vindo" : gender === "feminino" ? "Bem-vinda" : "Bem-vindo(a)",
    );
    const dates = new Set(
      Object.values(loadEntries())
        .flat()
        .map((e) => new Date(e.date).toLocaleDateString("pt-BR")),
    );
    setDays(dates.size);
    setPracticeDates(dates);
    const now = new Date();
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekdayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
    setWeek(
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return {
          label: weekdayLabels[index]!,
          key: date.toLocaleDateString("pt-BR"),
          today: date.toDateString() === now.toDateString(),
        };
      }),
    );
    void syncEntries()
      .then((remote) => {
        setGoals(manifestedGoals());
        const remoteDates = new Set(
          Object.values(remote)
            .flat()
            .map((entry) => new Date(entry.date).toLocaleDateString("pt-BR")),
        );
        setDays(remoteDates.size);
        setPracticeDates(remoteDates);
      })
      .catch(() => undefined);
    void refreshCachedUser()
      .then((user) => {
        setName(user.name);
        setWelcome(
          user.gender === "masculino"
            ? "Bem-vindo"
            : user.gender === "feminino"
              ? "Bem-vinda"
              : "Bem-vindo(a)",
        );
        saveSettings({ ...loadSettings(), name: user.name });
      })
      .catch(() => undefined);
  }, []);
  const today = new Date()
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    .replace(".", "");
  const dayLabel = days === 1 ? "dia" : "dias";
  const moveCarousel = (direction: -1 | 1) => {
    carouselRef.current?.scrollBy({ left: direction * 164, behavior: "smooth" });
  };
  const startCarouselDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || !carouselRef.current) return;
    carouselDrag.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: carouselRef.current.scrollLeft,
    };
  };
  const dragCarousel = (event: PointerEvent<HTMLDivElement>) => {
    const drag = carouselDrag.current;
    if (!drag.active || !carouselRef.current) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 8 && !drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!drag.moved) return;
    carouselRef.current.scrollLeft = drag.scrollLeft - distance;
  };
  const stopCarouselDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!carouselDrag.current.active) return;
    carouselDrag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <AppShell>
      <header className="relative flex min-h-[180px] items-center justify-between px-6 pt-8">
        <span className="text-xs text-g-muted">Hoje, {today}</span>
        <BrandLogo className="absolute left-1/2 top-8 h-[180px] w-[315px] -translate-x-1/2 rounded-xl" />
        <div className="h-11 w-11 rounded-full p-[2px] g-cta">
          <div className="h-full w-full rounded-full bg-g-bg grid place-items-center font-bold text-g-gold">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>
      <section className="px-6 mt-8">
        <h2 className="text-2xl font-semibold leading-snug">
          {welcome}, {name} <span className="text-g-gold">✨</span>
          <br />
          Sua realidade te aguarda.
        </h2>
      </section>
      <section className="journey-card mx-6 mt-6 rounded-3xl border border-g-violet p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Sua Jornada</h3>
          <ChevronRight className="h-5 w-5 text-g-muted" />
        </div>
        <div className="mt-4 flex items-center gap-5">
          <div className="journey-ring relative grid h-28 w-28 shrink-0 place-items-center rounded-full">
            <div className="grid h-[86px] w-[86px] place-content-center rounded-full bg-[#222336]/90 text-center">
              <strong className="text-3xl leading-none">{days}</strong>
              <span className="mt-1 text-sm text-g-muted">{dayLabel}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Prática Diária</p>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {week.map((day) => {
                const completed = practiceDates.has(day.key);
                return (
                  <div key={day.key} className="flex flex-col items-center gap-2">
                    <span className={`text-xs ${day.today ? "text-g-gold" : "text-g-muted"}`}>
                      {day.label}
                    </span>
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-lg border ${completed ? "border-g-violet/60 bg-g-violet/20 text-g-gold" : day.today ? "g-cta border-transparent" : "border-g-muted/25 bg-white/5"}`}
                    >
                      {completed && <Check className="h-4 w-4" />}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 whitespace-nowrap text-[11px] text-g-muted">
              Sequência: {days} {dayLabel} <span className="text-g-gold">| brilho ativo</span>
            </p>
          </div>
        </div>
      </section>
      <section className="mt-7">
        <div className="flex items-center justify-between px-6">
          <div>
            <h3 className="text-lg font-semibold">Minhas Manifestações</h3>
            <p className="text-xs text-g-muted">Metas Visualizadas</p>
          </div>
          <div className="flex items-center gap-1">
            {goals.length > 1 && (
              <>
                <button
                  onClick={() => moveCarousel(-1)}
                  aria-label="Manifestação anterior"
                  className="hidden h-8 w-8 place-items-center rounded-full border border-g-muted/20 text-g-muted md:grid"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveCarousel(1)}
                  aria-label="Próxima manifestação"
                  className="hidden h-8 w-8 place-items-center rounded-full border border-g-muted/20 text-g-gold md:grid"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            <Link to="/visualizar" aria-label="Ver todas" className="ml-1">
              <ChevronRight className="h-5 w-5 text-g-gold" />
            </Link>
          </div>
        </div>
        {goals.length ? (
          <div
            ref={carouselRef}
            onPointerDown={startCarouselDrag}
            onPointerMove={dragCarousel}
            onPointerUp={stopCarouselDrag}
            onPointerCancel={stopCarouselDrag}
            onClickCapture={(event) => {
              if (!carouselDrag.current.moved) return;
              event.preventDefault();
              event.stopPropagation();
              carouselDrag.current.moved = false;
            }}
            onDragStart={(event) => event.preventDefault()}
            className="manifestation-carousel mt-3 flex cursor-grab snap-x snap-mandatory select-none gap-3 overflow-x-auto px-6 pb-3 active:cursor-grabbing [scrollbar-width:none]"
          >
            {goals.map((goal) => (
              <Link
                key={goal.id}
                to="/manifestar/$goal"
                params={{ goal: goal.id }}
                search={{ historico: true }}
                className="w-[145px] shrink-0 snap-start rounded-2xl border border-g-violet/50 g-glass p-2"
              >
                <GoalThumb img={goal.img} title={goal.title} className="h-28 w-full rounded-xl" />
                <p className="p-2 text-sm font-semibold leading-tight">{goal.title}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mx-6 mt-3 rounded-2xl border border-dashed border-g-muted/30 p-5 text-center text-sm text-g-muted">
            Suas manifestações aparecerão aqui depois que você escrever a primeira.
          </div>
        )}
      </section>
      <div className="px-8 mt-8">
        <Link
          to="/manifestar"
          className="manifest-now w-full rounded-full py-5 text-lg font-extrabold tracking-wide text-[#251536] flex items-center justify-center gap-3 active:scale-95 transition"
        >
          MANIFESTAR AGORA <Shell className="h-7 w-7 stroke-[2.4]" />
        </Link>
      </div>
    </AppShell>
  );
}
