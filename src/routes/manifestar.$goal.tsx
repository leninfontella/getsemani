import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { addNotification } from "@/lib/notifications";
import { Toaster } from "@/components/ui/sonner";
import { AppNav, BackButton, HomeButton } from "@/components/AppShell";
import {
  allGoals,
  manifestGoals,
  loadEntries,
  loadSettings,
  saveRemoteEntry,
  syncEntries,
  type Entry,
} from "@/lib/goals";

export const Route = createFileRoute("/manifestar/$goal")({
  validateSearch: (search: Record<string, unknown>) => ({
    historico: search["historico"] === true || search["historico"] === "true",
  }),
  loader: ({ params }) => {
    const goal = manifestGoals.find((g) => g.id === params.goal);
    if (!goal && !params.goal.startsWith("custom-")) throw notFound();
    return { goalId: params.goal };
  },
  head: ({ loaderData }) => {
    const g = manifestGoals.find((x) => x.id === loaderData?.goalId);
    const title = g ? `${g.title} — Manifestar | Getsêmani` : "Manifestação — Getsêmani";
    return {
      meta: [
        { title },
        { name: "description", content: "Escreva sua manifestação diária como se já fosse sua." },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Escreva sua manifestação diária como se já fosse sua.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: GoalNotFound,
  component: ManifestGoal,
});

function GoalNotFound() {
  return (
    <div className="min-h-screen g-space text-g-text grid place-items-center font-sans-g">
      <Link to="/manifestar" className="text-g-gold underline">
        Escolher uma manifestação
      </Link>
    </div>
  );
}

function ManifestGoal() {
  const { goalId } = Route.useLoaderData();
  const { historico } = Route.useSearch();
  const goal = allGoals().find((g) => g.id === goalId);
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "submitted">("idle");
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    setSubmitStatus("idle");
    setEntries(loadEntries()[goalId] || []);
    void syncEntries()
      .then((all) => setEntries(all[goalId] || []))
      .catch(() => undefined);
  }, [goalId]);

  if (!goal) return <GoalNotFound />;

  const writtenToday = entries.some(
    (e) => new Date(e.date).toDateString() === new Date().toDateString(),
  );

  const submit = async () => {
    if (submitStatus !== "idle") return;
    const t = text.trim();
    if (!t) {
      toast("Escreva sua manifestação primeiro.");
      return;
    }
    setSubmitStatus("submitting");
    const submittingStartedAt = Date.now();
    try {
      setEntries(await saveRemoteEntry(goal, t));
      setText("");
      if (!writtenToday) {
        if (loadSettings().sounds) navigator.vibrate?.(35);
        setCelebrating(true);
        window.setTimeout(() => setCelebrating(false), 1800);
      }
      toast("✨ Assim é, e já é seu.", { description: "Sua manifestação foi registrada." });
      addNotification({
        kind: "success",
        title: "Manifestação registrada ✨",
        message: `Sua manifestação “${goal.title}” foi salva com sucesso.`,
      });
      const remainingTime = 1000 - (Date.now() - submittingStartedAt);
      if (remainingTime > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingTime));
      }
      setSubmitStatus("submitted");
    } catch (error) {
      toast("Não foi possível salvar.", {
        description: error instanceof Error ? error.message : "Verifique sua conexão.",
      });
      setSubmitStatus("idle");
    }
  };

  const formatOnEnter = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const before = text.slice(0, start);
    const lineStart = before.lastIndexOf("\n") + 1;
    const prefix = before.slice(0, lineStart);
    const phrase = before.slice(lineStart).trim();
    const formatted = phrase
      ? `${phrase.charAt(0).toLocaleUpperCase("pt-BR")}${phrase.slice(1).replace(/[.!?]+$/, "")}!`
      : "";
    const next = `${prefix}${formatted}\n${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      const cursor = prefix.length + formatted.length + 1;
      target.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="manifest-editor min-h-screen g-space font-sans-g text-g-text flex justify-center">
      <Toaster />
      {celebrating && (
        <div className="gold-confetti" aria-hidden="true">
          {Array.from({ length: 18 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      )}
      <div className="manifest-editor-page relative w-full max-w-[430px] min-h-screen g-stars pb-32">
        <div className="manifest-editor-hero relative">
          {goal.img ? (
            <img
              src={goal.img}
              alt={goal.title}
              width={816}
              height={816}
              className="h-60 w-full object-cover"
            />
          ) : (
            <div className="h-60 w-full g-cta opacity-40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-g-bg" />
          <BackButton className="absolute left-5 top-6 z-10" />
          <h1 className="absolute bottom-3 left-6 right-6 text-3xl font-semibold">{goal.title}</h1>
        </div>

        <section className="px-6 mt-4">
          <div className="flex items-center justify-between gap-3 text-sm text-g-muted">
            <p>
              {writtenToday ? (
                <span className="text-g-gold">
                  Continue escrevendo o que deseja!
                </span>
              ) : (
                "Sua manifestação de hoje"
              )}
            </p>
            <span className="shrink-0 text-[10px] text-g-gold">Apenas digite e aperte ENTER</span>
          </div>
          <div className="mt-3 rounded-3xl border border-g-gold/10 g-glass p-4">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (submitStatus === "submitted") setSubmitStatus("idle");
              }}
              onKeyDown={formatOnEnter}
              placeholder={`${goal.prompt}\n\nEx.: "${goal.example}"`}
              rows={7}
              className="w-full resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-g-muted/70"
            />
          </div>
          <button
            onClick={() => void submit()}
            disabled={submitStatus !== "idle"}
            aria-busy={submitStatus === "submitting"}
            className="manifest-gold-button mx-auto mt-6 w-[70%] py-4 flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-80"
          >
            {submitStatus === "idle"
              ? "MANIFESTAR"
              : submitStatus === "submitting"
                ? "MANIFESTANDO..."
                : "MANIFESTADO!"}
          </button>
          <HomeButton className="mx-auto mt-4" />
        </section>

        {historico && (
          <section className="px-6 mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-g-gold">Histórico</p>
                <h2 className="mt-1 text-xl font-semibold">Registros da manifestação</h2>
              </div>
              <span className="text-xs text-g-muted">
                {entries.length} {entries.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            {entries.length === 0 ? (
              <p className="card-border g-glass mt-4 rounded-2xl p-5 text-center text-sm text-g-muted">
                Nenhum registro salvo ainda.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {entries.map((entry, index) => {
                  const date = new Date(entry.date);
                  return (
                    <li
                      key={`${entry.date}-${index}`}
                      className="card-border rounded-2xl g-glass p-4"
                    >
                      <time dateTime={entry.date} className="text-xs font-medium text-g-gold">
                        {date.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                        {" às "}
                        {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </time>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-g-text">
                        {entry.text}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
      <AppNav mobileOnly />
    </div>
  );
}
