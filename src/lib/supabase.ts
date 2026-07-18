import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  if (!import.meta.env.DEV) throw new Error("Configuration Supabase manquante");
}

export const supabase: SupabaseClient = createClient(url ?? "http://127.0.0.1:54321", anonKey ?? "local-anon-key");

export type AuthSnapshot = { session: Session | null; user: User | null };

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}
export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() { return supabase.auth.signOut(); }
export async function getAuthSnapshot(): Promise<AuthSnapshot> {
  const { data } = await supabase.auth.getSession();
  return { session: data.session, user: data.session?.user ?? null };
}
export function onAuthStateChange(callback: (snapshot: AuthSnapshot) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => callback({ session, user: session?.user ?? null }));
}

export async function callGameApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("UNAUTHENTICATED");
  const response = await fetch(`${url ?? "http://127.0.0.1:54321"}/functions/v1/game-api${path}`, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message ?? `GAME_API_${response.status}`);
  return body as T;
}
