/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, initFirebase, getFirebaseAuth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;
    
    initFirebase().then(({ auth }) => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
    }).catch(err => {
      console.warn("Firebase not available, switching to Local Mode:", err);
      // Create a persistent local identity
      let localId = localStorage.getItem('local_user_id');
      if (!localId) {
        localId = `local-${Date.now()}`;
        localStorage.setItem('local_user_id', localId);
      }
      
      setUser({
        uid: localId,
        displayName: 'Guest User',
        isAnonymous: true,
      } as any);
      setLoading(false);
    });

    return () => unsubscribe && unsubscribe();
  }, []);


  const signIn = async () => {
    try {
      const auth = await getFirebaseAuth();
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed", error);
      alert(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  const logout = async () => {
    try {
      const auth = await getFirebaseAuth();
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
