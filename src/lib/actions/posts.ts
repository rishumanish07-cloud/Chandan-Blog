"use server";

import { revalidatePath } from "next/cache";
import { 
  addDoc, 
  collection, 
  doc, 
  Timestamp, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  writeBatch,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserProfile } from "@/lib/types";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { createNotification } from "./notifications";
import { BLOB_TOKEN } from "@/lib/blob/config";

export async function createPost(user: UserProfile, formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const imageFile = formData.get("image") as File;

  if (!title || !content) {
    throw new Error("Title and content are required.");
  }
  
  if (!user) {
    throw new Error("You must be logged in to create a post.");
  }
  
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data() as UserProfile;


  let imageUrl = "";
  if (imageFile && imageFile.size > 0) {
    try {
      const timestamp = Date.now();
      const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `posts/${user.uid}/${timestamp}_${sanitizedName}`;

      const blob = await put(filename, imageFile, {
        access: 'public',
        token: BLOB_TOKEN,
      });

      imageUrl = blob.url;
    } catch (error) {
      console.error("Error uploading image to Vercel Blob:", error);
      throw new Error("Failed to upload image. Please try again.");
    }
  }

  const postData = {
    title,
    content,
    imageUrl,
    authorId: user.uid,
    authorName: userData.displayName || userData.email || "Anonymous",
    authorPhotoURL: userData.photoURL || "",
    authorAccountType: userData.accountType || "public",
    createdAt: Timestamp.now(),
    likes: [],
    dislikes: [],
  };

  const docRef = await addDoc(collection(db, "posts"), postData);

  revalidatePath("/");
  redirect(`/posts/${docRef.id}`);
}

export async function updatePost(postId: string, userId: string, formData: FormData) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    throw new Error("Post not found.");
  }

  const postData = postSnap.data();

  if (postData.authorId !== userId) {
    throw new Error("You are not authorized to edit this post.");
  }
  
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const imageFile = formData.get("image") as File;
  let imageUrl = postData.imageUrl;

  if (imageFile && imageFile.size > 0) {
    // Delete old image if it exists
    if (imageUrl && imageUrl.includes('vercel-storage.com')) {
      try {
        await del(imageUrl, { token: BLOB_TOKEN });
      } catch (error) {
        console.warn("Could not delete old image from Vercel Blob:", error);
      }
    }
    
    // Upload new image
    try {
      const timestamp = Date.now();
      const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `posts/${userId}/${timestamp}_${sanitizedName}`;

      const blob = await put(filename, imageFile, {
        access: 'public',
        token: BLOB_TOKEN,
      });

      imageUrl = blob.url;
    } catch (error) {
      console.error("Error uploading image to Vercel Blob:", error);
      throw new Error("Failed to upload image. Please try again.");
    }
  }

  await updateDoc(postRef, {
    title,
    content,
    imageUrl,
  });

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/");
  redirect(`/posts/${postId}`);
}

export async function deletePost(postId: string, userId: string) {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
  
    if (!postSnap.exists()) {
      throw new Error("Post not found.");
    }
  
    const postData = postSnap.data();
    if (postData.authorId !== userId) {
      throw new Error("You are not authorized to delete this post.");
    }
  
    // Delete associated image file from Vercel Blob
    if (postData.imageUrl && postData.imageUrl.includes('vercel-storage.com')) {
      try {
        await del(postData.imageUrl, { token: BLOB_TOKEN });
      } catch (error) {
        console.warn("Could not delete image from Vercel Blob:", error);
      }
    }
  
    // Delete comments subcollection
    const commentsRef = collection(db, "posts", postId, "comments");
    const commentsSnap = await getDocs(commentsRef);
    const batch = writeBatch(db);
    commentsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  
    // Delete the post document
    await deleteDoc(postRef);
  
    revalidatePath("/");
}


export async function toggleLike(postId: string, userId: string) {
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
        throw new Error("Post not found");
    }

    const postData = postSnap.data();
    const likes = postData.likes || [];
    const dislikes = postData.dislikes || [];
    
    const isLiked = likes.includes(userId);
    const isDisliked = dislikes.includes(userId);

    if (isLiked) {
        await updateDoc(postRef, {
            likes: arrayRemove(userId),
        });
    } else {
        const updates: any = {
            likes: arrayUnion(userId),
        };
        if (isDisliked) {
            updates.dislikes = arrayRemove(userId);
        }
        await updateDoc(postRef, updates);
        
        // Create notification if the user is not the post author
        if (postData.authorId !== userId) {
          const userSnap = await getDoc(doc(db, 'users', userId));
          if(userSnap.exists()){
            const sender = userSnap.data() as UserProfile;
            await createNotification({
              recipientId: postData.authorId,
              senderId: sender.uid,
              senderName: sender.displayName || sender.email!,
              senderPhotoURL: sender.photoURL || '',
              type: 'like',
              postId: postId,
              postTitle: postData.title,
            });
          }
        }
    }

    revalidatePath(`/posts/${postId}`);
    revalidatePath(`/`);
}

export async function toggleDislike(postId: string, userId: string) {
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
        throw new Error("Post not found");
    }

    const postData = postSnap.data();
    const likes = postData.likes || [];
    const dislikes = postData.dislikes || [];

    const isDisliked = dislikes.includes(userId);
    const isLiked = likes.includes(userId);

    if (isDisliked) {
        await updateDoc(postRef, {
            dislikes: arrayRemove(userId),
        });
    } else {
        const updates: any = {
            dislikes: arrayUnion(userId),
        };
        if (isLiked) {
            updates.likes = arrayRemove(userId);
        }
        await updateDoc(postRef, updates);
    }

    revalidatePath(`/posts/${postId}`);
    revalidatePath(`/`);
}


export async function addComment(postId: string, user: UserProfile, commentText: string) {
    if (!user) {
      throw new Error("You must be logged in to comment.");
    }
    if (!commentText.trim()) {
      throw new Error("Comment cannot be empty.");
    }
    
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
        throw new Error("Post not found");
    }
    const postData = postSnap.data();
    
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile;
  
    const commentData = {
      text: commentText,
      authorId: user.uid,
      authorName: userData.displayName || userData.email || "Anonymous",
      authorPhotoURL: userData.photoURL || "",
      createdAt: Timestamp.now(),
      postId: postId
    };
  
    await addDoc(collection(db, "posts", postId, "comments"), commentData);
  
    if (postData.authorId !== user.uid) {
        await createNotification({
          recipientId: postData.authorId,
          senderId: user.uid,
          senderName: userData.displayName || userData.email!,
          senderPhotoURL: userData.photoURL || '',
          type: 'comment',
          postId: postId,
          postTitle: postData.title,
          commentText: commentText,
        });
    }
  
    revalidatePath(`/posts/${postId}`);
}
