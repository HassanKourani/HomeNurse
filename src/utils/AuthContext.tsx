import { createContext, useContext, useEffect, useState } from "react";
import { notification } from "antd";
import { User } from "@supabase/supabase-js";
import supabase from "./supabase";

type ProfileData = {
  full_name: string;
  phone_number: string;
  role: "registered" | "licensed" | "practitioner";
  area:
    | "beirut"
    | "mount_lebanon"
    | "north_lebanon"
    | "south_lebanon"
    | "bekaa";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    profileData: ProfileData
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    profileData: ProfileData
  ) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: profileData.full_name,
          role: profileData.role,
        },
      },
    });

    if (authError) throw authError;

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          email: email,
          full_name: profileData.full_name,
          phone_number: profileData.phone_number,
          role: profileData.role,
          area: profileData.area,
          updated_at: new Date().toISOString(),
          is_approved: false, // Set to false by default for new nurse signups
        },
      ]);

      if (profileError) {
        // If profile creation fails, delete the user to maintain consistency
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error("Failed to create profile. Please try again.");
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_approved")
      .eq("email", email)
      .single();

    if (profileError) {
      notification.error({
        message: "Error",
        description: "Check your email/password",
      });
      throw new Error("Failed to verify account status");
    }

    if (!profileData.is_approved) {
      notification.error({
        message: "Error",
        description:
          "Your account is pending approval. Please wait for admin approval before signing in.",
      });
      throw new Error(
        "Your account is pending approval. Please wait for admin approval before signing in."
      );
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) throw authError;

    if (profileError) {
      await signOut(); // Sign out if we can't verify approval status
      message.error("Failed to verify account status");
      throw new Error("Failed to verify account status");
    }

    if (!profileData.is_approved) {
      await signOut(); // Sign out if not approved
      throw new Error(
        "Your account is pending approval. Please wait for admin approval before signing in."
      );
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
