
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/hooks";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import type { Chat } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
      orderBy("lastMessage.createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map((doc) => doc.data() as Chat);
      setChats(chatsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats: ", error);
      // If the query fails due to missing index, fetch without ordering
      const fallbackQuery = query(collection(db, "chats"), where("members", "array-contains", user.uid));
      const unsub = onSnapshot(fallbackQuery, (snap) => {
        const chatsData = snap.docs.map((doc) => doc.data() as Chat);
        setChats(chatsData.sort((a, b) => (b.lastMessage?.createdAt?.toMillis() ?? 0) - (a.lastMessage?.createdAt?.toMillis() ?? 0)));
        setLoading(false);
      });
      return unsub;
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Conversations</CardTitle>
        <Button asChild variant="ghost" size="icon">
            <Link href="/home">
                <X className="h-5 w-5" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {chats.length > 0 ? (
          <div className="space-y-2">
            {chats.map((chat) => {
              const otherUserId = chat.members.find((m) => m !== user?.uid);
              if (!otherUserId) return null;
              const otherUserInfo = chat.memberInfo[otherUserId];
              const lastMessage = chat.lastMessage;

              return (
                <Link
                  key={chat.id}
                  href={`/messages/${chat.id}`}
                  className="block p-4 rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUserInfo?.photoURL ?? ""} />
                      <AvatarFallback>
                        {otherUserInfo?.displayName?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <p className="font-semibold">{otherUserInfo?.displayName}</p>
                      {lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage.senderId === user?.uid && "You: "}
                          {lastMessage.text}
                          <span className="text-xs"> · {formatDistanceToNow(lastMessage.createdAt.toDate(), { addSuffix: true })}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              You have no conversations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
