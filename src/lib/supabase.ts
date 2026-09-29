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
