import house from "@/assets/goal-house.jpg";
import peace from "@/assets/goal-peace.jpg";
import career from "@/assets/goal-career.jpg";
import travel from "@/assets/goal-travel.jpg";
import universe from "@/assets/goal-universe.png";
import love from "@/assets/goal-love.jpg";
import money from "@/assets/goal-money.jpeg";
import gratitude from "@/assets/goal-gratitude.jpg";
import healthyFood from "@/assets/goal-healthy-food.jpg";
import health from "@/assets/goal-health.jpg";
import newCar from "@/assets/goal-new-car.jpg";
import { requireSupabase } from "./supabase";

export type Goal = { id: string; title: string; img?: string; prompt: string; example: string };

export const manifestGoals: Goal[] = [
  {
    id: "casa",
    title: "Minha Casa dos Sonhos",
    img: house,
    prompt: "Descreva sua casa como se já morasse nela…",
    example: "Eu sou grata por acordar todos os dias na minha casa dos sonhos.",
  },
  {
    id: "paz",
    title: "Paz Interior",
    img: peace,
    prompt: "Como você sente a paz que já habita em você?",
    example: "Eu sou calma, serena e em paz com tudo o que sou.",
  },
  {
    id: "amor",
    title: "Encontrar o Amor",
    img: love,
    prompt: "Descreva o amor que já chegou à sua vida…",
    example: "Eu sou grata por viver um amor verdadeiro, leve e recíproco.",
  },
  {
    id: "carreira",
    title: "Carreira Abundante",
    img: career,
    prompt: "Conte sobre o trabalho próspero que já é seu…",
    example: "Eu sou grata pela carreira abundante e realizadora que vivo.",
  },
  {
    id: "dinheiro",
    title: "Muito Dinheiro",
    img: money,
    prompt: "Descreva a prosperidade e a abundância financeira que já fazem parte da sua vida…",
    example: "Eu sou grata porque o dinheiro chega até mim com facilidade, abundância e propósito.",
  },
  {
    id: "gratidao",
    title: "Agradecimento, Gratidão...",
    img: gratitude,
    prompt: "Escreva tudo aquilo que hoje enche seu coração de gratidão…",
    example: "Eu agradeço por todas as bênçãos que fazem parte da minha vida.",
  },
  {
    id: "alimentacao-saudavel",
    title: "Alimentação Saudável",
    img: healthyFood,
    prompt: "Descreva como uma alimentação saudável já transforma seu corpo e seu bem-estar…",
    example: "Eu sou grata por nutrir meu corpo com alimentos saudáveis, saborosos e cheios de vida.",
  },
  {
    id: "saude",
    title: "Saúde",
    img: health,
    prompt: "Descreva a saúde, a vitalidade e o bem-estar que já fazem parte da sua vida…",
    example: "Eu sou grata por ter um corpo saudável, forte e cheio de energia todos os dias.",
  },
  {
    id: "carro-novo",
    title: "Carro Novo",
    img: newCar,
    prompt: "Descreva seu carro novo e a sensação de já estar dirigindo-o…",
    example: "Eu sou grata pelo meu carro novo, seguro, confortável e perfeito para mim.",
  },
  {
    id: "viagem",
    title: "Viagem pelo Mundo",
    img: travel,
    prompt: "Onde você está agora? O que vê e sente?",
    example: "Eu sou grata por conhecer lugares incríveis pelo mundo.",
  },
];

export type Entry = { date: string; text: string };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  localStorage.setItem(key, JSON.stringify(v));
}

const ENTRIES = "getsemani-entries";
const CUSTOM = "getsemani-custom-goals";

export function loadEntries(): Record<string, Entry[]> {
  return read(ENTRIES, {});
}
export function saveEntry(goalId: string, text: string) {
  const all = loadEntries();
  all[goalId] = [{ date: new Date().toISOString(), text }, ...(all[goalId] || [])];
  write(ENTRIES, all);
  return all[goalId];
}

export async function syncEntries() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("manifestations")
    .select("goal_id, title, content, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const entries: Record<string, Entry[]> = {};
  const customGoals = loadCustomGoals();
  for (const row of data || []) {
    (entries[row.goal_id] ||= []).push({ date: row.created_at, text: row.content });
    if (row.goal_id.startsWith("custom-") && !customGoals.some((goal) => goal.id === row.goal_id)) {
      customGoals.push({
        id: row.goal_id,
        title: row.title,
        img: universe,
        prompt: `Escreva sobre "${row.title}" como se já fosse seu…`,
        example: `Eu sou grata porque ${row.title.toLowerCase()} já é minha realidade.`,
      });
    }
  }
  write(ENTRIES, entries);
  write(CUSTOM, customGoals);
  return entries;
}

export async function saveRemoteEntry(goal: Goal, text: string) {
  const client = requireSupabase();
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw authError || new Error("Sessão expirada.");
  const { error } = await client.from("manifestations").insert({
    user_id: auth.user.id,
    goal_id: goal.id,
    title: goal.title,
    content: text,
  });
  if (error) throw error;
  return saveEntry(goal.id, text);
}

export async function deleteRemoteGoal(goalId: string) {
  const client = requireSupabase();
  const { error } = await client.from("manifestations").delete().eq("goal_id", goalId);
  if (error) throw error;
  const entries = loadEntries();
  delete entries[goalId];
  write(ENTRIES, entries);
  if (goalId.startsWith("custom-")) {
    write(
      CUSTOM,
      loadCustomGoals().filter((goal) => goal.id !== goalId),
    );
  }
}

export function loadCustomGoals(): Goal[] {
  return read<Goal[]>(CUSTOM, []).map((goal) => ({ ...goal, img: goal.img || universe }));
}
export function addCustomGoal(title: string): Goal {
  const g: Goal = {
    id: `custom-${Date.now()}`,
    title,
    img: universe,
    prompt: `Escreva sobre "${title}" como se já fosse seu…`,
    example: `Eu sou grata porque ${title.toLowerCase()} já é minha realidade.`,
  };
  write(CUSTOM, [...loadCustomGoals(), g]);
  return g;
}
export function allGoals(): Goal[] {
  return [...manifestGoals, ...loadCustomGoals()];
}
export function manifestedGoals(): Goal[] {
  const entries = loadEntries();
  return allGoals().filter((goal) => (entries[goal.id]?.length || 0) > 0);
}

/* Diário */
export type Diary = { text: string; locked: boolean; pin: string; updated?: string };
const DIARY = "getsemani-diary";
export const loadDiary = () => read<Diary>(DIARY, { text: "", locked: false, pin: "" });
export const saveDiary = (d: Diary) => write(DIARY, d);

/* Configurações */
export type Settings = {
  name: string;
  reminder: boolean;
  reminderTime: string;
  sounds: boolean;
  affirmations: boolean;
};
const SETTINGS = "getsemani-settings";
export const defaultSettings: Settings = {
  name: "Amelia",
  reminder: true,
  reminderTime: "07:00",
  sounds: true,
  affirmations: true,
};
export const loadSettings = () => ({
  ...defaultSettings,
  ...read<Partial<Settings>>(SETTINGS, {}),
});
export const saveSettings = (s: Settings) => write(SETTINGS, s);
export function clearAll() {
  if (typeof window === "undefined") return;
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("getsemani-")) localStorage.removeItem(key);
  }
}
