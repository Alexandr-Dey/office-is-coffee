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
  signInWithRedirect,
  getRedirectResult,
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
  connectionError: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUser: null,
  loading: true,
  connectionError: false,
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
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let didFire = false;

    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      console.error("Firebase Auth init failed:", e);
      setLoading(false);
      setConnectionError(true);
      return;
    }

    // Safety timeout: если onAuthStateChanged не сработал за 15с — показать ошибку
    const safetyTimeout = setTimeout(() => {
      if (!didFire) {
        console.warn("Auth: onAuthStateChanged did not fire in 15s");
        setLoading(false);
        setConnectionError(true);
      }
    }, 15000);

    // Обработка возврата из signInWithRedirect (мобильный flow)
    getRedirectResult(auth).catch((err) => {
      console.warn("getRedirectResult error:", err);
    });

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      didFire = true;
      clearTimeout(safetyTimeout);
      setConnectionError(false);
      // Clean up previous user listener
      if (unsubUser) { unsubUser(); unsubUser = null; }

      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Оптимистичный user из Firebase Auth — показываем UI сразу,
      // не дожидаясь Firestore. Роль/профиль подтянутся через onSnapshot.
      const assignment = getAssignmentByEmail(fbUser.email);
      setUser({
        uid: fbUser.uid,
        displayName: fbUser.displayName ?? "Гость",
        email: fbUser.email ?? null,
        role: assignment?.role ?? "client",
        photoURL: fbUser.photoURL ?? null,
        onboardingDone: false,
        characterName: assignment?.characterName,
      });
      setLoading(false);

      // Firestore sync — в фоне, не блокирует UI
      const db = getFirebaseDb();
      const userRef = doc(db, "users", fbUser.uid);

      const syncFirestore = async () => {
        const snap = await getDoc(userRef).catch(() => null);
        if (!snap || !snap.exists()) {
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
      };

      syncFirestore().catch(() => {});

      // Real-time listener — обновит роль/профиль когда Firestore ответит
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
      }, () => {
        // Firestore error — оптимистичный user уже установлен, ничего не делаем
      });

    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // Redirect flow — стабильнее на мобилках (Safari, in-app browsers)
      await signInWithRedirect(auth, googleProvider);
      // Страница перезагрузится, getRedirectResult обработает результат
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      trackEvent("User Signed Up", { method: "google" });
      if (result.user) {
        identifyUser(result.user.uid, {
          $name: result.user.displayName,
          $email: result.user.email,
        });
      }
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
      value={{ user, firebaseUser, loading, connectionError, signInWithGoogle, signInAsGuest, signOut }}
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
