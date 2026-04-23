import { type Session, type User } from "@supabase/supabase-js";
import { resolveApiUrl } from "./apiClient";

const MOCK_AUTH_STORAGE_KEY = "nick.e2e-auth-token";

type MockAuthResponse = {
  message?: string;
  session: {
    accessToken: string;
    expiresAt: string;
  };
  user: {
    id: string;
    email: string;
    fullName?: string | null;
    avatarUrl?: string | null;
  };
  profile: {
    role: string | null;
    subscriptionStatus: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export type MockAuthProfile = MockAuthResponse["profile"] & {
  id: string;
};

type MockAuthState = {
  message: string | null;
  session: Session;
  user: User;
  profile: MockAuthProfile;
};

type MockAuthError = Error & {
  status?: number;
};

const createMockAuthError = (status: number, message: string) => {
  const error = new Error(message) as MockAuthError;
  error.status = status;
  return error;
};

const readStorageToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
};

export const clearMockAuthToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
};

const writeStorageToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, token);
};

const createMockUser = (payload: MockAuthResponse["user"]): User => {
  const timestamp = new Date().toISOString();

  return {
    id: payload.id,
    app_metadata: {
      provider: "e2e-mock",
    },
    user_metadata: {
      auth_source: "e2e-mock",
      full_name: payload.fullName ?? payload.email,
      avatar_url: payload.avatarUrl ?? null,
    },
    aud: "authenticated",
    email: payload.email,
    role: "authenticated",
    created_at: timestamp,
    updated_at: timestamp,
    confirmed_at: timestamp,
    email_confirmed_at: timestamp,
  };
};

const createMockSession = ({
  accessToken,
  expiresAt,
  user,
}: {
  accessToken: string;
  expiresAt: string;
  user: User;
}): Session => ({
  access_token: accessToken,
  refresh_token: `refresh-${accessToken}`,
  expires_in: Math.max(
    60,
    Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)
  ),
  expires_at: Math.floor(Date.parse(expiresAt) / 1000),
  token_type: "bearer",
  user,
});

const mapMockAuthResponse = (payload: MockAuthResponse): MockAuthState => {
  const user = createMockUser(payload.user);

  return {
    message: payload.message ?? null,
    session: createMockSession({
      accessToken: payload.session.accessToken,
      expiresAt: payload.session.expiresAt,
      user,
    }),
    user,
    profile: {
      id: payload.user.id,
      role: payload.profile.role,
      subscriptionStatus: payload.profile.subscriptionStatus,
      fullName: payload.profile.fullName,
      avatarUrl: payload.profile.avatarUrl,
    },
  };
};

const requestMockAuth = async (
  path: string,
  init: RequestInit = {}
): Promise<MockAuthResponse> => {
  const response = await fetch(resolveApiUrl(path), {
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  });

  const responseText = await response.text();
  const payload = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : {};

  if (!response.ok) {
    throw createMockAuthError(
      response.status,
      typeof payload.error === "string"
        ? payload.error
        : typeof payload.message === "string"
          ? payload.message
          : `Mock auth request failed (${response.status}).`
    );
  }

  return payload as unknown as MockAuthResponse;
};

export const registerMockAuthAccount = async (email: string, password: string) => {
  const payload = await requestMockAuth("/e2e/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return payload.message ?? "Account created.";
};

export const signInWithMockAuth = async (email: string, password: string) => {
  const payload = await requestMockAuth("/e2e/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const authState = mapMockAuthResponse(payload);

  writeStorageToken(authState.session.access_token);
  return authState;
};

export const restoreMockAuthSession = async () => {
  const accessToken = readStorageToken();

  if (!accessToken) {
    return null;
  }

  try {
    const payload = await requestMockAuth("/e2e/auth/session", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const authState = mapMockAuthResponse(payload);

    writeStorageToken(authState.session.access_token);
    return authState;
  } catch (error) {
    clearMockAuthToken();

    const status = (error as MockAuthError).status;
    if (status === 401 || status === 403) {
      return null;
    }

    throw error;
  }
};

export const signOutMockAuth = async () => {
  const accessToken = readStorageToken();
  clearMockAuthToken();

  if (!accessToken) {
    return;
  }

  try {
    await fetch(resolveApiUrl("/e2e/auth/logout"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (_error) {
    // Logout should always clear the local token even when the mock server is down.
  }
};
