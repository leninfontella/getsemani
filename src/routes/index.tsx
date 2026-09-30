import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Check, ChevronRight, Shell, Sparkles } from "lucide-react";
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
import homeHero from "@/assets/home-hero.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Getsêmani — Painel de Manifestação" }] }),
  component: HomePage,
});

function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState("Amelia");
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [welcome, setWelcome] = useState("Bem-vindo(a)");
  const [days, setDays] = useState(0);
  const [practiceDates, setPracticeDates] = useState<Set<string>>(new Set());
  const [week, setWeek] = useState<{ label: string; key: string; today: boolean }[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [activeManifestation, setActiveManifestation] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselDrag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  useEffect(() => {
    const cachedUser = loadUser();
    setGoals(manifestedGoals());
    setName(cachedUser?.name || loadSettings().name);
    setAvatarUrl(cachedUser?.avatarUrl);
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
      .catch(() => undefined)
      .finally(() => setIsSyncing(false));
    void refreshCachedUser()
      .then((user) => {
        setName(user.name);
        setAvatarUrl(user.avatarUrl);
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
  const journeyProgress = days === 0 ? 0 : (((days - 1) % 7) + 1) / 7;
  const ringCircumference = 301.6;
  const ringEndAngle = Math.PI * 2 * journeyProgress;
  const ringEndX = 56 + 48 * Math.cos(ringEndAngle);
  const ringEndY = 56 + 48 * Math.sin(ringEndAngle);
  const updateManifestationIndicator = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const cards = Array.from(carousel.querySelectorAll<HTMLElement>(".manifestation-card"));
    if (!cards.length) return;
    const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;
    const closestIndex = cards.reduce((closest, card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const closestCard = cards[closest]!;
      const closestCenter = closestCard.offsetLeft + closestCard.offsetWidth / 2;
      return Math.abs(cardCenter - carouselCenter) < Math.abs(closestCenter - carouselCenter)
        ? index
        : closest;
    }, 0);
    setActiveManifestation(closestIndex);
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
      <header className="home-hero relative flex h-[320px] flex-col items-center px-6 pt-5">
        <div
          className="hero-landscape absolute inset-0"
          style={{ backgroundImage: `url(${homeHero})` }}
          aria-hidden="true"
        />
        <span className="absolute left-6 top-7 z-10 text-xs font-medium text-white/80">
          Hoje, {today}
        </span>
        <BrandLogo className="relative z-10 mt-1 h-[176px] w-[320px]" />
        <h2 className="font-serif-g relative z-10 mt-2 self-start text-left text-[2rem] font-semibold leading-[1.05]">
          <span className="inline-flex items-center gap-2">
            {welcome}, {name}
            <Sparkles className="h-5 w-5 shrink-0 text-g-gold" aria-hidden="true" />
          </span>
          <br />
          Sua realidade te aguarda.
        </h2>
      </header>
      <div
        className="hero-avatar mx-auto mt-4 grid aspect-square w-[50vw] max-w-[215px] place-items-center rounded-full p-1"
        aria-label={`Avatar de ${name}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Foto de ${name}`}
            className="h-full w-full rounded-full border border-white/20 object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center rounded-full border border-white/20 bg-[#161225]/75 font-serif-g text-7xl font-semibold text-g-gold backdrop-blur-xl">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <section className="journey-card glass-level-2 mx-6 mt-6 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif-g text-2xl font-semibold">Sua Jornada</h3>
          <ChevronRight className="h-5 w-5 text-g-muted" />
        </div>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative grid h-28 w-28 shrink-0 place-items-center">
            <svg
              className="journey-progress absolute inset-0 -rotate-90"
              viewBox="0 0 112 112"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="journeyGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fff0aa" />
                  <stop offset=".55" stopColor="#d8a94e" />
                  <stop offset="1" stopColor="#9d6af5" />
                </linearGradient>
              </defs>
              <circle cx="56" cy="56" r="48" className="journey-progress-track" />
              <circle
                cx="56"
                cy="56"
                r="48"
                className="journey-progress-value"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - journeyProgress)}
              />
              {journeyProgress > 0 && (
                <circle cx={ringEndX} cy={ringEndY} r="4.5" className="journey-progress-end" />
              )}
            </svg>
            <div className="glass-level-1 grid h-[82px] w-[82px] place-content-center rounded-full text-center">
              <strong className="text-3xl leading-none">{days}</strong>
              <span className="mt-1 text-sm text-g-muted">{dayLabel}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 self-center">
            <p className="font-semibold text-g-text">Prática Diária</p>
            <p className="mt-2 text-xs text-g-muted">
              Sequência: {days} {dayLabel} <span className="text-g-gold">| brilho ativo</span>
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {week.map((day) => {
            const completed = practiceDates.has(day.key);
            return (
              <div key={day.key} className="flex min-w-0 flex-col items-center gap-2">
                <span
                  className={`text-xs font-medium ${day.today ? "text-g-gold" : "text-g-muted"}`}
                >
                  {day.label}
                </span>
                <span
                  className={`day-chip grid h-11 w-full max-w-11 place-items-center rounded-full ${completed ? "is-complete text-g-gold" : day.today ? "is-today text-g-bg" : ""}`}
                >
                  {completed && <Check className="h-4 w-4" />}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="mt-7">
        <div className="flex items-center justify-between px-6">
          <div>
            <h3 className="font-serif-g text-2xl font-semibold">Minhas Manifestações</h3>
            <p className="text-xs text-g-muted">Metas visualizadas</p>
          </div>
          <div className="flex items-center">
            <Link
              to="/visualizar"
              className="flex min-h-11 items-center gap-0.5 rounded-full px-2 text-sm font-semibold text-g-gold"
            >
              Ver tudo <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        {isSyncing && goals.length === 0 ? (
          <div
            className="mt-3 flex gap-3 overflow-hidden px-6"
            aria-label="Carregando manifestações"
          >
            {[0, 1, 2].map((item) => (
              <div key={item} className="skeleton-card h-44 w-[154px] shrink-0 rounded-2xl" />
            ))}
          </div>
        ) : goals.length ? (
          <>
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
              onScroll={updateManifestationIndicator}
              className="manifestation-carousel mt-3 flex cursor-grab snap-x snap-mandatory scroll-px-6 select-none gap-3 overflow-x-auto px-6 pb-3 active:cursor-grabbing [scrollbar-width:none]"
            >
              {goals.map((goal) => (
                <Link
                  key={goal.id}
                  to="/manifestar/$goal"
                  params={{ goal: goal.id }}
                  search={{ historico: true }}
                  className="manifestation-card glass-level-1 relative h-48 w-[154px] shrink-0 snap-start overflow-hidden rounded-2xl"
                >
                  <GoalThumb
                    img={goal.img}
                    title={goal.title}
                    className="absolute inset-0 h-full w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080711] via-[#080711]/25 to-transparent" />
                  <p className="absolute inset-x-0 bottom-0 p-4 text-base font-semibold leading-tight text-white">
                    {goal.title}
                  </p>
                </Link>
              ))}
            </div>
            {goals.length > 1 && (
              <div
                className="manifestation-dots mt-1 flex justify-center gap-2"
                aria-label={`Manifestação ${activeManifestation + 1} de ${goals.length}`}
              >
                {goals.map((goal, index) => (
                  <button
                    key={goal.id}
                    type="button"
                    className={`manifestation-dot ${index === activeManifestation ? "is-active" : ""}`}
                    aria-label={`Ir para manifestação ${index + 1}`}
                    aria-current={index === activeManifestation ? "true" : undefined}
                    onClick={() => {
                      const card =
                        carouselRef.current?.querySelectorAll<HTMLElement>(".manifestation-card")[
                          index
                        ];
                      card?.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "center",
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="g-glass mx-6 mt-3 rounded-2xl border border-dashed border-g-muted/30 p-5 text-center text-sm text-g-muted">
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
