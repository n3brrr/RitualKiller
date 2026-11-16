import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { User } from "@/types";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  /** True only while the session comes from a password-recovery link. */
  passwordRecovery: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
