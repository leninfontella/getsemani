export type Gender = "masculino" | "feminino" | "nao-informar";
import { clearLocalSupabaseSession, requireSupabase, supabase } from "./supabase";

export type LocalUser = { name: string; email: string; gender?: Gender };

const USER_KEY = "getsemani-user";

export function loadUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: LocalUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function registerUser(user: LocalUser & { password: string }) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      data: { name: user.name, gender: user.gender || "nao-informar" },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  if (error) throw error;
  cacheUser({
    name: user.name,
    email: user.email,
    ...(user.gender ? { gender: user.gender } : {}),
  });
  if (data.session) await client.auth.signOut();
  return data;
}

export async function loginUser(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const metadata = data.user.user_metadata;
  const { data: profile } = await client
    .from("profiles")
    .select("name, gender")
    .eq("id", data.user.id)
    .maybeSingle();
  cacheUser({
    name: String(profile?.name || metadata["name"] || email.split("@")[0]),
    email,
    gender:
      (profile?.gender as Gender | undefined) ||
      (metadata["gender"] as Gender | undefined) ||
      "nao-informar",
  });
  return data;
}

export async function refreshCachedUser() {
  const client = requireSupabase();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw authError || new Error("Sessão expirada.");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("name, gender")
    .eq("id", auth.user.id)
    .single();
  if (profileError) throw profileError;
  const user: LocalUser = {
    name: profile.name,
    email: auth.user.email || "",
    gender: profile.gender as Gender,
  };
  cacheUser(user);
  return user;
}

export async function isAuthenticated() {
  if (!supabase) return false;
  const { data, error } = await supabase.auth.getUser();
  if (data.user) return true;
  if (error && (error.status === 401 || error.status === 403)) return false;
  // Uma falha temporária de rede não deve desconectar o usuário imediatamente.
  const { data: session } = await supabase.auth.getSession();
  return Boolean(session.session);
}

export async function logoutUser() {
  if (supabase) await supabase.auth.signOut();
}

export async function deleteAccount() {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("delete-account", {
    method: "POST",
  });
  if (error) throw error;
  if (!data?.deleted) throw new Error(data?.error || "Não foi possível excluir a conta.");
  // O usuário já foi removido do Auth. Limpar o armazenamento diretamente evita
  // uma chamada redundante a /logout, que responderia 403 para uma conta inexistente.
  clearLocalSupabaseSession();
}

export function clearCachedUser() {
  localStorage.removeItem(USER_KEY);
}
