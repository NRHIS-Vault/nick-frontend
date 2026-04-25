// Centralized, typed access to Vite environment variables for the client bundle.
export type AppEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBase: string;
  devAuthEmail: string;
  devAuthPassword: string;
  e2eMockMode: boolean;
};

const env = import.meta.env as Record<string, string | undefined>;

export const config: AppEnv = {
  // Supabase project URL; empty means auth/data features should stay inactive.
  supabaseUrl: env.VITE_SUPABASE_URL ?? "",
  // Supabase anon/public key used by the browser client.
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? "",
  // Base URL for backend/worker API used by this app.
  apiBase: env.VITE_API_BASE ?? "",
  // Local dev-only fallback email for testing the auth UI without a live Supabase user.
  devAuthEmail: env.VITE_DEV_AUTH_EMAIL ?? "dev@nick.local",
  // Local dev-only fallback password for the local test account.
  devAuthPassword: env.VITE_DEV_AUTH_PASSWORD ?? "nick-dev-password",
  // E2E-only mock mode swaps Supabase/Stripe dependencies for the local test harness.
  e2eMockMode: (env.VITE_E2E_MOCKS ?? "").toLowerCase() === "true",
};

// Helper to check if Supabase is configured without throwing.
export const hasSupabaseConfig = () =>
  Boolean(config.supabaseUrl && config.supabaseAnonKey);

// Helper to check whether the local dev-only fallback account should be available.
export const hasLocalDevAuth = () =>
  import.meta.env.DEV &&
  !config.e2eMockMode &&
  Boolean(config.devAuthEmail && config.devAuthPassword);
