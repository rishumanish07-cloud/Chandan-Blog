"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

async function createOrUpdateUserInFirestore(user: { uid: string; email: string | null; displayName?: string | null; photoURL?: string | null; }) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
  
    if (!userSnap.exists()) {
      // Create a new document if it doesn't exist
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        photoURL: user.photoURL || "",
        bio: "",
      });
    }
}

export async function signUpWithCredentials(credentials: { email: string; password: string }) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    await createOrUpdateUserInFirestore(userCredential.user);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signInWithCredentials(credentials: { email: string; password: string }) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    await createOrUpdateUserInFirestore(userCredential.user);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    await createOrUpdateUserInFirestore(userCredential.user);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signOutWithGoogle() {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
}
