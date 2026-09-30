import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseKey = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
  import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return supabase;
}

export function clearLocalSupabaseSession() {
  if (typeof window === "undefined" || !supabaseUrl) return;
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const storagePrefix = `sb-${projectRef}-auth-token`;
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(storagePrefix)) localStorage.removeItem(key);
  }
}

/** Remove every browser-side artifact that can survive an account switch. */
export async function clearBrowserSessionData() {
  if (typeof window === "undefined") return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith("getsemani-") || key?.startsWith("sb-")) storage.removeItem(key);
    }
  }

  if ("caches" in window) {
    await Promise.all((await caches.keys()).map((name) => caches.delete(name)));
  }

  if ("databases" in indexedDB) {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases
        .map((database) => database.name)
        .filter((name): name is string => Boolean(name?.startsWith("getsemani-")))
        .map(
          (name) =>
            new Promise<void>((resolve) => {
              const request = indexedDB.deleteDatabase(name);
              request.onsuccess = request.onerror = request.onblocked = () => resolve();
            }),
        ),
    );
  }
}
