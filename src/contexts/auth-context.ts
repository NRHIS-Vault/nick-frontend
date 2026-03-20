import { createContext } from "react";
import { type Session, type User } from "@supabase/supabase-js";

export type LocalDevCredentials = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
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
