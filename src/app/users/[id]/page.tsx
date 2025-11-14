"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { UserProfile, Post } from "@/lib/types";
import { useAuth } from "@/lib/auth/hooks";
import {
  handleFollowRequest,
  handleUnfollow,
  cancelFollowRequest,
} from "@/lib/actions/user";
import { getOrCreateChat } from "@/lib/actions/messages";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Loader2, Lock, FileText, MessageSquare } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { useToast } from "@/hooks/use-toast";

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isActionButtonLoading, setIsActionButtonLoading] = useState(false);
  const [isMessageButtonLoading, setIsMessageButtonLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const isOwnProfile = currentUser?.uid === id;
  const isFollowing = profile?.followers?.includes(currentUser?.uid ?? "") ?? false;
  const hasPendingRequest = profile?.followRequests?.includes(currentUser?.uid ?? "") ?? false;

  useEffect(() => {
    if (typeof id !== "string") return;

    const userRef = doc(db, "users", id);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const postsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", id),
      orderBy("createdAt", "desc")
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Post)
      );
      setPosts(postsData);
    });

    return () => {
      unsubscribeUser();
      unsubscribePosts();
    };
  }, [id]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    setIsActionButtonLoading(true);
    try {
      await handleFollowRequest(currentUser.uid, profile.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsActionButtonLoading(false);
    }
  };

  const handleUnfollowAction = async () => {
    if (!currentUser || !profile) return;
    setIsActionButtonLoading(true);
    try {
      await handleUnfollow(currentUser.uid, profile.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsActionButtonLoading(false);
    }
  };
  
  const handleCancelRequest = async () => {
    if (!currentUser || !profile) return;
    setIsActionButtonLoading(true);
    try {
      await cancelFollowRequest(currentUser.uid, profile.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsActionButtonLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !profile) return;
    setIsMessageButtonLoading(true);
    try {
      const chatId = await getOrCreateChat(currentUser.uid, profile.uid);
      router.push(`/messages/${chatId}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not start chat. " + error.message });
    } finally {
      setIsMessageButtonLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
            <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full" />
            <div className="space-y-4 flex-1">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-8 w-1/4" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-20">User not found.</div>;
  }

  const canSeePosts = profile.accountType === 'public' || isFollowing || isOwnProfile;

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
          <AvatarImage src={profile.photoURL ?? undefined} />
          <AvatarFallback>
            <User className="h-12 w-12 sm:h-16 sm:w-16" />
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="font-headline text-3xl sm:text-4xl font-bold">{profile.displayName}</h1>
          <p className="text-muted-foreground">{profile.bio}</p>
          <div className="flex justify-center sm:justify-start items-center gap-6 pt-2">
            <div className="text-center">
              <p className="font-bold text-lg">{posts.length}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <Link href={`/users/${id}/followers`} className="text-center hover:underline">
              <p className="font-bold text-lg">{profile.followers?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </Link>
            <Link href={`/users/${id}/following`} className="text-center hover:underline">
              <p className="font-bold text-lg">{profile.following?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </Link>
          </div>
          {!isOwnProfile && currentUser && (
            <div className="pt-4 flex flex-col sm:flex-row gap-2">
              {isFollowing ? (
                <Button variant="outline" onClick={handleUnfollowAction} disabled={isActionButtonLoading}>
                  {isActionButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Unfollow
                </Button>
              ) : hasPendingRequest ? (
                <Button variant="outline" onClick={handleCancelRequest} disabled={isActionButtonLoading}>
                  {isActionButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Requested
                </Button>
              ) : (
                <Button onClick={handleFollow} disabled={isActionButtonLoading}>
                  {isActionButtonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Follow
                </Button>
              )}
               {isFollowing && (
                <Button onClick={handleMessage} disabled={isMessageButtonLoading}>
                  {isMessageButtonLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="mr-2 h-4 w-4" />
                  )}
                  Message
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <hr />
      <div>
        <h2 className="text-2xl font-bold mb-6">Posts</h2>
        {canSeePosts ? (
          posts.length > 0 ? (
            <div className="grid gap-10 grid-cols-1 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">This user hasn't posted anything yet.</p>
            </div>
          )
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">This account is private. Follow to see their posts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
