
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { useAuth } from "@/lib/auth/hooks";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { sendMessage, clearChatHistory } from "@/lib/actions/messages";
import type { Message, Chat } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, Send, MoreVertical, Trash2, Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "next-themes";


export default function ChatPage() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearAlert, setShowClearAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || typeof chatId !== "string") return;

    // Fetch chat details
    const chatRef = doc(db, "chats", chatId);
    const unsubscribeChat = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const chatData = docSnap.data() as Chat;
        if (!chatData.members.includes(user?.uid ?? '')) {
            toast({ variant: 'destructive', title: 'Unauthorized' });
            router.push('/messages');
            return;
        }
        setChat(chatData);
      }
      setLoading(false);
    });

    // Fetch messages
    const messagesQuery = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );
      setMessages(messagesData);
    });

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [chatId, user, router, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !chatId || !newMessage.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(chatId as string, user.uid, newMessage);
      setNewMessage("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to send message", description: error.message });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleClearChat = async () => {
    if (!chatId || typeof chatId !== "string") return;
    setIsClearing(true);
    try {
        await clearChatHistory(chatId);
        toast({ title: "Chat cleared", description: "All messages have been deleted." });
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Could not clear chat history." });
    } finally {
        setIsClearing(false);
        setShowClearAlert(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prevMessage => prevMessage + emojiData.emoji);
  };


  if (loading) {
    return <div className="flex flex-col h-full"><Skeleton className="h-full w-full" /></div>;
  }
  
  const otherUserId = chat?.members.find(m => m !== user?.uid);
  const otherUserInfo = otherUserId ? chat?.memberInfo[otherUserId] : null;

  return (
    <div className="flex flex-col h-full border rounded-lg">
      <header className="flex items-center gap-4 p-4 border-b">
        <Link href="/messages">
            <Button variant="ghost" size="icon"><ArrowLeft/></Button>
        </Link>
        <Avatar>
            <AvatarImage src={otherUserInfo?.photoURL ?? ''} />
            <AvatarFallback>{otherUserInfo?.displayName?.charAt(0) ?? '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
            <h2 className="font-semibold text-lg">{otherUserInfo?.displayName}</h2>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setShowClearAlert(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Clear Chat</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-1",
              message.senderId === user?.uid ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "flex items-end gap-2",
               message.senderId === user?.uid ? "flex-row-reverse" : "flex-row"
            )}>
              <Avatar className="h-8 w-8">
                  <AvatarImage src={message.senderPhotoURL} />
                  <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "max-w-xs md:max-w-md rounded-lg px-4 py-2",
                  message.senderId === user?.uid
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="break-words">{message.text}</p>
              </div>
            </div>
            <p className={cn("text-xs text-muted-foreground", message.senderId === user?.uid ? 'pr-10' : 'pl-10')}>
              {message.createdAt ? formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }) : ''}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" type="button">
                        <Smile className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme={theme === 'dark' ? 'dark' : 'light'} />
                </PopoverContent>
            </Popover>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </footer>
      
      <AlertDialog open={showClearAlert} onOpenChange={setShowClearAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all messages in this chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearChat} disabled={isClearing} className="bg-destructive hover:bg-destructive/90">
              {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
