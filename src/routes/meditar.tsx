import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, Pause, Play, RotateCcw, Volume2, Waves } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { meditationSounds, useAudioPlayer } from "@/components/AudioPlayerProvider";

export const Route = createFileRoute("/meditar")({ component: MeditatePage });

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

function MeditatePage() {
  const {
    activeSound,
    playing,
    loading,
    currentTime,
    duration,
    error,
    toggleSound,
    toggleActiveSound,
    restart,
    seek,
  } = useAudioPlayer();

  return (
    <AppShell title="Meditar">
      <main className="desktop-content mt-6 px-6">
        <div className="g-glass rounded-3xl border border-g-gold/40 p-6 text-center">
          <button
            type="button"
            onClick={toggleActiveSound}
            disabled={!activeSound || loading}
            aria-label={playing ? "Pausar meditação" : "Reproduzir meditação"}
            className={`mx-auto grid h-24 w-24 place-items-center rounded-full border border-g-violet/50 text-g-gold shadow-[0_0_35px_var(--g-violet)] transition active:scale-95 disabled:cursor-default ${playing ? "bg-g-violet/25" : ""}`}
          >
            {loading ? (
              <LoaderCircle className="h-10 w-10 animate-spin" />
            ) : playing ? (
              <Pause className="h-10 w-10 fill-current" />
            ) : activeSound ? (
              <Play className="ml-1 h-10 w-10 fill-current" />
            ) : (
              <Waves className="h-10 w-10" />
            )}
          </button>
          <h2 className="mt-5 text-xl font-semibold">
            {activeSound?.title || "Encontre sua frequência"}
          </h2>
          <p className="mt-2 text-sm text-g-muted">
            {activeSound?.detail || "Escolha um som para acompanhar sua prática."}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={restart}
              disabled={!activeSound}
              aria-label="Reiniciar faixa"
              title="Reiniciar faixa"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-g-muted disabled:opacity-35"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="w-10 text-right text-[10px] text-g-muted">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(currentTime, duration || 0)}
              disabled={!activeSound || !duration}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label="Progresso da faixa"
              className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--g-gold)] disabled:opacity-35"
            />
            <span className="w-10 text-[10px] text-g-muted">{formatTime(duration)}</span>
          </div>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        </div>

        <div className="mt-6 space-y-3">
          {meditationSounds.map((sound) => {
            const { id, title, detail, Icon } = sound;
            const active = activeSound?.id === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => void toggleSound(sound)}
                aria-label={`${active && playing ? "Pausar" : "Reproduzir"} ${title}`}
                className={`g-glass flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${active ? "border-g-gold/60 bg-g-violet/10" : "border-g-muted/20"}`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-g-violet/20 text-g-gold">
                  <Icon className={`h-5 w-5 ${active && playing ? "animate-pulse" : ""}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block">{title}</strong>
                  <small className="text-g-muted">{detail}</small>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-g-gold/30 text-g-gold">
                  {active && loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : active && playing ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-g-muted">
          <Volume2 className="h-3.5 w-3.5" /> Use fones de ouvido para uma experiência mais
          imersiva.
        </p>
      </main>
    </AppShell>
  );
}
