import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  signOut,
  deleteUser,
  User as FirebaseUser
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { AppUser } from "../types";

interface OnboardingData {
  ownerName: string;
  storeName: string;
  address: string;
  phone: string;
  billHeaderName: string;
}

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  needsOnboarding: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  registerStoreOwner: (
    name: string,
    email: string,
    pass: string,
    storeName: string
  ) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  updateOwnerProfile: (data: Partial<AppUser>) => Promise<void>;
  deleteAccount: (passwordForEmailUser?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Collections to cascade delete when a store owner deletes their account
const TENANT_COLLECTIONS = [
  "products",
  "inventory_history",
  "scans",
  "sales",
  "predictions",
  "notifications",
  "customers",
  "customer_purchases"
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, "users", fbUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data() as AppUser;
            setCurrentUser(data);
            setNeedsOnboarding(!data.onboardingCompleted);
          } else {
            // First time user: no document created yet
            setCurrentUser(null);
            setNeedsOnboarding(true);
          }
        } catch (err) {
          console.error("Auth profile fetch error:", err);
          setCurrentUser(null);
          setNeedsOnboarding(false);
        }
      } else {
        setCurrentUser(null);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const userDocRef = doc(db, "users", fbUser.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists() || !userSnap.data()?.onboardingCompleted) {
      setCurrentUser(null);
      setNeedsOnboarding(true);
    } else {
      setCurrentUser(userSnap.data() as AppUser);
      setNeedsOnboarding(false);
    }
  };

  const registerStoreOwner = async (
    name: string,
    email: string,
    pass: string,
    storeName: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const generatedStoreId = `store_${storeName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;

    const newOwnerProfile: AppUser = {
      uid: cred.user.uid,
      name: name.trim(),
      email: email.trim(),
      storeName: storeName.trim(),
      billHeaderName: storeName.trim(),
      storeId: generatedStoreId,
      role: "OWNER",
      onboardingCompleted: true,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", cred.user.uid), newOwnerProfile);
    setCurrentUser(newOwnerProfile);
    setNeedsOnboarding(false);
  };

  const completeOnboarding = async (data: OnboardingData) => {
    if (!auth.currentUser) throw new Error("No active session found.");
    const uid = auth.currentUser.uid;
    const generatedStoreId = `store_${data.storeName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;

    const profile: AppUser = {
      uid,
      name: data.ownerName.trim(),
      email: auth.currentUser.email || "",
      storeName: data.storeName.trim(),
      billHeaderName: data.billHeaderName.trim() || data.storeName.trim(),
      address: data.address.trim(),
      phone: data.phone.trim(),
      storeId: generatedStoreId,
      role: "OWNER",
      onboardingCompleted: true,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", uid), profile);
    setCurrentUser(profile);
    setNeedsOnboarding(false);
  };

  const updateOwnerProfile = async (data: Partial<AppUser>) => {
    if (!currentUser?.uid) return;
    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(userDocRef, data, { merge: true });
    setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  // Cascade delete: cleans all documents matching storeId across all collections
  const purgeTenantData = async (storeId: string, uid: string) => {
    for (const colName of TENANT_COLLECTIONS) {
      try {
        const q = query(collection(db, colName), where("storeId", "==", storeId));
        const snap = await getDocs(q);

        if (!snap.empty) {
          let batch = writeBatch(db);
          let count = 0;

          for (const docSnap of snap.docs) {
            batch.delete(docSnap.ref);
            count++;
            if (count === 450) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }

          if (count > 0) {
            await batch.commit();
          }
        }
      } catch (err) {
        console.error(`Error deleting from ${colName}:`, err);
      }
    }

    // Delete the owner user record
    await deleteDoc(doc(db, "users", uid));
  };

  const deleteAccount = async (passwordForEmailUser?: string) => {
    const user = auth.currentUser;
    if (!user || !currentUser?.uid) throw new Error("No authenticated session found.");

    const uid = currentUser.uid;
    const storeId = currentUser.storeId;

    try {
      // 1. Re-authenticate to satisfy Firebase security requirements
      const isGoogle = user.providerData.some((p) => p.providerId === "google.com");
      if (isGoogle) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      } else if (passwordForEmailUser && user.email) {
        const cred = EmailAuthProvider.credential(user.email, passwordForEmailUser);
        await reauthenticateWithCredential(user, cred);
      }

      // 2. Cascade delete all store documents matching this storeId
      if (storeId) {
        await purgeTenantData(storeId, uid);
      } else {
        await deleteDoc(doc(db, "users", uid));
      }

      // 3. Delete Firebase Auth User
      await deleteUser(user);

      // 4. Reset Local App State
      localStorage.removeItem("dukansmarts_last_active_timestamp");
      setCurrentUser(null);
      setFirebaseUser(null);
      setNeedsOnboarding(false);
    } catch (error: any) {
      console.error("Account deletion failed:", error);
      if (error?.code === "auth/requires-recent-login") {
        throw new Error("Please log out and sign back in, then retry deleting the account.");
      }
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem("dukansmarts_last_active_timestamp");
    await signOut(auth);
    setCurrentUser(null);
    setFirebaseUser(null);
    setNeedsOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        needsOnboarding,
        login,
        loginWithGoogle,
        registerStoreOwner,
        completeOnboarding,
        updateOwnerProfile,
        deleteAccount,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};