"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  hasAvatar: boolean | null;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  hasAvatar: null,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAvatar, setHasAvatar] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: Unsubscribe | undefined;

    try {
      const auth = getFirebaseAuth();

      getRedirectResult(auth).catch(() => {});

      unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          try {
            const db = getFirebaseDb();
            const snap = await getDoc(doc(db, "avatars", u.uid));
            setHasAvatar(snap.exists());
          } catch (err) {
            console.error("Avatar check error:", err);
            setHasAvatar(false);
          }
        } else {
          setHasAvatar(null);
        }
        setLoading(false);
      });
    } catch (err) {
      console.error("Firebase auth init error:", err);
      setAuthError(
        err instanceof Error ? err.message : "Firebase init failed"
      );
      setLoading(false);
    }

    return () => unsub?.();
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        await signInWithRedirect(auth, provider);
      } else {
        throw err;
      }
    }
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setHasAvatar(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, hasAvatar, authError, signInWithGoogle, signOut }}
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
