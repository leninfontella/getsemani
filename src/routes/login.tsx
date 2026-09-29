import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Apple, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { BrandLogo } from "@/components/AppShell";
import { isAuthenticated, loginLocal, loadUser, registerLocal, type Gender } from "@/lib/auth";
import { loadSettings, saveSettings } from "@/lib/goals";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Getsêmani" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) navigate({ to: "/", replace: true });
  }, [navigate]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLocaleLowerCase();
    if (!cleanEmail || password.length < 6 || (mode === "register" && (!name.trim() || !gender))) {
      toast("Preencha os dados corretamente.", {
        description: "A senha deve ter ao menos 6 caracteres.",
      });
      return;
    }
    if (mode === "register") {
      if (!gender) return;
      const existing = loadUser();
      if (existing && existing.email.toLocaleLowerCase() === cleanEmail) {
        toast("Este e-mail já está cadastrado.");
        setMode("login");
        return;
      }
      registerLocal({ name: name.trim(), email: cleanEmail, password, gender });
      saveSettings({ ...loadSettings(), name: name.trim() });
      setMode("login");
      setName("");
      setPassword("");
      setGender("");
      toast("Conta criada com sucesso ✨", { description: "Agora entre com seu e-mail e senha." });
      return;
    }
    if (!loginLocal(cleanEmail, password)) {
      toast("E-mail ou senha incorretos.");
      return;
    }
    setEntering(true);
    setTimeout(() => navigate({ to: "/", replace: true }), 2400);
  };

  const futureLogin = (provider: string) =>
    toast(`Entrar com ${provider}`, { description: "Esta opção estará disponível futuramente." });

  return (
    <div className="min-h-screen g-space px-5 py-8 font-sans-g text-g-text grid place-items-center">
      <Toaster />
      {entering && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b0c12]/95 backdrop-blur-md">
          <div className="text-center">
            <BrandLogo className="auth-logo-blink mx-auto h-[280px] w-[400px] max-w-[95vw]" />
            <p className="mt-4 text-sm tracking-[0.2em] text-g-gold">PREPARANDO SUA JORNADA</p>
          </div>
        </div>
      )}
      <main className="w-full max-w-[430px] rounded-[32px] border border-g-gold/25 bg-[#171923]/90 px-6 py-7 shadow-[0_0_60px_rgba(201,169,93,.18)] backdrop-blur-xl">
        <BrandLogo className="mx-auto h-[200px] w-[360px] max-w-full" />
        <div className="mt-3 grid grid-cols-2 rounded-full bg-white/5 p-1">
          <button
            onClick={() => setMode("login")}
            className={`rounded-full py-2.5 text-sm font-semibold transition ${mode === "login" ? "bg-g-gold text-g-bg" : "text-g-muted"}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-full py-2.5 text-sm font-semibold transition ${mode === "register" ? "bg-g-gold text-g-bg" : "text-g-muted"}`}
          >
            Criar conta
          </button>
        </div>
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-semibold">
            {mode === "login" ? "Bem-vindo(a) de volta!" : "Comece sua jornada"}
          </h1>
          <p className="mt-1 text-sm text-g-muted">
            {mode === "login"
              ? "Entre para continuar manifestando."
              : "Crie seu espaço de manifestações."}
          </p>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "register" && (
            <>
              <Field icon={<UserRound />}>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Seu nome"
                  className="auth-input"
                />
              </Field>
              <fieldset className="rounded-xl border border-white/10 bg-white/5 p-3">
                <legend className="px-1 text-xs text-g-muted">Como você se identifica?</legend>
                <div className="mt-1 grid gap-2">
                  {(
                    [
                      ["masculino", "Masculino"],
                      ["feminino", "Feminino"],
                      ["nao-informar", "Prefiro não informar"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <input
                        required
                        type="radio"
                        name="gender"
                        value={value}
                        checked={gender === value}
                        onChange={() => setGender(value)}
                        className="accent-[var(--g-gold)]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          <Field icon={<Mail />}>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="E-mail"
              className="auth-input"
            />
          </Field>
          <Field icon={<LockKeyhole />}>
            <input
              required
              type={showPassword ? "text" : "password"}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="Senha"
              className="auth-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 text-g-muted"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </Field>
          <button
            type="submit"
            disabled={entering}
            className="g-cta mt-2 w-full rounded-full py-4 text-base font-extrabold text-g-bg"
          >
            {mode === "login" ? "ENTRAR" : "CRIAR MINHA CONTA"}
          </button>
        </form>
        <div className="my-6 flex items-center gap-3 text-xs text-g-muted">
          <span className="h-px flex-1 bg-white/10" />
          ou continue com
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => futureLogin("Google")}
            className="rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold"
          >
            <span className="mr-2 font-bold text-g-gold">G</span>Google
          </button>
          <button
            onClick={() => futureLogin("Apple")}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold"
          >
            <Apple className="h-5 w-5" />
            Apple
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-g-muted">
          Google e Apple estarão disponíveis futuramente.
        </p>
      </main>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="relative flex items-center rounded-xl border border-white/10 bg-white/5 px-4 focus-within:border-g-gold">
      <span className="text-g-gold [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      {children}
    </label>
  );
}
