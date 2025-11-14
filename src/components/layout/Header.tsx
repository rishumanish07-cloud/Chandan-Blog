"use client";

import Link from "next/link";
import { BookMarked, LogOut, PlusCircle, User as UserIcon, Settings, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth/hooks";
import { signOutWithGoogle } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import { ModeToggle } from "./ModeToggle";
import { UserSearch } from "./UserSearch";
import { NotificationBell } from "./NotificationBell";

export function Header() {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    await signOutWithGoogle();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BookMarked className="h-6 w-6 text-primary" />
          <span className="font-headline text-lg font-bold">FireBlog</span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-4">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <UserSearch />
            </div>
            <nav className="flex items-center space-x-2">
              <ModeToggle />
              {loading ? (
                <Skeleton className="h-10 w-24 rounded-md" />
              ) : user ? (
                <>
                  <NotificationBell />
                  <Button asChild variant="ghost" size="icon">
                    <Link href="/messages">
                      <MessageSquare className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/posts/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Post
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? ""} />
                          <AvatarFallback>
                            <UserIcon/>
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.displayName}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/users/${user.uid}`}>
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>My Public Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </nav>
        </div>
      </div>
    </header>
  );
}
