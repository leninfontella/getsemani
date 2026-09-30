export type Gender = "masculino" | "feminino" | "nao-informar";
import {
  clearBrowserSessionData,
  clearLocalSupabaseSession,
  requireSupabase,
  supabase,
} from "./supabase";

export type LocalUser = { name: string; email: string; gender?: Gender; avatarUrl?: string };

const USER_KEY = "getsemani-user";

export function loadUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(USER_KEY);
    if (!value) return null;
    const user = JSON.parse(value) as LocalUser;
    // Object URLs belong to one document only and are invalid after a reload.
    if (user.avatarUrl?.startsWith("blob:")) {
      const { avatarUrl: _avatarUrl, ...withoutEphemeralAvatar } = user;
      localStorage.setItem(USER_KEY, JSON.stringify(withoutEphemeralAvatar));
      return withoutEphemeralAvatar;
    }
    return user;
  } catch {
    return null;
  }
}

function cacheUser(user: LocalUser) {
  const { avatarUrl, ...persistentUser } = user;
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(avatarUrl?.startsWith("blob:") ? persistentUser : user),
  );
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
  // Never let a previous account's cached UI survive into a new session.
  await clearBrowserSessionData();
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const metadata = data.user.user_metadata;
  const { data: profile } = await client
    .from("profiles")
    .select("name, gender, avatar_url")
    .eq("id", data.user.id)
    .maybeSingle();
  cacheUser({
    name: String(profile?.name || metadata["name"] || email.split("@")[0]),
    email,
    gender:
      (profile?.gender as Gender | undefined) ||
      (metadata["gender"] as Gender | undefined) ||
      "nao-informar",
    ...(profile?.avatar_url ? { avatarUrl: await loadPrivateAvatarUrl() } : {}),
  });
  return data;
}

export async function refreshCachedUser() {
  const client = requireSupabase();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw authError || new Error("Sessão expirada.");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("name, gender, avatar_url")
    .eq("id", auth.user.id)
    .single();
  if (profileError) throw profileError;
  const user: LocalUser = {
    name: profile.name,
    email: auth.user.email || "",
    gender: profile.gender as Gender,
    ...(profile.avatar_url ? { avatarUrl: await loadPrivateAvatarUrl() } : {}),
  };
  cacheUser(user);
  return user;
}

export async function updateUserName(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error("Informe como devemos chamar você.");
  if (normalizedName.length > 120) throw new Error("O nome deve ter no máximo 120 caracteres.");

  const client = requireSupabase();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw authError || new Error("Sessão expirada.");

  const { error: profileError } = await client
    .from("profiles")
    .update({ name: normalizedName })
    .eq("id", auth.user.id);
  if (profileError) throw profileError;

  // Mantém o nome de fallback do Auth alinhado ao perfil principal.
  const { error: metadataError } = await client.auth.updateUser({
    data: { ...auth.user.user_metadata, name: normalizedName },
  });
  if (metadataError) throw metadataError;

  const current = loadUser();
  const user: LocalUser = {
    name: normalizedName,
    email: auth.user.email || current?.email || "",
    ...(current?.gender ? { gender: current.gender } : {}),
    ...(current?.avatarUrl ? { avatarUrl: current.avatarUrl } : {}),
  };
  cacheUser(user);
  return user;
}

const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export async function uploadUserAvatar(file: File) {
  if (!AVATAR_TYPES.has(file.type)) throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  if (file.size > MAX_AVATAR_SIZE) throw new Error("A foto deve ter no máximo 5 MB.");

  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("avatar", {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (error) throw error;
  if (!data?.uploaded) throw new Error(data?.error || "Não foi possível enviar a foto.");

  const { error: profileError } = await client
    .from("profiles")
    .update({ avatar_url: "private" })
    .eq("id", data.userId);
  if (profileError) throw profileError;

  const current = loadUser();
  if (!current) throw new Error("Sessão expirada.");
  const user = { ...current, avatarUrl: await loadPrivateAvatarUrl() };
  cacheUser(user);
  return user;
}

async function loadPrivateAvatarUrl() {
  const client = requireSupabase();
  const { data, error, response } = await client.functions.invoke("avatar", { method: "GET" });
  if (error) throw error;
  const mediaType = response?.headers.get("x-avatar-content-type") || "image/jpeg";
  const blob = new Blob([data instanceof Blob ? data : data], { type: mediaType });
  return URL.createObjectURL(blob);
}

export async function removeUserAvatar() {
  const client = requireSupabase();
  const { data, error } = await client.functions.invoke("avatar", {
    method: "DELETE",
  });
  if (error) throw error;
  if (!data?.removed) throw new Error(data?.error || "Não foi possível remover a foto.");

  const { error: profileError } = await client
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", data.userId);
  if (profileError) throw profileError;

  const current = loadUser();
  if (!current) throw new Error("Sessão expirada.");
  const { avatarUrl: _avatarUrl, ...user } = current;
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
  try {
    if (supabase) await supabase.auth.signOut({ scope: "global" });
  } finally {
    await clearBrowserSessionData();
  }
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
  await clearBrowserSessionData();
}

export function clearCachedUser() {
  localStorage.removeItem(USER_KEY);
}
