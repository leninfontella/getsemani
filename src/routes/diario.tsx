import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle, Lock, Save, Unlock } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  decryptDiary,
  loadCloudDiary,
  saveOpenDiary,
  saveProtectedDiary,
  type CloudDiary,
} from "@/lib/diary";
import { loadDiary, saveDiary } from "@/lib/goals";

export const Route = createFileRoute("/diario")({ component: DiaryPage });

type PasswordMode = "unlock" | "create" | null;

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

  useEffect(() => {
    void loadCloudDiary()
      .then(async (cloud) => {
        setStoredDiary(cloud);
        if (cloud?.locked) {
          setProtectedDiary(true);
          setUnlocked(false);
          setHidden(true);
          setPasswordMode("unlock");
          return;
        }
        const local = loadDiary();
        const initialText = cloud?.content ?? local.text;
        setText(initialText);
        if (!cloud && initialText) await saveOpenDiary(initialText);
      })
      .catch((error) =>
        toast("Não foi possível carregar o diário.", {
          description: error instanceof Error ? error.message : "Tente novamente.",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (protectedDiary) {
        await saveProtectedDiary(text, sessionPassword);
        saveDiary({ text: "", locked: true, pin: "", updated: new Date().toISOString() });
      } else {
        await saveOpenDiary(text);
        saveDiary({ text, locked: false, pin: "", updated: new Date().toISOString() });
      }
      toast("Página salva no seu diário ✨", { description: "Sincronizada com sua conta." });
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
        await saveProtectedDiary(text, password);
        setProtectedDiary(true);
        setUnlocked(true);
        setSessionPassword(password);
        setPasswordMode(null);
        setHidden(false);
        saveDiary({ text: "", locked: true, pin: "", updated: new Date().toISOString() });
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
      await saveOpenDiary(text);
      setProtectedDiary(false);
      setSessionPassword("");
      setStoredDiary(null);
      saveDiary({ text, locked: false, pin: "", updated: new Date().toISOString() });
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

  return (
    <AppShell title="Meu Diário">
      <main className="px-6 mt-5">
        <div className="diary-paper relative overflow-hidden rounded-[28px] border border-g-gold/30 p-6 text-[#382c4c] shadow-2xl">
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              onClick={() => setHidden(!hidden)}
              disabled={!unlocked}
              aria-label={hidden ? "Mostrar texto" : "Esconder texto"}
              className="h-9 w-9 rounded-full bg-[#493867]/10 grid place-items-center disabled:opacity-40"
            >
              {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleProtection}
              disabled={!unlocked || saving}
              aria-label={protectedDiary ? "Remover senha" : "Proteger com senha"}
              className="h-9 w-9 rounded-full bg-[#493867]/10 grid place-items-center disabled:opacity-40"
            >
              {protectedDiary ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
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
            <div className="absolute inset-0 z-10 grid place-items-center bg-[#f3e9d2]/95 p-6 backdrop-blur-md">
              <form onSubmit={handlePassword} className="w-full max-w-xs text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#493867]/10">
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
                    className="w-full rounded-xl border border-[#493867]/20 bg-white/60 px-4 py-3 pr-11 outline-none focus:border-[#7650a8]"
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
                    className="mt-3 w-full rounded-xl border border-[#493867]/20 bg-white/60 px-4 py-3 outline-none focus:border-[#7650a8]"
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
        <button
          onClick={save}
          disabled={!unlocked || loading || saving}
          className="g-cta mt-5 w-full rounded-full py-4 font-bold text-g-bg flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {saving ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saving ? "Salvando…" : "Salvar no diário"}
        </button>
        <p className="mt-3 text-center text-xs text-g-muted">
          Sincronizado com sua conta. Quando protegido, o texto é enviado criptografado.
        </p>
      </main>
    </AppShell>
  );
}
