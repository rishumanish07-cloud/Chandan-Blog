"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/blog/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useAuth } from "@/lib/auth/hooks";

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Post));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const filteredPosts = posts.filter(post => {
    if (post.authorAccountType === 'private') {
        if (!user) return false; // Not logged in, can't see private posts
        if (post.authorId === user.uid) return true; // It's the user's own post
        const authorInFollowing = user.following?.includes(post.authorId);
        return authorInFollowing; // Can see if following the private user
    }
    return true; // Public post, always visible
  });

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-12">
        Latest Posts
      </h1>
      {loading ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[250px] w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="grid gap-10 md:grid-cols-2">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-muted-foreground">No posts yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            There are no posts to see right now.
          </p>
        </div>
      )}
    </div>
  );
}
