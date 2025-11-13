"use server";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";

// This is a workaround to use Firebase Auth SDK on the server with Next.js App Router
// In a real production app, you might want to use Firebase Admin SDK for session management
// or a dedicated Next.js auth library.
async function getAuthForServer() {
  // Since auth is initialized on the client, we can re-import it here.
  // This works because Server Actions maintain a connection to the client context.
  return auth;
}

export async function signUpWithCredentials(credentials: { email: string; password: string }) {
  const authInstance = await getAuthForServer();
  try {
    await createUserWithEmailAndPassword(authInstance, credentials.email, credentials.password);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signInWithCredentials(credentials: { email: string; password: string }) {
  const authInstance = await getAuthForServer();
  try {
    await signInWithEmailAndPassword(authInstance, credentials.email, credentials.password);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signInWithGoogle() {
  const authInstance = await getAuthForServer();
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function signOutWithGoogle() {
  const authInstance = await getAuthForServer();
  try {
    await signOut(authInstance);
  } catch (error: any) {
    throw new Error(error.message);
  }
}
