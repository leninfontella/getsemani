import { requireSupabase } from "./supabase";

export type CloudDiary = {
  entry_date: string;
  content: string;
  locked: boolean;
  encryption_salt: string | null;
  encryption_iv: string | null;
  updated_at: string;
};

export type DiaryAppearance = {
  inkColor: string;
  font: string;
  paper: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 210_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function currentUserId() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw error || new Error("Sessão expirada.");
  return { client, userId: data.user.id };
}

export async function loadDiaryAppearance(): Promise<DiaryAppearance | null> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw error || new Error("Sessão expirada.");
  const appearance = data.user.user_metadata["diary_appearance"];
  return appearance && typeof appearance === "object" ? (appearance as DiaryAppearance) : null;
}

export async function saveDiaryAppearance(appearance: DiaryAppearance) {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw error || new Error("Sessão expirada.");
  const { error: updateError } = await client.auth.updateUser({
    data: { ...data.user.user_metadata, diary_appearance: appearance },
  });
  if (updateError) throw updateError;
}

export async function loadCloudDiary(entryDate: string): Promise<CloudDiary | null> {
  const { client, userId } = await currentUserId();
  const { data, error } = await client
    .from("diaries")
    .select("entry_date, content, locked, encryption_salt, encryption_iv, updated_at")
    .eq("user_id", userId)
    .eq("entry_date", entryDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listDiaryDays() {
  const { client, userId } = await currentUserId();
  const { data, error } = await client
    .from("diaries")
    .select("entry_date, updated_at, locked")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveOpenDiary(entryDate: string, content: string) {
  const { client, userId } = await currentUserId();
  const { error } = await client.from("diaries").upsert(
    {
      user_id: userId,
      entry_date: entryDate,
      content,
      locked: false,
      encryption_salt: null,
      encryption_iv: null,
    },
    { onConflict: "user_id,entry_date" },
  );
  if (error) throw error;
}

export async function saveProtectedDiary(entryDate: string, content: string, password: string) {
  const { client, userId } = await currentUserId();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    encoder.encode(content),
  );
  const { error } = await client.from("diaries").upsert(
    {
      user_id: userId,
      entry_date: entryDate,
      content: toBase64(new Uint8Array(encrypted)),
      locked: true,
      encryption_salt: toBase64(salt),
      encryption_iv: toBase64(iv),
    },
    { onConflict: "user_id,entry_date" },
  );
  if (error) throw error;
}

export async function deleteCloudDiary(entryDate: string) {
  const { client, userId } = await currentUserId();
  const { error } = await client
    .from("diaries")
    .delete()
    .eq("user_id", userId)
    .eq("entry_date", entryDate);
  if (error) throw error;
}

export async function decryptDiary(diary: CloudDiary, password: string) {
  if (!diary.encryption_salt || !diary.encryption_iv) throw new Error("Livro inválido.");
  try {
    const key = await deriveKey(password, fromBase64(diary.encryption_salt));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(diary.encryption_iv) as BufferSource },
      key,
      fromBase64(diary.content) as BufferSource,
    );
    return decoder.decode(decrypted);
  } catch {
    throw new Error("Senha incorreta.");
  }
}
