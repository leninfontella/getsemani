import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Camera, LogOut, Sparkles, Trash2, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { addNotification, clearNotifications } from "@/lib/notifications";
import { AppShell, BrandLogo } from "@/components/AppShell";
import { LiquidConfirmDialog } from "@/components/LiquidConfirmDialog";
import { clearAll, defaultSettings, loadSettings, saveSettings, type Settings } from "@/lib/goals";
import {
  clearCachedUser,
  deleteAccount as deleteRemoteAccount,
  loadUser,
  logoutUser,
  removeUserAvatar,
  refreshCachedUser,
  updateUserName,
  uploadUserAvatar,
} from "@/lib/auth";
export const Route = createFileRoute("/configuracoes")({ component: SettingsPage });
function SettingsPage() {
  const { queryClient } = Route.useRouteContext();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [exiting, setExiting] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("ATÉ A PRÓXIMA JORNADA");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const local = loadSettings();
    const cachedName = loadUser()?.name;
    setSettings({ ...local, ...(cachedName ? { name: cachedName } : {}) });
    setSavedName(cachedName || local.name);
    setAvatarUrl(loadUser()?.avatarUrl);
    void refreshCachedUser()
      .then((user) => {
        const next = { ...loadSettings(), name: user.name };
        setSettings(next);
        setSavedName(user.name);
        setAvatarUrl(user.avatarUrl);
        saveSettings(next);
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!avatarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAvatarOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [avatarOpen]);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };
  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    setSavingAvatar(true);
    try {
      const user = await uploadUserAvatar(file);
      setAvatarUrl(user.avatarUrl);
      toast("Foto atualizada!");
      addNotification({
        kind: "success",
        title: "Foto atualizada",
        message: "Sua nova foto de perfil já está aparecendo no Getsêmani.",
      });
    } catch (error) {
      toast("Não foi possível salvar a foto.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingAvatar(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  };
  const removeAvatar = async () => {
    setSavingAvatar(true);
    try {
      await removeUserAvatar();
      setAvatarUrl(undefined);
      toast("Foto removida.");
    } catch (error) {
      toast("Não foi possível remover a foto.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSavingAvatar(false);
    }
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
      addNotification({
        kind: "success",
        title: "Perfil atualizado",
        message: `Seu nome foi alterado para ${user.name}.`,
      });
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
    try {
      await logoutUser();
    } finally {
      queryClient.clear();
      clearAll();
      clearNotifications();
      clearCachedUser();
      window.location.replace("/login");
    }
  };
  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteRemoteAccount();
      queryClient.clear();
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
    <AppShell title="Ajustes">
      {exiting &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] grid min-h-[100dvh] w-screen place-items-center bg-[#0b0c12]/95 backdrop-blur-md">
            <div className="text-center">
              <BrandLogo className="auth-logo-blink mx-auto h-[280px] w-[400px] max-w-[95vw]" />
              <p className="mt-4 text-sm tracking-[0.2em] text-g-gold">{transitionMessage}</p>
            </div>
          </div>,
          document.body,
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
      <main className="desktop-content settings-content px-6 mt-6 space-y-5">
        <section className="relative overflow-hidden rounded-2xl border border-g-muted/20 g-glass p-4 text-center">
          {avatarOpen && avatarUrl && (
            <div
              className="absolute inset-0 z-20 grid place-items-center rounded-2xl border border-white/10 bg-[rgba(7,5,13,.64)] p-4 backdrop-blur-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Foto de perfil ampliada"
              onClick={() => setAvatarOpen(false)}
            >
              <button
                type="button"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/5 text-white shadow-lg backdrop-blur-xl"
                aria-label="Fechar foto"
                onClick={() => setAvatarOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
              <img
                src={avatarUrl}
                alt="Sua foto de perfil ampliada"
                className="h-40 w-40 rounded-full border border-g-gold/70 object-cover shadow-[0_16px_50px_rgba(0,0,0,.6)]"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => avatarUrl && setAvatarOpen(true)}
            disabled={!avatarUrl}
            aria-label={avatarUrl ? "Ampliar foto de perfil" : "Foto de perfil não definida"}
            className="mx-auto block h-28 w-28 overflow-hidden rounded-full border border-g-gold/40 bg-[#161225] transition active:scale-95 disabled:cursor-default"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Sua foto de perfil"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center font-serif-g text-5xl text-g-gold">
                {(settings.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </button>
          <input
            ref={avatarInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void uploadAvatar(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            disabled={savingAvatar}
            className="liquid-button mt-4 w-full rounded-full border border-g-gold/40 py-3 font-semibold text-g-gold disabled:opacity-45"
          >
            <span className="inline-flex items-center gap-2">
              <Camera className="h-4 w-4" />{" "}
              {savingAvatar ? "Enviando..." : avatarUrl ? "Trocar foto" : "Escolher foto"}
            </span>
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => void removeAvatar()}
              disabled={savingAvatar}
              className="mt-3 text-sm text-red-200 disabled:opacity-45"
            >
              Remover foto
            </button>
          )}
          <p className="mt-3 text-xs text-g-muted">JPG, PNG ou WebP, até 5 MB.</p>
        </section>
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
