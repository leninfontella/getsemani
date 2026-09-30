import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Lock,
  Save,
  Trash2,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { addNotification } from "@/lib/notifications";
import { AppShell } from "@/components/AppShell";
import { LiquidConfirmDialog } from "@/components/LiquidConfirmDialog";
import {
  decryptDiary,
  deleteCloudDiary,
  listDiaryDays,
  loadCloudDiary,
  saveOpenDiary,
  saveProtectedDiary,
  type CloudDiary,
} from "@/lib/diary";
import { loadDiary, saveDiary } from "@/lib/goals";

export const Route = createFileRoute("/diario")({ component: DiaryPage });

type PasswordMode = "unlock" | "create" | null;

const localDateKey = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

function DiaryPage() {
  const [text, setText] = useState("");
  const [protectedDiary, setProtectedDiary] = useState(false);
  const [unlocked, setUnlocked] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storedDiary, setStoredDiary] = useState<CloudDiary | null>(null);
  const [sessionPassword, setSessionPassword] = useState("");
  const [passwordMode, setPasswordMode] = useState<PasswordMode>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [savedDays, setSavedDays] = useState<{ entry_date: string; locked: boolean }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setLoading(true);
    setText("");
    setProtectedDiary(false);
    setUnlocked(true);
    setHidden(false);
    setSessionPassword("");
    setPasswordMode(null);
    resetPasswordFields();
    void Promise.all([loadCloudDiary(selectedDate), listDiaryDays()])
      .then(async ([cloud, days]) => {
        setSavedDays(days);
        setStoredDiary(cloud);
        if (cloud?.locked) {
          setProtectedDiary(true);
          setUnlocked(false);
          setHidden(true);
          setPasswordMode("unlock");
          return;
        }
        const local = loadDiary();
        const initialText = cloud?.content ?? (selectedDate === localDateKey() ? local.text : "");
        setText(initialText);
        if (!cloud && initialText) await saveOpenDiary(selectedDate, initialText);
      })
      .catch((error) =>
        toast("Não foi possível carregar o diário.", {
          description: error instanceof Error ? error.message : "Tente novamente.",
        }),
      )
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const refreshSavedDays = async () => setSavedDays(await listDiaryDays());

  const save = async () => {
    setSaving(true);
    try {
      if (protectedDiary) {
        await saveProtectedDiary(selectedDate, text, sessionPassword);
        if (selectedDate === localDateKey()) {
          saveDiary({ text: "", locked: true, pin: "", updated: new Date().toISOString() });
        }
      } else {
        await saveOpenDiary(selectedDate, text);
        if (selectedDate === localDateKey()) {
          saveDiary({ text, locked: false, pin: "", updated: new Date().toISOString() });
        }
      }
      await refreshSavedDays();
      toast("Página salva no seu diário ✨", { description: "Sincronizada com sua conta." });
      addNotification({
        kind: "success",
        title: "Diário atualizado ✨",
        message: "Sua página foi salva e sincronizada com segurança.",
      });
    } catch (error) {
      toast("Não foi possível salvar.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordMode === "create") {
      if (!/^\d{4}$/.test(password)) {
        toast("Crie uma senha com exatamente 4 números.");
        return;
      }
      if (password !== passwordConfirmation) {
        toast("As senhas não coincidem.");
        return;
      }
      setSaving(true);
      try {
        await saveProtectedDiary(selectedDate, text, password);
        setProtectedDiary(true);
        setUnlocked(true);
        setSessionPassword(password);
        setPasswordMode(null);
        setHidden(false);
        if (selectedDate === localDateKey()) {
          saveDiary({ text: "", locked: true, pin: "", updated: new Date().toISOString() });
        }
        await refreshSavedDays();
        toast("Diário protegido com senha 🔒");
      } catch (error) {
        toast("Não foi possível proteger o diário.", {
          description: error instanceof Error ? error.message : "Tente novamente.",
        });
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!storedDiary) return;
    if (!/^\d{4}$/.test(password)) {
      toast("Digite os 4 números da senha.");
      return;
    }
    setSaving(true);
    try {
      const decrypted = await decryptDiary(storedDiary, password);
      setText(decrypted);
      setSessionPassword(password);
      setUnlocked(true);
      setHidden(false);
      setPasswordMode(null);
      toast("Diário desbloqueado.");
    } catch (error) {
      toast("Não foi possível desbloquear.", {
        description: error instanceof Error ? error.message : "Senha incorreta.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleProtection = async () => {
    if (!protectedDiary) {
      setPassword("");
      setPasswordConfirmation("");
      setPasswordMode("create");
      return;
    }
    setSaving(true);
    try {
      await saveOpenDiary(selectedDate, text);
      setProtectedDiary(false);
      setSessionPassword("");
      setStoredDiary(null);
      if (selectedDate === localDateKey()) {
        saveDiary({ text, locked: false, pin: "", updated: new Date().toISOString() });
      }
      await refreshSavedDays();
      toast("Proteção removida. O diário está aberto.");
    } catch (error) {
      toast("Não foi possível remover a proteção.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetPasswordFields = () => {
    setPassword("");
    setPasswordConfirmation("");
    setShowPassword(false);
  };

  const moveDay = (amount: number) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + amount);
    setSelectedDate(localDateKey(date));
  };

  const formattedSelectedDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const deleteSelectedDay = async () => {
    setSaving(true);
    try {
      await deleteCloudDiary(selectedDate);
      if (selectedDate === localDateKey()) {
        saveDiary({ text: "", locked: false, pin: "", updated: new Date().toISOString() });
      }
      setText("");
      setStoredDiary(null);
      setProtectedDiary(false);
      setUnlocked(true);
      setHidden(false);
      setSessionPassword("");
      setPasswordMode(null);
      setConfirmDelete(false);
      await refreshSavedDays();
      toast("Registro do dia excluído.");
    } catch (error) {
      toast("Não foi possível excluir o registro.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="Meu Diário">
      <LiquidConfirmDialog
        open={confirmDelete}
        icon={<Trash2 className="h-7 w-7" />}
        title="Excluir este dia?"
        description={<>O registro de {formattedSelectedDate} será removido permanentemente.</>}
        confirmLabel="Excluir"
        loading={saving}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteSelectedDay}
      />
      <main className="px-6 mt-5">
        <section className="mb-4 rounded-2xl border border-g-violet/30 g-glass p-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 shrink-0 text-g-gold" />
            <label className="min-w-0 flex-1">
              <span className="block text-xs text-g-muted">Pesquisar o que escrevi por dia</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="mt-1 w-full bg-transparent font-semibold text-g-text outline-none [color-scheme:dark]"
              />
            </label>
            <button
              onClick={() => moveDay(-1)}
              aria-label="Dia anterior"
              className="g-glass grid h-9 w-9 place-items-center rounded-full border border-white/15"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => moveDay(1)}
              aria-label="Próximo dia"
              className="g-glass grid h-9 w-9 place-items-center rounded-full border border-white/15"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {savedDays.length > 0 && (
            <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {savedDays.map((day) => (
                <button
                  key={day.entry_date}
                  onClick={() => setSelectedDate(day.entry_date)}
                  className={`shrink-0 snap-start rounded-full border px-3 py-2 text-xs transition ${selectedDate === day.entry_date ? "border-g-gold bg-g-gold/15 text-g-gold" : "border-white/10 text-g-muted"}`}
                >
                  {new Date(`${day.entry_date}T12:00:00`).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {day.locked ? " 🔒" : ""}
                </button>
              ))}
            </div>
          )}
        </section>
        <div className="diary-paper relative overflow-hidden rounded-[28px] border border-g-gold/30 p-6 text-[#382c4c] shadow-2xl">
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={() => setHidden(!hidden)}
              disabled={!unlocked}
              aria-label={hidden ? "Mostrar texto" : "Esconder texto"}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/15 shadow-inner backdrop-blur-xl disabled:opacity-40"
            >
              {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleProtection}
              disabled={!unlocked || saving}
              aria-label={protectedDiary ? "Remover senha" : "Proteger com senha"}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/15 shadow-inner backdrop-blur-xl disabled:opacity-40"
            >
              {protectedDiary ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
          </div>
          <p className="font-serif-g text-2xl font-bold">Pensamentos de hoje</p>
          <p className="mt-1 text-xs opacity-60">{formattedSelectedDate}</p>
          {loading ? (
            <div className="grid min-h-[360px] place-items-center">
              <LoaderCircle className="h-8 w-8 animate-spin opacity-50" />
            </div>
          ) : (
            <textarea
              value={text}
              disabled={!unlocked}
              onChange={(event) => setText(event.target.value)}
              placeholder="Escreva livremente. Este espaço é somente seu…"
              className={`mt-8 min-h-[360px] w-full resize-none bg-transparent leading-8 outline-none placeholder:text-[#493867]/40 ${hidden ? "blur-md select-none" : ""}`}
            />
          )}
          <div className="mt-4 flex items-center justify-between text-xs opacity-60">
            <span>{protectedDiary ? "Protegido com senha" : "Diário aberto"}</span>
            <span>{unlocked ? `${text.length} caracteres` : "Conteúdo protegido"}</span>
          </div>

          {passwordMode && (
            <div className="absolute inset-0 z-10 grid place-items-center bg-[#eadff0]/65 p-6 backdrop-blur-2xl">
              <form onSubmit={handlePassword} className="w-full max-w-xs text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/30 bg-white/15 shadow-inner backdrop-blur-xl">
                  {passwordMode === "unlock" ? (
                    <Lock className="h-6 w-6" />
                  ) : (
                    <KeyRound className="h-6 w-6" />
                  )}
                </span>
                <h2 className="mt-4 text-xl font-bold">
                  {passwordMode === "unlock" ? "Diário protegido" : "Criar senha do diário"}
                </h2>
                <p className="mt-2 text-sm opacity-65">
                  {passwordMode === "unlock"
                    ? "Digite sua senha para acessar seus pensamentos."
                    : "Crie um PIN de 4 números. Esta senha não poderá ser recuperada."}
                </p>
                <div className="relative mt-5">
                  <input
                    autoFocus
                    required
                    type={showPassword ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    minLength={4}
                    maxLength={4}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="4 números"
                    className="w-full rounded-xl border border-white/35 bg-white/30 px-4 py-3 pr-11 shadow-inner backdrop-blur-xl outline-none focus:border-[#7650a8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordMode === "create" && (
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    minLength={4}
                    maxLength={4}
                    value={passwordConfirmation}
                    onChange={(event) =>
                      setPasswordConfirmation(event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="Confirme os 4 números"
                    className="mt-3 w-full rounded-xl border border-white/35 bg-white/30 px-4 py-3 shadow-inner backdrop-blur-xl outline-none focus:border-[#7650a8]"
                  />
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-4 w-full rounded-full bg-[#493867] py-3 font-bold text-white disabled:opacity-50"
                >
                  {saving
                    ? "Aguarde…"
                    : passwordMode === "unlock"
                      ? "DESBLOQUEAR"
                      : "ATIVAR PROTEÇÃO"}
                </button>
                {passwordMode === "create" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode(null);
                      resetPasswordFields();
                    }}
                    className="mt-3 text-sm underline opacity-60"
                  >
                    Cancelar
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={save}
            disabled={!unlocked || loading || saving}
            aria-label={saving ? "Salvando no diário" : "Salvar no diário"}
            title={saving ? "Salvando…" : "Salvar no diário"}
            className="g-cta grid h-12 w-12 place-items-center rounded-full text-g-bg transition active:scale-95 disabled:opacity-40"
          >
            {saving ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
          </button>
          {savedDays.some((day) => day.entry_date === selectedDate) && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              aria-label="Excluir registro deste dia"
              title="Excluir registro deste dia"
              className="grid h-12 w-12 place-items-center rounded-full border border-red-400/30 bg-red-950/20 text-red-300 transition active:scale-95 disabled:opacity-40"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-g-muted">
          Sincronizado com sua conta. Quando protegido, o texto é enviado criptografado.
        </p>
      </main>
    </AppShell>
  );
}
