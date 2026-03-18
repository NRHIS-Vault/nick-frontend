import { type ReactNode, useEffect, useRef, useState } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { AuthContext } from "./auth-context";
const REFRESH_BUFFER_MS = 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const isConfigured = hasSupabaseConfig();

  // Step 1: hold the canonical auth state here so the rest of the app can read
  // the same user/session values instead of each route bootstrapping Supabase independently.
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isConfigured);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Step 2: if auth is not configured for the current environment, expose a settled
    // "logged out" state immediately so consumers can render deterministic UI.
    if (!isConfigured) {
      setSession(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    const clearRefreshTimer = () => {
      if (refreshTimerRef.current !== null) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    const applyAuthState = (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    };

    const refreshCurrentSession = async () => {
      // Step 3: refresh the session just before expiry so protected routes keep working
      // without forcing the user to sign in again while they are still active.
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Failed to refresh the current Supabase session.", error);
        return;
      }

      syncAuthState(data.session ?? null);
    };

    const scheduleRefresh = (nextSession: Session | null) => {
      clearRefreshTimer();

      if (!nextSession?.expires_at) {
        return;
      }

      const refreshDelay = nextSession.expires_at * 1000 - Date.now() - REFRESH_BUFFER_MS;

      if (refreshDelay <= 0) {
        void refreshCurrentSession();
        return;
      }

      refreshTimerRef.current = setTimeout(() => {
        void refreshCurrentSession();
      }, refreshDelay);
    };

    const syncAuthState = (nextSession: Session | null) => {
      // Step 4: every auth update writes state and re-arms the pre-expiry refresh timer
      // so the provider remains the single owner of session lifecycle behavior.
      if (!isMounted) return;

      applyAuthState(nextSession);
      scheduleRefresh(nextSession);
    };

    const loadInitialSession = async () => {
      // Step 5: hydrate auth state once on mount so refreshes, deep links, and
      // magic-link callbacks all restore the current session before routes render.
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Failed to load the initial Supabase session.", error);
        syncAuthState(null);
        return;
      }

      syncAuthState(data.session ?? null);
    };

    void loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Step 6: keep the context synchronized with password logins, magic-link callbacks,
      // sign-outs, and refresh events emitted by Supabase.
      syncAuthState(nextSession);
    });

    return () => {
      isMounted = false;
      clearRefreshTimer();
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
