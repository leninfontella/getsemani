import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { BrandLogo } from "@/components/AppShell";
import { isAuthenticated, loginUser, registerUser, type Gender } from "@/lib/auth";
import { clearAccountContentCache, loadSettings, saveSettings } from "@/lib/goals";
import { clearNotifications, scheduleWelcomeNotification } from "@/lib/notifications";

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
    void isAuthenticated().then((authenticated) => {
      if (authenticated) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLocaleLowerCase();
    const invalidPassword = mode === "register" ? password.length < 12 : password.length < 6;
    if (!cleanEmail || invalidPassword || (mode === "register" && (!name.trim() || !gender))) {
      toast("Preencha os dados corretamente.", {
        description:
          mode === "register"
            ? "Use uma senha com pelo menos 12 caracteres."
            : "Confira o e-mail e a senha.",
      });
      return;
    }
    if (mode === "register") {
      if (!gender) return;
      try {
        await registerUser({ name: name.trim(), email: cleanEmail, password, gender });
        saveSettings({ ...loadSettings(), name: name.trim() });
        setMode("login");
        setName("");
        setPassword("");
        setGender("");
        toast("Conta criada com sucesso ✨", {
          description: "Entre com o seu e-mail e senha.",
        });
      } catch {
        toast("Não foi possível criar a conta.", {
          description: "Confira os dados ou tente novamente em alguns minutos.",
        });
      }
      return;
    }
    try {
      const login = await loginUser(cleanEmail, password);
      clearAccountContentCache();
      clearNotifications();
      if (login.showWelcome) {
        const displayName = String(login.user.user_metadata["name"] || cleanEmail.split("@")[0]);
        scheduleWelcomeNotification(displayName, cleanEmail);
      }
    } catch {
      toast("Não foi possível entrar.", {
        description: "E-mail ou senha incorretos.",
      });
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
      <main className="glass-panel w-full max-w-[430px] rounded-[32px] px-6 py-7">
        <BrandLogo className="mx-auto h-[200px] w-[360px] max-w-full" />
        <div className="g-glass mt-3 grid grid-cols-2 rounded-full border border-white/10 p-1">
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
              <fieldset className="g-glass rounded-xl border border-white/15 p-3">
                <p className="px-1 text-xs text-g-muted">Como você se identifica?</p>
                <div className="mt-2 grid gap-2">
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
            className="g-glass flex items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-semibold"
          >
            <GoogleLogo /> Google
          </button>
          <button
            onClick={() => futureLogin("Apple")}
            className="g-glass flex items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-semibold"
          >
            <AppleLogo />
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

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.01v2.54h3.23c1.89-1.74 2.98-4.31 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.54c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.07v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.87A6.02 6.02 0 0 1 6.09 12c0-.65.11-1.28.31-1.87V7.51H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49l3.33-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.93 5.51l3.33 2.62C7.19 7.76 9.4 6 12 6Z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 384 512" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.4 4 272.2 4 298.1 8.7 324.9 18.2 352c12.7 36.7 58.5 126.7 106.4 125.2 25.1-.6 42.9-17.8 75.5-17.8 31.6 0 48.1 17.8 76 17.8 48.4-.7 90-82.5 102.1-119.3-64.9-30.6-59.5-87.2-59.5-89.2ZM261.3 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3Z" />
    </svg>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="g-glass relative flex items-center rounded-xl border border-white/15 px-4 focus-within:border-g-gold">
      <span className="text-g-gold [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      {children}
    </label>
  );
}
