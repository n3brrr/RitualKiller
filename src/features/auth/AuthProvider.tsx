import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { profileService } from "@/services/profileService";
import { AuthContext, type AuthContextValue } from "./useAuth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
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
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Only a recovery link may set a new password without the current one.
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "SIGNED_OUT") setPasswordRecovery(false);
      setSession(nextSession);
      setInitializing(false);
      if (!nextSession) {
        queryClient.removeQueries({ queryKey: ["profile"] });
      } else {
        void queryClient.invalidateQueries({
          queryKey: ["profile", nextSession.user.id],
        });
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
    setPasswordRecovery(false);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: profileQuery.data ?? null,
      loading: initializing || (Boolean(session) && profileQuery.isLoading),
      error: (profileQuery.error as Error | null) ?? null,
      passwordRecovery,
      refreshProfile,
      signOut,
    }),
    [
      session,
      profileQuery.data,
      profileQuery.isLoading,
      profileQuery.error,
      initializing,
      passwordRecovery,
      refreshProfile,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
