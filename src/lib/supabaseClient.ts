import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { config, hasSupabaseConfig } from "./config";

/**
 * Supabase client singleton.
 * - We only create one client instance so auth state (access tokens, refresh timers,
 *   realtime sockets) is shared across the entire app.
 * - Keeping it in a module-level singleton also avoids recreating clients inside React
 *   components, which would drop in-flight subscriptions and cached sessions.
 */
let cachedClient: SupabaseClient | null = null;

const createSupabaseClient = () => {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env."
    );
  }

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      // Persist the session in localStorage so tabs share the auth state.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

export const getSupabaseClient = (): SupabaseClient => {
  if (!cachedClient) {
    cachedClient = createSupabaseClient();
  }
  return cachedClient;
};

/**
 * Export a lazy singleton proxy so modules can keep importing `supabaseClient`
 * without forcing client construction at module-evaluation time.
 *
 * That matters for routes like `/login`: once the page is imported into the router,
 * we still want the rest of the app to boot even if Supabase env vars are missing.
 * The proxy resolves the real client only when code actually touches the export.
 */
export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabaseClient();
    const value = (client as unknown as Record<PropertyKey, unknown>)[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// Helper: fetch the currently signed-in user (or null if not authenticated).
export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw error;
  return data.user;
};

export type Profile = {
  id: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
};

// Helper: fetch a profile row by user id from the "profiles" table.
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
};

// Helper: upsert profile data; returns the saved row.
export const updateProfile = async (profile: Profile): Promise<Profile> => {
  const { data, error } = await getSupabaseClient()
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
};
