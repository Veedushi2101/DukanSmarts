import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_PLACEHOLDER",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stockpilot-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stockpilot-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stockpilot-ai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:a1b2c3d4e5f6g7h8"
};

export const isConfiguredFirebase = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "your-api-key" &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes("PLACEHOLDER")
);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase initialization warning (using local fallback engine):", error);
  app = null as unknown as FirebaseApp;
  auth = null as unknown as Auth;
  db = null as unknown as Firestore;
  storage = null as unknown as FirebaseStorage;
}

export { app, auth, db, storage, firebaseConfig };