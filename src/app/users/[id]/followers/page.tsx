"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getFollowList } from "@/lib/actions/user";
import type { UserProfile } from "@/lib/types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, User, ArrowLeft } from "lucide-react";

export default function FollowersPage() {
  const { id: userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [followers, setFollowers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (typeof userId !== "string") return;

    const fetchFollowers = async () => {
      setLoading(true);
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        notFound();
        return;
      }
      
      const profile = userSnap.data() as UserProfile;
      setUserProfile(profile);

      if (profile.followers && profile.followers.length > 0) {
        const followerList = await getFollowList(profile.followers);
        setFollowers(followerList);
      }
      setLoading(false);
    };

    fetchFollowers();
  }, [userId]);

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
        <Link href={`/users/${userId}`} className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to profile
        </Link>
      <Card>
        <CardHeader>
          <CardTitle>Followers</CardTitle>
          {userProfile && <p className="text-muted-foreground">Users following {userProfile.displayName}</p>}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
              ))}
            </div>
          ) : followers.length > 0 ? (
            <div className="space-y-4">
              {followers.map((follower) => (
                <Link key={follower.uid} href={`/users/${follower.uid}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={follower.photoURL ?? ''} />
                        <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{follower.displayName}</p>
                        <p className="text-sm text-muted-foreground">{follower.bio?.substring(0, 50) || 'No bio'}{follower.bio && follower.bio.length > 50 ? '...' : ''}</p>
                    </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No followers yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
