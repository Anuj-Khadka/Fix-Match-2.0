import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export type Role = "client" | "provider" | "admin";
export type ProviderStatus = "pending" | "approved" | "rejected" | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  role: Role | null;
  providerStatus: ProviderStatus;
  loading: boolean;
  isApprovedProvider: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSession(session: Session | null) {
    setSession(session);
    setUser(session?.user ?? null);

    if (!session?.user) {
      setRole(null);
      setProviderStatus(null);
      setLoading(false);
      return;
    }

    const userRole = (session.user.app_metadata?.role as Role) ?? "client";
    setRole(userRole);

    // If provider, fetch their approval status
    if (userRole === "provider") {
      const { data } = await supabase
        .from("provider_profiles")
        .select("status")
        .eq("id", session.user.id)
        .single();

      setProviderStatus((data?.status as ProviderStatus) ?? null);
    } else {
      setProviderStatus(null);
    }

    setLoading(false);
  }

  return {
    user,
    session,
    role,
    providerStatus,
    loading,
    isApprovedProvider: role === "provider" && providerStatus === "approved",
  };
}
