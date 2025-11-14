"use server";

import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc, writeBatch, collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserProfile } from "../types";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

export async function updateUserProfile(user: UserProfile, formData: FormData) {
    const displayName = formData.get("displayName") as string;
    const bio = formData.get("bio") as string;
    const imageFile = formData.get("image") as File;
    const accountType = formData.get("accountType") as 'public' | 'private';
  
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
    const updateData: Partial<UserProfile> = {
      displayName,
      photoURL,
      bio,
      accountType
    };

    await setDoc(userRef, updateData, { merge: true });

    if (accountType) {
      const postsQuery = query(collection(db, "posts"), where("authorId", "==", user.uid));
      const postsSnapshot = await getDocs(postsQuery);
      const batch = writeBatch(db);
      postsSnapshot.forEach(postDoc => {
        batch.update(postDoc.ref, { authorAccountType: accountType });
      });
      await batch.commit();
    }
    
    revalidatePath("/profile");
    revalidatePath(`/users/${user.uid}`);
    revalidatePath("/");
  
    return { displayName, photoURL, bio };
}


export async function handleFollowRequest(currentUserId: string, targetUserId: string) {
  const currentUserRef = doc(db, "users", currentUserId);
  const targetUserRef = doc(db, "users", targetUserId);

  const [currentUserSnap, targetUserSnap] = await Promise.all([getDoc(currentUserRef), getDoc(targetUserRef)]);

  if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
    throw new Error("User not found.");
  }
  
  const currentUserData = currentUserSnap.data() as UserProfile;
  const targetUserData = targetUserSnap.data() as UserProfile;

  if (targetUserData.accountType === 'public') {
    // Public account: directly follow
    const batch = writeBatch(db);
    batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
    batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
    await batch.commit();
  } else {
    // Private account: send a follow request
    await updateDoc(targetUserRef, {
      followRequests: arrayUnion(currentUserId),
    });

    // Create notification
    await createNotification({
      recipientId: targetUserId,
      senderId: currentUserId,
      senderName: currentUserData.displayName || currentUserData.email!,
      senderPhotoURL: currentUserData.photoURL || '',
      type: 'follow_request',
    });
  }
  revalidatePath(`/users/${targetUserId}`);
}

export async function handleUnfollow(currentUserId: string, targetUserId: string) {
  const currentUserRef = doc(db, "users", currentUserId);
  const targetUserRef = doc(db, "users", targetUserId);
  
  const batch = writeBatch(db);
  batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
  batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
  await batch.commit();
  
  revalidatePath(`/users/${targetUserId}`);
}

export async function cancelFollowRequest(currentUserId: string, targetUserId: string) {
  const targetUserRef = doc(db, "users", targetUserId);
  await updateDoc(targetUserRef, {
    followRequests: arrayRemove(currentUserId),
  });
  revalidatePath(`/users/${targetUserId}`);
}


export async function respondToFollowRequest(
  currentUserId: string,
  requesterId: string,
  action: 'accept' | 'decline'
) {
  const currentUserRef = doc(db, "users", currentUserId);
  const requesterRef = doc(db, "users", requesterId);

  const batch = writeBatch(db);
  
  // Always remove the request
  batch.update(currentUserRef, { followRequests: arrayRemove(requesterId) });
  
  if (action === 'accept') {
    batch.update(currentUserRef, { followers: arrayUnion(requesterId) });
    batch.update(requesterRef, { following: arrayUnion(currentUserId) });
  }
  
  await batch.commit();
  revalidatePath('/profile');
}

export async function searchUsers(searchQuery: string): Promise<UserProfile[]> {
    if (!searchQuery) {
      return [];
    }
  
    const usersRef = collection(db, "users");
    
    // Firestore doesn't support case-insensitive searches natively.
    // This is a common workaround for prefix searching.
    const q = query(
      usersRef,
      where("displayName", ">=", searchQuery),
      where("displayName", "<=", searchQuery + "\uf8ff"),
      limit(10)
    );
  
    const querySnapshot = await getDocs(q);
    
    const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
    
    // Additional client-side filtering can be done here if needed, 
    // but for simplicity, we rely on the Firestore query.
    // For a more robust search, one might store a lowercased version of displayName.

    return users;
}
