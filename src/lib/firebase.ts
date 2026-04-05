import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

function getApp(): FirebaseApp {
  if (getApps().length) return getApps()[0];
  return initializeApp(firebaseConfig);
}

let _auth: Auth;
let _db: Firestore;
let _rtdb: Database;

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

export function getFirebaseRtdb(): Database {
  if (!_rtdb) _rtdb = getDatabase(getApp());
  return _rtdb;
}

// Keep backward-compatible exports as getters so they only init when accessed client-side
export const auth = typeof window !== "undefined" ? getFirebaseAuth() : (null as unknown as Auth);
export const db = typeof window !== "undefined" ? getFirebaseDb() : (null as unknown as Firestore);
export const rtdb = typeof window !== "undefined" ? getFirebaseRtdb() : (null as unknown as Database);
export default typeof window !== "undefined" ? getApp() : (null as unknown as FirebaseApp);
