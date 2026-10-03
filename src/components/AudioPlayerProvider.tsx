import { useRouterState } from "@tanstack/react-router";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Headphones, Music2, Pause, Play, Radio, Square, Waves } from "lucide-react";
import rainAudio from "@/assets/Chuva tranquila.mp3";
import bowlsAudio from "@/assets/Tigelas Tibetanas.mp3";
import frequency432Audio from "@/assets/432 Hz  Music.mp3";
import frequency528Audio from "@/assets/528 Hz Music.mp3";

export const meditationSounds = [
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

export type MeditationSound = (typeof meditationSounds)[number];

type AudioPlayerValue = {
  activeSound: MeditationSound | undefined;
  playing: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  error: string;
  toggleSound: (sound: MeditationSound) => Promise<void>;
  toggleActiveSound: () => void;
  restart: () => void;
  seek: (time: number) => void;
  stop: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerValue | null>(null);

export function useAudioPlayer() {
  const value = useContext(AudioPlayerContext);
  if (!value) throw new Error("useAudioPlayer deve ser usado dentro de AudioPlayerProvider.");
  return value;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLElement>(null);
  const playerDragRef = useRef<{ pointerId: number; offsetY: number }>();
  const [activeSound, setActiveSound] = useState<MeditationSound>();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [playerTop, setPlayerTop] = useState<number>();
  const [draggingPlayer, setDraggingPlayer] = useState(false);

  const startPlayerDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const player = playerRef.current;
    if (!player) return;
    const rect = player.getBoundingClientRect();
    playerDragRef.current = { pointerId: event.pointerId, offsetY: event.clientY - rect.top };
    player.setPointerCapture(event.pointerId);
    setPlayerTop(rect.top);
    setDraggingPlayer(true);
    event.preventDefault();
  };

  const movePlayer = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = playerDragRef.current;
    const player = playerRef.current;
    if (!drag || !player || drag.pointerId !== event.pointerId) return;
    const edge = 8;
    const maximumTop = Math.max(edge, window.innerHeight - player.offsetHeight - edge);
    setPlayerTop(Math.min(maximumTop, Math.max(edge, event.clientY - drag.offsetY)));
  };

  const finishPlayerDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (playerDragRef.current?.pointerId !== event.pointerId) return;
    playerDragRef.current = undefined;
    setDraggingPlayer(false);
    if (playerRef.current?.hasPointerCapture(event.pointerId)) {
      playerRef.current.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    const keepPlayerInViewport = () => {
      const player = playerRef.current;
      if (!player) return;
      setPlayerTop((top) =>
        top === undefined
          ? top
          : Math.min(Math.max(8, window.innerHeight - player.offsetHeight - 8), top),
      );
    };
    window.addEventListener("resize", keepPlayerInViewport);
    return () => window.removeEventListener("resize", keepPlayerInViewport);
  }, []);

  const toggleSound = async (sound: MeditationSound) => {
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

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setActiveSound(undefined);
    setPlaying(false);
    setLoading(false);
    setCurrentTime(0);
    setDuration(0);
    setError("");
  };

  useEffect(() => {
    if (pathname === "/login") stop();
  }, [pathname]);

  const value: AudioPlayerValue = {
    activeSound,
    playing,
    loading,
    currentTime,
    duration,
    error,
    toggleSound,
    toggleActiveSound: () => activeSound && void toggleSound(activeSound),
    restart: () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      setCurrentTime(0);
      void audio.play();
    },
    seek: (time) => {
      if (audioRef.current) audioRef.current.currentTime = time;
      setCurrentTime(time);
    },
    stop,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
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
      {children}
      {activeSound && pathname !== "/meditar" && pathname !== "/login" && (
        <aside
          ref={playerRef}
          className={`global-audio-player notification-glass ${draggingPlayer ? "is-dragging" : ""}`}
          style={playerTop === undefined ? undefined : { top: playerTop }}
          aria-label={`Reproduzindo ${activeSound.title}. Arraste para mover para cima ou para baixo.`}
          onPointerDown={startPlayerDrag}
          onPointerMove={movePlayer}
          onPointerUp={finishPlayerDrag}
          onPointerCancel={finishPlayerDrag}
        >
          <span
            className={`global-audio-equalizer ${playing ? "is-playing" : ""}`}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
            <i />
          </span>
          <div className="global-audio-banner" aria-label={activeSound.title}>
            <div className="global-audio-banner-track" aria-hidden="true">
              <span>{activeSound.title}</span>
              <span>{activeSound.title}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void toggleSound(activeSound)}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={playing ? "Pausar" : "Reproduzir"}
            className="global-audio-control"
          >
            {playing ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            )}
          </button>
          <button
            type="button"
            onClick={stop}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Encerrar meditação"
            title="Encerrar meditação"
            className="global-audio-control"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        </aside>
      )}
    </AudioPlayerContext.Provider>
  );
}
