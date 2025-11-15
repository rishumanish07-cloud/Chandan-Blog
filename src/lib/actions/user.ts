
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
    const accountTypeValue = formData.get("accountType");
    const accountType = (accountTypeValue === 'private' ? 'private' : 'public') as 'public' | 'private';
  
    console.log('🔍 Update Profile Debug:', {
      accountTypeValue,
      accountType,
      currentUserAccountType: user.accountType,
      willUpdate: accountType !== user.accountType
    });
  
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
    
    console.log('📝 Updating Firestore with accountType:', accountType);
    
    await updateDoc(userRef, {
      displayName,
      photoURL,
      bio,
      accountType
    });
    
    console.log('✅ Firestore update completed');

    if (accountType && accountType !== user.accountType) {
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
    revalidatePath("/home");
  
    return { displayName, photoURL, bio, accountType };
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
    if (!searchQuery || searchQuery.trim().length === 0) {
      return [];
    }
  
    const usersRef = collection(db, "users");
    
    // Get all users and filter client-side for better search experience
    // For production with many users, consider using Algolia or similar
    const querySnapshot = await getDocs(query(usersRef, limit(100)));
    
    const allUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);
    
    // Client-side filtering for case-insensitive search on displayName and email
    const searchLower = searchQuery.toLowerCase().trim();
    const filteredUsers = allUsers.filter(user => {
      const displayName = (user.displayName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return displayName.includes(searchLower) || email.includes(searchLower);
    });

    return filteredUsers.slice(0, 10);
}


export async function getFollowList(userIds: string[]): Promise<UserProfile[]> {
    if (!userIds || userIds.length === 0) {
        return [];
    }
    
    const usersRef = collection(db, "users");
    // Firestore 'in' query is limited to 30 items. 
    // For a production app, this would need pagination or a different approach.
    const q = query(usersRef, where('uid', 'in', userIds.slice(0, 30)));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}
