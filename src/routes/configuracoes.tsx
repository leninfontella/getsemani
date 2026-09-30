import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, LogOut, Sparkles, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, BrandLogo } from "@/components/AppShell";
import { LiquidConfirmDialog } from "@/components/LiquidConfirmDialog";
import { clearAll, defaultSettings, loadSettings, saveSettings, type Settings } from "@/lib/goals";
import {
  clearCachedUser,
  deleteAccount as deleteRemoteAccount,
  loadUser,
  logoutUser,
  refreshCachedUser,
  updateUserName,
} from "@/lib/auth";
export const Route = createFileRoute("/configuracoes")({ component: SettingsPage });
function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [exiting, setExiting] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("ATÉ A PRÓXIMA JORNADA");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [savingName, setSavingName] = useState(false);
  useEffect(() => {
    const local = loadSettings();
    const cachedName = loadUser()?.name;
    setSettings({ ...local, ...(cachedName ? { name: cachedName } : {}) });
    setSavedName(cachedName || local.name);
    void refreshCachedUser()
      .then((user) => {
        const next = { ...loadSettings(), name: user.name };
        setSettings(next);
        setSavedName(user.name);
        saveSettings(next);
      })
      .catch(() => undefined);
  }, []);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };
  const saveName = async () => {
    const name = settings.name.trim();
    if (!name) {
      toast("Digite um nome para continuar.");
      return;
    }
    setSavingName(true);
    try {
      const user = await updateUserName(name);
      const next = { ...settings, name: user.name };
      setSettings(next);
      setSavedName(user.name);
      saveSettings(next);
      toast("Nome atualizado!", { description: "A alteração foi salva no app e na sua conta." });
    } catch (error) {
      toast("Não foi possível salvar o nome.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingName(false);
    }
  };
  const logout = async () => {
    setConfirmLogout(false);
    setTransitionMessage("ATÉ A PRÓXIMA JORNADA");
    setExiting(true);
    await logoutUser();
    setTimeout(() => navigate({ to: "/login", replace: true }), 2400);
  };
  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteRemoteAccount();
      clearAll();
      clearCachedUser();
      setConfirmDelete(false);
      setTransitionMessage("SUA CONTA FOI EXCLUÍDA");
      setExiting(true);
      setTimeout(() => window.location.replace("/login"), 2400);
    } catch (error) {
      setDeleting(false);
      toast("Não foi possível excluir a conta.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
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
      <LiquidConfirmDialog
        open={confirmLogout}
        icon={<LogOut className="h-7 w-7" />}
        title="Sair do Getsêmani?"
        description="Sua jornada continuará salva e estará esperando por você no próximo acesso."
        confirmLabel="Sair"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={logout}
      />
      <LiquidConfirmDialog
        open={confirmDelete}
        icon={<Trash2 className="h-7 w-7" />}
        title="Excluir sua conta?"
        description="Esta ação apagará permanentemente sua conta, manifestações, diário, sessões e dados locais."
        confirmLabel="Excluir"
        loading={deleting}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteAccount}
      />
      <main className="px-6 mt-6 space-y-5">
        <section className="rounded-2xl border border-g-muted/20 g-glass p-4">
          <label htmlFor="name" className="text-sm text-g-muted">
            Como devemos chamar você?
          </label>
          <input
            id="name"
            value={settings.name}
            maxLength={120}
            onChange={(e) => setSettings((current) => ({ ...current, name: e.target.value }))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && settings.name.trim() !== savedName) void saveName();
            }}
            className="g-glass mt-2 w-full rounded-xl border border-g-muted/30 px-4 py-3 outline-none focus:border-g-gold"
          />
          <button
            type="button"
            onClick={() => void saveName()}
            disabled={savingName || !settings.name.trim() || settings.name.trim() === savedName}
            className="liquid-button mt-3 w-full rounded-full border border-g-gold/40 py-3 font-semibold text-g-gold disabled:cursor-not-allowed disabled:opacity-45"
          >
            {savingName ? "Salvando..." : "Salvar nome"}
          </button>
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
                className="g-glass rounded-lg border border-white/10 px-3 py-2"
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
          onClick={() => setConfirmLogout(true)}
          disabled={exiting}
          className="liquid-button w-full rounded-full border border-red-300/40 py-4 font-semibold text-red-200 flex items-center justify-center gap-2"
        >
          <LogOut className="h-5 w-5" /> Sair
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="liquid-button w-full rounded-full border border-red-500/25 py-4 text-sm font-semibold text-red-300/90 flex items-center justify-center gap-2"
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
