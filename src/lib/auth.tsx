"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

/**
 * Temporary name-based auth (localStorage + Firestore for role).
 * TODO: return Firebase Auth + Google Sign-In when keys are fixed.
 */

export type Role = "client" | "barista";

export interface SimpleUser {
  uid: string;
  displayName: string;
  role: Role;
}

interface AuthContextValue {
  user: SimpleUser | null;
  loading: boolean;
  hasAvatar: boolean;
  authError: string | null;
  signInWithName: (name: string, role: Role) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  hasAvatar: false,
  authError: null,
  signInWithName: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAvatar, setHasAvatar] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("oic_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // migrate old users without role
        if (!parsed.role) parsed.role = "client";
        setUser(parsed);
      } catch { /* ignore */ }
    }
    setHasAvatar(!!localStorage.getItem("oic_avatar"));
    setLoading(false);
  }, []);

  const signInWithName = (name: string, role: Role) => {
    const u: SimpleUser = {
      uid: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      displayName: name,
      role,
    };
    localStorage.setItem("oic_user", JSON.stringify(u));
    localStorage.setItem("oic_role", role);
    setUser(u);

    // Save role to Firestore (fire-and-forget)
    try {
      import("@/lib/firebase").then(({ getFirebaseDb }) => {
        import("firebase/firestore").then(({ doc, setDoc }) => {
          setDoc(doc(getFirebaseDb(), "users", u.uid), {
            displayName: name,
            role,
            createdAt: new Date().toISOString(),
          }).catch(() => {});
        });
      });
    } catch { /* ignore */ }
  };

  const signOut = () => {
    localStorage.removeItem("oic_user");
    localStorage.removeItem("oic_avatar");
    localStorage.removeItem("oic_userId");
    localStorage.removeItem("oic_role");
    setUser(null);
    setHasAvatar(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, hasAvatar, authError: null, signInWithName, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  return { user, loading };
}

export function useRequireBarista() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/");
      } else if (user.role !== "barista") {
        router.replace("/office");
      }
    }
  }, [user, loading, router]);

  return { user, loading };
}
