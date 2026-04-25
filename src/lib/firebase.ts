/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
const googleProvider = new GoogleAuthProvider();

async function getFirebaseConfig() {
  console.log("Detecting Firebase configuration...");
  
  // 1. Try to get from Vite's built-in env (VITE_ prefixed)
  const env = import.meta.env;
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY || (process.env as any).FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (process.env as any).FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID || (process.env as any).FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (process.env as any).FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (process.env as any).FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID || (process.env as any).FIREBASE_APP_ID,
    firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (process.env as any).FIREBASE_FIRESTORE_DATABASE_ID,
  };

  if (config.apiKey && config.projectId) {
    console.log("Firebase config found in client environment.");
    return config;
  }

  // 2. Try to fetch from server as fallback (full-stack mode)
  try {
    console.log("Client environment incomplete, attempting server fetch...");
    const response = await fetch('/api/config');
    if (response.ok) {
      const serverConfig = await response.json();
      if (serverConfig.apiKey && serverConfig.projectId) {
        console.log("Firebase config received from server.");
        return serverConfig;
      }
    }
  } catch (e) {
    console.warn("Server config fetch failed or unavailable.");
  }

  // 3. Last resort fallback (checking for potentially incorrectly populated process.env)
  console.log("Searching all possible environment sources...");
  return config;
}

let initPromise: Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }> | null = null;

export async function initFirebase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (getApps().length > 0) {
      app = getApp();
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);
      return { app, auth: authInstance, db: dbInstance };
    }

    const config = await getFirebaseConfig();
    
    if (!config.apiKey || !config.projectId) {
      throw new Error('Config missing');
    }

    app = initializeApp(config);

    authInstance = getAuth(app);
    dbInstance = getFirestore(app, config.firestoreDatabaseId);

    if (process.env.NODE_ENV !== 'production') {
      testConnection();
    }

    return { app, auth: authInstance, db: dbInstance };
  })();

  return initPromise;
}

// Safer exports
export const getFirebaseAuth = async () => {
  const { auth } = await initFirebase();
  return auth;
};

export const getFirebaseDb = async () => {
  const { db } = await initFirebase();
  return db;
};

// Original exports for compatibility, but they might be undefined initially
export { authInstance as auth, dbInstance as db, googleProvider };

async function testConnection() {
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
