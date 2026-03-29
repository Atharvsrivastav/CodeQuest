import "client-only";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const fallbackFirebaseConfig = {
  apiKey: "local-dev",
  authDomain: "local-dev.firebaseapp.com",
  projectId: "local-dev",
  storageBucket: "local-dev.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
  measurementId: undefined
};

const resolvedFirebaseConfig =
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
    ? firebaseConfig
    : fallbackFirebaseConfig;

export const firebaseApp = getApps().length ? getApp() : initializeApp(resolvedFirebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

let analyticsPromise: Promise<Analytics | null> | null = null;

export function getFirebaseAnalytics() {
  if (!analyticsPromise) {
    analyticsPromise = initializeAnalytics();
  }

  return analyticsPromise;
}

async function initializeAnalytics() {
  if (typeof window === "undefined" || !firebaseConfig.measurementId) {
    return null;
  }

  if (!(await isSupported())) {
    return null;
  }

  return getAnalytics(firebaseApp);
}

function getEnv(name: string) {
  return process.env[name] ?? "";
}
