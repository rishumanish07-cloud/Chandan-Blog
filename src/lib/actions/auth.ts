"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { UserProfile } from "../types";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

export async function updateUserProfile(user: UserProfile, formData: FormData) {
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const imageFile = formData.get("image") as File;
  
    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }
  
    let photoURL = user.photoURL || "";
  
    // Handle image upload
    if (imageFile && imageFile.size > 0) {
      try {
        const uploadsDir = join(process.cwd(), "public", "uploads", "avatars");
        await mkdir(uploadsDir, { recursive: true });
        
        const timestamp = Date.now();
        const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${user.uid}_${timestamp}_${sanitizedName}`;
        const filepath = join(uploadsDir, filename);
  
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);
  
        photoURL = `/uploads/avatars/${filename}`;
      } catch (error) {
        console.error("Error saving profile image:", error);
        throw new Error("Failed to save profile image.");
      }
    }
  
    // Update Firebase Auth profile
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName,
        photoURL,
      });
    } else {
        throw new Error("No authenticated user found.")
    }
  
    // Update Firestore user document
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      displayName,
      photoURL,
      bio,
    }, { merge: true });
  
    return { displayName, photoURL, bio };
}
