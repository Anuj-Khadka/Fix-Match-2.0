import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";

export type Role = "client" | "provider" | "admin";
export type ProviderStatus = "pending" | "pending_review" | "approved" | "rejected" | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  role: Role | null;
  providerStatus: ProviderStatus;
  onboardingStep: number;
  loading: boolean;
  isApprovedProvider: boolean;
  needsOnboarding: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasResolvedRef = useRef(false);

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
    if (!session?.user) {
      setSession(null);
      setUser(null);
      setRole(null);
      setProviderStatus(null);
      setOnboardingStep(0);
      setLoading(false);
      return;
    }

    // Only show loading on the initial session load.
    // On subsequent token refreshes we keep the existing state visible
    // so that ProtectedRoute doesn't unmount the component tree.
    if (!hasResolvedRef.current) {
      setLoading(true);
    }

    setSession(session);
    setUser(session.user);

    // 1. Resolve role: JWT app_metadata → user_metadata → profiles table
    let userRole = (session.user.app_metadata?.role ??
      session.user.user_metadata?.role) as Role | undefined;

    if (!userRole) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      userRole = (data?.role as Role) ?? "client";
    }

    // 2. If provider, fetch approval status + onboarding step
    let status: ProviderStatus = null;
    let step = 0;

    if (userRole === "provider") {
      const { data } = await supabase
        .from("provider_profiles")
        .select("status, onboarding_step")
        .eq("id", session.user.id)
        .single();

      status = (data?.status as ProviderStatus) ?? null;
      step = data?.onboarding_step ?? 0;
    }

    // 3. Batch all state updates so React renders once
    //    with the complete, consistent auth state.
    setRole(userRole);
    setProviderStatus(status);
    setOnboardingStep(step);
    setLoading(false);
    hasResolvedRef.current = true;
  }

  // Re-fetch provider profile without a full session reload
  const refreshProfile = useCallback(async () => {
    if (!user || role !== "provider") return;
    const { data } = await supabase
      .from("provider_profiles")
      .select("status, onboarding_step")
      .eq("id", user.id)
      .single();

    setProviderStatus((data?.status as ProviderStatus) ?? null);
    setOnboardingStep(data?.onboarding_step ?? 0);
  }, [user, role]);

  const value: AuthState = {
    user,
    session,
    role,
    providerStatus,
    onboardingStep,
    loading,
    isApprovedProvider: role === "provider" && providerStatus === "approved",
    needsOnboarding: role === "provider" && providerStatus === "pending" && onboardingStep < 4,
    refreshProfile,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
