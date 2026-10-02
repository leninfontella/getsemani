import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Camera, LogOut, Sparkles, Trash2, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { addNotification, clearNotifications } from "@/lib/notifications";
import { AppShell, BrandLogo } from "@/components/AppShell";
import { LiquidConfirmDialog } from "@/components/LiquidConfirmDialog";
import { SocialIcons } from "@/components/SocialIcons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [installGuide, setInstallGuide] = useState<"ios" | "android" | null>(null);
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
  const toggleSetting = (
    key: "reminder" | "sounds" | "affirmations",
    value: boolean,
    label: string,
  ) => {
    update(key, value);
    toast(`${label} ${value ? "ativado" : "desativado"}.`);
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
      <InstallGuideDialog
        platform={installGuide}
        onOpenChange={(open) => !open && setInstallGuide(null)}
      />
      <main className="desktop-content settings-content px-6 mt-6 space-y-5">
        <section className="relative overflow-hidden rounded-2xl border border-g-muted/20 g-glass p-4 text-center">
          {avatarOpen && avatarUrl && (
            <div
              className="profile-photo-modal absolute inset-0 z-20 grid place-items-center rounded-2xl p-4"
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
            className="settings-logout mx-auto mt-4 flex w-[min(82%,268px)] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-g-text disabled:opacity-45"
          >
            <Camera className="h-4 w-4" />
            {savingAvatar ? "Enviando..." : avatarUrl ? "Trocar foto" : "Escolher foto"}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => void removeAvatar()}
              disabled={savingAvatar}
              className="settings-delete mx-auto mt-3 flex w-fit items-center justify-center gap-2 px-3 py-1 text-sm font-medium disabled:opacity-45"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover foto
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
            className="settings-logout mx-auto mt-3 flex w-[min(82%,268px)] items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-g-text disabled:cursor-not-allowed disabled:opacity-45"
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
            <Switch
              checked={settings.reminder}
              onChange={(value) => toggleSetting("reminder", value, "Lembrete diário")}
            />
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
          <SettingRow
            icon={<Volume2 />}
            title="Sons do app"
            detail="Resposta tátil nos controles e práticas"
          >
            <Switch
              checked={settings.sounds}
              onChange={(value) => toggleSetting("sounds", value, "Sons do app")}
            />
          </SettingRow>
          <SettingRow
            icon={<Sparkles />}
            title="Afirmações"
            detail="Mostrar mensagens inspiradoras"
          >
            <Switch
              checked={settings.affirmations}
              onChange={(value) => toggleSetting("affirmations", value, "Afirmações")}
            />
          </SettingRow>
        </section>
        <button
          onClick={() => setConfirmLogout(true)}
          disabled={exiting}
          className="settings-logout mx-auto flex w-[min(82%,268px)] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-g-text disabled:opacity-45"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
        <section className="mx-auto grid w-fit gap-2" aria-label="Instalar o aplicativo">
          <button
            type="button"
            onClick={() => setInstallGuide("ios")}
            className="flex w-fit items-center gap-2 border-0 bg-transparent px-3 py-1 text-sm font-medium text-white transition-opacity hover:opacity-75"
          >
            <AppleIcon className="h-3.5 w-3.5 shrink-0 text-white" />
            <span>Baixar versão para iOS</span>
          </button>
          <button
            type="button"
            onClick={() => setInstallGuide("android")}
            className="flex w-fit items-center gap-2 border-0 bg-transparent px-3 py-1 text-sm font-medium text-white transition-opacity hover:opacity-75"
          >
            <AndroidIcon className="h-3.5 w-3.5 shrink-0 text-[#3DDC84]" />
            <span>Baixar versão para Android</span>
          </button>
          <SocialIcons
            className="mt-3 flex items-center justify-center gap-3 lg:hidden"
            itemClassName="liquid-back-button grid h-9 w-9 place-items-center rounded-full text-g-text"
            iconClassName="h-4 w-4 stroke-[1.7]"
          />
        </section>
        <button
          onClick={() => setConfirmDelete(true)}
          className="settings-delete mx-auto flex w-fit items-center justify-center gap-2 px-3 py-1 text-sm font-medium"
        >
          <Trash2 className="h-3.5 w-3.5" /> Excluir conta
        </button>

      </main>
    </AppShell>
  );
}

