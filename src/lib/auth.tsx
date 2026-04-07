"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, googleProvider } from "@/lib/firebase";
import { trackEvent, identifyUser } from "@/lib/mixpanel";

export type Role = "client" | "barista" | "ceo";

export interface AppUser {
  uid: string;
  displayName: string;
  email: string | null;
  role: Role;
  photoURL: string | null;
  onboardingDone: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUser: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const db = getFirebaseDb();
      const userRef = doc(db, "users", fbUser.uid);

      // Check if user doc exists, create if not
      const snap = await getDoc(userRef).catch(() => null);
      if (!snap || !snap.exists()) {
        // First login — create user doc with default role
        await setDoc(userRef, {
          displayName: fbUser.displayName ?? "Гость",
          email: fbUser.email ?? null,
          photoURL: fbUser.photoURL ?? null,
          role: "client" as Role,
          loyaltyCount: 0,
          streak: 0,
          lastOrderDate: null,
          pushToken: null,
          geolocationAllowed: false,
          favoriteItem: null,
          onboardingDone: false,
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      }

      // Listen to user doc for real-time role/profile updates
      const unsubUser = onSnapshot(userRef, (userSnap) => {
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUser({
            uid: fbUser.uid,
            displayName: data.displayName ?? fbUser.displayName ?? "Гость",
            email: fbUser.email ?? null,
            role: (data.role as Role) ?? "client",
            photoURL: fbUser.photoURL ?? null,
            onboardingDone: data.onboardingDone ?? false,
          });
        }
        setLoading(false);
      }, () => {
        // Firestore error — still set user with minimal info
        setUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName ?? "Гость",
          email: fbUser.email ?? null,
          role: "client",
          photoURL: fbUser.photoURL ?? null,
          onboardingDone: false,
        });
        setLoading(false);
      });

      return () => unsubUser();
    });

    return () => unsubAuth();
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const result = await signInWithPopup(auth, googleProvider);
    trackEvent("User Signed Up", { method: "google" });
    if (result.user) {
      identifyUser(result.user.uid, {
        $name: result.user.displayName,
        $email: result.user.email,
      });
    }
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, signInWithGoogle, signOut }}
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
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.role !== "barista" && user.role !== "ceo") {
      router.replace("/menu");
    }
  }, [user, loading, router]);

  return { user, loading };
}

export function useRequireCEO() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.role !== "ceo") {
      router.replace("/menu");
    }
  }, [user, loading, router]);

  return { user, loading };
}
