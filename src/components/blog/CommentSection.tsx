"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useAuth } from "@/lib/auth/hooks";
import { addComment } from "@/lib/actions/posts";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Comment } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MessageCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CommentSectionProps = {
  postId: string;
};

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(commentsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Login required to comment."});
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(postId, user, newComment);
      setNewComment("");
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to post comment."});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="font-headline text-2xl font-bold mb-6">Comments ({comments.length})</h2>

      {user && (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex items-start space-x-4">
            <Avatar>
              <AvatarImage src={user.photoURL ?? ""} />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="mt-2">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Comment
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {loading ? (
            Array.from({length: 2}).map((_, i) => (
                <div className="flex items-start space-x-4" key={i}>
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-4">
              <Link href={`/users/${comment.authorId}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.authorPhotoURL} alt={comment.authorName} />
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/users/${comment.authorId}`} className="font-semibold text-sm hover:underline">{comment.authorName}</Link>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                  </p>
                </div>
                <p className="text-foreground/90 mt-1">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </section>
  );
}
