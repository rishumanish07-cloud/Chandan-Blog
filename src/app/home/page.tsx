"use client";

import { useAuth } from "@/lib/auth/hooks";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-12">
        Welcome, {user?.displayName || "User"}!
      </h1>
      <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">You are logged in!</h2>
        <p className="text-muted-foreground">
          You can now create new posts, like and comment on existing ones.
        </p>
      </div>
    </div>
  );
}
