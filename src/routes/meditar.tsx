import { createFileRoute } from "@tanstack/react-router";
import {
  AudioLines,
  BellRing,
  CloudRain,
  LoaderCircle,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Volume2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  meditationSounds,
  type MeditationSound,
  useAudioPlayer,
} from "@/components/AudioPlayerProvider";

export const Route = createFileRoute("/meditar")({ component: MeditatePage });

const cardPresentation: Record<
  MeditationSound["id"],
  { Icon: typeof CloudRain; category: string; className: string }
> = {
  rain: { Icon: CloudRain, category: "Natureza", className: "is-rain" },
  bowls: { Icon: BellRing, category: "Meditação", className: "is-bowls" },
  "432-hz": { Icon: AudioLines, category: "Frequências", className: "is-432" },
  "528-hz": { Icon: Radio, category: "Frequências", className: "is-528" },
  "anxiety-relief": { Icon: Sparkles, category: "Bem-estar", className: "is-anxiety" },
  "fear-release": { Icon: ShieldCheck, category: "Bem-estar", className: "is-courage" },
};

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

function Equalizer() {
  return (
    <span className="meditation-equalizer" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function MeditatePage() {
  const { activeSound, playing, loading, currentTime, duration, error, toggleSound, seek } =
    useAudioPlayer();

  const selectedSound = activeSound ?? meditationSounds[2];
  const SelectedIcon = cardPresentation[selectedSound.id].Icon;

  return (
    <AppShell title="Meditar">
      <main className="desktop-content meditation-content mt-6 px-5 sm:px-6">
        <section className="meditation-player" aria-label="Player de meditação">
          <button
            type="button"
            onClick={() => void toggleSound(selectedSound)}
            disabled={loading}
            aria-label={playing ? "Pausar meditação" : "Reproduzir meditação"}
            className="meditation-player-cover"
          >
            {loading ? (
              <LoaderCircle className="h-7 w-7 animate-spin" />
            ) : playing ? (
              <Pause className="h-7 w-7 fill-current" />
            ) : (
              <Play className="ml-1 h-7 w-7 fill-current" />
            )}
          </button>

          <div className="meditation-player-body">
            <div className="min-w-0">
              <h2 className="font-serif-g truncate text-[1.35rem] font-semibold leading-tight sm:text-2xl">
                {selectedSound.title}
              </h2>
              <p className="truncate text-xs text-g-muted">{selectedSound.detail}</p>
            </div>

            <div className="meditation-progress-row">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={1}
                value={Math.min(currentTime, duration || 0)}
                disabled={!activeSound || !duration}
                onChange={(event) => seek(Number(event.target.value))}
                aria-label="Progresso da faixa"
                style={
                  {
                    "--progress": duration ? `${(currentTime / duration) * 100}%` : "0%",
                  } as React.CSSProperties
                }
              />
              <span>{duration ? formatTime(duration) : "30:00"}</span>
            </div>
          </div>

          <span className="meditation-volume" aria-hidden="true">
            <Volume2 className="h-5 w-5" />
          </span>
        </section>

        {error && <p className="mt-3 text-center text-xs text-red-300">{error}</p>}

        <div className="meditation-grid">
          {meditationSounds.map((sound) => {
            const active = activeSound?.id === sound.id;
            const presentation = cardPresentation[sound.id];
            const Icon = presentation.Icon;

            return (
              <button
                type="button"
                key={sound.id}
                onClick={() => void toggleSound(sound)}
                aria-label={`${active && playing ? "Pausar" : "Reproduzir"} ${sound.title}`}
                aria-pressed={active}
                className={`meditation-card ${presentation.className} ${active ? "is-active" : ""}`}
              >
                <Icon
                  className={`meditation-card-icon ${active && playing ? "animate-pulse" : ""}`}
                />
                <span className="meditation-card-control">
                  {active && loading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : active && playing ? (
                    <Equalizer />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  )}
                </span>
                <span className="mt-auto block min-w-0">
                  <strong className="block truncate text-[0.95rem] leading-tight">
                    {sound.title}
                  </strong>
                  <small className="mt-0.5 block text-xs text-g-muted">
                    {active && playing ? "Tocando agora" : `${presentation.category} · 30 min`}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
