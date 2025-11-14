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
  query
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserProfile, Post } from "@/lib/types";
import { redirect } from "next/navigation";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

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

  let imageUrl = "";
  if (imageFile && imageFile.size > 0) {
    try {
      const uploadsDir = join(process.cwd(), "public", "uploads", "posts");
      await mkdir(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(uploadsDir, filename);

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      imageUrl = `/uploads/posts/${filename}`;
    } catch (error) {
      console.error("Error saving image:", error);
      throw new Error("Failed to save image. Please try again.");
    }
  }

  const postData = {
    title,
    content,
    imageUrl,
    authorId: user.uid,
    authorName: user.displayName || user.email || "Anonymous",
    authorPhotoURL: user.photoURL || "",
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
    if (imageUrl) {
      try {
        await unlink(join(process.cwd(), "public", imageUrl));
      } catch (error) {
        console.warn("Could not delete old image, it might not exist:", error);
      }
    }
    
    // Upload new image
    try {
      const uploadsDir = join(process.cwd(), "public", "uploads", "posts");
      await mkdir(uploadsDir, { recursive: true });
      const timestamp = Date.now();
      const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(uploadsDir, filename);
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/posts/${filename}`;
    } catch (error) {
      console.error("Error saving image:", error);
      throw new Error("Failed to save image. Please try again.");
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
  
    // Delete associated image file
    if (postData.imageUrl) {
      try {
        await unlink(join(process.cwd(), "public", postData.imageUrl));
      } catch (error) {
        console.warn("Could not delete image file, it may not exist:", error);
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
  
    const commentData = {
      text: commentText,
      authorId: user.uid,
      authorName: user.displayName || user.email || "Anonymous",
      authorPhotoURL: user.photoURL || "",
      createdAt: Timestamp.now(),
      postId: postId
    };
  
    await addDoc(collection(db, "posts", postId, "comments"), commentData);
  
    revalidatePath(`/posts/${postId}`);
}
