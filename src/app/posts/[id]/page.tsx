"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { db } from "@/lib/firebase/config";
import type { Post } from "@/lib/types";
import { useAuth } from "@/lib/auth/hooks";
import { summarizePost } from "@/ai/flows/ai-summarize-post";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Sparkles, Loader2 } from "lucide-react";
import { LikeButton } from "@/components/blog/LikeButton";
import { DislikeButton } from "@/components/blog/DislikeButton";
import { CommentSection } from "@/components/blog/CommentSection";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    if (typeof id !== "string") return;

    const postRef = doc(db, "posts", id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as Post);
      } else {
        console.error("No such document!");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleSummarize = async () => {
    if (!post) return;
    setIsSummarizing(true);
    try {
        const result = await summarizePost({ postContent: post.content });
        setSummary(result.summary);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Summarization failed",
            description: "Could not generate summary for this post."
        })
    } finally {
        setIsSummarizing(false);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/4 mb-8" />
        <Skeleton className="aspect-video w-full rounded-lg mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-20">Post not found.</div>;
  }

  const postDate = post.createdAt ? format(post.createdAt.toDate(), "MMMM d, yyyy 'at' h:mm a") : "";

  return (
    <article className="container mx-auto max-w-4xl py-8 sm:py-12 px-4">
      <header className="mb-8">
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold leading-tight tracking-tighter mb-4">
          {post.title}
        </h1>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{post.authorName}</p>
              <p>{postDate}</p>
            </div>
          </div>
        </div>
      </header>
      
      {post.imageUrl && (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-8 shadow-lg">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            data-ai-hint="blog post image"
          />
        </div>
      )}

      <div className="prose prose-lg dark:prose-invert max-w-none mb-8" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
      
      <div className="flex items-center justify-between border-t border-b py-4 my-8">
        <div className="flex items-center gap-2">
            <LikeButton postId={post.id} likes={post.likes} dislikes={post.dislikes} />
            <DislikeButton postId={post.id} dislikes={post.dislikes} likes={post.likes} />
        </div>
        <Button variant="outline" onClick={handleSummarize} disabled={isSummarizing}>
            {isSummarizing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4 text-accent" />
            )}
            Summarize
        </Button>
      </div>
      
      <CommentSection postId={post.id} />

      {summary && (
        <AlertDialog open={!!summary} onOpenChange={() => setSummary(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent"/> AI Summary</AlertDialogTitle>
                    <AlertDialogDescription className="pt-4 text-base text-foreground">
                        {summary}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction>Got it!</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </article>
  );
}
