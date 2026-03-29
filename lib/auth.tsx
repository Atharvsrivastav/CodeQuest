"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User
} from "firebase/auth";

import { auth, getFirebaseAnalytics, googleProvider } from "./firebase";
import { clearProgressState, syncProgressForUser } from "./progress";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  actionLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    void getFirebaseAnalytics();

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setUser(nextUser);

      if (nextUser) {
        await syncProgressForUser(nextUser);
      } else {
        clearProgressState();
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      actionLoading,
      signInWithGoogle: async () => {
        if (actionLoading) {
          return;
        }

        setActionLoading(true);

        try {
          await signInWithPopup(auth, googleProvider);
        } finally {
          setActionLoading(false);
        }
      },
      signOut: async () => {
        if (actionLoading) {
          return;
        }

        setActionLoading(true);

        try {
          await firebaseSignOut(auth);
        } finally {
          setActionLoading(false);
        }
      }
    }),
    [actionLoading, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