const installationSteps = {
  ios: {
    title: "Instalar no iPhone ou iPad",
    subtitle: "Use o Safari para adicionar o Getsêmani à sua Tela de Início.",
    icon: <AppleIcon className="h-8 w-8 text-white" />,
    steps: [
      {
        title: "Acesse o site",
        text: "Abra o navegador Safari e acesse o endereço do Getsêmani.",
        image: "/install-guide/ios-access-site.png?v=2",
      },
      {
        title: "Abra o menu Compartilhar",
        text: "Na barra inferior do Safari, toque no ícone de Compartilhamento.",
        image: "/install-guide/ios-share.png?v=2",
      },
      {
        title: "Adicione à Tela de Início",
        text: "Role as opções para baixo e toque em “Adicionar à Tela de Início”.",
        image: "/install-guide/ios-add-home.png?v=2",
      },
      {
        title: "Configure e salve",
        text: "Ative “Abrir como App da Web”, se essa opção aparecer, e toque em “Adicionar”.",
        image: "/install-guide/ios-confirm.png?v=2",
      },
    ],
    done: "Pronto! O aplicativo será adicionado à sua tela inicial e abrirá em tela cheia, sem as barras do navegador.",
  },
  android: {
    title: "Instalar no Android",
    subtitle: "Use o Google Chrome para instalar o Getsêmani como aplicativo.",
    icon: <AndroidIcon className="h-8 w-8 text-[#A4C639]" />,
    steps: [
      {
        title: "Acesse no Chrome",
        text: "Abra o Google Chrome e acesse o endereço do Getsêmani.",
        image: "/install-guide/android-access-site.png?v=2",
      },
      {
        title: "Abra o menu",
        text: "Toque no ícone dos três pontos verticais (⋮), no canto superior direito.",
        image: "/install-guide/android-menu.png?v=2",
      },
      {
        title: "Instale o aplicativo",
        text: "Selecione “Instalar aplicativo” ou “Adicionar à tela inicial”.",
        image: "/install-guide/android-install-app.png?v=2",
      },
      {
        title: "Confirme a instalação",
        text: "No alerta de confirmação, toque no botão “Instalar”.",
        image: "/install-guide/android-confirm.png?v=2",
      },
    ],
    done: "Depois de instalado, abra o Getsêmani diretamente pela tela inicial com um toque.",
  },
} as const;

function InstallGuideDialog({
  platform,
  onOpenChange,
}: {
  platform: "ios" | "android" | null;
  onOpenChange: (open: boolean) => void;
}) {
  const guide = platform ? installationSteps[platform] : null;
  return (
    <Dialog open={platform !== null} onOpenChange={onOpenChange}>
      {guide && (
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-3xl border-g-gold/25 p-0 text-g-text [&>button]:z-20 [&>button]:grid [&>button]:h-10 [&>button]:w-10 [&>button]:place-items-center [&>button]:rounded-full [&>button]:border [&>button]:border-white/20 [&>button]:bg-white/10 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-md [&>button:hover]:bg-white/20">
          <DialogHeader className="sticky top-0 z-10 border-b border-white/10 bg-[#171326]/95 px-5 pb-4 pt-5 pr-14 text-left backdrop-blur-xl sm:px-7 sm:pt-7">
            <div className="mb-2 flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/5">
                {guide.icon}
              </span>
              <div>
                <DialogTitle className="font-serif-g text-xl text-g-gold sm:text-2xl">
                  {guide.title}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-g-muted">
                  {guide.subtitle}
                </DialogDescription>
              </div>
            </div>
            <a
              href="https://getsemani-two.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="block truncate rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-[#cbbcff] underline decoration-[#a786ff]/50 underline-offset-2"
            >
              https://getsemani-two.vercel.app/
            </a>
          </DialogHeader>
          <div className="space-y-4 px-5 pb-6 sm:px-7">
            {guide.steps.map((step, index) => (
              <article
                key={step.title}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]"
              >
                <div className="flex gap-3 p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-g-violet text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-g-text">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-g-muted">{step.text}</p>
                  </div>
                </div>
                <img
                  src={step.image}
                  alt={`Ilustração do passo ${index + 1}: ${step.title}`}
                  className="w-full border-t border-white/10 bg-[#f8fafc] object-contain"
                />
              </article>
            ))}
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-relaxed text-emerald-100">
              <strong>Pronto!</strong> {guide.done.replace(/^Pronto!\s*/, "")}
            </p>
            <section className="rounded-2xl border border-g-violet/25 bg-g-violet/10 p-4">
              <h3 className="font-semibold text-[#d8cbff]">Vantagens de usar como Web App</h3>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-g-muted">
                <li>
                  <strong className="text-g-text">Sem barras de navegação:</strong> mais espaço útil
                  em tela.
                </li>
                <li>
                  <strong className="text-g-text">Acesso rápido:</strong> abra direto da tela
                  inicial com um toque.
                </li>
                <li>
                  <strong className="text-g-text">Experiência nativa:</strong> transições fluidas,
                  como em um app baixado pela loja.
                </li>
              </ul>
            </section>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 12.54c-.02-2.18 1.78-3.24 1.86-3.29a4 4 0 0 0-3.16-1.71c-1.33-.14-2.62.8-3.3.8-.7 0-1.75-.78-2.88-.76a4.19 4.19 0 0 0-3.53 2.15c-1.53 2.65-.39 6.55 1.08 8.7.74 1.05 1.6 2.23 2.73 2.19 1.1-.05 1.52-.7 2.85-.7 1.32 0 1.72.7 2.87.67 1.19-.02 1.94-1.05 2.65-2.11a8.65 8.65 0 0 0 1.22-2.48 3.76 3.76 0 0 1-2.39-3.46ZM14.88 6.13a3.82 3.82 0 0 0 .88-2.74 3.9 3.9 0 0 0-2.53 1.3 3.64 3.64 0 0 0-.9 2.64 3.23 3.23 0 0 0 2.55-1.2Z" />
    </svg>
  );
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="m17.6 9.48 1.84-3.18a.45.45 0 0 0-.78-.45l-1.86 3.22A11.13 11.13 0 0 0 12 8c-1.72 0-3.35.38-4.8 1.07L5.34 5.85a.45.45 0 0 0-.78.45L6.4 9.48A8.94 8.94 0 0 0 2 16h20a8.94 8.94 0 0 0-4.4-6.52ZM7.5 13.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
    </svg>
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
