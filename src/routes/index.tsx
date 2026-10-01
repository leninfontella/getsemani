import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Check,
  ChevronRight,
  Flame,
  MoonStar,
  Settings,
  Shell,
  Sparkles,
  Sprout,
  Sun,
  X,
} from "lucide-react";
import { AppShell, BrandLogo, GoalThumb } from "@/components/AppShell";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  loadEntries,
  loadSettings,
  manifestedGoals,
  saveSettings,
  syncEntries,
  type Entry,
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
  const [entries, setEntries] = useState<Record<string, Entry[]>>({});
  const [name, setName] = useState("Amelia");
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [avatarOpen, setAvatarOpen] = useState(false);
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
    const cachedEntries = loadEntries();
    setEntries(cachedEntries);
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
        setEntries(remote);
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
  useEffect(() => {
    if (!avatarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAvatarOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [avatarOpen]);
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
  const dayLabel = days === 1 ? "dia" : "dias";
  const achievementDays = [3, 7, 21, 40];
  const nextAchievement = achievementDays.find((milestone) => days < milestone);
  const daysUntilNextAchievement = nextAchievement ? nextAchievement - days : 0;
  const achievementIcons = [Sprout, Flame, MoonStar, Sun];
  const calendarNow = new Date();
  const calendarYear = calendarNow.getFullYear();
  const calendarMonth = calendarNow.getMonth();
  const calendarMonthLabel = calendarNow.toLocaleDateString("pt-BR", { month: "long" });
  const calendarDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarOffset = new Date(calendarYear, calendarMonth, 1).getDay();
  const calendarCells = [
    ...Array.from({ length: calendarOffset }, () => null),
    ...Array.from({ length: calendarDays }, (_, index) => index + 1),
  ];
  const activeDaysThisMonth = Array.from({ length: calendarDays }, (_, index) => index + 1).filter(
    (day) =>
      practiceDates.has(new Date(calendarYear, calendarMonth, day).toLocaleDateString("pt-BR")),
  ).length;
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
      <header className="home-main-hero home-hero relative h-[340px] px-5 pt-3">
        <div
          className="hero-landscape absolute inset-0"
          style={{ backgroundImage: `url(${homeHero})` }}
          aria-hidden="true"
        />
        {avatarOpen && avatarUrl && (
          <div
            className="absolute inset-0 z-30 grid place-items-center bg-black/65 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`Foto de ${name}`}
            onClick={() => setAvatarOpen(false)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/40 text-white"
              aria-label="Fechar foto"
              onClick={() => setAvatarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={avatarUrl}
              alt={`Foto de ${name}`}
              className="h-52 w-52 rounded-full border-2 border-g-gold/60 object-cover shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        )}
        <div className="relative z-20">
          <div className="flex h-32 items-center justify-between">
            <BrandLogo className="-ml-5 h-40 w-40 max-w-none" />
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="hero-profile grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-g-gold/70 bg-[#181322]/80 font-serif-g text-lg font-semibold text-g-gold disabled:cursor-default"
                aria-label={avatarUrl ? "Ampliar foto do perfil" : `Avatar de ${name}`}
                disabled={!avatarUrl}
                onClick={() => setAvatarOpen(true)}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </button>
              <NotificationCenter name={name} />
              <Link
                to="/configuracoes"
                className="relative grid h-11 w-11 place-items-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-g-gold"
                aria-label="Ajustes e configurações"
                title="Ajustes"
              >
                <Settings className="h-6 w-6 stroke-[1.8]" />
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-5 bottom-8 z-10 text-left drop-shadow-[0_2px_8px_rgba(0,0,0,.95)]">
          <p className="mb-2 text-xs font-medium text-white/80">Hoje, {today}</p>
          <h2 className="max-w-[330px] text-[2rem] font-semibold leading-[0.98] text-white">
            {welcome},
            <br />
            {name} <Sparkles className="inline h-5 w-5 text-g-gold" aria-hidden="true" />
          </h2>
          <p className="mt-2 text-[1.05rem] font-medium text-white">Sua realidade te aguarda.</p>
          <p className="mt-1 text-xs text-white/70">Disciplina hoje, resultados amanhã.</p>
        </div>
      </header>
      <section className="journey-card glass-level-2 mx-6 mt-5 rounded-3xl p-5">
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
              Sequência: {days} {dayLabel} <span className="text-g-gold">| Meta diária</span>
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
      <section
        className="journey-insights mx-6 mt-4 space-y-4"
        aria-label="Detalhes da sua jornada"
      >
        <div className="journey-detail-card glass-level-2 rounded-3xl p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif-g text-xl font-semibold">Conquistas</h3>
            {nextAchievement ? (
              <span className="achievement-countdown rounded-full px-2.5 py-1 text-[11px] font-bold">
                {daysUntilNextAchievement === 1
                  ? "Falta 1 dia"
                  : `Faltam ${daysUntilNextAchievement} dias`}
              </span>
            ) : (
              <span className="achievement-countdown rounded-full px-2.5 py-1 text-[11px] font-bold">
                Todas alcançadas
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {achievementDays.map((milestone, index) => {
              const Icon = achievementIcons[index]!;
              const achieved = days >= milestone;
              const isNext = milestone === nextAchievement;
              return (
                <div key={milestone} className="text-center">
                  <div
                    className={`achievement-badge mx-auto grid aspect-[1.35] w-full max-w-16 place-items-center rounded-[50%] ${achieved ? "is-achieved" : ""} ${isNext ? "is-next" : ""}`}
                    aria-label={`${milestone} dias${achieved ? ", conquista alcançada" : isNext ? ", próxima conquista" : ""}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p
                    className={`mt-1.5 text-xs ${achieved || isNext ? "text-g-gold" : "text-g-muted"}`}
                  >
                    {milestone} dias
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="journey-detail-card glass-level-2 rounded-3xl p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif-g text-xl font-semibold capitalize">{calendarMonthLabel}</h3>
            <span className="text-xs font-medium text-[#b9a5ff]">
              {activeDaysThisMonth} {activeDaysThisMonth === 1 ? "dia ativo" : "dias ativos"}
            </span>
          </div>
          <div className="journey-calendar mt-3 grid grid-cols-7 gap-1.5">
            {calendarCells.map((day, index) => {
              const active = day
                ? practiceDates.has(
                    new Date(calendarYear, calendarMonth, day).toLocaleDateString("pt-BR"),
                  )
                : false;
              const todayCell = day === calendarNow.getDate();
              return day ? (
                <span
                  key={day}
                  className={`calendar-day ${active ? "is-active" : ""} ${todayCell ? "is-today" : ""}`}
                  title={`${day} de ${calendarMonthLabel}${active ? " — prática realizada" : ""}`}
                  aria-label={`${day} de ${calendarMonthLabel}${active ? ", prática realizada" : ""}`}
                />
              ) : (
                <span key={`empty-${index}`} className="calendar-day is-empty" aria-hidden="true" />
              );
            })}
          </div>
        </div>

        <div className="journey-detail-card glass-level-2 rounded-3xl p-4">
          <h3 className="font-serif-g text-xl font-semibold">Manifestações em andamento</h3>
          {goals.length ? (
            <div className="mt-3 space-y-3">
              {goals.map((goal) => {
                const current = Math.min(entries[goal.id]?.length || 0, 30);
                return (
                  <Link
                    key={goal.id}
                    to="/manifestar/$goal"
                    params={{ goal: goal.id }}
                    search={{ historico: true }}
                    className="progress-goal block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-g-gold"
                  >
                    <span className="flex items-center justify-between gap-3 text-xs">
                      <strong className="truncate font-semibold text-g-text">{goal.title}</strong>
                      <span className="shrink-0 text-[#b9a5ff]">{current} de 30</span>
                    </span>
                    <span className="progress-track mt-1.5 block h-1.5 overflow-hidden rounded-full">
                      <span
                        className="progress-value block h-full rounded-full"
                        style={{ width: `${(current / 30) * 100}%` }}
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-g-muted">
              Comece uma manifestação para acompanhar seu progresso.
            </p>
          )}
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
      <div className="home-primary-action mt-8 px-8">
        <Link
          to="/manifestar"
          className="manifest-now flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-5 py-3.5 text-lg font-extrabold tracking-wide text-[#251536] transition active:scale-95"
        >
          MANIFESTAR AGORA <Shell className="h-7 w-7 stroke-[2.4]" />
        </Link>
      </div>
    </AppShell>
  );
}
