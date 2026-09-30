import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Headphones,
  LoaderCircle,
  Music2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Volume2,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import rainAudio from "@/assets/Chuva tranquila.mp3";
import bowlsAudio from "@/assets/Tigelas Tibetanas.mp3";
import frequency432Audio from "@/assets/432 Hz  Music.mp3";
import frequency528Audio from "@/assets/528 Hz Music.mp3";

export const Route = createFileRoute("/meditar")({ component: MeditatePage });

const sounds = [
  {
    id: "rain",
    title: "Chuva tranquila",
    detail: "Som da natureza",
    src: rainAudio,
    Icon: Headphones,
  },
  {
    id: "bowls",
    title: "Tigelas tibetanas",
    detail: "Meditação profunda",
    src: bowlsAudio,
    Icon: Music2,
  },
  {
    id: "432-hz",
    title: "Frequência 432 Hz",
    detail: "Harmonia e equilíbrio",
    src: frequency432Audio,
    Icon: Waves,
  },
  {
    id: "528-hz",
    title: "Frequência 528 Hz",
    detail: "Transformação e amor",
    src: frequency528Audio,
    Icon: Radio,
  },
] as const;

type Sound = (typeof sounds)[number];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

function MeditatePage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeSound, setActiveSound] = useState<Sound>();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  const toggleSound = async (sound: Sound) => {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");

    if (activeSound?.id !== sound.id) {
      setActiveSound(sound);
      setCurrentTime(0);
      setDuration(0);
      setLoading(true);
      audio.src = sound.src;
      audio.load();
      try {
        await audio.play();
      } catch {
        setLoading(false);
        setError("Não foi possível reproduzir esta faixa.");
      }
      return;
    }

    if (audio.paused) {
      setLoading(true);
      try {
        await audio.play();
      } catch {
        setLoading(false);
        setError("Não foi possível continuar a reprodução.");
      }
    } else {
      audio.pause();
    }
  };

  const toggleActiveSound = () => {
    if (activeSound) void toggleSound(activeSound);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    void audio.play();
  };

  return (
    <AppShell title="Meditar">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadStart={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => {
          setPlaying(true);
          setLoading(false);
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setPlaying(false);
          setLoading(false);
          setError("Não foi possível carregar esta faixa.");
        }}
      />

      <main className="mt-6 px-6">
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
              onChange={(event) => {
                const nextTime = Number(event.target.value);
                if (audioRef.current) audioRef.current.currentTime = nextTime;
                setCurrentTime(nextTime);
              }}
              aria-label="Progresso da faixa"
              className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--g-gold)] disabled:opacity-35"
            />
            <span className="w-10 text-[10px] text-g-muted">{formatTime(duration)}</span>
          </div>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        </div>

        <div className="mt-6 space-y-3">
          {sounds.map((sound) => {
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
