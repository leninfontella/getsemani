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
import business from "@/assets/goal-business.jpg";
import financialFreedom from "@/assets/goal-financial-freedom.jpg";
import debtFree from "@/assets/goal-debt-free.jpg";
import exam from "@/assets/goal-exam.jpg";
import family from "@/assets/goal-family.jpg";
import friendship from "@/assets/goal-friendship.jpg";
import forgiveness from "@/assets/goal-forgiveness.jpg";
import dreamBody from "@/assets/goal-dream-body.jpg";
import confidence from "@/assets/goal-confidence.jpg";
import sleep from "@/assets/goal-sleep.jpg";
import faith from "@/assets/goal-faith.jpg";
import protection from "@/assets/goal-protection.jpg";
import god from "@/assets/goal-god.jpg";
import energy from "@/assets/goal-energy.jpg";
import liveAbroad from "@/assets/goal-live-abroad.jpg";
import countryHouse from "@/assets/goal-country-house.jpg";
import newTalent from "@/assets/goal-new-talent.jpg";
import parenthood from "@/assets/goal-parenthood.jpg";
import marriage from "@/assets/goal-marriage.jpg";
import recognition from "@/assets/goal-recognition.jpg";
import creativity from "@/assets/goal-creativity.jpg";
import habitFreedom from "@/assets/goal-habit-freedom.jpg";
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
    example:
      "Eu sou grata por nutrir meu corpo com alimentos saudáveis, saborosos e cheios de vida.",
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
  {
    id: "proprio-negocio",
    title: "Meu Próprio Negócio",
    img: business,
    prompt: "Descreva o negócio próspero que você já construiu…",
    example: "Eu sou grata pelo meu negócio próspero, sólido e cheio de propósito.",
  },
  {
    id: "liberdade-financeira",
    title: "Liberdade Financeira",
    img: financialFreedom,
    prompt: "Como é viver com independência, tranquilidade e liberdade financeira?",
    example: "Eu sou grata por viver com liberdade financeira e fazer escolhas com tranquilidade.",
  },
  {
    id: "dividas-quitadas",
    title: "Dívidas Quitadas",
    img: debtFree,
    prompt: "Descreva o alívio de ter todas as suas dívidas quitadas…",
    example: "Eu sou grata porque quitei todas as minhas dívidas e vivo em paz financeira.",
  },
  {
    id: "aprovacao-concurso",
    title: "Aprovação no Concurso",
    img: exam,
    prompt: "Conte como você se sente ao ver sua aprovação conquistada…",
    example: "Eu sou grata pela minha aprovação e celebro o resultado da minha dedicação.",
  },
  {
    id: "familia-unida",
    title: "Família Unida",
    img: family,
    prompt: "Descreva a harmonia, o carinho e a presença que existem em sua família…",
    example: "Eu sou grata pela união, pelo amor e pela paz que habitam a minha família.",
  },
  {
    id: "amizades-verdadeiras",
    title: "Amizades Verdadeiras",
    img: friendship,
    prompt: "Como são as amizades sinceras e recíprocas que fazem parte da sua vida?",
    example: "Eu sou grata por cultivar amizades verdadeiras, leves e presentes.",
  },
  {
    id: "perdao-libertacao",
    title: "Perdão e Libertação",
    img: forgiveness,
    prompt: "Escreva sobre a leveza de perdoar e deixar as mágoas para trás…",
    example: "Eu libero o passado com amor e sigo em paz, leve e livre.",
  },
  {
    id: "corpo-dos-sonhos",
    title: "Corpo dos Sonhos",
    img: dreamBody,
    prompt: "Descreva seu corpo saudável, forte e cheio de vitalidade…",
    example: "Eu sou grata pelo meu corpo saudável, forte e em constante evolução.",
  },
  {
    id: "autoconfianca",
    title: "Autoconfiança",
    img: confidence,
    prompt: "Como você age e se sente quando confia plenamente em si?",
    example: "Eu confio em mim, reconheço meu valor e caminho com segurança.",
  },
  {
    id: "sono-descanso",
    title: "Sono e Descanso",
    img: sleep,
    prompt: "Descreva suas noites tranquilas e o bem-estar ao despertar…",
    example: "Eu durmo profundamente e acordo em paz, renovada e cheia de energia.",
  },
  {
    id: "fe-proposito",
    title: "Fé e Propósito",
    img: faith,
    prompt: "Escreva sobre a fé que guia seus passos e o propósito que move sua vida…",
    example: "Eu caminho com fé e reconheço o propósito divino presente em minha jornada.",
  },
  {
    id: "protecao",
    title: "Proteção",
    img: protection,
    prompt: "Visualize seu lar e as pessoas que ama envolvidos em proteção…",
    example: "Eu sou grata pela proteção que envolve meu lar e todos que amo.",
  },
  {
    id: "conexao-com-deus",
    title: "Conexão com Deus",
    img: god,
    prompt: "Como você sente a presença de Deus em sua vida e em suas escolhas?",
    example: "Eu sou grata pela minha conexão com Deus, que me fortalece e guia todos os dias.",
  },
  {
    id: "energia-disposicao",
    title: "Energia e Disposição",
    img: energy,
    prompt: "Descreva seus dias com vitalidade, entusiasmo e disposição…",
    example: "Eu acordo com energia e disposição para viver plenamente cada novo dia.",
  },
  {
    id: "morar-exterior",
    title: "Morar no Exterior",
    img: liveAbroad,
    prompt: "Conte como é sua nova vida no país onde sempre quis morar…",
    example: "Eu sou grata pela vida próspera, segura e feliz que construí no exterior.",
  },
  {
    id: "casa-praia-campo",
    title: "Casa na Praia ou no Campo",
    img: countryHouse,
    prompt: "Descreva cada detalhe do seu refúgio na praia ou no campo…",
    example: "Eu sou grata pelo meu lar tranquilo, cercado de natureza e paz.",
  },
  {
    id: "novo-idioma-talento",
    title: "Novo Idioma ou Talento",
    img: newTalent,
    prompt: "Como é dominar a habilidade que você sempre quis aprender?",
    example: "Eu aprendo com facilidade e celebro o novo talento que já faz parte de mim.",
  },
  {
    id: "maternidade-paternidade",
    title: "Maternidade e Paternidade",
    img: parenthood,
    prompt: "Descreva o amor e a alegria de viver a maternidade ou a paternidade…",
    example: "Eu sou grata por viver a maternidade e a paternidade com amor, presença e sabedoria.",
  },
  {
    id: "casamento-parceria",
    title: "Casamento e Parceria",
    img: marriage,
    prompt: "Como é compartilhar a vida em um casamento amoroso e companheiro?",
    example: "Eu sou grata por viver um casamento de amor, respeito, parceria e cumplicidade.",
  },
  {
    id: "reconhecimento-influencia",
    title: "Reconhecimento e Influência",
    img: recognition,
    prompt: "Descreva o reconhecimento que seu trabalho e sua presença já conquistaram…",
    example: "Eu sou grata por ser reconhecida e por usar minha influência para transformar vidas.",
  },
  {
    id: "criatividade",
    title: "Criatividade",
    img: creativity,
    prompt: "Conte como suas ideias fluem e ganham vida através da sua criatividade…",
    example:
      "Minha criatividade flui livremente e transforma minhas ideias em algo extraordinário.",
  },
  {
    id: "libertacao-habitos",
    title: "Libertação de Hábitos",
    img: habitFreedom,
    prompt: "Descreva a liberdade de deixar para trás os hábitos que já não servem a você…",
    example: "Eu sou livre, escolho o que me faz bem e construo hábitos que fortalecem minha vida.",
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
export function manifestedGoals(entries: Record<string, Entry[]> = loadEntries()): Goal[] {
  const latestEntry = (goalId: string) =>
    Math.max(...(entries[goalId] || []).map((entry) => Date.parse(entry.date)), 0);

  return allGoals()
    .filter((goal) => (entries[goal.id]?.length || 0) > 0)
    .sort((a, b) => latestEntry(b.id) - latestEntry(a.id));
}

/* Livro */
export type Diary = { text: string; locked: boolean; pin: string; updated?: string };
const DIARY = "getsemani-diary";
export const loadDiary = () => read<Diary>(DIARY, { text: "", locked: false, pin: "" });
export const saveDiary = (d: Diary) => write(DIARY, d);

export function clearAccountContentCache() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DIARY);
  localStorage.removeItem(ENTRIES);
  localStorage.removeItem(CUSTOM);
}

/* Configurações */
export type Settings = {
  name: string;
  reminder: boolean;
  reminderTime: string;
  sounds: boolean;
  affirmations: boolean;
};
const SETTINGS = "getsemani-settings";
export const SETTINGS_CHANGED = "getsemani:settings-changed";
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
export const saveSettings = (s: Settings) => {
  write(SETTINGS, s);
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SETTINGS_CHANGED));
};
export function clearAll() {
  if (typeof window === "undefined") return;
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith("getsemani-")) localStorage.removeItem(key);
  }
}
