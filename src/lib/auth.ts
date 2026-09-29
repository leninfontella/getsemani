export type Gender = "masculino" | "feminino" | "nao-informar";
export type LocalUser = { name: string; email: string; password: string; gender?: Gender };

const USER_KEY = "getsemani-user";
const SESSION_KEY = "getsemani-session";

export function loadUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function registerLocal(user: LocalUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.removeItem(SESSION_KEY);
}

export function loginLocal(email: string, password: string) {
  const user = loadUser();
  const valid =
    user?.email.toLocaleLowerCase() === email.toLocaleLowerCase() && user.password === password;
  if (valid) localStorage.setItem(SESSION_KEY, user.email);
  return Boolean(valid);
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  const user = loadUser();
  return Boolean(user && localStorage.getItem(SESSION_KEY) === user.email);
}

export function logoutLocal() {
  localStorage.removeItem(SESSION_KEY);
}

export function deleteLocalAccount() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_KEY);
}
