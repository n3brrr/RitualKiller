import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/profileService";
import type { User } from "@/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error("Error reading session:", error);
      setSession(data.session);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setInitializing(false);
      if (!nextSession) {
        queryClient.removeQueries({ queryKey: ["profile"] });
      } else {
        void queryClient.invalidateQueries({ queryKey: ["profile", nextSession.user.id] });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const profileQuery = useQuery({
    queryKey: ["profile", session?.user.id],
    queryFn: () => profileService.getProfile(session!.user),
    enabled: Boolean(session),
    staleTime: 60_000,
    retry: 1,
  });

  const refreshProfile = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["profile", session?.user.id] });
  }, [queryClient, session?.user.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: profileQuery.data ?? null,
      loading: initializing || (Boolean(session) && profileQuery.isLoading),
      error: (profileQuery.error as Error | null) ?? null,
      refreshProfile,
      signOut,
    }),
    [session, profileQuery.data, profileQuery.isLoading, profileQuery.error, initializing, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
