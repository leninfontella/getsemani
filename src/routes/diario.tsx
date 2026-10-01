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
  PaintBucket,
  Palette,
  Save,
  Trash2,
  Type,
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
  loadDiaryAppearance,
  loadCloudDiary,
  saveDiaryAppearance,
  saveOpenDiary,
  saveProtectedDiary,
  type CloudDiary,
} from "@/lib/diary";
import { loadDiary, saveDiary } from "@/lib/goals";

export const Route = createFileRoute("/diario")({ component: DiaryPage });

type PasswordMode = "unlock" | "create" | null;

type DiaryFont = "sans" | "serif" | "handwriting";
type DiaryPaper =
  | "parchment"
  | "rose"
  | "lavender"
  | "sage"
  | "blue"
  | "cream-light"
  | "rose-light"
  | "lavender-light"
  | "sage-light"
  | "blue-light";

const diaryColors = [
  { value: "#f7f0df", label: "Marfim" },
  { value: "#e6d3ff", label: "Lavanda" },
  { value: "#ffcbd8", label: "Rosa" },
  { value: "#ccebd9", label: "Verde" },
  { value: "#cce5ff", label: "Azul" },
  { value: "#30263f", label: "Ameixa escuro" },
  { value: "#6b3f76", label: "Violeta escuro" },
  { value: "#8b4358", label: "Rosa escuro" },
  { value: "#355e55", label: "Verde escuro" },
  { value: "#294f70", label: "Azul escuro" },
] as const;

const diaryFonts: { value: DiaryFont; label: string; className: string }[] = [
  { value: "sans", label: "Aa", className: "font-sans-g" },
  { value: "serif", label: "Aa", className: "font-serif-g" },
  { value: "handwriting", label: "Abc", className: "diary-handwriting" },
];

