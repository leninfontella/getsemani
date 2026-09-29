import { createFileRoute } from "@tanstack/react-router";
import { Headphones, Music2, Radio, Waves } from "lucide-react";
import { AppShell } from "@/components/AppShell";
export const Route = createFileRoute("/meditar")({ component: MeditatePage });
const sounds = [
  { title: "Chuva tranquila", detail: "Som da natureza · 20 min", Icon: Headphones },
  { title: "Tigelas tibetanas", detail: "Meditação profunda · 15 min", Icon: Music2 },
  { title: "Frequência 432 Hz", detail: "Harmonia e equilíbrio · 30 min", Icon: Waves },
  { title: "Frequência 528 Hz", detail: "Transformação e amor · 30 min", Icon: Radio },
];
function MeditatePage() {
  return (
    <AppShell title="Meditar">
      <main className="px-6 mt-6">
        <div className="rounded-3xl border border-g-gold/40 g-glass p-6 text-center">
          <div className="mx-auto h-24 w-24 rounded-full border border-g-violet/50 grid place-items-center shadow-[0_0_35px_var(--g-violet)]">
            <Waves className="h-10 w-10 text-g-gold" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Encontre sua frequência</h2>
          <p className="mt-2 text-sm text-g-muted">Escolha um som para acompanhar sua prática.</p>
        </div>
        <div className="mt-6 space-y-3">
          {sounds.map(({ title, detail, Icon }) => (
            <button
              key={title}
              className="w-full flex items-center gap-4 rounded-2xl border border-g-muted/20 g-glass p-4 text-left"
            >
              <span className="h-11 w-11 rounded-full bg-g-violet/20 grid place-items-center text-g-gold">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <strong className="block">{title}</strong>
                <small className="text-g-muted">{detail}</small>
              </span>
              <span className="rounded-full border border-g-gold/30 px-2 py-1 text-[10px] text-g-gold">
                Em breve
              </span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-g-muted">
          Seleção apenas para visualização nesta versão.
        </p>
      </main>
    </AppShell>
  );
}
