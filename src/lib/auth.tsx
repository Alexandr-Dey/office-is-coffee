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
  signInAnonymously,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, googleProvider } from "@/lib/firebase";
import { trackEvent, identifyUser } from "@/lib/mixpanel";

export type Role = "client" | "barista" | "ceo";

/* ─────────────────────────────────────────────
   Email → роль маппинг.
   При первом входе через Google эти пользователи
   автоматически получат роль `barista` и привязку
   к персонажу в сцене (characterName).
   ───────────────────────────────────────────── */
const ROLE_ASSIGNMENTS: Record<
  string,
  { role: Role; characterName?: string }
> = {
  "aslan.mussilim0018@inbox.ru": { role: "barista", characterName: "Аслан" },
  "vladislavryakin1985@gmail.com": { role: "barista" },
  "alolha18@gmail.com": { role: "barista", characterName: "Виталий" },
};

function getAssignmentByEmail(email: string | null | undefined) {
  if (!email) return null;
  return ROLE_ASSIGNMENTS[email.toLowerCase()] ?? null;
}

export interface AppUser {
  uid: string;
  displayName: string;
  email: string | null;
  role: Role;
  photoURL: string | null;
  onboardingDone: boolean;
  characterName?: string;
}

interface AuthContextValue {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUser: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInAsGuest: async () => {},
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
    let unsubUser: (() => void) | null = null;

    const auth = getFirebaseAuth();
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up previous user listener
      if (unsubUser) { unsubUser(); unsubUser = null; }

      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const db = getFirebaseDb();
      const userRef = doc(db, "users", fbUser.uid);

      // Check email-based role assignment (baristas, CEO, etc.)
      const assignment = getAssignmentByEmail(fbUser.email);

      // Check if user doc exists, create if not
      const snap = await getDoc(userRef).catch(() => null);
      if (!snap || !snap.exists()) {
        // First login — create user doc (with assigned role if applicable)
        await setDoc(userRef, {
          displayName: fbUser.displayName ?? "Гость",
          email: fbUser.email ?? null,
          photoURL: fbUser.photoURL ?? null,
          role: assignment?.role ?? ("client" as Role),
          ...(assignment?.characterName
            ? { characterName: assignment.characterName }
            : {}),
          loyaltyCount: 0,
          streak: 0,
          lastOrderDate: null,
          pushToken: null,
          geolocationAllowed: false,
          favoriteItem: null,
          onboardingDone: false,
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      } else if (assignment) {
        // Existing user but email is in assignments — sync role/character
        const data = snap.data();
        const needsUpdate =
          data.role !== assignment.role ||
          (assignment.characterName && data.characterName !== assignment.characterName);
        if (needsUpdate) {
          await setDoc(
            userRef,
            {
              role: assignment.role,
              ...(assignment.characterName
                ? { characterName: assignment.characterName }
                : {}),
            },
            { merge: true },
          ).catch(() => {});
        }
      }

      // Listen to user doc for real-time role/profile updates
      unsubUser = onSnapshot(userRef, (userSnap) => {
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUser({
            uid: fbUser.uid,
            displayName: data.displayName ?? fbUser.displayName ?? "Гость",
            email: fbUser.email ?? null,
            role: (data.role as Role) ?? "client",
            photoURL: fbUser.photoURL ?? null,
            onboardingDone: data.onboardingDone ?? false,
            characterName: data.characterName ?? undefined,
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

    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
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

  const signInAsGuest = async (name: string) => {
    const auth = getFirebaseAuth();
    const result = await signInAnonymously(auth);
    const db = getFirebaseDb();
    const userRef = doc(db, "users", result.user.uid);
    await setDoc(userRef, {
      displayName: name.trim() || "Гость",
      email: null,
      photoURL: null,
      role: "client" as Role,
      loyaltyCount: 0,
      streak: 0,
      lastOrderDate: null,
      pushToken: null,
      geolocationAllowed: false,
      favoriteItem: null,
      onboardingDone: false,
      createdAt: new Date().toISOString(),
    }, { merge: true });
    trackEvent("User Signed Up", { method: "guest" });
    identifyUser(result.user.uid, { $name: name.trim() || "Гость" });
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, firebaseUser, loading, signInWithGoogle, signInAsGuest, signOut }}
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
