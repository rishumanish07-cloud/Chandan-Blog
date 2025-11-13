"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { 
  addDoc, 
  collection, 
  doc, 
  Timestamp, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/config";
import type { UserProfile } from "@/lib/types";

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
    const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(storageRef);
  }

  const postData = {
    title,
    content,
    imageUrl,
    authorId: user.uid,
    authorName: user.displayName || "Anonymous",
    authorPhotoURL: user.photoURL || "",
    createdAt: Timestamp.now(),
    likes: [],
  };

  const docRef = await addDoc(collection(db, "posts"), postData);

  revalidatePath("/");
  redirect(`/posts/${docRef.id}`);
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
    const isLiked = postData.likes.includes(userId);

    if (isLiked) {
        await updateDoc(postRef, {
            likes: arrayRemove(userId),
        });
    } else {
        await updateDoc(postRef, {
            likes: arrayUnion(userId),
        });
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
      authorName: user.displayName || "Anonymous",
      authorPhotoURL: user.photoURL || "",
      createdAt: Timestamp.now(),
      postId: postId
    };
  
    await addDoc(collection(db, "posts", postId, "comments"), commentData);
  
    revalidatePath(`/posts/${postId}`);
}
