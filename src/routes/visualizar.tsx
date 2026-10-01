import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, GoalThumb } from "@/components/AppShell";
import { LiquidConfirmDialog } from "@/components/LiquidConfirmDialog";
import {
  deleteRemoteGoal,
  loadEntries,
  manifestedGoals,
  syncEntries,
  type Entry,
  type Goal,
} from "@/lib/goals";

export const Route = createFileRoute("/visualizar")({ component: VisualizePage });
type Item = { goal: Goal; entries: Entry[] };

function itemsByLatestEntry(entriesByGoal: Record<string, Entry[]>): Item[] {
  return manifestedGoals(entriesByGoal)
    .map((goal) => ({ goal, entries: entriesByGoal[goal.id] || [] }))
    .sort((a, b) => {
      const latestA = Math.max(...a.entries.map((entry) => Date.parse(entry.date)), 0);
      const latestB = Math.max(...b.entries.map((entry) => Date.parse(entry.date)), 0);
      return latestB - latestA;
    });
}

function VisualizePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const entries = loadEntries();
    setItems(itemsByLatestEntry(entries));
    void syncEntries()
      .then((remote) => setItems(itemsByLatestEntry(remote)))
      .catch(() => undefined);
  }, []);
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteRemoteGoal(pendingDelete.id);
      setItems((current) => current.filter(({ goal }) => goal.id !== pendingDelete.id));
      toast("Manifestação excluída.", { description: "Todos os registros foram removidos." });
      setPendingDelete(null);
    } catch (error) {
      toast("Não foi possível excluir.", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setDeleting(false);
    }
  };
  return (
    <AppShell title="Todas as manifestações">
      <LiquidConfirmDialog
        open={Boolean(pendingDelete)}
        icon={<Trash2 className="h-7 w-7" />}
        title="Excluir manifestação?"
        description={
          <>Todos os registros de “{pendingDelete?.title}” serão removidos permanentemente.</>
        }
        confirmLabel="Excluir"
        loading={deleting}
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <main className="desktop-content px-6 mt-6">
        <p className="text-sm text-g-muted">Releia, sinta e visualize como se tudo já fosse seu.</p>
        {items.length ? (
          <div className="mt-5 space-y-4">
            {items.map(({ goal, entries }) => (
              <article
                key={goal.id}
                className="relative rounded-2xl border border-g-violet/40 g-glass"
              >
                <Link
                  to="/manifestar/$goal"
                  params={{ goal: goal.id }}
                  search={{ historico: true }}
                  className="flex gap-4 p-3 pr-12"
                >
                  <GoalThumb
                    img={goal.img}
                    title={goal.title}
                    className="h-24 w-24 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 py-1">
                    <h2 className="font-semibold">{goal.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-g-muted">{entries[0]?.text}</p>
                    <p className="mt-2 text-xs text-g-gold">
                      {entries.length} {entries.length === 1 ? "registro" : "registros"}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => setPendingDelete(goal)}
                  aria-label={`Excluir ${goal.title}`}
                  className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-red-400/10 text-red-300 transition hover:bg-red-400/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-g-gold" />
            <p className="mt-3 text-g-muted">Você ainda não criou manifestações.</p>
            <Link to="/manifestar" className="mt-5 inline-block text-g-gold underline">
              Criar minha primeira
            </Link>
          </div>
        )}
        <div className="flex justify-center py-8">
          <Link
            to="/manifestar"
            aria-label="Adicionar nova manifestação"
            title="Adicionar nova manifestação"
            className="liquid-button grid h-14 w-14 place-items-center rounded-full border border-g-gold/50 text-g-gold shadow-[0_0_24px_rgba(246,204,111,0.28)] transition hover:scale-105 hover:shadow-[0_0_32px_rgba(246,204,111,0.45)]"
          >
            <Plus className="h-7 w-7" />
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
