"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useAuth } from "@/lib/auth/hooks";
import { db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { markNotificationsAsRead } from "@/lib/actions/notifications";
import type { Notification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Bell, Heart, MessageCircle, UserPlus, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

function getNotificationMessageAndIcon(notification: Notification) {
  switch (notification.type) {
    case 'like':
      return {
        icon: <Heart className="h-4 w-4 text-red-500" />,
        message: (
          <span>
            <span className="font-semibold">{notification.senderName}</span> liked your post:{' '}
            <span className="italic">"{notification.postTitle?.substring(0, 20)}..."</span>
          </span>
        ),
        href: `/posts/${notification.postId}`
      };
    case 'comment':
      return {
        icon: <MessageCircle className="h-4 w-4 text-blue-500" />,
        message: (
            <span>
              <span className="font-semibold">{notification.senderName}</span> commented on your post:{' '}
              <span className="italic">"{notification.commentText?.substring(0, 20)}..."</span>
            </span>
          ),
        href: `/posts/${notification.postId}`
      };
    case 'follow_request':
      return {
        icon: <UserPlus className="h-4 w-4 text-green-500" />,
        message: (
          <span>
            <span className="font-semibold">{notification.senderName}</span> requested to follow you.
          </span>
        ),
        href: '/profile'
      };
    default:
      return { icon: <Bell />, message: "New notification", href: '#' };
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    // Note: The orderBy was removed to prevent an issue where a composite index is required.
    // This fixes the infinite loading bug if the index isn't created in Firestore.
    // Notifications will be roughly ordered but not guaranteed.
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()); // Sort client-side
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setLoading(false); // Ensure loading stops on error
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenChange = async (open: boolean) => {
    if (open && unreadCount > 0 && user) {
      // Small delay to allow dropdown to open before marking as read
      setTimeout(async () => {
        try {
            await markNotificationsAsRead(user.uid);
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        }
      }, 1000);
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => {
              const { icon, message, href } = getNotificationMessageAndIcon(notification);
              return (
                <DropdownMenuItem key={notification.id} asChild className="cursor-pointer">
                  <Link href={href} className="flex items-start gap-3 p-2">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={notification.senderPhotoURL} />
                      <AvatarFallback>{notification.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="text-sm text-foreground/90">{message}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })}
                      </div>
                    </div>
                    {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1"></div>}
                  </Link>
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              You have no notifications.
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
