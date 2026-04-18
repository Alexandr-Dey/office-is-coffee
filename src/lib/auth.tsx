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
  "alex.d.workt@gmail.com": { role: "ceo" },
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
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

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

    // Обработка возврата из signInWithRedirect (fallback для in-app браузеров)
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        trackEvent("User Signed Up", { method: "google" });
        identifyUser(result.user.uid, {
          $name: result.user.displayName,
          $email: result.user.email,
        });
      }
    }).catch((err) => {
      console.error("[Auth] getRedirectResult error:", err);
    });

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      didFire = true;
      clearTimeout(safetyTimeout);
      setConnectionError(false);
      // Clean up previous user listener & pending retry
      if (retryTimeout) { clearTimeout(retryTimeout); retryTimeout = null; }
      if (unsubUser) { unsubUser(); unsubUser = null; }

      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Определяем: новый пользователь или возвращающийся.
      // Для возвращающихся ставим onboardingDone: true оптимистично,
      // чтобы не было мигания onboarding → menu.
      const assignment = getAssignmentByEmail(fbUser.email);
      const createdAt = fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).getTime() : 0;
      const lastLogin = fbUser.metadata.lastSignInTime ? new Date(fbUser.metadata.lastSignInTime).getTime() : 0;
      const isNewUser = Math.abs(lastLogin - createdAt) < 10000; // <10с = только что создан

      setUser({
        uid: fbUser.uid,
        displayName: fbUser.displayName ?? "Гость",
        email: fbUser.email ?? null,
        role: assignment?.role ?? "client",
        photoURL: fbUser.photoURL ?? null,
        onboardingDone: !isNewUser, // возвращающийся → true, новый → false
        characterName: assignment?.characterName,
      });
      setLoading(false);
      console.log(`[Auth] optimistic user: ${fbUser.email ?? "anon"}, isNew=${isNewUser}, uid=${fbUser.uid.slice(0, 8)}`);

      // Firestore sync — в фоне, не блокирует UI
      const db = getFirebaseDb();
      const userRef = doc(db, "users", fbUser.uid);

      const userPayload = {
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
      };

      const syncFirestore = async (attempt = 1): Promise<void> => {
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, userPayload);
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
              );
            }
          }
        } catch (err) {
          console.error(`[Auth] syncFirestore attempt ${attempt} failed:`, err);
          // Retry once — auth token may not have propagated to Firestore yet
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1500));
            return syncFirestore(attempt + 1);
          }
        }
      };

      syncFirestore();

      // Real-time listener — обновит роль/профиль когда Firestore ответит
      const startSnapshot = () => {
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
        }, (err) => {
          console.error("[Auth] onSnapshot error:", err);
          // Listener is dead after error — clear ref so retry can work
          unsubUser = null;
          // Retry once after delay — auth token may not be ready
          retryTimeout = setTimeout(() => {
            retryTimeout = null;
            if (unsubUser) return; // onAuthStateChanged already resubscribed
            startSnapshot();
          }, 2000);
        });
      };
      startSnapshot();

    });

    return () => {
      clearTimeout(safetyTimeout);
      if (retryTimeout) clearTimeout(retryTimeout);
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    try {
      // Popup flow — работает и на мобилке, и на десктопе.
      // Не перезагружает страницу → auth state не теряется.
      const result = await signInWithPopup(auth, googleProvider);
      trackEvent("User Signed Up", { method: "google" });
      if (result.user) {
        identifyUser(result.user.uid, {
          $name: result.user.displayName,
          $email: result.user.email,
        });
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      // Popup заблокирован (in-app браузеры) → fallback на redirect
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw e;
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
