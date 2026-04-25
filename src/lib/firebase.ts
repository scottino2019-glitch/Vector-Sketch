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
  console.log("Fetching Firebase config...");
  // Try to fetch from server first (full-stack mode)
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      const config = await response.json();
      console.log("Server config check:", { hasApiKey: !!config.apiKey });
      if (config.apiKey) return config;
    } else {
      console.warn("Server config fetch failed:", response.status);
    }
  } catch (e) {
    console.error("Failed to fetch Firebase config from server", e);
  }

  // Fallback to client-side env vars
  const metaEnv = (import.meta as any).env || {};
  const config = {
    apiKey: (process.env as any).FIREBASE_API_KEY || metaEnv.VITE_FIREBASE_API_KEY,
    authDomain: (process.env as any).FIREBASE_AUTH_DOMAIN || metaEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (process.env as any).FIREBASE_PROJECT_ID || metaEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (process.env as any).FIREBASE_STORAGE_BUCKET || metaEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (process.env as any).FIREBASE_MESSAGING_SENDER_ID || metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (process.env as any).FIREBASE_APP_ID || metaEnv.VITE_FIREBASE_APP_ID,
    firestoreDatabaseId: (process.env as any).FIREBASE_FIRESTORE_DATABASE_ID || metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
  };
  
  console.log("Fallback config check:", { hasApiKey: !!config.apiKey });
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
      const missing = [];
      if (!config.apiKey) missing.push('FIREBASE_API_KEY');
      if (!config.projectId) missing.push('FIREBASE_PROJECT_ID');
      if (!config.appId) missing.push('FIREBASE_APP_ID');
      
      const errorMsg = `Firebase Configuration is incomplete. Missing: ${missing.join(', ')}. 
      Current config: ${JSON.stringify({ ...config, apiKey: config.apiKey ? '***' : null }, null, 2)}
      Please ensure these are set in Settings > Secrets.`;
      
      console.error(errorMsg);
      throw new Error(errorMsg);
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
