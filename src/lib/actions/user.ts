"use server";

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserProfile } from "../types";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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
  
    // Update Firestore user document
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      displayName,
      photoURL,
      bio,
    }, { merge: true });
  
    return { displayName, photoURL, bio };
}
