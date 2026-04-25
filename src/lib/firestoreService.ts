/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  deleteDoc,
  updateDoc 
} from 'firebase/firestore';
import { getFirebaseDb, getFirebaseAuth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

async function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = await getFirebaseAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const SketchService = {
  async saveSketch(id: string, name: string, canvasData: string) {
    const auth = await getFirebaseAuth();
    const db = await getFirebaseDb();
    const path = `sketches/${id}`;
    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const sketchRef = doc(db, 'sketches', id);
      const sketchDoc = await getDoc(sketchRef);

      if (!sketchDoc.exists()) {
        await setDoc(sketchRef, {
          name,
          ownerId: auth.currentUser.uid,
          canvasData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(sketchRef, {
          name,
          canvasData,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      await handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getSketches() {
    const auth = await getFirebaseAuth();
    const db = await getFirebaseDb();
    const path = 'sketches';
    try {
      if (!auth.currentUser) return [];
      const q = query(collection(db, 'sketches'), where('ownerId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      await handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async deleteSketch(id: string) {
    const db = await getFirebaseDb();
    const path = `sketches/${id}`;
    try {
      await deleteDoc(doc(db, 'sketches', id));
    } catch (error) {
      await handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
