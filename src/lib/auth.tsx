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
 * Временная авторизация по имени (localStorage).
 * TODO: вернуть Firebase Auth + Google Sign-In когда разберёмся с ключами.
 */

interface SimpleUser {
  uid: string;
  displayName: string;
}

interface AuthContextValue {
  user: SimpleUser | null;
  loading: boolean;
  hasAvatar: boolean;
  authError: string | null;
  signInWithName: (name: string) => void;
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
        setUser(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    setHasAvatar(!!localStorage.getItem("oic_avatar"));
    setLoading(false);
  }, []);

  const signInWithName = (name: string) => {
    const u: SimpleUser = {
      uid: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      displayName: name,
    };
    localStorage.setItem("oic_user", JSON.stringify(u));
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem("oic_user");
    localStorage.removeItem("oic_avatar");
    localStorage.removeItem("oic_userId");
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
