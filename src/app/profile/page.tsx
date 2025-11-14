
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { respondToFollowRequest } from "@/lib/actions/user";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";


export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [followRequests, setFollowRequests] = useState<UserProfile[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user?.accountType === 'private' && user.followRequests && user.followRequests.length > 0) {
      const fetchRequesters = async () => {
        setLoadingRequests(true);
        const requestersData: UserProfile[] = [];
        for (const userId of user.followRequests!) {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            requestersData.push(userDoc.data() as UserProfile);
          }
        }
        setFollowRequests(requestersData);
        setLoadingRequests(false);
      };
      fetchRequesters();
    } else {
        setFollowRequests([]);
        setLoadingRequests(false);
    }
  }, [user]);
  
  const handleRequestResponse = async (requesterId: string, action: 'accept' | 'decline') => {
    if (!user) return;
    try {
        await respondToFollowRequest(user.uid, requesterId, action);
        setFollowRequests(prev => prev.filter(req => req.uid !== requesterId));
        toast({ title: `Request ${action}ed.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Something went wrong.' });
    }
  }


  if (loading || !user) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <div className="space-y-8">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <div className="flex justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
    );
  }

  return (
      <div className="container mx-auto max-w-4xl py-12 space-y-12">
        <ProfileForm user={user} />

        {user.accountType === 'private' && (
            <Card>
                <CardHeader>
                    <CardTitle>Follow Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    {loadingRequests ? (
                        <p>Loading requests...</p>
                    ) : followRequests.length > 0 ? (
                        <div className="space-y-4">
                            {followRequests.map(req => (
                                <div key={req.uid} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={req.photoURL ?? ''} />
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{req.displayName}</p>
                                            <p className="text-sm text-muted-foreground">{req.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="outline" onClick={() => handleRequestResponse(req.uid, 'accept')}><Check className="h-4 w-4 text-green-500" /></Button>
                                        <Button size="icon" variant="outline" onClick={() => handleRequestResponse(req.uid, 'decline')}><X className="h-4 w-4 text-red-500" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No pending follow requests.</p>
                    )}
                </CardContent>
            </Card>
        )}
      </div>
  );
}
