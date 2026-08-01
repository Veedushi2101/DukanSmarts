import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, Store } from "../types";
import { auth, isConfiguredFirebase } from "../firebase/config";
import { onAuthStateChanged, User as FirebaseUser, signOut as fbSignOut } from "firebase/auth";

interface AuthContextType {
  currentUser: UserProfile;
  firebaseUser: FirebaseUser | null;
  currentStore: Store;
  signOut: () => Promise<void>;
  isFirebaseConnected: boolean;
}

const DEFAULT_STORE: Store = {
  storeId: "store_rajesh_kirana_001",
  name: "Rajesh Kirana Super Store",
  ownerId: "user_rajesh",
  location: "Indiranagar, Bengaluru",
  createdAt: "2024-01-15T00:00:00.000Z"
};

const DEFAULT_SHOP_OWNER: UserProfile = {
  userId: "user_rajesh",
  name: "Rajesh Kumar (Shop Owner)",
  email: "rajesh@kiranastore.in",
  assignedStore: "store_rajesh_kirana_001",
  createdAt: "2024-01-15T00:00:00.000Z"
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_SHOP_OWNER);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    if (isConfiguredFirebase && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        if (user) {
          setCurrentUser({
            userId: user.uid,
            name: user.displayName || user.email?.split("@")[0] || "Rajesh Kumar (Shop Owner)",
            email: user.email || "rajesh@kiranastore.in",
            assignedStore: DEFAULT_STORE.storeId,
            createdAt: new Date().toISOString()
          });
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const signOut = async () => {
    if (isConfiguredFirebase && auth) {
      await fbSignOut(auth);
    }
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        currentStore: DEFAULT_STORE,
        signOut,
        isFirebaseConnected: isConfiguredFirebase
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
