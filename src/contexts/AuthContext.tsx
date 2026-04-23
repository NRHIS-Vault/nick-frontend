import { type ReactNode, useEffect, useRef, useState } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { config, hasLocalDevAuth, hasSupabaseConfig } from "@/lib/config";
import { getSupabaseClient, getUserProfile, type Profile as SupabaseProfile } from "@/lib/supabaseClient";
import {
  clearMockAuthToken,
  registerMockAuthAccount,
  restoreMockAuthSession,
  signInWithMockAuth,
  signOutMockAuth,
  type MockAuthProfile,
} from "@/lib/mockAuth";
import { AuthContext } from "./auth-context";
import { type AuthProfile } from "./auth-context";

const REFRESH_BUFFER_MS = 60 * 1000;
const LOCAL_DEV_AUTH_STORAGE_KEY = "nick.local-dev-auth";

type LocalDevAuthStorage = {
  email: string;
  createdAt: string;
};

const readString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const toMetadataRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const createLocalDevUser = (email: string): User => {
  const timestamp = new Date().toISOString();

  return {
    id: "local-dev-user",
    app_metadata: {
      provider: "local-dev",
    },
    user_metadata: {
      auth_source: "local-dev",
    },
    aud: "authenticated",
    email,
    role: "authenticated",
    created_at: timestamp,
    updated_at: timestamp,
    confirmed_at: timestamp,
    email_confirmed_at: timestamp,
  };
};

const createLocalDevSession = (email: string): Session => ({
  access_token: "local-dev-access-token",
  refresh_token: "local-dev-refresh-token",
  expires_in: 60 * 60 * 24 * 365,
  expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  token_type: "bearer",
  user: createLocalDevUser(email),
});

const createLocalDevProfile = (email: string): AuthProfile => ({
  id: "local-dev-user",
  role: "admin",
  subscriptionStatus: "active",
  fullName: email,
  avatarUrl: null,
});

const createMockAuthProfile = (profile: MockAuthProfile): AuthProfile => ({
  id: profile.id,
  role: profile.role,
  subscriptionStatus: profile.subscriptionStatus,
  fullName: profile.fullName,
  avatarUrl: profile.avatarUrl,
});

const createAuthProfile = (user: User, profile: SupabaseProfile | null): AuthProfile => {
  const userMetadata = toMetadataRecord(user.user_metadata);
  const appMetadata = toMetadataRecord(user.app_metadata);

  // Step 0: prefer the dedicated `profiles` row for billing/authorization state, but
  // keep lightweight metadata fallbacks so existing Supabase seeds do not hard-break.
  return {
    id: user.id,
    role: readString(profile?.role) ?? readString(appMetadata.role) ?? readString(userMetadata.role),
    subscriptionStatus:
      readString(profile?.subscription_status) ??
      readString(appMetadata.subscription_status) ??
      readString(userMetadata.subscription_status),
    fullName:
      readString(profile?.full_name) ??
      readString(userMetadata.full_name) ??
      readString(userMetadata.name),
    avatarUrl:
      readString(profile?.avatar_url) ??
      readString(userMetadata.avatar_url) ??
      readString(userMetadata.picture),
  };
};

const readLocalDevAuth = (expectedEmail: string): LocalDevAuthStorage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(LOCAL_DEV_AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<LocalDevAuthStorage>;

    if (parsed.email === expectedEmail && typeof parsed.createdAt === "string") {
      return {
        email: parsed.email,
        createdAt: parsed.createdAt,
      };
    }
  } catch (error) {
    console.error("Failed to parse the local dev auth session.", error);
  }

  window.localStorage.removeItem(LOCAL_DEV_AUTH_STORAGE_KEY);
  return null;
};

const writeLocalDevAuth = (email: string) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: LocalDevAuthStorage = {
    email,
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(LOCAL_DEV_AUTH_STORAGE_KEY, JSON.stringify(payload));
};

const clearLocalDevAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_DEV_AUTH_STORAGE_KEY);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const isConfigured = hasSupabaseConfig();
  const isLocalDevAuthEnabled = hasLocalDevAuth();
  const isE2EMockAuthEnabled = config.e2eMockMode;
  const localDevEmail = isLocalDevAuthEnabled ? config.devAuthEmail : "";
  const localDevPassword = isLocalDevAuthEnabled ? config.devAuthPassword : "";
  const localDevCredentials = isLocalDevAuthEnabled
    ? {
        email: localDevEmail,
        password: localDevPassword,
      }
    : null;

  // Step 1: hold the canonical auth state here so the rest of the app can read
  // the same user/session values instead of each route bootstrapping Supabase independently.
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(
    isConfigured || isLocalDevAuthEnabled || isE2EMockAuthEnabled
  );
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoading = isAuthLoading || isProfileLoading;
  const role = profile?.role ?? null;
  const subscriptionStatus = profile?.subscriptionStatus ?? null;

  const clearAuthState = () => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    clearLocalDevAuth();
    clearMockAuthToken();
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsAuthLoading(false);
    setIsProfileLoading(false);
  };

  // Step 2: expose a local dev-only credential check so the login page can unlock
  // the dashboard without a live Supabase account while `npm run dev` is active.
  const signInWithLocalDevAccount = async (email: string, password: string) => {
    if (!isLocalDevAuthEnabled || !localDevCredentials) {
      return { matched: false, error: null };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const expectedEmail = localDevEmail.trim().toLowerCase();

    if (normalizedEmail !== expectedEmail) {
      return { matched: false, error: null };
    }

    if (password !== localDevPassword) {
      return {
        matched: true,
        error: "Invalid local dev password. Use the dev-only credentials shown on this page.",
      };
    }

    const nextSession = createLocalDevSession(localDevEmail);
    writeLocalDevAuth(localDevEmail);
    setSession(nextSession);
    setUser(nextSession.user);
    setProfile(createLocalDevProfile(localDevEmail));
    setIsProfileLoading(false);
    setIsAuthLoading(false);

    return { matched: true, error: null };
  };

  const signOut = async () => {
    let signOutError: Error | null = null;

    try {
      if (isE2EMockAuthEnabled) {
        await signOutMockAuth();
      }

      // Step 2a: revoke the Supabase session when the app is configured so the current
      // browser session is invalidated before we route the user back to `/login`.
      if (isConfigured) {
        const { error } = await getSupabaseClient().auth.signOut();

        if (error) {
          signOutError = error;
        }
      }
    } catch (error) {
      signOutError =
        error instanceof Error ? error : new Error("Failed to sign out of the current session.");
    } finally {
      // Step 2b: always clear the shared auth state locally so protected routes lock
      // immediately, including the local dev fallback session stored in localStorage.
      clearAuthState();
    }

    if (signOutError) {
      console.error("Failed to fully sign out of Supabase.", signOutError);
      throw signOutError;
    }
  };

  const signInWithE2EMockAccount = async (email: string, password: string) => {
    if (!isE2EMockAuthEnabled) {
      return { error: null };
    }

    try {
      const authState = await signInWithMockAuth(email, password);
      setSession(authState.session);
      setUser(authState.user);
      setProfile(createMockAuthProfile(authState.profile));
      setIsProfileLoading(false);
      setIsAuthLoading(false);
      return { error: null };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to sign in with the E2E mock account.",
      };
    }
  };

  const signUpWithE2EMockAccount = async (email: string, password: string) => {
    if (!isE2EMockAuthEnabled) {
      return { error: null, message: null };
    }

    try {
      const message = await registerMockAuthAccount(email, password);
      return { error: null, message };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create the E2E mock account.",
        message: null,
      };
    }
  };

  useEffect(() => {
    if (isE2EMockAuthEnabled) {
      let isCancelled = false;

      const loadMockSession = async () => {
        try {
          const authState = await restoreMockAuthSession();

          if (isCancelled) {
            return;
          }

          if (!authState) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsProfileLoading(false);
            setIsAuthLoading(false);
            return;
          }

          setSession(authState.session);
          setUser(authState.user);
          setProfile(createMockAuthProfile(authState.profile));
          setIsProfileLoading(false);
          setIsAuthLoading(false);
        } catch (error) {
          if (isCancelled) {
            return;
          }

          console.error("Failed to restore the E2E mock auth session.", error);
          clearAuthState();
        }
      };

      void loadMockSession();

      return () => {
        isCancelled = true;
      };
    }

    // Step 3: if a local dev auth session already exists, restore it immediately and
    // skip Supabase entirely so frontend work can continue offline.
    if (isLocalDevAuthEnabled && localDevEmail) {
      const localDevSession = readLocalDevAuth(localDevEmail);

      if (localDevSession) {
        const nextSession = createLocalDevSession(localDevSession.email);
        setSession(nextSession);
        setUser(nextSession.user);
        setProfile(createLocalDevProfile(localDevSession.email));
        setIsProfileLoading(false);
        setIsAuthLoading(false);
        return;
      }
    }

    // Step 4: if auth is not configured for the current environment, expose a settled
    // "logged out" state immediately so consumers can render deterministic UI.
    if (!isConfigured) {
      clearLocalDevAuth();
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsProfileLoading(false);
      setIsAuthLoading(false);
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

      // Step 5: any real Supabase auth transition invalidates the local dev fallback
      // so the provider keeps a single active auth source at a time.
      clearLocalDevAuth();
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setProfile((currentProfile) => {
        if (!nextSession?.user) {
          return null;
        }

        return currentProfile?.id === nextSession.user.id ? currentProfile : null;
      });
      setIsProfileLoading(Boolean(nextSession?.user));
      setIsAuthLoading(false);
    };

    const refreshCurrentSession = async () => {
      // Step 6: refresh the session just before expiry so protected routes keep working
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
      // Step 7: every auth update writes state and re-arms the pre-expiry refresh timer
      // so the provider remains the single owner of session lifecycle behavior.
      if (!isMounted) return;

      applyAuthState(nextSession);
      scheduleRefresh(nextSession);
    };

    const loadInitialSession = async () => {
      // Step 8: hydrate auth state once on mount so refreshes, deep links, and
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
      // Step 9: keep the context synchronized with password logins, magic-link callbacks,
      // sign-outs, and refresh events emitted by Supabase.
      syncAuthState(nextSession);
    });

    return () => {
      isMounted = false;
      clearRefreshTimer();
      subscription.unsubscribe();
    };
  }, [isConfigured, isE2EMockAuthEnabled, isLocalDevAuthEnabled, localDevEmail]);

  useEffect(() => {
    let isCancelled = false;

    const syncAuthorizationProfile = async () => {
      if (isE2EMockAuthEnabled && session?.user && user) {
        setProfile((currentProfile) =>
          currentProfile ?? {
            id: user.id,
            role: null,
            subscriptionStatus: null,
            fullName: user.email ?? null,
            avatarUrl: null,
          }
        );
        setIsProfileLoading(false);
        return;
      }

      if (!user) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      // Step 10: local dev auth skips the remote profile lookup and stays subscribed by
      // default so frontend work is not blocked by Stripe/Supabase billing setup.
      if (user.id === "local-dev-user") {
        setProfile(createLocalDevProfile(user.email ?? localDevEmail));
        setIsProfileLoading(false);
        return;
      }

      if (!isConfigured) {
        setProfile(createAuthProfile(user, null));
        setIsProfileLoading(false);
        return;
      }

      try {
        // Step 11: after every successful login/session restore, read role and
        // subscription state from `public.profiles` so routing decisions stay centralized.
        const nextProfile = await getUserProfile(user.id);

        if (isCancelled) {
          return;
        }

        setProfile(createAuthProfile(user, nextProfile));
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error("Failed to load the user's authorization profile.", error);
        setProfile(createAuthProfile(user, null));
      } finally {
        if (!isCancelled) {
          setIsProfileLoading(false);
        }
      }
    };

    void syncAuthorizationProfile();

    return () => {
      isCancelled = true;
    };
  }, [isConfigured, isE2EMockAuthEnabled, localDevEmail, session?.access_token, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        subscriptionStatus,
        isLoading,
        isConfigured,
        isLocalDevAuthEnabled,
        isE2EMockAuthEnabled,
        localDevCredentials,
        signOut,
        signInWithLocalDevAccount,
        signInWithE2EMockAccount,
        signUpWithE2EMockAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
