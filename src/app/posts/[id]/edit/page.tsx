"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Post } from "@/lib/types";
import { useAuth } from "@/lib/auth/hooks";
import { PostForm } from "@/components/blog/PostForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditPostPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof id !== "string") return;

    const fetchPost = async () => {
      try {
        const postRef = doc(db, "posts", id);
        const docSnap = await getDoc(postRef);
        if (docSnap.exists()) {
          const postData = { id: docSnap.id, ...docSnap.data() } as Post;
          setPost(postData);
        } else {
          setError("Post not found.");
        }
      } catch (err) {
        setError("Failed to fetch post.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!loading && post && user && post.authorId !== user.uid) {
        setError("You are not authorized to edit this post.");
        setTimeout(() => router.push(`/posts/${id}`), 2000);
    }
  }, [loading, post, user, id, router]);


  const pageLoading = loading || authLoading;

  if (pageLoading) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <div className="space-y-8">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">{error}</div>;
  }

  if (!post) {
    return null;
  }

  return <PostForm post={post} />;
}
