import { createContext } from "react";
import { type Session, type User } from "@supabase/supabase-js";

export type LocalDevCredentials = {
  email: string;
  password: string;
};

export type AuthProfile = {
  id: string;
  role: string | null;
  subscriptionStatus: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  role: string | null;
  subscriptionStatus: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  isLocalDevAuthEnabled: boolean;
  localDevCredentials: LocalDevCredentials | null;
  signOut: () => Promise<void>;
  signInWithLocalDevAccount: (
    email: string,
    password: string
  ) => Promise<{ matched: boolean; error: string | null }>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
