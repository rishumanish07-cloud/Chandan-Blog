"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchUsers } from "@/lib/actions/user";
import type { UserProfile } from "@/lib/types";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, User } from "lucide-react";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleSearch = async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        const users = await searchUsers(query);
        setResults(users);
        setLoading(false);
        setPopoverOpen(true);
      } else {
        setResults([]);
        setPopoverOpen(false);
      }
    };

    const debounceTimeout = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  const handleResultClick = () => {
    setPopoverOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild className="w-full">
        <div className="relative w-full max-w-sm items-center">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-9 pr-16"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
              <span className="text-sm">⌘</span>K
            </kbd>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        {loading ? (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto">
            {results.map((user) => (
              <Link
                key={user.uid}
                href={`/users/${user.uid}`}
                onClick={handleResultClick}
                className="flex items-center gap-4 p-3 hover:bg-accent"
              >
                <Avatar>
                  <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? ""} />
                  <AvatarFallback><User/></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {query.length > 1 ? "No users found." : "Type to search for users."}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
