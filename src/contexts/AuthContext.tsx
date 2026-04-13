"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "@/utils/types";

// UserProfile is imported from @/utils/types — do not redefine here

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch user profile from DB only (never from user_metadata) ──────────
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data: profileData, error } = await supabase
      .from("users")
      .select("id, role, first_name, last_name, phone, gender")
      .eq("id", userId)
      .single();

    if (error || !profileData) return null;
    return profileData;
  };

  const loadSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const dbProfile = await fetchProfile(session.user.id);
      setProfile(dbProfile);
      setRole((dbProfile?.role as UserRole) ?? null);
    } else {
      setUser(null);
      setRole(null);
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setRole(null);
        setProfile(null);
      } else if (session?.user) {
        setUser(session.user);
        const dbProfile = await fetchProfile(session.user.id);
        setProfile(dbProfile);
        setRole((dbProfile?.role as UserRole) ?? null);
      }
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      const dbProfile = await fetchProfile(user.id);
      setProfile(dbProfile);
      setRole((dbProfile?.role as UserRole) ?? null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
