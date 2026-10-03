import { loadSettings } from "./goals";
import { loadUser } from "./auth";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  kind: "reminder" | "affirmation" | "success";
};

const STORAGE_KEY = "getsemani-notifications";
const PENDING_WELCOME_KEY = "getsemani-pending-welcome";
const LEGACY_WELCOME_REMOVED_KEY = "getsemani-legacy-welcome-removed";
export const NOTIFICATIONS_CHANGED = "getsemani:notifications-changed";

const DAILY_AFFIRMATIONS = [
  "Eu confio no processo e recebo com gratidão tudo o que já está a caminho.",
  "Eu mereço viver uma vida abundante, leve e cheia de propósito.",
  "Tudo o que preciso chega até mim no momento certo.",
  "Minha mente está alinhada com a realidade que desejo criar.",
  "Eu atraio oportunidades que combinam com os meus sonhos.",
  "A cada dia, eu me aproximo da melhor versão de mim.",
  "Eu escolho pensamentos que fortalecem minha confiança e minha paz.",
  "Minha energia abre caminhos para experiências extraordinárias.",
  "Eu sou capaz de transformar intenção em ação e ação em resultado.",
  "A abundância flui livremente em todas as áreas da minha vida.",
  "Eu libero o que não me serve e acolho novas possibilidades.",
  "Meu coração está aberto para receber amor, alegria e prosperidade.",
  "Eu confio na minha intuição e honro o meu próprio caminho.",
  "Cada pequeno passo que dou constrói a vida que desejo.",
  "Eu sou grato(a) pelo presente e confiante no futuro.",
  "Minha realidade reflete a clareza e a força das minhas intenções.",
  "Eu permito que coisas boas aconteçam com naturalidade.",
  "Hoje eu ajo com coragem, serenidade e confiança.",
  "Eu reconheço meu valor e recebo tudo o que está alinhado comigo.",
  "O universo conspira a favor das escolhas que faço com propósito.",
  "Eu cultivo paz por dentro e vejo harmonia ao meu redor.",
  "Sou constante, disciplinado(a) e fiel aos meus sonhos.",
  "Minha presença é poderosa e minhas palavras criam possibilidades.",
  "Eu celebro cada avanço da minha jornada.",
  "Novos caminhos se revelam enquanto sigo em frente com confiança.",
  "Eu tenho recursos, criatividade e sabedoria para realizar meus planos.",
  "Minha vida está pronta para receber mudanças positivas.",
  "Eu escolho acreditar que o melhor também pode acontecer comigo.",
  "Tudo o que faço hoje contribui para a realidade que estou manifestando.",
  "Eu respiro fundo, confio e permito que a vida floresça.",
  "Sou digno(a) de sonhos realizados e conquistas duradouras.",
] as const;

function notifyChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export function loadNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as AppNotification[];
  } catch {
    return [];
  }
}

function saveNotifications(items: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  notifyChanged();
}

export function scheduleWelcomeNotification(name: string, email: string) {
  localStorage.setItem(
    PENDING_WELCOME_KEY,
    JSON.stringify({ id: crypto.randomUUID(), name, email: email.toLocaleLowerCase() }),
  );
}

function removeLegacyWelcomeNotification() {
  if (localStorage.getItem(LEGACY_WELCOME_REMOVED_KEY)) return;
  const items = loadNotifications().filter((item) => item.id !== "welcome");
  localStorage.setItem(LEGACY_WELCOME_REMOVED_KEY, "true");
  saveNotifications(items);
}

function addPendingWelcomeNotification() {
  const pendingValue = localStorage.getItem(PENDING_WELCOME_KEY);
  if (!pendingValue) return;
  try {
    const pending = JSON.parse(pendingValue) as { id: string; name: string; email: string };
    const currentEmail = loadUser()?.email.toLocaleLowerCase();
    if (!currentEmail || currentEmail !== pending.email) return;
    addNotification({
      id: `welcome-${pending.id}`,
      kind: "success",
      title: `Bem-vindo(a), ${pending.name}`,
      message: "Sua jornada no Getsêmani começou. Um passo consciente por dia.",
    });
    localStorage.removeItem(PENDING_WELCOME_KEY);
  } catch {
    localStorage.removeItem(PENDING_WELCOME_KEY);
  }
}

export function addNotification(
  notification: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string },
) {
  const items = loadNotifications();
  const id = notification.id || `${Date.now()}-${crypto.randomUUID()}`;
  if (items.some((item) => item.id === id)) return;
  saveNotifications([
    { ...notification, id, createdAt: new Date().toISOString(), read: false },
    ...items,
  ]);
}

export function markNotificationRead(id: string) {
  saveNotifications(
    loadNotifications().map((item) => (item.id === id ? { ...item, read: true } : item)),
  );
}

export function markAllNotificationsRead() {
  saveNotifications(loadNotifications().map((item) => ({ ...item, read: true })));
}

export function deleteNotification(id: string) {
  saveNotifications(loadNotifications().filter((item) => item.id !== id));
}

export function clearNotifications() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  notifyChanged();
}

export function ensureAutomaticNotifications() {
  const settings = loadSettings();
  const now = new Date();
  const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dayNumber = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000,
  );
  removeLegacyWelcomeNotification();
  addPendingWelcomeNotification();

  if (settings.affirmations) {
    addNotification({
      id: `affirmation-${dateKey}`,
      kind: "affirmation",
      title: "Afirmação do dia",
      message: DAILY_AFFIRMATIONS[dayNumber % DAILY_AFFIRMATIONS.length]!,
    });
  }

  if (settings.reminder) {
    const [hour = 7, minute = 0] = settings.reminderTime.split(":").map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hour, minute, 0, 0);
    if (Date.now() >= reminderTime.getTime()) {
      addNotification({
        id: `reminder-${dateKey}`,
        kind: "reminder",
        title: "Hora de Manifestar",
        message: "Reserve alguns minutos para escrever e sentir a realidade que você deseja.",
      });
    }
  }
}

export function getNextAutomaticNotificationDelay() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 1, 0);
  const candidates = [nextMidnight.getTime() - now.getTime()];
  const settings = loadSettings();

  if (settings.reminder) {
    const [hour = 7, minute = 0] = settings.reminderTime.split(":").map(Number);
    const nextReminder = new Date(now);
    nextReminder.setHours(hour, minute, 0, 0);
    if (nextReminder.getTime() <= now.getTime()) nextReminder.setDate(nextReminder.getDate() + 1);
    candidates.push(nextReminder.getTime() - now.getTime());
  }

  return Math.max(1_000, Math.min(...candidates));
}
