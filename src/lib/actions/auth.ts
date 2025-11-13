"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export async function signUpWithCredentials(credentials: { email: string; password: string }) {
  try {
    await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signInWithCredentials(credentials: { email: string; password: string }) {
  try {
    await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
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
