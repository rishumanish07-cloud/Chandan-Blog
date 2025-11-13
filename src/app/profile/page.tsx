
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  return <ProfileForm user={user} />;
}
