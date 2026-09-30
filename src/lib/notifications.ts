import { loadSettings } from "./goals";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  kind: "reminder" | "affirmation" | "success";
};

const STORAGE_KEY = "getsemani-notifications";
export const NOTIFICATIONS_CHANGED = "getsemani:notifications-changed";

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

export function ensureAutomaticNotifications(name: string) {
  const settings = loadSettings();
  const dateKey = new Date().toISOString().slice(0, 10);
  addNotification({
    id: "welcome",
    kind: "success",
    title: `Bem-vindo(a), ${name}`,
    message: "Sua jornada no Getsêmani começou. Um passo consciente por dia.",
  });

  if (settings.affirmations) {
    addNotification({
      id: `affirmation-${dateKey}`,
      kind: "affirmation",
      title: "Afirmação do dia",
      message: "Eu confio no processo e recebo com gratidão tudo o que já está a caminho.",
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
        title: "Hora de manifestar",
        message: "Reserve alguns minutos para escrever e sentir a realidade que você deseja.",
      });
    }
  }
}