const diaryPapers: { value: DiaryPaper; label: string; color: string }[] = [
  { value: "parchment", label: "Ameixa", color: "#2c2338" },
  { value: "rose", label: "Vinho", color: "#3a202c" },
  { value: "lavender", label: "Violeta", color: "#27233e" },
  { value: "sage", label: "Floresta", color: "#1f3330" },
  { value: "blue", label: "Azul-noturno", color: "#1d3040" },
  { value: "cream-light", label: "Creme claro", color: "#f1e8d3" },
  { value: "rose-light", label: "Rosa claro", color: "#efdde3" },
  { value: "lavender-light", label: "Lavanda clara", color: "#e3def0" },
  { value: "sage-light", label: "Sálvia clara", color: "#dee8dd" },
  { value: "blue-light", label: "Azul claro", color: "#dce8ef" },
];

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
  const [inkColor, setInkColor] = useState<(typeof diaryColors)[number]["value"]>("#f7f0df");
  const [diaryFont, setDiaryFont] = useState<DiaryFont>("sans");
  const [diaryPaper, setDiaryPaper] = useState<DiaryPaper>("parchment");
  const [appearanceSaving, setAppearanceSaving] = useState(false);

  useEffect(() => {
    const color = window.localStorage.getItem("getsemani-diary-ink");
    const font = window.localStorage.getItem("getsemani-diary-font") as DiaryFont | null;
    const paper = window.localStorage.getItem("getsemani-diary-paper") as DiaryPaper | null;
    if (diaryColors.some((option) => option.value === color)) {
      setInkColor(color as (typeof diaryColors)[number]["value"]);
    }
    if (font && diaryFonts.some((option) => option.value === font)) setDiaryFont(font);
    if (paper && diaryPapers.some((option) => option.value === paper)) setDiaryPaper(paper);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("getsemani-diary-ink", inkColor);
    window.localStorage.setItem("getsemani-diary-font", diaryFont);
    window.localStorage.setItem("getsemani-diary-paper", diaryPaper);
  }, [inkColor, diaryFont, diaryPaper]);

  useEffect(() => {
    void loadDiaryAppearance()
      .then((appearance) => {
        if (!appearance) return;
        if (diaryColors.some((option) => option.value === appearance.inkColor)) {
          setInkColor(appearance.inkColor as (typeof diaryColors)[number]["value"]);
        }
        if (diaryFonts.some((option) => option.value === appearance.font)) {
          setDiaryFont(appearance.font as DiaryFont);
        }
        if (diaryPapers.some((option) => option.value === appearance.paper)) {
          setDiaryPaper(appearance.paper as DiaryPaper);
        }
      })
      .catch(() => undefined);
  }, []);

  const saveAppearance = async () => {
    setAppearanceSaving(true);
    try {
      await saveDiaryAppearance({ inkColor, font: diaryFont, paper: diaryPaper });
      toast("Aparência salva na sua conta ✨");
    } catch (error) {
      toast("Não foi possível salvar a aparência.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setAppearanceSaving(false);
    }
  };

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

  const selectedDay = new Date(`${selectedDate}T12:00:00`);
  const monday = new Date(selectedDay);
  const weekday = selectedDay.getDay();
  monday.setDate(selectedDay.getDate() - (weekday === 0 ? 6 : weekday - 1));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: localDateKey(date),
      weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      day: date.getDate(),
    };
  });

  const activeFontClass = diaryFonts.find((option) => option.value === diaryFont)?.className ?? "";

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
      <main className="desktop-content mt-5 px-6">
        <section className="diary-week" aria-label="Calendário semanal">
          <button
            onClick={() => moveDay(-7)}
            aria-label="Semana anterior"
            className="diary-week-arrow"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="diary-week-days">
            {weekDays.map((day) => {
              const selected = selectedDate === day.key;
              const saved = savedDays.find((savedDay) => savedDay.entry_date === day.key);
              return (
                <button
                  type="button"
                  key={day.key}
                  onClick={() => setSelectedDate(day.key)}
                  aria-current={selected ? "date" : undefined}
                  aria-label={`${day.weekday}, dia ${day.day}${saved ? ", possui registro" : ""}`}
                  className={`diary-week-day ${selected ? "is-selected" : ""}`}
                >
                  <span>{day.weekday}</span>
                  <strong>{day.day}</strong>
                  <i className={saved ? "is-saved" : ""} aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <button
            onClick={() => moveDay(7)}
            aria-label="Próxima semana"
            className="diary-week-arrow"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>

        <div
          className={`diary-paper diary-paper-${diaryPaper} relative overflow-hidden rounded-[28px] border border-g-gold/30 p-6 shadow-2xl`}
          style={{ color: inkColor }}
        >
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
              className={`mt-6 min-h-[360px] w-full resize-none bg-transparent text-[1rem] leading-8 outline-none placeholder:text-white/35 ${activeFontClass} ${hidden ? "select-none blur-md" : ""}`}
              style={{ color: inkColor }}
            />
          )}
          <div className="mt-4 flex items-center justify-between text-xs opacity-60">
            <span>{protectedDiary ? "Protegido com senha" : "Diário aberto"}</span>
            <span>{unlocked ? `${text.length} caracteres` : "Conteúdo protegido"}</span>
          </div>

          {passwordMode && (
            <div className="diary-password-overlay absolute inset-0 z-10 grid place-items-center p-6 backdrop-blur-2xl">
              <form
                onSubmit={handlePassword}
                className="diary-password-card w-full max-w-xs text-center"
              >
                <span className="diary-password-icon mx-auto grid h-14 w-14 place-items-center rounded-full">
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
                    className="diary-password-input w-full rounded-xl px-4 py-3 pr-11 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-g-muted"
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
                    className="diary-password-input mt-3 w-full rounded-xl px-4 py-3 outline-none"
                  />
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="diary-password-submit mt-4 w-full rounded-full py-3 font-bold disabled:opacity-50"
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

        <div className="diary-writing-tools mt-4" aria-label="Aparência da escrita">
          <div className="diary-tool-group">
            <Palette className="h-4 w-4 opacity-55" aria-hidden="true" />
            {diaryColors.map((color) => (
              <button
                type="button"
                key={color.value}
                onClick={() => setInkColor(color.value)}
                className={`diary-color-option ${inkColor === color.value ? "is-selected" : ""}`}
                style={{ backgroundColor: color.value }}
                aria-label={`Cor ${color.label}`}
                aria-pressed={inkColor === color.value}
              />
            ))}
          </div>
          <div className="diary-tool-group">
            <PaintBucket className="h-4 w-4 opacity-55" aria-hidden="true" />
            {diaryPapers.map((paper) => (
              <button
                type="button"
                key={paper.value}
                onClick={() => setDiaryPaper(paper.value)}
                className={`diary-paper-option ${diaryPaper === paper.value ? "is-selected" : ""}`}
                style={{ backgroundColor: paper.color }}
                aria-label={`Fundo ${paper.label}`}
                aria-pressed={diaryPaper === paper.value}
              />
            ))}
          </div>
          <div className="diary-tool-group">
            <Type className="h-4 w-4 opacity-55" aria-hidden="true" />
            {diaryFonts.map((font) => (
              <button
                type="button"
                key={font.value}
                onClick={() => setDiaryFont(font.value)}
                className={`diary-font-option ${font.className} ${diaryFont === font.value ? "is-selected" : ""}`}
                aria-label={`Fonte ${font.value}`}
                aria-pressed={diaryFont === font.value}
              >
                {font.label}
              </button>
            ))}
          </div>
          <label className="diary-date-picker" aria-label="Escolher outra data">
            <CalendarDays className="h-4 w-4" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={saveAppearance}
            disabled={appearanceSaving}
            className="diary-appearance-save"
            aria-label="Salvar aparência na minha conta"
            title="Salvar aparência na conta"
          >
            {appearanceSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </button>
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
