import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Save, Unlock } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { loadDiary, saveDiary } from "@/lib/goals";
export const Route = createFileRoute("/diario")({ component: DiaryPage });
function DiaryPage() {
  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const d = loadDiary();
    setText(d.text);
    setLocked(d.locked);
    setHidden(d.locked);
  }, []);
  const save = () => {
    saveDiary({ text, locked, pin: "", updated: new Date().toISOString() });
    toast("Página salva no seu diário ✨");
  };
  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    setHidden(next);
    saveDiary({ text, locked: next, pin: "", updated: new Date().toISOString() });
    toast(next ? "Página escondida e travada" : "Página destravada");
  };
  return (
    <AppShell title="Meu Diário">
      <main className="px-6 mt-5">
        <div className="diary-paper relative overflow-hidden rounded-[28px] border border-g-gold/30 p-6 text-[#382c4c] shadow-2xl">
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={() => setHidden(!hidden)}
              aria-label={hidden ? "Mostrar texto" : "Esconder texto"}
              className="h-9 w-9 rounded-full bg-[#493867]/10 grid place-items-center"
            >
              {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleLock}
              aria-label={locked ? "Destravar página" : "Travar página"}
              className="h-9 w-9 rounded-full bg-[#493867]/10 grid place-items-center"
            >
              {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
          </div>
          <p className="font-serif-g text-2xl font-bold">Pensamentos de hoje</p>
          <p className="mt-1 text-xs opacity-60">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <textarea
            value={text}
            disabled={locked}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva livremente. Este espaço é somente seu…"
            className={`mt-8 min-h-[360px] w-full resize-none bg-transparent leading-8 outline-none placeholder:text-[#493867]/40 ${hidden ? "blur-md select-none" : ""}`}
          />
          <div className="mt-4 flex items-center justify-between text-xs opacity-60">
            <span>{locked ? "Página protegida" : "Página aberta"}</span>
            <span>{text.length} caracteres</span>
          </div>
        </div>
        <button
          onClick={save}
          disabled={locked}
          className="g-cta mt-5 w-full rounded-full py-4 font-bold text-g-bg flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Save className="h-5 w-5" /> Salvar no diário
        </button>
        <p className="mt-3 text-center text-xs text-g-muted">
          O conteúdo fica salvo somente neste dispositivo.
        </p>
      </main>
    </AppShell>
  );
}
