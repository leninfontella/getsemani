import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Sparkles, Trash2, Volume2 } from "lucide-react";
import { AppShell, BrandLogo } from "@/components/AppShell";
import { clearAll, defaultSettings, loadSettings, saveSettings, type Settings } from "@/lib/goals";
import { clearCachedUser, logoutUser } from "@/lib/auth";
export const Route = createFileRoute("/configuracoes")({ component: SettingsPage });
function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [exiting, setExiting] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("ATÉ A PRÓXIMA JORNADA");
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => setSettings(loadSettings()), []);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };
  const logout = async () => {
    setTransitionMessage("ATÉ A PRÓXIMA JORNADA");
    setExiting(true);
    await logoutUser();
    setTimeout(() => navigate({ to: "/login", replace: true }), 2400);
  };
  const deleteAccount = () => {
    clearAll();
    clearCachedUser();
    setConfirmDelete(false);
    setTransitionMessage("SUA CONTA FOI EXCLUÍDA");
    setExiting(true);
    setTimeout(() => navigate({ to: "/login", replace: true }), 2400);
  };
  return (
    <AppShell title="Configurações">
      {exiting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b0c12]/95 backdrop-blur-md">
          <div className="text-center">
            <BrandLogo className="auth-logo-blink mx-auto h-[280px] w-[400px] max-w-[95vw]" />
            <p className="mt-4 text-sm tracking-[0.2em] text-g-gold">{transitionMessage}</p>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 px-6 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-sm rounded-3xl border border-red-300/25 bg-[#191923] p-6 shadow-2xl"
          >
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-400/10 text-red-300">
              <Trash2 className="h-6 w-6" />
            </span>
            <h2 id="delete-title" className="mt-4 text-center text-xl font-semibold">
              Excluir sua conta?
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-g-muted">
              Esta ação apagará permanentemente a conta, manifestações, diário e configurações
              salvas neste navegador.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-full border border-white/15 py-3 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={deleteAccount}
                className="rounded-full bg-red-500/90 py-3 font-semibold text-white"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="px-6 mt-6 space-y-5">
        <section className="rounded-2xl border border-g-muted/20 g-glass p-4">
          <label htmlFor="name" className="text-sm text-g-muted">
            Como devemos chamar você?
          </label>
          <input
            id="name"
            value={settings.name}
            onChange={(e) => update("name", e.target.value)}
            className="mt-2 w-full rounded-xl border border-g-muted/30 bg-g-bg/40 px-4 py-3 outline-none focus:border-g-gold"
          />
        </section>
        <section className="overflow-hidden rounded-2xl border border-g-muted/20 g-glass">
          <SettingRow
            icon={<Bell />}
            title="Lembrete diário"
            detail="Receber lembrete para manifestar"
          >
            <Switch checked={settings.reminder} onChange={(v) => update("reminder", v)} />
          </SettingRow>
          {settings.reminder && (
            <div className="border-t border-g-muted/10 px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-g-muted">Horário</span>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => update("reminderTime", e.target.value)}
                className="rounded-lg bg-g-bg/50 px-3 py-2"
              />
            </div>
          )}
          <SettingRow icon={<Volume2 />} title="Sons do app" detail="Efeitos suaves nas práticas">
            <Switch checked={settings.sounds} onChange={(v) => update("sounds", v)} />
          </SettingRow>
          <SettingRow
            icon={<Sparkles />}
            title="Afirmações"
            detail="Mostrar mensagens inspiradoras"
          >
            <Switch checked={settings.affirmations} onChange={(v) => update("affirmations", v)} />
          </SettingRow>
        </section>
        <button
          onClick={logout}
          disabled={exiting}
          className="w-full rounded-full border border-red-300/40 py-4 font-semibold text-red-200 flex items-center justify-center gap-2"
        >
          <LogOut className="h-5 w-5" /> Sair
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full rounded-full border border-red-500/25 py-4 text-sm font-semibold text-red-300/90 flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" /> Excluir Conta
        </button>
        <p className="text-center text-xs text-g-muted">Getsêmani · versão 1.0</p>
      </main>
    </AppShell>
  );
}
function SettingRow({
  icon,
  title,
  detail,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-g-muted/10 p-4 last:border-0">
      <span className="text-g-gold [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="flex-1">
        <strong className="block text-sm">{title}</strong>
        <small className="text-g-muted">{detail}</small>
      </span>
      {children}
    </div>
  );
}
function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`h-7 w-12 rounded-full p-1 transition ${checked ? "bg-g-violet" : "bg-g-muted/30"}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
