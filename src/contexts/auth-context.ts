import { createContext } from "react";
import { type Session, type User } from "@supabase/supabase-js";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
