import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell, GoalThumb } from "@/components/AppShell";
import { loadEntries, manifestedGoals, type Entry, type Goal } from "@/lib/goals";

export const Route = createFileRoute("/visualizar")({ component: VisualizePage });
type Item = { goal: Goal; entries: Entry[] };
function VisualizePage() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    const entries = loadEntries();
    setItems(manifestedGoals().map((goal) => ({ goal, entries: entries[goal.id] || [] })));
  }, []);
  return (
    <AppShell title="Todas as manifestações">
      <main className="px-6 mt-6">
        <p className="text-sm text-g-muted">Releia, sinta e visualize como se tudo já fosse seu.</p>
        {items.length ? (
          <div className="mt-5 space-y-4">
            {items.map(({ goal, entries }) => (
              <Link
                key={goal.id}
                to="/manifestar/$goal"
                params={{ goal: goal.id }}
                search={{ historico: true }}
                className="flex gap-4 rounded-2xl border border-g-violet/40 g-glass p-3"
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
      </main>
    </AppShell>
  );
}
